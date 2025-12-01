"""
Combined Interview Router
Handles calendar integration, reminders, and follow-up templates
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from datetime import datetime, timezone, timedelta
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from schema.InterviewSchedule import GenerateFollowUpRequest
from mongo.interview_schedule_dao import (
    InterviewScheduleDAO,
    FollowUpTemplateDAO
)
from services.calendar_service import calendar_service, PreparationTaskGenerator
from services.followup_service import followup_service
from mongo.dao_setup import db_client
from sessions.session_authorizer import authorize

# Initialize router
interview_router = APIRouter(prefix="/interview", tags=["interview"])

# Initialize DAOs
schedule_dao = InterviewScheduleDAO(db_client)
followup_dao = FollowUpTemplateDAO(db_client)

# In-memory storage for calendar credentials (replace with database in production)
calendar_credentials_store = {}

# Background scheduler for reminders
reminder_scheduler = AsyncIOScheduler()


# ============================================================================
# INTERVIEW SCHEDULE ENDPOINTS
# ============================================================================

@interview_router.get("/schedule/upcoming")
async def get_upcoming_interviews(uuid_val: str = Depends(authorize)):
    """Get all upcoming and completed interviews for the user"""
    try:
        # Get all interviews for the user using the correct method name
        all_interviews = await schedule_dao.get_user_schedules(uuid_val)
        
        # Separate into upcoming and past
        now = datetime.now(timezone.utc)
        upcoming = []
        past = []
        
        for interview in all_interviews:
            interview_time = interview.get('interview_datetime')
            if interview_time:
                # Handle both datetime objects and strings
                if isinstance(interview_time, str):
                    # Parse ISO format datetime string
                    interview_time = datetime.fromisoformat(interview_time.replace('Z', '+00:00'))
                
                if interview_time > now:
                    upcoming.append(interview)
                else:
                    past.append(interview)
        
        # Sort by date
        upcoming.sort(key=lambda x: x.get('interview_datetime', now))
        past.sort(key=lambda x: x.get('interview_datetime', now), reverse=True)
        
        return {
            "upcoming_interviews": upcoming,
            "past_interviews": past,
            "total_count": len(all_interviews)
        }
    except Exception as e:
        print(f"[Get Upcoming] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to load interviews: {str(e)}")


@interview_router.get("/schedule/{schedule_id}")
async def get_interview_details(
    schedule_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get details for a specific interview"""
    try:
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        return {"interview": interview}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Get Interview] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to load interview: {str(e)}")


@interview_router.post("/schedule")
async def create_interview_schedule(
    request: Request,
    uuid_val: str = Depends(authorize)
):
    """Create a new interview schedule"""
    try:
        print("[Create Schedule] Step 1: Getting request body...")
        # Get the request body as dict
        schedule_data = await request.json()
        
        print(f"[Create Schedule] Step 2: Received data: {schedule_data}")
        
        # Add user UUID to the schedule data
        schedule_data["user_uuid"] = uuid_val
        print(f"[Create Schedule] Step 3: Added user_uuid: {uuid_val}")
        
        # Parse datetime if it's a string
        if isinstance(schedule_data.get("interview_datetime"), str):
            print("[Create Schedule] Step 4: Parsing datetime...")
            # Parse ISO format datetime string
            dt_str = schedule_data["interview_datetime"]
            schedule_data["interview_datetime"] = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            print(f"[Create Schedule] Parsed datetime: {schedule_data['interview_datetime']}")
        
        # Auto-generate video link if needed and not provided
        if schedule_data.get("location_type") == "video" and not schedule_data.get("video_link"):
            print("[Create Schedule] Step 5: Generating video link...")
            video_data = calendar_service.generate_video_conference_link(
                schedule_data.get("video_platform", "zoom")
            )
            schedule_data["video_link"] = video_data["link"]
            print(f"[Create Schedule] Auto-generated video link: {video_data['link']}")
        
        # Auto-generate preparation tasks if requested
        if schedule_data.get("auto_generate_prep_tasks", False):
            print("[Create Schedule] Step 6: Generating prep tasks...")
            tasks = PreparationTaskGenerator.generate_tasks(
                job_title=schedule_data.get("scenario_name") or schedule_data.get("job_title", "Position"),
                company_name=schedule_data.get("company_name", "Company"),
                location_type=schedule_data.get("location_type", "video"),
                interviewer_name=schedule_data.get("interviewer_name")
            )
            schedule_data["preparation_tasks"] = tasks
            print(f"[Create Schedule] Auto-generated {len(tasks)} preparation tasks")
        
        # Initialize reminder tracking
        schedule_data["reminders_sent"] = {}
        print("[Create Schedule] Step 7: Initialized reminder tracking")
        
        # Create the schedule
        print("[Create Schedule] Step 8: About to call DAO.create_schedule()...")
        schedule_uuid = await schedule_dao.create_schedule(schedule_data)
        
        print(f"[Create Schedule] Step 9: DAO returned UUID: {schedule_uuid}")
        
        # Sync to calendar if requested
        if schedule_data.get("calendar_provider"):
            try:
                print("[Create Schedule] Step 10: Syncing to calendar...")
                # This would be called after calendar is connected
                # For now, just mark as pending sync
                await schedule_dao.update_schedule(schedule_uuid, {
                    "calendar_sync_pending": True
                })
                print(f"[Create Schedule] Marked for calendar sync")
            except Exception as cal_error:
                print(f"[Create Schedule] Calendar sync error: {cal_error}")
                # Don't fail the whole request if calendar sync fails
        
        print("[Create Schedule] Step 11: Returning success response")
        return {
            "detail": "Interview scheduled successfully",
            "schedule_uuid": schedule_uuid
        }
    except Exception as e:
        print(f"[Create Schedule] ERROR at some step: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to create schedule: {str(e)}")


