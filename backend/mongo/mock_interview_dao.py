import uuid
from datetime import datetime, timezone
from bson import ObjectId
from mongo.dao_setup import db_client

class MockInterviewSessionDAO:
    """Data Access Object for mock interview sessions"""

    def __init__(self):
        self.db = db_client
        self.collection = db_client["mock_interview_sessions"]

    async def create_session(self, data: dict) -> str:
        """Create a new mock interview session"""
        data["uuid"] = str(uuid.uuid4())
        data["date_created"] = datetime.now(timezone.utc)
        data["date_updated"] = datetime.now(timezone.utc)
        data["status"] = data.get("status", "in_progress")
        data["current_question_index"] = data.get("current_question_index", 0)
        data["responses"] = data.get("responses", [])

        result = await self.collection.insert_one(data)
        return data["uuid"]

    async def get_session(self, session_uuid: str) -> dict:
        """Get a specific mock interview session by UUID"""
        doc = await self.collection.find_one({"uuid": session_uuid})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def get_user_sessions(self, user_uuid: str) -> list[dict]:
        """Get all mock interview sessions for a user"""
        cursor = self.collection.find({"user_uuid": user_uuid}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_user_sessions_by_role(self, user_uuid: str, role_uuid: str) -> list[dict]:
        """Get all mock interview sessions for a user for a specific role"""
        cursor = self.collection.find({
            "user_uuid": user_uuid,
            "role_uuid": role_uuid
        }).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def update_session(self, session_uuid: str, data: dict) -> int:
        """Update a mock interview session"""
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"uuid": session_uuid},
            {"$set": data}
        )
        return result.matched_count

    async def add_response(self, session_uuid: str, response: dict) -> int:
        """Add a response to the responses array in a session"""
        result = await self.collection.update_one(
            {"uuid": session_uuid},
            {
                "$push": {"responses": response},
                "$set": {"date_updated": datetime.now(timezone.utc)}
            }
        )
        return result.matched_count

    async def update_response(self, session_uuid: str, question_index: int, response: dict) -> int:
        """Update a response at a specific question index"""
        result = await self.collection.update_one(
            {"uuid": session_uuid},
            {
                "$set": {
                    f"responses.{question_index}": response,
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count

    async def set_current_question_index(self, session_uuid: str, index: int) -> int:
        """Update the current question index"""
        result = await self.collection.update_one(
            {"uuid": session_uuid},
            {
                "$set": {
                    "current_question_index": index,
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count

    async def complete_session(self, session_uuid: str, performance_summary: dict = None) -> int:
        """Mark a session as completed"""
        update_data = {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
            "date_updated": datetime.now(timezone.utc)
        }

        if performance_summary:
            update_data["performance_summary"] = performance_summary

        result = await self.collection.update_one(
            {"uuid": session_uuid},
            {"$set": update_data}
        )
        return result.matched_count

    async def abandon_session(self, session_uuid: str) -> int:
        """Mark a session as abandoned"""
        result = await self.collection.update_one(
            {"uuid": session_uuid},
            {
                "$set": {
                    "status": "abandoned",
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count

    async def delete_session(self, session_uuid: str) -> int:
        """Delete a mock interview session"""
        result = await self.collection.delete_one({"uuid": session_uuid})
        return result.deleted_count
