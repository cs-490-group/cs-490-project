"""
MongoDB Data Access Object for GitHub OAuth tokens
"""

from typing import Optional, Dict
from datetime import datetime
from mongo.dao_setup import db_client


class GitHubTokensDAO:
    """DAO for GitHub OAuth token storage and retrieval"""
    
    def __init__(self):
        self.collection_name = "github_tokens"
        self.collection = db_client.get_collection(self.collection_name)
    
    async def get_tokens(self, uuid: str) -> Optional[Dict]:
        """
        Get GitHub tokens for a user
        
        Args:
            uuid: User's unique identifier
            
        Returns:
            Dictionary containing token data or None if not found
        """
        try:
            print("yippee")
            result = await self.collection.find_one({"uuid": uuid})
            return result if result else None
        except Exception as e:
            print(f"Error getting GitHub tokens: {e}")
            return None
    
    async def store_tokens(self, uuid: str, token_data: Dict) -> bool:
        """
        Store or update GitHub tokens for a user
        
        Args:
            uuid: User's unique identifier
            token_data: Dictionary containing access token and user info
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.collection
            
            # Add metadata
            token_data["uuid"] = uuid
            token_data["created_at"] = datetime.utcnow()
            token_data["updated_at"] = datetime.utcnow()
            
            # Upsert (update if exists, insert if not)
            await collection.update_one(
                {"uuid": uuid},
                {"$set": token_data},
                upsert=True
            )
            
            return True
        except Exception as e:
            print(f"Error storing GitHub tokens: {e}")
            return False
    
    async def delete_tokens(self, uuid: str) -> bool:
        """
        Delete GitHub tokens for a user (disconnect)
        
        Args:
            uuid: User's unique identifier
            
        Returns:
            True if deleted, False if not found
        """
        try:
            collection = self.collection
            result = await collection.delete_one({"uuid": uuid})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting GitHub tokens: {e}")
            return False
    
    async def update_token(self, uuid: str, access_token: str) -> bool:
        """
        Update only the access token (for token refresh scenarios)
        
        Args:
            uuid: User's unique identifier
            access_token: New access token
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.collection
            
            result = await collection.update_one(
                {"uuid": uuid},
                {
                    "$set": {
                        "access_token": access_token,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating GitHub token: {e}")
            return False


# Global instance
github_tokens_dao = GitHubTokensDAO()