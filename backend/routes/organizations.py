from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sessions.session_authorizer import authorize
from mongo.organizations_dao import organization_dao
from mongo.audit_dao import audit_dao
from mongo.teams_dao import teams_dao
from mongo.AI_dao import ai_dao
from schema.Organizations import Organization, JoinOrgRequest
from typing import List
import csv
import io
from datetime import datetime

org_router = APIRouter(prefix="/organizations")

@org_router.post("/register", tags=["enterprise"])
async def register_organization(org: Organization):
    """Register a new University or Institution"""
    # In production, this would be super-admin only or paid signup
    org_data = org.model_dump()
    org_id = await organization_dao.create_organization(org_data)
    
    # Log the creation event
    await audit_dao.log_event({
        "actor_id": "system",
        "actor_name": "System Registration",
        "action": "ORG_REGISTERED",
        "target_id": org_id,
        "organization_id": org_id,
        "details": {"name": org.name}
    })
    
    return {"message": "Organization registered", "org_id": org_id}

@org_router.get("/export/roi", tags=["enterprise"])
async def export_roi_report(uuid: str = Depends(authorize)):
    """Download a CSV report for integration with other platforms"""
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="Access denied")
        
    stats = await organization_dao.get_program_effectiveness(str(org["_id"]))
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Metric", "Value", "Category", "Generated At"])
    
    # Data Rows
    timestamp = datetime.utcnow().isoformat()
    writer.writerow(["Total Enrollment", stats['enrollment']['total'], "Enrollment", timestamp])
    writer.writerow(["Active Students", stats['enrollment']['active'], "Enrollment", timestamp])
    writer.writerow(["Placement Rate", f"{stats['outcomes']['placement_rate']}%", "Outcomes", timestamp])
    writer.writerow(["Total Interviews", stats['outcomes']['interviews'], "Outcomes", timestamp])
    writer.writerow(["Total Placements", stats['outcomes']['placements'], "Outcomes", timestamp])
    writer.writerow(["Total Applications", stats['activity_volume']['total_applications'], "Activity", timestamp])
    
    # Log the export action (Compliance)
    await audit_dao.log_event({
        "actor_id": uuid,
        "actor_name": "Admin",
        "action": "EXPORT_DATA",
        "target_id": "roi_report",
        "organization_id": str(org["_id"]),
        "details": {"format": "csv"}
    })
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=roi_report_{datetime.now().date()}.csv"}
    )

@org_router.get("/insights", tags=["enterprise"])
async def generate_program_insights(uuid: str = Depends(authorize)):
    """
    Generate AI-driven optimization tips based on REAL cohort data.
    """
    # 1. Get Org ID
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 2. Fetch the raw stats (The data we calculated in get_program_effectiveness)
    stats = await organization_dao.get_program_effectiveness(str(org["_id"]))
    
    prompt = f"""
    Analyze these University Career Services metrics and provide a strategic optimization tip.
    
    DATA:
    - Total Students: {stats['enrollment']['total']}
    - Active Students: {stats['enrollment']['active']}
    - Placement Rate: {stats['outcomes']['placement_rate']}%
    - Total Interviews: {stats['outcomes']['interviews']}
    - Total Applications: {stats['activity_volume']['total_applications']}
    
    INSTRUCTIONS:
    - Identify the biggest bottleneck (e.g. low activity, high activity but low interviews, or low offers).
    - Provide a specific "Insight" (what is happening).
    - Provide a specific "Action" (what to do about it).
    - Format the response as a simple string like: "Insight: [Your Insight] | Action: [Your Action]"
    """
    
    try:
        ai_response = await ai_dao.generate_text(
            prompt=prompt, 
            system_message="You are an expert Career Services Director analyzing program performance."
        )
        

        # Fallback defaults if AI format varies slightly
        insight = "Program analysis complete."
        action = "Review cohort engagement metrics."
        
        if "|" in ai_response:
            parts = ai_response.split("|")
            insight = parts[0].replace("Insight:", "").strip()
            action = parts[1].replace("Action:", "").strip()
        else:
            insight = ai_response
            
        return {"insight": insight, "action": action}

    except Exception as e:
        print(f"AI Insight Error: {e}")
        # Fallback logic so the dashboard doesn't crash if AI is down
        return {
            "insight": "AI analysis is currently unavailable.",
            "action": "Monitor student activity manually."
        }
    

