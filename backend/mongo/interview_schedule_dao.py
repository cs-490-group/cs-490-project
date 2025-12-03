import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pymongo.asynchronous.database import AsyncDatabase
from bson import ObjectId


class InterviewScheduleDAO:
    """Data Access Object for interview schedules"""

    def __init__(self, db_client: AsyncDatabase):
        self.db = db_client
        self.collection = db_client["interview_schedules"]

    async def create_schedule(self, data: dict) -> str:
        """Create a new interview schedule - returns MongoDB _id as string"""
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        data["status"] = data.get("status", "scheduled")
        data["calendar_synced"] = data.get("calendar_synced", False)
        data["preparation_completion_percentage"] = 0
        
        # Note: data should already have "uuid" field from user authorization
        
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_schedule(self, schedule_id: str) -> Optional[dict]:
        """Get a specific interview schedule by MongoDB _id"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(schedule_id)})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except:
            return None

    async def get_user_schedules(self, user_uuid: str, status: Optional[str] = None) -> List[dict]:
        """Get all interview schedules for a user, optionally filtered by status"""
        query = {"uuid": user_uuid}  # Match the Jobs pattern
        if status:
            query["status"] = status
        
        cursor = self.collection.find(query).sort("interview_datetime", 1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_upcoming_interviews(self, user_uuid: str):
        """Get interviews categorized as upcoming or past"""
        
        # Get current time in UTC
        now = datetime.now(timezone.utc)
        
        # Query ALL scheduled interviews for this user
        all_interviews = await self.db.interview_schedules.find({
            "uuid": user_uuid,
            "status": {"$ne": "completed"}  # Exclude completed interviews
        }).to_list(length=None)
        
        upcoming = []
        past = []
        
        for interview in all_interviews:
            interview_time = interview.get('interview_datetime')
            
            # Ensure interview_time is timezone-aware
            if interview_time:
                if interview_time.tzinfo is None:
                    interview_time = interview_time.replace(tzinfo=timezone.utc)
                
                if interview_time >= now:
                    upcoming.append(interview)
                else:
                    past.append(interview)
        
        upcoming.sort(key=lambda x: x['interview_datetime'])
        past.sort(key=lambda x: x['interview_datetime'], reverse=True)
        
        return {
            "upcoming_interviews": upcoming,
            "past_interviews": past
        }

    async def get_all_scheduled_interviews(self) -> List[dict]:
        """Get all scheduled interviews across all users (for reminder checking)"""
        cursor = self.collection.find({
            "status": "scheduled"
        }).sort("interview_datetime", 1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_interviews_by_job_application(self, job_application_uuid: str) -> List[dict]:
        """Get all interviews for a specific job application"""
        cursor = self.collection.find({
            "job_application_uuid": job_application_uuid
        }).sort("interview_datetime", 1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def update_schedule(self, schedule_id: str, data: dict) -> int:
        """Update an interview schedule"""
        data["date_updated"] = datetime.now(timezone.utc)
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id)},
                {"$set": data}
            )
            return result.matched_count
        except:
            return 0

    async def add_preparation_task(self, schedule_id: str, task: dict) -> int:
        """Add a preparation task to the schedule"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id)},
                {
                    "$push": {"preparation_tasks": task},
                    "$set": {"date_updated": datetime.now(timezone.utc)}
                }
            )
            return result.matched_count
        except:
            return 0

    async def update_preparation_task(self, schedule_id: str, task_id: str, updates: dict) -> int:
        """Update a specific preparation task"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id), "preparation_tasks.task_id": task_id},
                {
                    "$set": {
                        f"preparation_tasks.$": {**updates, "task_id": task_id},
                        "date_updated": datetime.now(timezone.utc)
                    }
                }
            )
            return result.matched_count
        except:
            return 0

    async def update_preparation_completion(self, schedule_id: str, percentage: int) -> int:
        """Update preparation completion percentage"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id)},
                {
                    "$set": {
                        "preparation_completion_percentage": percentage,
                        "date_updated": datetime.now(timezone.utc)
                    }
                }
            )
            return result.matched_count
        except:
            return 0

    async def mark_reminder_sent(self, schedule_id: str, reminder_type: str) -> int:
        """Mark a reminder as sent"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id)},
                {
                    "$set": {
                        f"reminders_sent.{reminder_type}": True,
                        "date_updated": datetime.now(timezone.utc)
                    }
                }
            )
            return result.matched_count
        except:
            return 0

    async def complete_interview(self, schedule_id: str, outcome_data: dict) -> int:
        """Mark interview as completed with outcome"""
        update_data = {
            "status": "completed",
            "outcome": outcome_data.get("outcome"),
            "outcome_notes": outcome_data.get("outcome_notes"),
            "interviewer_feedback": outcome_data.get("interviewer_feedback"),
            "date_updated": datetime.now(timezone.utc)
        }
        
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id)},
                {"$set": update_data}
            )
            return result.matched_count
        except:
            return 0

    async def cancel_interview(self, schedule_id: str, reason: Optional[str] = None) -> int:
        """Cancel an interview"""
        update_data = {
            "status": "cancelled",
            "date_updated": datetime.now(timezone.utc)
        }
        if reason:
            update_data["notes"] = reason
        
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id)},
                {"$set": update_data}
            )
            return result.matched_count
        except:
            return 0

    async def mark_thank_you_sent(self, schedule_id: str) -> int:
        """Mark thank you note as sent"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(schedule_id)},
                {
                    "$set": {
                        "thank_you_note_sent": True,
                        "thank_you_note_sent_at": datetime.now(timezone.utc),
                        "date_updated": datetime.now(timezone.utc)
                    }
                }
            )
            return result.matched_count
        except:
            return 0

    async def get_interviews_needing_reminders(self, reminder_window_hours: int) -> List[dict]:
        """Get interviews that need reminders sent"""
        now = datetime.now(timezone.utc)
        target_time = now + timedelta(hours=reminder_window_hours)
        
        cursor = self.collection.find({
            "status": "scheduled",
            "interview_datetime": {
                "$gte": now,
                "$lte": target_time
            }
        })
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            reminder_key = f"{reminder_window_hours}h"
            if not doc.get("reminders_sent", {}).get(reminder_key, False):
                results.append(doc)
        
        return results

    async def delete_schedule(self, schedule_id: str) -> int:
        """Delete an interview schedule"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(schedule_id)})
            return result.deleted_count
        except:
            return 0


class InterviewAnalyticsDAO:
    """Data Access Object for interview analytics"""

    def __init__(self, db_client: AsyncDatabase):
        self.db = db_client
        self.schedules_collection = db_client["interview_schedules"]
        self.mock_sessions_collection = db_client["mock_interview_sessions"]

    async def get_performance_metrics(self, user_uuid: str) -> dict:
        """Calculate performance metrics for a user"""
        # Get all completed interviews
        completed = await self.schedules_collection.count_documents({
            "uuid": user_uuid,
            "status": "completed"
        })
        
        # Get interviews with offers
        offers = await self.schedules_collection.count_documents({
            "uuid": user_uuid,
            "status": "completed",
            "outcome": "passed"
        })
        
        # Get all interviews
        total = await self.schedules_collection.count_documents({
            "uuid": user_uuid
        })
        
        # Calculate conversion rate
        conversion_rate = (offers / completed * 100) if completed > 0 else 0
        
        # Get performance by format
        formats = ["phone", "video", "in-person"]
        format_performance = {}
        for fmt in formats:
            total_fmt = await self.schedules_collection.count_documents({
                "uuid": user_uuid,
                "location_type": fmt,
                "status": "completed"
            })
            passed_fmt = await self.schedules_collection.count_documents({
                "uuid": user_uuid,
                "location_type": fmt,
                "status": "completed",
                "outcome": "passed"
            })
            format_performance[fmt] = (passed_fmt / total_fmt * 100) if total_fmt > 0 else 0
        
        return {
            "total_interviews": total,
            "completed_interviews": completed,
            "offers_received": offers,
            "conversion_rate": round(conversion_rate, 2),
            "format_performance": format_performance
        }

    async def get_trend_analysis(self, user_uuid: str, days: int = 90) -> dict:
        """Analyze performance trends over time"""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        cursor = self.schedules_collection.find({
            "uuid": user_uuid,
            "status": "completed",
            "date_created": {"$gte": cutoff_date}
        }).sort("interview_datetime", 1)
        
        interviews = []
        async for doc in cursor:
            interviews.append({
                "date": doc["interview_datetime"],
                "outcome": doc.get("outcome")
            })
        
        # Calculate trend
        if len(interviews) < 2:
            trend = "insufficient_data"
        else:
            recent_half = interviews[len(interviews)//2:]
            earlier_half = interviews[:len(interviews)//2]
            
            recent_success = sum(1 for i in recent_half if i["outcome"] == "passed") / len(recent_half)
            earlier_success = sum(1 for i in earlier_half if i["outcome"] == "passed") / len(earlier_half)
            
            if recent_success > earlier_success + 0.1:
                trend = "improving"
            elif recent_success < earlier_success - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        
        return {
            "trend": trend,
            "total_interviews_in_period": len(interviews),
            "time_period_days": days
        }


class FollowUpTemplateDAO:
    """Data Access Object for follow-up templates"""

    def __init__(self, db_client: AsyncDatabase):
        self.db = db_client
        self.collection = db_client["follow_up_templates"]

    async def create_template(self, data: dict) -> str:
        """Create a new follow-up template"""
        data["uuid"] = str(uuid.uuid4())
        data["date_created"] = datetime.now(timezone.utc)
        data["is_sent"] = False
        data["response_received"] = False
        
        await self.collection.insert_one(data)
        return data["uuid"]

    async def get_template(self, template_uuid: str) -> Optional[dict]:
        """Get a specific template"""
        doc = await self.collection.find_one({"uuid": template_uuid})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def get_templates_by_interview(self, interview_uuid: str) -> List[dict]:
        """Get all templates for an interview"""
        cursor = self.collection.find({"interview_uuid": interview_uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def mark_as_sent(self, template_uuid: str) -> int:
        """Mark template as sent"""
        result = await self.collection.update_one(
            {"uuid": template_uuid},
            {
                "$set": {
                    "is_sent": True,
                    "status": "sent",
                    "actual_sent_time": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count

    async def mark_response_received(self, template_uuid: str, sentiment: Optional[str] = None) -> int:
        """Mark that a response was received"""
        update_data = {
            "response_received": True,
            "response_received_at": datetime.now(timezone.utc)
        }
        if sentiment:
            update_data["response_sentiment"] = sentiment
        
        result = await self.collection.update_one(
            {"uuid": template_uuid},
            {"$set": update_data}
        )
        return result.matched_count

    async def get_user_sessions(self, user_uuid: str) -> List[dict]:
        """Get all sessions for a user"""
        cursor = self.collection.find({"user_uuid": user_uuid}).sort("date_created", -1)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_sessions_by_question(self, user_uuid: str, question_uuid: str) -> List[dict]:
        """Get all sessions for a specific question"""
        cursor = self.collection.find({
            "user_uuid": user_uuid,
            "question_uuid": question_uuid
        }).sort("date_created", 1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def update_analysis(self, session_uuid: str, analysis_data: dict) -> int:
        """Update session with analysis results"""
        result = await self.collection.update_one(
            {"uuid": session_uuid},
            {"$set": analysis_data}
        )
        return result.matched_count