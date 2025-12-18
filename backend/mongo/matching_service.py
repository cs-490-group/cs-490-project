# backend/mongo/matching_service.py

from typing import Dict, Any, List
from datetime import datetime, date

from bson import ObjectId

from mongo.dao_setup import JOBS, db_client
from mongo.skills_dao import skills_dao
from mongo.education_dao import education_dao
from mongo.employment_dao import employment_dao
from mongo.profiles_dao import profiles_dao
from mongo.match_history_dao import match_history_dao
from redis_client import redis


jobs_collection = db_client.get_collection(JOBS)

# ------------------------
# Helpers / constants
# ------------------------

EDU_RANK = {
    "hs": 1,
    "highschool": 1,
    "high school": 1,
    "associate": 2,
    "associates": 2,
    "bachelor": 3,
    "bachelors": 3,
    "bachelor's degree": 3,
    "bachelor’s degree": 3,  # (curly apostrophe)
    "bs": 3,
    "ba": 3,
    "masters": 4,
    "master": 4,
    "master's degree": 3,
    "master’s degree": 3,  # (curly apostrophe)
    "ms": 4,
    "ma": 4,
    "phd": 5,
    "doctorate": 5,
}


def _normalize_edu(level: str) -> int:
    if not level:
        return 0
    return EDU_RANK.get(level.lower().strip(), 0)

def _experience_level_label(years: float) -> str:
    if years < 2:
        return "Entry"
    if years < 5:
        return "Mid"
    return "Senior"


def _infer_job_education(job_title: str | None) -> str | None:
    if not job_title:
        return None

    title = job_title.lower()

    # Internships never require degrees
    if "intern" in title:
        return "none"

    # Entry-level roles (associate, junior, trainee)
    if "junior" in title or "entry" in title or "trainee" in title:
        return "bachelor"

    # Standard engineering roles → Bachelor's
    if "software engineer" in title or "developer" in title or "engineer" in title:
        return "bachelor"

    # Senior roles → Bachelor's or Master's
    if "senior" in title or "lead" in title or "principal" in title:
        return "bachelor"

    # Managerial roles → Master's recommended
    if "manager" in title or "director" in title:
        return "bachelor"

    # Default assumption
    return None


def _skill_level_from_string(prof: str | None) -> int:
    """
    Map your skill proficiency labels to numeric levels.
    Tune this mapping to whatever you actually store in skills.
    """
    if not prof:
        return 3
    p = prof.lower()
    if "beginner" in p or "novice" in p:
        return 1
    if "intermediate" in p or "familiar" in p:
        return 2
    if "advanced" in p:
        return 3
    if "expert" in p or "pro" in p:
        return 4
    return 3


def _parse_date(d: Any) -> date | None:
    """
    Best-effort date parser for employment records.
    Accepts datetime/date or YYYY-MM-DD strings.
    """
    if not d:
        return None
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        try:
            # expect "YYYY-MM-DD" or ISO-ish
            return datetime.fromisoformat(d.split("T")[0]).date()
        except Exception:
            return None
    return None


def _years_between(start: date | None, end: date | None) -> float:
    if not start:
        return 0.0
    if not end:
        end = date.today()
    days = (end - start).days
    return max(days / 365.25, 0.0)


def _experience_years_from_level(exp_level: str | None) -> float:
    if not exp_level:
        return 0.0
    lvl = exp_level.lower()
    if "intern" in lvl:
        return 0.0
    if "junior" in lvl:
        return 1.0
    if "mid" in lvl or "middle" in lvl:
        return 3.0
    if "senior" in lvl:
        return 5.0
    return 0.0


# ------------------------
# BUILD DYNAMIC PROFILE
# ------------------------

