from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.InformationalInterview import InformationalInterview, InterviewPreparation, InterviewFollowUp
from mongo.informational_interviews_dao import informational_interviews_dao

informational_interviews_router = APIRouter(prefix="/interviews")

@informational_interviews_router.post("", tags=["interviews"])
async def create_interview(interview: InformationalInterview, uuid: str = Depends(authorize)):
    try:
        model = interview.model_dump()
        model["uuid"] = uuid
        result = await informational_interviews_dao.add_interview(model)
        return {"interview_id": result}
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.get("", tags=["interviews"])
async def get_all_interviews(uuid: str = Depends(authorize)):
    try:
        results = await informational_interviews_dao.get_all_interviews(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.get("/{interview_id}", tags=["interviews"])
async def get_interview(interview_id: str, uuid: str = Depends(authorize)):
    try:
        result = await informational_interviews_dao.get_interview(interview_id)
        if not result:
            raise HTTPException(404, "Interview not found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.put("/{interview_id}", tags=["interviews"])
async def update_interview(interview_id: str, interview: InformationalInterview, uuid: str = Depends(authorize)):
    try:
        result = await informational_interviews_dao.update_interview(interview_id, interview.model_dump(exclude_unset=True))
        if result == 0:
            raise HTTPException(404, "Interview not found")
        return {"detail": "Interview updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.delete("/{interview_id}", tags=["interviews"])
async def delete_interview(interview_id: str, uuid: str = Depends(authorize)):
    try:
        result = await informational_interviews_dao.delete_interview(interview_id)
        if result == 0:
            raise HTTPException(404, "Interview not found")
        return {"detail": "Interview deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.get("/status/{status}", tags=["interviews"])
async def get_interviews_by_status(status: str, uuid: str = Depends(authorize)):
    try:
        results = await informational_interviews_dao.get_interviews_by_status(uuid, status)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.get("/upcoming", tags=["interviews"])
async def get_upcoming_interviews(uuid: str = Depends(authorize)):
    try:
        results = await informational_interviews_dao.get_upcoming_interviews(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.get("/completed", tags=["interviews"])
async def get_completed_interviews(uuid: str = Depends(authorize)):
    try:
        results = await informational_interviews_dao.get_completed_interviews(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.post("/{interview_id}/preparation", tags=["interviews"])
async def add_interview_preparation(interview_id: str, preparation: InterviewPreparation, uuid: str = Depends(authorize)):
    try:
        # Verify interview belongs to user
        interview = await informational_interviews_dao.get_interview(interview_id)
        if not interview or interview.get("uuid") != uuid:
            raise HTTPException(404, "Interview not found")
        
        # Store preparation data
        update_data = {"preparation_data": preparation.model_dump()}
        result = await informational_interviews_dao.update_interview(interview_id, update_data)
        return {"detail": "Interview preparation added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.post("/{interview_id}/followup", tags=["interviews"])
async def add_interview_follow_up(interview_id: str, follow_up: InterviewFollowUp, uuid: str = Depends(authorize)):
    try:
        # Verify interview belongs to user
        interview = await informational_interviews_dao.get_interview(interview_id)
        if not interview or interview.get("uuid") != uuid:
            raise HTTPException(404, "Interview not found")
        
        # Update interview with follow-up information
        update_data = {
            "follow_up_sent": True,
            "follow_up_date": follow_up.follow_up_date,
            "follow_up_data": follow_up.model_dump()
        }
        result = await informational_interviews_dao.update_interview(interview_id, update_data)
        return {"detail": "Interview follow-up added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@informational_interviews_router.put("/{interview_id}/complete", tags=["interviews"])
async def complete_interview(interview_id: str, completion_data: dict, uuid: str = Depends(authorize)):
    try:
        # Verify interview belongs to user
        interview = await informational_interviews_dao.get_interview(interview_id)
        if not interview or interview.get("uuid") != uuid:
            raise HTTPException(404, "Interview not found")
        
        # Mark interview as completed with results
        update_data = {
            "status": "completed",
            "interview_notes": completion_data.get("interview_notes"),
            "key_insights": completion_data.get("key_insights"),
            "industry_intelligence": completion_data.get("industry_intelligence"),
            "relationship_outcome": completion_data.get("relationship_outcome"),
            "future_opportunities": completion_data.get("future_opportunities"),
            "impact_on_job_search": completion_data.get("impact_on_job_search")
        }
        result = await informational_interviews_dao.update_interview(interview_id, update_data)
        return {"detail": "Interview completed successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
