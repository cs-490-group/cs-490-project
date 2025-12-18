from mongo.dao_setup import db_client, EMPLOYMENT
from bson import ObjectId
from datetime import datetime, timezone
from utils.sanitize import sanitize_dict

class EmploymentDAO:
    def __init__(self):
        self.collection = db_client.get_collection(EMPLOYMENT)

    async def add_employment(self, uuid: str, data: dict) -> str:
        data = sanitize_dict(data)
        data["uuid"] = uuid
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_employment(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(sanitize_dict(doc))
        return results

    async def get_employment(self, employment_id: str, uuid: str) -> dict | None:
        doc = await self.collection.find_one({
            "_id": ObjectId(employment_id),
            "uuid": uuid
        })

        if doc:
            doc["_id"] = str(doc["_id"])
            doc = sanitize_dict(doc)
        return doc

    async def update_employment(self, employment_id: str, uuid: str, data: dict) -> int:
        data = sanitize_dict(data)
        data["date_updated"] = datetime.now(timezone.utc)

        updated = await self.collection.update_one(
            {"_id": ObjectId(employment_id), "uuid": uuid},
            {"$set": data}
        )
        return updated.matched_count

    async def delete_employment(self, employment_id: str, uuid: str) -> int:
        result = await self.collection.delete_one({
            "_id": ObjectId(employment_id),
            "uuid": uuid
        })
        return result.deleted_count

employment_dao = EmploymentDAO()