from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional

from schema.InterviewSchedule import (
    CreateInterviewScheduleRequest,
    UpdateInterviewScheduleRequest,
    CompleteInterviewRequest,
    PreparationTask,
    GenerateFollowUpRequest
)
from mongo.interview_schedule_dao import (
    InterviewScheduleDAO,
    InterviewAnalyticsDAO,
    FollowUpTemplateDAO,
    WritingPracticeDAO
)
from services.calendar_integration_service import (
    CalendarIntegrationService,
    PreparationTaskGenerator
)
from services.followup_template_service import FollowUpTemplateService
from services.interview_analytics_service import InterviewAnalyticsService
from services.writing_practice_service import WritingPracticeService
from services.success_prediction_service import SuccessPredictionService
from mongo.dao_setup import db_client
from sessions.session_authorizer import authorize

# Initialize router
interview_schedule_router = APIRouter(prefix="/interview-schedule", tags=["interview-schedule"])

# Initialize DAOs and Services
schedule_dao = InterviewScheduleDAO(db_client)
analytics_dao = InterviewAnalyticsDAO(db_client)
followup_dao = FollowUpTemplateDAO(db_client)
writing_dao = WritingPracticeDAO(db_client)

calendar_service = CalendarIntegrationService()
followup_service = FollowUpTemplateService()
analytics_service = InterviewAnalyticsService(db_client)
writing_service = WritingPracticeService()
prediction_service = SuccessPredictionService(db_client)


# ============================================================================
# INTERVIEW SCHEDULE CRUD ENDPOINTS
# ============================================================================

