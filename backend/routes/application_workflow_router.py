# backend/routes/application_workflow_router.py

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import Optional

# DAOs
from mongo.application_workflow_dao import application_workflow_dao
from mongo.application_analytics_dao import application_analytics_dao
from mongo.jobs_dao import jobs_dao  # Needed for bulk apply

# AUTH
from sessions.session_authorizer import authorize

# SCHEMAS
from schema.ApplicationWorkflow import (
    ApplicationPackage, ApplicationPackageUpdate,
    ApplicationSchedule, ScheduleUpdate,
    ResponseTemplate, TemplateUpdate,
    AutomationRule, AutomationRuleUpdate,
    BulkPackageCreate, BulkScheduleCreate, BulkScheduleCancel,
    ApplicationChecklist, ChecklistUpdate,
    StatusUpdate, DateRange, ApplicationGoal, GoalUpdate,
    FollowUpReminder, ReminderUpdate
)

from services.scheduling_service import scheduling_service
from datetime import datetime, timezone

workflow_router = APIRouter(prefix="/application-workflow", tags=["workflow"])

# ================================================================
# APPLICATION PACKAGES (UC-069)
# ================================================================

@workflow_router.post("/packages")
async def create_application_package(
    package: ApplicationPackage,
    uuid: str = Depends(authorize)
):
    try:
        data = package.model_dump()
        data["uuid"] = uuid
        package_id = await application_workflow_dao.create_application_package(data)
        return await application_workflow_dao.get_application_package(package_id)
    except Exception as e:
        raise HTTPException(500, f"Failed to create package: {str(e)}")


@workflow_router.get("/packages")
async def get_application_packages(uuid: str = Depends(authorize)):
    try:
        return await application_workflow_dao.get_user_packages(uuid)
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch packages: {str(e)}")


@workflow_router.get("/packages/{package_id}")
async def get_application_package(
    package_id: str,
    uuid: str = Depends(authorize)
):
    pkg = await application_workflow_dao.get_application_package(package_id)
    if not pkg:
        raise HTTPException(404, "Package not found")
    if pkg.get("uuid") != uuid:
        raise HTTPException(403, "Not authorized")
    return pkg


@workflow_router.put("/packages/{package_id}")
async def update_application_package(
    package_id: str,
    package: ApplicationPackageUpdate,
    uuid: str = Depends(authorize)
):
    existing = await application_workflow_dao.get_application_package(package_id)
    if not existing:
        raise HTTPException(404, "Package not found")
    if existing.get("uuid") != uuid:
        raise HTTPException(403, "Not authorized")

    data = package.model_dump(exclude_unset=True)
    updated = await application_workflow_dao.update_package(package_id, data)
    if updated == 0:
        raise HTTPException(400, "Update failed")

    return {"detail": "Package updated"}


@workflow_router.delete("/packages/{package_id}")
async def delete_application_package(
    package_id: str,
    uuid: str = Depends(authorize)
):
    existing = await application_workflow_dao.get_application_package(package_id)
    if not existing:
        raise HTTPException(404, "Package not found")
    if existing.get("uuid") != uuid:
        raise HTTPException(403, "Not authorized")

    deleted = await application_workflow_dao.delete_package(package_id)
    if deleted == 0:
        raise HTTPException(400, "Delete failed")

    return {"detail": "Package deleted"}




@workflow_router.post("/packages/{package_id}/use")
async def mark_package_used(
    package_id: str,
    uuid: str = Depends(authorize)
):
    existing = await application_workflow_dao.get_application_package(package_id)
    if not existing:
        raise HTTPException(404, "Package not found")
    if existing.get("uuid") != uuid:
        raise HTTPException(403, "Not authorized")

    await application_workflow_dao.mark_package_used(package_id, uuid)
    return {"detail": "Package marked as used"}



# ================================================================
# ⭐ BULK APPLY
# ================================================================

@workflow_router.post("/bulk-apply")
async def bulk_apply(payload: dict, uuid: str = Depends(authorize)):
    """
    Apply a package to many jobs at once.
    Updates each job with:
      - application_package_id
      - submitted = True
      - submitted_at = now
      - status = "SUBMITTED"
    """
    job_ids = payload.get("job_ids")
    package_id = payload.get("package_id")

    if not job_ids or not package_id:
        raise HTTPException(400, "job_ids and package_id are required")

    updated_count = await jobs_dao.bulk_apply(
        user_uuid=uuid,
        package_id=package_id,
        job_ids=job_ids
    )

    await application_workflow_dao.increment_package_usage(package_id)

    return {"success": True, "updated_jobs": updated_count}


# ================================================================
# APPLICATION SCHEDULING
# ================================================================

