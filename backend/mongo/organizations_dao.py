from mongo.dao_setup import db_client, TEAMS, JOBS
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict

class OrganizationDAO:
    def __init__(self):
        self.org_collection = db_client.get_collection("organizations")
        self.teams_collection = db_client.get_collection(TEAMS)
        self.jobs_collection = db_client.get_collection(JOBS)

    # ============ ORG MANAGEMENT ============

    async def create_organization(self, data: dict) -> str:
        result = await self.org_collection.insert_one(data)
        return str(result.inserted_id)

    async def get_organization(self, org_id: str) -> Optional[dict]:
        return await self.org_collection.find_one({"_id": ObjectId(org_id)})
    
    async def get_admin_org(self, user_uuid: str) -> Optional[dict]:
        """Find which org this user manages"""
        return await self.org_collection.find_one({"admin_ids": user_uuid})
    
    async def remove_admin(self, org_id: str, user_uuid: str) -> bool:
        """Remove a user from the organization's admin list"""
        result = await self.org_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$pull": {"admin_ids": user_uuid}}
        )
        return result.modified_count > 0
    
    async def delete_organization(self, org_id: str) -> bool:
        """Permanently delete an organization"""
        result = await self.org_collection.delete_one({"_id": ObjectId(org_id)})
        return result.deleted_count > 0
    
    async def get_org_members(self, org_id: str) -> List[Dict]:
        """Get a flat list of all members across all cohorts in the organization"""
        pipeline = [
            # 1. Find all teams belonging to this Org
            {"$match": {"organization_id": org_id}},
            # 2. Deconstruct the members array
            {"$unwind": "$members"},
            # 3. Filter for Candidates only (optional, remove if you want mentors too)
            {"$match": {"members.role": "candidate"}},
            # 4. Format the output
            {"$project": {
                "_id": 0,
                "cohort_name": "$name",
                "cohort_id": {"$toString": "$_id"},
                "uuid": "$members.uuid",
                "name": "$members.name",
                "email": "$members.email",
                "role": "$members.role",
                "status": "$members.status",
                "joined_at": "$members.joined_at",
                # Grab high-level stats if available
                "progress": "$members.progress.overall",
                "engagement": "$members.kpis.engagement"
            }},
            {"$sort": {"joined_at": -1}}
        ]
        
        cursor = self.teams_collection.aggregate(pipeline)
        return [doc async for doc in cursor]

    # ============ COHORT MANAGEMENT ============

    async def link_team_to_org(self, org_id: str, team_id: str) -> bool:
        """Mark a team as a 'Cohort' belonging to this Org"""
        # 1. Update Org array
        await self.org_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$addToSet": {"cohort_ids": team_id}}
        )
        # 2. Tag the Team document
        result = await self.teams_collection.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {"organization_id": org_id, "type": "cohort"}}
        )
        return result.modified_count > 0

    # ============ ENTERPRISE ANALYTICS ============

    async def get_program_effectiveness(self, org_id: str) -> Dict:
        """
        Aggregates stats across ALL cohorts to show program health.
        """
        # 1. Get all teams/cohorts in this org
        org = await self.get_organization(org_id)
        if not org: return {}
        
        cohort_ids = [ObjectId(tid) for tid in org.get("cohort_ids", [])]
        
        # 2. Aggregate Member Stats
        # FIX: Await the aggregate call first to get the cursor
        pipeline = [
            {"$match": {"_id": {"$in": cohort_ids}}},
            {"$unwind": "$members"},
            {"$group": {
                "_id": None,
                "total_students": {"$sum": 1},
                "active_students": {
                    "$sum": {"$cond": [{"$eq": ["$members.status", "active"]}, 1, 0]}
                },
                # Check if offers > 0
                "placed_students": {
                    "$sum": {"$cond": [{"$gt": ["$members.kpis.offers", 0]}, 1, 0]}
                }
            }}
        ]
        
        # Robust await logic for aggregate
        cursor = self.teams_collection.aggregate(pipeline)
        if hasattr(cursor, '__await__'):
            cursor = await cursor
            
        member_stats = await cursor.to_list(1)
        
        stats = member_stats[0] if member_stats else {"total_students": 0, "active_students": 0, "placed_students": 0}

        # Aggregate Activity (ROI)
        # Find all students
        teams = await self.teams_collection.find(
            {"_id": {"$in": cohort_ids}}, 
            {"members.uuid": 1}
        ).to_list(None)
        
        student_uuids = []
        for t in teams:
            for m in t.get("members", []):
                if m.get("uuid"): student_uuids.append(m["uuid"])
        
        # Count jobs for these students
       
        job_pipeline = [
            {"$match": {"uuid": {"$in": student_uuids}}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        
        job_cursor = self.jobs_collection.aggregate(job_pipeline)
        if hasattr(job_cursor, '__await__'):
            job_cursor = await job_cursor
            
        job_stats = await job_cursor.to_list(None)
        
        # Format job funnel
        funnel = {
            "Applied": 0,
            "Interview": 0,
            "Offer": 0
        }
        for status_group in job_stats:
            status_key = status_group["_id"]
            if status_key in funnel:
                funnel[status_key] = status_group["count"]
            elif status_key not in ["Rejected", "Interested", None]:
                funnel["Applied"] += status_group["count"]

        return {
            "enrollment": {
                "total": stats.get("total_students", 0),
                "active": stats.get("active_students", 0),
                "cohort_count": len(cohort_ids)
            },
            "outcomes": {
                "placements": funnel["Offer"],
                "placement_rate": round((funnel["Offer"] / stats.get("total_students", 1) * 100), 1) if stats.get("total_students") else 0,
                "interviews": funnel["Interview"]
            },
            "activity_volume": {
                "total_applications": funnel["Applied"] + funnel["Interview"] + funnel["Offer"]
            }
        }
    
    async def get_org_cohorts(self, org_id: str) -> List[Dict]:
        """Get detailed stats for all cohorts in the organization"""
        # Find all teams belonging to this org
        cursor = self.teams_collection.find({"organization_id": org_id})
        cohorts = []
        
        async for team in cursor:
            members = team.get("members", [])
            candidates = [m for m in members if m.get("role") == "candidate"]
            
            total_students = len(candidates)
            
            
            if total_students == 0:
                cohorts.append({
                    "id": str(team["_id"]),
                    "name": team.get("name"),
                    "students": 0,
                    "activity_score": "N/A",
                    "placement_rate": 0,
                    "status": "Active"
                })
                continue
                
            
            total_engagement = sum(c.get("kpis", {}).get("engagement", 0) for c in candidates)
            avg_engagement = total_engagement / total_students
            
            if avg_engagement > 70: activity_label = "High"
            elif avg_engagement > 40: activity_label = "Moderate"
            else: activity_label = "Low"
            
            
            placed_count = 0
            for c in candidates:
                # Check applications for 'Offer' status
                apps = c.get("applications", [])
                if any(app.get("status") == "Offer" for app in apps):
                    placed_count += 1
            
            placement_rate = round((placed_count / total_students) * 100)
            
            cohorts.append({
                "id": str(team["_id"]),
                "name": team.get("name"),
                "students": total_students,
                "activity_score": activity_label,
                "placement_rate": placement_rate,
                "status": "Active" # You could add logic for "Archived" later
            })
            
        return cohorts

organization_dao = OrganizationDAO()