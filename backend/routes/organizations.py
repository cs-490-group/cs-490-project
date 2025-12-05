from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from sessions.session_authorizer import authorize
from mongo.organizations_dao import organization_dao
from mongo.audit_dao import audit_dao
from mongo.teams_dao import teams_dao
from schema.Organizations import Organization, JoinOrgRequest
from typing import List
import csv
import io
import os
import smtplib
from email.mime.text import MIMEText
from datetime import datetime
from bson import ObjectId
from dotenv import load_dotenv

# Load Env
load_dotenv()
GMAIL_SENDER = os.environ.get("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

org_router = APIRouter(prefix="/organizations")

# --- EMAIL HELPER ---
def send_cohort_invite_email(to_email: str, cohort_name: str, team_id: str):
    """Send an invitation email to a student added via bulk import"""
    if not GMAIL_SENDER or not GMAIL_APP_PASSWORD:
        print("⚠️ Email credentials not set. Skipping email.")
        return

    try:
        join_link = f"{FRONTEND_URL}/setup-team?inviteCode={team_id}"
        
        subject = f"You have been added to the {cohort_name} Cohort"
        body = (
            f"Hello,\n\n"
            f"You have been added to the '{cohort_name}' career cohort on Metamorphosis.\n\n"
            f"To access your dashboard and career tools, please click the link below:\n"
            f"{join_link}\n\n"
            f"If you don't have an account yet, you will be prompted to create one.\n\n"
            f"Welcome aboard!"
        )
        
        msg = MIMEText(body)
        msg["From"] = GMAIL_SENDER
        msg["To"] = to_email
        msg["Subject"] = subject
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"✅ Sent invite to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send invite to {to_email}: {e}")

# --- ROUTES ---

@org_router.post("/register", tags=["enterprise"])
async def register_organization(org: Organization):
    """Register a new University or Institution"""
    org_data = org.model_dump()
    org_id = await organization_dao.create_organization(org_data)
    
    await audit_dao.log_event({
        "actor_id": "system",
        "actor_name": "System Registration",
        "action": "ORG_REGISTERED",
        "target_id": org_id,
        "organization_id": org_id,
        "details": {"name": org.name}
    })
    
    return {"message": "Organization registered", "org_id": org_id}

@org_router.post("/join", tags=["enterprise"])
async def join_organization(
    request: JoinOrgRequest, 
    uuid: str = Depends(authorize)
):
    """Allow an existing user to join an Organization as an Admin"""
    try:
        org = await organization_dao.get_organization(request.org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_id = ObjectId(request.org_id)

        if uuid in org.get("admin_ids", []):
             raise HTTPException(status_code=400, detail="You are already an admin of this organization")

        result = await organization_dao.org_collection.update_one(
            {"_id": org_id},
            {"$addToSet": {"admin_ids": uuid}}
        )
        
        if result.modified_count == 0:
             raise HTTPException(status_code=400, detail="Failed to join organization")
             
        await audit_dao.log_event({
            "actor_id": uuid,
            "actor_name": "User",
            "action": "JOIN_ORG",
            "target_id": str(org_id),
            "organization_id": str(org_id),
            "details": {"method": "invite_code"}
        })

        return {"message": f"Successfully joined {org.get('name')}"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Join Org Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@org_router.get("/dashboard", tags=["enterprise"])
async def get_enterprise_dashboard(uuid: str = Depends(authorize)):
    """
    Get the high-level ROI dashboard for the Institution Admin.
    """
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="You are not an Enterprise Administrator")
    
    org_id = str(org["_id"])
    stats = await organization_dao.get_program_effectiveness(org_id)
    
    await audit_dao.log_event({
        "actor_id": uuid,
        "actor_name": "Admin",
        "action": "VIEW_DASHBOARD",
        "target_id": org_id,
        "organization_id": org_id,
        "details": {}
    })
    
    return {
        "organization": {
            "id": str(org["_id"]),
            "name": org["name"],
            "branding": org.get("branding")
        },
        "analytics": stats
    }

@org_router.get("/cohorts", tags=["enterprise"])
async def get_org_cohorts(uuid: str = Depends(authorize)):
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="You are not an Enterprise Administrator")
    
    cohorts = await organization_dao.get_org_cohorts(str(org["_id"]))
    return cohorts

@org_router.get("/members", tags=["enterprise"])
async def get_org_members(uuid: str = Depends(authorize)):
    """Get all students/members in the organization"""
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="Access denied")
    
    members = await organization_dao.get_org_members(str(org["_id"]))
    return members