async def _get_profile(uuid: str) -> Dict[str, Any] | None:
    """
    Build a full dynamic profile using the user's ACTUAL data sources:
      - skills_dao
      - education_dao
      - employment_dao
      - profiles_dao (experience_level + matching prefs)
    """

    base_profile = await profiles_dao.get_profile(uuid)
    base_profile = base_profile or {}

    # -------------------------------------------------------
    # 1) SKILLS
    # -------------------------------------------------------
    raw_skills = await skills_dao.get_all_skills(uuid)
    skills = []
    for s in raw_skills:
        name = (
            s.get("name") or 
            s.get("skill") or 
            s.get("skill_name")
        )
        if not name:
            continue

        prof = s.get("proficiency") or s.get("level")
        level_num = _skill_level_from_string(prof)

        skills.append({
            "name": name.lower(),
            "level": level_num,
            "weight": 1.0
        })

    # -------------------------------------------------------
    # 2) EDUCATION → highest degree
    # -------------------------------------------------------
    raw_edu = await education_dao.get_all_education(uuid)
    highest_rank = 0
    highest_label = None

    for edu in raw_edu:
        degree = (
            edu.get("degree") or
            edu.get("education_level") or
            edu.get("level")
        )
        if not degree:
            continue

        rank = _normalize_edu(degree)
        if rank > highest_rank:
            highest_rank = rank
            highest_label = degree

    # -------------------------------------------------------
    # 3) EMPLOYMENT → total years experience
    # -------------------------------------------------------
    raw_emp = await employment_dao.get_all_employment(uuid)
    total_years = 0.0

    for job in raw_emp:
        start = _parse_date(job.get("start_date"))
        end = _parse_date(job.get("end_date"))
        total_years += _years_between(start, end)

    # Fallback if user has a generic experience_level
    if total_years == 0:
        total_years = _experience_years_from_level(
            base_profile.get("experience_level")
        )

    # -------------------------------------------------------
    # 4) Matching preferences (from profile)
    # -------------------------------------------------------
    prefs = base_profile.get("matchingPreferences", {}) or {}

    # If user literally has no data
    if not skills and total_years == 0 and highest_rank == 0:
        return None
    
    print("PROFILE DEBUG:", {
    "skills": skills,
    "educationLevel": highest_label,
    "totalYearsExperience": total_years
    })

    return {
        "uuid": uuid,
        "skills": skills,
        "educationLevel": highest_label,
        "totalYearsExperience": round(total_years, 2),
        "experience_level": base_profile.get("experience_level"),
        "matchingPreferences": prefs
    }