@interview_schedule_router.post("/create")
async def create_interview_schedule(
    request_data: CreateInterviewScheduleRequest,
    uuid_val: str = Depends(authorize)
):
    """Create a new interview schedule with optional calendar integration"""
    try:
        # Prepare schedule data
        schedule_data = {
            "user_uuid": uuid_val,
            "job_application_uuid": request_data.job_application_uuid,
            "interview_datetime": request_data.interview_datetime,
            "duration_minutes": request_data.duration_minutes,
            "timezone": request_data.timezone,
            "location_type": request_data.location_type,
            "location_details": request_data.location_details,
            "video_platform": request_data.video_platform,
            "video_link": request_data.video_link,
            "phone_number": request_data.phone_number,
            "interviewer_name": request_data.interviewer_name,
            "interviewer_email": request_data.interviewer_email,
            "interviewer_phone": request_data.interviewer_phone,
            "interviewer_title": request_data.interviewer_title,
            "calendar_provider": request_data.calendar_provider,
            "notes": request_data.notes,
            "preparation_tasks": [],
            "reminders_sent": {"24h": False, "2h": False, "1h": False}
        }
        
        # Generate video link if needed
        if request_data.location_type == "video" and not request_data.video_link:
            video_info = calendar_service.generate_video_conference_link(
                request_data.video_platform or "zoom"
            )
            schedule_data["video_link"] = video_info["link"]
        
        # Auto-generate preparation tasks if requested
        if request_data.auto_generate_prep_tasks:
            # In production, fetch job details to get title and company
            job_title = "Position"  # Placeholder
            company_name = "Company"  # Placeholder
            
            prep_tasks = PreparationTaskGenerator.generate_tasks(
                job_title=job_title,
                company_name=company_name,
                location_type=request_data.location_type,
                interviewer_name=request_data.interviewer_name
            )
            schedule_data["preparation_tasks"] = prep_tasks
        
        # Create schedule in database
        schedule_uuid = await schedule_dao.create_schedule(schedule_data)
        
        # Get created schedule
        schedule = await schedule_dao.get_schedule(schedule_uuid)
        
        return {
            "detail": "Interview scheduled successfully",
            "schedule_uuid": schedule_uuid,
            "schedule": schedule,
            "video_link": schedule_data.get("video_link")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating schedule: {str(e)}")


@interview_schedule_router.get("/upcoming")
async def get_upcoming_interviews(uuid_val: str = Depends(authorize)):
    """Get all upcoming interviews for the user"""
    try:
        interviews = await schedule_dao.get_upcoming_interviews(uuid_val)
        
        return {
            "upcoming_interviews": interviews,
            "count": len(interviews)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching interviews: {str(e)}")


@interview_schedule_router.get("/{schedule_id}")
async def get_interview_schedule(
    schedule_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get a specific interview schedule"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    return {"schedule": schedule}


@interview_schedule_router.put("/{schedule_id}/update")
async def update_interview_schedule(
    schedule_id: str,
    request_data: UpdateInterviewScheduleRequest,
    uuid_val: str = Depends(authorize)
):
    """Update an interview schedule"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    # Prepare update data
    update_data = {}
    if request_data.interview_datetime:
        update_data["interview_datetime"] = request_data.interview_datetime
    if request_data.duration_minutes:
        update_data["duration_minutes"] = request_data.duration_minutes
    if request_data.location_type:
        update_data["location_type"] = request_data.location_type
    if request_data.location_details:
        update_data["location_details"] = request_data.location_details
    if request_data.video_link:
        update_data["video_link"] = request_data.video_link
    if request_data.interviewer_name:
        update_data["interviewer_name"] = request_data.interviewer_name
    if request_data.interviewer_email:
        update_data["interviewer_email"] = request_data.interviewer_email
    if request_data.notes:
        update_data["notes"] = request_data.notes
    
    await schedule_dao.update_schedule(schedule_id, update_data)
    
    updated_schedule = await schedule_dao.get_schedule(schedule_id)
    
    return {
        "detail": "Schedule updated successfully",
        "schedule": updated_schedule
    }


@interview_schedule_router.post("/{schedule_id}/complete")
async def complete_interview(
    schedule_id: str,
    request_data: CompleteInterviewRequest,
    uuid_val: str = Depends(authorize)
):
    """Mark interview as completed with outcome"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    outcome_data = {
        "outcome": request_data.outcome,
        "outcome_notes": request_data.outcome_notes,
        "interviewer_feedback": request_data.interviewer_feedback
    }
    
    await schedule_dao.complete_interview(schedule_id, outcome_data)
    
    updated_schedule = await schedule_dao.get_schedule(schedule_id)
    
    return {
        "detail": "Interview marked as completed",
        "schedule": updated_schedule
    }


@interview_schedule_router.post("/{schedule_id}/cancel")
async def cancel_interview(
    schedule_id: str,
    reason: Optional[str] = None,
    uuid_val: str = Depends(authorize)
):
    """Cancel an interview"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    await schedule_dao.cancel_interview(schedule_id, reason)
    
    return {"detail": "Interview cancelled successfully"}


@interview_schedule_router.delete("/{schedule_id}")
async def delete_interview_schedule(
    schedule_id: str,
    uuid_val: str = Depends(authorize)
):
    """Delete an interview schedule"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    await schedule_dao.delete_schedule(schedule_id)
    
    return {"detail": "Schedule deleted successfully"}


# ============================================================================
# PREPARATION TASK ENDPOINTS
# ============================================================================

@interview_schedule_router.post("/{schedule_id}/tasks/add")
async def add_preparation_task(
    schedule_id: str,
    task: PreparationTask,
    uuid_val: str = Depends(authorize)
):
    """Add a preparation task to the checklist"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    task_dict = task.dict()
    await schedule_dao.add_preparation_task(schedule_id, task_dict)
    
    return {"detail": "Task added successfully", "task": task_dict}


@interview_schedule_router.put("/{schedule_id}/tasks/{task_id}/complete")
async def complete_preparation_task(
    schedule_id: str,
    task_id: str,
    uuid_val: str = Depends(authorize)
):
    """Mark a preparation task as completed"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    # Update task
    task_update = {
        "is_completed": True,
        "completed_at": datetime.now(timezone.utc)
    }
    
    await schedule_dao.update_preparation_task(schedule_id, task_id, task_update)
    
    # Recalculate completion percentage
    updated_schedule = await schedule_dao.get_schedule(schedule_id)
    tasks = updated_schedule.get("preparation_tasks", [])
    
    if tasks:
        completed = sum(1 for t in tasks if t.get("is_completed", False))
        percentage = int((completed / len(tasks)) * 100)
        await schedule_dao.update_preparation_completion(schedule_id, percentage)
    
    return {"detail": "Task marked as completed"}


@interview_schedule_router.post("/{schedule_id}/tasks/generate")
async def generate_preparation_tasks(
    schedule_id: str,
    uuid_val: str = Depends(authorize)
):
    """Auto-generate preparation tasks for an interview"""
    schedule = await schedule_dao.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if schedule["user_uuid"] != uuid_val:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    
    # In production: fetch job details
    job_title = "Position"
    company_name = "Company"
    
    tasks = PreparationTaskGenerator.generate_tasks(
        job_title=job_title,
        company_name=company_name,
        location_type=schedule.get("location_type", "video"),
        interviewer_name=schedule.get("interviewer_name")
    )
    
    # Add each task
    for task in tasks:
        await schedule_dao.add_preparation_task(schedule_id, task)
    
    return {
        "detail": f"Generated {len(tasks)} preparation tasks",
        "tasks": tasks
    }