@org_router.post("/import", tags=["enterprise"])
async def bulk_import_users(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    cohort_name: str = Form(...),
    uuid: str = Depends(authorize)
):
    """Bulk onboard users via CSV file and send invites."""
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="You are not an Enterprise Administrator")
    
    org_id = str(org["_id"])

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        users_to_add = []
        for row in csv_reader:
            email = row.get('email') or row.get('Email')
            fname = row.get('first_name') or row.get('First Name') or ""
            lname = row.get('last_name') or row.get('Last Name') or ""
            
            if email:
                users_to_add.append({
                    "email": email.strip(),
                    "name": f"{fname} {lname}".strip() or "Student",
                    "role": "candidate"
                })
                
        if not users_to_add:
            raise HTTPException(status_code=400, detail="CSV is empty or missing 'email' header")

        # Find or Create Cohort
        existing_team = await teams_dao.collection.find_one({"name": cohort_name, "organization_id": org_id})
        
        if existing_team:
            team_id = existing_team["_id"]
        else:
            team_data = {
                "name": cohort_name,
                "description": f"Cohort created via bulk import",
                "creator_id": uuid,
                "organization_id": org_id,
                "type": "cohort",
                "members": [{
                    "uuid": uuid, 
                    "role": "admin", 
                    "status": "active", 
                    "name": "Admin", 
                    "joined_at": datetime.utcnow()
                }],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            team_id = await teams_dao.add_team(team_data)
            await organization_dao.link_team_to_org(org_id, str(team_id))

        # Add Members & Queue Emails
        added_count = 0
        for user in users_to_add:
            new_member = {
                "uuid": None,
                "email": user["email"],
                "name": user["name"],
                "role": "candidate",
                "status": "invited",
                "invited_at": datetime.utcnow(),
                "goals": [],
                "applications": [],
                "feedback": []
            }
            # Add to DB
            await teams_dao.add_member_to_team(team_id, new_member)
            
            # 📨 QUEUE EMAIL (Non-blocking)
            background_tasks.add_task(
                send_cohort_invite_email, 
                to_email=user["email"], 
                cohort_name=cohort_name, 
                team_id=str(team_id)
            )
            
            added_count += 1

        await audit_dao.log_event({
            "actor_id": uuid,
            "actor_name": "Admin",
            "action": "BULK_IMPORT",
            "target_id": str(team_id),
            "organization_id": org_id,
            "details": {
                "cohort_name": cohort_name,
                "users_processed": len(users_to_add),
                "users_added": added_count,
                "filename": file.filename
            }
        })

        return {
            "message": f"Successfully processed {added_count} users. Emails are being sent in the background.",
            "cohort_id": str(team_id)
        }

    except Exception as e:
        print(f"Import error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")

@org_router.delete("/{org_id}", tags=["enterprise"])
async def delete_organization(org_id: str, uuid: str = Depends(authorize)):
    """Permanently delete an organization (Admin only)"""
    try:
        org = await organization_dao.get_organization(org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        if uuid not in org.get("admin_ids", []):
            raise HTTPException(status_code=403, detail="Access denied")

        success = await organization_dao.delete_organization(org_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to delete organization")

        await audit_dao.log_event({
            "actor_id": uuid,
            "actor_name": "Admin",
            "action": "DELETE_ORG",
            "target_id": org_id,
            "organization_id": org_id
        })

        return {"message": "Organization deleted"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@org_router.post("/leave", tags=["enterprise"])
async def leave_organization(uuid: str = Depends(authorize)):
    """Leave the current organization (Self-remove from admin list)"""
    try:
        org = await organization_dao.get_admin_org(uuid)
        if not org:
            raise HTTPException(status_code=404, detail="You are not part of an organization")
        
        org_id = str(org["_id"])
        
        if len(org.get("admin_ids", [])) <= 1:
            raise HTTPException(status_code=400, detail="You are the only admin. Delete the organization instead.")

        success = await organization_dao.remove_admin(org_id, uuid)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to leave organization")

        await audit_dao.log_event({
            "actor_id": uuid,
            "actor_name": "Admin",
            "action": "LEAVE_ORG",
            "target_id": org_id,
            "organization_id": org_id
        })

        return {"message": "Successfully left organization"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@org_router.get("/insights", tags=["enterprise"])
async def generate_program_insights(uuid: str = Depends(authorize)):
    """Generate AI-driven optimization tips based on real cohort data"""
    from mongo.AI_dao import ai_dao 
    
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="Access denied")
    
    stats = await organization_dao.get_program_effectiveness(str(org["_id"]))
    
    prompt = f"""
    Analyze these Career Services metrics and provide 1 strategic optimization tip:
    
    - Total Students: {stats['enrollment']['total']}
    - Active Students: {stats['enrollment']['active']}
    - Placement Rate: {stats['outcomes']['placement_rate']}%
    - Total Interviews: {stats['outcomes']['interviews']}
    - Total Applications: {stats['activity_volume']['total_applications']}
    
    Return a string like: "Insight: [Observation] | Action: [Specific Step]"
    """
    
    try:
        if not ai_dao:
             raise Exception("AI DAO not available")
             
        ai_response = await ai_dao.generate_text(prompt, "You are a Career Services Director.")
        
        insight = "Analysis complete."
        action = "Review engagement metrics."
        
        if "|" in ai_response:
            parts = ai_response.split("|")
            insight = parts[0].replace("Insight:", "").strip()
            action = parts[1].replace("Action:", "").strip()
        else:
            insight = ai_response

        return {"insight": insight, "action": action}
    except Exception as e:
        print(f"AI Error: {e}")
        # Fallback
        placement = stats['outcomes']['placement_rate']
        if placement < 30:
            return {"insight": "Placement is low.", "action": "Focus on interview prep."}
        return {"insight": "Program is healthy.", "action": "Expand employer network."}

@org_router.get("/export/roi", tags=["enterprise"])
async def export_roi_report(uuid: str = Depends(authorize)):
    """Download a CSV report"""
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="Access denied")
        
    stats = await organization_dao.get_program_effectiveness(str(org["_id"]))
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Metric", "Value", "Category", "Date"])
    ts = datetime.utcnow().isoformat()
    
    writer.writerow(["Total Enrollment", stats['enrollment']['total'], "Enrollment", ts])
    writer.writerow(["Active Students", stats['enrollment']['active'], "Enrollment", ts])
    writer.writerow(["Placement Rate", f"{stats['outcomes']['placement_rate']}%", "Outcomes", ts])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=roi_report.csv"}
    )