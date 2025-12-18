# backend/services/automation_engine.py

from datetime import datetime, timezone, time, timedelta
from typing import Optional, List, Dict, Any

from mongo.application_workflow_dao import application_workflow_dao
from mongo.jobs_dao import jobs_dao
from mongo.application_analytics_dao import application_analytics_dao  # optional, not required right now


# ------------------------
# Helpers
# ------------------------

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_status(status: Optional[str]) -> Optional[str]:
    if not status:
        return None
    return str(status).upper().strip()


def _company_matches(rule_conditions: Dict[str, Any], job: Dict[str, Any]) -> bool:
    """
    Supported condition:
      - company_contains: substring match (case-insensitive) against job.company
    """
    if not rule_conditions:
        return True

    company_contains = rule_conditions.get("company_contains")
    if company_contains:
        company_value = ""
        company_field = job.get("company")

        # job["company"] may be string or dict
        if isinstance(company_field, str):
            company_value = company_field
        elif isinstance(company_field, dict):
            company_value = (
                company_field.get("name")
                or company_field.get("company")
                or ""
            )

        if company_contains.lower() not in company_value.lower():
            return False

    return True


def _status_matches(
    rule_conditions: Dict[str, Any],
    job: Dict[str, Any],
    old_status: Optional[str],
    new_status: Optional[str],
) -> bool:
    """
    Optional extra condition:
      - status_is: only run rule when job status is X
    """
    if not rule_conditions:
        return True

    desired = rule_conditions.get("status_is")
    if not desired:
        return True

    desired_norm = _normalize_status(desired)
    job_status_norm = _normalize_status(new_status or job.get("status"))

    return job_status_norm == desired_norm


def _rule_matches_trigger(rule: Dict[str, Any], event_type: str) -> bool:
    """
    event_type = "on_job_created" | "on_status_change"
    rule.trigger can be:
      - "on_job_created"
      - "on_status_change"
      - "any"
    """
    trigger = rule.get("trigger", "any")
    if trigger == "any":
        return True
    return trigger == event_type


def _compute_schedule_datetime(actions: Dict[str, Any]) -> datetime:
    """
    For rule_type = auto_schedule_application with actions.schedule_time = "HH:MM"
    Returns a datetime today or tomorrow at that time (UTC).
    """
    schedule_str = actions.get("schedule_time")
    if not schedule_str:
        target_time = time(hour=9, minute=0)
    else:
        try:
            hh, mm = schedule_str.split(":")
            target_time = time(hour=int(hh), minute=int(mm))
        except Exception:
            target_time = time(hour=9, minute=0)

    now = _now_utc()
    candidate = datetime.combine(now.date(), target_time, tzinfo=timezone.utc)
    if candidate < now:
        candidate = candidate + timedelta(days=1)

    return candidate


# ------------------------
# Rule execution helpers
# ------------------------

async def _execute_auto_assign_materials(rule: Dict[str, Any], job: Dict[str, Any]):
    actions = rule.get("actions") or {}
    resume_id = actions.get("resume_id")
    cover_letter_id = actions.get("cover_letter_id")

    if not resume_id and not cover_letter_id:
        return

    # FIX: Always make materials a dict
    materials = job.get("materials") or {}

    if resume_id:
        materials["resume_id"] = resume_id

    if cover_letter_id:
        materials["cover_letter_id"] = cover_letter_id

    payload = {
        "materials": materials,
        "status": job.get("status") or "MATERIALS_ATTACHED",
    }

    await jobs_dao.update_job(str(job["_id"]), payload)



async def _execute_auto_create_package(rule: Dict[str, Any], job: Dict[str, Any]):
    """
    Creates a new application package (using resume/cover-letter ids from actions),
    then links it to the job as application_package_id.
    """
    actions = rule.get("actions") or {}
    resume_id = actions.get("resume_id")
    cover_letter_id = actions.get("cover_letter_id")

    if not resume_id:
        # Package requires at least a resume
        return

    package_doc = {
        "uuid": job.get("uuid"),
        "name": actions.get("package_name")
        or f"Auto Package for {job.get('title', 'Job')}",
        "description": actions.get("package_description")
        or "Auto-generated package from automation rule.",
        "resume_id": resume_id,
        "cover_letter_id": cover_letter_id,
        "portfolio_ids": actions.get("portfolio_ids") or [],
        "status": "draft",
    }

    package_id = await application_workflow_dao.create_application_package(package_doc)

    await jobs_dao.update_job(str(job["_id"]), {
        "application_package_id": package_id
    })


