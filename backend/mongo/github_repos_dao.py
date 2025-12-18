"""
MongoDB Data Access Object for GitHub repository data
"""

from typing import Optional, Dict, List
from datetime import datetime
from pymongo import UpdateOne
from mongo.dao_setup import db_client


class GitHubReposDAO:
    """DAO for GitHub repository storage and management"""
    
    def __init__(self):
        self.collection_name = "github_repositories"
        self.collection = db_client.get_collection(self.collection_name)

    
    async def get_user_repos(self, uuid: str) -> List[Dict]:
        """
        Get all repositories for a user
        
        Args:
            uuid: User's unique identifier
            
        Returns:
            List of repository dictionaries
        """
        try:
            collection = self.collection
            cursor = collection.find(
                {"uuid": uuid},
                {"_id": 0}  # Exclude _id field (not JSON serializable)
            ).sort("updated_at", -1)
            repos = await cursor.to_list(length=None)
            return repos
        except Exception as e:
            print(f"Error getting user repos: {e}")
            return []
    
    async def get_repo(self, uuid: str, repo_id: int) -> Optional[Dict]:
        """
        Get a specific repository by ID
        
        Args:
            uuid: User's unique identifier
            repo_id: GitHub repository ID
            
        Returns:
            Repository dictionary or None if not found
        """
        try:
            collection = self.collection
            repo = await collection.find_one(
                {"uuid": uuid, "repo_id": repo_id},
                {"_id": 0}  # Exclude _id field (not JSON serializable)
            )
            return repo
        except Exception as e:
            print(f"Error getting repo: {e}")
            return None
    
    async def store_repos(self, uuid: str, repos: List[Dict]) -> bool:
        """
        Store or update repositories for a user (bulk operation)
        
        Args:
            uuid: User's unique identifier
            repos: List of repository dictionaries
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.collection
            
            # Add uuid to each repo
            for repo in repos:
                repo["uuid"] = uuid
                repo["synced_at"] = datetime.utcnow()
                
                # Preserve existing featured status and notes if repo exists
                existing = await self.get_repo(uuid, repo["repo_id"])
                if existing:
                    repo["is_featured"] = existing.get("is_featured", False)
                    repo["linked_skills"] = existing.get("linked_skills", [])
                    repo["notes"] = existing.get("notes", "")
            
            # Bulk upsert using UpdateOne operations
            operations = []
            for repo in repos:
                operations.append(
                    UpdateOne(
                        {"uuid": uuid, "repo_id": repo["repo_id"]},
                        {"$set": repo},
                        upsert=True
                    )
                )
            
            if operations:
                await collection.bulk_write(operations)
            
            return True
        except Exception as e:
            print(f"Error storing repos: {e}")
            return False
    
    async def get_featured_repos(self, uuid: str) -> List[Dict]:
        """
        Get repositories marked as featured
        
        Args:
            uuid: User's unique identifier
            
        Returns:
            List of featured repository dictionaries
        """
        try:
            collection = self.collection
            cursor = collection.find(
                {"uuid": uuid, "is_featured": True},
                {"_id": 0}  # Exclude _id field (not JSON serializable)
            ).sort("stargazers_count", -1)
            repos = await cursor.to_list(length=None)
            return repos
        except Exception as e:
            print(f"Error getting featured repos: {e}")
            return []
    
    async def set_featured(self, uuid: str, repo_id: int, is_featured: bool) -> bool:
        """
        Mark or unmark a repository as featured
        
        Args:
            uuid: User's unique identifier
            repo_id: GitHub repository ID
            is_featured: Featured status
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.collection
            
            result = await collection.update_one(
                {"uuid": uuid, "repo_id": repo_id},
                {"$set": {"is_featured": is_featured}}
            )
            
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"Error setting featured status: {e}")
            return False
    
    async def link_skills(self, uuid: str, repo_id: int, skill_ids: List[str]) -> bool:
        """
        Link skills to a repository
        
        Args:
            uuid: User's unique identifier
            repo_id: GitHub repository ID
            skill_ids: List of skill IDs to link
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.collection
            
            result = await collection.update_one(
                {"uuid": uuid, "repo_id": repo_id},
                {"$set": {"linked_skills": skill_ids}}
            )
            
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"Error linking skills: {e}")
            return False
    
    async def update_notes(self, uuid: str, repo_id: int, notes: str) -> bool:
        """
        Update notes for a repository
        
        Args:
            uuid: User's unique identifier
            repo_id: GitHub repository ID
            notes: Notes text
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.collection
            
            result = await collection.update_one(
                {"uuid": uuid, "repo_id": repo_id},
                {"$set": {"notes": notes}}
            )
            
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"Error updating notes: {e}")
            return False
    
    async def delete_user_repos(self, uuid: str) -> bool:
        """
        Delete all repositories for a user (used when disconnecting)
        
        Args:
            uuid: User's unique identifier
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            collection = self.collection
            result = await collection.delete_many({"uuid": uuid})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting user repos: {e}")
            return False
    
    async def get_repos_by_language(self, uuid: str, language: str) -> List[Dict]:
        """
        Get repositories filtered by primary language
        
        Args:
            uuid: User's unique identifier
            language: Programming language
            
        Returns:
            List of repository dictionaries
        """
        try:
            collection = self.collection
            cursor = collection.find(
                {"uuid": uuid, "language": language},
                {"_id": 0}  # Exclude _id field (not JSON serializable)
            ).sort("stargazers_count", -1)
            repos = await cursor.to_list(length=None)
            return repos
        except Exception as e:
            print(f"Error getting repos by language: {e}")
            return []


# Global instance
github_repos_dao = GitHubReposDAO()