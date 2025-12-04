# salary.py
from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo.errors import DuplicateKeyError
from typing import Optional

from mongo.salary_dao import salary_dao
from sessions.session_authorizer import authorize
from schema.Salary import SalaryRecord, SalaryRecordUpdate, MarketData

salary_router = APIRouter(prefix="/salary")

# Salary record CRUD endpoints

@salary_router.post("", tags=["salary"])
async def add_salary_record(record: SalaryRecord, uuid: str = Depends(authorize)):
    """Add a new salary record"""
    try:
        model = record.model_dump()
        
        # Calculate total compensation if not provided
        if model.get("total_compensation") is None:
            total_comp = model.get("salary_amount", 0)
            total_comp += model.get("bonus", 0)
            total_comp += model.get("equity_value", 0)
            model["total_compensation"] = total_comp
        
        model["uuid"] = uuid
        result = await salary_dao.add_salary_record(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Salary record for this year already exists")
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, f"Encountered internal server error: {str(e)}")
    
    return {"detail": "Successfully added salary record", "salary_id": result}

@salary_router.get("", tags=["salary"])
async def get_salary_record(salary_id: str, uuid: str = Depends(authorize)):
    """Get a specific salary record"""
    try:
        result = await salary_dao.get_salary_record(salary_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if result:
        # Verify ownership
        if result.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        return result
    else:
        raise HTTPException(404, "Salary record not found")

@salary_router.get("/me", tags=["salary"])
async def get_all_salary_records(uuid: str = Depends(authorize)):
    """Get all salary records for the current user"""
    try:
        results = await salary_dao.get_all_salary_records(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

@salary_router.put("", tags=["salary"])
async def update_salary_record(salary_id: str, record: SalaryRecordUpdate, uuid: str = Depends(authorize)):
    """Update a salary record"""
    try:
        # Verify ownership
        existing_record = await salary_dao.get_salary_record(salary_id)
        if not existing_record:
            raise HTTPException(404, "Salary record not found")
        if existing_record.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        model = record.model_dump(exclude_unset=True)
        
        # Recalculate total compensation if any component changed
        if any(key in model for key in ["salary_amount", "bonus", "equity_value"]):
            salary = model.get("salary_amount", existing_record.get("salary_amount", 0))
            bonus = model.get("bonus", existing_record.get("bonus", 0))
            equity = model.get("equity_value", existing_record.get("equity_value", 0))
            model["total_compensation"] = salary + bonus + equity
        
        updated = await salary_dao.update_salary_record(salary_id, model)
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if updated == 0:
        raise HTTPException(404, "Salary record not found")
    else:
        return {"detail": "Successfully updated salary record"}

@salary_router.delete("", tags=["salary"])
async def delete_salary_record(salary_id: str, uuid: str = Depends(authorize)):
    """Delete a salary record"""
    try:
        # Verify ownership
        existing_record = await salary_dao.get_salary_record(salary_id)
        if not existing_record:
            raise HTTPException(404, "Salary record not found")
        if existing_record.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        deleted = await salary_dao.delete_salary_record(salary_id)
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if deleted == 0:
        raise HTTPException(404, "Salary record not found")
    else:
        return {"detail": "Successfully deleted salary record"}

# Analytics endpoints

@salary_router.get("/history", tags=["salary"])
async def get_salary_history(uuid: str = Depends(authorize)):
    """Get salary history formatted for analytics chart"""
    try:
        history = await salary_dao.get_salary_history(uuid)
        return {"salaryHistory": history}
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

@salary_router.get("/stats", tags=["salary"])
async def get_salary_stats(uuid: str = Depends(authorize)):
    """Get salary statistics"""
    try:
        stats = await salary_dao.calculate_stats(uuid)
        return {"stats": stats}
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

@salary_router.get("/analytics", tags=["salary"])
async def get_salary_analytics(uuid: str = Depends(authorize)):
    """Get complete salary analytics (history + stats + market position)"""
    try:
        history = await salary_dao.get_salary_history(uuid)
        stats = await salary_dao.calculate_stats(uuid)
        market_position = await salary_dao.get_market_position(uuid)
        
        return {
            "salaryHistory": history,
            "stats": stats,
            "marketPosition": market_position
        }
    except Exception as e:
        raise HTTPException(500, f"Encountered internal service error: {str(e)}")

@salary_router.get("/market", tags=["salary"])
async def get_market_data(
    role: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    uuid: str = Depends(authorize)
):
    """Get market data for comparison"""
    try:
        filters = {}
        if role:
            filters["job_role"] = role
        if location:
            filters["location"] = location
        if year:
            filters["year"] = year
        
        market_data = await salary_dao.get_market_data(filters)
        return {"marketData": market_data}
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

# Admin endpoints for market data (optional - could be restricted to admin users)

@salary_router.post("/market", tags=["salary", "admin"])
async def add_market_data(market_data: MarketData, uuid: str = Depends(authorize)):
    """Add market benchmark data (admin only)"""
    # TODO: Add admin authorization check
    try:
        model = market_data.model_dump()
        result = await salary_dao.add_market_data(model)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    return {"detail": "Successfully added market data", "market_data_id": result}