@workflow_router.post("/schedules")
async def schedule_application(
    schedule: ApplicationSchedule,
    uuid: str = Depends(authorize)
):
    data = schedule.model_dump()
    data["uuid"] = uuid
    schedule_id = await application_workflow_dao.schedule_application(data)
    return {"detail": "Scheduled", "schedule_id": schedule_id}


@workflow_router.get("/schedules")
async def get_scheduled_applications(uuid: str = Depends(authorize)):
    return await application_workflow_dao.get_scheduled_applications(uuid)


@workflow_router.put("/schedules/{schedule_id}")
async def update_schedule(
    schedule_id: str,
    schedule: ScheduleUpdate,
    uuid: str = Depends(authorize)
):
    data = schedule.model_dump(exclude_unset=True)
    updated = await application_workflow_dao.update_schedule_status(
        schedule_id,
        data.get("status", "scheduled"),
        data.get("notes")
    )
    if updated == 0:
        raise HTTPException(400, "Schedule not found")
    return {"detail": "Schedule updated"}


@workflow_router.post("/schedules/{schedule_id}/cancel")
async def cancel_scheduled_application(
    schedule_id: str,
    reason: Optional[str] = None,
    uuid: str = Depends(authorize)
):
    updated = await application_workflow_dao.cancel_scheduled_application(schedule_id, reason)
    if updated == 0:
        raise HTTPException(400, "Schedule not found")
    return {"detail": "Schedule cancelled"}


# ================================================================
# RESPONSE TEMPLATES
# ================================================================

@workflow_router.post("/templates")
async def create_response_template(
    template: ResponseTemplate,
    uuid: str = Depends(authorize)
):
    data = template.model_dump()
    data["uuid"] = uuid
    template_id = await application_workflow_dao.create_template(data)
    return {"detail": "Template created", "template_id": template_id}


@workflow_router.get("/templates")
async def get_response_templates(
    category: Optional[str] = Query(None),
    uuid: str = Depends(authorize)
):
    return await application_workflow_dao.get_user_templates(uuid, category)


@workflow_router.put("/templates/{template_id}")
async def update_response_template(
    template_id: str,
    template: TemplateUpdate,
    uuid: str = Depends(authorize)
):
    data = template.model_dump(exclude_unset=True)
    updated = await application_workflow_dao.update_template(template_id, data)
    if updated == 0:
        raise HTTPException(400, "Template not found")
    return {"detail": "Template updated"}


@workflow_router.delete("/templates/{template_id}")
async def delete_response_template(
    template_id: str,
    uuid: str = Depends(authorize)
):
    deleted = await application_workflow_dao.delete_template(template_id)
    if deleted == 0:
        raise HTTPException(400, "Template not found")
    return {"detail": "Template deleted"}


@workflow_router.post("/templates/{template_id}/use")
async def use_template(
    template_id: str,
    uuid: str = Depends(authorize)
):
    await application_workflow_dao.increment_template_usage(template_id)
    return {"detail": "Usage recorded"}


# ================================================================
# AUTOMATION RULES
# ================================================================

@workflow_router.post("/automation-rules")
async def create_automation_rule(
    rule: AutomationRule,
    uuid: str = Depends(authorize)
):
    data = rule.model_dump()
    data["uuid"] = uuid
    rule_id = await application_workflow_dao.create_automation_rule(data)
    return {"detail": "Rule created", "rule_id": rule_id}


@workflow_router.get("/automation-rules")
async def get_automation_rules(
    enabled_only: bool = Query(False),
    uuid: str = Depends(authorize)
):
    if enabled_only:
        return await application_workflow_dao.get_enabled_rules(uuid)
    return await application_workflow_dao.get_user_automation_rules(uuid)


@workflow_router.put("/automation-rules/{rule_id}")
async def update_automation_rule(
    rule_id: str,
    rule: AutomationRuleUpdate,
    uuid: str = Depends(authorize)
):
    data = rule.model_dump(exclude_unset=True)
    updated = await application_workflow_dao.update_automation_rule(rule_id, data)
    if updated == 0:
        raise HTTPException(400, "Rule not found")
    return {"detail": "Rule updated"}


@workflow_router.post("/automation-rules/{rule_id}/toggle")
async def toggle_automation_rule(
    rule_id: str,
    enabled: bool = Body(...),
    uuid: str = Depends(authorize)
):
    updated = await application_workflow_dao.toggle_automation_rule(rule_id, enabled)
    if updated == 0:
        raise HTTPException(400, "Rule not found")
    return {"detail": f"Rule {'enabled' if enabled else 'disabled'}"}


