"""
Interview Analytics and Success Prediction Router
Combines UC-080 and UC-085 endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from bson import ObjectId

from services.interview_analytics_service import InterviewAnalyticsService
from services.success_prediction_service import SuccessPredictionService
from mongo.dao_setup import db_client
from sessions.session_authorizer import authorize

# Initialize routers
analytics_router = APIRouter(prefix="/interview-analytics", tags=["interview-analytics"])
prediction_router = APIRouter(prefix="/success-prediction", tags=["success-prediction"])

# Initialize services
analytics_service = InterviewAnalyticsService(db_client)
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
        print(f"[Analytics Dashboard] Error: {str(e)}")
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
        print(f"[Analytics Trends] Error: {str(e)}")
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
        print(f"[Analytics Comparison] Error: {str(e)}")
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
        # Validate ObjectId
        try:
            obj_id = ObjectId(interview_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid interview ID format")
        
        prediction = await prediction_service.calculate_success_probability(
            uuid_val,
            obj_id
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
        print(f"[Success Prediction] Error: {str(e)}")
        import traceback
        traceback.print_exc()
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
        
        # Validate all ObjectIds
        validated_ids = []
        for iid in interview_ids:
            try:
                validated_ids.append(ObjectId(iid))
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid interview ID: {iid}")
        
        comparison = await prediction_service.compare_interview_probabilities(
            uuid_val,
            validated_ids
        )
        
        return {
            "detail": "Comparison completed",
            "comparison": comparison
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Success Comparison] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error in comparison: {str(e)}")


# Export all routers
__all__ = [
    "analytics_router",
    "prediction_router"
]