from mongo.dao_setup import db_client, JOBS
from bson import ObjectId
from datetime import datetime, timezone

class JobsDAO:
    def __init__(self):
        self.collection = db_client.get_collection(JOBS)

    async def add_job(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_jobs(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_job(self, job_id: str) -> dict | None:
        return await self.collection.find_one({"_id": ObjectId(job_id)})

    async def update_job(self, job_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(job_id)}, {"$set": data})
        return updated.matched_count
    
    async def find_job_by_dedupe_key(self, uuid: str, dedupe_key: str) -> dict | None:
        return await self.collection.find_one({
            "uuid": uuid,
            "dedupe_key": dedupe_key
        })

    async def add_platform(self, job_id: str, platform: str) -> int:
        now = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$addToSet": {"platforms": platform},
                "$set": {"date_updated": now}
            }
        )
        return result.matched_count

    async def set_status(self, job_id: str, status: str, at: str | None = None) -> int:
        now = datetime.now(timezone.utc)
        at_value = at or now.isoformat()
        result = await self.collection.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": status,
                    "date_updated": now
                },
                "$push": {
                    "status_history": [status, at_value]
                }
            }
        )
        return result.matched_count

    async def bulk_apply(self, user_uuid: str, package_id: str, job_ids: list[str]) -> int:
        """
        Apply a package to many jobs at once.
        """
        now = datetime.now(timezone.utc)

        result = await self.collection.update_many(
            {
                "_id": {"$in": [ObjectId(j) for j in job_ids]},
                "uuid": user_uuid
            },
            {
                "$set": {
                    "application_package_id": package_id,
                    "submitted": True,
                    "submitted_at": now,
                    "status": "Applied",
                    "date_updated": now,
                    "response_tracking.submitted_at": now  # UC-121: Track submission time
                },
                "$push": {
                    "status_history": ["Applied", now]
                }
            }
        )

        return result.modified_count


    async def delete_job(self, job_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(job_id)})
        return result.deleted_count

    async def add_offer_to_job(self, job_id: str, offer_id: str) -> bool:
        """Add an offer ID to the job's offers array (UC-083 salary negotiation)"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(job_id)},
                {"$addToSet": {"offers": offer_id}, "$set": {"date_updated": datetime.now(timezone.utc)}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error adding offer to job: {e}")
            return False

    async def get_job_offers(self, job_id: str) -> list:
        """Get all offer IDs for a job"""
        try:
            job = await self.collection.find_one({"_id": ObjectId(job_id)})
            return job.get("offers", []) if job else []
        except Exception:
            return []
    
    

jobs_dao = JobsDAO()