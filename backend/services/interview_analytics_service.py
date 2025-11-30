"""
Interview Analytics Service
Provides performance metrics, trend analysis, and insights
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase


class InterviewAnalyticsService:
    """Service for analyzing interview performance and generating insights"""
    
    def __init__(self, db_client: AsyncIOMotorDatabase):
        self.db = db_client
        self.schedules_collection = db_client["interview_schedules"]
        self.mock_sessions_collection = db_client["mock_interview_sessions"]
        self.practice_sessions_collection = db_client["writing_practice_sessions"]
    
    async def get_performance_dashboard(self, user_uuid: str) -> Dict[str, Any]:
        """
        Get comprehensive performance dashboard data
        
        Returns metrics for display on analytics dashboard
        """
        # Get basic metrics
        total_interviews = await self.schedules_collection.count_documents({
            "user_uuid": user_uuid
        })
        
        completed_interviews = await self.schedules_collection.count_documents({
            "user_uuid": user_uuid,
            "status": "completed"
        })
        
        pending_interviews = await self.schedules_collection.count_documents({
            "user_uuid": user_uuid,
            "status": "scheduled"
        })
        
        cancelled_interviews = await self.schedules_collection.count_documents({
            "user_uuid": user_uuid,
            "status": "cancelled"
        })
        
        # Get outcome metrics
        passed_interviews = await self.schedules_collection.count_documents({
            "user_uuid": user_uuid,
            "status": "completed",
            "outcome": "passed"
        })
        
        rejected_interviews = await self.schedules_collection.count_documents({
            "user_uuid": user_uuid,
            "status": "completed",
            "outcome": "rejected"
        })
        
        # Calculate conversion rate
        offer_conversion_rate = (
            (passed_interviews / completed_interviews * 100)
            if completed_interviews > 0 else 0
        )
        
        # Get performance by format
        format_performance = await self._get_format_performance(user_uuid)
        
        # Get performance by company type
        company_performance = await self._get_company_performance(user_uuid)
        
        # Get mock interview data
        mock_performance = await self._get_mock_interview_performance(user_uuid)
        
        # Get trend
        trend = await self._calculate_trend(user_uuid)
        
        # Get strongest/weakest areas
        strengths_weaknesses = await self._analyze_strengths_weaknesses(user_uuid)
        
        return {
            "total_interviews": total_interviews,
            "completed_interviews": completed_interviews,
            "pending_interviews": pending_interviews,
            "cancelled_interviews": cancelled_interviews,
            "passed_interviews": passed_interviews,
            "rejected_interviews": rejected_interviews,
            "offer_conversion_rate": round(offer_conversion_rate, 2),
            "format_performance": format_performance,
            "company_performance": company_performance,
            "mock_interview_performance": mock_performance,
            "performance_trend": trend,
            "strongest_areas": strengths_weaknesses["strengths"],
            "weakest_areas": strengths_weaknesses["weaknesses"],
            "recommendations": await self._generate_recommendations(user_uuid, strengths_weaknesses)
        }
    
    async def _get_format_performance(self, user_uuid: str) -> Dict[str, float]:
        """Calculate success rate by interview format"""
        formats = ["phone", "video", "in-person"]
        performance = {}
        
        for fmt in formats:
            total = await self.schedules_collection.count_documents({
                "user_uuid": user_uuid,
                "location_type": fmt,
                "status": "completed"
            })
            
            passed = await self.schedules_collection.count_documents({
                "user_uuid": user_uuid,
                "location_type": fmt,
                "status": "completed",
                "outcome": "passed"
            })
            
            performance[fmt] = round((passed / total * 100) if total > 0 else 0, 2)
        
        return performance
    
    async def _get_company_performance(self, user_uuid: str) -> Dict[str, Any]:
        """
        Analyze performance by company type
        This would require company metadata - for now return placeholder
        """
        # In production: Join with job applications to get company size, industry
        return {
            "startup": {
                "count": 0,
                "success_rate": 0
            },
            "midsize": {
                "count": 0,
                "success_rate": 0
            },
            "enterprise": {
                "count": 0,
                "success_rate": 0
            }
        }
    
    async def _get_mock_interview_performance(self, user_uuid: str) -> Dict[str, Any]:
        """Get performance metrics from mock interviews"""
        cursor = self.mock_sessions_collection.find({
            "user_uuid": user_uuid,
            "status": "completed"
        })
        
        sessions = []
        async for doc in cursor:
            sessions.append(doc)
        
        if not sessions:
            return {
                "total_sessions": 0,
                "avg_completion_rate": 0,
                "avg_response_quality": 0
            }
        
        total_completion = sum(
            len(s.get("responses", [])) / len(s.get("question_sequence", [1])) * 100
            for s in sessions
        )
        avg_completion = total_completion / len(sessions)
        
        # Calculate average response quality (word count, timing)
        all_responses = []
        for session in sessions:
            all_responses.extend(session.get("responses", []))
        
        avg_word_count = (
            sum(r.get("word_count", 0) for r in all_responses) / len(all_responses)
            if all_responses else 0
        )
        
        return {
            "total_sessions": len(sessions),
            "avg_completion_rate": round(avg_completion, 2),
            "avg_word_count": round(avg_word_count, 2),
            "total_practice_questions": len(all_responses)
        }
    
    async def _calculate_trend(self, user_uuid: str) -> str:
        """Calculate performance trend over time"""
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        cursor = self.schedules_collection.find({
            "user_uuid": user_uuid,
            "status": "completed",
            "interview_datetime": {"$gte": cutoff_date}
        }).sort("interview_datetime", 1)
        
        interviews = []
        async for doc in cursor:
            interviews.append({
                "date": doc["interview_datetime"],
                "outcome": doc.get("outcome")
            })
        
        if len(interviews) < 3:
            return "insufficient_data"
        
        # Split into two halves and compare
        midpoint = len(interviews) // 2
        recent_half = interviews[midpoint:]
        earlier_half = interviews[:midpoint]
        
        recent_success = sum(1 for i in recent_half if i["outcome"] == "passed") / len(recent_half)
        earlier_success = sum(1 for i in earlier_half if i["outcome"] == "passed") / len(earlier_half)
        
        if recent_success > earlier_success + 0.15:
            return "improving"
        elif recent_success < earlier_success - 0.15:
            return "declining"
        else:
            return "stable"
    
    async def _analyze_strengths_weaknesses(self, user_uuid: str) -> Dict[str, List[str]]:
        """Analyze strongest and weakest areas from mock interviews"""
        cursor = self.mock_sessions_collection.find({
            "user_uuid": user_uuid,
            "status": "completed"
        })
        
        category_performance = {
            "behavioral": [],
            "technical": [],
            "situational": [],
            "company": []
        }
        
        async for session in cursor:
            responses = session.get("responses", [])
            for response in responses:
                category = response.get("question_category")
                word_count = response.get("word_count", 0)
                duration = response.get("response_duration_seconds", 0)
                
                # Simple quality score based on word count and time
                quality_score = min(100, (word_count / 100) * 50 + (min(duration, 180) / 180) * 50)
                
                if category in category_performance:
                    category_performance[category].append(quality_score)
        
        # Calculate averages
        category_avgs = {
            cat: sum(scores) / len(scores) if scores else 0
            for cat, scores in category_performance.items()
        }
        
        # Identify strengths (above 70) and weaknesses (below 50)
        strengths = [cat for cat, avg in category_avgs.items() if avg > 70]
        weaknesses = [cat for cat, avg in category_avgs.items() if avg < 50 and avg > 0]
        
        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "scores": category_avgs
        }
    
    async def _generate_recommendations(
        self,
        user_uuid: str,
        strengths_weaknesses: Dict[str, List[str]]
    ) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        weaknesses = strengths_weaknesses["weaknesses"]
        
        if "behavioral" in weaknesses:
            recommendations.append(
                "Practice more behavioral questions using the STAR framework"
            )
        
        if "technical" in weaknesses:
            recommendations.append(
                "Focus on technical interview preparation and coding practice"
            )
        
        if "situational" in weaknesses:
            recommendations.append(
                "Work on situational questions and problem-solving scenarios"
            )
        
        # Check mock interview completion
        mock_count = await self.mock_sessions_collection.count_documents({
            "user_uuid": user_uuid,
            "status": "completed"
        })
        
        if mock_count < 3:
            recommendations.append(
                "Complete more mock interviews to build confidence and identify improvement areas"
            )
        
        # Check preparation task completion
        schedules_cursor = self.schedules_collection.find({
            "user_uuid": user_uuid,
            "status": "scheduled"
        })
        
        low_prep_count = 0
        async for schedule in schedules_cursor:
            if schedule.get("preparation_completion_percentage", 0) < 70:
                low_prep_count += 1
        
        if low_prep_count > 0:
            recommendations.append(
                f"Complete preparation checklists for {low_prep_count} upcoming interview(s)"
            )
        
        if not recommendations:
            recommendations.append(
                "Keep up the great work! Continue practicing to maintain your strong performance."
            )
        
        return recommendations
    
    async def get_trend_analysis(self, user_uuid: str, timeframe_days: int = 90) -> Dict[str, Any]:
        """
        Get detailed trend analysis over a specific timeframe
        
        Args:
            user_uuid: User ID
            timeframe_days: Number of days to analyze (default 90)
        
        Returns:
            Detailed trend data with timestamps
        """
        cutoff_date = datetime.utcnow() - timedelta(days=timeframe_days)
        
        cursor = self.schedules_collection.find({
            "user_uuid": user_uuid,
            "status": "completed",
            "interview_datetime": {"$gte": cutoff_date}
        }).sort("interview_datetime", 1)
        
        data_points = []
        async for doc in cursor:
            data_points.append({
                "date": doc["interview_datetime"].isoformat(),
                "outcome": doc.get("outcome"),
                "location_type": doc.get("location_type")
            })
        
        # Calculate rolling average (last 5 interviews)
        rolling_success_rates = []
        for i in range(4, len(data_points)):
            window = data_points[i-4:i+1]
            success_count = sum(1 for d in window if d["outcome"] == "passed")
            rolling_success_rates.append({
                "date": data_points[i]["date"],
                "success_rate": (success_count / 5) * 100
            })
        
        return {
            "timeframe_days": timeframe_days,
            "total_interviews": len(data_points),
            "data_points": data_points,
            "rolling_success_rate": rolling_success_rates,
            "trend": await self._calculate_trend(user_uuid)
        }
    
    async def get_comparison_analysis(self, user_uuid: str, compare_user_uuid: Optional[str] = None) -> Dict[str, Any]:
        """
        Compare user's performance with another user or industry benchmarks
        
        Args:
            user_uuid: Primary user
            compare_user_uuid: Optional second user for comparison
        
        Returns:
            Comparison metrics
        """
        user1_metrics = await self.get_performance_dashboard(user_uuid)
        
        if compare_user_uuid:
            user2_metrics = await self.get_performance_dashboard(compare_user_uuid)
            
            return {
                "user1": {
                    "uuid": user_uuid,
                    "metrics": user1_metrics
                },
                "user2": {
                    "uuid": compare_user_uuid,
                    "metrics": user2_metrics
                },
                "comparison": {
                    "conversion_rate_diff": (
                        user1_metrics["offer_conversion_rate"] -
                        user2_metrics["offer_conversion_rate"]
                    ),
                    "total_interviews_diff": (
                        user1_metrics["total_interviews"] -
                        user2_metrics["total_interviews"]
                    )
                }
            }
        else:
            # Compare with industry benchmarks (placeholder values)
            industry_benchmarks = {
                "offer_conversion_rate": 25.0,  # Industry average
                "avg_interviews_per_offer": 4.0
            }
            
            return {
                "user": user1_metrics,
                "industry_benchmarks": industry_benchmarks,
                "comparison": {
                    "conversion_rate_vs_industry": (
                        user1_metrics["offer_conversion_rate"] -
                        industry_benchmarks["offer_conversion_rate"]
                    )
                }
            }