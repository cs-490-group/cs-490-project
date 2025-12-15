"""
Email Tracking DAO - Store and retrieve emails linked to job applications
"""

from mongo.dao_setup import db_client
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Dict, Optional

LINKED_EMAILS = "linked_emails"

class LinkedEmailsDAO:
    """Data access layer for emails linked to job applications"""
    
    def __init__(self):
        self.collection = db_client.get_collection(LINKED_EMAILS)
    
    async def link_email(self, job_id: str, email_data: Dict) -> str:
        """
        Link an email to a job application
        
        Args:
            job_id: Job application ID
            email_data: Dictionary containing email metadata
                - email_id: Gmail message ID
                - thread_id: Gmail thread ID
                - subject: Email subject
                - from_email: Sender email address
                - from_name: Sender name (extracted from email)
                - date: Email date
                - snippet: Email preview text
                - linked_by: User UUID who linked the email
                - detected_status: Optional auto-detected status
        
        Returns:
            ID of created linked email record
        """
        now = datetime.now(timezone.utc)
        
        document = {
            "job_id": job_id,
            "email_id": email_data["email_id"],
            "thread_id": email_data.get("thread_id"),
            "subject": email_data["subject"],
            "from_email": email_data["from_email"],
            "from_name": email_data.get("from_name", ""),
            "date": email_data["date"],
            "snippet": email_data["snippet"],
            "linked_by": email_data["linked_by"],
            "detected_status": email_data.get("detected_status"),
            "linked_at": now,
            "notes": email_data.get("notes", "")
        }
        
        result = await self.collection.insert_one(document)
        return str(result.inserted_id)
    
    async def get_job_emails(self, job_id: str) -> List[Dict]:
        """
        Get all emails linked to a job application
        Returns emails sorted by date (newest first)
        """
        cursor = self.collection.find({"job_id": job_id}).sort("date", -1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        
        return results
    
    async def get_linked_email(self, linked_email_id: str) -> Optional[Dict]:
        """Get a specific linked email by ID"""
        doc = await self.collection.find_one({"_id": ObjectId(linked_email_id)})
        
        if doc:
            doc["_id"] = str(doc["_id"])
        
        return doc
    
    async def unlink_email(self, linked_email_id: str) -> bool:
        """
        Unlink an email from a job application
        Returns True if successful
        """
        result = await self.collection.delete_one({"_id": ObjectId(linked_email_id)})
        return result.deleted_count > 0
    
    async def update_email_notes(self, linked_email_id: str, notes: str) -> bool:
        """Update notes for a linked email"""
        result = await self.collection.update_one(
            {"_id": ObjectId(linked_email_id)},
            {"$set": {"notes": notes, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
    
    async def is_email_linked(self, job_id: str, email_id: str) -> bool:
        """Check if an email is already linked to a job"""
        count = await self.collection.count_documents({
            "job_id": job_id,
            "email_id": email_id
        })
        return count > 0
    
    async def get_user_linked_emails(self, uuid: str) -> List[Dict]:
        """Get all emails linked by a specific user"""
        cursor = self.collection.find({"linked_by": uuid}).sort("linked_at", -1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        
        return results
    
    async def get_emails_by_status(self, job_id: str, status: str) -> List[Dict]:
        """Get emails linked to a job filtered by detected status"""
        cursor = self.collection.find({
            "job_id": job_id,
            "detected_status": status
        }).sort("date", -1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        
        return results
    
    async def count_job_emails(self, job_id: str) -> int:
        """Count total emails linked to a job"""
        return await self.collection.count_documents({"job_id": job_id})
    
    async def bulk_unlink_job_emails(self, job_id: str) -> int:
        """Unlink all emails from a job (used when deleting job)"""
        result = await self.collection.delete_many({"job_id": job_id})
        return result.deleted_count


linked_emails_dao = LinkedEmailsDAO()