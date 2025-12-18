"""
MongoDB Data Access Object for SalaryBLS Data
"""

from typing import Optional, Dict, List
from datetime import datetime
from mongo.dao_setup import db_client


class SalaryBLSDAO:
    """DAO for salaryBLS data storage and retrieval"""
    
    def __init__(self):
        self.collection_name = "salaryBLS_data"
        self.collection = db_client.get_collection(self.collection_name)
    
    async def get_salary_data(
        self, 
        job_title: str, 
        city: str, 
        state: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Get salary data for a specific job title and location
        
        Args:
            job_title: Job title to search
            city: City name
            state: State abbreviation (optional)
            
        Returns:
            Salary data dictionary or None if not found
        """
        try:
            collection = self.collection
            
            # Build query - normalize to lowercase for case-insensitive matching
            query = {
                "job_title_lower": job_title.lower().strip(),
                "city_lower": city.lower().strip()
            }
            
            if state:
                query["state_lower"] = state.lower().strip()
            
            result = await collection.find_one(query, {"_id": 0})
            return result
            
        except Exception as e:
            print(f"Error getting salary data: {e}")
            return None
    
    async def create_salary_data(self, salary_data: Dict) -> str:
        """
        Create a new salary data entry
        
        Args:
            salary_data: Dictionary containing salary information
            
        Returns:
            ID of created document
        """
        try:
            collection = self.collection
            
            # Add normalized fields for case-insensitive searching
            salary_data["job_title_lower"] = salary_data["job_title"].lower().strip()
            salary_data["city_lower"] = salary_data["city"].lower().strip()
            if salary_data.get("state"):
                salary_data["state_lower"] = salary_data["state"].lower().strip()
            
            # Add timestamps
            salary_data["created_at"] = datetime.utcnow()
            salary_data["last_updated"] = datetime.utcnow()
            
            result = await collection.insert_one(salary_data)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error creating salary data: {e}")
            raise
    
    async def update_salary_data(self, entry_id: str, salary_data: Dict) -> bool:
        """
        Update an existing salary data entry
        
        Args:
            entry_id: ID of entry to update (can be None if using query)
            salary_data: Updated salary information
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self.collection
            
            # Update normalized fields
            salary_data["job_title_lower"] = salary_data["job_title"].lower().strip()
            salary_data["city_lower"] = salary_data["city"].lower().strip()
            if salary_data.get("state"):
                salary_data["state_lower"] = salary_data["state"].lower().strip()
            
            # Update timestamp
            salary_data["last_updated"] = datetime.utcnow()
            
            # Try to update by matching job_title and city (not by _id)
            query = {
                "job_title_lower": salary_data["job_title_lower"],
                "city_lower": salary_data["city_lower"]
            }
            
            if salary_data.get("state"):
                query["state_lower"] = salary_data["state_lower"]
            
            result = await collection.update_one(
                query,
                {"$set": salary_data},
                upsert=True  # Create if doesn't exist
            )
            
            return result.modified_count > 0 or result.upserted_id is not None
            
        except Exception as e:
            print(f"Error updating salary data: {e}")
            return False
    
    async def delete_salary_data(self, entry_id: str) -> bool:
        """
        Delete a salary data entry
        
        Args:
            entry_id: ID of entry to delete
            
        Returns:
            True if deleted, False if not found
        """
        try:
            from bson import ObjectId
            collection = self.collection
            
            result = await collection.delete_one({"_id": ObjectId(entry_id)})
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting salary data: {e}")
            return False
    
    async def get_recent_searches(self, limit: int = 10) -> List[Dict]:
        """
        Get most recently updated salary searches
        
        Args:
            limit: Maximum number of results
            
        Returns:
            List of salary data dictionaries
        """
        try:
            collection = self.collection
            
            cursor = collection.find(
                {},
                {"_id": 0}
            ).sort("last_updated", -1).limit(limit)
            
            results = await cursor.to_list(length=limit)
            return results
            
        except Exception as e:
            print(f"Error getting recent searches: {e}")
            return []
    
    async def search_by_job_title(self, job_title: str) -> List[Dict]:
        """
        Find all salary data for a specific job title across different locations
        
        Args:
            job_title: Job title to search
            
        Returns:
            List of salary data dictionaries for different locations
        """
        try:
            collection = self.collection
            
            cursor = collection.find(
                {"job_title_lower": job_title.lower().strip()},
                {"_id": 0}
            ).sort("city", 1)
            
            results = await cursor.to_list(length=None)
            return results
            
        except Exception as e:
            print(f"Error searching by job title: {e}")
            return []
    
    async def search_by_city(self, city: str, state: Optional[str] = None) -> List[Dict]:
        """
        Find all salary data for a specific city
        
        Args:
            city: City name
            state: State abbreviation (optional)
            
        Returns:
            List of salary data dictionaries for different job titles
        """
        try:
            collection = self.collection
            
            query = {"city_lower": city.lower().strip()}
            if state:
                query["state_lower"] = state.lower().strip()
            
            cursor = collection.find(
                query,
                {"_id": 0}
            ).sort("job_title", 1)
            
            results = await cursor.to_list(length=None)
            return results
            
        except Exception as e:
            print(f"Error searching by city: {e}")
            return []
    
    async def get_stats(self) -> Dict:
        """
        Get statistics about cached salary data
        
        Returns:
            Dictionary with statistics
        """
        try:
            collection = self.collection
            
            # Total entries
            total = await collection.count_documents({})
            
            # Unique job titles
            unique_titles = await collection.distinct("job_title_lower")
            
            # Unique cities
            unique_cities = await collection.distinct("city_lower")
            
            # Oldest and newest entries
            oldest = await collection.find_one(
                {},
                {"last_updated": 1, "_id": 0},
                sort=[("last_updated", 1)]
            )
            
            newest = await collection.find_one(
                {},
                {"last_updated": 1, "_id": 0},
                sort=[("last_updated", -1)]
            )
            
            return {
                "total_entries": total,
                "unique_job_titles": len(unique_titles),
                "unique_cities": len(unique_cities),
                "oldest_entry": oldest.get("last_updated") if oldest else None,
                "newest_entry": newest.get("last_updated") if newest else None
            }
            
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {
                "total_entries": 0,
                "unique_job_titles": 0,
                "unique_cities": 0
            }
    
    async def cleanup_old_entries(self, days_old: int = 90) -> int:
        """
        Delete entries older than specified days
        Useful for maintenance/cleanup
        
        Args:
            days_old: Delete entries older than this many days
            
        Returns:
            Number of entries deleted
        """
        try:
            from datetime import timedelta
            collection = self.collection
            
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            result = await collection.delete_many({
                "last_updated": {"$lt": cutoff_date}
            })
            
            return result.deleted_count
            
        except Exception as e:
            print(f"Error cleaning up old entries: {e}")
            return 0


# Global instance
salaryBLS_dao = SalaryBLSDAO()