async def _get_jobs_for_matching(
    uuid: str,
    job_ids: List[str] | None = None,
    page: int = 1,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Load paginated jobs for the logged-in user (UC-136),
    with Redis caching.
    """

    # ---------- REDIS: build cache key ----------
    job_ids_part = ",".join(sorted(job_ids)) if job_ids else "all"
    cache_key = f"jobs_for_matching:{uuid}:{job_ids_part}:p{page}:l{limit}"

    # ---------- REDIS: try cache ----------
    try:
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        # Redis should never break the endpoint
        pass

    # ---------- MONGODB QUERY ----------
    query: Dict[str, Any] = {"uuid": uuid}

    if job_ids:
        query["_id"] = {"$in": [ObjectId(j) for j in job_ids]}

    skip = (page - 1) * limit

    cursor = (
        jobs_collection
        .find(query)
        .skip(skip)
        .limit(limit)
    )

    jobs = await cursor.to_list(length=limit)
    total = await jobs_collection.count_documents(query)

    result = {
        "page": page,
        "limit": limit,
        "total": total,
        "results": jobs
    }

    # ---------- REDIS: store result ----------
    try:
        redis.set(cache_key, json.dumps(result, default=str), ex=300)
    except Exception:
        pass

    return result



# ------------------------
# Scoring primitives
# ------------------------

def _compute_skill_match(profile_skills: list, required_skills: list) -> dict:
    """
    Compute detailed skill match including:
    - matching
    - partial (currently none because no levels exist)
    - missing
    - per-skill details for Skills Gap page
    """

    # Normalize profile skills into dict {skill: level}
    profile_map = {}
    for s in profile_skills:
        if isinstance(s, str):
            profile_map[s.lower()] = 1   # default level
        elif isinstance(s, dict):
            name = s.get("name")
            level = s.get("level", 1)
            if isinstance(name, str):
                profile_map[name.lower()] = level

    # Normalize required skills into list of dicts
    req_list = []
    for s in required_skills:
        if isinstance(s, str):
            req_list.append({"name": s, "level": 1})
        elif isinstance(s, dict):
            name = s.get("name")
            level = s.get("level", 1)
            if isinstance(name, str):
                req_list.append({"name": name, "level": level})

    matched = []
    missing = []
    partial = []
    details = []

    for req in req_list:
        skill = req["name"].lower()
        req_level = req.get("level", 1)
        user_level = profile_map.get(skill, 0)

        # Determine category
        if user_level >= req_level:
            matched.append(req["name"])
            coverage = 100
        elif user_level > 0:
            partial.append(req["name"])
            coverage = int((user_level / req_level) * 100)
        else:
            missing.append(req["name"])
            coverage = 0

        # Per-skill detail object
        details.append({
            "skill": req["name"],
            "requiredLevel": req_level,
            "userLevel": user_level,
            "coverage": coverage,
        })

    # Score = % of required skills that are fully matched (not partial)
    score = 100
    if len(req_list) > 0:
        score = int((len(matched) / len(req_list)) * 100)

    return {
        "score": score,
        "matching": matched,
        "partial": partial,
        "missing": missing,
        "details": details
    }



def _compute_experience_match(
    user_years: float | int | None,
    min_years: float | int | None,
    preferred_years: float | int | None,
) -> Dict[str, Any]:
    user_years = float(user_years or 0.0)
    min_years = float(min_years or 0.0)
    preferred_years = float(preferred_years or min_years or 0.0)
    user_level = _experience_level_label(user_years)
    required_level = _experience_level_label(min_years)

    if min_years <= 0:
        return {
            "score": 100,
            "userYears": user_years,
            "requiredMin": min_years,
            "requiredPreferred": preferred_years,
            
            "level": {
                "user": user_level,
                "required": required_level,
            },
        }

    if user_years < min_years:
        ratio = max(user_years / min_years, 0.0)
    else:
        if preferred_years <= min_years:
            ratio = 1.0
        else:
            ratio = min(1.0, (user_years - min_years) / (preferred_years - min_years) + 0.5)
            ratio = min(ratio, 1.0)

    return {
        "score": round(ratio * 100),
        "userYears": user_years,
        "requiredMin": min_years,
        "requiredPreferred": preferred_years,
        
        "level": {
            "user": user_level,
            "required": required_level,
        },
    }


def _compute_education_match(user_level: str | None, required_level: str | None) -> Dict[str, Any]:
    user_rank = _normalize_edu(user_level or "")
    req_rank = _normalize_edu(required_level or "")

    if req_rank == 0:
        return {"score": 100, "userLevel": user_level, "requiredLevel": required_level}

    if user_rank >= req_rank:
        score = 100
    else:
        score = round(max(user_rank / req_rank, 0) * 100)

    return {
        "score": score,
        "userLevel": user_level,
        "requiredLevel": required_level,
    }


# ------------------------
# Public API
# ------------------------

async def compute_match_for_job(
    uuid: str,
    job: Dict[str, Any],
    profile: Dict[str, Any],
    weights: Dict[str, float] | None = None,
) -> Dict[str, Any]:
    """
    Core UC-065 logic for a single job.
    """
    prefs = profile.get("matchingPreferences", {}) or {}
    weights = weights or {}

    skills_w = float(weights.get("skillsWeight", prefs.get("skillsWeight", 0.6)))
    exp_w = float(weights.get("experienceWeight", prefs.get("experienceWeight", 0.25)))
    edu_w = float(weights.get("educationWeight", prefs.get("educationWeight", 0.15)))
    total_w = skills_w + exp_w + edu_w or 1.0

    skills = _compute_skill_match(
        profile.get("skills", []),
        job.get("requiredSkills", [])
    )
    exp = _compute_experience_match(
        profile.get("totalYearsExperience"),
        job.get("minYearsExperience"),
        job.get("preferredYearsExperience"),
    )
    # Try real job field first
    required_level = job.get("educationLevel")

    # If missing, infer from job title
    if not required_level:
        required_level = _infer_job_education(job.get("title"))

    edu = _compute_education_match(
        profile.get("educationLevel"),
        required_level,
    )

    overall = round(
        (skills["score"] * skills_w +
         exp["score"] * exp_w +
         edu["score"] * edu_w) / total_w
    )

    # ----------------------------------------------------------
    # FIX: Support both 'gaps' and 'missing' safely
    # ----------------------------------------------------------
    gaps = skills.get("gaps") or skills.get("missing") or []

    suggestions: List[str] = []
    for gap in gaps:
        suggestions.append(f"Improve skill: {gap}")

    if exp["score"] < 70:
        suggestions.append("Gain more relevant experience or highlight internships/projects.")

    if edu["score"] < 70 and job.get("educationLevel"):
        suggestions.append(
            f"Consider certifications or courses to offset education requirement ({job['educationLevel']})."
        )

    return {
        "jobId": str(job["_id"]),
        "jobTitle": job.get("title"),
        "company": job.get("company"),
        "overallScore": overall,
        "categoryBreakdown": {
            "skills": skills["score"],
            "experience": exp["score"],
            "education": edu["score"],
        },
        "skills": skills,
        "experience": exp,
        "education": edu,
        "suggestions": suggestions,
        "generatedAt": datetime.utcnow().isoformat(),
    }


async def compute_matches_for_user(
    uuid: str,
    job_ids: List[str] | None = None,
    weights: Dict[str, float] | None = None,
) -> List[Dict[str, Any]]:
    profile = await _get_profile(uuid)
    if not profile:
        # no skills / edu / employment → just return []
        return []

    jobs_data = await _get_jobs_for_matching(uuid, job_ids)
    jobs = jobs_data.get("results", [])
    
    if not jobs:
        print("⚠ No jobs found for UUID", uuid)
        return []

    results: List[Dict[str, Any]] = []
    for job in jobs:
        match = await compute_match_for_job(uuid, job, profile, weights=weights)
        results.append(match)

        # save in match history for trends/analytics
        try:
            await match_history_dao.log_match(uuid, match)
        except Exception as e:
            # don't break matching if history save fails
            print("⚠ Failed to save match history:", e)

    results.sort(key=lambda m: m["overallScore"], reverse=True)
    return results


async def compute_skills_gap(uuid: str, job_id: str) -> Dict[str, Any] | None:
    """
    UC-066: Skills Gap Analysis
    """

    profile = await _get_profile(uuid)
    if not profile:
        return None

    # Load the job
    job = await jobs_collection.find_one({"_id": ObjectId(job_id), "uuid": uuid})
    if not job:
        return {
            "jobId": job_id,
            "jobTitle": "Unknown Job",
            "company": "",
            "skillsMatchScore": 0,
            "strengths": [],
            "gaps": [],
            "skillDetails": [],
            "learningPlan": []
        }

    # Job may or may not contain requiredSkills
    required_skills = job.get("requiredSkills", [])

    # If job has no required skills → nothing to compare
    if not required_skills:
        return {
            "jobId": str(job["_id"]),
            "jobTitle": job.get("title") or "Unknown Job",
            "company": job.get("company", ""),
            "skillsMatchScore": 0,
            "strengths": [],
            "gaps": [],
            "skillDetails": [],
            "learningPlan": []
        }

    # Compute skill match using existing helper
    skills_result = _compute_skill_match(profile.get("skills", []), required_skills)

    # Convert matching/missing into strengths/gaps
    strengths = skills_result.get("matching", [])
    gaps = skills_result.get("missing", [])
    details = skills_result.get("details", [])

    # Build simple learning plan
    learning_resources = []
    for detail in details:
        if detail["coverage"] < 100:
            learning_resources.append({
                "skill": detail["skill"],
                "priority": 100 - detail["coverage"],
                "suggestedSources": [
                    f"Search 'Beginner {detail['skill']} course'",
                    f"Practice {detail['skill']} with small projects"
                ]
            })

    # Sort by priority descending
    learning_resources.sort(key=lambda x: x["priority"], reverse=True)

    # Final result
    return {
        "jobId": str(job["_id"]),
        "jobTitle": job.get("title"),
        "company": job.get("company"),
        "skillsMatchScore": skills_result["score"],
        "strengths": strengths,
        "gaps": gaps,
        "skillDetails": details,
        "learningPlan": learning_resources
    }


