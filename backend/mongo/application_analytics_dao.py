from mongo.dao_setup import db_client
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from collections import defaultdict

class ApplicationAnalyticsDAO:
    """Data Access Object for application analytics (UC-072)"""
    
    def __init__(self):
        self.jobs_collection = db_client.get_collection("jobs")
        self.analytics_collection = db_client.get_collection("application_analytics")
        
    # ============================================
    # APPLICATION FUNNEL ANALYTICS (UC-072)
    # ============================================
    
    async def get_application_funnel(self, user_uuid: str, date_range: Dict = None) -> Dict:
        """
        Calculate application funnel metrics
        Returns: {applied, screening, interview, offer, conversion_rates}
        """
        query = {"uuid": user_uuid, "archived": {"$ne": True}}
        
        if date_range:
            query["date_created"] = {
                "$gte": date_range.get("start"),
                "$lte": date_range.get("end")
            }
        
        # Get all applications
        cursor = self.jobs_collection.find(query)
        applications = []
        async for doc in cursor:
            applications.append(doc)
        
        # Count by stage
        stage_counts = {
            "applied": 0,
            "screening": 0,
            "interview": 0,
            "offer": 0,
            "rejected": 0
        }
        
        for app in applications:
            status = app.get("status", "").lower()
            if status == "applied":
                stage_counts["applied"] += 1
            elif status == "screening":
                stage_counts["screening"] += 1
            elif status == "interview":
                stage_counts["interview"] += 1
            elif status == "offer":
                stage_counts["offer"] += 1
            elif status == "rejected":
                stage_counts["rejected"] += 1
        
        total = len(applications)
        
        # Calculate conversion rates
        conversion_rates = {}
        if total > 0:
            conversion_rates["applied_to_screening"] = round((stage_counts["screening"] / total) * 100, 2) if total else 0
            conversion_rates["screening_to_interview"] = round((stage_counts["interview"] / stage_counts["screening"]) * 100, 2) if stage_counts["screening"] else 0
            conversion_rates["interview_to_offer"] = round((stage_counts["offer"] / stage_counts["interview"]) * 100, 2) if stage_counts["interview"] else 0
            conversion_rates["overall"] = round((stage_counts["offer"] / total) * 100, 2) if total else 0
        
        return {
            "total_applications": total,
            "stage_counts": stage_counts,
            "conversion_rates": conversion_rates,
            "rejection_rate": round((stage_counts["rejected"] / total) * 100, 2) if total else 0
        }
    
    # ============================================
    # TIME-TO-RESPONSE TRACKING (UC-072)
    # ============================================
    
    async def calculate_response_times(self, user_uuid: str, group_by: str = None) -> Dict:
        """
        Calculate average time to response
        group_by: 'company', 'industry', or None for overall
        """
        cursor = self.jobs_collection.find({
            "uuid": user_uuid,
            "status_history": {"$exists": True, "$ne": []},
            "archived": {"$ne": True}
        })
        
        response_times = defaultdict(list)
        
        async for job in cursor:
            status_history = job.get("status_history", [])
            if len(status_history) < 2:
                continue
            
            # Calculate time from Applied to first response
            applied_time = None
            first_response_time = None
            
            for entry in status_history:
                if isinstance(entry, list) and len(entry) >= 2:
                    status, timestamp = entry[0], entry[1]
                    if status.lower() == "applied" and not applied_time:
                        applied_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    elif status.lower() in ["screening", "interview", "offer", "rejected"] and not first_response_time:
                        first_response_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        break
            
            if applied_time and first_response_time:
                days_to_response = (first_response_time - applied_time).days
                
                # Group by specified field
                if group_by == "company":
                    key = job.get("company", "Unknown")
                    if isinstance(key, dict):
                        key = key.get("name", "Unknown")
                elif group_by == "industry":
                    key = job.get("industry", "Unknown")
                else:
                    key = "overall"
                
                response_times[key].append(days_to_response)
        
        # Calculate averages
        averages = {}
        for key, times in response_times.items():
            if times:
                averages[key] = {
                    "average_days": round(sum(times) / len(times), 1),
                    "min_days": min(times),
                    "max_days": max(times),
                    "sample_size": len(times)
                }
        
        return averages
    
    # ============================================
    # SUCCESS RATE ANALYSIS (UC-072)
    # ============================================
    
    async def analyze_success_rates(self, user_uuid: str, group_by: str = None) -> Dict:
        """
        Analyze success rates by different approaches
        group_by: 'industry', 'job_type', 'materials', or None
        """
        cursor = self.jobs_collection.find({
            "uuid": user_uuid,
            "archived": {"$ne": True}
        })
        
        success_by_group = defaultdict(lambda: {"total": 0, "offers": 0, "interviews": 0})
        
        async for job in cursor:
            # Determine grouping key
            if group_by == "industry":
                key = job.get("industry", "Unknown")
            elif group_by == "job_type":
                key = job.get("job_type", "Unknown")
            elif group_by == "materials":
                materials = job.get("materials", {})
                has_resume = bool(materials.get("resume_id"))
                has_cover_letter = bool(materials.get("cover_letter_id"))
                if has_resume and has_cover_letter:
                    key = "Resume + Cover Letter"
                elif has_resume:
                    key = "Resume Only"
                elif has_cover_letter:
                    key = "Cover Letter Only"
                else:
                    key = "No Materials"
            else:
                key = "overall"
            
            status = job.get("status", "").lower()
            success_by_group[key]["total"] += 1
            
            if status == "offer":
                success_by_group[key]["offers"] += 1
            if status in ["interview", "offer"]:
                success_by_group[key]["interviews"] += 1
        
        # Calculate rates
        results = {}
        for key, data in success_by_group.items():
            total = data["total"]
            if total > 0:
                results[key] = {
                    "total_applications": total,
                    "interview_rate": round((data["interviews"] / total) * 100, 2),
                    "offer_rate": round((data["offers"] / total) * 100, 2),
                    "interviews": data["interviews"],
                    "offers": data["offers"]
                }
        
        return results
    
    # ============================================
    # VOLUME AND FREQUENCY TRENDS (UC-072)
    # ============================================
    
    async def get_application_trends(self, user_uuid: str, days: int = 90) -> Dict:
        """Get application volume and frequency trends"""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        cursor = self.jobs_collection.find({
            "uuid": user_uuid,
            "date_created": {"$gte": cutoff_date},
            "archived": {"$ne": True}
        }).sort("date_created", 1)
        
        # Group by week
        weekly_counts = defaultdict(int)
        applications_by_status = defaultdict(int)
        
        async for job in cursor:
            created = job.get("date_created")
            if created:
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                week_start = created - timedelta(days=created.weekday())
                week_key = week_start.strftime("%Y-%m-%d")
                weekly_counts[week_key] += 1
                
                status = job.get("status", "Unknown")
                applications_by_status[status] += 1
        
        # Calculate weekly average
        total_apps = sum(weekly_counts.values())
        weeks = len(weekly_counts) if weekly_counts else 1
        weekly_average = round(total_apps / weeks, 1)
        
        # Sort weekly data
        sorted_weeks = sorted(weekly_counts.items())
        
        return {
            "total_applications": total_apps,
            "time_period_days": days,
            "weekly_average": weekly_average,
            "weekly_breakdown": sorted_weeks,
            "by_status": dict(applications_by_status)
        }
    
    # ============================================
    # PERFORMANCE BENCHMARKING (UC-072)
    # ============================================
    
    async def get_performance_benchmarks(self, user_uuid: str) -> Dict:
        """Compare user's performance to industry averages"""
        user_stats = await self.get_application_funnel(user_uuid)
        
        # Industry benchmarks (these would ideally come from aggregated data)
        industry_benchmarks = {
            "average_response_time_days": 14,
            "average_interview_rate": 15.0,  # 15% of applications lead to interviews
            "average_offer_rate": 3.0,  # 3% of applications lead to offers
            "average_applications_per_week": 10
        }
        
        # Calculate user's metrics
        user_response_times = await self.calculate_response_times(user_uuid)
        user_success_rates = await self.analyze_success_rates(user_uuid)
        user_trends = await self.get_application_trends(user_uuid, days=30)
        
        # Get user averages
        user_avg_response = user_response_times.get("overall", {}).get("average_days", 0)
        user_interview_rate = user_success_rates.get("overall", {}).get("interview_rate", 0)
        user_offer_rate = user_success_rates.get("overall", {}).get("offer_rate", 0)
        user_weekly_apps = user_trends.get("weekly_average", 0)
        
        # Compare to benchmarks
        return {
            "user_metrics": {
                "response_time_days": user_avg_response,
                "interview_rate": user_interview_rate,
                "offer_rate": user_offer_rate,
                "weekly_applications": user_weekly_apps
            },
            "industry_benchmarks": industry_benchmarks,
            "comparisons": {
                "response_time_vs_benchmark": "faster" if user_avg_response < industry_benchmarks["average_response_time_days"] else "slower",
                "interview_rate_vs_benchmark": "above" if user_interview_rate > industry_benchmarks["average_interview_rate"] else "below",
                "offer_rate_vs_benchmark": "above" if user_offer_rate > industry_benchmarks["average_offer_rate"] else "below",
                "activity_vs_benchmark": "above" if user_weekly_apps > industry_benchmarks["average_applications_per_week"] else "below"
            }
        }
    
    # ============================================
    # OPTIMIZATION RECOMMENDATIONS (UC-072)
    # ============================================
    
    async def generate_recommendations(self, user_uuid: str) -> List[Dict]:
        """Generate optimization recommendations based on analytics"""
        recommendations = []
        
        try:
            # Get various metrics
            funnel = await self.get_application_funnel(user_uuid)
            success_rates = await self.analyze_success_rates(user_uuid, group_by="materials")
            trends = await self.get_application_trends(user_uuid, days=90)
            
            # Safely get conversion rates
            conversion_rates = funnel.get("conversion_rates", {})
            stage_counts = funnel.get("stage_counts", {})
            
            # Check interview conversion rate
            interview_rate = conversion_rates.get("applied_to_screening", 0)
            if interview_rate < 10:
                recommendations.append({
                    "category": "materials",
                    "priority": "high",
                    "title": "Improve Application Materials",
                    "description": f"Your interview rate ({interview_rate}%) is below average. Consider tailoring your resume and cover letter more closely to each position.",
                    "action": "Review and improve resume/cover letter quality"
                })
            
            # Check materials usage - only if we have data
            if success_rates and "No Materials" in success_rates:
                no_materials_rate = success_rates["No Materials"].get("offer_rate", 0)
                with_materials_rate = success_rates.get("Resume + Cover Letter", {}).get("offer_rate", 0)
                if with_materials_rate > no_materials_rate:
                    recommendations.append({
                        "category": "materials",
                        "priority": "high",
                        "title": "Always Include Application Materials",
                        "description": f"Applications with resume and cover letter have {with_materials_rate}% offer rate vs {no_materials_rate}% without.",
                        "action": "Attach materials to all applications"
                    })
            
            # Check application volume
            weekly_avg = trends.get("weekly_average", 0) if trends else 0
            if weekly_avg < 5:
                recommendations.append({
                    "category": "volume",
                    "priority": "medium",
                    "title": "Increase Application Volume",
                    "description": f"You're averaging {weekly_avg} applications per week. Consider increasing to 10-15 per week to improve chances.",
                    "action": "Set a goal of 10+ applications per week"
                })
            
            # Check offer conversion - only if we have enough data
            interview_count = stage_counts.get("interview", 0)
            if interview_count > 5:
                offer_rate = conversion_rates.get("interview_to_offer", 0)
                if offer_rate < 20:
                    recommendations.append({
                        "category": "interview_skills",
                        "priority": "high",
                        "title": "Improve Interview Performance",
                        "description": f"Your interview-to-offer rate ({offer_rate}%) suggests room for improvement in interviews.",
                        "action": "Practice mock interviews and refine your responses"
                    })
            
            # If we have no recommendations, add a positive one
            if not recommendations:
                recommendations.append({
                    "category": "general",
                    "priority": "low",
                    "title": "Keep Up the Good Work!",
                    "description": "Your application metrics are looking strong. Continue with your current strategy.",
                    "action": "Maintain your current application pace and quality"
                })
            
            return recommendations
            
        except Exception as e:
            # Log the error and return a generic recommendation
            print(f"Error generating recommendations: {str(e)}")
            return [{
                "category": "general",
                "priority": "low",
                "title": "Track Your Applications",
                "description": "Continue tracking your applications to get personalized recommendations.",
                "action": "Keep adding applications to build your analytics"
            }]
        
    # ============================================
    # GOAL TRACKING (UC-072)
    # ============================================
    
    async def save_goal(self, user_uuid: str, goal_data: dict) -> str:
        """Save a user's application goal"""
        time = datetime.now(timezone.utc)
        goal_data["uuid"] = user_uuid
        goal_data["date_created"] = time
        goal_data["date_updated"] = time
        goal_data["status"] = "active"
        
        result = await self.analytics_collection.insert_one(goal_data)
        return str(result.inserted_id)
    
    async def get_user_goals(self, user_uuid: str) -> List[dict]:
        """Get all goals for a user"""
        cursor = self.analytics_collection.find({
            "uuid": user_uuid,
            "status": "active"
        }).sort("date_created", -1)
        
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    async def update_goal_progress(self, goal_id: str, progress: float) -> int:
        """Update goal progress"""
        result = await self.analytics_collection.update_one(
            {"_id": goal_id},
            {
                "$set": {
                    "progress": progress,
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.matched_count

# Singleton instance
application_analytics_dao = ApplicationAnalyticsDAO()