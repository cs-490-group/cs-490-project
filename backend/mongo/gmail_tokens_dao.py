from mongo.dao_setup import db_client
from datetime import datetime, timezone
from typing import Optional, Dict

GMAIL_TOKENS = "gmail_tokens"

class GmailTokensDAO:
    def __init__(self):
        self.collection = db_client.get_collection(GMAIL_TOKENS)
    
    async def store_tokens(self, uuid: str, token_data: Dict) -> str:
        """Store or update Gmail OAuth tokens for a user"""
        now = datetime.now(timezone.utc)
        
        document = {
            "uuid": uuid,
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "email": token_data["email"],
            "token_type": token_data.get("token_type", "Bearer"),
            "expires_in": token_data.get("expires_in"),
            "connected_at": now,
            "last_updated": now
        }
        
        # Upsert - update if exists, insert if not
        await self.collection.update_one(
            {"uuid": uuid},
            {"$set": document},
            upsert=True
        )
        
        return uuid
    
    async def get_tokens(self, uuid: str) -> Optional[Dict]:
        """Get Gmail OAuth tokens for a user"""
        doc = await self.collection.find_one({"uuid": uuid})
        return doc
    
    async def delete_tokens(self, uuid: str) -> bool:
        """Delete Gmail tokens (disconnect Gmail)"""
        result = await self.collection.delete_one({"uuid": uuid})
        return result.deleted_count > 0

gmail_tokens_dao = GmailTokensDAO() 