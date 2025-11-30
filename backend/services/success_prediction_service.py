"""
Success Prediction Service
Predicts interview success probability based on preparation and performance data
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase


class SuccessPredictionService:
    """Service for predicting interview success probability"""
    
    def __init__(self, db_client: AsyncIOMotorDatabase):
        self.db = db_client
        self.schedules_collection = db_client["interview_schedules"]
        self.mock_sessions_collection = db_client["mock_interview_sessions"]
        self.practice_sessions_collection = db_client["writing_practice_sessions"]
    
    async def calculate_success_probability(
        self,
        user_uuid: str,
        interview_uuid: str
    ) -> Dict[str, Any]:
        """
        Calculate the probability of interview success
        
        Args:
            user_uuid: User ID
            interview_uuid: Interview schedule ID
        
        Returns:
            Success probability score and contributing factors
        """
        # Get interview details
        interview = await self.schedules_collection.find_one({"uuid": interview_uuid})
        
        if not interview:
            return {"error": "Interview not found"}
        
        # Calculate individual factor scores
        preparation_score = await self._calculate_preparation_score(interview_uuid)
        role_match_score = await self._calculate_role_match_score(user_uuid, interview)
        practice_hours = await self._calculate_practice_hours(user_uuid)
        historical_score = await self._calculate_historical_performance(user_uuid)
        mock_performance = await self._calculate_mock_performance(user_uuid)
        
        # Calculate category-specific predictions
        category_predictions = await self._predict_category_performance(user_uuid)
        
        # Weighted calculation of overall success probability
        weights = {
            "preparation": 0.25,
            "role_match": 0.20,
            "practice": 0.15,
            "historical": 0.25,
            "mock": 0.15
        }
        
        success_probability = (
            preparation_score * weights["preparation"] +
            role_match_score * weights["role_match"] +
            min(100, practice_hours * 10) * weights["practice"] +
            historical_score * weights["historical"] +
            mock_performance * weights["mock"]
        )
        
        # Determine confidence level
        data_points = sum([
            1 if preparation_score > 0 else 0,
            1 if historical_score > 0 else 0,
            1 if mock_performance > 0 else 0,
            1 if practice_hours > 0 else 0
        ])
        
        if data_points >= 3:
            confidence = "high"
        elif data_points >= 2:
            confidence = "medium"
        else:
            confidence = "low"
        
        # Generate prioritized actions
        actions = self._generate_improvement_actions(
            preparation_score,
            role_match_score,
            practice_hours,
            historical_score,
            mock_performance,
            success_probability
        )
        
        return {
            "success_probability": round(success_probability, 2),
            "confidence_level": confidence,
            "preparation_score": round(preparation_score, 2),
            "role_match_score": round(role_match_score, 2),
            "practice_hours": round(practice_hours, 2),
            "historical_performance_score": round(historical_score, 2),
            "mock_interview_performance": round(mock_performance, 2),
            "behavioral_prediction": category_predictions["behavioral"],
            "technical_prediction": category_predictions["technical"],
            "situational_prediction": category_predictions["situational"],
            "prioritized_actions": actions
        }
    
    async def _calculate_preparation_score(self, interview_uuid: str) -> float:
        """Calculate preparation completeness score"""
        interview = await self.schedules_collection.find_one({"uuid": interview_uuid})
        
        if not interview:
            return 0
        
        # Get preparation completion percentage
        prep_percentage = interview.get("preparation_completion_percentage", 0)
        
        # Factor in time until interview
        interview_datetime = interview.get("interview_datetime")
        if interview_datetime:
            now = datetime.utcnow()
            days_until = (interview_datetime - now).days
            
            # Adjust score based on timing
            if days_until < 1:
                time_factor = 1.0  # Last minute - current prep is what matters
            elif days_until < 3:
                time_factor = 0.9  # Close - good prep is critical
            else:
                time_factor = 0.8  # Time to improve
        else:
            time_factor = 1.0
        
        return prep_percentage * time_factor
    
    async def _calculate_role_match_score(self, user_uuid: str, interview: dict) -> float:
        """
        Calculate how well user's skills match the role
        This would integrate with skills/resume data in production
        """
        # Placeholder: In production, would analyze:
        # - Resume skills vs job requirements
        # - Years of experience match
        # - Industry experience
        
        # For now, return moderate score
        return 70.0
    
    async def _calculate_practice_hours(self, user_uuid: str) -> float:
        """Calculate total practice hours from mock interviews and writing practice"""
        # Get mock interview sessions
        mock_cursor = self.mock_sessions_collection.find({
            "user_uuid": user_uuid,
            "status": "completed"
        })
        
        total_seconds = 0
        async for session in mock_cursor:
            responses = session.get("responses", [])
            for response in responses:
                total_seconds += response.get("response_duration_seconds", 0)
        
        # Get writing practice sessions
        writing_cursor = self.practice_sessions_collection.find({
            "user_uuid": user_uuid
        })
        
        async for session in writing_cursor:
            total_seconds += session.get("time_taken_seconds", 0)
        
        # Convert to hours
        hours = total_seconds / 3600
        
        return hours
    
    async def _calculate_historical_performance(self, user_uuid: str) -> float:
        """Calculate score based on past interview outcomes"""
        # Get completed interviews from last 6 months
        cutoff = datetime.utcnow() - timedelta(days=180)
        
        cursor = self.schedules_collection.find({
            "user_uuid": user_uuid,
            "status": "completed",
            "interview_datetime": {"$gte": cutoff}
        })
        
        total = 0
        passed = 0
        
        async for interview in cursor:
            total += 1
            if interview.get("outcome") == "passed":
                passed += 1
        
        if total == 0:
            return 50  # No history - neutral score
        
        success_rate = (passed / total) * 100
        
        # Adjust for recency - more recent performance weighted higher
        return success_rate
    
    async def _calculate_mock_performance(self, user_uuid: str) -> float:
        """Calculate score from mock interview performance"""
        cursor = self.mock_sessions_collection.find({
            "user_uuid": user_uuid,
            "status": "completed"
        }).sort("date_created", -1).limit(5)  # Last 5 sessions
        
        sessions = []
        async for session in cursor:
            sessions.append(session)
        
        if not sessions:
            return 50  # No mock data - neutral score
        
        total_score = 0
        
        for session in sessions:
            responses = session.get("responses", [])
            question_count = len(session.get("question_sequence", []))
            
            if question_count == 0:
                continue
            
            # Completion rate
            completion = (len(responses) / question_count) * 100
            
            # Response quality (based on word count and time)
            quality_scores = []
            for response in responses:
                word_count = response.get("word_count", 0)
                duration = response.get("response_duration_seconds", 0)
                
                # Ideal: 75-150 words in 60-180 seconds
                word_score = min(100, (word_count / 100) * 50 + 50)
                time_score = min(100, (duration / 120) * 50 + 50) if duration > 0 else 50
                
                quality_scores.append((word_score + time_score) / 2)
            
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 50
            
            # Session score: 50% completion, 50% quality
            session_score = (completion * 0.5) + (avg_quality * 0.5)
            total_score += session_score
        
        avg_score = total_score / len(sessions)
        
        return avg_score
    
    async def _predict_category_performance(self, user_uuid: str) -> Dict[str, float]:
        """Predict performance by question category"""
        cursor = self.mock_sessions_collection.find({
            "user_uuid": user_uuid,
            "status": "completed"
        })
        
        category_scores = {
            "behavioral": [],
            "technical": [],
            "situational": []
        }
        
        async for session in cursor:
            responses = session.get("responses", [])
            for response in responses:
                category = response.get("question_category")
                if category in category_scores:
                    word_count = response.get("word_count", 0)
                    duration = response.get("response_duration_seconds", 0)
                    
                    # Simple quality score
                    score = min(100, (word_count / 100) * 50 + (min(duration, 180) / 180) * 50)
                    category_scores[category].append(score)
        
        # Calculate predictions
        predictions = {}
        for category, scores in category_scores.items():
            if scores:
                predictions[category] = round(sum(scores) / len(scores), 2)
            else:
                predictions[category] = 50.0  # Neutral if no data
        
        return predictions
    
    def _generate_improvement_actions(
        self,
        prep_score: float,
        role_score: float,
        practice_hours: float,
        historical_score: float,
        mock_score: float,
        overall_score: float
    ) -> List[Dict[str, Any]]:
        """Generate prioritized list of actions to improve success probability"""
        actions = []
        
        # Prioritize by lowest scores
        factors = [
            {"name": "preparation", "score": prep_score, "weight": "high"},
            {"name": "practice", "score": practice_hours * 10, "weight": "medium"},
            {"name": "mock_performance", "score": mock_score, "weight": "high"},
            {"name": "role_match", "score": role_score, "weight": "low"}
        ]
        
        # Sort by score (lowest first)
        factors.sort(key=lambda x: x["score"])
        
        for factor in factors:
            if factor["score"] < 70:
                action = self._get_action_for_factor(factor["name"], factor["score"])
                if action:
                    action["priority"] = factor["weight"]
                    action["estimated_impact"] = self._estimate_impact(
                        factor["score"], overall_score
                    )
                    actions.append(action)
        
        # If overall score is already good
        if overall_score >= 75 and len(actions) == 0:
            actions.append({
                "title": "Maintain current preparation level",
                "description": "You're well-prepared! Continue reviewing key concepts and stay confident.",
                "priority": "low",
                "estimated_impact": 5
            })
        
        return actions[:5]  # Return top 5 actions
    
    def _get_action_for_factor(self, factor_name: str, score: float) -> Optional[Dict[str, str]]:
        """Get specific action recommendation for a factor"""
        actions = {
            "preparation": {
                "title": "Complete interview preparation checklist",
                "description": "Finish all preparation tasks including company research, question practice, and logistics verification"
            },
            "practice": {
                "title": "Increase practice hours",
                "description": "Complete 2-3 more mock interview sessions and practice writing responses to common questions"
            },
            "mock_performance": {
                "title": "Improve mock interview performance",
                "description": "Focus on structuring responses using STAR framework and aim for 75-150 words per answer"
            },
            "role_match": {
                "title": "Highlight relevant experience",
                "description": "Prepare specific examples that demonstrate skills directly relevant to the job requirements"
            }
        }
        
        return actions.get(factor_name)
    
    def _estimate_impact(self, current_score: float, overall_score: float) -> int:
        """Estimate the potential impact of improving a factor"""
        # Simple heuristic: lower scores have higher potential impact
        if current_score < 40:
            return 15  # High impact potential
        elif current_score < 60:
            return 10  # Medium impact
        else:
            return 5   # Low impact
    
    async def compare_interview_probabilities(
        self,
        user_uuid: str,
        interview_uuids: List[str]
    ) -> Dict[str, Any]:
        """Compare success probabilities across multiple interviews"""
        comparisons = []
        
        for interview_uuid in interview_uuids:
            prediction = await self.calculate_success_probability(user_uuid, interview_uuid)
            
            # Get interview details
            interview = await self.schedules_collection.find_one({"uuid": interview_uuid})
            
            if interview:
                comparisons.append({
                    "interview_uuid": interview_uuid,
                    "company": interview.get("job_application_uuid", "Unknown"),  # Would lookup company name
                    "success_probability": prediction["success_probability"],
                    "confidence": prediction["confidence_level"],
                    "interview_date": interview.get("interview_datetime").isoformat() if interview.get("interview_datetime") else None
                })
        
        # Sort by success probability
        comparisons.sort(key=lambda x: x["success_probability"], reverse=True)
        
        return {
            "comparisons": comparisons,
            "highest_probability": comparisons[0] if comparisons else None,
            "lowest_probability": comparisons[-1] if comparisons else None
        }