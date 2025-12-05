from mongo.dao_setup import db_client, REFERRALS
from bson import ObjectId
from datetime import datetime, timezone, timedelta

class ReferralDAO:
    def __init__(self):
        self.collection = db_client.get_collection(REFERRALS)
    
    async def add_referral(self, data: dict) -> str:
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_referrals(self, uuid: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def get_referral(self, referral_id: str) -> dict | None:
        try:
            result = await self.collection.find_one({"_id": ObjectId(referral_id)})
            if result:
                result["_id"] = str(result["_id"])
            return result
        except Exception as e:
            print(f"[ReferralDAO] Error getting referral {referral_id}: {e}")
            raise Exception(f"Invalid referral ID format: {str(e)}")

    async def update_referral(self, referral_id: str, data: dict) -> int:
        try:
            data["date_updated"] = datetime.now(timezone.utc)
            updated = await self.collection.update_one({"_id": ObjectId(referral_id)}, {"$set": data})
            return updated.matched_count
        except Exception as e:
            print(f"[ReferralDAO] Error updating referral {referral_id}: {e}")
            raise Exception(f"Invalid referral ID format: {str(e)}")

    async def delete_referral(self, referral_id: str) -> int:
        try:
            result = await self.collection.delete_one({"_id": ObjectId(referral_id)})
            return result.deleted_count
        except Exception as e:
            print(f"[ReferralDAO] Error deleting referral {referral_id}: {e}")
            raise Exception(f"Invalid referral ID format or referral not found: {str(e)}")

    async def get_referrals_by_status(self, uuid: str, status: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "status": status})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_referrals_by_contact(self, uuid: str, contact_id: str) -> list[dict]:
        cursor = self.collection.find({"uuid": uuid, "contact_id": contact_id})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def mark_reminder_sent(self, referral_id: str, reminder_type: str) -> int:
        """
        Mark a reminder as sent (reminder_type: '24h_before' or 'same_day')
        
        Args:
            referral_id: ID of the referral
            reminder_type: Type of reminder ('24h_before' or 'same_day')
        
        Returns:
            Number of matched documents
        """
        try:
            reminders_sent = {
                reminder_type: True,
                f"{reminder_type}_sent_at": datetime.now(timezone.utc)
            }
            updated = await self.collection.update_one(
                {"_id": ObjectId(referral_id)},
                {"$set": {"reminders_sent": reminders_sent, "date_updated": datetime.now(timezone.utc)}}
            )
            return updated.matched_count
        except Exception as e:
            print(f"[ReferralDAO] Error marking reminder sent for {referral_id}: {e}")
            raise Exception(f"Failed to mark reminder as sent: {str(e)}")
    
    async def get_referrals_with_upcoming_dates(self, days_ahead: int = 2) -> list[dict]:
        """
        Get all referrals with request_date within the next N days
        
        Args:
            days_ahead: Number of days to look ahead (default 2 to catch 24h and same-day reminders)
        
        Returns:
            List of referrals with upcoming request dates
        """
        try:
            now = datetime.now(timezone.utc)
            future_date = now + timedelta(days=days_ahead)
            
            cursor = self.collection.find({
                "request_date": {
                    "$gte": now,
                    "$lte": future_date
                }
            })
            
            results = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                results.append(doc)
            return results
        except Exception as e:
            print(f"[ReferralDAO] Error getting upcoming referrals: {e}")
            raise Exception(f"Failed to get upcoming referrals: {str(e)}")

referrals_dao = ReferralDAO()
