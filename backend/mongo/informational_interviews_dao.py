from mongo.dao_setup import db_client, INFORMATIONAL_INTERVIEWS
from bson import ObjectId
from datetime import datetime, timezone

class InformationalInterviewDAO:
    def __init__(self):
        self.collection = db_client.get_collection(INFORMATIONAL_INTERVIEWS)
    
    async def add_interview(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_interviews(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid}).sort("scheduled_date", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_interview(self, interview_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(interview_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_interview(self, interview_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(interview_id)}, {"$set": data})
        return updated.matched_count

    async def delete_interview(self, interview_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(interview_id)})
        return result.deleted_count

    async def get_interviews_by_status(self, uuid: str, status: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "status": status}).sort("scheduled_date", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_upcoming_interviews(self, uuid: str) -> list[dict]:
        current_date = datetime.now(timezone.utc).isoformat()
        cursor = self.collection.find({
            "uuid": uuid,
            "scheduled_date": {"$gte": current_date},
            "status": {"$in": ["scheduled", "confirmed"]}
        }).sort("scheduled_date", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_completed_interviews(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "status": "completed"}).sort("scheduled_date", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

informational_interviews_dao = InformationalInterviewDAO()