async def _execute_auto_schedule_application(rule: Dict[str, Any], job: Dict[str, Any]):
    """
    Creates a schedule row via ApplicationWorkflowDAO.
    """
    actions = rule.get("actions") or {}
    package_id = actions.get("package_id") or job.get("application_package_id")

    if not package_id:
        # nothing to schedule
        return

    when = _compute_schedule_datetime(actions)

    schedule_doc = {
        "uuid": job.get("uuid"),
        "job_id": str(job["_id"]),
        "package_id": package_id,
        "scheduled_time": when,
        "submission_method": "automated",
        "status": "scheduled",
    }

    await application_workflow_dao.schedule_application(schedule_doc)


async def _execute_auto_submit_application(rule, job):
    """
    Automatically mark the job as Applied.
    """
    now = _now_utc()

    # 🚀 IMPORTANT: Your system uses "Applied", not "Submitted"
    payload = {
        "submitted": True,
        "submitted_at": now,
        "status": "Applied",  
    }

    # OPTIONAL: Update status history if your DAO supports it:
    # history = job.get("status_history", [])
    # history.append({"status": "Applied", "timestamp": now})
    # payload["status_history"] = history

    await jobs_dao.update_job(str(job["_id"]), payload)



async def _execute_rule(rule: Dict[str, Any], job: Dict[str, Any]):
    rule_type = rule.get("rule_type")
    if not rule_type:
        return

    if rule_type == "auto_assign_materials":
        await _execute_auto_assign_materials(rule, job)
    elif rule_type == "auto_create_package":
        await _execute_auto_create_package(rule, job)
    elif rule_type == "auto_schedule_application":
        await _execute_auto_schedule_application(rule, job)
    elif rule_type == "auto_submit_application":
        await _execute_auto_submit_application(rule, job)
    else:
        # unsupported type – ignore gracefully
        return


# ------------------------
# Public entry points
# ------------------------

async def process_automation_for_job(
    job_id: str,
    event_type: str,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
):
    """
    Called from routers when:
      - a job is created  -> event_type="on_job_created"
      - a job status changes -> event_type="on_status_change"
    """
    job = await jobs_dao.get_job(job_id)
    if not job:
        return

    user_uuid = job.get("uuid")
    if not user_uuid:
        return

    enabled_rules = await application_workflow_dao.get_enabled_rules(user_uuid)

    for rule in enabled_rules:
        if not rule.get("enabled", True):
            continue

        # Trigger filter
        if not _rule_matches_trigger(rule, event_type):
            continue

        conditions = rule.get("conditions") or {}

        # Condition: company
        if not _company_matches(conditions, job):
            continue

        # Condition: status
        if not _status_matches(conditions, job, old_status, new_status):
            continue

        try:
            await _execute_rule(rule, job)
        except Exception as e:
            print(f"[Automation] Error executing rule {rule.get('_id')}: {e}")


async def process_due_schedules(time_window_minutes: int = 5):
    """
    Called periodically (e.g. every 60s) to:
      - find schedules that are due in the next `time_window_minutes`
      - mark jobs as submitted
      - update schedule status to 'sent'
    """
    due_schedules = await application_workflow_dao.get_due_applications(time_window_minutes)

    for sched in due_schedules:
        try:
            job_id = sched.get("job_id")
            package_id = sched.get("package_id")
            schedule_id = sched.get("_id")

            if not job_id:
                continue

            now = _now_utc()

            await jobs_dao.update_job(job_id, {
                "application_package_id": package_id,
                "submitted": True,
                "submitted_at": now,
                "status": "SUBMITTED",
            })

            await application_workflow_dao.update_schedule_status(schedule_id, "sent")

            print(f"[Automation] Auto-submitted job {job_id} from schedule {schedule_id}")

        except Exception as e:
            print(f"[Automation] Failed processing schedule {sched.get('_id')}: {e}")



