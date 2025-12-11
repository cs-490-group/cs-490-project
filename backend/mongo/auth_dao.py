from mongo.dao_setup import db_client, AUTH

class UserAuthenticationDAO:
    def __init__(self):
        self.collection = db_client.get_collection(AUTH)

    async def add_user(self, uuid: str, data: dict) -> str:
        result = await self.collection.insert_one({"_id": uuid, **data})
        return result.inserted_id

    async def get_password(self, email: str) -> str | None:
        user_data = await self.collection.find_one({"email": email})
        return user_data.get("password") if user_data else None
    
    async def get_password_by_uuid(self, uuid: str) -> str | None:
        user_data = await self.collection.find_one({"_id": uuid})
        return user_data.get("password") if user_data else None
    
    async def get_uuid(self, email: str) -> str | None:
        result = await self.collection.find_one({"email": email})
        return result["_id"] if result else None

    async def update_password(self, uuid, data: dict) -> int:
        updated = await self.collection.update_one({"_id": uuid},{"$set":data})
        return updated.matched_count
    
    async def delete_user(self, uuid: str) -> int:
        result = await self.collection.delete_one({"_id": uuid})
        return result.deleted_count

auth_dao = UserAuthenticationDAO()