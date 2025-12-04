from fastapi import APIRouter, HTTPException, Depends,Body
from sessions.session_authorizer import authorize
from mongo.advisors_dao import advisors_dao
from mongo.teams_dao import teams_dao
from mongo.jobs_dao import jobs_dao
from mongo.progress_sharing_dao import progress_sharing_dao
from schema.advisors import AdvisorInvite, CoachingSession, AdvisorTask
from uuid import uuid4
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()
GMAIL_SENDER = os.environ.get("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
advisors_router = APIRouter(prefix="/advisors")


def send_advisor_invite_email(to_email: str, inviter_name: str, engagement_id: str) -> bool:
    """Send an invitation email to the coach with their portal link"""
    try:
        portal_link = f"{FRONTEND_URL}/advisor-portal/{engagement_id}"
        
        subject = f"Invitation to connect as a Career Advisor for {inviter_name}"
        body = (
            f"Hello,\n\n"
            f"{inviter_name} has invited you to be their Career Advisor on Metamorphosis.\n\n"
            f"Through the Advisor Portal, you can assign tasks, schedule sessions, and track their progress.\n\n"
            f"Access your portal here:\n"
            f"{portal_link}\n\n"
            f"No account creation is required."
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
        print(f"Warning: Failed to send advisor invite email: {e}")
        return False

@advisors_router.post("/invite", tags=["advisors"])
async def invite_advisor(invite: AdvisorInvite, uuid: str = Depends(authorize)):
    """Invite a coach and create an engagement record"""
  
    engagement = {
        "user_uuid": uuid,
        "coach_email": invite.email,
        "coach_name": invite.name,
        "hourly_rate": invite.rate,
        "payment_link": invite.payment_link,
        "sessions": [],
        "tasks": []
    }
    
    eng_id = await advisors_dao.create_engagement(engagement)

   
    user_teams = await teams_dao.get_user_teams(uuid)
    user_name = "A candidate"
    if user_teams:
        member = next((m for m in user_teams[0].get("members", []) if m["uuid"] == uuid), None)
        if member:
            user_name = member.get("name", "A candidate")

   
    email_sent = send_advisor_invite_email(invite.email, user_name, eng_id)
    
    return {
        "message": "Advisor invited successfully", 
        "engagement_id": eng_id,
        "email_sent": email_sent
    }


@advisors_router.post("/{engagement_id}/sessions/{session_id}/rate", tags=["advisors"])
async def rate_session(
    engagement_id: str, 
    session_id: str, 
    rating: int = Body(..., ge=1, le=5), 
    feedback: str = Body(...), 
    uuid: str = Depends(authorize)
):
    """Rate a completed coaching session"""
    success = await advisors_dao.collection.update_one(
        {"_id": ObjectId(engagement_id), "sessions.id": session_id},
        {"$set": {
            "sessions.$.rating": rating, 
            "sessions.$.feedback": feedback,
            "sessions.$.rated_at": datetime.utcnow()
        }}
    )
    if not success.modified_count:
        raise HTTPException(400, "Failed to rate session")
    return {"message": "Feedback submitted"}


@advisors_router.get("/me", tags=["advisors"])
async def get_my_advisors(uuid: str = Depends(authorize)):
    engagements = await advisors_dao.get_user_engagements(uuid)
    for e in engagements:
        e["_id"] = str(e["_id"])
    return engagements

@advisors_router.put("/{engagement_id}/tasks/{task_id}", tags=["advisors"])
async def update_task_status(engagement_id: str, task_id: str, status: str, uuid: str = Depends(authorize)):
    await advisors_dao.update_task_status(engagement_id, task_id, status)
    return {"message": "Task updated"}


@advisors_router.get("/portal/{engagement_id}", tags=["advisors"])
async def get_advisor_portal(engagement_id: str):
    """Public view for the advisor - NOW WITH CLIENT DATA"""
    engagement = await advisors_dao.get_engagement_by_id(engagement_id)
    if not engagement:
        raise HTTPException(404, "Engagement not found")
    
    engagement["_id"] = str(engagement["_id"])

    # FETCH CLIENT CONTEXT
    user_uuid = engagement.get("user_uuid")
    client_data = {
        "goals": [],
        "recent_milestones": [],
        "application_stats": {"total": 0, "interviews": 0, "offers": 0}
    }

    if user_uuid:
        user_teams = await teams_dao.get_user_teams(user_uuid)
        if user_teams:
            team_id = user_teams[0]["_id"]
            milestones = await progress_sharing_dao.get_milestones(team_id, user_uuid, days=30)
            client_data["recent_milestones"] = milestones[:5] # Top 5
            
            # Get Goals (from member record)
            member = next((m for m in user_teams[0].get("members", []) if m["uuid"] == user_uuid), None)
            if member:
                goals_config = next((g for g in member.get("goals", []) if g.get("id") == "goals_config"), None)
                if goals_config:
                     client_data["goals"] = goals_config.get("data", {})

        # Get Job Stats
        jobs = await jobs_dao.get_all_jobs(user_uuid)
        client_data["application_stats"]["total"] = len(jobs)
        client_data["application_stats"]["interviews"] = len([j for j in jobs if j.get("status") == "Interview"])
        client_data["application_stats"]["offers"] = len([j for j in jobs if j.get("status") == "Offer"])

    # Attach to response
    engagement["client_context"] = client_data
    
    return engagement


@advisors_router.delete("/{engagement_id}", tags=["advisors"])
async def delete_advisor(engagement_id: str, uuid: str = Depends(authorize)):
    
    engagement = await advisors_dao.get_engagement_by_id(engagement_id)
    if not engagement or engagement.get("user_uuid") != uuid:
        raise HTTPException(404, "Advisor not found")

    success = await advisors_dao.delete_engagement(engagement_id)
    if not success:
        raise HTTPException(400, "Failed to remove advisor")
    return {"message": "Advisor removed"}

@advisors_router.get("/portal/{engagement_id}", tags=["advisors"])
async def get_advisor_portal(engagement_id: str):
    """Public view for the advisor"""
    engagement = await advisors_dao.get_engagement_by_id(engagement_id)
    if not engagement:
        raise HTTPException(404, "Engagement not found")
    engagement["_id"] = str(engagement["_id"])
    return engagement

@advisors_router.post("/portal/{engagement_id}/sessions", tags=["advisors"])
async def add_session(engagement_id: str, session: CoachingSession):
    session_data = session.model_dump()
    success = await advisors_dao.add_session(engagement_id, session_data)
    if not success:
        raise HTTPException(400, "Failed to add session")
    return {"message": "Session added"}

@advisors_router.post("/portal/{engagement_id}/tasks", tags=["advisors"])
async def add_task(engagement_id: str, task: AdvisorTask):
    task_data = task.model_dump()
    success = await advisors_dao.add_task(engagement_id, task_data)
    if not success:
        raise HTTPException(400, "Failed to add task")
    return {"message": "Task added"}