@workflow_router.delete("/automation-rules/{rule_id}")
async def delete_automation_rule(
    rule_id: str,
    uuid: str = Depends(authorize)
):
    deleted = await application_workflow_dao.delete_automation_rule(rule_id)
    if deleted == 0:
        raise HTTPException(400, "Rule not found")
    return {"detail": "Rule deleted"}


# ================================================================
# ANALYTICS (UC-072)
# ================================================================

@workflow_router.get("/analytics/funnel")
async def analytics_funnel(uuid: str = Depends(authorize)):
    return await application_analytics_dao.get_application_funnel(uuid)


@workflow_router.get("/analytics/response-times")
async def analytics_response_times(uuid: str = Depends(authorize)):
    return await application_analytics_dao.calculate_response_times(uuid)


@workflow_router.get("/analytics/success-rates")
async def analytics_success_rates(uuid: str = Depends(authorize)):
    return await application_analytics_dao.analyze_success_rates(uuid)


@workflow_router.get("/analytics/trends")
async def analytics_trends(uuid: str = Depends(authorize)):
    return await application_analytics_dao.get_application_trends(uuid)


@workflow_router.get("/analytics/benchmarks")
async def analytics_benchmarks(uuid: str = Depends(authorize)):
    return await application_analytics_dao.get_performance_benchmarks(uuid)


@workflow_router.get("/analytics/recommendations")
async def analytics_recommendations(uuid: str = Depends(authorize)):
    return await application_analytics_dao.generate_recommendations(uuid)


# ================================================================
# UC-121: PERSONAL RESPONSE TIME TRACKING
# ================================================================

@workflow_router.get("/analytics/response-metrics")
async def get_personal_response_metrics(uuid: str = Depends(authorize)):
    """Get personal response time statistics"""
    return await application_analytics_dao.get_personal_response_metrics(uuid)


@workflow_router.get("/analytics/pending-applications")
async def get_pending_applications(uuid: str = Depends(authorize)):
    """Get pending applications with overdue detection"""
    pending = await application_analytics_dao.get_pending_applications_with_days(uuid)
    overdue = await application_analytics_dao.get_overdue_applications(uuid)
    return {"pending": pending, "overdue": overdue}


@workflow_router.get("/analytics/response-trends")
async def get_response_trends(
    uuid: str = Depends(authorize),
    days: int = Query(90, description="Number of days to look back")
):
    """Get response time trends"""
    return await application_analytics_dao.get_response_time_trends(uuid, days)


