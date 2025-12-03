from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional
from datetime import datetime

from mongo.application_workflow_dao import application_workflow_dao
from mongo.application_analytics_dao import application_analytics_dao
from sessions.session_authorizer import authorize
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

workflow_router = APIRouter(prefix="/application-workflow")

# ============================================
# APPLICATION PACKAGES (UC-069)
# ============================================

@workflow_router.post("/packages", tags=["workflow"])
async def create_application_package(
    package: ApplicationPackage,
    uuid: str = Depends(authorize)
):
    """Create a new application package (resume + cover letter + portfolio)"""
    try:
        data = package.model_dump()
        data["uuid"] = uuid
        package_id = await application_workflow_dao.create_application_package(data)
        
        return {
            "detail": "Application package created successfully",
            "package_id": package_id
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create package: {str(e)}")

@workflow_router.get("/packages", tags=["workflow"])
async def get_application_packages(uuid: str = Depends(authorize)):
    """Get all application packages for the current user"""
    try:
        packages = await application_workflow_dao.get_user_packages(uuid)
        return packages
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch packages: {str(e)}")

@workflow_router.get("/packages/{package_id}", tags=["workflow"])
async def get_application_package(
    package_id: str,
    uuid: str = Depends(authorize)
):
    """Get a specific application package"""
    try:
        package = await application_workflow_dao.get_application_package(package_id)
        if not package:
            raise HTTPException(404, "Package not found")
        
        # Verify ownership
        if package.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this package")
        
        return package
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch package: {str(e)}")

@workflow_router.put("/packages/{package_id}", tags=["workflow"])
async def update_application_package(
    package_id: str,
    package: ApplicationPackageUpdate,
    uuid: str = Depends(authorize)
):
    """Update an application package"""
    try:
        # Verify ownership first
        existing = await application_workflow_dao.get_application_package(package_id)
        if not existing:
            raise HTTPException(404, "Package not found")
        if existing.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to update this package")
        
        data = package.model_dump(exclude_unset=True)
        updated = await application_workflow_dao.update_package(package_id, data)
        
        if updated == 0:
            raise HTTPException(400, "Package not found")
        
        return {"detail": "Package updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update package: {str(e)}")

@workflow_router.delete("/packages/{package_id}", tags=["workflow"])
async def delete_application_package(
    package_id: str,
    uuid: str = Depends(authorize)
):
    """Delete an application package"""
    try:
        # Verify ownership
        existing = await application_workflow_dao.get_application_package(package_id)
        if not existing:
            raise HTTPException(404, "Package not found")
        if existing.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to delete this package")
        
        deleted = await application_workflow_dao.delete_package(package_id)
        if deleted == 0:
            raise HTTPException(400, "Package not found")
        
        return {"detail": "Package deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete package: {str(e)}")

@workflow_router.post("/packages/{package_id}/use", tags=["workflow"])
async def use_application_package(
    package_id: str,
    uuid: str = Depends(authorize)
):
    """Mark a package as used (increment usage count)"""
    try:
        existing = await application_workflow_dao.get_application_package(package_id)
        if not existing:
            raise HTTPException(404, "Package not found")
        if existing.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to use this package")
        
        await application_workflow_dao.increment_package_usage(package_id)
        return {"detail": "Package usage recorded"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to record usage: {str(e)}")

# ============================================
# APPLICATION SCHEDULING (UC-069)
# ============================================

@workflow_router.post("/schedules", tags=["workflow"])
async def schedule_application(
    schedule: ApplicationSchedule,
    uuid: str = Depends(authorize)
):
    """Schedule an application submission"""
    try:
        data = schedule.model_dump()
        data["uuid"] = uuid
        schedule_id = await application_workflow_dao.schedule_application(data)
        
        return {
            "detail": "Application scheduled successfully",
            "schedule_id": schedule_id
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to schedule application: {str(e)}")

@workflow_router.get("/schedules", tags=["workflow"])
async def get_scheduled_applications(uuid: str = Depends(authorize)):
    """Get all scheduled applications for the current user"""
    try:
        schedules = await application_workflow_dao.get_scheduled_applications(uuid)
        return schedules
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch schedules: {str(e)}")

@workflow_router.put("/schedules/{schedule_id}", tags=["workflow"])
async def update_schedule(
    schedule_id: str,
    schedule: ScheduleUpdate,
    uuid: str = Depends(authorize)
):
    """Update a scheduled application"""
    try:
        # Note: Add ownership verification in production
        data = schedule.model_dump(exclude_unset=True)
        updated = await application_workflow_dao.update_schedule_status(
            schedule_id, 
            data.get("status", "scheduled"),
            data.get("notes")
        )
        
        if updated == 0:
            raise HTTPException(400, "Schedule not found")
        
        return {"detail": "Schedule updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update schedule: {str(e)}")

@workflow_router.post("/schedules/{schedule_id}/cancel", tags=["workflow"])
async def cancel_scheduled_application(
    schedule_id: str,
    reason: Optional[str] = Body(None),
    uuid: str = Depends(authorize)
):
    """Cancel a scheduled application"""
    try:
        updated = await application_workflow_dao.cancel_scheduled_application(
            schedule_id, 
            reason
        )
        
        if updated == 0:
            raise HTTPException(400, "Schedule not found")
        
        return {"detail": "Schedule cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to cancel schedule: {str(e)}")

# ============================================
# RESPONSE TEMPLATES (UC-069)
# ============================================

@workflow_router.post("/templates", tags=["workflow"])
async def create_response_template(
    template: ResponseTemplate,
    uuid: str = Depends(authorize)
):
    """Create a response template"""
    try:
        data = template.model_dump()
        data["uuid"] = uuid
        template_id = await application_workflow_dao.create_template(data)
        
        return {
            "detail": "Template created successfully",
            "template_id": template_id
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create template: {str(e)}")

@workflow_router.get("/templates", tags=["workflow"])
async def get_response_templates(
    category: Optional[str] = Query(None),
    uuid: str = Depends(authorize)
):
    """Get all response templates for the current user"""
    try:
        templates = await application_workflow_dao.get_user_templates(uuid, category)
        return templates
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch templates: {str(e)}")

@workflow_router.put("/templates/{template_id}", tags=["workflow"])
async def update_response_template(
    template_id: str,
    template: TemplateUpdate,
    uuid: str = Depends(authorize)
):
    """Update a response template"""
    try:
        data = template.model_dump(exclude_unset=True)
        updated = await application_workflow_dao.update_template(template_id, data)
        
        if updated == 0:
            raise HTTPException(400, "Template not found")
        
        return {"detail": "Template updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update template: {str(e)}")

@workflow_router.delete("/templates/{template_id}", tags=["workflow"])
async def delete_response_template(
    template_id: str,
    uuid: str = Depends(authorize)
):
    """Delete a response template"""
    try:
        deleted = await application_workflow_dao.delete_template(template_id)
        
        if deleted == 0:
            raise HTTPException(400, "Template not found")
        
        return {"detail": "Template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete template: {str(e)}")

@workflow_router.post("/templates/{template_id}/use", tags=["workflow"])
async def use_template(
    template_id: str,
    uuid: str = Depends(authorize)
):
    """Mark a template as used"""
    try:
        await application_workflow_dao.increment_template_usage(template_id)
        return {"detail": "Template usage recorded"}
    except Exception as e:
        raise HTTPException(500, f"Failed to record usage: {str(e)}")

# ============================================
# AUTOMATION RULES (UC-069)
# ============================================

@workflow_router.post("/automation-rules", tags=["workflow"])
async def create_automation_rule(
    rule: AutomationRule,
    uuid: str = Depends(authorize)
):
    """Create an automation rule"""
    try:
        data = rule.model_dump()
        data["uuid"] = uuid
        rule_id = await application_workflow_dao.create_automation_rule(data)
        
        return {
            "detail": "Automation rule created successfully",
            "rule_id": rule_id
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create rule: {str(e)}")

@workflow_router.get("/automation-rules", tags=["workflow"])
async def get_automation_rules(
    enabled_only: bool = Query(False),
    uuid: str = Depends(authorize)
):
    """Get all automation rules for the current user"""
    try:
        if enabled_only:
            rules = await application_workflow_dao.get_enabled_rules(uuid)
        else:
            rules = await application_workflow_dao.get_user_automation_rules(uuid)
        return rules
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch rules: {str(e)}")

@workflow_router.put("/automation-rules/{rule_id}", tags=["workflow"])
async def update_automation_rule(
    rule_id: str,
    rule: AutomationRuleUpdate,
    uuid: str = Depends(authorize)
):
    """Update an automation rule"""
    try:
        data = rule.model_dump(exclude_unset=True)
        updated = await application_workflow_dao.update_automation_rule(rule_id, data)
        
        if updated == 0:
            raise HTTPException(400, "Rule not found")
        
        return {"detail": "Rule updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update rule: {str(e)}")

@workflow_router.post("/automation-rules/{rule_id}/toggle", tags=["workflow"])
async def toggle_automation_rule(
    rule_id: str,
    enabled: bool = Body(...),
    uuid: str = Depends(authorize)
):
    """Enable or disable an automation rule"""
    try:
        updated = await application_workflow_dao.toggle_automation_rule(rule_id, enabled)
        
        if updated == 0:
            raise HTTPException(400, "Rule not found")
        
        status = "enabled" if enabled else "disabled"
        return {"detail": f"Rule {status} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to toggle rule: {str(e)}")

@workflow_router.delete("/automation-rules/{rule_id}", tags=["workflow"])
async def delete_automation_rule(
    rule_id: str,
    uuid: str = Depends(authorize)
):
    """Delete an automation rule"""
    try:
        deleted = await application_workflow_dao.delete_automation_rule(rule_id)
        
        if deleted == 0:
            raise HTTPException(400, "Rule not found")
        
        return {"detail": "Rule deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete rule: {str(e)}")

# ============================================
# BULK OPERATIONS (UC-069)
# ============================================

@workflow_router.post("/packages/bulk", tags=["workflow"])
async def bulk_create_packages(
    bulk_data: BulkPackageCreate,
    uuid: str = Depends(authorize)
):
    """Create multiple application packages at once"""
    try:
        packages_data = [p.model_dump() for p in bulk_data.packages]
        package_ids = await application_workflow_dao.bulk_create_packages(uuid, packages_data)
        
        return {
            "detail": f"Created {len(package_ids)} packages successfully",
            "package_ids": package_ids
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create packages: {str(e)}")

@workflow_router.post("/schedules/bulk", tags=["workflow"])
async def bulk_schedule_applications(
    bulk_data: BulkScheduleCreate,
    uuid: str = Depends(authorize)
):
    """Schedule multiple applications at once"""
    try:
        schedules_data = [s.model_dump() for s in bulk_data.schedules]
        schedule_ids = await application_workflow_dao.bulk_schedule_applications(uuid, schedules_data)
        
        return {
            "detail": f"Scheduled {len(schedule_ids)} applications successfully",
            "schedule_ids": schedule_ids
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to schedule applications: {str(e)}")

@workflow_router.post("/schedules/bulk-cancel", tags=["workflow"])
async def bulk_cancel_schedules(
    bulk_data: BulkScheduleCancel,
    uuid: str = Depends(authorize)
):
    """Cancel multiple scheduled applications"""
    try:
        cancelled = await application_workflow_dao.bulk_cancel_schedules(
            bulk_data.schedule_ids,
            bulk_data.reason
        )
        
        return {
            "detail": f"Cancelled {cancelled} schedules successfully",
            "cancelled_count": cancelled
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to cancel schedules: {str(e)}")

# ============================================
# APPLICATION ANALYTICS (UC-072)
# ============================================

@workflow_router.get("/analytics/funnel", tags=["analytics"])
async def get_application_funnel(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    uuid: str = Depends(authorize)
):
    """Get application funnel analytics"""
    try:
        date_range = None
        if start_date and end_date:
            date_range = {
                "start": datetime.fromisoformat(start_date),
                "end": datetime.fromisoformat(end_date)
            }
        
        funnel = await application_analytics_dao.get_application_funnel(uuid, date_range)
        return funnel
    except Exception as e:
        raise HTTPException(500, f"Failed to get funnel analytics: {str(e)}")

@workflow_router.get("/analytics/response-times", tags=["analytics"])
async def get_response_times(
    group_by: Optional[str] = Query(None),  # company, industry, or None
    uuid: str = Depends(authorize)
):
    """Get time-to-response analytics"""
    try:
        response_times = await application_analytics_dao.calculate_response_times(uuid, group_by)
        return response_times
    except Exception as e:
        raise HTTPException(500, f"Failed to get response times: {str(e)}")

@workflow_router.get("/analytics/success-rates", tags=["analytics"])
async def get_success_rates(
    group_by: Optional[str] = Query(None),  # industry, job_type, materials, or None
    uuid: str = Depends(authorize)
):
    """Get success rate analytics"""
    try:
        success_rates = await application_analytics_dao.analyze_success_rates(uuid, group_by)
        return success_rates
    except Exception as e:
        raise HTTPException(500, f"Failed to get success rates: {str(e)}")

@workflow_router.get("/analytics/trends", tags=["analytics"])
async def get_application_trends(
    days: int = Query(90),
    uuid: str = Depends(authorize)
):
    """Get application volume and frequency trends"""
    try:
        trends = await application_analytics_dao.get_application_trends(uuid, days)
        return trends
    except Exception as e:
        raise HTTPException(500, f"Failed to get trends: {str(e)}")

@workflow_router.get("/analytics/benchmarks", tags=["analytics"])
async def get_performance_benchmarks(uuid: str = Depends(authorize)):
    """Get performance benchmarks compared to industry averages"""
    try:
        benchmarks = await application_analytics_dao.get_performance_benchmarks(uuid)
        return benchmarks
    except Exception as e:
        raise HTTPException(500, f"Failed to get benchmarks: {str(e)}")

@workflow_router.get("/analytics/recommendations", tags=["analytics"])
async def get_optimization_recommendations(uuid: str = Depends(authorize)):
    """Get optimization recommendations based on analytics"""
    try:
        recommendations = await application_analytics_dao.generate_recommendations(uuid)
        return recommendations
    except Exception as e:
        raise HTTPException(500, f"Failed to get recommendations: {str(e)}")

# ============================================
# GOAL TRACKING (UC-072)
# ============================================

@workflow_router.post("/goals", tags=["analytics"])
async def create_goal(
    goal: ApplicationGoal,
    uuid: str = Depends(authorize)
):
    """Create an application goal"""
    try:
        data = goal.model_dump()
        goal_id = await application_analytics_dao.save_goal(uuid, data)
        
        return {
            "detail": "Goal created successfully",
            "goal_id": goal_id
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create goal: {str(e)}")

@workflow_router.get("/goals", tags=["analytics"])
async def get_goals(uuid: str = Depends(authorize)):
    """Get all goals for the current user"""
    try:
        goals = await application_analytics_dao.get_user_goals(uuid)
        return goals
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch goals: {str(e)}")

@workflow_router.put("/goals/{goal_id}", tags=["analytics"])
async def update_goal(
    goal_id: str,
    goal: GoalUpdate,
    uuid: str = Depends(authorize)
):
    """Update a goal"""
    try:
        # Verify ownership
        existing_goals = await application_analytics_dao.get_user_goals(uuid)
        existing_goal = next((g for g in existing_goals if g.get("_id") == goal_id), None)
        
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        
        data = goal.model_dump(exclude_unset=True)
        updated = await application_analytics_dao.update_goal(goal_id, data)
        
        if updated == 0:
            raise HTTPException(400, "Goal not found")
        
        return {"detail": "Goal updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update goal: {str(e)}")

@workflow_router.delete("/goals/{goal_id}", tags=["analytics"])
async def delete_goal(
    goal_id: str,
    uuid: str = Depends(authorize)
):
    """Delete a goal"""
    try:
        # Verify ownership
        existing_goals = await application_analytics_dao.get_user_goals(uuid)
        existing_goal = next((g for g in existing_goals if g.get("_id") == goal_id), None)
        
        if not existing_goal:
            raise HTTPException(404, "Goal not found")
        
        deleted = await application_analytics_dao.delete_goal(goal_id)
        
        if deleted == 0:
            raise HTTPException(400, "Goal not found")
        
        return {"detail": "Goal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete goal: {str(e)}")