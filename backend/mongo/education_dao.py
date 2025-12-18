from mongo.dao_setup import db_client, EDUCATION
from bson import ObjectId
from datetime import datetime, timezone

class EducationDAO:
    def __init__(self):
        self.collection = db_client.get_collection(EDUCATION)

    async def add_education(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_education(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_education(self, education_id: str) -> dict | None:
        return await self.collection.find_one({"_id": ObjectId(education_id)})

    async def update_education(self, education_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(education_id)}, {"$set": data})
        return updated.matched_count

    async def delete_education(self, education_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(education_id)})
        return result.deleted_count

education_dao = EducationDAO()