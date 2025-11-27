from mongo.dao_setup import db_client, COVER_LETTERS
from pymongo import DESCENDING
from datetime import datetime

class CoverLettersDAO:
    def __init__(self):
        self.collection = db_client.get_collection(COVER_LETTERS)

    async def add_cover_letter(self, data: dict) -> str:
        """Add a new cover letter document."""
        result = await self.collection.insert_one(data)
        return str(data["_id"])

    async def get_cover_letter(self, letter_id: str, uuid: str) -> dict | None:
        """Get a specific cover letter if it belongs to the user."""
        return await self.collection.find_one({"_id": letter_id, "uuid": uuid})

    async def get_all_cover_letters(self, uuid: str) -> list[dict]:
        """Get all cover letters for a user, sorted by creation date (newest first)."""
        cursor = self.collection.find({"uuid": uuid}).sort("created_at", -1)
        return [doc async for doc in cursor]

    async def update_cover_letter(self, letter_id: str, uuid: str, updates: dict) -> int:
        """Update a cover letter if it belongs to the user."""
        result = await self.collection.update_one(
            {"_id": letter_id, "uuid": uuid},
            {"$set": updates}
        )
        return result.modified_count

    async def delete_cover_letter(self, letter_id: str) -> int:
        """Delete a cover letter by ID."""
        result = await self.collection.delete_one({"_id": letter_id})
        return result.deleted_count
    
    async def increment_usage(self, letter_id: str, uuid: str) -> int:
        """Increment the usage count for a cover letter."""
        result = await self.collection.update_one(
            {"_id": letter_id, "uuid": uuid},
            {"$inc": {"usage_count": 1}}
        )
        return result.modified_count
    
    async def get_usage_by_template_type(self) -> dict:
        """Aggregate cover letters by their template_type and count how many were created from each."""
        pipeline = [
            {
                "$match": {"template_type": {"$ne": None}}
            },
            {
                "$group": {
                    "_id": "$template_type",
                    "total_count": {"$sum": 1}
                }
            },
            {
                "$sort": {"total_count": -1}
            }
        ]
        cursor = await self.collection.aggregate(pipeline)
        result = {}
        async for doc in cursor:
            if doc.get("_id"):
                result[doc["_id"]] = doc.get("total_count", 0)
        return result

    async def get_top_cover_letter_types(self, user_uuid: str, limit: int = 5):
        """Get the most used cover letter styles and industries for a user."""
        pipeline = [
            {"$match": {"uuid": user_uuid}},
            {"$group": {
                "_id": {"style": "$style", "industry": "$industry"},
                "count": {"$sum": 1},
                "usage_count": {"$sum": "$usage_count"}
            }},
            {"$sort": {"usage_count": -1, "count": -1}},
            {"$limit": limit}
        ]
        cursor = self.collection.aggregate(pipeline)
        return [doc async for doc in cursor]

    async def get_letters_sorted_by_usage(self, user_uuid: str, order: str = "desc") -> list[dict]:
        """Get all user letters sorted by usage count."""
        sort_order = DESCENDING if order == "desc" else 1
        cursor = self.collection.find({"uuid": user_uuid}).sort("usage_count", sort_order)
        return [doc async for doc in cursor]


# Singleton instance to use in FastAPI routes
cover_letters_dao = CoverLettersDAO()