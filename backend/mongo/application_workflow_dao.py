from mongo.dao_setup import db_client
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import List, Optional, Dict
import secrets

class ApplicationWorkflowDAO:
    """Data Access Object for application workflow automation (UC-069)"""
    
    def __init__(self):
        self.collection = db_client.get_collection("application_workflows")
        self.packages_collection = db_client.get_collection("application_packages")
        self.schedules_collection = db_client.get_collection("application_schedules")
        self.templates_collection = db_client.get_collection("response_templates")
        
    # ============================================
    # APPLICATION PACKAGES (UC-069)
    # ============================================
    
    async def create_application_package(self, data: dict) -> str:
        """Create an application package with resume + cover letter + portfolio"""
        time = datetime.now(timezone.utc)
        data["_id"] = str(ObjectId())
        data["date_created"] = time
        data["date_updated"] = time
        data["status"] = data.get("status", "draft")  # draft, ready, sent
        data["usage_count"] = 0
        
        result = await self.packages_collection.insert_one(data)
        return str(result.inserted_id)
    
    async def get_application_package(self, package_id: str) -> Optional[dict]:
        """Get a specific application package"""
        doc = await self.packages_collection.find_one({"_id": package_id})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    
    async def get_user_packages(self, user_uuid: str) -> List[dict]:
        """Get all application packages for a user"""
        cursor = self.packages_collection.find({"uuid": user_uuid}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def update_package(self, package_id: str, data: dict) -> int:
        """Update an application package"""
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.packages_collection.update_one(
            {"_id": package_id},
            {"$set": data}
        )
        return result.matched_count
    
    async def increment_package_usage(self, package_id: str) -> int:
        """Increment usage count when package is used"""
        result = await self.packages_collection.update_one(
            {"_id": package_id},
            {
                "$inc": {"usage_count": 1},
                "$set": {
                    "last_used": datetime.now(timezone.utc),
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count
    
    async def delete_package(self, package_id: str) -> int:
        """Delete an application package"""
        result = await self.packages_collection.delete_one({"_id": package_id})
        return result.deleted_count
    
    # ============================================
    # APPLICATION SCHEDULING (UC-069)
    # ============================================
    
    async def schedule_application(self, data: dict) -> str:
        """Schedule an application submission"""
        time = datetime.now(timezone.utc)
        data["_id"] = str(ObjectId())
        data["date_created"] = time
        data["status"] = data.get("status", "scheduled")  # scheduled, sent, cancelled, failed
        data["retry_count"] = 0
        
        result = await self.schedules_collection.insert_one(data)
        return str(result.inserted_id)
    
    async def get_scheduled_applications(self, user_uuid: str) -> List[dict]:
        """Get all scheduled applications for a user"""
        cursor = self.schedules_collection.find({
            "uuid": user_uuid,
            "status": {"$in": ["scheduled", "pending"]}
        }).sort("scheduled_time", 1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_due_applications(self, time_window_minutes: int = 5) -> List[dict]:
        """Get applications that are due to be sent"""
        now = datetime.now(timezone.utc)
        target_time = now + timedelta(minutes=time_window_minutes)
        
        cursor = self.schedules_collection.find({
            "status": "scheduled",
            "scheduled_time": {
                "$gte": now,
                "$lte": target_time
            }
        })
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def update_schedule_status(self, schedule_id: str, status: str, notes: str = None) -> int:
        """Update the status of a scheduled application"""
        update_data = {
            "status": status,
            "date_updated": datetime.now(timezone.utc)
        }
        if status == "sent":
            update_data["sent_time"] = datetime.now(timezone.utc)
        if notes:
            update_data["notes"] = notes
            
        result = await self.schedules_collection.update_one(
            {"_id": schedule_id},
            {"$set": update_data}
        )
        return result.matched_count
    
    async def cancel_scheduled_application(self, schedule_id: str, reason: str = None) -> int:
        """Cancel a scheduled application"""
        update_data = {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc),
            "date_updated": datetime.now(timezone.utc)
        }
        if reason:
            update_data["cancellation_reason"] = reason
            
        result = await self.schedules_collection.update_one(
            {"_id": schedule_id},
            {"$set": update_data}
        )
        return result.matched_count
    
    # ============================================
    # RESPONSE TEMPLATES (UC-069)
    # ============================================
    
    async def create_template(self, data: dict) -> str:
        """Create a response template"""
        time = datetime.now(timezone.utc)
        data["_id"] = str(ObjectId())
        data["date_created"] = time
        data["date_updated"] = time
        data["usage_count"] = 0
        
        result = await self.templates_collection.insert_one(data)
        return str(result.inserted_id)
    
    async def get_user_templates(self, user_uuid: str, category: str = None) -> List[dict]:
        """Get all response templates for a user"""
        query = {"uuid": user_uuid}
        if category:
            query["category"] = category
            
        cursor = self.templates_collection.find(query).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def update_template(self, template_id: str, data: dict) -> int:
        """Update a response template"""
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.templates_collection.update_one(
            {"_id": template_id},
            {"$set": data}
        )
        return result.matched_count
    
    async def increment_template_usage(self, template_id: str) -> int:
        """Increment template usage count"""
        result = await self.templates_collection.update_one(
            {"_id": template_id},
            {
                "$inc": {"usage_count": 1},
                "$set": {
                    "last_used": datetime.now(timezone.utc),
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count
    
    async def delete_template(self, template_id: str) -> int:
        """Delete a response template"""
        result = await self.templates_collection.delete_one({"_id": template_id})
        return result.deleted_count
    
    # ============================================
    # AUTOMATION RULES (UC-069)
    # ============================================
    
    async def create_automation_rule(self, data: dict) -> str:
        """Create an automation rule"""
        time = datetime.now(timezone.utc)
        data["_id"] = str(ObjectId())
        data["date_created"] = time
        data["date_updated"] = time
        data["enabled"] = data.get("enabled", True)
        data["execution_count"] = 0
        
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)
    
    async def get_user_automation_rules(self, user_uuid: str) -> List[dict]:
        """Get all automation rules for a user"""
        cursor = self.collection.find({"uuid": user_uuid}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_enabled_rules(self, user_uuid: str) -> List[dict]:
        """Get all enabled automation rules for a user"""
        cursor = self.collection.find({
            "uuid": user_uuid,
            "enabled": True
        })
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def update_automation_rule(self, rule_id: str, data: dict) -> int:
        """Update an automation rule"""
        data["date_updated"] = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"_id": rule_id},
            {"$set": data}
        )
        return result.matched_count
    
    async def toggle_automation_rule(self, rule_id: str, enabled: bool) -> int:
        """Enable or disable an automation rule"""
        result = await self.collection.update_one(
            {"_id": rule_id},
            {
                "$set": {
                    "enabled": enabled,
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count
    
    async def increment_rule_execution(self, rule_id: str) -> int:
        """Increment rule execution count"""
        result = await self.collection.update_one(
            {"_id": rule_id},
            {
                "$inc": {"execution_count": 1},
                "$set": {
                    "last_executed": datetime.now(timezone.utc),
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count
    
    async def delete_automation_rule(self, rule_id: str) -> int:
        """Delete an automation rule"""
        result = await self.collection.delete_one({"_id": rule_id})
        return result.deleted_count
    
    # ============================================
    # BULK OPERATIONS (UC-069)
    # ============================================
    
    async def bulk_create_packages(self, user_uuid: str, packages_data: List[dict]) -> List[str]:
        """Create multiple application packages at once"""
        time = datetime.now(timezone.utc)
        package_ids = []
        
        for data in packages_data:
            data["uuid"] = user_uuid
            data["_id"] = str(ObjectId())
            data["date_created"] = time
            data["date_updated"] = time
            data["status"] = data.get("status", "draft")
            data["usage_count"] = 0
            package_ids.append(data["_id"])
        
        if packages_data:
            await self.packages_collection.insert_many(packages_data)
        
        return package_ids
    
    async def bulk_schedule_applications(self, user_uuid: str, schedules_data: List[dict]) -> List[str]:
        """Schedule multiple applications at once"""
        time = datetime.now(timezone.utc)
        schedule_ids = []
        
        for data in schedules_data:
            data["uuid"] = user_uuid
            data["_id"] = str(ObjectId())
            data["date_created"] = time
            data["status"] = "scheduled"
            data["retry_count"] = 0
            schedule_ids.append(data["_id"])
        
        if schedules_data:
            await self.schedules_collection.insert_many(schedules_data)
        
        return schedule_ids
    
    async def bulk_cancel_schedules(self, schedule_ids: List[str], reason: str = None) -> int:
        """Cancel multiple scheduled applications"""
        update_data = {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc),
            "date_updated": datetime.now(timezone.utc)
        }
        if reason:
            update_data["cancellation_reason"] = reason
        
        result = await self.schedules_collection.update_many(
            {"_id": {"$in": schedule_ids}},
            {"$set": update_data}
        )
        return result.modified_count

# Singleton instance
application_workflow_dao = ApplicationWorkflowDAO()