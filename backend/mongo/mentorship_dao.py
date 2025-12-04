from mongo.dao_setup import db_client, MENTORSHIP_RELATIONSHIPS
from bson import ObjectId
from datetime import datetime, timezone

class MentorshipDAO:
    def __init__(self):
        self.collection = db_client.get_collection(MENTORSHIP_RELATIONSHIPS)
    
    async def add_mentorship(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_mentorships(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_mentorship(self, mentorship_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(mentorship_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_mentorship(self, mentorship_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(mentorship_id)}, {"$set": data})
        return updated.matched_count

    async def delete_mentorship(self, mentorship_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(mentorship_id)})
        return result.deleted_count

    async def get_mentors(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "relationship_type": "mentor"})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_mentees(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "relationship_type": "mentee"})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_active_mentorships(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "status": "active"})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

mentorship_dao = MentorshipDAO()
