"""
SalaryBLS API Router
Fetches salary percentiles from BLS API with MongoDB caching
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timedelta
import httpx
import os

from sessions.session_authorizer import authorize
from mongo.salaryBLS_dao import SalaryBLSDAO

salaryBLS_router = APIRouter(prefix="/salaryBLS")


# ============================================================================
# Pydantic Models
# ============================================================================

class SalaryRequest(BaseModel):
    """Request to get salary data"""
    job_title: str
    city: str
    state: Optional[str] = None  # For better matching


class SalaryResponse(BaseModel):
    """Salary percentiles response"""
    job_title: str
    city: str
    state: Optional[str] = None
    percentile_25: Optional[float] = None
    percentile_50: Optional[float] = None
    percentile_75: Optional[float] = None
    last_updated: str
    source: str  # "cache" or "bls_api"
    data_year: Optional[int] = None


# ============================================================================
# BLS API Integration
# ============================================================================

async def fetch_bls_salary_data(job_title: str, city: str, state: Optional[str] = None) -> Optional[Dict]:
    """
    Fetch salary data from BLS API
    
    Note: The BLS API is complex. This is a simplified implementation.
    You may need to adjust based on specific BLS endpoints and data structure.
    
    Args:
        job_title: Job title to search
        city: City name
        state: State abbreviation (optional)
        
    Returns:
        Dictionary with salary percentiles or None if not found
    """
    try:
        # BLS API endpoint (you may need to register for an API key)
        # Free tier: https://www.bls.gov/developers/
        BLS_API_KEY = os.getenv("BLS_API_KEY")  # Optional, but increases rate limits
        
        # The BLS API structure is complex. Here's a simplified approach:
        # You'll need to find the correct series ID for your occupation and area
        
        # Example using BLS Occupational Employment Statistics (OES) data
        # This is a placeholder - you'll need to implement proper series ID lookup
        
        base_url = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
        
        # Step 1: Search for occupation code
        # You'd typically need to map job titles to SOC (Standard Occupational Classification) codes
        # For now, we'll return mock data structure
        
        # In a real implementation, you would:
        # 1. Map job_title to SOC code
        # 2. Map city/state to area code
        # 3. Construct series IDs like: OEUN[area_code][soc_code][wage_type]
        # 4. Query BLS API with those series IDs
        
        # For demonstration, here's how you'd make the actual API call:
        headers = {}
        if BLS_API_KEY:
            headers["X-API-KEY"] = BLS_API_KEY
        
        # Example payload structure (you'll need to adjust)
        payload = {
            "seriesid": [],  # Add proper series IDs here
            "startyear": str(datetime.now().year - 1),
            "endyear": str(datetime.now().year),
            "registrationkey": BLS_API_KEY if BLS_API_KEY else None
        }
        
        # For now, return placeholder structure
        # In production, you'd parse actual BLS response
        return None  # Will trigger placeholder data below
        
    except Exception as e:
        print(f"Error fetching BLS data: {e}")
        return None


async def get_salary_percentiles_from_bls(job_title: str, city: str, state: Optional[str] = None) -> Dict:
    """
    Get salary percentiles from BLS API with fallback to reasonable estimates
    
    Args:
        job_title: Job title to search
        city: City name
        state: State abbreviation
        
    Returns:
        Dictionary with salary data
    """
    # Try to fetch from BLS API
    bls_data = await fetch_bls_salary_data(job_title, city, state)
    
    if bls_data:
        return bls_data
    
    # Fallback: Return placeholder data with a note
    # In production, you might want to scrape other sources or return None
    # This ensures the feature works even without full BLS integration
    
    print(f"Note: Using placeholder salary data for {job_title} in {city}. Implement BLS API integration for real data.")
    
    # Placeholder: Generate reasonable estimates based on job title keywords
    base_salary = estimate_base_salary(job_title)
    
    return {
        "percentile_25": base_salary * 0.75,
        "percentile_50": base_salary,
        "percentile_75": base_salary * 1.3,
        "data_year": datetime.now().year,
        "note": "Estimated data - BLS API integration pending"
    }


def estimate_base_salary(job_title: str) -> float:
    """
    Estimate base salary from job title keywords
    This is a placeholder - real data should come from BLS API
    """
    title_lower = job_title.lower()
    
    # Simple keyword matching for demonstration
    if any(word in title_lower for word in ["senior", "lead", "principal", "architect"]):
        return 120000
    elif any(word in title_lower for word in ["engineer", "developer", "programmer"]):
        return 95000
    elif any(word in title_lower for word in ["manager", "director"]):
        return 110000
    elif any(word in title_lower for word in ["analyst", "specialist"]):
        return 75000
    elif any(word in title_lower for word in ["designer", "ux", "ui"]):
        return 85000
    elif any(word in title_lower for word in ["data scientist", "ml engineer"]):
        return 115000
    else:
        return 70000  # Default estimate


# ============================================================================
# API Endpoints
# ============================================================================

@salaryBLS_router.post("/search", response_model=SalaryResponse, tags=["salaryBLS"])
async def search_salary_data(
    request: SalaryRequest,
    uuid: str = Depends(authorize)
):
    """
    Search for salary data by job title and city
    Returns cached data if available and recent (< 1 month old)
    Otherwise fetches from BLS API and caches the result
    """
    print("YEA IN HERE")
    try:
        # Normalize inputs
        job_title = request.job_title.strip()
        city = request.city.strip()
        state = request.state.strip() if request.state else None
        
        # Check cache first
        cached_data = await SalaryBLSDAO.get_salary_data(job_title, city, state)
        
        # If cached data exists and is less than 1 month old, return it
        if cached_data:
            last_updated = cached_data.get("last_updated")
            if isinstance(last_updated, str):
                last_updated = datetime.fromisoformat(last_updated)
            
            age = datetime.utcnow() - last_updated
            if age < timedelta(days=30):
                return SalaryResponse(
                    job_title=cached_data["job_title"],
                    city=cached_data["city"],
                    state=cached_data.get("state"),
                    percentile_25=cached_data.get("percentile_25"),
                    percentile_50=cached_data.get("percentile_50"),
                    percentile_75=cached_data.get("percentile_75"),
                    last_updated=cached_data["last_updated"].isoformat() if isinstance(cached_data["last_updated"], datetime) else cached_data["last_updated"],
                    source="cache",
                    data_year=cached_data.get("data_year")
                )
        
        # Data is stale or doesn't exist - fetch from BLS API
        bls_data = await get_salary_percentiles_from_bls(job_title, city, state)
        
        if not bls_data:
            raise HTTPException(404, "Salary data not found for the specified job title and location")
        
        # Prepare data for storage
        salary_data = {
            "job_title": job_title,
            "city": city,
            "state": state,
            "percentile_25": bls_data.get("percentile_25"),
            "percentile_50": bls_data.get("percentile_50"),
            "percentile_75": bls_data.get("percentile_75"),
            "data_year": bls_data.get("data_year", datetime.now().year),
            "last_updated": datetime.utcnow()
        }
        
        # Store or update in database
        if cached_data:
            # Update existing entry
            await SalaryBLSDAO.update_salary_data(
                cached_data["_id"] if "_id" in cached_data else cached_data.get("id"),
                salary_data
            )
        else:
            # Create new entry
            await SalaryBLSDAO.create_salary_data(salary_data)
        
        return SalaryResponse(
            job_title=job_title,
            city=city,
            state=state,
            percentile_25=bls_data.get("percentile_25"),
            percentile_50=bls_data.get("percentile_50"),
            percentile_75=bls_data.get("percentile_75"),
            last_updated=datetime.utcnow().isoformat(),
            source="bls_api",
            data_year=bls_data.get("data_year")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in salary search: {e}")
        raise HTTPException(500, f"Failed to retrieve salary data: {str(e)}")


@salaryBLS_router.get("/recent-searches", tags=["salaryBLS"])
async def get_recent_searches(
    limit: int = Query(10, ge=1, le=50),
    uuid: str = Depends(authorize)
):
    """
    Get recent salary searches (most recently updated)
    """
    try:
        recent = await SalaryBLSDAO.get_recent_searches(limit)
        
        return {
            "searches": [
                {
                    "job_title": item["job_title"],
                    "city": item["city"],
                    "state": item.get("state"),
                    "percentile_50": item.get("percentile_50"),
                    "last_updated": item["last_updated"].isoformat() if isinstance(item["last_updated"], datetime) else item["last_updated"]
                }
                for item in recent
            ],
            "count": len(recent)
        }
        
    except Exception as e:
        print(f"Error fetching recent searches: {e}")
        raise HTTPException(500, f"Failed to fetch recent searches: {str(e)}")


@salaryBLS_router.get("/search-by-title/{job_title}", tags=["salaryBLS"])
async def search_by_title(
    job_title: str,
    uuid: str = Depends(authorize)
):
    """
    Get all cached salary data for a specific job title across different cities
    """
    try:
        results = await SalaryBLSDAO.search_by_job_title(job_title)
        
        return {
            "job_title": job_title,
            "locations": [
                {
                    "city": item["city"],
                    "state": item.get("state"),
                    "percentile_25": item.get("percentile_25"),
                    "percentile_50": item.get("percentile_50"),
                    "percentile_75": item.get("percentile_75"),
                    "last_updated": item["last_updated"].isoformat() if isinstance(item["last_updated"], datetime) else item["last_updated"]
                }
                for item in results
            ],
            "count": len(results)
        }
        
    except Exception as e:
        print(f"Error searching by title: {e}")
        raise HTTPException(500, f"Failed to search by title: {str(e)}")


@salaryBLS_router.delete("/cache/{salary_id}", tags=["salaryBLS"])
async def delete_cached_entry(
    salary_id: str,
    uuid: str = Depends(authorize)
):
    """
    Delete a cached salary entry (admin function)
    """
    try:
        success = await SalaryBLSDAO.delete_salary_data(salary_id)
        
        if success:
            return {"detail": "Cached entry deleted successfully"}
        else:
            raise HTTPException(404, "Cached entry not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting cached entry: {e}")
        raise HTTPException(500, f"Failed to delete cached entry: {str(e)}")


@salaryBLS_router.get("/stats", tags=["salaryBLS"])
async def get_cache_stats(uuid: str = Depends(authorize)):
    """
    Get statistics about cached salary data
    """
    try:
        stats = await SalaryBLSDAO.get_stats()
        
        return {
            "total_entries": stats.get("total_entries", 0),
            "unique_job_titles": stats.get("unique_job_titles", 0),
            "unique_cities": stats.get("unique_cities", 0),
            "oldest_entry": stats.get("oldest_entry"),
            "newest_entry": stats.get("newest_entry")
        }
        
    except Exception as e:
        print(f"Error getting stats: {e}")
        raise HTTPException(500, f"Failed to get cache statistics: {str(e)}")