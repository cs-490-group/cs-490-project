from mongo.dao_setup import db_client, BADGES
from datetime import datetime, timezone
from bson import ObjectId

class BadgesDAO:
    def __init__(self):
        self.collection = db_client.get_collection(BADGES)

    async def add_badge(self, uuid: str, badge_data: dict) -> str:
        """Add a new badge for a user"""
        time = datetime.now(timezone.utc)
        badge_data["date_created"] = time
        badge_data["date_updated"] = time
        badge_data["user_id"] = uuid
        
        # Generate a unique ID for the badge
        badge_data["_id"] = str(ObjectId())
        
        result = await self.collection.insert_one(badge_data)
        return badge_data["_id"]

    async def get_user_badges(self, uuid: str, platform: str = None) -> list:
        """Get all badges for a user, optionally filtered by platform"""
        query = {"user_id": uuid}
        if platform:
            query["platform"] = platform
        
        cursor = self.collection.find(query)
        badges = []
        async for badge in cursor:
            # Convert ObjectId to string and handle datetime serialization
            badge["_id"] = str(badge["_id"])
            if "earned_date" in badge and badge["earned_date"]:
                badge["earned_date"] = badge["earned_date"].isoformat()
            badges.append(badge)
        
        # Sort by date_created descending (newest first)
        badges.sort(key=lambda x: x.get("date_created", ""), reverse=True)
        return badges

    async def get_badge(self, uuid: str, badge_id: str) -> dict | None:
        """Get a specific badge for a user"""
        badge = await self.collection.find_one({
            "user_id": uuid, 
            "_id": badge_id
        })
        
        if badge:
            badge["_id"] = str(badge["_id"])
            if "earned_date" in badge and badge["earned_date"]:
                badge["earned_date"] = badge["earned_date"].isoformat()
        
        return badge

    async def update_badge(self, uuid: str, badge_id: str, badge_data: dict) -> int:
        """Update a specific badge for a user"""
        badge_data["date_updated"] = datetime.now(timezone.utc)
        
        # Parse earned_date if it's a string
        if "earned_date" in badge_data and isinstance(badge_data["earned_date"], str):
            badge_data["earned_date"] = datetime.fromisoformat(badge_data["earned_date"].replace('Z', '+00:00'))
        
        updated = await self.collection.update_one(
            {"user_id": uuid, "_id": badge_id}, 
            {"$set": badge_data}
        )
        return updated.matched_count

    async def delete_badge(self, uuid: str, badge_id: str) -> int:
        """Delete a specific badge for a user"""
        result = await self.collection.delete_one({
            "user_id": uuid, 
            "_id": badge_id
        })
        return result.deleted_count

    async def delete_all_user_badges(self, uuid: str, platform: str = None) -> int:
        """Delete all badges for a user, optionally filtered by platform"""
        query = {"user_id": uuid}
        if platform:
            query["platform"] = platform
        
        result = await self.collection.delete_many(query)
        return result.deleted_count

    async def get_badges_by_category(self, uuid: str, platform: str, category: str) -> list:
        """Get badges for a user filtered by platform and category"""
        cursor = self.collection.find({
            "user_id": uuid,
            "platform": platform,
            "category": category
        })
        
        badges = []
        async for badge in cursor:
            badge["_id"] = str(badge["_id"])
            if "earned_date" in badge and badge["earned_date"]:
                badge["earned_date"] = badge["earned_date"].isoformat()
            badges.append(badge)
        
        badges.sort(key=lambda x: x.get("date_created", ""), reverse=True)
        return badges

badges_dao = BadgesDAO()
