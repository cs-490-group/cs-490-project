import uuid
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from motor.motor_asyncio import AsyncIOMotorDatabase

class QuestionRoleDAO:
    def __init__(self, db_client: AsyncIOMotorDatabase):
        self.db = db_client


class QuestionIndustryDAO:
    """Data Access Object for question industries"""

    def __init__(self, db_client: AsyncDatabase):
        self.db = db_client
        self.collection = db_client["question_industries"]

    async def add_industry(self, data: dict) -> str:
        """Add a new industry"""
        data["date_created"] = datetime.now(timezone.utc)
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_industries(self) -> list[dict]:
        """Get all industries"""
        cursor = self.collection.find({})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_industry(self, industry_uuid: str) -> dict:
        """Get a specific industry by UUID"""
        doc = await self.collection.find_one({"uuid": industry_uuid})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def update_industry(self, industry_uuid: str, data: dict) -> int:
        """Update an industry"""
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"uuid": industry_uuid},
            {"$set": data}
        )
        return result.matched_count

    async def add_role_to_industry(self, industry_uuid: str, role_uuid: str) -> int:
        """Add a role UUID to an industry's role list"""
        result = await self.collection.update_one(
            {"uuid": industry_uuid},
            {"$addToSet": {"roles": role_uuid}, "$set": {"date_updated": datetime.now(timezone.utc)}}
        )
        return result.matched_count


class QuestionRoleDAO:
    """Data Access Object for question roles"""

    def __init__(self, db_client: AsyncIOMotorDatabase):
        self.db = db_client
        self.collection = db_client["question_roles"]

    async def add_role(self, data: dict) -> str:
        """Add a new role"""
        data["date_created"] = datetime.now(timezone.utc)
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_roles(self) -> list[dict]:
        """Get all roles"""
        cursor = self.collection.find({})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_role(self, role_uuid: str) -> dict:
        """Get a specific role by UUID"""
        doc = await self.collection.find_one({"uuid": role_uuid})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def get_roles_by_industry(self, industry_uuid: str) -> list[dict]:
        """Get all roles for an industry"""
        cursor = self.collection.find({"industry_uuid": industry_uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def update_role(self, role_uuid: str, data: dict) -> int:
        """Update a role"""
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"uuid": role_uuid},
            {"$set": data}
        )
        return result.matched_count

    async def add_question_to_role(self, role_uuid: str, question_uuid: str) -> int:
        """Add a question UUID to a role's question list"""
        result = await self.collection.update_one(
            {"uuid": role_uuid},
            {"$addToSet": {"question_ids": question_uuid}, "$set": {"date_updated": datetime.now(timezone.utc)}}
        )
        return result.matched_count


