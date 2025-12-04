from mongo.dao_setup import db_client, PROFESSIONAL_REFERENCES
from bson import ObjectId
from datetime import datetime, timezone

class ProfessionalReferenceDAO:
    def __init__(self):
        self.collection = db_client.get_collection(PROFESSIONAL_REFERENCES)
    
    async def add_reference(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_references(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_reference(self, reference_id: str) -> dict | None:
        result = await self.collection.find_one({"_id": ObjectId(reference_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result

    async def update_reference(self, reference_id: str, data: dict) -> int:
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one({"_id": ObjectId(reference_id)}, {"$set": data})
        return updated.matched_count

    async def delete_reference(self, reference_id: str) -> int:
        result = await self.collection.delete_one({"_id": ObjectId(reference_id)})
        return result.deleted_count

    async def get_available_references(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "availability": "available"})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_references_by_company(self, uuid: str, company: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "company": company})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

professional_references_dao = ProfessionalReferenceDAO()
