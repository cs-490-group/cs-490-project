from mongo.dao_setup import db_client, NETWORK_CAMPAIGNS
from bson import ObjectId
from datetime import datetime, timezone

class NetworkCampaignDAO:
    def __init__(self):
        self.collection = db_client.get_collection(NETWORK_CAMPAIGNS)
    
    async def add_campaign(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_campaigns(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_campaign(self, campaign_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(campaign_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_campaign(self, campaign_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(campaign_id)}, {"$set": data})
        return updated.matched_count

    async def delete_campaign(self, campaign_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(campaign_id)})
        return result.deleted_count

    async def get_active_campaigns(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "status": "active"})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_completed_campaigns(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "status": "completed"})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

network_campaigns_dao = NetworkCampaignDAO()