class QuestionDAO:
    """Data Access Object for questions"""

    def __init__(self, db_client: AsyncIOMotorDatabase):
        self.db = db_client
        self.collection = db_client["questions"]

    async def add_question(self, data: dict) -> str:
        """Add a new question"""
        data["date_created"] = datetime.now(timezone.utc)
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_question(self, question_uuid: str) -> dict:
        """Get a specific question by UUID"""
        doc = await self.collection.find_one({"uuid": question_uuid})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def get_questions_by_role(self, role_uuid: str) -> list[dict]:
        """Get all questions for a role"""
        cursor = self.collection.find({"role_uuid": role_uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_questions_by_category(self, role_uuid: str, category: str) -> list[dict]:
        """Get questions by role and category"""
        cursor = self.collection.find({"role_uuid": role_uuid, "category": category})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_questions_by_difficulty(self, role_uuid: str, difficulty: str) -> list[dict]:
        """Get questions by role and difficulty"""
        cursor = self.collection.find({"role_uuid": role_uuid, "difficulty": difficulty})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results


class UserPracticedQuestionDAO:
    """Data Access Object for user practiced questions"""

    def __init__(self, db_client: AsyncIOMotorDatabase):
        self.db = db_client
        self.collection = db_client["user_practiced_questions"]

    async def save_response(self, data: dict) -> str:
        """Save or update a user's response to a question"""
        data["date_updated"] = datetime.now(timezone.utc)

        # Check if this response already exists
        existing = await self.collection.find_one({
            "user_uuid": data["user_uuid"],
            "question_uuid": data["question_uuid"]
        })

        if existing:
            # Update existing response
            result = await self.collection.update_one(
                {"_id": existing["_id"]},
                {"$set": data, "$inc": {"practice_count": 1}}
            )
            return str(existing["_id"])
        else:
            # Create new response
            data["date_created"] = datetime.now(timezone.utc)
            data["practice_count"] = 1
            result = await self.collection.insert_one(data)
            return str(result.inserted_id)

    async def get_response(self, user_uuid: str, question_uuid: str) -> dict:
        """Get a user's response to a specific question"""
        doc = await self.collection.find_one({
            "user_uuid": user_uuid,
            "question_uuid": question_uuid
        })
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def get_user_practiced_questions(self, user_uuid: str) -> list[dict]:
        """Get all questions a user has practiced with question and role details"""
        # Use aggregation pipeline to join with questions and roles collections
        pipeline = [
            # Match documents for this user
            {"$match": {"user_uuid": user_uuid}},
            # Join with questions collection
            {
                "$lookup": {
                    "from": "questions",
                    "localField": "question_uuid",
                    "foreignField": "uuid",
                    "as": "question_details"
                }
            },
            # Unwind the question details array
            {"$unwind": {"path": "$question_details", "preserveNullAndEmptyArrays": True}},
            # Join with roles collection to get role name
            {
                "$lookup": {
                    "from": "question_roles",
                    "localField": "question_details.role_uuid",
                    "foreignField": "uuid",
                    "as": "role_details"
                }
            },
            # Unwind the role details array
            {"$unwind": {"path": "$role_details", "preserveNullAndEmptyArrays": True}},
            # Project the fields we need
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "user_uuid": 1,
                    "question_uuid": 1,
                    "response_html": 1,
                    "is_marked_practiced": 1,
                    "practice_count": 1,
                    "last_practiced": 1,
                    "date_created": 1,
                    "date_updated": 1,
                    "prompt": {"$ifNull": ["$question_details.prompt", "Unknown"]},
                    "category": {"$ifNull": ["$question_details.category", "Unknown"]},
                    "difficulty": {"$ifNull": ["$question_details.difficulty", "Unknown"]},
                    "role_name": {"$ifNull": ["$role_details.name", "Unknown"]},
                }
            }
        ]

        results = []
        async for doc in await self.collection.aggregate(pipeline):
            results.append(doc)
        return results

    async def get_user_practiced_questions_by_role(self, user_uuid: str, role_uuid: str) -> list[dict]:
        """Get all practiced questions for a user in a specific role"""
        # First get all questions in the role
        question_cursor = self.db["questions"].find({"role_uuid": role_uuid})
        question_uuids = []
        async for doc in question_cursor:
            question_uuids.append(doc["uuid"])

        # Then get user's responses to those questions
        cursor = self.collection.find({
            "user_uuid": user_uuid,
            "question_uuid": {"$in": question_uuids}
        })
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def mark_as_practiced(self, user_uuid: str, question_uuid: str) -> int:
        """Mark a question as practiced - creates response if it doesn't exist"""
        # First try to update existing response
        result = await self.collection.update_one(
            {
                "user_uuid": user_uuid,
                "question_uuid": question_uuid
            },
            {
                "$set": {
                    "is_marked_practiced": True,
                    "last_practiced": datetime.now(timezone.utc),
                    "date_updated": datetime.now(timezone.utc)
                },
                "$inc": {"practice_count": 1}
            }
        )
        
        # If no existing response, create one
        if result.matched_count == 0:
            await self.collection.insert_one({
                "uuid": str(uuid.uuid4()),
                "user_uuid": user_uuid,
                "question_uuid": question_uuid,
                "response_html": "",
                "is_marked_practiced": True,
                "last_practiced": datetime.now(timezone.utc),
                "practice_count": 1,
                "date_created": datetime.now(timezone.utc),
                "date_updated": datetime.now(timezone.utc)
            })
            return 1
        
        return result.matched_count

















    async def delete_response(self, user_uuid: str, question_uuid: str) -> int:
        """Delete a user's response"""
        result = await self.collection.delete_one({
            "user_uuid": user_uuid,
            "question_uuid": question_uuid
        })
        return result.deleted_count
