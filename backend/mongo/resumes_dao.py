from mongo.dao_setup import db_client, RESUMES
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import secrets

class ResumeDAO:
    def __init__(self):
        self.collection = db_client.get_collection(RESUMES)
        self.versions_collection = db_client.get_collection("resume_versions")
        self.feedback_collection = db_client.get_collection("resume_feedback")
        self.shares_collection = db_client.get_collection("resume_shares")

    async def add_resume(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_resumes(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_resume(self, resume_id: str) -> dict | None:
        return await self.collection.find_one({"_id": ObjectId(resume_id)})

    async def update_resume(self, resume_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(resume_id)}, {"$set": data})
        return updated.matched_count

    async def delete_resume(self, resume_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(resume_id)})
        return result.deleted_count

    # SET DEFAULT RESUME
    async def set_default_resume(self, resume_id: str, uuid: str) -> int:
        # Set all other resumes for this user to default_resume = False
        await self.collection.update_many(
            {"uuid": uuid},
            {"$set": {"default_resume": False}}
        )
        # Set this resume to default_resume = True
        updated = await self.collection.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {"default_resume": True, "date_updated": datetime.now(timezone.utc)}}
        )
        return updated.matched_count

    # RESUME VERSIONS
    async def create_resume_version(self, resume_id: str, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["resume_id"] = resume_id
        data["date_created"] = time
        result = await self.versions_collection.insert_one(data)
        return str(result.inserted_id)

    async def get_resume_versions(self, resume_id: str) -> list[dict]:
        cursor = self.versions_collection.find({"resume_id": resume_id}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def restore_resume_version(self, resume_id: str, version_id: str) -> int:
        # Get the version data
        version = await self.versions_collection.find_one({"_id": ObjectId(version_id)})
        if not version:
            return 0

        # Get resume_data from version and prepare update fields
        resume_data = version.get("resume_data", {})

        # Build update dict - only include fields from resume_data (not _id)
        update_fields = {}
        for key, value in resume_data.items():
            if key != "_id":  # Don't try to update the _id field
                update_fields[key] = value

        # Add date_updated
        update_fields["date_updated"] = datetime.now(timezone.utc)

        # Update the resume
        updated = await self.collection.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": update_fields}
        )
        return updated.matched_count

    async def delete_resume_version(self, version_id: str) -> int:
        result = await self.versions_collection.delete_one({"_id": ObjectId(version_id)})
        return result.deleted_count

    async def rename_resume_version(self, version_id: str, name: str, description: str = None, job_linked: str = None) -> int:
        """Rename a resume version and optionally update description and job link"""
        update_data = {"name": name}
        if description is not None:
            update_data["description"] = description
        if job_linked is not None:
            update_data["job_linked"] = job_linked
        updated = await self.versions_collection.update_one(
            {"_id": ObjectId(version_id)},
            {"$set": update_data}
        )
        return updated.matched_count

    # RESUME FEEDBACK
    async def add_resume_feedback(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        result = await self.feedback_collection.insert_one(data)
        return str(result.inserted_id)

    async def get_resume_feedback(self, resume_id: str) -> list[dict]:
        cursor = self.feedback_collection.find({"resume_id": resume_id}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def update_resume_feedback(self, feedback_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.feedback_collection.update_one(
            {"_id": ObjectId(feedback_id)},
            {"$set": data}
        )
        return updated.matched_count

    async def delete_resume_feedback(self, feedback_id: str) -> int:
        result = await self.feedback_collection.delete_one({"_id": ObjectId(feedback_id)})
        return result.deleted_count

    # RESUME SHARING
    async def create_share_link(self, resume_id: str, data: dict) -> dict:
        time = datetime.now(timezone.utc)
        expiration_days = data.get("expiration_days", 30)
        expires_at = time + timedelta(days=expiration_days)

        share_data = {
            "resume_id": resume_id,
            "token": secrets.token_urlsafe(32),
            "can_comment": data.get("can_comment", True),
            "can_download": data.get("can_download", True),
            "created_at": time,
            "expires_at": expires_at,
            "active": True
        }

        # Delete old share link if exists
        await self.shares_collection.delete_one({"resume_id": resume_id})

        result = await self.shares_collection.insert_one(share_data)
        share_data["_id"] = str(result.inserted_id)
        return share_data

    async def get_share_link(self, resume_id: str) -> dict | None:
        share = await self.shares_collection.find_one({"resume_id": resume_id, "active": True})
        if share:
            share["_id"] = str(share["_id"])
        return share

    async def revoke_share_link(self, resume_id: str) -> int:
        updated = await self.shares_collection.update_one(
            {"resume_id": resume_id},
            {"$set": {"active": False}}
        )
        return updated.matched_count

    async def get_resume_by_share_token(self, token: str) -> dict | None:
        try:
            # Get the share link
            share = await self.shares_collection.find_one({"token": token, "active": True})
            if not share:
                return None

            # Check if expired
            expires_at = share.get("expires_at")
            if expires_at:
                now = datetime.now(timezone.utc)
                # Ensure both datetimes are timezone-aware for comparison
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at < now:
                    return None

            # Get the resume
            resume_id = share.get("resume_id")
            if not resume_id:
                return None

            # Try to get the resume
            try:
                resume = await self.collection.find_one({"_id": ObjectId(resume_id)})
            except Exception:
                # If ObjectId conversion fails, try as a string match
                resume = await self.collection.find_one({"_id": resume_id})

            if resume:
                resume["_id"] = str(resume["_id"])
                resume["share_settings"] = {
                    "can_comment": share.get("can_comment", True),
                    "can_download": share.get("can_download", True)
                }
            return resume
        except Exception as e:
            print(f"Error in get_resume_by_share_token: {e}")
            return None

resumes_dao = ResumeDAO()