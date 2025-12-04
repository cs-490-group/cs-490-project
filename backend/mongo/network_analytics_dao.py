from mongo.dao_setup import db_client, NETWORK_ANALYTICS
from bson import ObjectId
from datetime import datetime, timezone

class NetworkAnalyticsDAO:
    def __init__(self):
        self.collection = db_client.get_collection(NETWORK_ANALYTICS)
    
    async def add_analytics_record(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_analytics(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_analytics(self, analytics_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(analytics_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_analytics(self, analytics_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(analytics_id)}, {"$set": data})
        return updated.matched_count

    async def delete_analytics(self, analytics_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(analytics_id)})
        return result.deleted_count

    async def get_analytics_by_date_range(self, uuid: str, start_date: str, end_date: str) -> list[dict]:
        cursor = self.collection.find({
            "uuid": uuid,
            "date_created": {"$gte": start_date, "$lte": end_date}
        }).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_latest_analytics(self, uuid: str) -> dict | None:
        result = await self.collection.find_one({"uuid": uuid}, sort=[("date_created", -1)])
        if result:
            result["_id"] = str(result["_id"])
        return result

network_analytics_dao = NetworkAnalyticsDAO()
