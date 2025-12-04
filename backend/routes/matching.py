# backend/routes/matching.py

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException

from sessions.session_authorizer import authorize
from mongo.dao_setup import (
    SKILLS, EMPLOYMENT, EDUCATION, JOBS, MATCH_HISTORY, db_client
)

from mongo.match_history_dao import match_history_dao
from mongo.matching_service import compute_matches_for_user, compute_skills_gap

from bson import ObjectId
from datetime import datetime
from dateutil.parser import parse as date_parse

router = APIRouter(prefix="/matching", tags=["matching"])


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def parse_date(value):
    """Parses ANY date format safely."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return date_parse(value)
    except:
        return None


def sum_years(history):
    """Compute total experience from employment history."""
    total = 0.0

    for entry in history:
        start = parse_date(entry.get("start_date"))
        end = parse_date(entry.get("end_date")) or datetime.now()

        if not start:
            continue

        if isinstance(start, str):
            start = parse_date(start)
        if isinstance(end, str):
            end = parse_date(end)

        if not end:
            end = datetime.now()

        delta = end - start
        total += delta.days / 365.0

    return round(total, 2)


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------

@router.get("/jobs", summary="Job match scores", response_model=List[Dict[str, Any]])
async def get_job_matches(
    jobIds: Optional[List[str]] = Query(default=None, alias="jobIds"),
    skillsWeight: Optional[float] = None,
    experienceWeight: Optional[float] = None,
    educationWeight: Optional[float] = None,
    uuid: str = Depends(authorize),
):
    weights = {}
    if skillsWeight is not None:
        weights["skillsWeight"] = skillsWeight
    if experienceWeight is not None:
        weights["experienceWeight"] = experienceWeight
    if educationWeight is not None:
        weights["educationWeight"] = educationWeight

    matches = await compute_matches_for_user(
        uuid,
        job_ids=jobIds,
        weights=weights or None,
    )
    return matches


@router.get("/jobs/{job_id}", summary="Detailed match analysis")
async def get_job_match_detail(
    job_id: str,
    skillsWeight: Optional[float] = None,
    experienceWeight: Optional[float] = None,
    educationWeight: Optional[float] = None,
    uuid: str = Depends(authorize),
):
    weights = {
        k: v for k, v in {
            "skillsWeight": skillsWeight,
            "experienceWeight": experienceWeight,
            "educationWeight": educationWeight,
        }.items() if v is not None
    } or None

    matches = await compute_matches_for_user(
        uuid,
        job_ids=[job_id],
        weights=weights
    )

    if not matches:
        raise HTTPException(status_code=404, detail="Job not found")

    return matches[0]


@router.get("/skills-gap/{job_id}", summary="Skills gap")
async def get_skills_gap_route(job_id: str, uuid: str = Depends(authorize)):
    result = await compute_skills_gap(uuid, job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job or profile not found")
    return result


@router.get("/history", summary="Match history")
async def get_history(limit: int = 50, uuid: str = Depends(authorize)):
    return await match_history_dao.get_history_for_user(uuid, limit)


# -------------------------------------------------------------------
# Job vs Full Profile Compare (dashboard data)
# -------------------------------------------------------------------

@router.get("/job-profile-compare/{job_id}")
async def compare_job_to_profile(job_id: str, uuid: str = Depends(authorize)):
    """
    Uses REAL Dashboard data:
    • SKILLS collection
    • EDUCATION collection
    • EMPLOYMENT collection
    """

    # Load dashboard skills
    skills_cursor = db_client.get_collection(SKILLS).find({"uuid": uuid})
    user_skill_list = [s async for s in skills_cursor]
    user_skills = {s["name"].lower(): s.get("level", 1) for s in user_skill_list}

    # Load education
    edu_doc = await db_client.get_collection(EDUCATION).find_one({"uuid": uuid})
    user_edu = edu_doc["degree"] if edu_doc else None

    # Load employment (used for experience)
    employment_cursor = db_client.get_collection(EMPLOYMENT).find({"uuid": uuid})
    employment_history = [e async for e in employment_cursor]
    user_years = sum_years(employment_history)

    # Load job data
    job = await db_client.get_collection(JOBS).find_one({"_id": ObjectId(job_id)})
    if not job:
        return {
            "matchingSkills": [],
            "partialSkills": [],
            "missingSkills": [],
            "experienceGap": {"user": user_years, "required": None},
            "educationGap": {"user": user_edu, "required": None},
        }

    job_skills = job.get("requiredSkills", [])
    job_exp = job.get("minYearsExperience") or job.get("requiredExperience")
    job_edu = job.get("educationLevel")

    # Skill matching
    matching = []
    partial = []
    missing = []

    for req in job_skills:

    # If job uses simple strings: ["python", "react"]
        if isinstance(req, str):
            name = req.lower()
            required_lvl = 1

    # If job uses objects: [{ name: "Python", level: 3 }]
        else:
            name = req.get("name", "").lower()
            required_lvl = req.get("level", 1)

        user_lvl = user_skills.get(name, 0)

        if user_lvl >= required_lvl:
            matching.append(name)
        elif user_lvl > 0:
            partial.append(name)
        else:
            missing.append(name)

    return {
        "matchingSkills": matching,
        "partialSkills": partial,
        "missingSkills": missing,
        "experienceGap": {"user": user_years, "required": job_exp},
        "educationGap": {"user": user_edu, "required": job_edu},
    }


