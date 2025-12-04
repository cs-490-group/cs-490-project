from mongo.dao_setup import db_client
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

class AdvisorsDAO:
    def __init__(self):

        self.collection = db_client.get_collection("advisor_engagements")

    async def create_engagement(self, data: dict) -> str:
        data["created_at"] = datetime.utcnow()
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_user_engagements(self, user_uuid: str) -> List[dict]:
        cursor = self.collection.find({"user_uuid": user_uuid})
        return [doc async for doc in cursor]

    async def get_engagement_by_id(self, engagement_id: str) -> Optional[dict]:
        return await self.collection.find_one({"_id": ObjectId(engagement_id)})

    # Sessions
    async def add_session(self, engagement_id: str, session: dict) -> bool:
        result = await self.collection.update_one(
            {"_id": ObjectId(engagement_id)},
            {"$push": {"sessions": session}}
        )
        return result.modified_count > 0

    # Tasks
    async def add_task(self, engagement_id: str, task: dict) -> bool:
        result = await self.collection.update_one(
            {"_id": ObjectId(engagement_id)},
            {"$push": {"tasks": task}}
        )
        return result.modified_count

    async def update_task_status(self, engagement_id: str, task_id: str, status: str) -> bool:
        result = await self.collection.update_one(
            {"_id": ObjectId(engagement_id), "tasks.id": task_id},
            {"$set": {"tasks.$.status": status}}
        )
        return result.modified_count
    
    #
    async def delete_engagement(self, engagement_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(engagement_id)})
        return result.deleted_count > 0

advisors_dao = AdvisorsDAO()