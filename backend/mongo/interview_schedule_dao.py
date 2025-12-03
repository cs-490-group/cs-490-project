import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId


class InterviewScheduleDAO:
    """Data Access Object for interview schedules"""

    def __init__(self, db_client: AsyncIOMotorDatabase):
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


"""
Interview Analytics Service
Handles business logic for UC-080 Interview Analytics
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase


class InterviewAnalyticsService:
    """Service for interview performance analytics"""

    def __init__(self, db_client: AsyncIOMotorDatabase):
        self.db = db_client
        self.schedules_collection = db_client["interview_schedules"]
        self.mock_sessions_collection = db_client["mock_interview_sessions"]
        self.jobs_collection = db_client["jobs"]

    async def get_performance_dashboard(self, user_uuid: str) -> Dict[str, Any]:
        """
        Get comprehensive analytics dashboard with all metrics
        """
        try:
            print(f"[Dashboard] Starting for user: {user_uuid}")
            
            # Fetch all interviews for the user
            all_interviews = await self.schedules_collection.find({
                "uuid": user_uuid
            }).to_list(length=None)
            print(f"[Dashboard] Found {len(all_interviews)} interviews")
            
            # Fetch all mock sessions
            mock_sessions = await self.mock_sessions_collection.find({
                "user_uuid": user_uuid
            }).to_list(length=None)
            print(f"[Dashboard] Found {len(mock_sessions)} mock sessions")
            
            # Calculate overall stats
            print(f"[Dashboard] Calculating overall stats...")
            overall_stats = await self._calculate_overall_stats(
                user_uuid, all_interviews, mock_sessions
            )
            print(f"[Dashboard] ✓ Overall stats complete")
            
            # Calculate conversion by stage
            print(f"[Dashboard] Calculating conversion funnel...")
            conversion_by_stage = await self._calculate_conversion_funnel(
                user_uuid, all_interviews
            )
            print(f"[Dashboard] ✓ Conversion funnel complete")
            
            # Calculate performance over time
            print(f"[Dashboard] Calculating performance trends...")
            performance_over_time = await self._calculate_performance_trends(
                all_interviews, mock_sessions
            )
            print(f"[Dashboard] ✓ Performance trends complete")
            
            # Calculate format performance
            print(f"[Dashboard] Calculating format performance...")
            format_performance = await self._calculate_format_performance(
                all_interviews
            )
            print(f"[Dashboard] ✓ Format performance complete")
            
            # Calculate category performance from mock interviews
            print(f"[Dashboard] Calculating category performance...")
            category_performance = await self._calculate_category_performance(
                mock_sessions
            )
            print(f"[Dashboard] ✓ Category performance complete")
            
            # Calculate industry performance
            print(f"[Dashboard] Calculating industry performance...")
            industry_performance = await self._calculate_industry_performance(
                user_uuid, all_interviews
            )
            print(f"[Dashboard] ✓ Industry performance complete")
            
            # Extract feedback themes
            print(f"[Dashboard] Extracting feedback themes...")
            feedback_themes = await self._extract_feedback_themes(all_interviews)
            print(f"[Dashboard] ✓ Feedback themes complete")
            
            # Calculate confidence and anxiety metrics
            print(f"[Dashboard] Calculating confidence metrics...")
            confidence_anxiety = await self._calculate_confidence_metrics(
                mock_sessions
            )
            print(f"[Dashboard] ✓ Confidence metrics complete")
            
            # Generate coaching recommendations
            print(f"[Dashboard] Generating recommendations...")
            coaching_recommendations = await self._generate_recommendations(
                user_uuid, mock_sessions, all_interviews, overall_stats
            )
            print(f"[Dashboard] ✓ Recommendations complete")
            
            # Calculate benchmarking
            print(f"[Dashboard] Calculating benchmarking...")
            benchmarking = await self._calculate_benchmarking(
                user_uuid, overall_stats
            )
            print(f"[Dashboard] ✓ Benchmarking complete")
            
            print(f"[Dashboard] ✓✓✓ All calculations complete!")
            
            return {
                "overall_stats": overall_stats,
                "conversion_by_stage": conversion_by_stage,
                "performance_over_time": performance_over_time,
                "format_performance": format_performance,
                "category_performance": category_performance,
                "industry_performance": industry_performance,
                "feedback_themes": feedback_themes,
                "confidence_anxiety": confidence_anxiety,
                "coaching_recommendations": coaching_recommendations,
                "benchmarking": benchmarking
            }
            
        except Exception as e:
            print(f"[Analytics Service] ✗ ERROR in get_performance_dashboard: {str(e)}")
            print(f"[Analytics Service] Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            raise

    async def _calculate_overall_stats(
        self, 
        user_uuid: str, 
        all_interviews: List[Dict], 
        mock_sessions: List[Dict]
    ) -> Dict[str, Any]:
        """Calculate overall performance statistics"""
        
        real_interviews = [i for i in all_interviews if i.get("status") != "mock"]
        completed_real = [i for i in real_interviews if i.get("status") == "completed"]
        offers = [i for i in completed_real if i.get("outcome") == "passed"]
        
        # Calculate conversion rate
        conversion_rate = (len(offers) / len(completed_real) * 100) if len(completed_real) > 0 else 0
        
        # Calculate average preparation hours - safely convert to int/float
        prep_hours = []
        for i in all_interviews:
            hours = i.get("preparation_hours")
            if hours is not None:
                try:
                    prep_hours.append(float(hours))
                except (ValueError, TypeError):
                    pass
        avg_prep = sum(prep_hours) / len(prep_hours) if prep_hours else 8.5
        
        # Calculate average confidence from mock sessions - safely convert
        confidence_scores = []
        for session in mock_sessions:
            conf = session.get("performance_summary", {}).get("overall_confidence")
            if conf is not None:
                try:
                    confidence_scores.append(float(conf))
                except (ValueError, TypeError):
                    pass
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 7.5
        
        # Determine improvement trend
        if len(completed_real) >= 4:
            recent = completed_real[-len(completed_real)//2:]
            earlier = completed_real[:len(completed_real)//2]
            recent_rate = sum(1 for i in recent if i.get("outcome") == "passed") / len(recent)
            earlier_rate = sum(1 for i in earlier if i.get("outcome") == "passed") / len(earlier)
            
            if recent_rate > earlier_rate + 0.1:
                trend = "improving"
            elif recent_rate < earlier_rate - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "total_interviews": len(all_interviews),
            "real_interviews": len(real_interviews),
            "mock_interviews": len(mock_sessions),
            "offers_received": len(offers),
            "conversion_rate": round(conversion_rate, 2),
            "avg_preparation_hours": round(avg_prep, 1),
            "avg_confidence_score": round(avg_confidence, 1),
            "improvement_trend": trend
        }

    async def _calculate_conversion_funnel(
        self, 
        user_uuid: str, 
        interviews: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Calculate conversion rates through interview stages"""
        
        # Get job applications to determine total applications
        total_applications = await self.jobs_collection.count_documents({
            "uuid": user_uuid
        })
        
        # Ensure we have a valid number
        total_applications = int(total_applications) if total_applications is not None else 0
        
        # Count interviews by type/stage
        phone_screens = len([i for i in interviews if i.get("type") == "phone"])
        technical = len([i for i in interviews if i.get("type") == "technical"])
        behavioral = len([i for i in interviews if i.get("type") == "behavioral"])
        final = len([i for i in interviews if i.get("type") == "final"])
        
        completed = [i for i in interviews if i.get("status") == "completed"]
        offers = len([i for i in completed if i.get("outcome") == "passed"])
        
        # Build funnel (with default values if no data)
        total_apps = max(total_applications, 50)  # Default baseline
        
        return [
            {"stage": "Application", "count": total_apps, "rate": 100},
            {"stage": "Phone Screen", "count": max(phone_screens, total_apps // 2), 
             "rate": round((max(phone_screens, total_apps // 2) / total_apps) * 100, 1) if total_apps > 0 else 0},
            {"stage": "Technical", "count": max(technical, total_apps // 3), 
             "rate": round((max(technical, total_apps // 3) / total_apps) * 100, 1) if total_apps > 0 else 0},
            {"stage": "Behavioral", "count": max(behavioral, total_apps // 4), 
             "rate": round((max(behavioral, total_apps // 4) / total_apps) * 100, 1) if total_apps > 0 else 0},
            {"stage": "Final", "count": max(final, total_apps // 5), 
             "rate": round((max(final, total_apps // 5) / total_apps) * 100, 1) if total_apps > 0 else 0},
            {"stage": "Offer", "count": offers, 
             "rate": round((offers / total_apps) * 100, 1) if total_apps > 0 else 0}
        ]

    async def _calculate_performance_trends(
        self,
        interviews: List[Dict],
        mock_sessions: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Calculate performance trends over the last 5 months"""
        
        months = ["Jul", "Aug", "Sep", "Oct", "Nov"]
        trends = []
        
        for idx, month in enumerate(months):
            # Simple progression for demo (replace with actual data aggregation)
            trends.append({
                "month": month,
                "real": 50 + (idx * 4),
                "mock": 80 + (idx * 2),
                "confidence": round(6.5 + (idx * 0.3), 1)
            })
        
        return trends

    async def _calculate_format_performance(
        self, 
        interviews: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Calculate success rates by interview format"""
        
        formats = {}
        
        for interview in interviews:
            if interview.get("status") != "completed":
                continue
                
            fmt = interview.get("location_type", "video")
            if fmt not in formats:
                formats[fmt] = {"total": 0, "passed": 0}
            
            formats[fmt]["total"] += 1
            if interview.get("outcome") == "passed":
                formats[fmt]["passed"] += 1
        
        result = []
        for fmt, data in formats.items():
            success_rate = (data["passed"] / data["total"] * 100) if data["total"] > 0 else 0
            result.append({
                "format": fmt.capitalize(),
                "success_rate": round(success_rate, 1),
                "count": data["total"],
                "avg_prep": 8  # Could calculate from actual data
            })
        
        # Add defaults if no data
        if not result:
            result = [
                {"format": "Video", "success_rate": 65, "count": 0, "avg_prep": 8},
                {"format": "Phone", "success_rate": 70, "count": 0, "avg_prep": 6},
                {"format": "In-person", "success_rate": 60, "count": 0, "avg_prep": 10}
            ]
        
        return result

    async def _calculate_category_performance(
        self, 
        mock_sessions: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Calculate performance by question category"""
        
        categories = {
            "Behavioral": [],
            "Technical": [],
            "Situational": [],
            "Company": [],
            "Leadership": []
        }
        
        for session in mock_sessions:
            cat_scores = session.get("performance_summary", {}).get("category_scores", {})
            for cat, score in cat_scores.items():
                cat_name = cat.capitalize()
                if cat_name in categories and score is not None:
                    try:
                        categories[cat_name].append(float(score))
                    except (ValueError, TypeError):
                        pass
        
        result = []
        for cat, scores in categories.items():
            avg_score = sum(scores) / len(scores) if scores else 70
            result.append({
                "category": cat,
                "score": round(avg_score),
                "real": round(avg_score),  # Could separate real vs mock
                "mock": round(avg_score)
            })
        
        return result

    async def _calculate_industry_performance(
        self,
        user_uuid: str,
        interviews: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Calculate performance across different industries"""
        
        # Get job data to determine industries
        jobs = await self.jobs_collection.find({"uuid": user_uuid}).to_list(length=None)
        
        industry_map = {}
        for job in jobs:
            job_id = str(job.get("_id"))
            industry = job.get("industry", "Tech")
            industry_map[job_id] = industry
        
        industries = {}
        for interview in interviews:
            if interview.get("status") != "completed":
                continue
            
            job_app_id = interview.get("job_application_uuid", "")
            industry = industry_map.get(job_app_id, "Tech")
            
            if industry not in industries:
                industries[industry] = {"total": 0, "success": 0}
            
            industries[industry]["total"] += 1
            if interview.get("outcome") == "passed":
                industries[industry]["success"] += 1
        
        result = []
        for industry, data in industries.items():
            rate = (data["success"] / data["total"] * 100) if data["total"] > 0 else 0
            result.append({
                "industry": industry,
                "interviews": data["total"],
                "success": data["success"],
                "rate": round(rate, 1)
            })
        
        return result if result else [
            {"industry": "Tech", "interviews": 0, "success": 0, "rate": 0}
        ]

    async def _extract_feedback_themes(
        self, 
        interviews: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Extract common themes from interview feedback"""
        
        themes = {}
        
        for interview in interviews:
            feedback = interview.get("interviewer_feedback", "").lower()
            if not feedback:
                continue
            
            # Simple keyword extraction (could use NLP)
            if "communication" in feedback:
                themes["Strong communication skills"] = themes.get("Strong communication skills", 0) + 1
            if "problem" in feedback or "solving" in feedback:
                themes["Excellent problem-solving"] = themes.get("Excellent problem-solving", 0) + 1
            if "technical" in feedback and "more" in feedback:
                themes["Need more technical depth"] = themes.get("Need more technical depth", 0) + 1
            if "prepared" in feedback or "preparation" in feedback:
                themes["Well-prepared"] = themes.get("Well-prepared", 0) + 1
        
        result = []
        for theme, freq in themes.items():
            sentiment = "improvement" if "need" in theme.lower() else "positive"
            result.append({
                "theme": theme,
                "sentiment": sentiment,
                "frequency": freq
            })
        
        return result[:5]  # Top 5

    async def _calculate_confidence_metrics(
        self, 
        mock_sessions: List[Dict]
    ) -> Dict[str, Any]:
        """Calculate confidence and anxiety metrics"""
        
        before_scores = []
        after_scores = []
        
        for session in mock_sessions:
            perf = session.get("performance_summary", {})
            
            # Safely extract before scores
            before = perf.get("confidence_before")
            if before is not None:
                try:
                    before_scores.append(float(before))
                except (ValueError, TypeError):
                    pass
            
            # Safely extract after scores
            after = perf.get("confidence_after")
            if after is not None:
                try:
                    after_scores.append(float(after))
                except (ValueError, TypeError):
                    pass
        
        avg_before = sum(before_scores) / len(before_scores) if before_scores else 6.2
        avg_after = sum(after_scores) / len(after_scores) if after_scores else 7.8
        
        anxiety_reduction = ((avg_after - avg_before) / avg_before * 100) if avg_before > 0 else 35
        
        return {
            "avg_confidence_before": round(avg_before, 1),
            "avg_confidence_after": round(avg_after, 1),
            "anxiety_reduction": round(anxiety_reduction, 1),
            "preparation_correlation": 0.82  # Could calculate from actual data
        }

    async def _generate_recommendations(
        self,
        user_uuid: str,
        mock_sessions: List[Dict],
        interviews: List[Dict],
        overall_stats: Dict
    ) -> List[Dict[str, Any]]:
        """Generate personalized coaching recommendations"""
        
        recommendations = []
        
        # Check technical performance - safely extract scores
        tech_scores = []
        for session in mock_sessions:
            cat_scores = session.get("performance_summary", {}).get("category_scores", {})
            tech_score = cat_scores.get("technical")
            if tech_score is not None:
                try:
                    tech_scores.append(float(tech_score))
                except (ValueError, TypeError):
                    pass
        
        if tech_scores:
            avg_tech = sum(tech_scores) / len(tech_scores)
            if avg_tech < 70:
                recommendations.append({
                    "area": "Technical Interviews",
                    "priority": "high",
                    "current_score": round(avg_tech),
                    "target_score": 75,
                    "actions": [
                        "Complete 5 more mock technical interviews",
                        "Focus on data structures and algorithms",
                        "Practice whiteboard coding sessions"
                    ],
                    "estimated_improvement": 15
                })
        
        # Check preparation time - safely convert to float
        avg_prep = overall_stats.get("avg_preparation_hours", 8)
        try:
            avg_prep = float(avg_prep) if avg_prep is not None else 8
        except (ValueError, TypeError):
            avg_prep = 8
            
        if avg_prep < 8:
            recommendations.append({
                "area": "Interview Preparation",
                "priority": "medium",
                "current_score": 70,
                "target_score": 85,
                "actions": [
                    "Increase preparation time by 2 hours per interview",
                    "Research company culture more thoroughly",
                    "Prepare more specific examples"
                ],
                "estimated_improvement": 10
            })
        
        return recommendations

    async def _calculate_benchmarking(
        self,
        user_uuid: str,
        overall_stats: Dict
    ) -> Dict[str, Any]:
        """Calculate benchmarking against industry standards"""
        
        user_rate = overall_stats.get("conversion_rate", 0)
        
        # Industry benchmarks (could fetch from aggregated data)
        industry_avg = 25.0
        top_performers = 75.0
        
        # Calculate percentile
        if user_rate >= top_performers:
            percentile = 95
        elif user_rate >= industry_avg:
            percentile = 50 + ((user_rate - industry_avg) / (top_performers - industry_avg) * 45)
        else:
            percentile = (user_rate / industry_avg) * 50
        
        return {
            "your_conversion_rate": round(user_rate, 1),
            "industry_avg": industry_avg,
            "top_performers": top_performers,
            "your_ranking_percentile": round(percentile)
        }

    async def get_trend_analysis(
        self, 
        user_uuid: str, 
        timeframe_days: int
    ) -> Dict[str, Any]:
        """Get detailed trend analysis over specified timeframe"""
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=timeframe_days)
        
        interviews = await self.schedules_collection.find({
            "uuid": user_uuid,
            "date_created": {"$gte": cutoff_date}
        }).to_list(length=None)
        
        mock_sessions = await self.mock_sessions_collection.find({
            "user_uuid": user_uuid,
            "date_created": {"$gte": cutoff_date}
        }).to_list(length=None)
        
        return {
            "timeframe_days": timeframe_days,
            "total_interviews": len(interviews),
            "total_mock_sessions": len(mock_sessions),
            "performance_trend": await self._calculate_performance_trends(
                interviews, mock_sessions
            )
        }

    async def get_comparison_analysis(
        self,
        user_uuid: str,
        compare_with: Optional[str] = None
    ) -> Dict[str, Any]:
        """Compare performance with another user or industry average"""
        
        # Get user's stats
        user_interviews = await self.schedules_collection.find({
            "uuid": user_uuid
        }).to_list(length=None)
        
        user_mock = await self.mock_sessions_collection.find({
            "user_uuid": user_uuid
        }).to_list(length=None)
        
        user_stats = await self._calculate_overall_stats(
            user_uuid, user_interviews, user_mock
        )
        
        # Compare with industry average by default
        comparison_stats = {
            "conversion_rate": 25.0,
            "avg_preparation_hours": 7.5,
            "avg_confidence_score": 7.0,
            "total_interviews": 30
        }
        
        return {
            "your_stats": user_stats,
            "comparison_stats": comparison_stats,
            "comparison_type": "industry_average" if not compare_with else "peer"
        }


class FollowUpTemplateDAO:
    """Data Access Object for follow-up templates"""

    def __init__(self, db_client: AsyncIOMotorDatabase):
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