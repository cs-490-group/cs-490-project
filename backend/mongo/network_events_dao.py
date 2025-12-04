from mongo.dao_setup import db_client, NETWORK_EVENTS
from bson import ObjectId
from datetime import datetime, timezone

class NetworkEventDAO:
    def __init__(self):
        self.collection = db_client.get_collection(NETWORK_EVENTS)
    
    async def add_event(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_events(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid}).sort("event_date", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_event(self, event_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(event_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_event(self, event_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(event_id)}, {"$set": data})
        return updated.matched_count

    async def delete_event(self, event_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(event_id)})
        return result.deleted_count

    async def get_events_by_date_range(self, uuid: str, start_date: str, end_date: str) -> list[dict]:
        cursor = self.collection.find({
            "uuid": uuid,
            "event_date": {"$gte": start_date, "$lte": end_date}
        }).sort("event_date", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_upcoming_events(self, uuid: str) -> list[dict]:
        current_date = datetime.now(timezone.utc).isoformat()
        cursor = self.collection.find({
            "uuid": uuid,
            "event_date": {"$gte": current_date}
        }).sort("event_date", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_past_events(self, uuid: str) -> list[dict]:
        current_date = datetime.now(timezone.utc).isoformat()
        cursor = self.collection.find({
            "uuid": uuid,
            "event_date": {"$lt": current_date}
        }).sort("event_date", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

network_events_dao = NetworkEventDAO()
