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