@interview_router.put("/schedule/{schedule_id}")
async def update_interview_schedule(
    schedule_id: str,
    request: Request,
    uuid_val: str = Depends(authorize)
):
    """Update an existing interview schedule"""
    try:
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get update data
        update_data = await request.json()
        
        # Parse datetime if it's a string
        if isinstance(update_data.get("interview_datetime"), str):
            dt_str = update_data["interview_datetime"]
            update_data["interview_datetime"] = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        
        # Update the schedule
        matched = await schedule_dao.update_schedule(schedule_id, update_data)
        
        if matched == 0:
            raise HTTPException(404, "Interview not found")
        
        return {"detail": "Interview updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Update Schedule] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to update schedule: {str(e)}")


@interview_router.delete("/schedule/{schedule_id}")
async def delete_interview_schedule(
    schedule_id: str,
    uuid_val: str = Depends(authorize)
):
    """Delete an interview schedule"""
    try:
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Delete the schedule
        deleted = await schedule_dao.delete_schedule(schedule_id)
        
        if deleted == 0:
            raise HTTPException(404, "Interview not found")
        
        return {"detail": "Interview deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Delete Schedule] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to delete schedule: {str(e)}")


@interview_router.post("/schedule/{schedule_id}/complete")
async def complete_interview(
    schedule_id: str,
    request: Request,
    uuid_val: str = Depends(authorize)
):
    """Mark an interview as completed with outcome"""
    try:
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get outcome data
        outcome_data = await request.json()
        
        # Complete the interview
        matched = await schedule_dao.complete_interview(schedule_id, outcome_data)
        
        if matched == 0:
            raise HTTPException(404, "Interview not found")
        
        return {"detail": "Interview marked as completed"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Complete Interview] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to complete interview: {str(e)}")


@interview_router.post("/schedule/{schedule_id}/cancel")
async def cancel_interview(
    schedule_id: str,
    reason: Optional[str] = None,
    uuid_val: str = Depends(authorize)
):
    """Cancel an interview"""
    try:
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Cancel the interview
        matched = await schedule_dao.cancel_interview(schedule_id, reason)
        
        if matched == 0:
            raise HTTPException(404, "Interview not found")
        
        return {"detail": "Interview cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Cancel Interview] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to cancel interview: {str(e)}")


