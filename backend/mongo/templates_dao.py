from mongo.dao_setup import db_client, RESUME_TEMPLATES
from bson import ObjectId
from datetime import datetime, timezone


class TemplatesDAO:
    """
    Data Access Object for Resume Templates
    Related to UC-046: Resume Template Management
    """

    def __init__(self):
        self.collection = db_client.get_collection(RESUME_TEMPLATES)

    async def add_template(self, data: dict) -> str:
        """Create a new template"""
        time = datetime.now(timezone.utc)
        data["created_at"] = time
        data["updated_at"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_user_templates(self, uuid: str) -> list[dict]:
        """Get all templates for a user (including shared ones)"""
        cursor = self.collection.find({
            "$or": [
                {"uuid": uuid},  # User's own templates
                {"shared_with": uuid}  # Templates shared with user
            ]
        })
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_template(self, template_id: str) -> dict | None:
        """Get a specific template by ID"""
        template = await self.collection.find_one({"_id": ObjectId(template_id)})
        if template:
            template["_id"] = str(template["_id"])
        return template

    async def get_user_default_template(self, uuid: str) -> dict | None:
        """Get the user's default template"""
        template = await self.collection.find_one({
            "uuid": uuid,
            "is_default": True
        })
        if template:
            template["_id"] = str(template["_id"])
        return template

    async def update_template(self, template_id: str, data: dict) -> int:
        """Update a template"""
        data["updated_at"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": data}
        )
        return updated.matched_count

    async def delete_template(self, template_id: str) -> int:
        """Delete a template"""
        result = await self.collection.delete_one({"_id": ObjectId(template_id)})
        return result.deleted_count

    async def set_default_template(self, uuid: str, template_id: str) -> int:
        """Set a template as the user's default"""
        # First, unset all other defaults for this user
        await self.collection.update_many(
            {"uuid": uuid, "is_default": True},
            {"$set": {"is_default": False}}
        )
        # Then set the new default
        updated = await self.collection.update_one(
            {"_id": ObjectId(template_id), "uuid": uuid},
            {"$set": {"is_default": True, "updated_at": datetime.now(timezone.utc)}}
        )
        return updated.matched_count

    async def share_template(self, template_id: str, user_ids: list[str]) -> int:
        """Share a template with other users"""
        updated = await self.collection.update_one(
            {"_id": ObjectId(template_id)},
            {
                "$set": {
                    "shared_with": user_ids,
                    "is_public": len(user_ids) > 0,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        return updated.matched_count

    async def create_template_from_resume(self, resume_id: str, resume_data: dict, uuid: str) -> str:
        """Create a template from an existing resume"""
        template_data = {
            "name": f"Template from {resume_data.get('name', 'Resume')}",
            "description": f"Created from resume: {resume_data.get('name', 'Resume')}",
            "template_type": resume_data.get("template", "chronological"),
            "colors": resume_data.get("colors"),
            "fonts": resume_data.get("fonts"),
            "sections": resume_data.get("sections"),
            "uuid": uuid,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "sample_resume_id": resume_id,
            "is_public": False,
            "is_default": False
        }
        result = await self.collection.insert_one(template_data)
        return str(result.inserted_id)

    async def get_public_templates(self, limit: int = 20) -> list[dict]:
        """Get public templates available to all users"""
        cursor = self.collection.find({"is_public": True}).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            # Remove sensitive user info
            doc.pop("uuid", None)
            results.append(doc)
        return results

    async def search_templates(self, uuid: str, query: str) -> list[dict]:
        """Search user's templates by name or description"""
        cursor = self.collection.find({
            "uuid": uuid,
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"tags": query}
            ]
        })
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results


templates_dao = TemplatesDAO()
