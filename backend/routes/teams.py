from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from mongo.teams_dao import teams_dao
from mongo.jobs_dao import jobs_dao
from mongo.progress_sharing_dao import progress_sharing_dao
from schema.teams import (
    CreateTeamRequest, UpdateTeamRequest, InviteMemberRequest,
    UpdateMemberRequest, UpdateBillingRequest, SendFeedbackRequest,
    AcceptInvitationRequest,UpdateGoalsRequest
)

load_dotenv()
GMAIL_SENDER = os.environ.get("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

teams_router = APIRouter(prefix="/teams")

async def log_milestone_for_event(team_id: ObjectId, member_uuid: str, event_type: str, event_data: dict = None):
    """
    Automatically log milestones when significant events occur.
    Call this whenever a job status changes or goal is completed.
    """
    event_data = event_data or {}
    
    milestone_map = {
        "interview_scheduled": {
            "title": f"🎯 Interview Scheduled!",
            "description": f"Interview scheduled for {event_data.get('company', 'a company')}",
            "category": "interview_scheduled",
            "impact_score": 7
        },
        "offer_received": {
            "title": "🎉 Offer Received!",
            "description": f"Offer from {event_data.get('company', 'a company')}",
            "category": "offer_received",
            "impact_score": 10
        },
        "goal_completed": {
            "title": "✅ Goal Completed!",
            "description": event_data.get('goal_title', 'You completed a goal'),
            "category": "goal_completed",
            "impact_score": 5
        },
        "applications_milestone_10": {
            "title": "📧 10 Applications Sent!",
            "description": "You've sent 10 job applications",
            "category": "applications_milestone",
            "impact_score": 3
        },
        "applications_milestone_25": {
            "title": "📧 25 Applications Sent!",
            "description": "You've sent 25 job applications",
            "category": "applications_milestone",
            "impact_score": 4
        },
        "applications_milestone_50": {
            "title": "📧 50 Applications Sent!",
            "description": "You've sent 50 job applications",
            "category": "applications_milestone",
            "impact_score": 5
        },
    }
    
    if event_type not in milestone_map:
        return
    
    milestone_template = milestone_map[event_type]
    
    milestone = {
        "id": f"{event_type}_{datetime.utcnow().timestamp()}",
        "title": milestone_template["title"],
        "description": milestone_template["description"],
        "achieved_date": datetime.utcnow(),
        "category": milestone_template["category"],
        "impact_score": milestone_template["impact_score"],
        "celebration_message": None
    }
    
    try:
        await progress_sharing_dao.log_milestone(team_id, member_uuid, milestone)
        print(f"Milestone logged: {milestone['title']} for {member_uuid}")
    except Exception as e:
        print(f" Failed to log milestone: {e}")



def send_team_invite_email(to_email: str, team_name: str, team_id: str, inviter_name: str) -> bool:
    """Send team invitation email"""
    try:
        join_link = f"{FRONTEND_URL}/setup-team?inviteCode={team_id}"
        
        subject = f"Metamorphosis - You're invited to join {team_name}"
        body = (
            f"Hello,\n\n"
            f"{inviter_name} has invited you to join the team '{team_name}' on Metamorphosis.\n\n"
            f"Click the link below to join:\n"
            f"{join_link}\n\n"
            f"Or enter this invite code in the 'Join Existing Team' section:\n"
            f"{team_id}\n\n"
            f"If you don't have a Metamorphosis account, you'll be prompted to create one.\n\n"
            f"If you did not expect this invitation, you can ignore this email."
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
        print(f"Warning: Failed to send invitation email to {to_email}: {e}")
        return False


@teams_router.post("/create")
async def create_team(request: CreateTeamRequest):
    try:
        team_data = {
            "name": request.name,
            "description": request.description or "",
            "creator_id": request.uuid,
            "members": [
                {
                    "uuid": request.uuid,
                    "email": request.email or "",
                    "name": request.name.split()[0],
                    "role": "admin",
                    "joined_at": datetime.utcnow(),
                    "status": "active"
                }
            ],
            "billing": {
                "plan": "basic",
                "status": "active",
                "price": 99,
                "renewalDate": datetime.utcnow(),
                "cardBrand": None,
                "last4": None,
                "expMonth": None,
                "expYear": None,
                "invoices": []
            },
            "settings": {
                "maxMembers": 50,
                "visibility": "private",
                "allowInvites": True
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        team_id = await teams_dao.add_team(team_data)
        
        return {
            "id": str(team_id),
            "name": request.name,
            "message": "Team created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/{team_id}")
async def get_team(team_id: str):
    try:
        print(f"Route received team_id: {team_id}")
        try:
            team_id_obj = ObjectId(team_id)
        except Exception as e:
            print(f"Failed to convert ObjectId: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid team ID format: {e}")
        
        team = await teams_dao.get_team_by_id(team_id_obj)
        print(f"Query result: {team is not None}")
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

        
        members = team.get("members", [])
        member_count = len(members)
        admin_count = len([m for m in members if m.get("role") == "admin"])
        mentor_count = len([m for m in members if m.get("role") == "mentor"])
        candidate_count = len([m for m in members if m.get("role") == "candidate"])
        
        current_user_role = team.get("members", [{}])[0].get("role", "member")
        
        return {
            "id": str(team["_id"]),
            "name": team.get("name"),
            "description": team.get("description"),
            "memberCount": member_count,
            "admins": admin_count,
            "mentors": mentor_count,
            "candidates": candidate_count,
            "currentUserRole": current_user_role,
            "progress": team.get("progress", 0),
            "goalsCompleted": team.get("goalsCompleted", 0),
            "applicationsSent": team.get("applicationsSent", 0),
            "avgEngagement": team.get("avgEngagement", 0),
            "members": members,
            "billing": team.get("billing"),
            "settings": team.get("settings"),
            "createdAt": team.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/user/{uuid}")
async def get_user_team(uuid: str):
    try:
        team = await teams_dao.get_user_team(uuid)
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not in any team")
        
        member = next((m for m in team.get("members", []) if m["uuid"] == uuid), None)
        
        return {
            "id": str(team["_id"]),
            "name": team.get("name"),
            "description": team.get("description"),
            "memberCount": len(team.get("members", [])),
            "role": member.get("role") if member else "member"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.put("/{team_id}")
async def update_team_settings(team_id: str, request: UpdateTeamRequest):
    try:
        team_id = ObjectId(team_id)
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        if request.name:
            update_data["name"] = request.name
        if request.description is not None:
            update_data["description"] = request.description
        if request.billingPlan:
            update_data["billing.plan"] = request.billingPlan
        if request.maxMembers:
            update_data["settings.maxMembers"] = request.maxMembers
        
        result = await teams_dao.update_team(team_id, update_data)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        return {"message": "Team updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.delete("/{team_id}")
async def delete_team(team_id: str):
    try:
        team_id = ObjectId(team_id)
        result = await teams_dao.delete_team(team_id)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        return {"message": "Team deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.post("/{team_id}/accept-invite")
async def accept_invitation(team_id: str, request: AcceptInvitationRequest):
    try:
        team_id = ObjectId(team_id)
        team = await teams_dao.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        member_idx = next(
            (i for i, m in enumerate(team.get("members", [])) if m["email"] == request.email and m["status"] == "invited"),
            None
        )
        
        if member_idx is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
        
        result = await teams_dao.accept_member_invitation(team_id, request.email, request.uuid)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to accept invitation")
        
        return {"message": f"Successfully joined {team.get('name')}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@teams_router.post("/{team_id}/invite")
async def invite_member(team_id: str, request: InviteMemberRequest):
    try:
        team_id = ObjectId(team_id)
        team = await teams_dao.get_team_by_id(team_id)
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        if any(m["email"] == request.email for m in team.get("members", [])):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already a member")
        
        existing_team = await teams_dao.find_team_by_member_email(request.email)
        if existing_team:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already in another team")
        
        if len(team.get("members", [])) >= team.get("settings", {}).get("maxMembers", 50):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team is full")
        
        new_member = {
            "uuid": None,
            "email": request.email,
            "name": request.email.split("@")[0],
            "role": request.role,
            "status": "invited",
            "invited_at": datetime.utcnow()
        }
        
        result = await teams_dao.add_member_to_team(team_id, new_member)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to invite member")
        
        inviter_name = team.get("members", [{}])[0].get("name", "A team admin")
        send_team_invite_email(request.email, team.get("name"), str(team_id), inviter_name)
        
        return {"message": f"Invitation sent to {request.email}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/{team_id}/members")
async def get_team_members(team_id: str):
    try:
        team_id = ObjectId(team_id)
        members = await teams_dao.get_team_members(team_id)
        
        return [
            {
                "uuid": m.get("uuid"),
                "email": m.get("email"),
                "name": m.get("name"),
                "role": m.get("role"),
                "status": m.get("status"),
                "joinedAt": m.get("joined_at"),
                "progress": m.get("progress", {"overall": 0}),
                "kpis": m.get("kpis", {
                    "completedGoals": 0,
                    "pendingGoals": 0,
                    "engagement": 0,
                    "applications": 0,
                    "lastLogin": None
                }),
                "goals": m.get("goals", []),
                "applications": m.get("applications", [])
            }
            for m in members
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.put("/{team_id}/members/{member_uuid}")
async def update_team_member(team_id: str, member_uuid: str, request: UpdateMemberRequest):
    try:
        team_id = ObjectId(team_id)
        result = await teams_dao.update_member_role(team_id, member_uuid, request.role)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update member")
        
        return {"message": f"Member role updated to {request.role}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.delete("/{team_id}/members/{member_uuid}")
async def remove_team_member(team_id: str, member_uuid: str):
    try:
        team_id = ObjectId(team_id)
        result = await teams_dao.remove_member_from_team(team_id, member_uuid)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to remove member")
        
        return {"message": "Member removed from team"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.post("/{team_id}/members/{member_uuid}/feedback")
async def send_mentor_feedback(team_id: str, member_uuid: str, request: SendFeedbackRequest):
    try:
        team_id_obj = ObjectId(team_id)
        
        feedback_data = {
            "mentor_id": request.mentorId,
            "feedback": request.feedback,
            "created_at": datetime.utcnow()
        }
        
        result = await teams_dao.add_member_feedback(team_id_obj, member_uuid, feedback_data)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to save feedback")
        
        # Log feedback activity for engagement tracking
        await teams_dao.update_member_activity(team_id_obj, member_uuid, "feedback_received")
        
        return {"message": "Feedback sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.post("/{team_id}/members/{member_uuid}/log-activity")
async def log_member_activity(team_id: str, member_uuid: str, activity_type: str):
    """Log member activity (login, goal_completed, application_sent, feedback_received)"""
    try:
        team_id_obj = ObjectId(team_id)
        
        valid_activities = ["login", "goal_completed", "application_sent", "feedback_received"]
        if activity_type not in valid_activities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid activity type. Must be one of: {', '.join(valid_activities)}"
            )
        
        result = await teams_dao.update_member_activity(team_id_obj, member_uuid, activity_type)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        return {"message": f"Activity logged: {activity_type}", "engagement_updated": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/{team_id}/members/{member_uuid}/activity-summary")
async def get_activity_summary(team_id: str, member_uuid: str):
    """Get member's activity summary for the last 30 days"""
    try:
        team_id_obj = ObjectId(team_id)
        summary = await teams_dao.get_member_activity_summary(team_id_obj, member_uuid)
        
        if not summary:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@teams_router.get("/{team_id}/members/{member_uuid}/goals")
async def get_member_goals(team_id: str, member_uuid: str):
    """Get member's goals"""
    try:
        team_id_obj = ObjectId(team_id)
        team = await teams_dao.get_team_by_id(team_id_obj)
        
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        return member.get("goals", [])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@teams_router.post("/{team_id}/members/{member_uuid}/log-login")
async def log_member_login(team_id: str, member_uuid: str):
    """Convenience endpoint to log a member login"""
    try:
        team_id_obj = ObjectId(team_id)
        result = await teams_dao.update_member_activity(team_id_obj, member_uuid, "login")
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        return {"message": "Login logged successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ GOALS & ENGAGEMENT ============

@teams_router.put("/{team_id}/members/{member_uuid}/goals")
async def update_member_goals(team_id: str, member_uuid: str, request: UpdateGoalsRequest):
    """Update member goals and track completion activity"""
    try:
        team_id_obj = ObjectId(team_id)
        goals = request.goals
        
        # Get the previous goals to detect completions
        team = await teams_dao.get_team_by_id(team_id_obj)
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        previous_goals = member.get("goals", [])
        previous_completed = len([g for g in previous_goals if g.get("completed")])
        new_completed = len([g for g in goals if g.get("completed")])
        
        # If new goals were completed, log the activity AND milestone
        if new_completed > previous_completed:
            goals_completed = new_completed - previous_completed
            for _ in range(goals_completed):
                await teams_dao.update_member_activity(team_id_obj, member_uuid, "goal_completed")
                # Log milestone for each completed goal
                await log_milestone_for_event(
                    team_id_obj,
                    member_uuid,
                    "goal_completed",
                    {"goal_title": "a goal"}
                )
        
        # Update the goals
        result = await teams_dao.update_member_goals(team_id_obj, member_uuid, goals)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update goals")
        
        return {
            "message": "Goals updated successfully",
            "goalsCompleted": new_completed,
            "engagementUpdated": new_completed > previous_completed
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ============ APPLICATIONS & ENGAGEMENT ============

@teams_router.put("/{team_id}/members/{member_uuid}/applications")
async def update_member_applications(team_id: str, member_uuid: str, applications: list):
    """Update member applications and track application sent activity + milestones"""
    try:
        team_id_obj = ObjectId(team_id)
        
        # Get the previous applications to detect new submissions
        team = await teams_dao.get_team_by_id(team_id_obj)
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        member = next((m for m in team.get("members", []) if m.get("uuid") == member_uuid), None)
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        previous_applications = member.get("applications", [])
        previous_count = len(previous_applications)
        new_count = len(applications)
        
        # If new applications were added, log the activity
        if new_count > previous_count:
            new_applications = new_count - previous_count
            for _ in range(new_applications):
                await teams_dao.update_member_activity(team_id_obj, member_uuid, "application_sent")
        
        # Check for status changes that should trigger milestones
        for new_app in applications:
            # Find corresponding old app
            old_app = next(
                (a for a in previous_applications if a.get("id") == new_app.get("id")),
                None
            )
            
            if old_app:
                old_status = old_app.get("status", "").lower()
                new_status = new_app.get("status", "").lower()
                
                # Interview milestone
                if old_status != "interview" and new_status == "interview":
                    await log_milestone_for_event(
                        team_id_obj,
                        member_uuid,
                        "interview_scheduled",
                        {"company": new_app.get("company", "a company")}
                    )
                
                # Offer milestone
                if old_status != "offer" and new_status == "offer":
                    await log_milestone_for_event(
                        team_id_obj,
                        member_uuid,
                        "offer_received",
                        {"company": new_app.get("company", "a company")}
                    )
        
        # Check for application count milestones (10, 25, 50)
        if new_count >= 10 and previous_count < 10:
            await log_milestone_for_event(team_id_obj, member_uuid, "applications_milestone_10")
        if new_count >= 25 and previous_count < 25:
            await log_milestone_for_event(team_id_obj, member_uuid, "applications_milestone_25")
        if new_count >= 50 and previous_count < 50:
            await log_milestone_for_event(team_id_obj, member_uuid, "applications_milestone_50")
        
        # Update the applications
        result = await teams_dao.update_member_applications(team_id_obj, member_uuid, applications)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update applications")
        
        return {
            "message": "Applications updated successfully",
            "applicationsCount": new_count,
            "engagementUpdated": new_count > previous_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/{team_id}/billing")
async def get_team_billing(team_id: str):
    try:
        team_id = ObjectId(team_id)
        billing = await teams_dao.get_billing(team_id)
        if not billing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing info not found")
        
        return billing
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.put("/{team_id}/billing")
async def update_team_billing(team_id: str, request: UpdateBillingRequest):
    try:
        team_id = ObjectId(team_id)
        
        plan_prices = {
            "basic": 99,
            "standard": 199,
            "premium": 299
        }
        
        if request.plan not in plan_prices:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan")
        
        billing_update = {
            "plan": request.plan,
            "price": plan_prices[request.plan],
            "updated_at": datetime.utcnow()
        }
        
        result = await teams_dao.update_billing(team_id, billing_update)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        return {"message": f"Plan updated to {request.plan}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.post("/{team_id}/billing/cancel")
async def cancel_subscription(team_id: str):
    try:
        team_id = ObjectId(team_id)
        result = await teams_dao.update_billing(team_id, {"status": "cancelled"})
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        return {"message": "Subscription cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/{team_id}/progress")
async def get_team_progress(team_id: str):
    try:
        team_id = ObjectId(team_id)
        progress = await teams_dao.calculate_team_progress(team_id, jobs_dao)
        
        if not progress:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
        return {
            "teamId": str(team_id),
            "overallProgress": progress.get("overallProgress", 0),
            "totalGoals": progress.get("totalGoals", 0),
            "completedGoals": progress.get("completedGoals", 0),
            "totalApplications": progress.get("totalApplications", 0),
            "memberProgress": progress.get("memberProgress", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/{team_id}/reports")
async def get_team_reports(team_id: str):
    try:
        print(f"Fetching reports for team_id: {team_id}")
        team_id_obj = ObjectId(team_id)
        
        reports = await teams_dao.get_team_reports(team_id_obj, jobs_dao)
        print(f"Reports generated successfully")
        
        return {
            "teamId": str(team_id_obj),
            "overallProgress": reports.get("overallProgress", 0),
            "totalGoalsCompleted": reports.get("totalGoalsCompleted", 0),
            "totalApplicationsSent": reports.get("totalApplicationsSent", 0),
            "averageEngagement": reports.get("averageEngagement", 0),
            "memberBreakdown": reports.get("memberBreakdown", {}),
            "engagementByRole": reports.get("engagementByRole", {}),
            "applicationStatusBreakdown": reports.get("applicationStatusBreakdown", []),
            "engagementDistribution": reports.get("engagementDistribution", []),
            "topPerformers": reports.get("topPerformers", []),
            "needsAttention": reports.get("needsAttention", []),
            "applicationMetrics": reports.get("applicationMetrics", {})
        }
    except Exception as e:
        print(f"Error in get_team_reports: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@teams_router.get("/{team_id}/members/{member_uuid}/report")
async def get_member_report(team_id: str, member_uuid: str):
    try:
        team_id = ObjectId(team_id)
        member_report = await teams_dao.get_member_report(team_id, member_uuid, jobs_dao)
        
        if not member_report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        return member_report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@teams_router.post("/{team_id}/members/{member_uuid}/manual-milestone")
async def log_manual_milestone(team_id: str, member_uuid: str, milestone_data: dict):
    """
    Manually log a milestone (for special achievements not covered by auto-logging)
    """
    try:
        team_id_obj = ObjectId(team_id)
        
        milestone = {
            "id": f"manual_{datetime.utcnow().timestamp()}",
            "title": milestone_data.get("title", "Achievement Unlocked"),
            "description": milestone_data.get("description", ""),
            "achieved_date": datetime.utcnow(),
            "category": milestone_data.get("category", "custom"),
            "impact_score": milestone_data.get("impact_score", 5),
            "celebration_message": milestone_data.get("celebration_message")
        }
        
        success = await progress_sharing_dao.log_milestone(team_id_obj, member_uuid, milestone)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to log milestone")
        
        return {"message": "Milestone logged", "milestone": milestone}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))