@interview_router.get("/schedule/{schedule_id}/preparation-tasks")
async def get_preparation_tasks(
    schedule_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get preparation tasks for an interview"""
    try:
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        tasks = interview.get("preparation_tasks", [])
        
        # Calculate completion percentage
        if tasks:
            completed = sum(1 for task in tasks if task.get("is_completed", False))
            percentage = int((completed / len(tasks)) * 100)
        else:
            percentage = 0
        
        return {
            "tasks": tasks,
            "completion_percentage": percentage
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Get Prep Tasks] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to get preparation tasks: {str(e)}")


@interview_router.post("/schedule/{schedule_id}/preparation-tasks/{task_id}/complete")
async def toggle_task_completion(
    schedule_id: str,
    task_id: str,
    uuid_val: str = Depends(authorize)
):
    """Toggle a preparation task completion status"""
    try:
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Find the task
        tasks = interview.get("preparation_tasks", [])
        task = next((t for t in tasks if t.get("task_id") == task_id), None)
        
        if not task:
            raise HTTPException(404, "Task not found")
        
        # Toggle completion
        is_completed = not task.get("is_completed", False)
        
        # Update the task
        await schedule_dao.update_preparation_task(schedule_id, task_id, {
            **task,
            "is_completed": is_completed
        })
        
        # Recalculate completion percentage
        completed_count = sum(1 for t in tasks if t.get("task_id") == task_id or t.get("is_completed", False))
        if task.get("task_id") == task_id and not is_completed:
            completed_count -= 1
        elif task.get("task_id") == task_id and is_completed:
            completed_count += 1
            
        percentage = int((completed_count / len(tasks)) * 100) if tasks else 0
        
        await schedule_dao.update_preparation_completion(schedule_id, percentage)
        
        return {
            "detail": "Task updated",
            "is_completed": is_completed,
            "completion_percentage": percentage
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Toggle Task] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to update task: {str(e)}")


# ============================================================================
# CALENDAR INTEGRATION ENDPOINTS
# ============================================================================

@interview_router.get("/calendar/auth/google")
async def google_calendar_auth(uuid_val: str = Depends(authorize)):
    """Initiate Google Calendar OAuth flow"""
    try:
        auth_url = calendar_service.get_google_auth_url(uuid_val)
        return {"auth_url": auth_url}
    except Exception as e:
        raise HTTPException(500, f"Failed to initiate Google auth: {str(e)}")


@interview_router.get("/calendar/auth/outlook")
async def outlook_calendar_auth(uuid_val: str = Depends(authorize)):
    """Initiate Outlook Calendar OAuth flow"""
    try:
        auth_url = calendar_service.get_outlook_auth_url(uuid_val)
        return {"auth_url": auth_url}
    except Exception as e:
        raise HTTPException(500, f"Failed to initiate Outlook auth: {str(e)}")


@interview_router.get("/calendar/callback")
async def calendar_callback(
    code: str = Query(...),
    state: str = Query(...),
    provider: Optional[str] = Query(None)
):
    """Handle OAuth callback from calendar providers"""
    try:
        if provider == "outlook":
            credentials = {"user_uuid": state, "provider": "outlook", "access_token": "demo"}
        else:
            credentials = await calendar_service.handle_google_callback(code, state)
        
        user_uuid = credentials["user_uuid"]
        calendar_credentials_store[user_uuid] = credentials
        
        frontend_url = "http://localhost:3000"
        return RedirectResponse(
            url=f"{frontend_url}/settings?calendar_connected=true&provider={credentials['provider']}"
        )
    except Exception as e:
        print(f"Calendar callback error: {e}")
        return RedirectResponse(url="http://localhost:3000/settings?calendar_error=true")


@interview_router.post("/calendar/sync/{schedule_id}")
async def sync_interview_to_calendar(
    schedule_id: str,
    uuid_val: str = Depends(authorize)
):
    """Sync a specific interview to user's calendar"""
    try:
        schedule = await schedule_dao.get_schedule(schedule_id)
        
        if not schedule:
            raise HTTPException(404, "Schedule not found")
        
        if schedule["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        if uuid_val not in calendar_credentials_store:
            raise HTTPException(400, "Calendar not connected. Please connect your calendar first.")
        
        credentials = calendar_credentials_store[uuid_val]
        provider = credentials["provider"]
        
        interview_data = {
            "interview_datetime": schedule["interview_datetime"],
            "duration_minutes": schedule.get("duration_minutes", 60),
            "timezone": schedule.get("timezone", "UTC"),
            "job_title": schedule.get("scenario_name", "Interview"),
            "company_name": schedule.get("company_name", "Company"),
            "location_type": schedule.get("location_type"),
            "location_details": schedule.get("location_details"),
            "video_link": schedule.get("video_link"),
            "video_platform": schedule.get("video_platform"),
            "interviewer_name": schedule.get("interviewer_name"),
            "interviewer_email": schedule.get("interviewer_email"),
            "interviewer_title": schedule.get("interviewer_title"),
            "notes": schedule.get("notes")
        }
        
        if provider == "google":
            event_id = await calendar_service.create_google_event(credentials, interview_data)
        else:
            event_id = f"outlook_{schedule_id}"
        
        await schedule_dao.update_schedule(schedule_id, {
            "calendar_event_id": event_id,
            "calendar_synced": True,
            "calendar_provider": provider
        })
        
        return {
            "detail": "Interview synced to calendar successfully",
            "event_id": event_id,
            "provider": provider
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to sync to calendar: {str(e)}")


@interview_router.get("/calendar/status")
async def get_calendar_status(uuid_val: str = Depends(authorize)):
    """Get user's calendar connection status"""
    if uuid_val in calendar_credentials_store:
        credentials = calendar_credentials_store[uuid_val]
        return {
            "connected": True,
            "provider": credentials["provider"],
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        return {"connected": False, "provider": None}


@interview_router.delete("/calendar/disconnect")
async def disconnect_calendar(uuid_val: str = Depends(authorize)):
    """Disconnect user's calendar"""
    if uuid_val in calendar_credentials_store:
        del calendar_credentials_store[uuid_val]
    return {"detail": "Calendar disconnected successfully"}


# ============================================================================
# FOLLOW-UP TEMPLATE ENDPOINTS
# ============================================================================

@interview_router.post("/followup/generate")
async def generate_followup_template(
    request_data: GenerateFollowUpRequest,
    uuid_val: str = Depends(authorize)
):
    """Generate a personalized follow-up template"""
    try:
        interview = await schedule_dao.get_schedule(request_data.interview_uuid)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        interviewer_name = interview.get("interviewer_name", "Hiring Team")
        company_name = interview.get("company_name", "Company")
        job_title = interview.get("scenario_name", "Position")
        interview_date = interview.get("interview_datetime")
        outcome = interview.get("outcome")
        
        days_since = (datetime.now(timezone.utc) - interview_date).days if interview_date else 0
        
        template_data = None
        
        if request_data.template_type == "thank_you":
            template_data = followup_service.generate_thank_you_email(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                interview_date=interview_date,
                specific_topics=request_data.specific_topics or [],
                custom_notes=request_data.custom_notes
            )
        elif request_data.template_type == "status_inquiry":
            template_data = followup_service.generate_status_inquiry(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                interview_date=interview_date,
                days_since_interview=days_since
            )
        elif request_data.template_type == "feedback_request":
            was_selected = outcome == "passed"
            template_data = followup_service.generate_feedback_request(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                was_selected=was_selected
            )
        elif request_data.template_type == "networking":
            template_data = followup_service.generate_networking_followup(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                connection_request=True
            )
        else:
            raise HTTPException(400, f"Invalid template type: {request_data.template_type}")
        
        suggested_send_time = followup_service.get_recommended_timing(
            request_data.template_type,
            interview_date
        )
        
        template_record = {
            "user_uuid": uuid_val,
            "interview_uuid": request_data.interview_uuid,
            "template_type": request_data.template_type,
            "subject_line": template_data["subject"],
            "email_body": template_data["body"],
            "interviewer_name": interviewer_name,
            "company_name": company_name,
            "job_title": job_title,
            "specific_topics_discussed": request_data.specific_topics or [],
            "suggested_send_time": suggested_send_time
        }
        
        template_uuid = await followup_dao.create_template(template_record)
        
        return {
            "template_uuid": template_uuid,
            "subject": template_data["subject"],
            "body": template_data["body"],
            "suggested_send_time": suggested_send_time.isoformat(),
            "interviewer_name": interviewer_name,
            "interviewer_email": interview.get("interviewer_email"),
            "template_type": request_data.template_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate template: {str(e)}")


@interview_router.get("/followup/{template_id}")
async def get_followup_template(
    template_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get a specific follow-up template"""
    template = await followup_dao.get_template(template_id)
    
    if not template:
        raise HTTPException(404, "Template not found")
    
    if template["user_uuid"] != uuid_val:
        raise HTTPException(403, "Unauthorized")
    
    return {"template": template}


@interview_router.get("/followup/interview/{interview_id}/templates")
async def get_templates_by_interview(
    interview_id: str,
    uuid_val: str = Depends(authorize)
):
    """Get all follow-up templates for a specific interview"""
    interview = await schedule_dao.get_schedule(interview_id)
    
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    if interview["user_uuid"] != uuid_val:
        raise HTTPException(403, "Unauthorized")
    
    templates = await followup_dao.get_templates_by_interview(interview_id)
    
    return {"templates": templates, "count": len(templates)}


@interview_router.post("/followup/{template_id}/send")
async def mark_template_sent(
    template_id: str,
    uuid_val: str = Depends(authorize)
):
    """Mark a follow-up template as sent"""
    template = await followup_dao.get_template(template_id)
    
    if not template:
        raise HTTPException(404, "Template not found")
    
    if template["user_uuid"] != uuid_val:
        raise HTTPException(403, "Unauthorized")
    
    await followup_dao.mark_as_sent(template_id)
    
    interview_uuid = template["interview_uuid"]
    interview = await schedule_dao.get_schedule(interview_uuid)
    
    if interview:
        follow_up_actions = interview.get("follow_up_actions", [])
        follow_up_actions.append({
            "action": f"Sent {template['template_type']} email",
            "timestamp": datetime.now(timezone.utc),
            "template_id": template_id
        })
        
        await schedule_dao.update_schedule(interview_uuid, {
            "follow_up_actions": follow_up_actions
        })
        
        if template["template_type"] == "thank_you":
            await schedule_dao.mark_thank_you_sent(interview_uuid)
    
    return {
        "detail": "Template marked as sent",
        "sent_at": datetime.now(timezone.utc).isoformat()
    }


@interview_router.post("/followup/{template_id}/response-received")
async def mark_response_received(
    template_id: str,
    sentiment: Optional[str] = None,
    uuid_val: str = Depends(authorize)
):
    """Track that a response was received to a follow-up"""
    template = await followup_dao.get_template(template_id)
    
    if not template:
        raise HTTPException(404, "Template not found")
    
    if template["user_uuid"] != uuid_val:
        raise HTTPException(403, "Unauthorized")
    
    await followup_dao.mark_response_received(template_id, sentiment)
    
    return {
        "detail": "Response recorded",
        "received_at": datetime.now(timezone.utc).isoformat()
    }


# ============================================================================
# REMINDER SCHEDULER
# ============================================================================

async def check_and_send_reminders():
    """Check for interviews needing reminders and send them"""
    try:
        print(f"[{datetime.now(timezone.utc)}] Checking for reminder candidates...")
        
        # Check for 24-hour reminders
        interviews_24h = await schedule_dao.get_interviews_needing_reminders(24)
        for interview in interviews_24h:
            await send_reminder(interview, 24, "24h")
        
        # Check for 2-hour reminders
        interviews_2h = await schedule_dao.get_interviews_needing_reminders(2)
        for interview in interviews_2h:
            await send_reminder(interview, 2, "2h")
        
        # Check for 1-hour reminders
        interviews_1h = await schedule_dao.get_interviews_needing_reminders(1)
        for interview in interviews_1h:
            await send_reminder(interview, 1, "1h")
        
        total = len(interviews_24h) + len(interviews_2h) + len(interviews_1h)
        print(f"Reminder check complete. Sent {total} reminders")
    except Exception as e:
        print(f"Error in reminder check: {e}")


async def send_reminder(interview: dict, hours_until: int, reminder_type: str):
    """Send a reminder for a specific interview"""
    try:
        interview_data = {
            'schedule_uuid': interview['uuid'],
            'interview_datetime': interview['interview_datetime'],
            'job_title': interview.get('scenario_name', 'Interview'),
            'company_name': interview.get('company_name', 'Company'),
            'timezone': interview.get('timezone', 'UTC'),
            'location_type': interview.get('location_type', 'Interview'),
            'location_details': interview.get('location_details'),
            'video_link': interview.get('video_link'),
            'video_platform': interview.get('video_platform'),
            'phone_number': interview.get('phone_number'),
            'interviewer_name': interview.get('interviewer_name'),
            'interviewer_title': interview.get('interviewer_title'),
            'preparation_completion_percentage': interview.get('preparation_completion_percentage', 0),
            'notes': interview.get('notes')
        }
        
        reminder_prefs = interview.get('reminder_preferences', {'email': True})
        
        if reminder_prefs.get('email'):
            user_email = "user@example.com"  # TODO: Fetch from user profile
            
            email_sent = calendar_service.send_email_reminder(
                recipient_email=user_email,
                interview_data=interview_data,
                hours_until=hours_until
            )
            
            if email_sent:
                print(f"Sent {hours_until}h email reminder for interview {interview['uuid']}")
        
        await schedule_dao.mark_reminder_sent(interview['uuid'], reminder_type)
    except Exception as e:
        print(f"Error sending reminder for interview {interview['uuid']}: {e}")


def start_reminder_scheduler():
    """Start the reminder scheduler"""
    reminder_scheduler.add_job(
        check_and_send_reminders,
        trigger=IntervalTrigger(minutes=30),
        id='interview_reminders',
        name='Check and send interview reminders',
        replace_existing=True
    )
    reminder_scheduler.start()
    print("✓ Reminder scheduler started - checking every 30 minutes")


def stop_reminder_scheduler():
    """Stop the reminder scheduler"""
    reminder_scheduler.shutdown()
    print("✓ Reminder scheduler stopped")