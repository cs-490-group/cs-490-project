from mongo.dao_setup import db_client, TEAMS
from bson import ObjectId
from typing import Optional, List, Dict, Any
from datetime import datetime


class TeamsDAO:
    """Data Access Object for Teams collection"""
    
    def __init__(self):
        self.collection = db_client.get_collection(TEAMS)
    
    # ============ TEAM CRUD ============
    
    async def add_team(self, team_data: Dict[str, Any]) -> str:
        """Create a new team"""
        result = await self.collection.insert_one(team_data)
        return result.inserted_id
    
    async def get_team(self, team_id: str) -> Optional[Dict]:
        """Get team by string ID"""
        try:
            team_id = ObjectId(team_id)
        except:
            return None
        return await self.collection.find_one({"_id": team_id})
    
    async def get_team_by_id(self, team_id: ObjectId) -> Optional[Dict]:
        """Get team by ObjectId"""
        return await self.collection.find_one({"_id": team_id})
    
    async def get_all_teams(self) -> List[Dict]:
        """Get all teams"""
        return await self.collection.find().to_list(None)
    
    async def get_user_teams(self, user_id: str) -> List[Dict]:
        """Get all teams a user belongs to"""
        return await self.collection.find(
            {"members.uuid": user_id}
        ).to_list(None)
    
    async def get_user_team(self, user_id: str) -> Optional[Dict]:
        """Get the single team a user belongs to (max 1 per user)"""
        return await self.collection.find_one(
            {"members.uuid": user_id}
        )
    
    async def find_team_by_member_email(self, email: str) -> Optional[Dict]:
        """Check if email is already in any team"""
        return await self.collection.find_one(
            {"members.email": email}
        )
    
    async def accept_member_invitation(self, team_id: ObjectId, email: str, uuid: str) -> int:
        """Accept an invitation and activate the member"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.email": email, "members.status": "invited"},
            {"$set": {
                "members.$.uuid": uuid,
                "members.$.status": "active",
                "members.$.joined_at": datetime.utcnow(),
                "members.$.kpis": {
                    "completedGoals": 0,
                    "pendingGoals": 0,
                    "engagement": 0,
                    "applications": 0,
                    "lastLogin": datetime.utcnow()
                },
                "members.$.goals": [],
                "members.$.applications": [],
                "members.$.feedback": [],
                "members.$.progress": {"overall": 0}
            }}
        )
        return result.modified_count
    
    async def update_team(self, team_id: ObjectId, update_data: Dict) -> int:
        """Update team details"""
        result = await self.collection.update_one(
            {"_id": team_id},
            {"$set": update_data}
        )
        return result.modified_count
    
    async def delete_team(self, team_id: ObjectId) -> int:
        """Delete a team"""
        result = await self.collection.delete_one({"_id": team_id})
        return result.deleted_count
    
    # ============ TEAM MEMBERS ============
    
    async def add_member_to_team(self, team_id: ObjectId, member_data: Dict) -> int:
        """Add a member to a team"""
        result = await self.collection.update_one(
            {"_id": team_id},
            {"$push": {"members": member_data}}
        )
        return result.modified_count
    
    async def get_team_members(self, team_id: ObjectId) -> List[Dict]:
        """Get all members of a team"""
        team = await self.collection.find_one({"_id": team_id})
        return team.get("members", []) if team else []
    
    async def get_member_by_uuid(self, team_id: ObjectId, member_uuid: str) -> Optional[Dict]:
        """Get a specific member from a team"""
        team = await self.collection.find_one(
            {"_id": team_id},
            {"members": {"$elemMatch": {"uuid": member_uuid}}}
        )
        if team and team.get("members"):
            return team["members"][0]
        return None
    
    async def update_member_role(self, team_id: ObjectId, member_uuid: str, new_role: str) -> int:
        """Update a member's role"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$set": {"members.$.role": new_role}}
        )
        return result.modified_count
    
    async def update_member_progress(self, team_id: ObjectId, member_uuid: str, progress_data: Dict) -> int:
        """Update member progress/KPIs"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$set": {"members.$": progress_data}}
        )
        return result.modified_count
    
    async def remove_member_from_team(self, team_id: ObjectId, member_uuid: str) -> int:
        """Remove a member from a team"""
        result = await self.collection.update_one(
            {"_id": team_id},
            {"$pull": {"members": {"uuid": member_uuid}}}
        )
        return result.modified_count
    
    async def update_member_goals(self, team_id: ObjectId, member_uuid: str, goals: List[Dict]) -> int:
        """Update member goals"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$set": {"members.$.goals": goals}}
        )
        return result.modified_count
    
    async def update_member_applications(self, team_id: ObjectId, member_uuid: str, applications: List[Dict]) -> int:
        """Update member job applications"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$set": {"members.$.applications": applications}}
        )
        return result.modified_count
    
    async def add_member_feedback(self, team_id: ObjectId, member_uuid: str, feedback_data: Dict) -> int:
        """Add feedback to a member"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$push": {"members.$.feedback": feedback_data}}
        )
        return result.modified_count
    
    # ============ BILLING ============
    
    async def get_billing(self, team_id: ObjectId) -> Optional[Dict]:
        """Get team billing information"""
        team = await self.collection.find_one(
            {"_id": team_id},
            {"billing": 1}
        )
        return team.get("billing") if team else None
    
    async def update_billing(self, team_id: ObjectId, billing_update: Dict) -> int:
        """Update team billing information"""
        update_doc = {f"billing.{k}": v for k, v in billing_update.items()}
        update_doc["updated_at"] = datetime.utcnow()
        
        result = await self.collection.update_one(
            {"_id": team_id},
            {"$set": update_doc}
        )
        return result.modified_count
    
    async def add_invoice(self, team_id: ObjectId, invoice_data: Dict) -> int:
        """Add an invoice to billing history"""
        result = await self.collection.update_one(
            {"_id": team_id},
            {"$push": {"billing.invoices": invoice_data}}
        )
        return result.modified_count
    
    # ============ PROGRESS CALCULATION ============
    
    async def calculate_team_progress(self, team_id: ObjectId, jobs_dao=None) -> Dict:
        """Calculate aggregate progress metrics for a team including job applications"""
        print(f"🔍 calculate_team_progress called - jobs_dao={jobs_dao}")
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            print("❌ Team not found")
            return {}
        
        members = team.get("members", [])
        print(f"📋 Total members: {len(members)}")
        for m in members:
            print(f"   Member: {m.get('name')} | role={m.get('role')} | status={m.get('status')} | uuid={m.get('uuid')}")
        # Only calculate progress for active members AND candidates
        active_members = [m for m in members if m.get("status") == "active" and m.get("role") == "candidate"]
        print(f"👥 Active candidates: {len(active_members)}")
        for m in active_members:
            print(f"   - {m.get('name')} (uuid: {m.get('uuid')})")
        
        if not active_members:
            return {
                "overallProgress": 0,
                "totalGoals": 0,
                "completedGoals": 0,
                "totalApplications": 0,
                "memberProgress": []
            }
        
        # Calculate team-wide metrics
        total_goals = sum(len(m.get("goals", [])) for m in active_members)
        completed_goals = sum(
            len([g for g in m.get("goals", []) if g.get("completed")]) 
            for m in active_members
        )
        
        # Will be calculated after member_progress is built
        total_applications = 0
        
        overall_progress = int((completed_goals / total_goals * 100) if total_goals > 0 else 0)
        
        # Calculate per-member progress
        member_progress = []
        for member in active_members:
            member_uuid = member.get("uuid")
            member_goals = member.get("goals", [])
            member_completed = len([g for g in member_goals if g.get("completed")])
            member_total = len(member_goals)
            member_pct = int((member_completed / member_total * 100) if member_total > 0 else 0)
            
            # Fetch job applications for this member - try jobs_dao first, fall back to member applications
            member_applications = {
                "total": 0,
                "response": 0,
                "interview": 0,
                "success": 0,
                "responseRate": 0,
                "interviewRate": 0,
                "successRate": 0
            }
            
            user_jobs = []
            
            # Fetch job applications for this member from jobs_dao
            if jobs_dao and member_uuid:
                try:
                    user_jobs = await jobs_dao.get_all_jobs(member_uuid)
                    member_applications["total"] = len(user_jobs)
                    
                    # Count by status
                    for job in user_jobs:
                        status = job.get("status", "")
                        if status == "Screening":
                            member_applications["response"] += 1
                        elif status == "Interview":
                            member_applications["interview"] += 1
                        elif status == "Offer":
                            member_applications["success"] += 1
                    
                    # Calculate percentages
                    if member_applications["total"] > 0:
                        member_applications["responseRate"] = int((member_applications["response"] / member_applications["total"]) * 100)
                        member_applications["interviewRate"] = int((member_applications["interview"] / member_applications["total"]) * 100)
                        member_applications["successRate"] = int((member_applications["success"] / member_applications["total"]) * 100)
                except Exception as e:
                    print(f"Error fetching jobs for member {member_uuid}: {e}")
            
            member_progress.append({
                "uuid": member_uuid,
                "name": member.get("name"),
                "role": member.get("role"),
                "progress": member_pct,
                "completedGoals": member_completed,
                "totalGoals": member_total,
                "applications": member_applications,
                "engagement": member.get("kpis", {}).get("engagement", 0)
            })
        
        # Sum total applications from member data
        total_applications = sum(m["applications"]["total"] for m in member_progress)
        
        return {
            "overallProgress": overall_progress,
            "totalGoals": total_goals,
            "completedGoals": completed_goals,
            "totalApplications": total_applications,
            "memberProgress": member_progress
        }
    
    # ============ REPORTS ============
    
    async def get_team_reports(self, team_id: ObjectId) -> Dict:
        """Generate team performance reports"""
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return {}
        
        members = team.get("members", [])
        # Only include active candidates in reports
        active_members = [m for m in members if m.get("status") == "active" and m.get("role") == "candidate"]
        
        # Calculate aggregates
        total_goals = sum(len(m.get("goals", [])) for m in active_members)
        completed_goals = sum(
            len([g for g in m.get("goals", []) if g.get("completed")]) 
            for m in active_members
        )
        total_applications = sum(len(m.get("applications", [])) for m in active_members)
        
        avg_engagement = 0
        if active_members:
            avg_engagement = sum(
                m.get("kpis", {}).get("engagement", 0) for m in active_members
            ) / len(active_members)
        
        # Engagement by role (only candidates for now)
        engagement_by_role = {}
        for role in ["candidate"]:
            role_members = [m for m in active_members if m.get("role") == role]
            if role_members:
                avg = sum(
                    m.get("kpis", {}).get("engagement", 0) for m in role_members
                ) / len(role_members)
                engagement_by_role[role] = avg
        
        # Top performers and needs attention
        members_with_engagement = [
            {
                "name": m.get("name"),
                "uuid": m.get("uuid"),
                "role": m.get("role"),
                "engagement": m.get("kpis", {}).get("engagement", 0),
                "progress": m.get("progress", {}).get("overall", 0)
            }
            for m in active_members
        ]
        
        top_performers = sorted(
            members_with_engagement, 
            key=lambda x: x["engagement"], 
            reverse=True
        )[:5]
        
        needs_attention = sorted(
            members_with_engagement, 
            key=lambda x: x["engagement"]
        )[:5]
        
        return {
            "overallProgress": int((completed_goals / total_goals * 100) if total_goals > 0 else 0),
            "totalGoalsCompleted": completed_goals,
            "totalApplicationsSent": total_applications,
            "averageEngagement": int(avg_engagement),
            "memberBreakdown": {
                "total": len(active_members),
                "byRole": {
                    "candidate": len([m for m in active_members if m.get("role") == "candidate"])
                }
            },
            "engagementByRole": engagement_by_role,
            "topPerformers": top_performers,
            "needsAttention": needs_attention
        }
    
    async def get_member_report(self, team_id: ObjectId, member_uuid: str) -> Optional[Dict]:
        """Get individual member coaching report"""
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return None
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return None
        
        completed_goals = len([g for g in member.get("goals", []) if g.get("completed")])
        pending_goals = len([g for g in member.get("goals", []) if not g.get("completed")])
        
        # Generate coaching insights based on data
        insights = []
        engagement = member.get("kpis", {}).get("engagement", 0)
        
        if engagement < 50:
            insights.append("Low engagement detected - consider reaching out for support")
        if engagement >= 90:
            insights.append("Excellent engagement - consider peer mentoring opportunities")
        if pending_goals > completed_goals:
            insights.append("Focus on completing pending goals")
        if member.get("kpis", {}).get("applications", 0) < 5:
            insights.append("Encourage more job applications")
        
        recommendations = [
            "Schedule regular check-ins to discuss progress",
            "Review and provide feedback on job applications",
            "Set clear milestones for the next 30 days",
            "Celebrate wins and completed goals"
        ]
        
        return {
            "name": member.get("name"),
            "role": member.get("role"),
            "progressScore": member.get("progress", {}).get("overall", 0),
            "completedGoals": completed_goals,
            "pendingGoals": pending_goals,
            "applications": member.get("kpis", {}).get("applications", 0),
            "engagement": engagement,
            "lastActive": member.get("kpis", {}).get("lastLogin"),
            "coachingInsights": insights,
            "recommendations": recommendations
        }


# Initialize teams_dao with the TEAMS collection from dao_setup
teams_dao = TeamsDAO()