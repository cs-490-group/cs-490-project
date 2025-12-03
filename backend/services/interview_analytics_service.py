"""
Interview Analytics Service
Implements UC-080: Interview Performance Analytics
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from mongo.dao_setup import db_client

class InterviewAnalyticsService:
    """Service for interview performance analytics (UC-080)"""
    
    def __init__(self):
        self.db = db_client
        self.schedules = db_client["interview_schedules"]
        self.mock_sessions = db_client["mock_interview_sessions"]
    
    async def get_performance_dashboard(self, user_uuid: str) -> Dict[str, Any]:
        """Get comprehensive analytics dashboard"""
        
        # Get all interviews for user
        all_interviews = await self.schedules.find({"uuid": user_uuid}).to_list(length=None)
        
        if not all_interviews:
            return {
                "total_interviews": 0,
                "completed_interviews": 0,
                "offers_received": 0,
                "conversion_rate": 0.0,
                "format_performance": {},
                "category_performance": [],
                "strongest_areas": [],
                "weakest_areas": [],
                "performance_trend": "insufficient_data",
                "recommendations": ["Schedule your first interview to start tracking performance!"]
            }
        
        # Calculate basic metrics
        total_interviews = len(all_interviews)
        completed = [i for i in all_interviews if i.get("status") == "completed"]
        completed_count = len(completed)
        
        offers = [i for i in completed if i.get("outcome") == "passed"]
        offers_count = len(offers)
        
        conversion_rate = (offers_count / completed_count * 100) if completed_count > 0 else 0
        
        # Format performance
        format_performance = {}
        for fmt in ["video", "phone", "in-person"]:
            fmt_interviews = [i for i in completed if i.get("location_type") == fmt]
            fmt_passed = [i for i in fmt_interviews if i.get("outcome") == "passed"]
            if fmt_interviews:
                format_performance[fmt] = (len(fmt_passed) / len(fmt_interviews) * 100)
        
        # Get mock interview data for category performance
        mock_sessions = await self.mock_sessions.find({
            "user_uuid": user_uuid,
            "status": "completed"
        }).to_list(length=None)
        
        category_performance = []
        category_scores = {}
        
        for session in mock_sessions:
            responses = session.get("responses", [])
            for response in responses:
                category = response.get("question_category", "unknown")
                score = response.get("coaching_score", 70)  # Default score
                
                if category not in category_scores:
                    category_scores[category] = []
                category_scores[category].append(score)
        
        # Calculate average scores per category
        for category, scores in category_scores.items():
            if scores:
                avg_score = sum(scores) / len(scores)
                category_performance.append({
                    "category": category.capitalize(),
                    "score": round(avg_score, 1)
                })
        
        # Determine strengths and weaknesses
        if category_performance:
            sorted_cats = sorted(category_performance, key=lambda x: x["score"], reverse=True)
            strongest_areas = [c["category"].lower() for c in sorted_cats[:2]]
            weakest_areas = [c["category"].lower() for c in sorted_cats[-2:]]
        else:
            strongest_areas = []
            weakest_areas = []
        
        # Performance trend
        performance_trend = self._calculate_trend(completed)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            conversion_rate=conversion_rate,
            weakest_areas=weakest_areas,
            format_performance=format_performance,
            mock_session_count=len(mock_sessions)
        )
        
        return {
            "total_interviews": total_interviews,
            "completed_interviews": completed_count,
            "offers_received": offers_count,
            "conversion_rate": round(conversion_rate, 2),
            "format_performance": format_performance,
            "category_performance": category_performance,
            "strongest_areas": strongest_areas,
            "weakest_areas": weakest_areas,
            "performance_trend": performance_trend,
            "recommendations": recommendations
        }
    
    async def get_trend_analysis(self, user_uuid: str, days: int = 90) -> Dict[str, Any]:
        """Get detailed trend analysis over time"""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        interviews = await self.schedules.find({
            "uuid": user_uuid,
            "status": "completed",
            "date_created": {"$gte": cutoff_date}
        }).sort("interview_datetime", 1).to_list(length=None)
        
        if len(interviews) < 2:
            return {
                "trend": "insufficient_data",
                "trend_data": [],
                "total_interviews_in_period": len(interviews),
                "time_period_days": days
            }
        
        # Group by month and calculate conversion rates
        monthly_data = {}
        for interview in interviews:
            date = interview.get("interview_datetime")
            if date:
                month_key = date.strftime("%Y-%m")
                if month_key not in monthly_data:
                    monthly_data[month_key] = {"total": 0, "passed": 0}
                
                monthly_data[month_key]["total"] += 1
                if interview.get("outcome") == "passed":
                    monthly_data[month_key]["passed"] += 1
        
        # Create trend data
        trend_data = []
        for month, data in sorted(monthly_data.items()):
            conversion = (data["passed"] / data["total"] * 100) if data["total"] > 0 else 0
            trend_data.append({
                "period": month,
                "conversion_rate": round(conversion, 1),
                "interviews": data["total"]
            })
        
        # Calculate overall trend
        if len(trend_data) >= 2:
            first_half = trend_data[:len(trend_data)//2]
            second_half = trend_data[len(trend_data)//2:]
            
            first_avg = sum(d["conversion_rate"] for d in first_half) / len(first_half)
            second_avg = sum(d["conversion_rate"] for d in second_half) / len(second_half)
            
            if second_avg > first_avg + 5:
                trend = "improving"
            elif second_avg < first_avg - 5:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "trend": trend,
            "trend_data": trend_data,
            "total_interviews_in_period": len(interviews),
            "time_period_days": days
        }
    
    async def get_comparison_analysis(
        self, 
        user_uuid: str, 
        compare_with: Optional[str] = None
    ) -> Dict[str, Any]:
        """Compare user's performance with benchmarks"""
        
        # Get user's stats
        user_interviews = await self.schedules.find({"uuid": user_uuid}).to_list(length=None)
        completed = [i for i in user_interviews if i.get("status") == "completed"]
        passed = [i for i in completed if i.get("outcome") == "passed"]
        
        user_conversion = (len(passed) / len(completed) * 100) if completed else 0
        
        # Industry benchmark (can be made more sophisticated)
        benchmark_rate = 25.0  # Industry average
        
        difference = user_conversion - benchmark_rate
        performance_vs_benchmark = "above" if difference > 0 else "below"
        
        return {
            "user_conversion_rate": round(user_conversion, 1),
            "benchmark_conversion_rate": benchmark_rate,
            "difference": round(difference, 1),
            "performance_vs_benchmark": performance_vs_benchmark
        }
    
    def _calculate_trend(self, completed_interviews: List[Dict]) -> str:
        """Calculate performance trend"""
        if len(completed_interviews) < 4:
            return "insufficient_data"
        
        # Sort by date
        sorted_interviews = sorted(
            completed_interviews, 
            key=lambda x: x.get("interview_datetime", datetime.min)
        )
        
        # Split into halves
        mid = len(sorted_interviews) // 2
        first_half = sorted_interviews[:mid]
        second_half = sorted_interviews[mid:]
        
        first_success = sum(1 for i in first_half if i.get("outcome") == "passed") / len(first_half)
        second_success = sum(1 for i in second_half if i.get("outcome") == "passed") / len(second_half)
        
        if second_success > first_success + 0.1:
            return "improving"
        elif second_success < first_success - 0.1:
            return "declining"
        else:
            return "stable"
    
    def _generate_recommendations(
        self,
        conversion_rate: float,
        weakest_areas: List[str],
        format_performance: Dict[str, float],
        mock_session_count: int
    ) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        if conversion_rate < 30:
            recommendations.append("Your conversion rate is below average. Focus on thorough preparation for each interview.")
        elif conversion_rate >= 70:
            recommendations.append("Excellent conversion rate! Keep up the great work.")
        
        if weakest_areas:
            recommendations.append(f"Practice {weakest_areas[0]} questions more - this is your weakest area.")
        
        if mock_session_count < 3:
            recommendations.append("Complete more mock interviews to improve your performance.")
        
        # Format-specific recommendations
        if format_performance:
            worst_format = min(format_performance.items(), key=lambda x: x[1])
            if worst_format[1] < 50:
                recommendations.append(f"Practice {worst_format[0]} interviews - your success rate is lower here.")
        
        if not recommendations:
            recommendations.append("Continue practicing and refining your interview skills!")
        
        return recommendations