# goals.py
from fastapi import APIRouter, HTTPException, Depends
from pymongo.errors import DuplicateKeyError
from datetime import datetime, date

from mongo.goals_dao import goals_dao
from sessions.session_authorizer import authorize
from schema.Goal import Goal, GoalUpdate, Milestone, MilestoneUpdate

goals_router = APIRouter(prefix="/goals")

def calculate_insights(goals: list, stats: dict) -> list[str]:
    """Generate insights based on user's goals"""
    insights = []
    
    if not goals:
        insights.append("Start by setting your first career goal to track your progress")
        return insights
    
    # Milestone completion insight
    short_term_goals = [g for g in goals if g.get("type") == "short-term"]
    if short_term_goals:
        total_milestones = sum(len(g.get("milestones", [])) for g in short_term_goals)
        completed_milestones = sum(
            len([m for m in g.get("milestones", []) if m.get("completed")]) 
            for g in short_term_goals
        )
        if total_milestones > 0:
            rate = (completed_milestones / total_milestones) * 100
            if rate > 70:
                insights.append(f"You've completed {int(rate)}% of your short-term goals milestones")
            elif rate < 30:
                insights.append("Consider breaking down your short-term goals into smaller milestones")
    
    # Progress tracking insight
    on_track = [g for g in goals if g.get("status") in ["in-progress", "completed"] and g.get("progress", 0) > 50]
    if on_track:
        insights.append(f"{len(on_track)} goal{'s are' if len(on_track) > 1 else ' is'} progressing well - on track for target dates")
    
    # At-risk goals
    at_risk = [g for g in goals if g.get("status") == "at-risk"]
    if at_risk:
        insights.append(f"{len(at_risk)} goal{'s need' if len(at_risk) > 1 else ' needs'} attention to stay on track")
    
    # Recommendation for new goals
    if stats["activeGoals"] < 3 and stats["completedGoals"] > 0:
        insights.append("Consider setting a new skill development goal to maintain momentum")
    
    # Completion celebration
    if stats["completedGoals"] > 0:
        insights.append(f"Great job completing {stats['completedGoals']} goal{'s' if stats['completedGoals'] > 1 else ''}!")
    
    return insights[:4]  # Return max 4 insights

def update_goal_status(goal: dict) -> str:
    """Auto-update goal status based on progress and deadline"""
    if goal.get("progress") == 100:
        return "completed"
    
    target_date = goal.get("target_date")
    if target_date:
        if isinstance(target_date, str):
            target_date = datetime.fromisoformat(target_date).date()
        
        today = date.today()
        if today > target_date:
            return "overdue"
        
        days_remaining = (target_date - today).days
        progress = goal.get("progress", 0)
        
        # At risk if less than 30 days and progress < 50%
        if days_remaining < 30 and progress < 50:
            return "at-risk"
    
    return goal.get("status", "in-progress")

# Goal CRUD endpoints

@goals_router.post("", tags=["goals"])
async def add_goal(goal: Goal, uuid: str = Depends(authorize)):
    """Create a new goal"""
    try:
        model = goal.model_dump()
        
        if not model.get("title"):
            raise HTTPException(422, "Goal requires a title")
        
        model["uuid"] = uuid
        
        # Convert date to ISO string for MongoDB
        if model.get("target_date"):
            model["target_date"] = model["target_date"].isoformat()
        
        # Auto-calculate status
        model["status"] = update_goal_status(model)
        
        result = await goals_dao.add_goal(model)
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, f"Encountered internal server error: {str(e)}")
    
    return {"detail": "Successfully added goal", "goal_id": result}

