from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime

from schema.InterviewSchedule import (
    GenerateFollowUpRequest,
    WritingPracticeSession,
    WritingAnalysisResult
)
from mongo.interview_schedule_dao import FollowUpTemplateDAO, WritingPracticeDAO
from services.followup_template_service import FollowUpTemplateService
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
followup_service = FollowUpTemplateService()
writing_service = WritingPracticeService()
prediction_service = SuccessPredictionService(db_client)
followup_dao = FollowUpTemplateDAO(db_client)
writing_dao = WritingPracticeDAO(db_client)


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
# FOLLOW-UP TEMPLATE ENDPOINTS (UC-082)
# ============================================================================

@followup_router.post("/generate")
async def generate_followup_template(
    request_data: GenerateFollowUpRequest,
    uuid_val: str = Depends(authorize)
):
    """Generate a follow-up communication template"""
    try:
        from mongo.interview_schedule_dao import InterviewScheduleDAO
        schedule_dao = InterviewScheduleDAO(db_client)
        
        # Get interview details
        interview = await schedule_dao.get_schedule(request_data.interview_uuid)
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(status_code=403, detail="Unauthorized access")
        
        # Generate template based on type
        template_data = None
        
        if request_data.template_type == "thank_you":
            template_data = followup_service.generate_thank_you_email(
                interviewer_name=interview.get("interviewer_name", "Hiring Team"),
                company_name="Company",  # In production: fetch from job application
                job_title="Position",     # In production: fetch from job application
                interview_date=interview.get("interview_datetime", datetime.utcnow()),
                specific_topics=request_data.specific_topics or [],
                custom_notes=request_data.custom_notes
            )
        
        elif request_data.template_type == "status_inquiry":
            days_since = (datetime.utcnow() - interview.get("interview_datetime", datetime.utcnow())).days
            template_data = followup_service.generate_status_inquiry(
                interviewer_name=interview.get("interviewer_name", "Hiring Team"),
                company_name="Company",
                job_title="Position",
                interview_date=interview.get("interview_datetime", datetime.utcnow()),
                days_since_interview=days_since
            )
        
        elif request_data.template_type == "feedback_request":
            was_selected = interview.get("outcome") == "passed"
            template_data = followup_service.generate_feedback_request(
                interviewer_name=interview.get("interviewer_name", "Hiring Team"),
                company_name="Company",
                job_title="Position",
                was_selected=was_selected
            )
        
        elif request_data.template_type == "networking":
            template_data = followup_service.generate_networking_followup(
                interviewer_name=interview.get("interviewer_name", "Hiring Team"),
                company_name="Company",
                job_title="Position",
                connection_request=True
            )
        
        else:
            raise HTTPException(status_code=400, detail="Invalid template type")
        
        # Save template to database
        template_obj = {
            "user_uuid": uuid_val,
            "interview_uuid": request_data.interview_uuid,
            "template_type": request_data.template_type,
            "subject_line": template_data["subject"],
            "email_body": template_data["body"],
            "interviewer_name": interview.get("interviewer_name"),
            "company_name": "Company",
            "job_title": "Position",
            "specific_topics_discussed": request_data.specific_topics or [],
            "suggested_send_time": template_data.get("suggested_send_time")
        }
        
        template_uuid = await followup_dao.create_template(template_obj)
        
        return {
            "detail": "Follow-up template generated successfully",
            "template_uuid": template_uuid,
            "template": template_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating template: {str(e)}")


@followup_router.get("/{template_id}")
async def get_followup_template(
    template_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get a specific follow-up template"""
    template = await followup_dao.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    return {"template": template}


@followup_router.get("/interview/{interview_id}/templates")
async def get_templates_by_interview(
    interview_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get all follow-up templates for an interview"""
    templates = await followup_dao.get_templates_by_interview(interview_id)
    
    return {
        "templates": templates,
        "count": len(templates)
    }


@followup_router.post("/{template_id}/send")
async def mark_template_sent(
    template_id: str,
    uuid_val: str = Depends(authorize)
):
    """Mark a follow-up template as sent"""
    template = await followup_dao.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    await followup_dao.mark_as_sent(template_id)
    
    return {"detail": "Template marked as sent"}


@followup_router.post("/{template_id}/response-received")
async def mark_response_received(
    template_id: str,
    sentiment: Optional[str] = None,
    uuid_val: str = Depends(authorize)
):
    """Mark that a response was received to the follow-up"""
    template = await followup_dao.get_template(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    await followup_dao.mark_response_received(template_id, sentiment)
    
    return {"detail": "Response marked as received"}


# ============================================================================
# WRITING PRACTICE ENDPOINTS (UC-084)
# ============================================================================

@writing_router.post("/start")
async def start_writing_practice(
    question_uuid: str,
    time_limit_seconds: int = 300,
    uuid_val: str = Depends(authorize)
):
    """Start a timed writing practice session"""
    import uuid
    
    session_data = {
        "uuid": str(uuid.uuid4()),
        "user_uuid": uuid_val,
        "question_uuid": question_uuid,
        "time_limit_seconds": time_limit_seconds,
        "started_at": datetime.utcnow()
    }
    
    # Note: Session is stored when completed, not at start
    
    return {
        "detail": "Writing practice session started",
        "session_uuid": session_data["uuid"],
        "time_limit_seconds": time_limit_seconds
    }


@writing_router.post("/submit")
async def submit_writing_practice(
    session_uuid: str,
    question_uuid: str,
    response_text: str,
    time_taken_seconds: int,
    question_category: str = "general",
    uuid_val: str = Depends(authorize)
):
    """Submit a writing practice response for analysis"""
    try:
        # Analyze response quality
        analysis = writing_service.analyze_response_quality(
            response_text,
            question_category
        )
        
        # Get previous attempts for comparison
        previous_sessions = await writing_dao.get_sessions_by_question(
            uuid_val,
            question_uuid
        )
        
        previous_analyses = [
            {
                "overall_score": s.get("overall_score"),
                "clarity_score": s.get("clarity_score"),
                "structure_score": s.get("structure_score"),
                "conciseness_score": s.get("conciseness_score")
            }
            for s in previous_sessions
            if s.get("overall_score") is not None
        ]
        
        comparison = writing_service.compare_with_previous(
            analysis,
            previous_analyses
        )
        
        # Store session
        session_data = {
            "uuid": session_uuid,
            "user_uuid": uuid_val,
            "question_uuid": question_uuid,
            "time_limit_seconds": 300,  # Default
            "time_taken_seconds": time_taken_seconds,
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "response_text": response_text,
            "word_count": analysis["word_count"],
            **analysis,
            "comparison_with_previous": comparison
        }
        
        await writing_dao.create_session(session_data)
        
        return {
            "detail": "Response analyzed successfully",
            "analysis": analysis,
            "comparison": comparison
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing response: {str(e)}")


@writing_router.get("/sessions")
async def get_writing_sessions(uuid_val: str = Depends(authorize)):
    """Get all writing practice sessions for the user"""
    sessions = await writing_dao.get_user_sessions(uuid_val)
    
    return {
        "sessions": sessions,
        "count": len(sessions)
    }


@writing_router.get("/sessions/{session_id}")
async def get_writing_session(
    session_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get a specific writing practice session"""
    session = await writing_dao.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    return {"session": session}


@writing_router.get("/sessions/question/{question_id}")
async def get_sessions_by_question(
    question_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get all practice sessions for a specific question"""
    sessions = await writing_dao.get_sessions_by_question(uuid_val, question_id)
    
    return {
        "sessions": sessions,
        "count": len(sessions),
        "question_uuid": question_id
    }


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