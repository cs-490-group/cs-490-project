from mongo.dao_setup import db_client, COVER_LETTERS
from pymongo import DESCENDING
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from bson import ObjectId
import secrets

class CoverLettersDAO:
    def __init__(self):
        self.collection = db_client.get_collection(COVER_LETTERS)
        self.feedback_collection = db_client.get_collection("cover_letter_feedback")
        self.shares_collection = db_client.get_collection("cover_letter_shares")
        self.versions_collection = db_client.get_collection("cover_letter_versions")

    # ============ BASIC CRUD ============

    async def add_cover_letter(self, data: dict) -> str:
        """Add a new cover letter document."""
        result = await self.collection.insert_one(data)
        return str(data["_id"])

    async def get_cover_letter(self, letter_id: str, uuid: str) -> dict | None:
        """Get a specific cover letter if it belongs to the user."""
        return await self.collection.find_one({"_id": letter_id, "uuid": uuid})

    async def get_all_cover_letters(self, uuid: str) -> list[dict]:
        """Get all cover letters for a user, sorted by creation date (newest first)."""
        cursor = self.collection.find({"uuid": uuid}).sort("created_at", -1)
        return [doc async for doc in cursor]

    async def update_cover_letter(self, letter_id: str, uuid: str, updates: dict) -> int:
        """Update a cover letter if it belongs to the user."""
        result = await self.collection.update_one(
            {"_id": letter_id, "uuid": uuid},
            {"$set": updates}
        )
        return result.modified_count

    async def delete_cover_letter(self, letter_id: str) -> int:
        """Delete a cover letter by ID."""
        result = await self.collection.delete_one({"_id": letter_id})
        return result.deleted_count
    
    async def increment_usage(self, letter_id: str, uuid: str) -> int:
        """Increment the usage count for a cover letter."""
        result = await self.collection.update_one(
            {"_id": letter_id, "uuid": uuid},
            {"$inc": {"usage_count": 1}}
        )
        return result.modified_count
    
    async def set_default_cover_letter(self, letter_id: str, uuid: str) -> int:
        """Set a cover letter as default for the user."""
        await self.collection.update_many(
            {"uuid": uuid},
            {"$set": {"default_cover_letter": False}}
        )
        result = await self.collection.update_one(
            {"_id": letter_id, "uuid": uuid},
            {"$set": {"default_cover_letter": True}}
        )
        return result.modified_count

    # ============ DASHBOARD ANALYTICS (Required for /usage/by-type) ============

    async def get_usage_by_template_type(self) -> dict:
        """Aggregate cover letters by their template_type and count usage."""
        pipeline = [
            { "$match": {"template_type": {"$ne": None}} },
            { "$group": { "_id": "$template_type", "total_count": {"$sum": 1} } },
            { "$sort": { "total_count": -1 } }
        ]
        cursor = await self.collection.aggregate(pipeline)
        result = {}
        async for doc in cursor:
            if doc.get("_id"):
                result[doc["_id"]] = doc.get("total_count", 0)
        return result

    # ============ SHARING & FEEDBACK LOGIC ============

    async def create_share_link(self, letter_id: str, data: dict) -> dict:
        """Generate a shareable token for a cover letter"""
        time = datetime.now(timezone.utc)
        expiration_days = data.get("expiration_days", 30)
        expires_at = time + timedelta(days=expiration_days)

        share_data = {
            "cover_letter_id": letter_id,
            "token": secrets.token_urlsafe(32),
            "can_comment": data.get("can_comment", True),
            "can_download": data.get("can_download", True),
            "created_at": time,
            "expires_at": expires_at,
            "active": True
        }

        # Invalidate old links for security
        await self.shares_collection.delete_one({"cover_letter_id": letter_id})

        result = await self.shares_collection.insert_one(share_data)
        share_data["_id"] = str(result.inserted_id)
        return share_data

    async def get_cover_letter_by_token(self, token: str) -> dict | None:
        """Retrieve cover letter via public token"""
  
        share = await self.shares_collection.find_one({"token": token, "active": True})
        if not share:
            return None

 
        now = datetime.now(timezone.utc)
        expires_at = share.get("expires_at")
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at and expires_at < now:
            return None

   
        letter_id = share.get("cover_letter_id")
        try:
            # Handle both String ID and ObjectId
            try:
                query_id = ObjectId(letter_id)
            except:
                query_id = letter_id
                
            letter = await self.collection.find_one({"_id": query_id})
        except Exception:
            return None

        if letter:
            letter["_id"] = str(letter["_id"])
            letter["share_settings"] = {
                "can_comment": share.get("can_comment", True),
                "can_download": share.get("can_download", True)
            }
            return letter
        return None

    async def get_share_link(self, letter_id: str) -> dict | None:
        share = await self.shares_collection.find_one({"cover_letter_id": letter_id, "active": True})
        if share:
            share["_id"] = str(share["_id"])
        return share

    async def revoke_share_link(self, letter_id: str) -> int:
        result = await self.shares_collection.update_one(
            {"cover_letter_id": letter_id},
            {"$set": {"active": False}}
        )
        return result.modified_count

    async def add_feedback(self, data: dict) -> str:
        data["date_created"] = datetime.now(timezone.utc)
        result = await self.feedback_collection.insert_one(data)
        return str(result.inserted_id)

    async def get_feedback(self, letter_id: str) -> list[dict]:
        cursor = self.feedback_collection.find({"cover_letter_id": letter_id}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
        
    async def update_feedback(self, feedback_id: str, data: dict) -> int:
        result = await self.feedback_collection.update_one(
            {"_id": ObjectId(feedback_id)},
            {"$set": data}
        )
        return result.modified_count

    async def delete_feedback(self, feedback_id: str) -> int:
        result = await self.feedback_collection.delete_one({"_id": ObjectId(feedback_id)})
        return result.deleted_count
    
    async def update_approval_status(self, letter_id: str, status: str) -> int:
        """Update approval status"""
        return (await self.collection.update_one(
            {"_id": letter_id},
            {"$set": {"approval_status": status}}
        )).modified_count
    
    async def create_version(self, letter_id: str, data: dict) -> str:
        """Save a snapshot of the cover letter"""
        data["cover_letter_id"] = letter_id
        data["created_at"] = datetime.now(timezone.utc)
        result = await self.versions_collection.insert_one(data)
        return str(result.inserted_id)

    async def get_versions(self, letter_id: str) -> list[dict]:
        """Get history for a specific letter"""
        cursor = self.versions_collection.find({"cover_letter_id": letter_id}).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def restore_version(self, letter_id: str, version_id: str) -> int:
        """Overwrite current letter with version data"""
        version = await self.versions_collection.find_one({"_id": ObjectId(version_id)})
        if not version:
            return 0

        # Prepare update
        update_data = {
            "content": version.get("content_snapshot"),
            "title": version.get("title_snapshot"),
            "date_updated": datetime.now(timezone.utc)
        }

        # Update the main document
        result = await self.collection.update_one(
            {"_id": letter_id}, # Assuming letter_id matches your ID format (ObjectId or Str)
            {"$set": update_data}
        )
        return result.modified_count

    async def delete_version(self, version_id: str) -> int:
        result = await self.versions_collection.delete_one({"_id": ObjectId(version_id)})
        return result.deleted_count
    
    async def get_performance_stats(self, user_uuid: str, jobs_dao) -> dict:
        """
        Calculate performance metrics for cover letters based on linked job outcomes.
        Groups data by Template Style (e.g., 'Formal', 'Creative').
        """
        # Fetch all jobs for the user
        jobs = await jobs_dao.get_all_jobs(user_uuid)
        
        # Fetch all cover letters for the user
        letters = await self.get_all_cover_letters(user_uuid)
        letter_map = {str(l["_id"]): l for l in letters}
        
        # Aggregate Data
        stats = {} # { "Formal": { sent: 10, interviews: 2, offers: 1 } }
        
        for job in jobs:
            # Check if job has a linked cover letter
            materials = job.get("materials", {})
            if not materials or not materials.get("cover_letter_id"):
                continue
                
            letter_id = materials.get("cover_letter_id")
            letter = letter_map.get(letter_id)
            
            if not letter: 
                continue
                
            # Extract Style/Template
            style = "Unknown"
            template_type = letter.get("template_type", "")
            
            if template_type:
                # FIX: Handle "sample_" prefix logic here
                if template_type.startswith("sample_"):
                    # Format: sample_technical_Industry_Name -> extracts "Technical"
                    parts = template_type.split("_")
                    if len(parts) > 1:
                        style = parts[1].capitalize() 
                elif "_" in template_type:
                    # Format: technical_industry.html -> extracts "Technical"
                    style = template_type.split('_')[0].capitalize()
                else:
                    style = template_type.capitalize()
            
            elif " - " in letter.get("title", ""):
                 style = letter.get("title").split(" - ")[0]
            
            if style not in stats:
                stats[style] = {"sent": 0, "responses": 0, "interviews": 0, "offers": 0}
            
            # Update Counts
            stats[style]["sent"] += 1
            status = job.get("status", "").lower()
            
            if status in ["screening", "interview", "offer"]:
                stats[style]["responses"] += 1
            if status in ["interview", "offer"]:
                stats[style]["interviews"] += 1
            if status == "offer":
                stats[style]["offers"] += 1
        
        # Calculate Rates & Insights
        results = []
        for style, data in stats.items():
            total = data["sent"]
            if total == 0: continue
            
            results.append({
                "style": style,
                "total_sent": total,
                "response_rate": round((data["responses"] / total) * 100, 1),
                "interview_rate": round((data["interviews"] / total) * 100, 1),
                "offer_rate": round((data["offers"] / total) * 100, 1),
                "raw": data
            })
            
        return {
            "styles": results,
            "total_linked_applications": sum(s["total_sent"] for s in results)
        }

cover_letters_dao = CoverLettersDAO()