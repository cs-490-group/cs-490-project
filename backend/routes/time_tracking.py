from fastapi import APIRouter, HTTPException, Depends
from schema.TimeTracking import TimeEntry, TimeEntryUpdate
from typing import List, Dict
from datetime import datetime

# Assuming you have these imports from your existing setup
from sessions.session_authorizer import authorize
from mongo.time_tracking_dao import time_tracking_dao

time_tracking_router = APIRouter(prefix="/time-tracking", tags=["time-tracking"])

@time_tracking_router.post("", status_code=201)
async def add_time_entry(entry: TimeEntry, uuid: str = Depends(authorize)):
    """Add a new time tracking entry"""
    try:
        # Validate date format
        try:
            datetime.fromisoformat(entry.date)
        except ValueError:
            raise HTTPException(400, "Invalid date format. Use ISO format (YYYY-MM-DD)")
        
        entry_data = entry.model_dump()
        result = await time_tracking_dao.add_entry(uuid, entry_data)
        
        return {
            "detail": "Time entry added successfully",
            "entry_id": result
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Failed to add time entry: {str(e)}")

@time_tracking_router.get("")
async def get_time_entry(entry_id: str, uuid: str = Depends(authorize)):
    """Get a specific time entry"""
    try:
        entry = await time_tracking_dao.get_entry(entry_id)
        
        if not entry:
            raise HTTPException(404, "Time entry not found")
        
        # Verify ownership
        if entry.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Failed to retrieve time entry")

@time_tracking_router.get("/me")
async def get_all_entries(uuid: str = Depends(authorize)):
    """Get all time entries for the current user"""
    try:
        entries = await time_tracking_dao.get_all_entries(uuid)
        return entries
    except Exception as e:
        raise HTTPException(500, "Failed to retrieve time entries")

@time_tracking_router.put("")
async def update_time_entry(
    entry_id: str,
    entry: TimeEntryUpdate,
    uuid: str = Depends(authorize)
):
    """Update a time entry"""
    try:
        # Check if entry exists and user owns it
        existing = await time_tracking_dao.get_entry(entry_id)
        if not existing:
            raise HTTPException(404, "Time entry not found")
        
        if existing.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        # Validate date if provided
        if entry.date:
            try:
                datetime.fromisoformat(entry.date)
            except ValueError:
                raise HTTPException(400, "Invalid date format. Use ISO format (YYYY-MM-DD)")
        
        update_data = entry.model_dump(exclude_unset=True)
        success = await time_tracking_dao.update_entry(entry_id, update_data)
        
        if not success:
            raise HTTPException(500, "Failed to update time entry")
        
        return {"detail": "Time entry updated successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Failed to update time entry: {str(e)}")

@time_tracking_router.delete("")
async def delete_time_entry(entry_id: str, uuid: str = Depends(authorize)):
    """Delete a time entry"""
    try:
        # Check if entry exists and user owns it
        existing = await time_tracking_dao.get_entry(entry_id)
        if not existing:
            raise HTTPException(404, "Time entry not found")
        
        if existing.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        success = await time_tracking_dao.delete_entry(entry_id)
        
        if not success:
            raise HTTPException(500, "Failed to delete time entry")
        
        return {"detail": "Time entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Failed to delete time entry")

@time_tracking_router.get("/summary")
async def get_time_summary(days: int = 30, uuid: str = Depends(authorize)):
    """Get time allocation summary for the last N days"""
    try:
        if days < 1 or days > 365:
            raise HTTPException(400, "Days must be between 1 and 365")
        
        summary = await time_tracking_dao.get_time_summary(uuid, days)
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Failed to generate time summary")

@time_tracking_router.get("/recent")
async def get_recent_entries(limit: int = 10, uuid: str = Depends(authorize)):
    """Get recent time entries"""
    try:
        if limit < 1 or limit > 100:
            raise HTTPException(400, "Limit must be between 1 and 100")
        
        entries = await time_tracking_dao.get_recent_entries(uuid, limit)
        return entries
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Failed to retrieve recent entries")

@time_tracking_router.get("/analytics")
async def get_time_analytics(days: int = 30, uuid: str = Depends(authorize)):
    """Get complete time tracking analytics"""
    try:
        if days < 1 or days > 365:
            raise HTTPException(400, "Days must be between 1 and 365")
        
        # Get summary statistics
        summary = await time_tracking_dao.get_time_summary(uuid, days)
        
        # Get recent entries
        recent = await time_tracking_dao.get_recent_entries(uuid, 10)
        
        # Generate insights
        insights = generate_insights(summary)
        
        return {
            "summary": summary,
            "recent_entries": recent,
            "insights": insights
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Failed to generate analytics")

def generate_insights(summary: Dict) -> List[str]:
    """Generate productivity insights from summary data"""
    insights = []
    
    total_hours = summary.get("total_hours", 0)
    daily_avg = summary.get("daily_average", 0)
    most_productive = summary.get("most_productive_activity")
    activity_breakdown = summary.get("activity_breakdown", {})
    period_days = summary.get("period_days", 30)
    
    # Insight 1: Total time investment
    if total_hours > 0:
        insights.append(
            f"You've invested {total_hours} hours over the last {period_days} days, "
            f"averaging {daily_avg} hours per day"
        )
    else:
        insights.append("Start tracking your time to gain insights into your job search productivity")
    
    # Insight 2: Most time-consuming activity
    if most_productive:
        hours = activity_breakdown[most_productive]["hours"]
        percentage = activity_breakdown[most_productive]["percentage"]
        insights.append(
            f"{most_productive} is your primary focus, representing {percentage}% "
            f"of your time ({hours} hours)"
        )
    
    # Insight 3: Activity diversity
    num_activities = len(activity_breakdown)
    if num_activities >= 4:
        insights.append(
            f"Great job maintaining variety! You're actively working on {num_activities} "
            f"different areas of your job search"
        )
    elif num_activities == 1:
        insights.append(
            "Consider diversifying your activities to improve your chances of success"
        )
    
    # Insight 4: Consistency recommendation
    if daily_avg < 1 and total_hours > 0:
        insights.append(
            "Tip: Consistent daily effort, even just 1-2 hours, is more effective than sporadic bursts"
        )
    elif daily_avg >= 3:
        insights.append(
            "Excellent dedication! Remember to balance intensity with rest to avoid burnout"
        )
    
    # Insight 5: Application balance
    if "Applications" in activity_breakdown:
        app_hours = activity_breakdown["Applications"]["hours"]
        app_pct = activity_breakdown["Applications"]["percentage"]
        
        if app_pct < 20 and total_hours > 10:
            insights.append(
                "Consider increasing time on Applications - direct outreach is crucial for job search success"
            )
        elif app_pct > 60:
            insights.append(
                "Balance application volume with skill development and networking for best results"
            )
    
    return insights if insights else ["Keep tracking your time to unlock productivity insights!"]