@org_router.post("/join", tags=["enterprise"])
async def join_organization(
    request: JoinOrgRequest, 
    uuid: str = Depends(authorize)
):
    """Allow an existing user to join an Organization as an Admin"""
    try:
        # 1. Verify Org Exists
        org = await organization_dao.get_organization(request.org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_id = ObjectId(request.org_id)

        # 2. Add user to admin_ids
        # Check if already member first to avoid unnecessary DB writes
        if uuid in org.get("admin_ids", []):
             raise HTTPException(status_code=400, detail="You are already an admin of this organization")

        result = await organization_dao.org_collection.update_one(
            {"_id": org_id},
            {"$addToSet": {"admin_ids": uuid}}
        )
        
        if result.modified_count == 0:
             raise HTTPException(status_code=400, detail="Failed to join organization")
             
        # 3. Log Event
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
    # Find which Org this user manages
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(403, "You are not an Enterprise Administrator")
    
    org_id = str(org["_id"])
    
    # Calculate ROI & Effectiveness
    stats = await organization_dao.get_program_effectiveness(org_id)
    
    # Log the view event (Compliance requirement)
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
            "name": org["name"],
            "branding": org.get("branding")
        },
        "analytics": stats
    }

@org_router.post("/import", tags=["enterprise"])
async def bulk_import_users(
    file: UploadFile = File(...),
    cohort_name: str = Form(...),
    uuid: str = Depends(authorize)
):
    """
    Bulk onboard users via CSV file.
    Format: email, first_name, last_name
    """
    # Verify Admin Status
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(403, "You are not an Enterprise Administrator")
    
    org_id = str(org["_id"])
    # Process File
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "File must be a CSV")
    
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        users_to_add = []
        for row in csv_reader:
            if 'email' in row:
                users_to_add.append({
                    "email": row['email'].strip(),
                    "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip() or "Student",
                    "role": "candidate"
                })
                
        if not users_to_add:
            raise HTTPException(400, "CSV is empty or missing 'email' header")

        #Find or Create Cohort (Team)
        # Check if a team with this name already exists in this org
        existing_team = await teams_dao.collection.find_one({"name": cohort_name, "organization_id": org_id})
        
        if existing_team:
            team_id = existing_team["_id"]
        else:
            # Create new Team tagged as a "Cohort"
            team_data = {
                "name": cohort_name,
                "description": f"Cohort created via bulk import by {uuid}",
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
            # Link team to org
            await organization_dao.link_team_to_org(org_id, str(team_id))

        # 4. Add Members to Team
        added_count = 0
        for user in users_to_add:
            # Use existing invite logic
            new_member = {
                "uuid": None, # Pending registration
                "email": user["email"],
                "name": user["name"],
                "role": "candidate",
                "status": "invited",
                "invited_at": datetime.utcnow(),
                "goals": [],
                "applications": [],
                "feedback": []
            }
            # Check if already in team to avoid duplicates
            # (teams_dao.add_member_to_team handles the push)
            # Realistically we should check existance first, but for MVP let's push
            await teams_dao.add_member_to_team(team_id, new_member)
            added_count += 1

        # 5. Log the Compliance Event
        await audit_dao.log_event({
            "actor_id": uuid,
            "actor_name": "Admin", # In production, fetch real name
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
            "message": f"Successfully processed {added_count} users into cohort '{cohort_name}'",
            "cohort_id": str(team_id)
        }

    except Exception as e:
        print(f"Import error: {e}")
        raise HTTPException(500, f"Failed to process CSV: {str(e)}")
    
@org_router.get("/cohorts", tags=["enterprise"])
async def get_org_cohorts(uuid: str = Depends(authorize)):
    """Get list of cohorts and their high-level stats"""
    org = await organization_dao.get_admin_org(uuid)
    if not org:
        raise HTTPException(status_code=403, detail="You are not an Enterprise Administrator")
    
    cohorts = await organization_dao.get_org_cohorts(str(org["_id"]))
    return cohorts