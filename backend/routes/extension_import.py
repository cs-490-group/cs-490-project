from datetime import datetime, timezone
import re
from typing import Optional, Dict, Any, Tuple

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from sessions.session_authorizer import authorize
from mongo.jobs_dao import jobs_dao
from webscrape.job_scraper import job_from_url


extension_import_router = APIRouter(prefix="/applications", tags=["applications"])


def _normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    v = value.lower().strip()
    v = re.sub(r"\s+", " ", v)
    v = re.sub(r"[\.,;:!\?\(\)\[\]\{\}\|\"'\-]", "", v)
    return v


def _compute_dedupe_key(company: Optional[str], title: Optional[str], location: Optional[str]) -> str:
    return "|".join([
        _normalize_text(company),
        _normalize_text(title),
        _normalize_text(location),
    ])


def _status_rank(status: Optional[str]) -> int:
    s = (status or "").lower()
    if s == "wishlist":
        return 0
    if s == "applied":
        return 1
    if s == "screening":
        return 2
    if s == "interview":
        return 3
    if s == "offer":
        return 4
    if s == "rejected":
        return 5
    return 1


def _canonical_status(status: Optional[str]) -> str:
    s = (status or "").strip().lower()
    if s == "offer":
        return "Offer"
    if s == "rejected":
        return "Rejected"
    if s == "interview":
        return "Interview"
    if s == "screening":
        return "Screening"
    if s == "wishlist":
        return "Wishlist"
    return "Applied"


async def _upsert_job(
    uuid: str,
    title: str,
    company: str,
    location: Optional[str],
    applied_at: str,
    dedupe_key: str,
    job_url: str,
    platform: str,
) -> Tuple[str, bool, Dict[str, Any]]:
    existing = await jobs_dao.find_job_by_dedupe_key(uuid, dedupe_key)

    if existing:
        job_id = str(existing["_id"])
        await jobs_dao.add_platform(job_id, platform)
        return job_id, False, existing

    now = datetime.now(timezone.utc)
    job_doc = {
        "uuid": uuid,
        "title": title,
        "company": company,
        "location": location,
        "url": job_url,
        "date_applied": applied_at,
        "submitted": True,
        "submitted_at": applied_at,
        "status": "Applied",
        "status_history": [["Applied", applied_at]],
        "response_tracking": {
            "submitted_at": applied_at,
            "responded_at": None,
            "response_days": None,
            "manually_entered": False,
        },
        "dedupe_key": dedupe_key,
        "platforms": [platform],
        "imported": True,
        "imported_at": now.isoformat(),
    }

    job_id = await jobs_dao.add_job(job_doc)
    created = await jobs_dao.get_job(job_id)
    return job_id, True, created or {}


class ExtensionImportPayload(BaseModel):
    platform: str
    job_url: str
    event_type: Optional[str] = "Applied"
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    applied_at: Optional[str] = None  # ISO string; defaults to now


@extension_import_router.post("/import/extension")
async def import_extension_application(
    payload: ExtensionImportPayload,
    uuid: str = Depends(authorize),
):
    applied_at = payload.applied_at or datetime.now(timezone.utc).isoformat()

    # Always scrape; allow payload to override if provided
    try:
        scraped = await job_from_url(payload.job_url)
    except Exception as e:
        raise HTTPException(400, f"Failed to scrape job details from url: {str(e)}")

    title = payload.title or scraped.get("title")
    company = payload.company or scraped.get("company")
    location = payload.location or scraped.get("location")

    if not title or not company:
        raise HTTPException(400, "Missing title/company and scraping did not provide them")

    dedupe_key = _compute_dedupe_key(company, title, location)

    job_id, created, job_doc = await _upsert_job(
        uuid=uuid,
        title=title,
        company=company,
        location=location,
        applied_at=applied_at,
        dedupe_key=dedupe_key,
        job_url=payload.job_url,
        platform=payload.platform,
    )

    event_status = _canonical_status(payload.event_type)
    current_status = None
    if job_doc and isinstance(job_doc, dict):
        current_status = job_doc.get("status")

    if _status_rank(event_status) > _status_rank(current_status):
        await jobs_dao.set_status(job_id, event_status, applied_at)

    return {
        "job_id": job_id,
        "created": created,
        "status": event_status,
        "platform": payload.platform,
        "title": title,
        "company": company,
        "location": location,
        "url": payload.job_url,
    }
