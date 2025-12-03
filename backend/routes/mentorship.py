from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.Mentorship import MentorshipRelationship, MentorshipInvitation, ProgressReport, MentorshipSession
from mongo.mentorship_dao import mentorship_dao

mentorship_router = APIRouter(prefix="/mentorship")

@mentorship_router.post("", tags=["mentorship"])
async def create_mentorship(mentorship: MentorshipRelationship, uuid: str = Depends(authorize)):
    try:
        model = mentorship.model_dump()
        model["uuid"] = uuid
        result = await mentorship_dao.add_mentorship(model)
        return {"mentorship_id": result}
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.get("", tags=["mentorship"])
async def get_all_mentorships(uuid: str = Depends(authorize)):
    try:
        results = await mentorship_dao.get_all_mentorships(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.get("/{mentorship_id}", tags=["mentorship"])
async def get_mentorship(mentorship_id: str, uuid: str = Depends(authorize)):
    try:
        result = await mentorship_dao.get_mentorship(mentorship_id)
        if not result:
            raise HTTPException(404, "Mentorship not found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.put("/{mentorship_id}", tags=["mentorship"])
async def update_mentorship(mentorship_id: str, mentorship: MentorshipRelationship, uuid: str = Depends(authorize)):
    try:
        result = await mentorship_dao.update_mentorship(mentorship_id, mentorship.model_dump(exclude_unset=True))
        if result == 0:
            raise HTTPException(404, "Mentorship not found")
        return {"detail": "Mentorship updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.delete("/{mentorship_id}", tags=["mentorship"])
async def delete_mentorship(mentorship_id: str, uuid: str = Depends(authorize)):
    try:
        result = await mentorship_dao.delete_mentorship(mentorship_id)
        if result == 0:
            raise HTTPException(404, "Mentorship not found")
        return {"detail": "Mentorship deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.get("/mentors", tags=["mentorship"])
async def get_mentors(uuid: str = Depends(authorize)):
    try:
        results = await mentorship_dao.get_mentors(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.get("/mentees", tags=["mentorship"])
async def get_mentees(uuid: str = Depends(authorize)):
    try:
        results = await mentorship_dao.get_mentees(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.get("/active", tags=["mentorship"])
async def get_active_mentorships(uuid: str = Depends(authorize)):
    try:
        results = await mentorship_dao.get_active_mentorships(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.post("/{mentorship_id}/invite", tags=["mentorship"])
async def send_mentorship_invitation(mentorship_id: str, invitation: MentorshipInvitation, uuid: str = Depends(authorize)):
    try:
        # Verify mentorship belongs to user
        mentorship = await mentorship_dao.get_mentorship(mentorship_id)
        if not mentorship or mentorship.get("uuid") != uuid:
            raise HTTPException(404, "Mentorship not found")
        
        # Update mentorship with invitation details
        update_data = {
            "invitation_date": invitation.invitation_date,
            "invitation_message": invitation.invitation_message,
            "access_permissions": invitation.access_permissions,
            "expected_commitment": invitation.expected_commitment,
            "invitation_status": invitation.invitation_status,
            "response_date": invitation.response_date
        }
        result = await mentorship_dao.update_mentorship(mentorship_id, update_data)
        return {"detail": "Mentorship invitation sent successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.post("/{mentorship_id}/progress", tags=["mentorship"])
async def add_progress_report(mentorship_id: str, report: ProgressReport, uuid: str = Depends(authorize)):
    try:
        # Verify mentorship belongs to user
        mentorship = await mentorship_dao.get_mentorship(mentorship_id)
        if not mentorship or mentorship.get("uuid") != uuid:
            raise HTTPException(404, "Mentorship not found")
        
        # Add progress report to mentorship
        current_reports = mentorship.get("progress_reports", [])
        report_data = report.model_dump()
        current_reports.append(report_data)
        
        update_data = {"progress_reports": current_reports}
        result = await mentorship_dao.update_mentorship(mentorship_id, update_data)
        return {"detail": "Progress report added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.post("/{mentorship_id}/session", tags=["mentorship"])
async def add_mentorship_session(mentorship_id: str, session: MentorshipSession, uuid: str = Depends(authorize)):
    try:
        # Verify mentorship belongs to user
        mentorship = await mentorship_dao.get_mentorship(mentorship_id)
        if not mentorship or mentorship.get("uuid") != uuid:
            raise HTTPException(404, "Mentorship not found")
        
        # Add session to mentorship
        current_sessions = mentorship.get("sessions", [])
        session_data = session.model_dump()
        current_sessions.append(session_data)
        
        update_data = {"sessions": current_sessions}
        result = await mentorship_dao.update_mentorship(mentorship_id, update_data)
        return {"detail": "Mentorship session added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@mentorship_router.post("/{mentorship_id}/feedback", tags=["mentorship"])
async def add_mentor_feedback(mentorship_id: str, feedback_data: dict, uuid: str = Depends(authorize)):
    try:
        # Verify mentorship belongs to user
        mentorship = await mentorship_dao.get_mentorship(mentorship_id)
        if not mentorship or mentorship.get("uuid") != uuid:
            raise HTTPException(404, "Mentorship not found")
        
        # Add feedback to mentorship
        current_feedback = mentorship.get("feedback_received", [])
        current_feedback.append(feedback_data)
        
        update_data = {"feedback_received": current_feedback}
        result = await mentorship_dao.update_mentorship(mentorship_id, update_data)
        return {"detail": "Mentor feedback added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