@goals_router.get("", tags=["goals"])
async def get_goal(goal_id: str, uuid: str = Depends(authorize)):
    """Get a specific goal"""
    try:
        result = await goals_dao.get_goal(goal_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if result:
        # Verify ownership
        if result.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        # Update status before returning
        result["status"] = update_goal_status(result)
        return result
    else:
        raise HTTPException(404, "Goal not found")

@goals_router.get("/me", tags=["goals"])
async def get_all_goals(uuid: str = Depends(authorize)):
    """Get all goals for the current user"""
    try:
        results = await goals_dao.get_all_goals(uuid)
        
        # Update statuses
        for goal in results:
            goal["status"] = update_goal_status(goal)
        
        return results
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

@goals_router.put("", tags=["goals"])
async def update_goal(goal_id: str, goal: GoalUpdate, uuid: str = Depends(authorize)):
    """Update a goal"""
    try:
        # Verify ownership
        existing_goal = await goals_dao.get_goal(goal_id)
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        if existing_goal.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        model = goal.model_dump(exclude_unset=True)
        
        # Convert date to ISO string for MongoDB
        if "target_date" in model and model["target_date"] is not None:
            model["target_date"] = model["target_date"].isoformat()
        
        # Merge with existing data for status calculation
        updated_goal = {**existing_goal, **model}
        model["status"] = update_goal_status(updated_goal)
        
        updated = await goals_dao.update_goal(goal_id, model)
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if updated == 0:
        raise HTTPException(404, "Goal not found")
    else:
        return {"detail": "Successfully updated goal"}

@goals_router.delete("", tags=["goals"])
async def delete_goal(goal_id: str, uuid: str = Depends(authorize)):
    """Delete a goal"""
    try:
        # Verify ownership
        existing_goal = await goals_dao.get_goal(goal_id)
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        if existing_goal.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        deleted = await goals_dao.delete_goal(goal_id)
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if deleted == 0:
        raise HTTPException(404, "Goal not found")
    else:
        return {"detail": "Successfully deleted goal"}

# Milestone endpoints

@goals_router.post("/milestones", tags=["goals"])
async def add_milestone(goal_id: str, milestone: Milestone, uuid: str = Depends(authorize)):
    """Add a milestone to a goal"""
    try:
        # Verify ownership
        existing_goal = await goals_dao.get_goal(goal_id)
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        if existing_goal.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        milestone_data = milestone.model_dump()
        milestone_id = await goals_dao.add_milestone(goal_id, milestone_data)
        
        if not milestone_id:
            raise HTTPException(500, "Failed to add milestone")
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    return {"detail": "Successfully added milestone", "milestone_id": milestone_id}

@goals_router.put("/milestones", tags=["goals"])
async def update_milestone(goal_id: str, milestone_id: str, milestone: MilestoneUpdate, uuid: str = Depends(authorize)):
    """Update a milestone"""
    try:
        # Verify ownership
        existing_goal = await goals_dao.get_goal(goal_id)
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        if existing_goal.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        milestone_data = milestone.model_dump(exclude_unset=True)
        updated = await goals_dao.update_milestone(goal_id, milestone_id, milestone_data)
        
        # Recalculate goal progress based on milestone completion
        if updated > 0:
            goal = await goals_dao.get_goal(goal_id)
            milestones = goal.get("milestones", [])
            if milestones:
                completed = len([m for m in milestones if m.get("completed")])
                progress = int((completed / len(milestones)) * 100)
                await goals_dao.update_goal(goal_id, {"progress": progress})
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if updated == 0:
        raise HTTPException(404, "Milestone not found")
    else:
        return {"detail": "Successfully updated milestone"}

@goals_router.patch("/milestones/toggle", tags=["goals"])
async def toggle_milestone(goal_id: str, milestone_id: str, completed: bool, uuid: str = Depends(authorize)):
    """Quick toggle for milestone completion"""
    try:
        # Verify ownership
        existing_goal = await goals_dao.get_goal(goal_id)
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        if existing_goal.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        milestone_data = {"completed": completed}
        updated = await goals_dao.update_milestone(goal_id, milestone_id, milestone_data)
        
        # Recalculate goal progress
        if updated > 0:
            goal = await goals_dao.get_goal(goal_id)
            milestones = goal.get("milestones", [])
            if milestones:
                completed_count = len([m for m in milestones if m.get("completed")])
                progress = int((completed_count / len(milestones)) * 100)
                await goals_dao.update_goal(goal_id, {"progress": progress})
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if updated == 0:
        raise HTTPException(404, "Milestone not found")
    else:
        return {"detail": "Successfully toggled milestone"}

@goals_router.delete("/milestones", tags=["goals"])
async def delete_milestone(goal_id: str, milestone_id: str, uuid: str = Depends(authorize)):
    """Delete a milestone"""
    try:
        # Verify ownership
        existing_goal = await goals_dao.get_goal(goal_id)
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        if existing_goal.get("uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        deleted = await goals_dao.delete_milestone(goal_id, milestone_id)
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if deleted == 0:
        raise HTTPException(404, "Milestone not found")
    else:
        return {"detail": "Successfully deleted milestone"}

# Analytics endpoints

@goals_router.get("/stats", tags=["goals"])
async def get_stats(uuid: str = Depends(authorize)):
    """Get goal statistics for the user"""
    try:
        stats = await goals_dao.get_user_stats(uuid)
        return stats
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

@goals_router.get("/insights", tags=["goals"])
async def get_insights(uuid: str = Depends(authorize)):
    """Get personalized insights based on goals"""
    try:
        goals = await goals_dao.get_all_goals(uuid)
        stats = await goals_dao.get_user_stats(uuid)
        insights = calculate_insights(goals, stats)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

@goals_router.get("/analytics", tags=["goals"])
async def get_analytics(uuid: str = Depends(authorize)):
    """Get complete analytics data (goals + stats + insights)"""
    try:
        goals = await goals_dao.get_all_goals(uuid)
        
        # Update statuses
        for goal in goals:
            goal["status"] = update_goal_status(goal)
        
        stats = await goals_dao.get_user_stats(uuid)
        insights = calculate_insights(goals, stats)
        
        return {
            "goals": goals,
            "stats": stats,
            "insights": insights
        }
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")