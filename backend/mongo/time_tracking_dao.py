from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Dict, Optional
from mongo.dao_setup import db_client, TIME

class TimeTrackingDAO:
    """Data Access Object for time tracking operations"""
    
    def __init__(self):
        self.collection = db_client.get_collection(TIME)
    
    async def add_entry(self, uuid: str, entry_data: dict) -> str:
        """Add a new time tracking entry"""
        entry = {
            "uuid": uuid,
            "activity_type": entry_data["activity_type"],
            "date": entry_data["date"],
            "duration": entry_data["duration"],
            "notes": entry_data.get("notes"),
            "date_created": datetime.now(timezone.utc),
            "date_updated": datetime.now(timezone.utc)
        }
        
        result = await self.collection.insert_one(entry)
        return str(result.inserted_id)
    
    async def get_entry(self, entry_id: str) -> Optional[Dict]:
        """Get a specific time entry by ID"""
        try:
            result = await self.collection.find_one({"_id": ObjectId(entry_id)})
            if result:
                result["_id"] = str(result["_id"])
            return result
        except Exception:
            return None
    
    async def get_all_entries(self, uuid: str) -> List[Dict]:
        """Get all time entries for a user"""
        cursor = self.collection.find({"uuid": uuid}).sort("date", -1)
        entries = await cursor.to_list(length=None)
        
        for entry in entries:
            entry["_id"] = str(entry["_id"])
        
        return entries
    
    async def update_entry(self, entry_id: str, update_data: dict) -> bool:
        """Update a time entry"""
        update_data["date_updated"] = datetime.now(timezone.utc)
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = await self.collection.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    async def delete_entry(self, entry_id: str) -> bool:
        """Delete a time entry"""
        result = await self.collection.delete_one({"_id": ObjectId(entry_id)})
        return result.deleted_count > 0
    
    async def get_time_summary(self, uuid: str, days: int = 30) -> Dict:
        """Get time allocation summary for the last N days"""
        from datetime import date, timedelta
        
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Fetch entries in date range
        cursor = self.collection.find({
            "uuid": uuid,
            "date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        })
        entries = await cursor.to_list(length=None)
        
        # Calculate summary statistics
        total_hours = sum(entry["duration"] for entry in entries)
        total_entries = len(entries)
        
        # Group by activity type
        activity_breakdown = {}
        for entry in entries:
            activity = entry["activity_type"]
            if activity not in activity_breakdown:
                activity_breakdown[activity] = {
                    "hours": 0,
                    "count": 0
                }
            activity_breakdown[activity]["hours"] += entry["duration"]
            activity_breakdown[activity]["count"] += 1
        
        # Calculate percentages
        for activity in activity_breakdown:
            if total_hours > 0:
                activity_breakdown[activity]["percentage"] = round(
                    (activity_breakdown[activity]["hours"] / total_hours) * 100, 1
                )
            else:
                activity_breakdown[activity]["percentage"] = 0
        
        # Calculate daily average
        daily_average = round(total_hours / days, 2) if days > 0 else 0
        
        # Find most productive activity
        most_productive = None
        if activity_breakdown:
            most_productive = max(
                activity_breakdown.items(),
                key=lambda x: x[1]["hours"]
            )[0]
        
        return {
            "total_hours": round(total_hours, 2),
            "total_entries": total_entries,
            "daily_average": daily_average,
            "activity_breakdown": activity_breakdown,
            "most_productive_activity": most_productive,
            "period_days": days
        }
    
    async def get_recent_entries(self, uuid: str, limit: int = 10) -> List[Dict]:
        """Get recent time entries"""
        cursor = self.collection.find({"uuid": uuid}).sort("date", -1).limit(limit)
        entries = await cursor.to_list(length=None)
        
        for entry in entries:
            entry["_id"] = str(entry["_id"])
        
        return entries

# Initialize DAO (this would be done in your dao_setup.py)
time_tracking_dao = TimeTrackingDAO()