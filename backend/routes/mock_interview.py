import uuid
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone

# IMPORTANT: Load environment variables first (before importing coaching service)
from mongo.dao_setup import db_client

from schema.MockInterview import (
    CreateMockInterviewSessionRequest,
    CreateMockInterviewSessionResponse,
    SubmitInterviewResponseRequest,
    SubmitInterviewResponseResponse,
    GetMockInterviewSessionResponse,
    CompleteMockInterviewSessionResponse,
    InterviewSessionResponse,
)
from mongo.mock_interview_dao import MockInterviewSessionDAO
from services.interview_scenario_service import InterviewScenarioService
from services.interview_coaching_service import InterviewCoachingService
from sessions.session_authorizer import authorize

# Initialize router
mock_interview_router = APIRouter(prefix="/mock-interview", tags=["mock-interview"])

# Initialize DAOs and services
session_dao = MockInterviewSessionDAO()
scenario_service = InterviewScenarioService()
coaching_service = InterviewCoachingService()


# ============================================================================
# MOCK INTERVIEW SESSION CREATION ENDPOINTS
# ============================================================================

@mock_interview_router.post("/start")
async def start_mock_interview(
    request_data: CreateMockInterviewSessionRequest,
    uuid_val: str = Depends(authorize)
):
    """
    Start a new mock interview session.
    Generates interview scenario and returns first question.
    """
    try:
        # Generate interview scenario based on role and difficulty
        scenario = await scenario_service.generate_interview_scenario(
            role_uuid=request_data.role_uuid,
            industry_uuid=request_data.industry_uuid,
            difficulty_level=request_data.difficulty_level,
            include_behavioral=request_data.include_behavioral,
            include_technical=request_data.include_technical,
            include_situational=request_data.include_situational
        )

        # Create mock interview session in database
        session_data = {
            "user_uuid": uuid_val,
            "role_uuid": request_data.role_uuid,
            "industry_uuid": request_data.industry_uuid,
            "scenario_name": scenario["scenario_name"],
            "scenario_description": scenario["scenario_description"],
            "difficulty_level": request_data.difficulty_level,
            "estimated_duration_minutes": scenario["estimated_duration_minutes"],
            "question_sequence": scenario["question_sequence"],
            "question_categories": scenario["question_categories"],
            "status": "in_progress",
            "current_question_index": 0,
            "responses": [],
            "started_at": datetime.now(timezone.utc)
        }

        session_id = await session_dao.create_session(session_data)

        # Get first question
        first_question_uuid = scenario["question_sequence"][0]
        first_question = await scenario_service.get_question_details(first_question_uuid)

        return CreateMockInterviewSessionResponse(
            session_id=session_id,
            role_uuid=request_data.role_uuid,
            industry_uuid=request_data.industry_uuid,
            difficulty_level=request_data.difficulty_level,
            question_count=len(scenario["question_sequence"]),
            estimated_duration_minutes=scenario["estimated_duration_minutes"],
            first_question={
                "uuid": first_question["uuid"],
                "text": first_question["prompt"],
                "category": first_question["category"],
                "difficulty": first_question["difficulty"],
                "expected_skills": first_question.get("expected_skills", []),
                "guidance": first_question.get("interviewer_guidance", ""),
                "star_framework": first_question.get("star_framework"),
                "question_number": 1,
                "total_questions": len(scenario["question_sequence"])
            },
            detail="Interview session started successfully"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting interview: {str(e)}")


# ============================================================================
# INTERVIEW QUESTION SUBMISSION ENDPOINTS
# ============================================================================

@mock_interview_router.post("/sessions/{session_id}/submit-response")
async def submit_interview_response(
    session_id: str,
    request_data: SubmitInterviewResponseRequest,
    uuid_val: str = Depends(authorize)
):
    """
    Submit user's response to current interview question.
    Saves response and returns next question.
    """
    try:
        # Get the session
        session = await session_dao.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["user_uuid"] != uuid_val:
            raise HTTPException(status_code=403, detail="Unauthorized access to this session")

        if session["status"] != "in_progress":
            raise HTTPException(status_code=400, detail="Interview session is not in progress")

        # Get current question from question sequence
        current_index = session["current_question_index"]
        if current_index >= len(session["question_sequence"]):
            raise HTTPException(status_code=400, detail="Interview is complete")

        current_question_uuid = session["question_sequence"][current_index]
        current_question = await scenario_service.get_question_details(current_question_uuid)

        # Create response object
        response_word_count = len(request_data.response_text.split())
        interview_response = {
            "question_id": current_question_uuid,
            "question_text": current_question["prompt"],
            "question_category": current_question["category"],
            "question_difficulty": current_question["difficulty"],
            "response_text": request_data.response_text,
            "word_count": response_word_count,
            "response_duration_seconds": request_data.response_duration_seconds,
            "timestamp": datetime.now(timezone.utc),
            "coaching_feedback": None,  # Will be populated by UC-076 when implemented
            "coaching_score": None
        }

        # Add response to session
        await session_dao.add_response(session_id, interview_response)

        # ====================================================================
        # UC-076: GENERATE AI COACHING FEEDBACK
        # ====================================================================
        try:
            # Generate coaching feedback asynchronously
            coaching_feedback = await coaching_service.generate_response_feedback(
                response_text=request_data.response_text,
                response_duration_seconds=request_data.response_duration_seconds,
                question_text=current_question["prompt"],
                question_category=current_question["category"],
                question_difficulty=current_question["difficulty"],
                expected_skills=current_question.get("expected_skills", []),
                interviewer_guidance=current_question.get("interviewer_guidance", ""),
                question_id=current_question_uuid
            )

            # Update the response with coaching data
            coaching_score = coaching_feedback.get("overall_score", None)
            coaching_timestamp = datetime.now(timezone.utc)

            # Prepare updated response with coaching data
            interview_response_with_coaching = {
                **interview_response,
                "coaching_feedback": coaching_feedback,
                "coaching_score": coaching_score,
                "coaching_timestamp": coaching_timestamp
            }

            # Update the response in database with coaching info
            # Get the index of the response we just added (it's the last one)
            updated_responses = interview_response_with_coaching
            await session_dao.update_response(session_id, current_index, updated_responses)

        except Exception as coaching_error:
            # Log but don't fail if coaching generation fails
            print(f"Warning: Failed to generate coaching feedback: {str(coaching_error)}")
            coaching_feedback = None
            coaching_score = None
            # Response is still saved without coaching, user can continue interview

        # Move to next question
        next_index = current_index + 1
        await session_dao.set_current_question_index(session_id, next_index)

        # Check if there are more questions
        if next_index >= len(session["question_sequence"]):
            # Interview is complete
            response = SubmitInterviewResponseResponse(
                detail="Response saved. Interview complete!",
                session_id=session_id,
                response_saved=True,
                next_question=None,
                questions_remaining=0
            )
            # Add coaching feedback to response if available
            if coaching_feedback:
                response_dict = response.dict()
                response_dict["coaching_feedback"] = coaching_feedback
                response_dict["coaching_score"] = coaching_score
                return response_dict
            return response

        # Get next question
        next_question_uuid = session["question_sequence"][next_index]
        next_question = await scenario_service.get_question_details(next_question_uuid)

        next_question_data = {
            "uuid": next_question["uuid"],
            "text": next_question["prompt"],
            "category": next_question["category"],
            "difficulty": next_question["difficulty"],
            "expected_skills": next_question.get("expected_skills", []),
            "guidance": next_question.get("interviewer_guidance", ""),
            "star_framework": next_question.get("star_framework"),
            "question_number": next_index + 1,
            "total_questions": len(session["question_sequence"])
        }

        response = SubmitInterviewResponseResponse(
            detail="Response saved successfully",
            session_id=session_id,
            response_saved=True,
            next_question=next_question_data,
            questions_remaining=len(session["question_sequence"]) - next_index
        )

        # Add coaching feedback to response if available
        if coaching_feedback:
            response_dict = response.dict()
            response_dict["coaching_feedback"] = coaching_feedback
            response_dict["coaching_score"] = coaching_score
            return response_dict

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting response: {str(e)}")


# ============================================================================
# INTERVIEW SESSION COMPLETION ENDPOINTS
# ============================================================================

@mock_interview_router.post("/sessions/{session_id}/complete")
async def complete_interview_session(
    session_id: str,
    uuid_val: str = Depends(authorize)
):
    """
    Mark interview session as completed.
    In future, will trigger analytics and success probability calculations (UC-080, UC-085).
    """
    try:
        session = await session_dao.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["user_uuid"] != uuid_val:
            raise HTTPException(status_code=403, detail="Unauthorized access to this session")

        # Generate basic performance summary (infrastructure ready for UC-080, UC-085)
        # ====================================================================
        # UC-076: AGGREGATE COACHING METRICS
        # ====================================================================

        # Calculate coaching scores (UC-076)
        coaching_scores = [r.get("coaching_score") for r in session["responses"] if r.get("coaching_score")]
        overall_coaching_score = (
            sum(coaching_scores) / len(coaching_scores) if coaching_scores else None
        )

        # Compile improvement recommendations from all coaching feedback
        all_improvements = []
        for response in session["responses"]:
            if response.get("coaching_feedback"):
                improvements = response["coaching_feedback"].get("recommended_improvements", [])
                all_improvements.extend(improvements)

        # Compile coaching strengths
        all_strengths = []
        for response in session["responses"]:
            if response.get("coaching_feedback"):
                strengths = response["coaching_feedback"].get("strengths", [])
                all_strengths.extend(strengths)

        # Remove duplicates while preserving order
        unique_improvements = []
        for imp in all_improvements:
            if imp not in unique_improvements:
                unique_improvements.append(imp)
        unique_strengths = []
        for strength in all_strengths:
            if strength not in unique_strengths:
                unique_strengths.append(strength)

        performance_summary = {
            "total_questions_answered": len(session["responses"]),
            "total_questions_in_session": len(session["question_sequence"]),
            "average_response_length_words": (
                sum(r["word_count"] for r in session["responses"]) / len(session["responses"])
                if session["responses"] else 0
            ),
            "average_response_duration_seconds": (
                sum(r["response_duration_seconds"] for r in session["responses"]) / len(session["responses"])
                if session["responses"] else 0
            ),
            "question_categories_breakdown": session["question_categories"],
            "behavioral_count": len([r for r in session["responses"] if r["question_category"] == "behavioral"]),
            "technical_count": len([r for r in session["responses"] if r["question_category"] == "technical"]),
            "situational_count": len([r for r in session["responses"] if r["question_category"] == "situational"]),
            "company_count": len([r for r in session["responses"] if r["question_category"] == "company"]),
            "overall_score": None,  # Will be populated by UC-080/085
            "areas_for_improvement": unique_improvements,  # From UC-076 coaching
            # UC-076 coaching metrics
            "overall_coaching_score": round(overall_coaching_score, 1) if overall_coaching_score else None,
            "coaching_scores": coaching_scores,
            "coaching_strengths": unique_strengths[:5],  # Top 5 unique strengths
            "coaching_recommendations": unique_improvements[:5],  # Top 5 unique improvements
        }

        # Complete the session
        await session_dao.complete_session(session_id, performance_summary)

        return CompleteMockInterviewSessionResponse(
            session_id=session_id,
            total_questions=len(session["question_sequence"]),
            responses_saved=len(session["responses"]),
            overall_performance_score=None,  # Ready for UC-085
            summary=performance_summary,
            detail="Interview completed successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing interview: {str(e)}")


# ============================================================================
# INTERVIEW SESSION RETRIEVAL ENDPOINTS
# ============================================================================

@mock_interview_router.get("/sessions/{session_id}")
async def get_interview_session(
    session_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get details of a specific mock interview session"""
    session = await session_dao.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    # Calculate progress
    total_questions = len(session["question_sequence"])
    answered_questions = len(session["responses"])
    progress_percentage = (answered_questions / total_questions * 100) if total_questions > 0 else 0

    return GetMockInterviewSessionResponse(
        session=session,
        current_progress={
            "completed_questions": answered_questions,
            "total_questions": total_questions,
            "percentage": round(progress_percentage, 2),
            "current_question_index": session["current_question_index"]
        }
    )


@mock_interview_router.get("/sessions")
async def get_user_mock_interview_sessions(uuid_val: str = Depends(authorize)):
    """Get all mock interview sessions for the user"""
    sessions = await session_dao.get_user_sessions(uuid_val)
    return {
        "sessions": sessions,
        "total_sessions": len(sessions)
    }


@mock_interview_router.get("/sessions/role/{role_id}")
async def get_user_sessions_by_role(
    role_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get all mock interview sessions for a user for a specific role"""
    sessions = await session_dao.get_user_sessions_by_role(uuid_val, role_id)
    return {
        "sessions": sessions,
        "total_sessions": len(sessions),
        "role_id": role_id
    }


# ============================================================================
# INTERVIEW SESSION MANAGEMENT ENDPOINTS
# ============================================================================

@mock_interview_router.post("/sessions/{session_id}/abandon")
async def abandon_interview_session(
    session_id: str,
    uuid_val: str = Depends(authorize)
):
    """Abandon an in-progress interview session"""
    session = await session_dao.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    await session_dao.abandon_session(session_id)

    return {
        "detail": "Interview session abandoned",
        "session_id": session_id
    }


@mock_interview_router.delete("/sessions/{session_id}")
async def delete_interview_session(
    session_id: str,
    uuid_val: str = Depends(authorize)
):
    """Delete a mock interview session"""
    session = await session_dao.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    deleted = await session_dao.delete_session(session_id)

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"detail": "Session deleted successfully"}
