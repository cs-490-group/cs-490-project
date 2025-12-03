from mongo.dao_setup import db_client, TEAMS
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any


class ProgressSharingDAO:
    """Data Access Object for progress sharing and accountability features"""
    
    def __init__(self):
        self.collection = db_client.get_collection(TEAMS)
    
    # ============ SHARING SETUP ============

    async def get_shared_with_list(self, team_id: ObjectId, member_uuid: str) -> List[Dict]:
        """Get list of all people who can see this member's progress"""
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return []
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return []
        
        return member.get("progress_sharing", {}).get("shared_with", [])
    
    async def add_progress_share(
        self,
        team_id: ObjectId,
        member_uuid: str,
        accessor_email: str,
        accessor_name: str,
        relationship: str,
        privacy_settings: dict
    ) -> bool:
        """Grant someone access to view a member's progress"""
        shared_access = {
            "accessor_uuid": None,  # Will be filled if they join
            "accessor_email": accessor_email,
            "accessor_name": accessor_name,
            "relationship": relationship,
            "privacy_settings": privacy_settings,
            "shared_date": datetime.utcnow(),
            "last_viewed": None,
            "view_count": 0
        }
        
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$push": {"members.$.progress_sharing.shared_with": shared_access}}
        )
        return result.modified_count > 0
    
    async def remove_progress_share(
        self,
        team_id: ObjectId,
        member_uuid: str,
        accessor_email: str
    ) -> bool:
        """Revoke access for someone to view progress"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$pull": {"members.$.progress_sharing.shared_with": {"accessor_email": accessor_email}}}
        )
        return result.modified_count > 0
    
    async def update_privacy_settings(
        self,
        team_id: ObjectId,
        member_uuid: str,
        accessor_email: str,
        privacy_settings: dict
    ) -> bool:
        """Update privacy settings for a specific share"""
        result = await self.collection.update_one(
            {
                "_id": team_id,
                "members.uuid": member_uuid,
                "members.progress_sharing.shared_with.accessor_email": accessor_email
            },
            {"$set": {"members.$.progress_sharing.shared_with.$[elem].privacy_settings": privacy_settings}},
            array_filters=[{"elem.accessor_email": accessor_email}]
        )
        return result.modified_count > 0
    
    # ============ PROGRESS REPORTS ============
    
    async def get_shared_progress_report(
        self,
        team_id: ObjectId,
        member_uuid: str,
        viewer_email: str,
        jobs_dao = None,
        viewer_is_teammate: bool = False
    ) -> Optional[Dict]:
        """
        Generate a privacy-filtered progress report.
        """
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return None
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return None
        
        # Check permissions...
        if not viewer_is_teammate:
            shared_access = member.get("progress_sharing", {}).get("shared_with", [])
            access = next((s for s in shared_access if s.get("accessor_email") == viewer_email), None)
            if not access: return None
            privacy = access.get("privacy_settings", {})
            
            # Log view
            await self.collection.update_one(
                {"_id": team_id, "members.uuid": member_uuid, "members.progress_sharing.shared_with.accessor_email": viewer_email},
                {"$set": {"members.$.progress_sharing.shared_with.$[elem].last_viewed": datetime.utcnow()}, "$inc": {"members.$.progress_sharing.shared_with.$[elem].view_count": 1}},
                array_filters=[{"elem.accessor_email": viewer_email}]
            )
        else:
            # Teammates see everything
            privacy = {
                "can_see_goals": True, "can_see_applications": True, "can_see_engagement": True,
                "can_see_full_progress": True, "can_see_milestones": True, "can_see_feedback": True
            }
        
        report = {
            "memberName": member.get("name"),
            "memberRole": member.get("role"),
            "reportDate": datetime.utcnow().isoformat()
        }
        
        # Fetch Real Job Data
        real_jobs = []
        if jobs_dao:
            # Fetch live jobs from the Jobs collection
            real_jobs = await jobs_dao.get_all_jobs(member_uuid)
        
        # Applications section
        if privacy.get("can_see_applications"):
            # Calculate stats from real_jobs
            applied_count = 0
            interview_count = 0
            offer_count = 0
            
            for job in real_jobs:
                status = job.get("status", "").lower()
                if status == "offer":
                    offer_count += 1
                elif status == "interview":
                    interview_count += 1
                # Count everything else as applied/active
                elif status in ["applied", "screening", "interested"]:
                    applied_count += 1
            
            # If total is 0, we might want to check the member object as a fallback, 
            # but usually jobs_dao is the source of truth.
            total_active = len(real_jobs)

            report["applicationStats"] = {
                "total": total_active,
                "statusBreakdown": {
                    "applied": applied_count,
                    "interview": interview_count,
                    "offer": offer_count,
                    # We can group 'screening' into applied or separate it
                    "screening": len([j for j in real_jobs if j.get("status", "").lower() == "screening"]) 
                }
            }
        
        # Goals section
        if privacy.get("can_see_goals"):
            goals_config = next((g for g in member.get("goals", []) if g.get("id") == "goals_config"), None)
            if goals_config:
                report["goals"] = goals_config.get("data", {})
        
        # Engagement section
        if privacy.get("can_see_engagement"):
            kpis = member.get("kpis", {})
            report["engagement"] = kpis.get("engagement", 0)
        
        # Milestones section
        if privacy.get("can_see_milestones"):
            milestones = member.get("milestones", [])
            report["recentMilestones"] = sorted(
                milestones,
                key=lambda x: x.get("achieved_date", datetime.min),
                reverse=True
            )[:5]

        # Hide sensitive info
        if privacy.get("hide_sensitive"):
            report.pop("memberName", None)
            report.pop("email", None)
        
        return report
    
    # ============ MILESTONES ============
    
    async def log_milestone(
        self,
        team_id: ObjectId,
        member_uuid: str,
        milestone: dict
    ) -> bool:
        """Log a milestone achievement (offer, interview, goal completed, etc)"""
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$push": {"members.$.milestones": milestone}}
        )
        return result.modified_count > 0
    
    async def get_milestones(
        self,
        team_id: ObjectId,
        member_uuid: str,
        days: int = 30
    ) -> List[Dict]:
        """Get recent milestones for a member"""
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return []
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return []
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        milestones = member.get("milestones", [])
        
        return sorted(
            [m for m in milestones if m.get("achieved_date", datetime.min) > cutoff_date],
            key=lambda x: x.get("achieved_date"),
            reverse=True
        )
    
    # ============ CELEBRATIONS ============
    
    async def add_celebration(
        self,
        team_id: ObjectId,
        member_uuid: str,
        celebration: dict
    ) -> bool:
        """Add a celebration message for a milestone"""
        if not hasattr(self, '_celebrations_db'):
            pass
        
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$push": {"members.$.celebrations": celebration}}
        )
        return result.modified_count > 0
    
    async def get_celebrations(
        self,
        team_id: ObjectId,
        member_uuid: str
    ) -> List[Dict]:
        """Get all celebrations for a member"""
        team = await self.collection.find_one({"_id": team_id})
        if not team:
            return []
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            return []
        
        return sorted(
            member.get("celebrations", []),
            key=lambda x: x.get("created_at", datetime.min),
            reverse=True
        )
    
    # ============ ACCOUNTABILITY TRACKING ============
    
    async def log_accountability_check_in(
        self,
        team_id: ObjectId,
        member_uuid: str,
        supporter_email: str,
        check_in: dict
    ) -> bool:
        """Log when an accountability partner checks in"""
        if not hasattr(self, '_accountability_db'):
            self._accountability_db = db_client.get_collection("accountability_checkins")
        
        check_in["team_id"] = team_id
        check_in["member_uuid"] = member_uuid
        check_in["supporter_email"] = supporter_email
        check_in["timestamp"] = datetime.utcnow()
        
        result = await self._accountability_db.insert_one(check_in)
        return result.inserted_id is not None
    
    async def get_accountability_impact(
        self,
        team_id: ObjectId,
        member_uuid: str,
        jobs_dao = None 
    ) -> Dict:
        """
        Calculate impact metrics using REAL job data.
        """
        team = await self.collection.find_one({"_id": team_id})
        if not team: return {}
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member: return {}
        
        shared_with = member.get("progress_sharing", {}).get("shared_with", [])
        
  
        member_email = member.get("email", "").lower()
        real_partners = [s for s in shared_with if s.get("accessor_email", "").lower() != member_email]
        
        if not real_partners:
            return {"accountabilityPartners": 0, "impactScore": 0, "activityIncreasePercent": 0}
        
        # Find when sharing started (first share date)
        first_share_date = min(s.get("shared_date", datetime.utcnow()) for s in real_partners)
        
        apps_before = 0
        apps_after = 0
        
        if jobs_dao:
            # Fetch real jobs
            real_jobs = await jobs_dao.get_all_jobs(member_uuid)
            for job in real_jobs:
                # Handle string or datetime objects for date_created
                created_at = job.get("date_created")
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    except:
                        continue # Skip if date can't be parsed
               
                if created_at:
                    # simple comparison assuming both are UTC or compatible
                    try:
                        if created_at.replace(tzinfo=None) < first_share_date.replace(tzinfo=None):
                            apps_before += 1
                        else:
                            apps_after += 1
                    except:
                        pass # Fallback if dates are messy

        # Calculate Engagement
        activity_log = member.get("activity_log", [])
        before_activities = len([a for a in activity_log if a.get("timestamp", datetime.utcnow()) < first_share_date])
        after_activities = len([a for a in activity_log if a.get("timestamp", datetime.utcnow()) >= first_share_date])
        
        increase_percent = 0
        if before_activities > 0:
            increase_percent = int(((after_activities - before_activities) / before_activities) * 100)
        elif after_activities > 0:
            increase_percent = 100 # 100% increase if starting from zero
        
        return {
            "accountabilityPartners": len(real_partners),
            "partnerRelationships": [s.get("relationship") for s in real_partners],
            "accountabilitySinceDays": (datetime.utcnow() - first_share_date).days,
            "activityIncreasePercent": increase_percent,
            "applicationsBeforeAccountability": apps_before,
            "applicationsAfterAccountability": apps_after,
            "impactScore": min(100, 30 + (increase_percent // 2) + (len(real_partners) * 10))
        }
    
    async def update_all_privacy_settings(
        self,
        team_id: ObjectId,
        member_uuid: str,
        privacy_settings: dict
    ) -> bool:
        """
        Updates the default privacy settings AND applies them to all existing shared links.
        """
        # Update the default settings for future shares and
        # Update the settings for ALL existing people in the shared_with array
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {
                "$set": {
                    "members.$.progress_sharing.default_privacy_settings": privacy_settings,
                    "members.$.progress_sharing.shared_with.$[].privacy_settings": privacy_settings
                }
            }
        )
        return result.modified_count > 0
    

    #Stuff for UC-113 (emotional well-being)
    async def log_wellbeing(self, team_id: ObjectId, member_uuid: str, data: dict) -> bool:
        """Log a mood/status update for family visibility"""
        entry = {
            "id": f"wb_{datetime.utcnow().timestamp()}",
            "mood_score": data.get("mood_score", 5), # 1-10
            "status_message": data.get("status_message", "Doing okay"),
            "boundary_level": data.get("boundary_level", "green"), 
            "needs": data.get("needs", []), 
            "created_at": datetime.utcnow()
        }
        
        result = await self.collection.update_one(
            {"_id": team_id, "members.uuid": member_uuid},
            {"$push": {"members.$.wellbeing_log": entry}}
        )
        return result.modified_count > 0

    async def get_latest_wellbeing(self, team_id: ObjectId, member_uuid: str) -> Optional[Dict]:
        """Get the user's current status for the dashboard"""
        team = await self.collection.find_one({"_id": team_id})
        if not team: return None
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member: return None
        
        logs = member.get("wellbeing_log", [])
        if not logs: return None
        
        # Return newest log
        return sorted(logs, key=lambda x: x.get("created_at"), reverse=True)[0]


progress_sharing_dao = ProgressSharingDAO()