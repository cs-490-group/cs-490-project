from fastapi import APIRouter, HTTPException, Depends, Query
from sessions.session_authorizer import authorize
from services.salary_service import salary_service
from services.salary_research import research_market_salary, generate_job_salary_negotiation

salary_research_router = APIRouter(
    prefix="/salary",
    tags=["Salary Research"]
)

@salary_research_router.get("/research")
async def salary_research_api(
    job_title: str = Query(...),
    location: str = Query(""),
    years_of_experience: int = 3,
    company: str = None,
    company_size: str = None,
    uuid: str = Depends(authorize)
):
    try:
        return await research_market_salary(
            role=job_title,
            location=location,
            years_of_experience=years_of_experience,
            company=company,
            company_size=company_size
        )
    except Exception as e:
        raise HTTPException(500, f"Salary research failed: {str(e)}")


@salary_research_router.get("/research/full")
async def salary_research_full_api(
    job_title: str = Query(...),
    company: str = Query(...),
    location: str = Query(""),
    company_size: str = None,
    uuid: str = Depends(authorize)
):
    try:
        return await generate_job_salary_negotiation(
            job_title=job_title,
            company=company,
            location=location,
            company_size=company_size
        )
    except Exception as e:
        raise HTTPException(500, f"Full salary negotiation research failed: {str(e)}")
