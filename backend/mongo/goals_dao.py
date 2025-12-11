# goals_dao.py
from mongo.dao_setup import db_client, GOALS
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

class GoalsDAO:
    def __init__(self):
        self.collection = db_client.get_collection(GOALS)

    async def add_goal(self, data: dict) -> str:
        """Add a new goal for a user"""
        time = datetime.now(timezone.utc)
        data["date_created"] = time
        data["date_updated"] = time
        
        # Initialize milestones with IDs if provided
        if "milestones" in data and data["milestones"]:
            for milestone in data["milestones"]:
                if "_id" not in milestone:
                    milestone["_id"] = str(ObjectId())
                if "completed" not in milestone:
                    milestone["completed"] = False
                if "completed_at" not in milestone:
                    milestone["completed_at"] = None
        
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get_all_goals(self, uuid: str) -> list[dict]:
        """Get all goals for a user"""
        cursor = self.collection.find({"uuid": uuid})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_goal(self, goal_id: str) -> Optional[dict]:
        """Get a specific goal by ID"""
        goal = await self.collection.find_one({"_id": ObjectId(goal_id)})
        if goal:
            goal["_id"] = str(goal["_id"])
        return goal

    async def update_goal(self, goal_id: str, data: dict) -> int:
        """Update a goal's information"""
        data["date_updated"] = datetime.now(timezone.utc)
        updated = await self.collection.update_one(
            {"_id": ObjectId(goal_id)}, 
            {"$set": data}
        )
        return updated.matched_count

    async def delete_goal(self, goal_id: str) -> int:
        """Delete a goal"""
        result = await self.collection.delete_one({"_id": ObjectId(goal_id)})
        return result.deleted_count

    async def add_milestone(self, goal_id: str, milestone_data: dict) -> str:
        """Add a milestone to a goal"""
        milestone_id = str(ObjectId())
        milestone_data["_id"] = milestone_id
        milestone_data["completed"] = milestone_data.get("completed", False)
        milestone_data["completed_at"] = milestone_data.get("completed_at", None)
        
        result = await self.collection.update_one(
            {"_id": ObjectId(goal_id)},
            {
                "$push": {"milestones": milestone_data},
                "$set": {"date_updated": datetime.now(timezone.utc)}
            }
        )
        return milestone_id if result.modified_count > 0 else None

    async def update_milestone(self, goal_id: str, milestone_id: str, data: dict) -> int:
        """Update a specific milestone"""
        # If marking as completed, add completed_at timestamp
        if data.get("completed") and not data.get("completed_at"):
            data["completed_at"] = datetime.now(timezone.utc)
        
        result = await self.collection.update_one(
            {"_id": ObjectId(goal_id), "milestones._id": milestone_id},
            {
                "$set": {
                    **{f"milestones.$.{key}": value for key, value in data.items()},
                    "date_updated": datetime.now(timezone.utc)
                }
            }
        )
        return result.modified_count

    async def delete_milestone(self, goal_id: str, milestone_id: str) -> int:
        """Delete a milestone from a goal"""
        result = await self.collection.update_one(
            {"_id": ObjectId(goal_id)},
            {
                "$pull": {"milestones": {"_id": milestone_id}},
                "$set": {"date_updated": datetime.now(timezone.utc)}
            }
        )
        return result.modified_count

    async def get_user_stats(self, uuid: str) -> dict:
        """Calculate statistics for user's goals"""
        goals = await self.get_all_goals(uuid)
        
        total_goals = len(goals)
        completed_goals = len([g for g in goals if g.get("status") == "completed"])
        active_goals = len([g for g in goals if g.get("status") in ["in-progress", "at-risk"]])
        
        # Calculate average progress
        if total_goals > 0:
            total_progress = sum(g.get("progress", 0) for g in goals)
            average_progress = round(total_progress / total_goals)
        else:
            average_progress = 0
        
        # Calculate on-track goals (progress >= expected progress)
        on_track_goals = 0
        for goal in goals:
            if goal.get("status") == "completed":
                on_track_goals += 1
            elif goal.get("status") == "in-progress":
                # Simple heuristic: if progress > 0, consider it on track
                if goal.get("progress", 0) > 0:
                    on_track_goals += 1
        
        completion_rate = round((completed_goals / total_goals * 100)) if total_goals > 0 else 0
        
        return {
            "totalGoals": total_goals,
            "activeGoals": active_goals,
            "completedGoals": completed_goals,
            "averageProgress": average_progress,
            "onTrackGoals": on_track_goals,
            "completionRate": completion_rate
        }

goals_dao = GoalsDAO()