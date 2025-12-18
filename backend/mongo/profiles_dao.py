from mongo.dao_setup import db_client, PROFILES
from datetime import datetime, timezone

class UserDataDAO:
    def __init__(self):
        self.collection = db_client.get_collection(PROFILES)

    async def add_profile(self, uuid: str, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one({"_id": uuid, **data})
        return result.inserted_id

    async def get_profile(self, uuid: str) -> dict | None:
        return await self.collection.find_one({"_id": uuid})
    
    async def update_profile(self, uuid, data: dict) -> int:
        time = datetime.now(timezone.utc)
        data["date_updated"] = time
        updated = await self.collection.update_one({"_id": uuid}, {"$set": data})
        return updated.matched_count

    async def delete_profile(self, uuid: str) -> int:
        result = await self.collection.delete_one({"_id": uuid})
        return result.deleted_count

    async def update_account_tier(self, uuid: str, tier: str) -> int:
        """Update user's account tier to 'base_member' or 'admin'"""
        result = await self.collection.update_one(
            {"_id": uuid},
            {"$set": {"account_tier": tier}}
        )
        return result.modified_count

    async def is_admin(self, uuid: str) -> bool:
        """Check if user has admin tier"""
        profile = await self.collection.find_one({"_id": uuid})
        if profile:
            return profile.get("account_tier") == "admin"
        return False

    async def get_profile_by_email(self, email: str) -> dict | None:
        """Get profile by email address"""
        return await self.collection.find_one({"email": email})

profiles_dao = UserDataDAO()