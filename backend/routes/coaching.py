# ============================================================================
# UC-076: AI COACHING ENDPOINTS
# ============================================================================
# Standalone coaching endpoints for practice questions and other use cases
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from services.interview_coaching_service import InterviewCoachingService
from mongo.dao_setup import db_client
from sessions.session_authorizer import authorize

# Initialize router
coaching_router = APIRouter(prefix="/coaching", tags=["coaching"])

# Initialize service
coaching_service = InterviewCoachingService(db_client)


# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class AnalyzeResponseRequest(BaseModel):
    """Request to analyze a practice response and generate coaching feedback"""
    response_text: str
    question_text: str
    question_category: str = "behavioral"  # behavioral, technical, situational, company
    question_difficulty: str = "mid"       # entry, mid, senior
    response_duration_seconds: int = 120
    expected_skills: Optional[List[str]] = None
    interviewer_guidance: Optional[str] = None
    question_id: Optional[str] = None


# ============================================================================
# COACHING ANALYSIS ENDPOINT
# ============================================================================

@coaching_router.post("/analyze")
async def analyze_response(
    request_data: AnalyzeResponseRequest,
    uuid_val: str = Depends(authorize)
):
    """
    Analyze a practice response and generate AI coaching feedback.

    This endpoint is used for:
    - Practice questions in the question library
    - Standalone response analysis
    - Any non-interview context where coaching is needed

    Returns comprehensive coaching feedback with:
    - Overall score (0-100)
    - Score breakdown
    - Strengths and improvements
    - AI commentary
    - Alternative response suggestion
    """
    try:
        # Generate coaching feedback
        coaching_feedback = await coaching_service.generate_response_feedback(
            response_text=request_data.response_text,
            response_duration_seconds=request_data.response_duration_seconds,
            question_text=request_data.question_text,
            question_category=request_data.question_category,
            question_difficulty=request_data.question_difficulty,
            expected_skills=request_data.expected_skills or [],
            interviewer_guidance=request_data.interviewer_guidance or "",
            question_id=request_data.question_id
        )

        return coaching_feedback

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating coaching feedback: {str(e)}"
        )
