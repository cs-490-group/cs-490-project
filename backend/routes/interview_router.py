"""
Fixed Interview Router - Datetime Comparison Fix
Handles both timezone-aware and timezone-naive datetime objects properly
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
from mongo.jobs_dao import JobsDAO
from mongo.profiles_dao import UserDataDAO
from services.calendar_service import calendar_service, PreparationTaskGenerator
from services.followup_service import followup_service
from mongo.dao_setup import db_client
from sessions.session_authorizer import authorize

# Initialize router
interview_router = APIRouter(prefix="/interview", tags=["interview"])

# Initialize DAOs
schedule_dao = InterviewScheduleDAO(db_client)
followup_dao = FollowUpTemplateDAO(db_client)
jobs_dao = JobsDAO()
profile_dao = UserDataDAO()

# In-memory storage for calendar credentials
calendar_credentials_store = {}

# Background scheduler for reminders
reminder_scheduler = AsyncIOScheduler()

def get_uuid_from_headers(request: Request) -> str:
    """Extract UUID from request headers"""
    uuid = request.headers.get("uuid")
    if not uuid:
        raise HTTPException(401, "Authentication required")
    return uuid


def make_aware(dt):
    """
    Convert a datetime to timezone-aware (UTC) if it's naive.
    If already aware, return as-is.
    """
    if dt is None:
        return None
    
    # If it's already aware, return it
    if dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None:
        return dt
    
    # If it's naive, assume it's UTC and make it aware
    return dt.replace(tzinfo=timezone.utc)

# ============================================================================
# FOLLOW-UP TEMPLATE ENDPOINTS WITH EMAIL SENDING
# ============================================================================

@interview_router.post("/followup/generate")
async def generate_followup_template(
    request_data: GenerateFollowUpRequest,
    request: Request
):
    """Generate a personalized follow-up template"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        # Fetch the interview
        interview = await schedule_dao.get_schedule(request_data.interview_uuid)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Fetch user profile for personalization
        user_full_name = None
        user_email = None
        try:
            profile = await profile_dao.get_profile(uuid_val)
            if profile:
                user_full_name = profile.get("full_name")
                user_email = profile.get("email")
        except Exception as e:
            print(f"Could not fetch profile for user {uuid_val}: {e}")
        
        # Extract interview details
        interviewer_name = interview.get("interviewer_name", "Hiring Team")
        interviewer_email = interview.get("interviewer_email")
        company_name = interview.get("company_name", "Company")
        job_title = interview.get("scenario_name", "Position")
        interview_date = make_aware(interview.get("interview_datetime"))
        outcome = interview.get("outcome")
        
        days_since = (datetime.now(timezone.utc) - interview_date).days if interview_date else 0
        
        # Generate the appropriate template with user's name
        template_data = None
        
        if request_data.template_type == "thank_you":
            template_data = followup_service.generate_thank_you_email(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                interview_date=interview_date,
                user_full_name=user_full_name,
                specific_topics=request_data.specific_topics or [],
                custom_notes=request_data.custom_notes
            )
        elif request_data.template_type == "status_inquiry":
            template_data = followup_service.generate_status_inquiry(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                interview_date=interview_date,
                days_since_interview=days_since,
                user_full_name=user_full_name
            )
        elif request_data.template_type == "feedback_request":
            was_selected = outcome == "passed"
            template_data = followup_service.generate_feedback_request(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                was_selected=was_selected,
                user_full_name=user_full_name
            )
        elif request_data.template_type == "networking":
            template_data = followup_service.generate_networking_followup(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                user_full_name=user_full_name,
                connection_request=True
            )
        else:
            raise HTTPException(400, f"Invalid template type: {request_data.template_type}")
        
        # Get recommended send time
        suggested_send_time = followup_service.get_recommended_timing(
            request_data.template_type,
            interview_date
        )
        
        # Create template record for tracking
        template_record = {
            "user_uuid": uuid_val,
            "interview_uuid": request_data.interview_uuid,
            "template_type": request_data.template_type,
            "subject_line": template_data["subject"],
            "email_body": template_data["body"],
            "interviewer_name": interviewer_name,
            "interviewer_email": interviewer_email,
            "company_name": company_name,
            "job_title": job_title,
            "specific_topics_discussed": request_data.specific_topics or [],
            "suggested_send_time": suggested_send_time,
            "user_email": user_email
        }
        
        template_uuid = await followup_dao.create_template(template_record)
        
        return {
            "template_uuid": template_uuid,
            "subject": template_data["subject"],
            "body": template_data["body"],
            "suggested_send_time": suggested_send_time.isoformat(),
            "interviewer_name": interviewer_name,
            "interviewer_email": interviewer_email,
            "user_email": user_email,
            "template_type": request_data.template_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate template: {str(e)}")


@interview_router.post("/followup/{template_id}/send")
async def mark_template_sent(template_id: str, request: Request):
    """Send the follow-up email and mark template as sent"""
    try:
        uuid_val = get_uuid_from_headers(request)
        template = await followup_dao.get_template(template_id)
        
        if not template:
            raise HTTPException(404, "Template not found")
        
        if template["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get the request body with recipient email AND edited content
        body = await request.json()
        recipient_email = body.get("recipient_email")
        edited_subject = body.get("subject")  # Get edited subject
        edited_body = body.get("body")        # Get edited body
        
        if not recipient_email:
            raise HTTPException(400, "Recipient email is required")
        
        # Use edited content if provided, otherwise fall back to template
        final_subject = edited_subject if edited_subject else template["subject_line"]
        final_body = edited_body if edited_body else template["email_body"]
        
        # Get user name for "From" field
        user_name = "User"
        user_email = template.get("user_email")
        try:
            profile = await profile_dao.get_profile(uuid_val)
            if profile and profile.get("full_name"):
                user_name = profile.get("full_name")
                user_email = profile.get("email")
        except Exception as e:
            print(f"Could not fetch profile: {e}")
        
        # Send the actual email using the follow-up service with edited content
        try:
            email_result = followup_service.send_followup_email(
                recipient_email=recipient_email,
                sender_name=user_name,
                subject=final_subject,      # Use edited subject
                body=final_body,            # Use edited body
                template_type=template["template_type"]
            )
            print(f"✅ Follow-up email sent to {recipient_email}")
        except ValueError as e:
            raise HTTPException(500, f"Email configuration error: {str(e)}")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            raise HTTPException(500, f"Failed to send email: {str(e)}")
        
        # Mark as sent in database (save the edited version)
        await followup_dao.mark_as_sent(template_id)
        
        # Update interview record
        interview_uuid = template["interview_uuid"]
        interview = await schedule_dao.get_schedule(interview_uuid)
        
        if interview:
            follow_up_actions = interview.get("follow_up_actions", [])
            follow_up_actions.append({
                "action": f"Sent {template['template_type']} email to {recipient_email}",
                "timestamp": datetime.now(timezone.utc),
                "template_id": template_id
            })
            
            await schedule_dao.update_schedule(interview_uuid, {
                "follow_up_actions": follow_up_actions
            })
            
            if template["template_type"] == "thank_you":
                await schedule_dao.mark_thank_you_sent(interview_uuid)
        
        return {
            "detail": "Email sent successfully",
            "sent_to": email_result["sent_to"],
            "sent_from": user_email or email_result["sent_from"],
            "sent_at": email_result["sent_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to send follow-up: {str(e)}")

@interview_router.get("/followup/{template_id}")
async def get_followup_template(template_id: str, request: Request):
    """Get a specific follow-up template"""
    try:
        uuid_val = get_uuid_from_headers(request)
        template = await followup_dao.get_template(template_id)
        
        if not template:
            raise HTTPException(404, "Template not found")
        
        if template["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        return {"template": template}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get template: {str(e)}")


@interview_router.get("/followup/interview/{interview_id}/templates")
async def get_templates_by_interview(interview_id: str, request: Request):
    """Get all follow-up templates for a specific interview"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(interview_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        templates = await followup_dao.get_templates_by_interview(interview_id)
        
        return {"templates": templates, "count": len(templates)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get templates: {str(e)}")


@interview_router.post("/followup/{template_id}/response-received")
async def mark_response_received(
    template_id: str,
    request: Request,
    sentiment: Optional[str] = None
):
    """Track that a response was received to a follow-up"""
    try:
        uuid_val = get_uuid_from_headers(request)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to mark response: {str(e)}")

# ============================================================================
# INTERVIEW SCHEDULE ENDPOINTS
# ============================================================================

@interview_router.get("/schedule/upcoming")
async def get_upcoming_interviews(request: Request):
    """Get all upcoming and completed interviews for the user"""
    try:
        uuid_val = get_uuid_from_headers(request)
       #print(f"\n[Get Upcoming] Called for uuid: {uuid_val}")
        
        # Get all interviews for the user
        all_interviews = await schedule_dao.get_user_schedules(uuid_val)
        #print(f"[Get Upcoming] Found {len(all_interviews)} total interviews")
        
        # Separate into upcoming and past
        now = datetime.now(timezone.utc)
        upcoming = []
        past = []
        
        for interview in all_interviews:
            # Add uuid field for frontend compatibility
            interview['uuid'] = interview.get('_id')
            
            interview_time = interview.get('interview_datetime')
            if interview_time:
                # Handle both datetime objects and strings
                if isinstance(interview_time, str):
                    interview_time = datetime.fromisoformat(interview_time.replace('Z', '+00:00'))
                
                # Make sure both datetimes are timezone-aware for comparison
                interview_time = make_aware(interview_time)
                now_aware = make_aware(now)
                
                # Compare timezone-aware datetimes
                if interview_time > now_aware:
                    upcoming.append(interview)
                else:
                    past.append(interview)
        
        # Sort by date
        upcoming.sort(key=lambda x: make_aware(
            datetime.fromisoformat(x.get('interview_datetime').replace('Z', '+00:00')) 
            if isinstance(x.get('interview_datetime'), str) 
            else x.get('interview_datetime')
        ))
        past.sort(key=lambda x: make_aware(
            datetime.fromisoformat(x.get('interview_datetime').replace('Z', '+00:00')) 
            if isinstance(x.get('interview_datetime'), str) 
            else x.get('interview_datetime')
        ), reverse=True)
        
        #print(f"[Get Upcoming] Returning {len(upcoming)} upcoming, {len(past)} past")
        
        return {
            "upcoming_interviews": upcoming,
            "past_interviews": past,
            "total_count": len(all_interviews)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Get Upcoming] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to load interviews: {str(e)}")

@interview_router.get("/schedule/{schedule_id}")
async def get_interview_details(schedule_id: str, request: Request):
    """Get details for a specific interview"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        # Verify ownership
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Add uuid field for frontend compatibility
        interview['uuid'] = interview.get('_id')
        
        return {"interview": interview}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Get Interview] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to load interview: {str(e)}")


@interview_router.post("/schedule")
async def create_interview_schedule(request: Request):
    """Create a new interview schedule"""
    try:
        uuid_val = get_uuid_from_headers(request)
        #print(f"\n[Create Schedule] Called for uuid: {uuid_val}")
        
        schedule_data = await request.json()
        #print(f"[Create Schedule] Received data: {list(schedule_data.keys())}")
        
        schedule_data["uuid"] = uuid_val
        
        # Parse datetime
        if isinstance(schedule_data.get("interview_datetime"), str):
            dt_str = schedule_data["interview_datetime"]
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            schedule_data["interview_datetime"] = make_aware(dt)
        elif schedule_data.get("interview_datetime"):
            schedule_data["interview_datetime"] = make_aware(schedule_data["interview_datetime"])
        
        # ALWAYS auto-generate video link if needed (not provided AND location type is video)
        if schedule_data.get("location_type") == "video" and not schedule_data.get("video_link"):
            video_data = calendar_service.generate_video_conference_link(
                schedule_data.get("video_platform", "zoom")
            )
            schedule_data["video_link"] = video_data["link"]
            #print(f"[Create Schedule] Auto-generated video link: {video_data['link']}")
        
        job_details = None
        industry = None
        job_description = None
        company_info = None

        if schedule_data.get("job_application_uuid"):
            try:
                job_details = await jobs_dao.get_job_by_id(schedule_data["job_application_uuid"])
                if job_details:
                    industry = job_details.get("industry")
                    job_description = job_details.get("description")
                    
                    # Extract company info
                    company = job_details.get("company")
                    if isinstance(company, dict):
                        company_info = {
                            "name": company.get("name"),
                            "website": company.get("website"),
                            "size": company.get("size")
                        }
                    
                    # Use job details if not manually provided
                    if not schedule_data.get("scenario_name"):
                        schedule_data["scenario_name"] = job_details.get("title", "Position")
                    if not schedule_data.get("company_name"):
                        if isinstance(company, dict):
                            schedule_data["company_name"] = company.get("name", "Company")
                        else:
                            schedule_data["company_name"] = company or "Company"
                    
                    #print(f"[Create Schedule] Loaded job details - Industry: {industry}")
            except Exception as e:
                print(f"[Create Schedule] Could not load job details: {e}")

        # ALWAYS auto-generate preparation tasks with enhanced context
        tasks = PreparationTaskGenerator.generate_tasks(
            job_title=schedule_data.get("scenario_name") or schedule_data.get("job_title", "Position"),
            company_name=schedule_data.get("company_name", "Company"),
            location_type=schedule_data.get("location_type", "video"),
            interviewer_name=schedule_data.get("interviewer_name", None),
            interviewer_title=schedule_data.get("interviewer_title", None),
            industry=industry,
            job_description=job_description,
            company_info=company_info
        )
        schedule_data["preparation_tasks"] = tasks
        #print(f"[Create Schedule] Generated {len(tasks)} preparation tasks (Industry: {industry or 'Generic'})")

        # Store industry in schedule for future reference
        if industry:
            schedule_data["industry"] = industry
        
        # Initialize reminder tracking
        schedule_data["reminders_sent"] = {}
        
        # Create the schedule
        schedule_id = await schedule_dao.create_schedule(schedule_data)
        #print(f"[Create Schedule] Created with ID: {schedule_id}")
        
        # Sync to calendar if requested
        if schedule_data.get("calendar_provider"):
            try:
                await schedule_dao.update_schedule(schedule_id, {
                    "calendar_sync_pending": True
                })
            except Exception as cal_error:
                print(f"[Create Schedule] Calendar sync error: {cal_error}")
        
        return {
            "detail": "Interview scheduled successfully",
            "schedule_uuid": schedule_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Create Schedule] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to create schedule: {str(e)}")

@interview_router.put("/schedule/{schedule_id}")
async def update_interview_schedule(schedule_id: str, request: Request):
    """Update an existing interview schedule"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get update data
        update_data = await request.json()
        
        # Parse datetime if it's a string and make it timezone-aware
        if isinstance(update_data.get("interview_datetime"), str):
            dt_str = update_data["interview_datetime"]
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            update_data["interview_datetime"] = make_aware(dt)
        elif update_data.get("interview_datetime"):
            update_data["interview_datetime"] = make_aware(update_data["interview_datetime"])
        
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
async def delete_interview_schedule(schedule_id: str, request: Request):
    """Delete an interview schedule"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
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
async def complete_interview(schedule_id: str, request: Request):
    """Mark an interview as completed with outcome"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
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
    request: Request,
    reason: Optional[str] = None
):
    """Cancel an interview"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        # Verify ownership
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
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

@interview_router.post("/schedule/{schedule_id}/preparation-tasks/{task_id}/update")
async def update_preparation_task(schedule_id: str, task_id: str, request: Request):
    """Update a specific preparation task"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get update data
        update_data = await request.json()
        
        # Update the task
        matched = await schedule_dao.update_preparation_task(schedule_id, task_id, update_data)
        
        if matched == 0:
            raise HTTPException(404, "Task not found")
        
        return {"detail": "Task updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Update Task] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to update task: {str(e)}")


@interview_router.delete("/schedule/{schedule_id}/preparation-tasks/{task_id}")
async def delete_preparation_task(schedule_id: str, task_id: str, request: Request):
    """Delete a specific preparation task"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get current tasks
        tasks = interview.get("preparation_tasks", [])
        
        # Filter out the task to delete
        updated_tasks = [t for t in tasks if t.get("task_id") != task_id]
        
        if len(updated_tasks) == len(tasks):
            raise HTTPException(404, "Task not found")
        
        # Update the schedule with filtered tasks
        matched = await schedule_dao.update_schedule(schedule_id, {
            "preparation_tasks": updated_tasks
        })
        
        # Recalculate completion percentage
        if updated_tasks:
            completed = sum(1 for t in updated_tasks if t.get("is_completed", False))
            percentage = int((completed / len(updated_tasks)) * 100)
            await schedule_dao.update_preparation_completion(schedule_id, percentage)
        else:
            await schedule_dao.update_preparation_completion(schedule_id, 0)
        
        return {"detail": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Delete Task] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to delete task: {str(e)}")

@interview_router.get("/schedule/{schedule_id}/preparation-tasks")
async def get_preparation_tasks(schedule_id: str, request: Request):
    """Get preparation tasks for an interview"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
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
async def toggle_task_completion(schedule_id: str, task_id: str, request: Request):
    """Toggle a preparation task completion status"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
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
        completed_count = sum(1 for t in tasks if 
                            (t.get("task_id") == task_id and is_completed) or 
                            (t.get("task_id") != task_id and t.get("is_completed", False)))
            
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

@interview_router.post("/schedule/{schedule_id}/preparation-tasks/add")
async def add_preparation_task(schedule_id: str, request: Request):
    """Add a custom preparation task to an interview"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get task data
        task_data = await request.json()
        
        # Generate task ID
        import uuid
        task = {
            "task_id": str(uuid.uuid4()),
            "title": task_data.get("title"),
            "description": task_data.get("description", ""),
            "category": task_data.get("category", "practice"),
            "priority": task_data.get("priority", "medium"),
            "is_completed": False
        }
        
        # Add the task
        matched = await schedule_dao.add_preparation_task(schedule_id, task)
        
        if matched == 0:
            raise HTTPException(404, "Interview not found")
        
        return {
            "detail": "Task added successfully",
            "task": task
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Add Task] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to add task: {str(e)}")


@interview_router.post("/schedule/{schedule_id}/preparation-tasks/generate")
async def generate_preparation_tasks(schedule_id: str, request: Request):
    """Generate or regenerate preparation tasks for an interview"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(schedule_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Generate new tasks
        tasks = PreparationTaskGenerator.generate_tasks(
            job_title=interview.get("scenario_name") or interview.get("job_title", "Position"),
            company_name=interview.get("company_name", "Company"),
            location_type=interview.get("location_type", "video"),
            interviewer_name=interview.get("interviewer_name", None),
            interviewer_title=interview.get("interviewer_title", None)
        )
        
        # Replace existing tasks
        matched = await schedule_dao.update_schedule(schedule_id, {
            "preparation_tasks": tasks,
            "preparation_completion_percentage": 0
        })
        
        if matched == 0:
            raise HTTPException(404, "Interview not found")
        
        return {
            "detail": "Tasks generated successfully",
            "tasks": tasks,
            "count": len(tasks)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Generate Tasks] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to generate tasks: {str(e)}")
# ============================================================================
# CALENDAR INTEGRATION ENDPOINTS
# ============================================================================

@interview_router.get("/calendar/auth/google")
async def google_calendar_auth(request: Request):
    """Initiate Google Calendar OAuth flow"""
    try:
        uuid_val = get_uuid_from_headers(request)
        auth_url = calendar_service.get_google_auth_url(uuid_val)
        return {"auth_url": auth_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to initiate Google auth: {str(e)}")


@interview_router.get("/calendar/auth/outlook")
async def outlook_calendar_auth(request: Request):
    """Initiate Outlook Calendar OAuth flow"""
    try:
        uuid_val = get_uuid_from_headers(request)
        auth_url = calendar_service.get_outlook_auth_url(uuid_val)
        return {"auth_url": auth_url}
    except HTTPException:
        raise
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
async def sync_interview_to_calendar(schedule_id: str, request: Request):
    """Sync a specific interview to user's calendar"""
    try:
        uuid_val = get_uuid_from_headers(request)
        schedule = await schedule_dao.get_schedule(schedule_id)
        
        if not schedule:
            raise HTTPException(404, "Schedule not found")
        
        if schedule.get("uuid") != uuid_val:
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
async def get_calendar_status(request: Request):
    """Get user's calendar connection status"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        if uuid_val in calendar_credentials_store:
            credentials = calendar_credentials_store[uuid_val]
            return {
                "connected": True,
                "provider": credentials["provider"],
                "connected_at": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {"connected": False, "provider": None}
    except HTTPException:
        raise
    except Exception as e:
        return {"connected": False, "provider": None}


@interview_router.delete("/calendar/disconnect")
async def disconnect_calendar(request: Request):
    """Disconnect user's calendar"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        if uuid_val in calendar_credentials_store:
            del calendar_credentials_store[uuid_val]
        
        return {"detail": "Calendar disconnected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to disconnect calendar: {str(e)}")


# ============================================================================
# FOLLOW-UP TEMPLATE ENDPOINTS
# ============================================================================

@interview_router.post("/followup/generate")
async def generate_followup_template(
    request_data: GenerateFollowUpRequest,
    request: Request
):
    """Generate a personalized follow-up template"""
    try:
        uuid_val = get_uuid_from_headers(request)
        
        # Fetch the interview
        interview = await schedule_dao.get_schedule(request_data.interview_uuid)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Fetch user profile for personalization
        user_full_name = None
        try:
            profile = await profile_dao.get_profile(uuid_val)
            if profile and profile.get("full_name"):
                user_full_name = profile.get("full_name")
        except Exception as e:
            # Profile is optional, continue without it
            print(f"Could not fetch profile for user {uuid_val}: {e}")
        
        # Extract interview details
        interviewer_name = interview.get("interviewer_name", "Hiring Team")
        company_name = interview.get("company_name", "Company")
        job_title = interview.get("scenario_name", "Position")
        interview_date = make_aware(interview.get("interview_datetime"))
        outcome = interview.get("outcome")
        
        days_since = (datetime.now(timezone.utc) - interview_date).days if interview_date else 0
        
        # Generate the appropriate template with user's name
        template_data = None
        
        if request_data.template_type == "thank_you":
            template_data = followup_service.generate_thank_you_email(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                interview_date=interview_date,
                user_full_name=user_full_name,
                specific_topics=request_data.specific_topics or [],
                custom_notes=request_data.custom_notes
            )
        elif request_data.template_type == "status_inquiry":
            template_data = followup_service.generate_status_inquiry(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                interview_date=interview_date,
                days_since_interview=days_since,
                user_full_name=user_full_name
            )
        elif request_data.template_type == "feedback_request":
            was_selected = outcome == "passed"
            template_data = followup_service.generate_feedback_request(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                was_selected=was_selected,
                user_full_name=user_full_name
            )
        elif request_data.template_type == "networking":
            template_data = followup_service.generate_networking_followup(
                interviewer_name=interviewer_name,
                company_name=company_name,
                job_title=job_title,
                user_full_name=user_full_name,
                connection_request=True
            )
        else:
            raise HTTPException(400, f"Invalid template type: {request_data.template_type}")
        
        # Get recommended send time
        suggested_send_time = followup_service.get_recommended_timing(
            request_data.template_type,
            interview_date
        )
        
        # Create template record for tracking
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
async def get_followup_template(template_id: str, request: Request):
    """Get a specific follow-up template"""
    try:
        uuid_val = get_uuid_from_headers(request)
        template = await followup_dao.get_template(template_id)
        
        if not template:
            raise HTTPException(404, "Template not found")
        
        if template["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        return {"template": template}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get template: {str(e)}")


@interview_router.get("/followup/interview/{interview_id}/templates")
async def get_templates_by_interview(interview_id: str, request: Request):
    """Get all follow-up templates for a specific interview"""
    try:
        uuid_val = get_uuid_from_headers(request)
        interview = await schedule_dao.get_schedule(interview_id)
        
        if not interview:
            raise HTTPException(404, "Interview not found")
        
        if interview.get("uuid") != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        templates = await followup_dao.get_templates_by_interview(interview_id)
        
        return {"templates": templates, "count": len(templates)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get templates: {str(e)}")


@interview_router.post("/followup/{template_id}/send")
async def mark_template_sent(template_id: str, request: Request):
    """Send the follow-up email and mark template as sent"""
    try:
        uuid_val = get_uuid_from_headers(request)
        template = await followup_dao.get_template(template_id)
        
        if not template:
            raise HTTPException(404, "Template not found")
        
        if template["user_uuid"] != uuid_val:
            raise HTTPException(403, "Unauthorized")
        
        # Get the request body with recipient email AND edited content
        body = await request.json()
        recipient_email = body.get("recipient_email")
        edited_subject = body.get("subject")  # Get edited subject
        edited_body = body.get("body")        # Get edited body
        
        if not recipient_email:
            raise HTTPException(400, "Recipient email is required")
        
        # Use edited content if provided, otherwise fall back to template
        final_subject = edited_subject if edited_subject else template["subject_line"]
        final_body = edited_body if edited_body else template["email_body"]
        
        # Get user name for "From" field
        user_name = "User"
        user_email = template.get("user_email")
        try:
            profile = await profile_dao.get_profile(uuid_val)
            if profile and profile.get("full_name"):
                user_name = profile.get("full_name")
                user_email = profile.get("email")
        except Exception as e:
            print(f"Could not fetch profile: {e}")
        
        # Send the actual email using the follow-up service with edited content
        try:
            email_result = followup_service.send_followup_email(
                recipient_email=recipient_email,
                sender_name=user_name,
                subject=final_subject,      # Use edited subject
                body=final_body,            # Use edited body
                template_type=template["template_type"]
            )
            print(f"✅ Follow-up email sent to {recipient_email}")
        except ValueError as e:
            raise HTTPException(500, f"Email configuration error: {str(e)}")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            raise HTTPException(500, f"Failed to send email: {str(e)}")
        
        # Mark as sent in database
        await followup_dao.mark_as_sent(template_id)
        
        # Update interview record
        interview_uuid = template["interview_uuid"]
        interview = await schedule_dao.get_schedule(interview_uuid)
        
        if interview:
            follow_up_actions = interview.get("follow_up_actions", [])
            follow_up_actions.append({
                "action": f"Sent {template['template_type']} email to {recipient_email}",
                "timestamp": datetime.now(timezone.utc),
                "template_id": template_id
            })
            
            await schedule_dao.update_schedule(interview_uuid, {
                "follow_up_actions": follow_up_actions
            })
            
            if template["template_type"] == "thank_you":
                await schedule_dao.mark_thank_you_sent(interview_uuid)
        
        return {
            "detail": "Email sent successfully",
            "sent_to": email_result["sent_to"],
            "sent_from": user_email or email_result["sent_from"],
            "sent_at": email_result["sent_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to send follow-up: {str(e)}")


@interview_router.post("/followup/{template_id}/response-received")
async def mark_response_received(
    template_id: str,
    request: Request,
    sentiment: Optional[str] = None
):
    """Track that a response was received to a follow-up"""
    try:
        uuid_val = get_uuid_from_headers(request)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to mark response: {str(e)}")
    
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