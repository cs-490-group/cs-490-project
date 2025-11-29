from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from mongo.teams_dao import teams_dao
from mongo.jobs_dao import jobs_dao
from schema.teams import (
    CreateTeamRequest, UpdateTeamRequest, InviteMemberRequest,
    UpdateMemberRequest, UpdateBillingRequest, SendFeedbackRequest,
    AcceptInvitationRequest
)

load_dotenv()
GMAIL_SENDER = os.environ.get("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

teams_router = APIRouter(prefix="/teams")


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
        team = await teams_dao.get_team(team_id)
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
        team_id = ObjectId(team_id)
        
        feedback_data = {
            "mentor_id": request.mentorId,
            "feedback": request.feedback,
            "created_at": datetime.utcnow()
        }
        
        result = await teams_dao.add_member_feedback(team_id, member_uuid, feedback_data)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to save feedback")
        
        return {"message": "Feedback sent successfully"}
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
        team_id = ObjectId(team_id)
        reports = await teams_dao.get_team_reports(team_id)
        
        return {
            "teamId": str(team_id),
            "overallProgress": reports.get("overallProgress", 0),
            "totalGoalsCompleted": reports.get("totalGoalsCompleted", 0),
            "totalApplicationsSent": reports.get("totalApplicationsSent", 0),
            "averageEngagement": reports.get("averageEngagement", 0),
            "memberBreakdown": reports.get("memberBreakdown", {}),
            "engagementByRole": reports.get("engagementByRole", {}),
            "topPerformers": reports.get("topPerformers", []),
            "needsAttention": reports.get("needsAttention", [])
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@teams_router.get("/{team_id}/members/{member_uuid}/report")
async def get_member_report(team_id: str, member_uuid: str):
    try:
        team_id = ObjectId(team_id)
        member_report = await teams_dao.get_member_report(team_id, member_uuid)
        
        if not member_report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        
        return {
            "memberId": member_uuid,
            "memberName": member_report.get("name"),
            "role": member_report.get("role"),
            "progressScore": member_report.get("progressScore", 0),
            "completedGoals": member_report.get("completedGoals", 0),
            "pendingGoals": member_report.get("pendingGoals", 0),
            "applications": member_report.get("applications", 0),
            "engagement": member_report.get("engagement", 0),
            "lastActive": member_report.get("lastActive"),
            "coachingInsights": member_report.get("coachingInsights", []),
            "recommendations": member_report.get("recommendations", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))