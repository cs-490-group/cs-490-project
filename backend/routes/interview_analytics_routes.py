from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime

from schema.InterviewSchedule import (
    GenerateFollowUpRequest,
    WritingPracticeSession,
    WritingAnalysisResult
)
from services.followup_service import FollowUpService
from services.interview_analytics_service import InterviewAnalyticsService
from services.writing_practice_service import WritingPracticeService
from services.success_prediction_service import SuccessPredictionService
from mongo.dao_setup import db_client
from sessions.session_authorizer import authorize

# Initialize routers
analytics_router = APIRouter(prefix="/interview-analytics", tags=["interview-analytics"])
followup_router = APIRouter(prefix="/interview-followup", tags=["interview-followup"])
writing_router = APIRouter(prefix="/writing-practice", tags=["writing-practice"])
prediction_router = APIRouter(prefix="/success-prediction", tags=["success-prediction"])

# Initialize services
analytics_service = InterviewAnalyticsService(db_client)
followup_service = FollowUpService()
writing_service = WritingPracticeService()
prediction_service = SuccessPredictionService(db_client)

# ============================================================================
# INTERVIEW ANALYTICS ENDPOINTS (UC-080)
# ============================================================================

@analytics_router.get("/dashboard")
async def get_analytics_dashboard(uuid_val: str = Depends(authorize)):
    """Get comprehensive analytics dashboard with all metrics"""
    try:
        dashboard_data = await analytics_service.get_performance_dashboard(uuid_val)
        
        return {
            "detail": "Analytics dashboard loaded successfully",
            "data": dashboard_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading dashboard: {str(e)}")


@analytics_router.get("/trends")
async def get_trend_analysis(
    timeframe_days: int = Query(default=90, ge=7, le=365),
    uuid_val: str = Depends(authorize)
):
    """Get detailed trend analysis over a specified timeframe"""
    try:
        trend_data = await analytics_service.get_trend_analysis(uuid_val, timeframe_days)
        
        return {
            "detail": "Trend analysis completed",
            "data": trend_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing trends: {str(e)}")


@analytics_router.get("/comparison")
async def get_comparison_analysis(
    compare_with: Optional[str] = None,
    uuid_val: str = Depends(authorize)
):
    """Compare user's performance with another user or industry benchmarks"""
    try:
        comparison_data = await analytics_service.get_comparison_analysis(
            uuid_val,
            compare_with
        )
        
        return {
            "detail": "Comparison analysis completed",
            "data": comparison_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in comparison: {str(e)}")


# ============================================================================
# SUCCESS PREDICTION ENDPOINTS (UC-085)
# ============================================================================

@prediction_router.get("/{interview_id}/probability")
async def get_success_probability(
    interview_id: str,
    uuid_val: str = Depends(authorize)
):
    """Calculate interview success probability"""
    try:
        prediction = await prediction_service.calculate_success_probability(
            uuid_val,
            interview_id
        )
        
        if "error" in prediction:
            raise HTTPException(status_code=404, detail=prediction["error"])
        
        return {
            "detail": "Success probability calculated",
            "prediction": prediction
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating probability: {str(e)}")


@prediction_router.post("/compare")
async def compare_interview_probabilities(
    interview_ids: List[str],
    uuid_val: str = Depends(authorize)
):
    """Compare success probabilities across multiple interviews"""
    try:
        if len(interview_ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 interviews required for comparison"
            )
        
        comparison = await prediction_service.compare_interview_probabilities(
            uuid_val,
            interview_ids
        )
        
        return {
            "detail": "Comparison completed",
            "comparison": comparison
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in comparison: {str(e)}")


# Export all routers
__all__ = [
    "analytics_router",
    "followup_router", 
    "writing_router",
    "prediction_router"
]