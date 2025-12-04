from fastapi import APIRouter, Query
from services.salary_service import salary_service

salary_router = APIRouter(prefix="/api/salary", tags=["Salary Research"])

@salary_router.get("/research")
async def salary_research(
    job_title: str = Query(...),
    location: str | None = Query(None)
):
    """
    Salary research and benchmarking endpoint.
    Returns mock data for now.
    """
    return await salary_service.research(job_title, location)
