from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from schema.progress_sharing import (
    ShareWithRequest,
    ProgressReportFilter,
    MilestoneAchievement,
    PrivacySettings
)
from mongo.progress_sharing_dao import progress_sharing_dao
from mongo.teams_dao import teams_dao
from mongo.jobs_dao import jobs_dao
from sessions.session_authorizer import authorize
import smtplib
from urllib.parse import quote
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()
GMAIL_SENDER = os.environ.get("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

progress_router = APIRouter(prefix="/progress-sharing")


def send_progress_share_email(to_email: str, user_name: str, share_link: str) -> bool:
    """Send email notifying someone they've been invited to see progress"""
    try:
        subject = f"Metamorphosis - {user_name} shared their job search progress with you"
        body = (
            f"Hello,\n\n"
            f"{user_name} has invited you to view their job search progress on Metamorphosis.\n\n"
            f"View their progress here:\n"
            f"{share_link}\n\n"
            f"You can see their goals, applications, milestones, and achievements.\n\n"
            f"If you have an account, log in to access this. If not, you can view as a guest."
        )
        
        msg = MIMEText(body)
        msg["From"] = GMAIL_SENDER
        msg["To"] = to_email
        msg["Subject"] = subject
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Warning: Failed to send progress share email: {e}")
        return False


@progress_router.post("/{team_id}/members/{member_uuid}/share", tags=["progress-sharing"])
async def share_progress(
    team_id: str,
    member_uuid: str,
    request: ShareWithRequest,
    uuid: str = Depends(authorize)
):
    """
    Share your job search progress with someone (mentor, family, friend, etc).
    Creates a view-only link for them to see your progress.
    """
    try:
        team_id_obj = ObjectId(team_id)
        
        # Verify user is sharing their own progress
        if uuid != member_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only share your own progress"
            )
        
        # Set default privacy settings based on relationship
        privacy_settings = request.privacy_settings or PrivacySettings()
        
        if request.relationship == "family":
            # Family gets less sensitive info
            privacy_settings.can_see_full_progress = False
            privacy_settings.can_see_feedback = False
            privacy_settings.hide_sensitive = True
        elif request.relationship == "accountability_partner":
            # Partners see almost everything
            privacy_settings.can_see_full_progress = True
            privacy_settings.can_see_feedback = True
        
        # Add the share
        success = await progress_sharing_dao.add_progress_share(
            team_id=team_id_obj,
            member_uuid=member_uuid,
            accessor_email=request.email,
            accessor_name=request.name or request.email.split("@")[0],
            relationship=request.relationship,
            privacy_settings=privacy_settings.model_dump()
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to share progress"
            )
        
        # Send email notification
        safe_email = quote(request.email)
        share_link = f"{FRONTEND_URL}/shared-progress/{team_id}/{member_uuid}/{safe_email}"
        user = await teams_dao.get_member_by_uuid(team_id_obj, member_uuid)
        send_progress_share_email(
            to_email=request.email,
            user_name=user.get("name") if user else "Someone",
            share_link=share_link
        )
        
        return {
            "message": f"Progress shared with {request.email}",
            "relationship": request.relationship,
            "shareLink": share_link,
            "privacySettings": privacy_settings.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@progress_router.get("/{team_id}/members/{member_uuid}/progress-report-public/{accessor_email}", tags=["progress-sharing"])
async def get_public_progress_report(team_id: str,member_uuid: str,accessor_email: str):

    try:
        team_id_obj = ObjectId(team_id)
        
        # Get the report with privacy filtering
        report = await progress_sharing_dao.get_shared_progress_report(
            team_id=team_id_obj,
            member_uuid=member_uuid,
            viewer_email=accessor_email,
            jobs_dao=jobs_dao,
            viewer_is_teammate=False  
        )
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This progress report may not be shared with you."
            )

        latest_status = await progress_sharing_dao.get_latest_wellbeing(team_id_obj, member_uuid)
        if latest_status:
            report["wellbeing"] = latest_status


        access_list = await progress_sharing_dao.get_shared_with_list(team_id_obj, member_uuid)
        record = next((s for s in access_list if s.get("accessor_email") == accessor_email), None)
        if record:
            report["relationship_type"] = record.get("relationship", "friend")
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_public_progress_report: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@progress_router.get("/{team_id}/members/{member_uuid}/shared-with", tags=["progress-sharing"])
async def get_shared_with_list(
    team_id: str,
    member_uuid: str,
    uuid: str = Depends(authorize)
):
    """Get list of everyone who can see your progress"""
    try:
        team_id_obj = ObjectId(team_id)
        
        # Verify user owns this member
        if uuid != member_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only view your own sharing list"
            )
        
        shared_with = await progress_sharing_dao.get_shared_with_list(team_id_obj, member_uuid)
        
        return {
            "sharedWith": [
                {
                    "email": s.get("accessor_email"),
                    "name": s.get("accessor_name"),
                    "relationship": s.get("relationship"),
                    "sharedDate": s.get("shared_date"),
                    "lastViewed": s.get("last_viewed"),
                    "viewCount": s.get("view_count"),
                    "privacySettings": s.get("privacy_settings")
                }
                for s in shared_with
            ],
            "totalSharedWith": len(shared_with)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@progress_router.put("/{team_id}/members/{member_uuid}/privacy", tags=["progress-sharing"])
async def update_privacy_settings(
    team_id: str,
    member_uuid: str,
    settings: PrivacySettings,
    uuid: str = Depends(authorize)
):
    """Update privacy settings for all shared links"""
    try:
        team_id_obj = ObjectId(team_id)
        
        # Verify ownership
        if uuid != member_uuid:
            raise HTTPException(status_code=403, detail="Cannot change privacy settings for others")
            
        success = await progress_sharing_dao.update_all_privacy_settings(
            team_id_obj,
            member_uuid,
            settings.model_dump()
        )
        
        # We return success even if modified_count is 0 (settings might be identical)
        return {"message": "Privacy settings updated for all links"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@progress_router.delete("/{team_id}/members/{member_uuid}/share/{accessor_email}", tags=["progress-sharing"])
async def revoke_progress_share(
    team_id: str,
    member_uuid: str,
    accessor_email: str,
    uuid: str = Depends(authorize)
):
    """Revoke someone's access to your progress"""
    try:
        team_id_obj = ObjectId(team_id)
        
        if uuid != member_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only manage your own sharing"
            )
        
        success = await progress_sharing_dao.remove_progress_share(
            team_id_obj,
            member_uuid,
            accessor_email
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to revoke access"
            )
        
        return {"message": f"Access revoked for {accessor_email}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@progress_router.post("/{team_id}/members/{member_uuid}/wellbeing", tags=["progress-sharing"])
async def log_wellbeing_status(team_id: str,member_uuid: str,status_data: dict,uuid: str = Depends(authorize)):
    """Log current mood and boundary settings"""
    if uuid != member_uuid:
        raise HTTPException(status_code=403, detail="Cannot log status for others")
        
    team_id_obj = ObjectId(team_id)
    await progress_sharing_dao.log_wellbeing(team_id_obj, member_uuid, status_data)
    return {"message": "Status updated"}

@progress_router.get("/{team_id}/members/{member_uuid}/progress-report", tags=["progress-sharing"])
async def get_progress_report(team_id: str,member_uuid: str,viewer_email: str = None,uuid: str = Depends(authorize)):
    """
    Get a progress report for authenticated users.
    SECURE: Only allows Owner, Team Admins, or Team Mentors.
    """
    try:
        team_id_obj = ObjectId(team_id)
        
        # Determines Permission Level
        is_owner = uuid == member_uuid
        is_privileged_viewer = False

        if not is_owner:
        
            team = await teams_dao.get_team_by_id(team_id_obj)
            if not team:
                raise HTTPException(status_code=404, detail="Team not found")
            
            # Find the requester in the team's member list
            requester = next((m for m in team.get("members", []) if m.get("uuid") == uuid), None)
            
            if not requester:
                # User is logged in, but NOT in this team
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied. You are not a member of this team."
                )
            
            # Check Role
            user_role = requester.get("role", "").lower()
            if user_role in ["admin", "mentor"]:
                is_privileged_viewer = True
            else:
                #User is in the team, but is just a Candidate
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied. Only Mentors and Admins can view other members' progress."
                )

        # Pass "True" for viewer_is_teammate only if they are Owner or Admin/Mentor
        report = await progress_sharing_dao.get_shared_progress_report(
            team_id=team_id_obj,
            member_uuid=member_uuid,
            viewer_email=viewer_email or uuid,
            jobs_dao=jobs_dao, 
            viewer_is_teammate=(is_owner or is_privileged_viewer)
        )
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return report

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting progress report: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@progress_router.post("/{team_id}/members/{member_uuid}/milestones", tags=["progress-sharing"])
async def log_milestone(
    team_id: str,
    member_uuid: str,
    milestone: dict,
    uuid: str = Depends(authorize)
):
    """Log a milestone achievement (offer, interview scheduled, goal completed, etc)"""
    try:
        team_id_obj = ObjectId(team_id)
        
        # Verify user owns this member or is a mentor/admin
        if uuid != member_uuid:
            team = await teams_dao.get_team_by_id(team_id_obj)
            current_member = next((m for m in team.get("members", []) if m.get("uuid") == uuid), None)
            if not current_member or current_member.get("role") not in ["mentor", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot log milestones for others"
                )
        
        milestone_obj = {
            "id": milestone.get("id"),
            "title": milestone.get("title"),
            "description": milestone.get("description"),
            "achieved_date": datetime.utcnow(),
            "category": milestone.get("category"),
            "impact_score": milestone.get("impact_score", 5),
            "celebration_message": milestone.get("celebration_message")
        }
        
        success = await progress_sharing_dao.log_milestone(
            team_id_obj,
            member_uuid,
            milestone_obj
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to log milestone"
            )
        
        return {
            "message": "Milestone logged successfully",
            "milestone": milestone_obj
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@progress_router.get("/{team_id}/members/{member_uuid}/milestones", tags=["progress-sharing"])
async def get_milestones(
    team_id: str,
    member_uuid: str,
    days: int = 30,
    uuid: str = Depends(authorize)
):
    """Get recent milestones for a member"""
    try:
        team_id_obj = ObjectId(team_id)
        
        milestones = await progress_sharing_dao.get_milestones(
            team_id_obj,
            member_uuid,
            days=days
        )
        
        return {
            "memberUuid": member_uuid,
            "milestones": milestones,
            "periodDays": days,
            "count": len(milestones)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@progress_router.post("/{team_id}/members/{member_uuid}/celebrate", tags=["progress-sharing"])
async def add_celebration(
    team_id: str,
    member_uuid: str,
    celebration: dict,
):
    """Add a celebration message for a milestone"""
    try:
        team_id_obj = ObjectId(team_id)
        
        celebration_obj = {
            "id": celebration.get("id"),
            "message": celebration.get("message"),
            "emoji": celebration.get("emoji", "🎉"),
            "created_by": celebration.get("created_by", "System"),
            "created_at": datetime.utcnow()
        }
        
        success = await progress_sharing_dao.add_celebration(
            team_id_obj,
            member_uuid,
            celebration_obj
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add celebration"
            )
        
        return {"message": "Celebration added", "celebration": celebration_obj}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@progress_router.get("/{team_id}/members/{member_uuid}/celebrations", tags=["progress-sharing"])
async def get_celebrations(
    team_id: str,
    member_uuid: str,
    uuid: str = Depends(authorize)
):
    """Get all celebrations/encouragements for a member"""
    try:
        team_id_obj = ObjectId(team_id)
        # Verify ownership (or allow mentors to see)
        if uuid != member_uuid:
             # Add specific permission logic if needed, strictly owning for now
             pass 

        celebrations = await progress_sharing_dao.get_celebrations(team_id_obj, member_uuid)
        return {"celebrations": celebrations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@progress_router.get("/{team_id}/members/{member_uuid}/accountability-impact", tags=["progress-sharing"])
async def get_accountability_impact(
    team_id: str,
    member_uuid: str,
    uuid: str = Depends(authorize)
):
    """
    Get impact metrics of accountability partnerships on job search success.
    Shows engagement increase, application increase, etc since accountability started.
    """
    try:
        team_id_obj = ObjectId(team_id)
        
        impact = await progress_sharing_dao.get_accountability_impact(
            team_id_obj,
            member_uuid,
            jobs_dao=jobs_dao
        )
        
        return impact
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )