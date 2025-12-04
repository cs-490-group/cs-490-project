# backend/routes/insights.py
from fastapi import APIRouter, Query
from services.insights_service import interview_insights_service

insights_router = APIRouter(prefix="/api/insights", tags=["Interview Insights"])

@insights_router.get("/company")
async def get_interview_insights(
    company: str = Query(...),
    role: str | None = Query(None)
):
    """
    Returns interview insights for a company and role.
    """
    return await interview_insights_service.get_insights(company, role)
