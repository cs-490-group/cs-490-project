from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from bson import ObjectId
from services.technical_prep_service import technical_prep_service
from mongo.technical_prep_dao import technical_prep_dao
from schema.TechnicalChallenge import TechnicalChallenge, ChallengeAttempt
from datetime import datetime, timezone

technical_prep_router = APIRouter(prefix="/technical-prep", tags=["Technical Preparation"])


# ============ CHALLENGE ENDPOINTS ============

@technical_prep_router.get("/challenges")
async def get_all_challenges(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    challenge_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all available challenges with filters"""
    try:
        if search:
            challenges = await technical_prep_dao.search_challenges(
                search, challenge_type=challenge_type, limit=limit
            )
        elif challenge_type:
            challenges = await technical_prep_dao.get_challenges_by_type(challenge_type, limit=limit)
        elif difficulty:
            challenges = await technical_prep_dao.get_challenges_by_difficulty(difficulty, limit=limit)
        else:
            challenges = []
            # Get sample of each type
            for ctype in ["coding", "system_design", "case_study"]:
                type_challenges = await technical_prep_dao.get_challenges_by_type(ctype, limit=5)
                challenges.extend(type_challenges)

        return {
            "success": True,
            "count": len(challenges),
            "challenges": challenges
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.get("/challenges/recommended/{uuid}")
async def get_recommended_challenges(
    uuid: str,
    job_role: Optional[str] = None,
    skills: Optional[List[str]] = Query(None),
    difficulty: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50)
):
    """Get challenges recommended for a user based on their profile"""
    try:
        challenges = await technical_prep_service.get_recommended_challenges(
            uuid, job_role=job_role, user_skills=skills, difficulty=difficulty, limit=limit
        )
        return {
            "success": True,
            "count": len(challenges),
            "challenges": challenges
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.get("/challenges/{challenge_id}")
async def get_challenge(challenge_id: str):
    """Get a specific challenge by ID"""
    try:
        challenge = await technical_prep_dao.get_challenge(challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        return {"success": True, "challenge": challenge}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.post("/challenges/coding/generate")
async def generate_coding_challenge(
    uuid: str,
    difficulty: str = "medium",
    skills: Optional[List[str]] = Query(None),
    job_role: Optional[str] = None
):
    """Generate a new coding challenge"""
    try:
        challenge_data = await technical_prep_service.generate_coding_challenge(
            uuid, difficulty=difficulty, skills=skills, job_role=job_role
        )
        challenge_id = await technical_prep_dao.create_challenge(challenge_data)
        challenge_data["_id"] = challenge_id
        return {
            "success": True,
            "challenge_id": challenge_id,
            "challenge": challenge_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.post("/challenges/system-design/generate")
async def generate_system_design_challenge(
    uuid: str,
    seniority: str = "senior",
    focus_areas: Optional[List[str]] = Query(None)
):
    """Generate a new system design challenge"""
    try:
        challenge_data = await technical_prep_service.generate_system_design_challenge(
            uuid, seniority=seniority, focus_areas=focus_areas
        )
        challenge_id = await technical_prep_dao.create_challenge(challenge_data)
        challenge_data["_id"] = challenge_id
        return {
            "success": True,
            "challenge_id": challenge_id,
            "challenge": challenge_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.post("/challenges/case-study/generate")
async def generate_case_study(
    uuid: str,
    industry: Optional[str] = None
):
    """Generate a new case study challenge"""
    try:
        challenge_data = await technical_prep_service.generate_case_study(uuid, industry=industry)
        challenge_id = await technical_prep_dao.create_challenge(challenge_data)
        challenge_data["_id"] = challenge_id
        return {
            "success": True,
            "challenge_id": challenge_id,
            "challenge": challenge_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ ATTEMPT ENDPOINTS ============

@technical_prep_router.post("/attempts/{uuid}/{challenge_id}")
async def start_challenge_attempt(uuid: str, challenge_id: str):
    """Start a new challenge attempt"""
    try:
        attempt_id = await technical_prep_service.start_challenge_attempt(uuid, challenge_id)
        attempt = await technical_prep_dao.get_attempt(attempt_id)
        return {
            "success": True,
            "attempt_id": attempt_id,
            "attempt": attempt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.post("/attempts/{attempt_id}/submit")
async def submit_code(attempt_id: str, code: str, language: str):
    """Submit code for a challenge"""
    try:
        result = await technical_prep_service.submit_challenge_code(attempt_id, code, language)
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.post("/attempts/{attempt_id}/complete")
async def complete_attempt(
    attempt_id: str,
    score: float,
    passed_tests: int,
    total_tests: int,
    code: Optional[str] = None
):
    """Mark an attempt as complete"""
    try:
        success = await technical_prep_service.complete_challenge(
            attempt_id, score, passed_tests, total_tests, code
        )
        if not success:
            raise HTTPException(status_code=404, detail="Attempt not found")
        return {
            "success": True,
            "message": "Challenge attempt completed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.get("/attempts/{attempt_id}")
async def get_attempt(attempt_id: str):
    """Get a specific attempt by ID"""
    try:
        attempt = await technical_prep_dao.get_attempt(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        return {"success": True, "attempt": attempt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.get("/user/{uuid}/attempts")
async def get_user_attempts(uuid: str, limit: int = Query(50, ge=1, le=100)):
    """Get all attempts for a user"""
    try:
        attempts = await technical_prep_dao.get_user_attempts(uuid, limit=limit)
        return {
            "success": True,
            "count": len(attempts),
            "attempts": attempts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.get("/challenge/{challenge_id}/attempts")
async def get_challenge_attempts(challenge_id: str):
    """Get all attempts for a specific challenge"""
    try:
        attempts = await technical_prep_dao.get_challenge_attempts(challenge_id)
        return {
            "success": True,
            "count": len(attempts),
            "attempts": attempts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.get("/user/{uuid}/statistics")
async def get_user_statistics(uuid: str):
    """Get comprehensive statistics for a user"""
    try:
        stats = await technical_prep_service.get_user_progress(uuid)
        return {
            "success": True,
            "statistics": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@technical_prep_router.get("/challenge/{challenge_id}/leaderboard")
async def get_challenge_leaderboard(
    challenge_id: str,
    limit: int = Query(10, ge=1, le=100)
):
    """Get leaderboard for a challenge"""
    try:
        leaderboard = await technical_prep_service.get_challenge_leaderboard(challenge_id, limit=limit)
        return {
            "success": True,
            "count": len(leaderboard),
            "leaderboard": leaderboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
