from mongo.dao_setup import db_client, REFERRALS
from bson import ObjectId
from datetime import datetime, timezone

class ReferralDAO:
    def __init__(self):
        self.collection = db_client.get_collection(REFERRALS)
    
    async def add_referral(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_referrals(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_referral(self, referral_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(referral_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_referral(self, referral_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(referral_id)}, {"$set": data})
        return updated.matched_count

    async def delete_referral(self, referral_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(referral_id)})
        return result.deleted_count

    async def get_referrals_by_status(self, uuid: str, status: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "status": status})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_referrals_by_contact(self, uuid: str, contact_id: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "contact_id": contact_id})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

referrals_dao = ReferralDAO()
