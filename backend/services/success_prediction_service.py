"""
Success Prediction Service
Implements UC-085: Interview Success Probability Scoring
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from pymongo.asynchronous.database import AsyncDatabase


class SuccessPredictionService:
    """Service for interview success probability (UC-085)"""

    def __init__(self, db_client: AsyncDatabase):
        self.db = db_client
        self.schedules = db_client["interview_schedules"]
        self.mock_sessions = db_client["mock_interview_sessions"]
    
    async def calculate_success_probability(
        self, 
        user_uuid: str, 
        interview_id
    ) -> Dict[str, Any]:
        """Calculate success probability for a specific interview"""
        from bson import ObjectId
        
        # Get the interview
        interview = await self.schedules.find_one({"_id": interview_id, "uuid": user_uuid})
        
        if not interview:
            return {"error": "Interview not found"}
        
        # Get preparation score
        prep_tasks = interview.get("preparation_tasks", [])
        if prep_tasks:
            completed_tasks = sum(1 for t in prep_tasks if t.get("is_completed", False))
            preparation_score = (completed_tasks / len(prep_tasks) * 100)
        else:
            preparation_score = 0
        
        # Get historical performance
        past_interviews = await self.schedules.find({
            "uuid": user_uuid,
            "status": "completed",
            "interview_datetime": {"$lt": interview.get("interview_datetime")}
        }).to_list(length=None)
        
        if past_interviews:
            passed = sum(1 for i in past_interviews if i.get("outcome") == "passed")
            historical_performance_score = (passed / len(past_interviews) * 100)
        else:
            historical_performance_score = 50  # Default
        
        # Get mock interview performance
        mock_sessions = await self.mock_sessions.find({
            "user_uuid": user_uuid,
            "status": "completed"
        }).to_list(length=None)
        
        if mock_sessions:
            # Calculate average score from mock sessions
            total_score = 0
            count = 0
            for session in mock_sessions:
                responses = session.get("responses", [])
                for response in responses:
                    if response.get("coaching_score"):
                        total_score += response["coaching_score"]
                        count += 1
            
            mock_interview_performance = (total_score / count) if count > 0 else 70
        else:
            mock_interview_performance = None
        
        # Calculate practice hours (from mock sessions)
        practice_hours = len(mock_sessions) * 0.5  # Assume 30 min per session
        
        # Role match score (simplified - can be enhanced with job description matching)
        role_match_score = 75  # Default
        
        # Calculate weighted success probability
        weights = {
            "preparation": 0.30,
            "historical": 0.25,
            "role_match": 0.20,
            "practice": 0.15,
            "mock_performance": 0.10
        }
        
        success_probability = (
            preparation_score * weights["preparation"] +
            historical_performance_score * weights["historical"] +
            role_match_score * weights["role_match"] +
            min(practice_hours * 10, 100) * weights["practice"] +
            (mock_interview_performance or 70) * weights["mock_performance"]
        )
        
        # Determine confidence level
        if preparation_score > 80 and len(past_interviews) >= 3:
            confidence_level = "high"
        elif preparation_score > 50 and len(past_interviews) >= 1:
            confidence_level = "medium"
        else:
            confidence_level = "low"
        
        # Category predictions (simplified)
        behavioral_prediction = min(success_probability + 5, 95)
        technical_prediction = max(success_probability - 10, 40)
        situational_prediction = success_probability
        
        # Generate prioritized actions
        prioritized_actions = []
        
        if preparation_score < 80:
            impact = int((80 - preparation_score) * 0.3)
            prioritized_actions.append({
                "title": "Complete remaining preparation tasks",
                "description": f"You're at {int(preparation_score)}% completion. Finish your prep checklist.",
                "priority": "high" if preparation_score < 50 else "medium",
                "estimated_impact": impact
            })
        
        if practice_hours < 3:
            prioritized_actions.append({
                "title": "More mock interview practice",
                "description": f"Complete {int(3 - practice_hours)} more practice sessions.",
                "priority": "high",
                "estimated_impact": 10
            })
        
        if technical_prediction < 60:
            prioritized_actions.append({
                "title": "Focus on technical preparation",
                "description": "Your technical score is lower than other areas.",
                "priority": "high",
                "estimated_impact": 15
            })
        
        if not prioritized_actions:
            prioritized_actions.append({
                "title": "Maintain your preparation level",
                "description": "You're well-prepared! Stay confident and review key points.",
                "priority": "low",
                "estimated_impact": 5
            })
        
        return {
            "success_probability": round(success_probability, 1),
            "confidence_level": confidence_level,
            "preparation_score": round(preparation_score, 1),
            "role_match_score": role_match_score,
            "practice_hours": round(practice_hours, 1),
            "historical_performance_score": round(historical_performance_score, 1),
            "mock_interview_performance": round(mock_interview_performance, 1) if mock_interview_performance else None,
            "behavioral_prediction": round(behavioral_prediction, 1),
            "technical_prediction": round(technical_prediction, 1),
            "situational_prediction": round(situational_prediction, 1),
            "prioritized_actions": prioritized_actions
        }
    
    async def compare_interview_probabilities(
        self,
        user_uuid: str,
        interview_ids: List
    ) -> Dict[str, Any]:
        """Compare success probabilities across multiple interviews"""
        from bson import ObjectId
        
        comparisons = []
        
        for interview_id in interview_ids:
            interview = await self.schedules.find_one({"_id": interview_id, "uuid": user_uuid})
            
            if interview:
                prediction = await self.calculate_success_probability(user_uuid, interview_id)
                
                if "error" not in prediction:
                    comparisons.append({
                        "interview_id": str(interview_id),
                        "interview_name": interview.get("scenario_name", "Interview"),
                        "company_name": interview.get("company_name", "Company"),
                        "interview_date": interview.get("interview_datetime").isoformat() if interview.get("interview_datetime") else None,
                        "success_probability": prediction["success_probability"],
                        "confidence_level": prediction["confidence_level"],
                        "preparation_score": prediction["preparation_score"]
                    })
        
        # Sort by success probability
        comparisons.sort(key=lambda x: x["success_probability"], reverse=True)
        
        return {
            "interviews": comparisons,
            "best_prepared": comparisons[0]["interview_name"] if comparisons else None,
            "needs_most_work": comparisons[-1]["interview_name"] if comparisons else None
        }