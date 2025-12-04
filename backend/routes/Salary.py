from fastapi import APIRouter, HTTPException, Depends, Query
from schema.Salary import SalaryRecord, SalaryRecordUpdate, MarketData
from mongo.salary_dao import salary_dao
from typing import List, Dict

# Assuming you have an authorize dependency from your auth module
from sessions.session_authorizer import authorize
salary_router = APIRouter(prefix="/api/salary", tags=["Salary"])

@salary_router.post("", status_code=201)
async def add_salary_record(record: SalaryRecord, uuid: str = Depends(authorize)):
    """Add a new salary record"""
    try:
        # Calculate total compensation
        total_comp = record.salary_amount
        if record.bonus:
            total_comp += record.bonus
        if record.equity_value:
            total_comp += record.equity_value
        
        record_data = record.model_dump()
        record_data["uuid"] = uuid
        record_data["total_compensation"] = total_comp
        
        result = await salary_dao.add_salary_record(record_data)
        
        return {
            "detail": "Salary record added successfully",
            "salary_id": result
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to add salary record: {str(e)}")

@salary_router.get("")
async def get_salary_record(salary_id: str = Query(...), uuid: str = Depends(authorize)):
    """Get a specific salary record"""
    try:
        record = await salary_dao.get_salary_record(salary_id)
        
        if not record:
            raise HTTPException(404, "Salary record not found")
        
        # Verify ownership
        if record.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Failed to retrieve salary record")

@salary_router.get("/me")
async def get_all_salary_records(uuid: str = Depends(authorize)):
    """Get all salary records for the current user"""
    try:
        records = await salary_dao.get_all_salary_records(uuid)
        return records
    except Exception as e:
        raise HTTPException(500, "Failed to retrieve salary records")

@salary_router.put("")
async def update_salary_record(
    salary_id: str = Query(...),
    record: SalaryRecordUpdate = ...,
    uuid: str = Depends(authorize)
):
    """Update a salary record"""
    try:
        # Check if record exists and user owns it
        existing = await salary_dao.get_salary_record(salary_id)
        if not existing:
            raise HTTPException(404, "Salary record not found")
        
        if existing.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        # Calculate total compensation if amounts are being updated
        update_data = record.model_dump(exclude_unset=True)
        
        if any(key in update_data for key in ["salary_amount", "bonus", "equity_value"]):
            salary_amount = update_data.get("salary_amount", existing.get("salary_amount", 0))
            bonus = update_data.get("bonus", existing.get("bonus", 0))
            equity = update_data.get("equity_value", existing.get("equity_value", 0))
            
            update_data["total_compensation"] = salary_amount + (bonus or 0) + (equity or 0)
        
        success = await salary_dao.update_salary_record(salary_id, update_data)
        
        if not success:
            raise HTTPException(500, "Failed to update salary record")
        
        return {"detail": "Salary record updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update salary record: {str(e)}")

@salary_router.delete("")
async def delete_salary_record(salary_id: str = Query(...), uuid: str = Depends(authorize)):
    """Delete a salary record"""
    try:
        # Check if record exists and user owns it
        existing = await salary_dao.get_salary_record(salary_id)
        if not existing:
            raise HTTPException(404, "Salary record not found")
        
        if existing.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        success = await salary_dao.delete_salary_record(salary_id)
        
        if not success:
            raise HTTPException(500, "Failed to delete salary record")
        
        return {"detail": "Salary record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Failed to delete salary record")

@salary_router.get("/history")
async def get_salary_history(uuid: str = Depends(authorize)):
    """Get salary history formatted for charts"""
    try:
        history = await salary_dao.get_salary_history(uuid)
        return history
    except Exception as e:
        raise HTTPException(500, "Failed to retrieve salary history")

@salary_router.get("/stats")
async def get_salary_stats(uuid: str = Depends(authorize)):
    """Get salary statistics"""
    try:
        stats = await salary_dao.calculate_stats(uuid)
        return stats
    except Exception as e:
        raise HTTPException(500, "Failed to calculate salary statistics")

@salary_router.get("/analytics")
async def get_salary_analytics(uuid: str = Depends(authorize)):
    """Get complete salary analytics (history + stats + insights)"""
    try:
        # Get salary history and stats
        history = await salary_dao.get_salary_history(uuid)
        stats = await salary_dao.calculate_stats(uuid)
        market_position = await salary_dao.get_market_position(uuid)
        
        # Generate insights
        insights = generate_insights(stats, history, market_position)
        
        return {
            "salaryHistory": history,
            "stats": stats,
            "marketPosition": market_position,
            "insights": insights
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to generate salary analytics: {str(e)}")

@salary_router.get("/market")
async def get_market_data(
    role: str = Query(None),
    location: str = Query(None),
    year: int = Query(None),
    uuid: str = Depends(authorize)
):
    """Get market salary data for comparison"""
    try:
        filters = {}
        if year:
            filters["year"] = year
        if role:
            filters["job_role"] = role
        if location:
            filters["location"] = location
        
        market_data = await salary_dao.get_market_data(filters)
        return market_data
    except Exception as e:
        raise HTTPException(500, "Failed to retrieve market data")

# Market data management (admin/system endpoints)
@salary_router.post("/market", status_code=201)
async def add_market_data(data: MarketData, uuid: str = Depends(authorize)):
    """Add market benchmark data (admin only)"""
    try:
        # In production, add admin check here
        result = await salary_dao.add_market_data(data.model_dump())
        return {
            "detail": "Market data added successfully",
            "market_id": result
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to add market data: {str(e)}")

def generate_insights(stats: Dict, history: List[Dict], market_position: str) -> List[str]:
    """Generate salary insights based on data"""
    insights = []
    
    current_salary = stats.get("currentSalary", 0)
    market_avg = stats.get("marketAverage", 0)
    total_growth = stats.get("totalGrowth", 0)
    yoy_growth = stats.get("yearOverYearGrowth", 0)
    percentile = stats.get("percentileRank", 0)
    
    # Insight 1: Overall growth
    if len(history) > 1 and total_growth > 0:
        years = len(history)
        insights.append(
            f"Your salary has grown {total_growth}% over the past {years} years"
        )
    
    # Insight 2: Market position
    if market_avg > 0:
        diff_pct = round(((current_salary / market_avg - 1) * 100), 1)
        if current_salary > market_avg:
            insights.append(
                f"You're currently earning {abs(diff_pct)}% above market average"
            )
        elif current_salary < market_avg:
            insights.append(
                f"You're currently earning {abs(diff_pct)}% below market average"
            )
        else:
            insights.append("You're earning at the market average rate")
    
    # Insight 3: Recent growth
    if yoy_growth > 0:
        insights.append(
            f"Year-over-year growth of {yoy_growth}% "
            f"{'exceeds' if yoy_growth > 5 else 'is within'} typical industry rates"
        )
    
    # Insight 4: Percentile ranking
    if percentile > 75:
        insights.append(
            f"You're in the top {100 - percentile}% of earners in your field"
        )
    elif percentile < 25:
        insights.append(
            "Consider negotiating for a salary increase to reach market average"
        )
    
    # Insight 5: Trajectory
    if len(history) >= 3:
        recent_growth = [
            (history[i]["salary"] - history[i-1]["salary"]) / history[i-1]["salary"] * 100
            for i in range(1, min(4, len(history)))
            if history[i-1]["salary"] > 0
        ]
        if recent_growth:
            avg_growth = sum(recent_growth) / len(recent_growth)
            if avg_growth > 8:
                insights.append("Your salary trajectory is strong - keep up the momentum!")
            elif avg_growth < 3:
                insights.append("Your salary growth has slowed - consider exploring new opportunities")
    
    return insights if insights else ["Track more salary data to unlock personalized insights"]