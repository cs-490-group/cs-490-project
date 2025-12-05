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
            print(f"Converting team_id: {team_id} (type: {type(team_id)})")
            team_id = ObjectId(team_id)
            print(f"Converted to ObjectId: {team_id}")
        except Exception as e:
            print(f" Failed to convert: {e}")
            return None
        result = await self.collection.find_one({"_id": team_id})
        print(f"Found team: {result is not None}")
        return result
        
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
                "members.$.progress": {"overall": 0},

                "members.$.progress_sharing": {
                "allow_sharing": True,
                "default_privacy_settings": {
                    "can_see_goals": True,
                    "can_see_applications": True,
                    "can_see_engagement": True,
                    "can_see_full_progress": False,
                    "can_see_milestones": True,
                    "can_see_feedback": False
                },
                "shared_with": []
            },
            "members.$.milestones": [],
            "members.$.celebrations": []
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

        full_member_data = {
        **member_data,
        "progress_sharing": member_data.get("progress_sharing", {
            "allow_sharing": True,
            "default_privacy_settings": {
                "can_see_goals": True,
                "can_see_applications": True,
                "can_see_engagement": True,
                "can_see_full_progress": False,
                "can_see_milestones": True,
                "can_see_feedback": False
            },
            "shared_with": []
        }),
        "milestones": member_data.get("milestones", []),
        "celebrations": member_data.get("celebrations", [])
    }
        result = await self.collection.update_one(
            {"_id": team_id},
            {"$push": {"members": full_member_data}}
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
        """Remove a member from a team, with ghost cleanup fallback"""
        
        # 1. Standard Removal (by UUID)
        result = await self.collection.update_one(
            {"_id": team_id},
            {"$pull": {"members": {"uuid": member_uuid}}}
        )
        
        # 2. Fallback: If member_uuid was passed as "null" or None, clean up ghosts
        if result.modified_count == 0 and (not member_uuid or member_uuid == "null"):
            # Remove any member where uuid is None OR uuid does not exist
            result = await self.collection.update_one(
                {"_id": team_id},
                {"$pull": {"members": {"uuid": None}}} 
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
    # ============ ENGAGEMENT TRACKING ============

    async def update_member_activity(self, team_id: ObjectId, member_uuid: str, activity_type: str) -> int:
        """Track member activity: login, goal_completed, application_sent, feedback_received"""
        activity_log = {
            "type": activity_type,
            "timestamp": datetime.utcnow()
        }
        
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$push": {"members.$.activity_log": activity_log}}
        )
        
        # Recalculate engagement after logging activity
        if result.modified_count > 0:
            await self.calculate_member_engagement(team_id, member_uuid)
        
        return result.modified_count


    async def calculate_member_engagement(self, team_id: ObjectId, member_uuid: str) -> None:
        """Calculate engagement score based on recent activity (0-100)"""
        from datetime import timedelta
        
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return
        
        # Get activity from last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        activity_log = member.get("activity_log", [])
        recent_activity = [a for a in activity_log if a.get("timestamp", datetime.min) > thirty_days_ago]
        
        # Count activity types
        logins = len([a for a in recent_activity if a.get("type") == "login"])
        goals_completed = len([a for a in recent_activity if a.get("type") == "goal_completed"])
        applications_sent = len([a for a in recent_activity if a.get("type") == "application_sent"])
        feedback_received = len([a for a in recent_activity if a.get("type") == "feedback_received"])
        
        # Calculate engagement score (0-100)
        # Weights: logins (30%), goals (30%), applications (25%), feedback (15%)
        login_score = min(logins / 10 * 30, 30)  # Max 30 points (3+ logins per week)
        goal_score = min(goals_completed / 5 * 30, 30)  # Max 30 points (5+ goals per month)
        app_score = min(applications_sent / 10 * 25, 25)  # Max 25 points (10+ apps per month)
        feedback_score = min(feedback_received / 3 * 15, 15)  # Max 15 points (3+ feedbacks per month)
        
        engagement_score = int(login_score + goal_score + app_score + feedback_score)
        
        
        # Update member's engagement in the database
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$set": {
                "members.$.kpis.engagement": engagement_score,
                "members.$.last_engagement_update": datetime.utcnow()
            }}
        )
        
        print(f"   Database update result: {result.modified_count} documents modified")
        if result.modified_count == 0:
            print(f"Failed to update engagement in database!")
        else:
            print(f"Engagement saved to database: {engagement_score}%")


    async def get_member_activity_summary(self, team_id: ObjectId, member_uuid: str) -> dict:
        """Get activity summary for a member (last 30 days)"""
        from datetime import timedelta
        
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return {}
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return {}
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        activity_log = member.get("activity_log", [])
        recent_activity = [a for a in activity_log if a.get("timestamp", datetime.min) > thirty_days_ago]
        
        last_active = max([a.get("timestamp") for a in recent_activity], default=member.get("joined_at"))
        days_since_active = (datetime.utcnow() - last_active).days if last_active else 0
        
        return {
            "logins": len([a for a in recent_activity if a.get("type") == "login"]),
            "goals_completed": len([a for a in recent_activity if a.get("type") == "goal_completed"]),
            "applications_sent": len([a for a in recent_activity if a.get("type") == "application_sent"]),
            "feedback_received": len([a for a in recent_activity if a.get("type") == "feedback_received"]),
            "last_active": last_active,
            "days_since_active": days_since_active,
            "total_activity_count": len(recent_activity),
            "engagement_score": member.get("kpis", {}).get("engagement", 0)
        }
    
    # ============ PROGRESS CALCULATION ============
    
    async def calculate_team_progress(self, team_id: ObjectId, jobs_dao=None) -> Dict:
        """Calculate aggregate progress metrics for a team including all 5 goals"""
        print(f"calculate_team_progress called - jobs_dao={jobs_dao}")
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            print("Team not found")
            return {}
        
        members = team.get("members", [])
        print(f"Total members: {len(members)}")
        
        # Only calculate progress for active members AND candidates
        active_members = [m for m in members if m.get("status") == "active" and m.get("role") == "candidate"]
        
        if not active_members:
            return {
                "overallProgress": 0,
                "totalGoals": 0,
                "completedGoals": 0,
                "totalApplications": 0,
                "memberProgress": []
            }
        
        def extract_goals_from_config(goals_list):
            """Extract the goals_config data and return as individual goal objects with completion status"""
            goals_config = next((g for g in goals_list if g.get("id") == "goals_config"), None)
            
            if not goals_config or not goals_config.get("data"):
                return []
            
            data = goals_config.get("data", {})
            goals = []
            
            # Create goal objects for each of the 5 goals
            if data.get("weeklyApplications", 0) > 0:
                goals.append({
                    "id": "weekly_applications",
                    "title": "Weekly Applications",
                    "target": data.get("weeklyApplications"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("monthlyApplications", 0) > 0:
                goals.append({
                    "id": "monthly_applications",
                    "title": "Monthly Applications",
                    "target": data.get("monthlyApplications"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("monthlyInterviews", 0) > 0:
                goals.append({
                    "id": "monthly_interviews",
                    "title": "Monthly Interviews",
                    "target": data.get("monthlyInterviews"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("targetResponseRate", 0) > 0:
                goals.append({
                    "id": "target_response_rate",
                    "title": "Target Response Rate",
                    "target": data.get("targetResponseRate"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("targetInterviewRate", 0) > 0:
                goals.append({
                    "id": "target_interview_rate",
                    "title": "Target Interview Rate",
                    "target": data.get("targetInterviewRate"),
                    "completed": False,
                    "actual": 0
                })
            
            return goals
        
        # Calculate per-member progress
        member_progress = []
        for member in active_members:
            member_uuid = member.get("uuid")
            member_goals = extract_goals_from_config(member.get("goals", []))
            
            print(f"Processing member: {member.get('name')} - {len(member_goals)} goals found")
            
            # Fetch job applications for this member
            member_applications = {
                "total": 0,
                "response": 0,
                "interview": 0,
                "success": 0,
                "responseRate": 0,
                "interviewRate": 0,
                "successRate": 0
            }
            
            applications_this_week = 0
            applications_this_month = 0
            interviews_this_month = 0
            
            # Fetch job applications for this member from jobs_dao
            if jobs_dao and member_uuid:
                try:
                    from datetime import timedelta
                    
                    user_jobs = await jobs_dao.get_all_jobs(member_uuid)
                    member_applications["total"] = len(user_jobs)
                    
                    # Calculate time windows
                    now = datetime.utcnow()
                    week_ago = now - timedelta(days=7)
                    month_ago = now - timedelta(days=30)
                    

                    
                    # Count by status and time windows
                    for job in user_jobs:
                        status = job.get("status", "")
                        # Use the helper function to parse date_created
                        created_at = self._parse_job_date(job.get("date_created"))
                        
                        
                        if created_at:
                            
                            # Count applications this week
                            if created_at > week_ago:
                                applications_this_week += 1
                            
                            # Count applications this month
                            if created_at > month_ago:
                                applications_this_month += 1
                            
                            # Count interviews this month
                            if status == "Interview" and created_at > month_ago:
                                interviews_this_month += 1
                        
                        # Count by status for rates
                        if status == "Offer":
                            member_applications["success"] += 1
                            member_applications["interview"] += 1
                            member_applications["response"] += 1
                        elif status == "Interview":
                            member_applications["interview"] += 1
                            member_applications["response"] += 1
                        elif status == "Screening":
                            member_applications["response"] += 1
                    
                    # Calculate percentages
                    if member_applications["total"] > 0:
                        member_applications["responseRate"] = int((member_applications["response"] / member_applications["total"]) * 100)
                        member_applications["interviewRate"] = int((member_applications["interview"] / member_applications["total"]) * 100)
                        member_applications["successRate"] = int((member_applications["success"] / member_applications["total"]) * 100)
          
                    
                    #  Update ALL 5 GOALS based on actual metrics
                    for goal in member_goals:
                        if goal.get("id") == "weekly_applications":
                            goal["actual"] = applications_this_week
                            goal["completed"] = applications_this_week >= goal.get("target", 0)
                        elif goal.get("id") == "monthly_applications":
                            goal["actual"] = applications_this_month
                            goal["completed"] = applications_this_month >= goal.get("target", 0)
                        elif goal.get("id") == "monthly_interviews":
                            goal["actual"] = interviews_this_month
                            goal["completed"] = interviews_this_month >= goal.get("target", 0)
                        elif goal.get("id") == "target_response_rate":
                            goal["actual"] = member_applications["responseRate"]
                            goal["completed"] = member_applications["responseRate"] >= goal.get("target", 0)
                        elif goal.get("id") == "target_interview_rate":
                            goal["actual"] = member_applications["interviewRate"]
                            goal["completed"] = member_applications["interviewRate"] >= goal.get("target", 0)
                                
                except Exception as e:
                    print(f"Error fetching jobs for member {member_uuid}: {e}")
                    import traceback
                    traceback.print_exc()
            
            member_completed = len([g for g in member_goals if g.get("completed")])
            member_total = len(member_goals)
            member_pct = int((member_completed / member_total * 100) if member_total > 0 else 0)


            member_progress.append({
                "uuid": member_uuid,
                "name": member.get("name"),
                "role": member.get("role"),
                "progress": member_pct,
                "completedGoals": member_completed,
                "totalGoals": member_total,
                "applications": member_applications,
                "engagement": member.get("kpis", {}).get("engagement", 0),
                "pendingGoals": member_total - member_completed,
                "goals": member_goals
            })
        
        # Calculate team-wide metrics
        total_goals = sum(m["totalGoals"] for m in member_progress)
        completed_goals = sum(m["completedGoals"] for m in member_progress)
        
        # Sum total applications from member data
        total_applications = sum(m["applications"]["total"] for m in member_progress)
        
        overall_progress = int((completed_goals / total_goals * 100) if total_goals > 0 else 0)
        
        
        return {
            "overallProgress": overall_progress,
            "totalGoals": total_goals,
            "completedGoals": completed_goals,
            "totalApplications": total_applications,
            "memberProgress": member_progress
        }

    
    # ============ REPORTS ============
    
    def _parse_job_date(self, date_value):
        """Helper to parse date_created field consistently"""
        if not date_value:
            return None
        
        if isinstance(date_value, datetime):
            # Already datetime, just remove timezone
            if date_value.tzinfo:
                return date_value.replace(tzinfo=None)
            return date_value
        
        if isinstance(date_value, str):
            try:
                # Remove timezone offset
                clean_date = date_value.replace('+00:00', '').replace('Z', '')
                
                # Try parsing with milliseconds first
                for fmt in [
                    '%Y-%m-%dT%H:%M:%S.%f',
                    '%Y-%m-%dT%H:%M:%S',
                ]:
                    try:
                        return datetime.strptime(clean_date, fmt)
                    except:
                        continue
                
                # Last resort
                return datetime.fromisoformat(clean_date)
            except:
                return None
        
        return None

    async def get_team_reports(self, team_id: ObjectId, jobs_dao=None) -> Dict:
        """Generate comprehensive team performance reports with dynamic engagement calculation"""
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return {}
        
        members = team.get("members", [])
        # Only include active candidates in reports
        active_members = [m for m in members if m.get("status") == "active" and m.get("role") == "candidate"]
        
        if not active_members:
            return {
                "overallProgress": 0,
                "totalGoalsCompleted": 0,
                "totalApplicationsSent": 0,
                "averageEngagement": 0,
                "memberBreakdown": {"total": 0, "byRole": {"candidate": 0}},
                "engagementByRole": {},
                "applicationStatusBreakdown": [],
                "engagementDistribution": [],
                "topPerformers": [],
                "needsAttention": []
            }
        
        # Fetch job applications for all members
        total_applications = 0
        member_stats = []
        application_statuses = {"applied": 0, "screening": 0, "interview": 0, "offer": 0}
        engagement_scores = []
        
        # Track goals across all members
        all_member_goals = []
        
        for member in active_members:
            member_uuid = member.get("uuid")
            member_name = member.get("name")
            
            print(f"\n Processing member: {member_name} (UUID: {member_uuid})")
            
            # Extract goals from goals_config
            member_goals = []
            goals_data = member.get("goals", [])
            goals_config = next((g for g in goals_data if g.get("id") == "goals_config"), None)
            
            if goals_config:
                data = goals_config.get("data", {})
                
                if data.get("weeklyApplications"):
                    member_goals.append({
                        "id": "weekly_applications",
                        "title": "Weekly Applications",
                        "target": data.get("weeklyApplications"),
                        "completed": False,
                        "actual": 0
                    })
                if data.get("monthlyApplications"):
                    member_goals.append({
                        "id": "monthly_applications",
                        "title": "Monthly Applications",
                        "target": data.get("monthlyApplications"),
                        "completed": False,
                        "actual": 0
                    })
                if data.get("monthlyInterviews"):
                    member_goals.append({
                        "id": "monthly_interviews",
                        "title": "Monthly Interviews",
                        "target": data.get("monthlyInterviews"),
                        "completed": False,
                        "actual": 0
                    })
                if data.get("targetResponseRate"):
                    member_goals.append({
                        "id": "target_response_rate",
                        "title": "Target Response Rate",
                        "target": data.get("targetResponseRate"),
                        "completed": False,
                        "actual": 0
                    })
                if data.get("targetInterviewRate"):
                    member_goals.append({
                        "id": "target_interview_rate",
                        "title": "Target Interview Rate",
                        "target": data.get("targetInterviewRate"),
                        "completed": False,
                        "actual": 0
                    })
            
            
            # Fetch jobs and calculate metrics
            member_applications = {
                "total": 0,
                "response": 0,
                "interview": 0,
                "success": 0,
                "responseRate": 0,
                "interviewRate": 0,
                "successRate": 0
            }
            
            applications_this_week = 0
            applications_this_month = 0
            interviews_this_month = 0
            
            if jobs_dao and member_uuid:
                try:
                    from datetime import timedelta
                    
                    user_jobs = await jobs_dao.get_all_jobs(member_uuid)
                    member_applications["total"] = len(user_jobs)
                    
                    
                    # Calculate time windows
                    now = datetime.utcnow()
                    week_ago = now - timedelta(days=7)
                    month_ago = now - timedelta(days=30)
                    
                    for job in user_jobs:
                        status = job.get("status", "").lower()
                        created_at = self._parse_job_date(job.get("date_created"))
                        
                        # Count applications this week
                        if created_at and created_at > week_ago:
                            applications_this_week += 1
                        
                        # Count applications this month
                        if created_at and created_at > month_ago:
                            applications_this_month += 1
                        
                        # Count interviews this month
                        if status == "interview" and created_at and created_at > month_ago:
                            interviews_this_month += 1
                        
                        # Track application status breakdown
                        if status == "offer":
                            application_statuses["offer"] += 1
                            member_applications["success"] += 1
                            member_applications["interview"] += 1
                            member_applications["response"] += 1
                        elif status == "interview":
                            application_statuses["interview"] += 1
                            member_applications["interview"] += 1
                            member_applications["response"] += 1
                        elif status == "screening":
                            application_statuses["screening"] += 1
                            member_applications["response"] += 1
                        elif status in ["applied", ""]:
                            application_statuses["applied"] += 1
                            member_applications["response"] += 1
                    
                    # Calculate rates
                    if member_applications["total"] > 0:
                        member_applications["responseRate"] = int((member_applications["response"] / member_applications["total"]) * 100)
                        member_applications["interviewRate"] = int((member_applications["interview"] / member_applications["total"]) * 100)
                        member_applications["successRate"] = int((member_applications["success"] / member_applications["total"]) * 100)
                    
    
                    # UPDATE ALL 5 GOALS based on actual metrics
                    for goal in member_goals:
                        if goal.get("id") == "weekly_applications":
                            goal["actual"] = applications_this_week
                            goal["completed"] = applications_this_week >= goal.get("target", 0)
                        elif goal.get("id") == "monthly_applications":
                            goal["actual"] = applications_this_month
                            goal["completed"] = applications_this_month >= goal.get("target", 0)
                        elif goal.get("id") == "monthly_interviews":
                            goal["actual"] = interviews_this_month
                            goal["completed"] = interviews_this_month >= goal.get("target", 0)
                        elif goal.get("id") == "target_response_rate":
                            goal["actual"] = member_applications["responseRate"]
                            goal["completed"] = member_applications["responseRate"] >= goal.get("target", 0)
                        elif goal.get("id") == "target_interview_rate":
                            goal["actual"] = member_applications["interviewRate"]
                            goal["completed"] = member_applications["interviewRate"] >= goal.get("target", 0)
                                
                except Exception as e:
                    print(f" Error fetching jobs for member {member_uuid}: {e}")
                    import traceback
                    traceback.print_exc()
            
            total_applications += member_applications["total"]
            
            # Count completed goals for this member
            member_completed = len([g for g in member_goals if g.get("completed")])
            member_total = len(member_goals)
            member_progress = int((member_completed / member_total * 100) if member_total > 0 else 0)
            
            # Calculate dynamic engagement based on performance metrics (50/30/20 split)
            engagement = await self.calculate_engagement_from_performance(
                team_id=team_id,
                member_uuid=member_uuid,
                completed_goals=member_completed,
                total_goals=member_total,
                applications_sent=member_applications["total"],
                target_applications=10,  # Default target
                logins_this_month=0  # Optional: could enhance later
            )
            
            engagement_scores.append(engagement)
            
            
            # Store goals for later
            all_member_goals.extend(member_goals)
            
            member_stats.append({
                "uuid": member_uuid,
                "name": member_name,
                "role": member.get("role"),
                "engagement": engagement,
                "progress": member_progress,
                "completedGoals": member_completed,
                "pendingGoals": member_total - member_completed,
                "applications": member_applications,
                "goals": member_goals
            })
        
        # Calculate average engagement
        avg_engagement = 0
        if engagement_scores:
            avg_engagement = int(sum(engagement_scores) / len(engagement_scores))
        
        # Calculate total and completed goals across ALL members
        total_goals = len(all_member_goals)
        completed_goals = len([g for g in all_member_goals if g.get("completed")])

        # Build engagement distribution for chart
        engagement_buckets = {"0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0}
        for member in member_stats:
            eng = member["engagement"]
            if eng <= 20:
                engagement_buckets["0-20%"] += 1
            elif eng <= 40:
                engagement_buckets["20-40%"] += 1
            elif eng <= 60:
                engagement_buckets["40-60%"] += 1
            elif eng <= 80:
                engagement_buckets["60-80%"] += 1
            else:
                engagement_buckets["80-100%"] += 1
        
        engagement_distribution = [
            {"range": k, "count": v} for k, v in engagement_buckets.items()
        ]
        
        # Application status breakdown for pie chart
        application_status_breakdown = [
            {"name": "Applied", "value": application_statuses["applied"]},
            {"name": "Screening", "value": application_statuses["screening"]},
            {"name": "Interview", "value": application_statuses["interview"]},
            {"name": "Offer", "value": application_statuses["offer"]}
        ]
        
        # Sort for top performers and needs attention
        member_stats_sorted = sorted(member_stats, key=lambda x: x["engagement"], reverse=True)
        
        top_performers = member_stats_sorted[:5]
        needs_attention = sorted(member_stats, key=lambda x: x["engagement"])[:5]
        
        # Generate advanced insights
        top_performers_with_insights = [
            {
                **m,
                "insight": self._generate_performer_insight(m)
            }
            for m in top_performers
        ]
        
        needs_attention_with_insights = [
            {
                **m,
                "insight": self._generate_attention_insight(m)
            }
            for m in needs_attention
        ]
        
        return {
            "overallProgress": int((completed_goals / total_goals * 100) if total_goals > 0 else 0),
            "totalGoalsCompleted": completed_goals,
            "totalApplicationsSent": total_applications,
            "averageEngagement": avg_engagement,
            "memberBreakdown": {
                "total": len(active_members),
                "byRole": {
                    "candidate": len(active_members)
                }
            },
            "applicationStatusBreakdown": application_status_breakdown,
            "engagementDistribution": engagement_distribution,
            "topPerformers": top_performers_with_insights,
            "needsAttention": needs_attention_with_insights,
            "applicationMetrics": {
                "totalSent": total_applications,
                "avgPerMember": int(total_applications / len(active_members)) if active_members else 0
            }
        }
    

    async def get_member_report(self, team_id: ObjectId, member_uuid: str, jobs_dao=None) -> Optional[Dict]:
        """Get comprehensive individual member report with all 5 goals and dynamic engagement"""
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return None
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return None
        
        
        # Extract goals from goals_config
        member_goals = []
        goals_data = member.get("goals", [])
        goals_config = next((g for g in goals_data if g.get("id") == "goals_config"), None)
        
        if goals_config:
            data = goals_config.get("data", {})
            print(f"Goals config data: {data}")
            
            if data.get("weeklyApplications"):
                member_goals.append({
                    "id": "weekly_applications",
                    "title": "Weekly Applications",
                    "target": data.get("weeklyApplications"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("monthlyApplications"):
                member_goals.append({
                    "id": "monthly_applications",
                    "title": "Monthly Applications",
                    "target": data.get("monthlyApplications"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("monthlyInterviews"):
                member_goals.append({
                    "id": "monthly_interviews",
                    "title": "Monthly Interviews",
                    "target": data.get("monthlyInterviews"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("targetResponseRate"):
                member_goals.append({
                    "id": "target_response_rate",
                    "title": "Target Response Rate",
                    "target": data.get("targetResponseRate"),
                    "completed": False,
                    "actual": 0
                })
            if data.get("targetInterviewRate"):
                member_goals.append({
                    "id": "target_interview_rate",
                    "title": "Target Interview Rate",
                    "target": data.get("targetInterviewRate"),
                    "completed": False,
                    "actual": 0
                })
        
        print(f"Total goals: {len(member_goals)}")
        
        # Fetch job applications
        job_metrics = {
            "total": 0,
            "response": 0,
            "interview": 0,
            "success": 0,
            "responseRate": 0,
            "interviewRate": 0,
            "successRate": 0
        }
        
        applications_this_week = 0
        applications_this_month = 0
        interviews_this_month = 0
        
        if jobs_dao and member_uuid:
            try:
                from datetime import timedelta
                
                user_jobs = await jobs_dao.get_all_jobs(member_uuid)
                job_metrics["total"] = len(user_jobs)
                
                print(f"Total jobs found: {len(user_jobs)}")
                
                # Calculate time windows
                now = datetime.utcnow()
                week_ago = now - timedelta(days=7)
                month_ago = now - timedelta(days=30)
                
                for job in user_jobs:
                    status = job.get("status", "").lower()
                    created_at = self._parse_job_date(job.get("date_created"))
                    
                    # Count applications this week
                    if created_at and created_at > week_ago:
                        applications_this_week += 1
                    
                    # Count applications this month
                    if created_at and created_at > month_ago:
                        applications_this_month += 1
                    
                    # Count interviews this month
                    if status == "interview" and created_at and created_at > month_ago:
                        interviews_this_month += 1
                    
                    # Track application status breakdown
                    if status == "offer":
                        job_metrics["success"] += 1
                        job_metrics["interview"] += 1
                        job_metrics["response"] += 1
                    elif status == "interview":
                        job_metrics["interview"] += 1
                        job_metrics["response"] += 1
                    elif status in ["screening", "applied"]:
                        job_metrics["response"] += 1
                
                # Calculate rates
                if job_metrics["total"] > 0:
                    job_metrics["responseRate"] = int((job_metrics["response"] / job_metrics["total"]) * 100)
                    job_metrics["interviewRate"] = int((job_metrics["interview"] / job_metrics["total"]) * 100)
                    job_metrics["successRate"] = int((job_metrics["success"] / job_metrics["total"]) * 100)
                
                       
                # UPDATE ALL 5 GOALS based on actual metrics
                for goal in member_goals:
                    if goal.get("id") == "weekly_applications":
                        goal["actual"] = applications_this_week
                        goal["completed"] = applications_this_week >= goal.get("target", 0)
                    elif goal.get("id") == "monthly_applications":
                        goal["actual"] = applications_this_month
                        goal["completed"] = applications_this_month >= goal.get("target", 0)
                    elif goal.get("id") == "monthly_interviews":
                        goal["actual"] = interviews_this_month
                        goal["completed"] = interviews_this_month >= goal.get("target", 0)
                    elif goal.get("id") == "target_response_rate":
                        goal["actual"] = job_metrics["responseRate"]
                        goal["completed"] = job_metrics["responseRate"] >= goal.get("target", 0)
                    elif goal.get("id") == "target_interview_rate":
                        goal["actual"] = job_metrics["interviewRate"]
                        goal["completed"] = job_metrics["interviewRate"] >= goal.get("target", 0)
                            
            except Exception as e:
                print(f" Error fetching jobs for member {member_uuid}: {e}")
                import traceback
                traceback.print_exc()
        
        # Calculate completed and pending goals
        completed_goals = len([g for g in member_goals if g.get("completed")])
        pending_goals = len([g for g in member_goals if not g.get("completed")])
        total_goals = completed_goals + pending_goals
        
        progress_score = int((completed_goals / total_goals * 100) if total_goals > 0 else 0)
        
        # Calculate dynamic engagement based on performance metrics (50/30/20 split)
        engagement = await self.calculate_engagement_from_performance(
            team_id=team_id,
            member_uuid=member_uuid,
            completed_goals=completed_goals,
            total_goals=total_goals,
            applications_sent=job_metrics["total"],
            target_applications=10,  # Default target
            logins_this_month=0  # Optional: could enhance later
        )
        
        
        # Generate intelligent insights based on data
        insights = self._generate_member_insights(
            engagement=engagement,
            completed_goals=completed_goals,
            pending_goals=pending_goals,
            job_metrics=job_metrics,
            progress_score=progress_score
        )
        
        recommendations = self._generate_member_recommendations(
            engagement=engagement,
            completed_goals=completed_goals,
            pending_goals=pending_goals,
            job_metrics=job_metrics
        )
        
        return {
            "memberId": member_uuid,
            "memberName": member.get("name"),
            "role": member.get("role"),
            "progressScore": progress_score,
            "completedGoals": completed_goals,
            "pendingGoals": pending_goals,
            "totalGoals": total_goals,
            "engagement": engagement,
            "applications": job_metrics["total"],
            "applicationMetrics": job_metrics,
            "lastActive": member.get("kpis", {}).get("lastLogin"),
            "coachingInsights": insights,
            "recommendations": recommendations,
            "goalDetails": member_goals
        }


    def _generate_member_insights(self,engagement: int, completed_goals: int, pending_goals: int, 
                                job_metrics: Dict, progress_score: int) -> List[str]:
        """Generate contextual coaching insights for a member"""
        insights = []
        
        # Engagement insights
        if engagement >= 90:
            insights.append("🌟 Excellent engagement - member is highly motivated and active")
        elif engagement >= 70:
            insights.append("✅ Good engagement - member is progressing well")
        elif engagement >= 50:
            insights.append("⚠️ Moderate engagement - consider scheduling check-in")
        elif engagement >= 30:
            insights.append("❌ Low engagement - outreach recommended for support")
        else:
            insights.append("🚨 Very low engagement - immediate action needed")
        
        # Goal progress insights
        if completed_goals > pending_goals and pending_goals > 0:
            insights.append(f"✅ Strong progress on goals ({completed_goals} completed)")
        elif pending_goals > completed_goals * 2:
            insights.append(f"⏳ Multiple pending goals ({pending_goals}) - help prioritize")
        elif pending_goals == 0 and completed_goals > 0:
            insights.append("🎉 All goals completed - celebrate this achievement!")
        
        # Job application insights
        if job_metrics["total"] == 0:
            insights.append("📝 No applications yet - encourage job search activities")
        elif job_metrics["total"] > 10:
            insights.append(f"💪 Strong effort with {job_metrics['total']} applications")
        
        if job_metrics["total"] > 0:
            if job_metrics["successRate"] >= 20:
                insights.append(f"🎯 Impressive {job_metrics['successRate']}% offer rate")
            elif job_metrics["interviewRate"] >= 20:
                insights.append(f"📞 Good interview conversion ({job_metrics['interviewRate']}%)")
            elif job_metrics["responseRate"] < 10:
                insights.append("💬 Low response rate - review application materials")
        
        # Overall progress insights
        if progress_score == 100 and job_metrics["total"] > 0:
            insights.append("⭐ On track for success with complete goals and active applications")
        elif progress_score < 30 and engagement < 50:
            insights.append("🛑 Consider additional support or mentorship")
        
        return insights


    def _generate_member_recommendations(self,engagement: int, completed_goals: int, 
                                        pending_goals: int, job_metrics: Dict) -> List[str]:
        """Generate actionable recommendations for member development"""
        recommendations = []
        
        if engagement < 50:
            recommendations.append("Schedule a 1-on-1 check-in this week to understand blockers")
        
        if pending_goals > 3:
            recommendations.append("Help member prioritize pending goals into weekly milestones")
        
        if job_metrics["total"] < 5:
            recommendations.append("Set target of 5+ applications per week")
        
        if job_metrics["total"] > 0 and job_metrics["responseRate"] < 15:
            recommendations.append("Review resume/cover letter - consider applying to more positions")
        
        if job_metrics["interviewRate"] > 0 and job_metrics["successRate"] == 0:
            recommendations.append("Conduct mock interviews to improve offer conversion")
        
        if completed_goals > 0 and job_metrics["total"] > 5:
            recommendations.append("Consider peer mentoring role to help other candidates")
        
        if engagement >= 80 and job_metrics["successRate"] < 10:
            recommendations.append("Great engagement - focus remaining effort on high-value opportunities")
        
        if not recommendations:
            recommendations.append("Member is progressing well - maintain current trajectory")
            recommendations.append("Schedule monthly progress review to track long-term goals")
        
        return recommendations


    def _generate_performer_insight(self,member_stats: Dict) -> str:
        """Generate brief insight for top performers"""
        engagement = member_stats["engagement"]
        apps = member_stats["applications"]["total"]
        success = member_stats["applications"]["success"]
        
        if success > 0:
            return f"🏆 {member_stats['applications']['successRate']}% offer rate on {apps} applications"
        elif apps > 10:
            return f"💼 Actively applying - {apps} applications sent"
        else:
            return f"⭐ {engagement}% engagement, great momentum"


    def _generate_attention_insight(self,member_stats: Dict) -> str:
        """Generate brief insight for members needing attention"""
        engagement = member_stats["engagement"]
        pending = member_stats["pendingGoals"]
        apps = member_stats["applications"]["total"]
        
        if engagement < 20:
            return "Low engagement - requires immediate outreach"
        elif pending > 5:
            return f"{pending} pending goals - help with prioritization"
        elif apps == 0:
            return "No applications yet - encourage job search"
        else:
            return f"Low engagement ({engagement}%) - schedule check-in"

    async def calculate_engagement_from_performance(self, team_id: ObjectId, member_uuid: str,completed_goals: int,total_goals: int,applications_sent: int,target_applications: int = 10,logins_this_month: int = 0) -> int:
        """
        Calculate engagement score (0-100) based on actual performance metrics.
        
        Formula (50/30/20 split):
        - 50% from goal completion rate
        - 30% from applications sent (vs target)
        - 20% from login frequency
        
        Returns:
            Engagement score 0-100
        """
        
        # Calculate individual components (each 0-100)
        
        # 1. Goal completion rate (50% weight)
        if total_goals > 0:
            goal_score = (completed_goals / total_goals) * 100
        else:
            goal_score = 0
        
        # 2. Applications sent vs target (30% weight)
        # Normalize to 100 when target is met or exceeded
        if target_applications > 0:
            app_score = min((applications_sent / target_applications) * 100, 100)
        else:
            app_score = 100 if applications_sent > 0 else 0
        
        # 3. Login frequency (20% weight)
        # Target: 8 logins per month (2x per week)
        target_logins = 8
        login_score = min((logins_this_month / target_logins) * 100, 100)
        
        # Calculate weighted engagement
        engagement_score = int(
            (goal_score * 0.50) +
            (app_score * 0.30) +
            (login_score * 0.20)
        )
        
        # Update in database
        try:
            result = await self.collection.update_one(
                {"_id": team_id, "members.uuid": member_uuid},
                {"$set": {
                    "members.$.kpis.engagement": engagement_score,
                    "members.$.last_engagement_update": datetime.utcnow()
                }}
            )
            if result.modified_count > 0:
                print(f"Engagement saved to database: {engagement_score}%")
            else:
                print(f"WARNING: Failed to update engagement in database!")
        except Exception as e:
            print(f"Error updating engagement in database: {e}")
        
        return engagement_score    



teams_dao = TeamsDAO()