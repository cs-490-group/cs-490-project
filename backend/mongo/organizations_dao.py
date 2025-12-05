from mongo.dao_setup import db_client, TEAMS, JOBS
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict

class OrganizationDAO:
    def __init__(self):
        # 1. ORG COLLECTION (For the Institution itself)
        self.org_collection = db_client.get_collection("organizations")
        
        # 2. TEAMS COLLECTION (For Cohorts)
        self.teams_collection = db_client.get_collection(TEAMS)
        
        # 3. JOBS COLLECTION (For Analytics)
        self.jobs_collection = db_client.get_collection(JOBS)

    # ============ ORG MANAGEMENT ============

    async def create_organization(self, data: dict) -> str:
        """Create a new Organization document"""
        # 🚨 ENSURE THIS USES org_collection, NOT teams_collection
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
    
    # ============ COHORT MANAGEMENT ============

    async def link_team_to_org(self, org_id: str, team_id: str) -> bool:
        """
        Links a Team (Cohort) to an Organization.
        Updates BOTH collections.
        """
        # 1. Add Team ID to Organization's cohort list
        await self.org_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$addToSet": {"cohort_ids": team_id}}
        )
        
        # 2. Add Org ID to Team document
        result = await self.teams_collection.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {"organization_id": org_id, "type": "cohort"}}
        )
        return result.modified_count > 0

    async def get_org_cohorts(self, org_id: str) -> List[Dict]:
        """Get detailed stats for all cohorts (teams) in the organization"""
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
                
            # Activity Score
            total_engagement = sum(c.get("kpis", {}).get("engagement", 0) for c in candidates)
            avg_engagement = total_engagement / total_students
            if avg_engagement > 70: activity_label = "High"
            elif avg_engagement > 40: activity_label = "Moderate"
            else: activity_label = "Low"
            
            # Placement Rate
            placed_count = 0
            for c in candidates:
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
                "status": "Active"
            })
            
        return cohorts

    async def get_org_members(self, org_id: str) -> List[Dict]:
        """Get a flat list of all members across all cohorts"""
        pipeline = [
            {"$match": {"organization_id": org_id}},
            {"$unwind": "$members"},
            {"$match": {"members.role": "candidate"}},
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
                "progress": "$members.progress.overall",
                "engagement": "$members.kpis.engagement"
            }},
            {"$sort": {"joined_at": -1}}
        ]
        
        cursor = self.teams_collection.aggregate(pipeline)
        if hasattr(cursor, '__await__'): cursor = await cursor
        return [doc async for doc in cursor]

    # ============ ENTERPRISE ANALYTICS ============

    async def get_program_effectiveness(self, org_id: str) -> Dict:
        """Aggregates stats across ALL cohorts"""
        org = await self.get_organization(org_id)
        if not org: return {}
        
        cohort_ids = [ObjectId(tid) for tid in org.get("cohort_ids", [])]
        
        # 1. Member Stats
        pipeline = [
            {"$match": {"_id": {"$in": cohort_ids}}},
            {"$unwind": "$members"},
            {"$group": {
                "_id": None,
                "total_students": {"$sum": 1},
                "active_students": {
                    "$sum": {"$cond": [{"$eq": ["$members.status", "active"]}, 1, 0]}
                }
            }}
        ]
        
        cursor = self.teams_collection.aggregate(pipeline)
        if hasattr(cursor, '__await__'): cursor = await cursor
        member_stats = await cursor.to_list(1)
        stats = member_stats[0] if member_stats else {"total_students": 0, "active_students": 0}

        # 2. Activity (ROI)
        teams = await self.teams_collection.find(
            {"_id": {"$in": cohort_ids}}, 
            {"members.uuid": 1}
        ).to_list(None)
        
        student_uuids = []
        for t in teams:
            for m in t.get("members", []):
                if m.get("uuid"): student_uuids.append(m["uuid"])
        
        job_pipeline = [
            {"$match": {"uuid": {"$in": student_uuids}}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        
        job_cursor = self.jobs_collection.aggregate(job_pipeline)
        if hasattr(job_cursor, '__await__'): job_cursor = await job_cursor
        job_stats = await job_cursor.to_list(None)
        
        funnel = {"Applied": 0, "Interview": 0, "Offer": 0}
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

organization_dao = OrganizationDAO()