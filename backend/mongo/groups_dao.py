from mongo.dao_setup import db_client, GROUPS
from bson import ObjectId


class groupsDAO:
    def __init__(self):
        self.collection = db_client.get_collection(GROUPS)
    
    async def add_group(self, data):
        result = await self.collection.insert_one(data)
        return result.inserted_id

    async def update_group(self, uuid, data):
        updated = await self.collection.update_one({"_id": uuid}, {"$set": data})
        return updated.matched_count

    async def get_group(self, group_id):
        try:
            # Convert string to ObjectId
            group_id = ObjectId(group_id)
            # Return the full group document
            result = await self.collection.find_one({"_id": group_id})
            return result
        except Exception as e:
            print(f"Error fetching group: {e}")
            return None
    
    async def get_all_user_groups(self, uuid):
        cursor = self.collection.find({"members.uuid": uuid}).sort("created_at", -1)
        return [doc async for doc in cursor]

    async def get_all_groups(self):
        cursor = self.collection.find({}).sort("created_at", -1)
        return [doc async for doc in cursor]

    async def add_user_to_group(self, group_id, uuid, role="member"):
        result = await self.collection.update_one(
            {"_id": group_id},
            {"$addToSet": {"members": {"uuid": uuid, "role": role}}}
        )
        return result.modified_count

    async def remove_user_from_group(self, group_id, uuid):
        result = await self.collection.update_one(
            {"_id": group_id},
            {"$pull": {"members": {"uuid": uuid}}}
        )
        return result.modified_count

    async def update_user_role(self, group_id, uuid, new_role):
        result = await self.collection.update_one(
            {"_id": group_id, "members.uuid": uuid},
            {"$set": {"members.$.role": new_role}}
        )
        return result.modified_count

    async def get_group_members(self, group_id):
        result = await self.collection.find_one({"_id": group_id})
        return result.get("members", []) if result else []

    async def delete_group(self, group_id):
        result = await self.collection.delete_one({"_id": group_id})
        return result.deleted_count


groups_dao = groupsDAO()