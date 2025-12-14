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
    FollowUpReminder, ReminderUpdate,
    QualityAnalysisRequest, PackageQualityAnalysis,
    QualityScoreBreakdown, QualitySuggestion
)

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
# GOALS
# ================================================================

@workflow_router.get("/goals")
async def get_goals(uuid: str = Depends(authorize)):
    return await application_analytics_dao.get_user_goals(uuid)