@workflow_router.put("/jobs/{job_id}/response-date")
async def set_manual_response_date(
    job_id: str,
    response_date: str = Body(..., embed=True),
    uuid: str = Depends(authorize)
):
    """Manually set response date for a job"""
    from datetime import datetime, timezone
    from bson import ObjectId

    try:
        # Get job
        job = await jobs_dao.get_job(job_id)
        if not job:
            raise HTTPException(404, "Job not found")

        # Verify ownership
        if job.get("uuid") != uuid:
            raise HTTPException(403, "Unauthorized")

        # Parse response date
        try:
            responded_at = datetime.fromisoformat(response_date.replace('Z', '+00:00'))
            if responded_at.tzinfo is None:
                responded_at = responded_at.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(400, "Invalid date format. Use ISO format (YYYY-MM-DD)")

        # Get submitted_at - check date_applied first, then response_tracking
        submitted_at = None

        # Priority 1: Use date_applied if provided
        if job.get("date_applied"):
            try:
                submitted_at = datetime.fromisoformat(job["date_applied"].replace('Z', '+00:00'))
                if submitted_at.tzinfo is None:
                    submitted_at = submitted_at.replace(tzinfo=timezone.utc)
            except Exception:
                pass

        # Priority 2: Use response_tracking.submitted_at
        if not submitted_at:
            response_tracking = job.get("response_tracking", {})
            submitted_at = response_tracking.get("submitted_at")

        if not submitted_at:
            raise HTTPException(400, "No submission date found for this job")

        # Ensure timezone-aware
        if submitted_at.tzinfo is None:
            submitted_at = submitted_at.replace(tzinfo=timezone.utc)

        # Calculate response days
        response_days = (responded_at - submitted_at).days

        if response_days < 0:
            raise HTTPException(400, f"Response date cannot be before submission date. Submitted: {submitted_at.date()}, Response: {responded_at.date()}")

        # Update job
        update_data = {
            "response_tracking": {
                "submitted_at": submitted_at,
                "responded_at": responded_at,
                "response_days": response_days,
                "manually_entered": True
            }
        }

        await jobs_dao.update_job(job_id, update_data)

        return {
            "success": True,
            "response_days": response_days,
            "message": f"Response date set to {response_date} ({response_days} days after submission)"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to set response date: {str(e)}")


# ================================================================
# GOALS
# ================================================================

@workflow_router.get("/goals")
async def get_goals(uuid: str = Depends(authorize)):
    return await application_analytics_dao.get_user_goals(uuid)

# ================================================================
# SCHEDULING EMAIL NOTIFICATIONS (UC-124)
# ================================================================

@workflow_router.post("/schedules/{schedule_id}/send-reminder")
async def send_schedule_reminder_email(
    schedule_id: str,
    recipient_email: str = Body(..., embed=True),
    uuid: str = Depends(authorize)
):
    """Send reminder email for an upcoming scheduled application"""
    try:
        # Get schedule details
        schedule = await application_workflow_dao.get_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(404, "Schedule not found")
        
        if schedule.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized")
        
        # Get job details
        job = await jobs_dao.get_job(schedule["job_id"])
        if not job:
            raise HTTPException(404, "Job not found")
        
        # Get package details
        package = await application_workflow_dao.get_application_package(schedule["package_id"])
        if not package:
            raise HTTPException(404, "Package not found")
        
        # Extract company name
        company_name = job.get("company")
        if isinstance(company_name, dict):
            company_name = company_name.get("name", "Unknown Company")
        
        # Calculate hours until scheduled time
        scheduled_time = schedule.get("scheduled_time") or schedule.get("run_at")
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            hours_until = int((scheduled_dt - now).total_seconds() / 3600)
        except:
            hours_until = 0
        
        # Send reminder email
        result = scheduling_service.send_scheduled_submission_reminder(
            recipient_email=recipient_email,
            job_title=job.get("title", "Position"),
            company=company_name,
            scheduled_time=scheduled_time,
            package_name=package.get("name", "Package"),
            hours_until=hours_until
        )
        
        return {
            "detail": "Reminder email sent successfully",
            "sent_to": recipient_email,
            "sent_at": result["sent_at"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(500, f"Email configuration error: {str(e)}")
    except Exception as e:
        print(f"Error sending schedule reminder: {e}")
        raise HTTPException(500, f"Failed to send reminder: {str(e)}")


@workflow_router.post("/schedules/send-deadline-reminder")
async def send_job_deadline_reminder(
    job_id: str = Body(...),
    recipient_email: str = Body(...),
    uuid: str = Depends(authorize)
):
    """Send deadline reminder email for a job"""
    try:
        # Get job details
        job = await jobs_dao.get_job(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        
        if job.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized")
        
        # Check if job has deadline
        deadline = job.get("deadline")
        if not deadline:
            raise HTTPException(400, "Job has no deadline set")
        
        # Extract company name
        company_name = job.get("company")
        if isinstance(company_name, dict):
            company_name = company_name.get("name", "Unknown Company")
        
        # Calculate days until deadline
        try:
            deadline_dt = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_until = (deadline_dt - now).days
        except:
            days_until = 0
        
        # Send deadline reminder
        result = scheduling_service.send_deadline_reminder(
            recipient_email=recipient_email,
            job_title=job.get("title", "Position"),
            company=company_name,
            deadline=deadline,
            days_until=days_until
        )
        
        return {
            "detail": "Deadline reminder sent successfully",
            "sent_to": recipient_email,
            "sent_at": result["sent_at"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(500, f"Email configuration error: {str(e)}")
    except Exception as e:
        print(f"Error sending deadline reminder: {e}")
        raise HTTPException(500, f"Failed to send reminder: {str(e)}")


@workflow_router.post("/schedules/{schedule_id}/notify-submission")
async def notify_scheduled_submission(
    schedule_id: str,
    recipient_email: str = Body(..., embed=True),
    uuid: str = Depends(authorize)
):
    """Send confirmation that scheduled application was submitted"""
    try:
        # Get schedule details
        schedule = await application_workflow_dao.get_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(404, "Schedule not found")
        
        if schedule.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized")
        
        # Verify schedule was completed
        if schedule.get("status") != "completed":
            raise HTTPException(400, "Schedule has not been completed yet")
        
        # Get job details
        job = await jobs_dao.get_job(schedule["job_id"])
        if not job:
            raise HTTPException(404, "Job not found")
        
        # Get package details
        package = await application_workflow_dao.get_application_package(schedule["package_id"])
        if not package:
            raise HTTPException(404, "Package not found")
        
        # Extract company name
        company_name = job.get("company")
        if isinstance(company_name, dict):
            company_name = company_name.get("name", "Unknown Company")
        
        # Send submission success notification
        result = scheduling_service.send_submission_success_notification(
            recipient_email=recipient_email,
            job_title=job.get("title", "Position"),
            company=company_name,
            package_name=package.get("name", "Package"),
            submission_time=schedule.get("completed_at", datetime.now(timezone.utc).isoformat())
        )
        
        return {
            "detail": "Submission notification sent successfully",
            "sent_to": recipient_email,
            "sent_at": result["sent_at"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(500, f"Email configuration error: {str(e)}")
    except Exception as e:
        print(f"Error sending submission notification: {e}")
        raise HTTPException(500, f"Failed to send notification: {str(e)}")


# ================================================================
# SCHEDULING ANALYTICS & BEST PRACTICES (UC-124)
# ================================================================

@workflow_router.get("/analytics/submission-timing")
async def get_submission_timing_analytics(uuid: str = Depends(authorize)):
    """Get analytics about application submission timing"""
    try:
        # Get all user's jobs
        jobs = await jobs_dao.get_all_jobs(uuid)
        
        # Analyze submission patterns
        day_of_week_stats = {}
        hour_of_day_stats = {}
        response_rates_by_day = {}
        response_rates_by_hour = {}
        
        for job in jobs:
            submitted_at = job.get("submitted_at")
            if not submitted_at:
                continue
            
            try:
                dt = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
                day_name = dt.strftime("%A")
                hour = dt.hour
                
                # Count submissions by day
                day_of_week_stats[day_name] = day_of_week_stats.get(day_name, 0) + 1
                
                # Count submissions by hour
                hour_of_day_stats[hour] = hour_of_day_stats.get(hour, 0) + 1
                
                # Track response rates
                has_response = job.get("status") not in [None, "Applied", "Wishlist"]
                
                if day_name not in response_rates_by_day:
                    response_rates_by_day[day_name] = {"total": 0, "responses": 0}
                response_rates_by_day[day_name]["total"] += 1
                if has_response:
                    response_rates_by_day[day_name]["responses"] += 1
                
                if hour not in response_rates_by_hour:
                    response_rates_by_hour[hour] = {"total": 0, "responses": 0}
                response_rates_by_hour[hour]["total"] += 1
                if has_response:
                    response_rates_by_hour[hour]["responses"] += 1
            except:
                continue
        
        # Calculate response rate percentages
        day_response_rates = {}
        for day, stats in response_rates_by_day.items():
            if stats["total"] > 0:
                day_response_rates[day] = round((stats["responses"] / stats["total"]) * 100, 1)
        
        hour_response_rates = {}
        for hour, stats in response_rates_by_hour.items():
            if stats["total"] > 0:
                hour_response_rates[hour] = round((stats["responses"] / stats["total"]) * 100, 1)
        
        # Best practices
        best_practices = {
            "optimal_days": [
                {
                    "day": "Tuesday",
                    "reason": "Highest open rates - people are settled into the work week",
                    "recommendation": "Best day for cold applications"
                },
                {
                    "day": "Wednesday",
                    "reason": "Second highest engagement, mid-week momentum",
                    "recommendation": "Good for follow-ups"
                }
            ],
            "optimal_hours": [
                {
                    "time": "10:00 AM - 11:00 AM",
                    "reason": "People have settled in and are checking email",
                    "recommendation": "Optimal time slot for most applications"
                }
            ]
        }
        
        return {
            "user_patterns": {
                "submissions_by_day": day_of_week_stats,
                "submissions_by_hour": hour_of_day_stats,
                "response_rate_by_day": day_response_rates,
                "response_rate_by_hour": hour_response_rates,
                "total_submissions": len([j for j in jobs if j.get("submitted_at")])
            },
            "best_practices": best_practices,
            "insights": generate_timing_insights(
                day_of_week_stats,
                day_response_rates,
                hour_response_rates
            )
        }
        
    except Exception as e:
        print(f"Error getting submission timing analytics: {e}")
        raise HTTPException(500, "Failed to get analytics")


def generate_timing_insights(
    day_stats: dict,
    day_response_rates: dict,
    hour_response_rates: dict
) -> list:
    """Generate personalized insights based on user's submission patterns"""
    insights = []
    
    # Check if user submits on suboptimal days
    weekend_submissions = day_stats.get("Saturday", 0) + day_stats.get("Sunday", 0)
    if weekend_submissions > 0:
        insights.append({
            "type": "warning",
            "message": f"You've submitted {weekend_submissions} applications on weekends. Consider scheduling these for Tuesday or Wednesday instead for better engagement."
        })
    
    # Check if user has a best performing day
    if day_response_rates:
        best_day = max(day_response_rates.items(), key=lambda x: x[1])
        if best_day[1] > 30:
            insights.append({
                "type": "success",
                "message": f"Your {best_day[0]} applications have a {best_day[1]}% response rate! Consider submitting more on this day."
            })
    
    return insights


    @workflow_router.get("/calendar-view")
    async def get_calendar_view(
        start_date: str = Query(...),
        end_date: str = Query(...),
        uuid: str = Depends(authorize)
    ):
        """Get calendar view of scheduled and completed applications"""
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            # Get scheduled applications
            schedules = await application_workflow_dao.get_scheduled_applications(uuid)
            
            # Get all jobs
            jobs = await jobs_dao.get_all_jobs(uuid)
            
            calendar_events = []
            
            # Add scheduled applications
            for schedule in schedules:
                scheduled_time = schedule.get("scheduled_time")
                if not scheduled_time:
                    continue
                
                try:
                    dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
                    if start_dt <= dt <= end_dt:
                        job = await jobs_dao.get_job(schedule["job_id"])
                        if job:
                            company = job.get("company")
                            if isinstance(company, dict):
                                company = company.get("name", "Unknown")
                            
                            calendar_events.append({
                                "id": str(schedule.get("_id")),
                                "type": "scheduled",
                                "title": f"📅 {job.get('title', 'Application')}",
                                "company": company,
                                "date": scheduled_time,
                                "status": schedule.get("status", "scheduled"),
                                "job_id": schedule["job_id"],
                                "schedule_id": str(schedule.get("_id"))
                            })
                except:
                    continue
            
            # Sort by date
            calendar_events.sort(key=lambda x: x["date"])
            
            return {
                "events": calendar_events,
                "summary": {
                    "total_events": len(calendar_events),
                    "scheduled": len([e for e in calendar_events if e["type"] == "scheduled"]),
                    "submitted": len([e for e in calendar_events if e["type"] == "submitted"]),
                    "deadlines": len([e for e in calendar_events if e["type"] == "deadline"])
                }
            }
            
        except Exception as e:
            print(f"Error getting calendar view: {e}")
            raise HTTPException(500, "Failed to get calendar view")

    @workflow_router.get("/scheduler/health")
    async def scheduler_health_check():
        """Check scheduler health"""
        from services.background_scheduler_service import background_scheduler
        
        return {
            "scheduler_running": background_scheduler.is_running,
            "check_interval_seconds": background_scheduler.check_interval,
            "current_time": datetime.now(timezone.utc).isoformat()
        }

    @workflow_router.get("/schedules/upcoming")
    async def get_upcoming_schedules(
        hours: int = 24,
        uuid: str = Depends(authorize)
    ):
        """Get schedules due within X hours"""
        now = datetime.now(timezone.utc)
        future_time = now + timedelta(hours=hours)
        
        schedules = await application_workflow_dao.get_schedules_by_time_range(
            start_time=now,
            end_time=future_time
        )
        
        # Filter by user and enrich
        user_schedules = [s for s in schedules if s.get('uuid') == uuid]
        
        enriched = []
        for schedule in user_schedules:
            job = await jobs_dao.get_job(schedule['job_id'])
            package = await application_workflow_dao.get_application_package(schedule['package_id'])
            
            enriched.append({
                **schedule,
                'job': job,
                'package': package,
                'hours_until': (
                    datetime.fromisoformat(schedule['scheduled_time'].replace('Z', '+00:00')) - now
                ).total_seconds() / 3600
            })
        
        return {"schedules": enriched, "count": len(enriched)}

@workflow_router.post("/schedules/{schedule_id}/mark-complete")
async def mark_schedule_complete(
    schedule_id: str,
    notes: Optional[str] = Body(None, embed=True),
    uuid: str = Depends(authorize)
):
    """
    Manually mark a scheduled application as completed
    (e.g., if user submitted it manually before scheduled time)
    """
    try:
        # Get schedule details
        schedule = await application_workflow_dao.get_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(404, "Schedule not found")
        
        if schedule.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized")
        
        # Check if already completed
        if schedule.get("status") == "completed":
            raise HTTPException(400, "Schedule already completed")
        
        # Mark schedule as completed
        job_id = schedule["job_id"]
        package_id = schedule["package_id"]
        
        # Update schedule status
        await application_workflow_dao.update_schedule_status(
            schedule_id,
            status='completed',
            notes=notes or "Marked complete manually by user"
        )
        
        # Update the job status to submitted
        await jobs_dao.update_job(job_id, {
            'submitted': True,
            'submitted_at': datetime.now(timezone.utc).isoformat(),
            'status': 'SUBMITTED',
            'application_package_id': package_id
        })
        
        # Increment package usage counter
        await application_workflow_dao.increment_package_usage(package_id)
        
        return {
            "detail": "Schedule marked as completed",
            "schedule_id": schedule_id,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking schedule complete: {e}")
        raise HTTPException(500, f"Failed to mark schedule complete: {str(e)}")

# ================================================================
# USER PACKAGE QUALITY ANALYSIS (UC-122)
# ================================================================

@workflow_router.post("/analyze-quality")
async def analyze_package_quality(
    request: QualityAnalysisRequest,
    uuid: str = Depends(authorize)
):
    """
    UC-122: AI-powered quality scoring for application packages
    Uses Cohere as primary, OpenAI as fallback
    """
    import json
    import os
    from datetime import datetime
    from bson import ObjectId
    
    try:
        print(f"🔍 Analyzing package: {request.package_id}, job: {request.job_id}, user: {uuid}")
        
        # 1. Fetch package details
        package = await application_workflow_dao.get_application_package(request.package_id)
        print(f"📦 Package found: {package is not None}")
        if package:
            print(f"   Package name: {package.get('name')}, uuid: {package.get('uuid')}")
        
        if not package:
            raise HTTPException(status_code=404, detail=f"Package not found with ID: {request.package_id}")
        if package.get("uuid") != uuid:
            raise HTTPException(status_code=403, detail="Not authorized to access this package")
        
        # 2. Fetch job details
        job = await jobs_dao.get_job(request.job_id)
        print(f"💼 Job found: {job is not None}")
        if job:
            print(f"   Job title: {job.get('title')}, uuid: {job.get('uuid')}")
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job not found with ID: {request.job_id}")
        if job.get("uuid") != uuid:
            raise HTTPException(status_code=403, detail="Not authorized to access this job")
        
        # 3. Fetch resume content
        resume_content = ""
        if package.get("resume_id"):
            print(f"📄 Fetching resume: {package.get('resume_id')}")
            from mongo.resumes_dao import resumes_dao
            try:
                # resumes_dao.get_resume expects ObjectId or converts to ObjectId
                resume = await resumes_dao.get_resume(package["resume_id"])
                if resume:
                    resume_content = format_resume_for_analysis(resume)
                    print(f"   Resume loaded: {len(resume_content)} chars")
                else:
                    print(f"   Resume not found")
            except Exception as e:
                print(f"   Resume fetch error: {e}")
        
        # 4. Fetch cover letter content
        cover_letter_content = ""
        if package.get("cover_letter_id"):
            print(f"✉️ Fetching cover letter: {package.get('cover_letter_id')}")
            from mongo.cover_letters_dao import cover_letters_dao
            try:
                # cover_letters_dao.get_cover_letter expects (letter_id, uuid)
                cover_letter = await cover_letters_dao.get_cover_letter(
                    package["cover_letter_id"], 
                    uuid
                )
                if cover_letter:
                    cover_letter_content = cover_letter.get("content", "")
                    print(f"   Cover letter loaded: {len(cover_letter_content)} chars")
                else:
                    print(f"   Cover letter not found")
            except Exception as e:
                print(f"   Cover letter fetch error: {e}")
        
        # 5. Build job description
        company_name = "Unknown Company"
        
        # Try to get company from company_data first
        if job.get("company_data"):
            company_data = job["company_data"]
            if isinstance(company_data, dict):
                company_name = company_data.get("name") or company_data.get("industry") or company_data.get("location") or company_name
        
        # If still Unknown, fall back to job.company
        if company_name == "Unknown Company":
            company = job.get("company")
            if company:
                if isinstance(company, dict):
                    company_name = company.get("name", "Unknown Company")
                else:
                    company_name = str(company)
        
        job_description = f"""
Title: {job.get('title', 'N/A')}
Company: {company_name}
Location: {job.get('location', 'N/A')}
Description: {job.get('description', 'N/A')}
        """.strip()
        
        print(f"✅ All data fetched successfully. Starting AI analysis...")
        
        # 6. Create analysis prompt
        analysis_prompt = f"""Analyze this job application package and provide a detailed quality score.

JOB POSTING:
{job_description}

RESUME:
{resume_content if resume_content else "No resume attached"}

COVER LETTER:
{cover_letter_content if cover_letter_content else "No cover letter attached"}

Please analyze and provide:
1. Overall quality score (0-100)
2. Score breakdown for: resume alignment, cover letter quality, keyword match, formatting
3. Missing keywords from job description (max 5)
4. Formatting issues (max 3)
5. Prioritized improvement suggestions (max 4, with high/medium/low priority)
6. Whether this meets a 70/100 threshold for submission

Respond ONLY with valid JSON matching this exact structure (no markdown, no extra text):
{{
  "overallScore": 85,
  "breakdown": {{
    "resumeAlignment": 80,
    "coverLetterQuality": 90,
    "keywordMatch": 75,
    "formatting": 95
  }},
  "missingKeywords": ["Python", "AWS", "Docker"],
  "formattingIssues": ["Resume exceeds 2 pages", "Inconsistent date formatting"],
  "suggestions": [
    {{
      "priority": "high",
      "category": "Keywords",
      "issue": "Missing critical technical skills from job posting",
      "action": "Add Python, AWS, and Docker to your skills section with specific project examples"
    }},
    {{
      "priority": "medium",
      "category": "Experience",
      "issue": "Limited quantifiable achievements in recent roles",
      "action": "Add metrics to your last 2-3 positions (e.g., 'improved efficiency by 30%')"
    }}
  ],
  "canSubmit": true,
  "minimumThreshold": 70
}}"""

        # 7. Call AI API (Cohere primary, OpenAI fallback)
        analysis_data = None
        
        try:
            # Try Cohere first
            import cohere
            cohere_client = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))
            
            print("🤖 Calling Cohere API...")
            cohere_response = cohere_client.chat(
                model="command-r-plus-08-2024",  # Updated model name
                message=analysis_prompt,
                temperature=0.3,
                max_tokens=4000
            )
            
            response_text = cohere_response.text
            response_text = response_text.replace("```json", "").replace("```", "").strip()
            analysis_data = json.loads(response_text)
            print("✓ Quality analysis completed with Cohere")
            
        except Exception as cohere_error:
            print(f"⚠️ Cohere failed: {str(cohere_error)}, falling back to OpenAI...")
            
            try:
                # Fallback to OpenAI
                import openai
                openai.api_key = os.getenv("OPENAI_API_KEY")
                
                print("🤖 Calling OpenAI API...")
                openai_response = openai.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an expert resume and job application analyst. Respond only with valid JSON."},
                        {"role": "user", "content": analysis_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=4000
                )
                
                response_text = openai_response.choices[0].message.content
                response_text = response_text.replace("```json", "").replace("```", "").strip()
                analysis_data = json.loads(response_text)
                print("✓ Quality analysis completed with OpenAI (fallback)")
                
            except Exception as openai_error:
                print(f"❌ OpenAI also failed: {str(openai_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Both Cohere and OpenAI failed. Cohere: {str(cohere_error)}, OpenAI: {str(openai_error)}"
                )
        
        if not analysis_data:
            raise HTTPException(status_code=500, detail="Failed to get analysis from AI providers")
        
        # 8. Get user's average score for comparison
        user_avg_score = await application_workflow_dao.get_user_average_quality_score(uuid)
        comparison = analysis_data["overallScore"] - user_avg_score
        print(f"📊 Score: {analysis_data['overallScore']}, User avg: {user_avg_score}, Diff: {comparison}")
        
        # 9. Get score history for this package
        score_history = await application_workflow_dao.get_package_score_history(request.package_id)
        
        # 10. Save this analysis result
        await application_workflow_dao.save_quality_analysis(
            package_id=request.package_id,
            job_id=request.job_id,
            score=analysis_data["overallScore"],
            analysis_data=analysis_data,
            user_id=uuid
        )
        
        # 11. Update package with last score
        await application_workflow_dao.update_package(
            request.package_id,
            {"lastScore": analysis_data["overallScore"]}
        )
        
        print("✅ Analysis complete and saved!")
        
        return {
            **analysis_data,
            "comparisonToAverage": comparison,
            "scoreHistory": score_history
        }
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI analysis: {str(e)}")
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


def format_resume_for_analysis(resume: dict) -> str:
    """Format resume data into readable text for AI analysis"""
    parts = []
    
    # Contact info
    if resume.get("contact"):
        contact = resume["contact"]
        parts.append(f"Name: {contact.get('name', 'N/A')}")
        parts.append(f"Email: {contact.get('email', 'N/A')}")
    
    # Summary
    if resume.get("summary"):
        parts.append(f"\nSUMMARY:\n{resume['summary']}")
    
    # Experience
    if resume.get("experience"):
        parts.append("\nEXPERIENCE:")
        for exp in resume["experience"]:
            parts.append(f"\n{exp.get('title', 'Position')} at {exp.get('company', 'Company')}")
            if exp.get('description'):
                parts.append(f"  {exp['description']}")
    
    # Skills
    if resume.get("skills"):
        skills_list = []
        for skill in resume["skills"]:
            if isinstance(skill, dict):
                skills_list.append(skill.get("name", ""))
            else:
                skills_list.append(str(skill))
        parts.append(f"\nSKILLS: {', '.join(filter(None, skills_list))}")
    
    return "\n".join(parts)