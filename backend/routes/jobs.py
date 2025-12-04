from fastapi import APIRouter, HTTPException, Depends, Request, Body, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timezone
import smtplib, os, tempfile
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from io import BytesIO
import traceback

from mongo.jobs_dao import jobs_dao
from mongo.media_dao import media_dao
from mongo.resumes_dao import resumes_dao
from mongo.cover_letters_dao import cover_letters_dao
from mongo.teams_dao import teams_dao 
from mongo.progress_sharing_dao import progress_sharing_dao
from sessions.session_authorizer import authorize
from schema.Job import Job, UrlBody
from services.html_pdf_generator import HTMLPDFGenerator
from services.company_research import run_company_research
from services.company_news import run_company_news
from services.job_requirements_extractor import (
    extract_skills,
    extract_years_experience,
    extract_education_level,
)
from mongo.job_requirements_extractor_dao import job_requirements_extractor_dao


from services.salary_research import generate_job_salary_negotiation


# Import the new enhanced scraper
from webscrape.job_scraper import job_from_url, URLScrapeError

jobs_router = APIRouter(prefix="/jobs")


def send_deadline_reminder_email(recipient_email: str, job_title: str, company: str, deadline: str, days_until: int):
    """Send a deadline reminder email to the user"""
    sender_email = os.getenv("GMAIL_SENDER")
    sender_password = os.getenv("GMAIL_APP_PASSWORD")
    
    if not sender_email or not sender_password:
        raise ValueError("Email credentials not configured")
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = f"⏰ Reminder: {company} Application Deadline"
    message["From"] = sender_email
    message["To"] = recipient_email
    
    # Determine urgency level
    if days_until < 0:
        urgency = "OVERDUE"
        urgency_color = "#dc3545"
        deadline_text = f"This deadline was {abs(days_until)} day(s) ago!"
    elif days_until == 0:
        urgency = "TODAY"
        urgency_color = "#fd7e14"
        deadline_text = "This deadline is TODAY!"
    elif days_until == 1:
        urgency = "TOMORROW"
        urgency_color = "#ffc107"
        deadline_text = "This deadline is TOMORROW!"
    elif days_until <= 3:
        urgency = "URGENT"
        urgency_color = "#ffc107"
        deadline_text = f"Only {days_until} days left!"
    elif days_until <= 7:
        urgency = "THIS WEEK"
        urgency_color = "#00bf72"
        deadline_text = f"{days_until} days remaining"
    else:
        urgency = "UPCOMING"
        urgency_color = "#008793"
        deadline_text = f"{days_until} days remaining"
    
    # Format deadline date
    try:
        deadline_date = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
        formatted_deadline = deadline_date.strftime("%B %d, %Y")
    except:
        formatted_deadline = deadline
    
    # Plain text version
    text = f"""
Job Application Deadline Reminder
{urgency}: {deadline_text}

Position: {job_title}
Company: {company}
Deadline: {formatted_deadline}

Don't forget to complete your application!

---
This is an automated reminder from your Job Opportunities Tracker.
"""
    
    # HTML version
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #004d7a, #008793, #00bf72); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">⏰ Deadline Reminder</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 20px 20px 20px; text-align: center;">
                            <div style="display: inline-block; background-color: {urgency_color}; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 18px;">
                                {urgency}
                            </div>
                            <p style="margin: 15px 0 0 0; font-size: 16px; color: #333; font-weight: 600;">
                                {deadline_text}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Position:</strong><br>
                                        <span style="color: #004d7a; font-size: 18px; font-weight: 600;">{job_title}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Company:</strong><br>
                                        <span style="color: #333; font-size: 16px;">{company}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Deadline:</strong><br>
                                        <span style="color: #333; font-size: 16px;">📅 {formatted_deadline}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/jobs" 
                               style="display: inline-block; background-color: #00bf72; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 10px rgba(0, 191, 114, 0.3);">
                                View in Job Tracker
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px;">
                                This is an automated reminder from your Job Opportunities Tracker
                            </p>
                            <p style="margin: 0; color: #ccc; font-size: 12px;">
                                Don't forget to complete your application!
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    
    # Attach both versions
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)
    
    # Send email
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise


async def check_and_log_milestones(uuid: str, job_data: dict, old_job_data: dict = None):
    """
    Triggers milestones when jobs are created or status changes.
    """
    
    try:
        # Get Team Info
        team = await teams_dao.get_user_team(uuid)
        
        if not team:
            print(f"[Milestones]STOPPING: User {uuid} is not in any team.")
            print(f"[Milestones] Fix: Go to 'Setup Team' or 'Teams Dashboard' to create/join a team.")
            return

        team_id = team["_id"]
        print(f"[Milestones] Found Team: {team.get('name')} (ID: {team_id})")

        # Compare Statuses
        new_status = job_data.get("status")
        old_status = old_job_data.get("status") if old_job_data else None
        
        print(f"[Milestones] Status Comparison: Old='{old_status}' -> New='{new_status}'")

        #  Check for Status Change Milestones
        if new_status == "Interview" and old_status != "Interview":
            print("[Milestones] TRIGGER: Interview Milestone detected")
            await progress_sharing_dao.log_milestone(team_id, uuid, {
                "id": f"int_{datetime.utcnow().timestamp()}",
                "title": " Interview Scheduled!",
                "description": f"Interview for {job_data.get('title', 'Role')} at {job_data.get('company', 'Company')}",
                "achieved_date": datetime.utcnow(),
                "category": "interview_scheduled",
                "impact_score": 7
            })
            print("[Milestones] Interview Logged")

        elif new_status == "Offer" and old_status != "Offer":
            print("[Milestones]  TRIGGER: Offer Milestone detected")
            await progress_sharing_dao.log_milestone(team_id, uuid, {
                "id": f"off_{datetime.utcnow().timestamp()}",
                "title": " Offer Received!",
                "description": f"Offer from {job_data.get('company', 'Company')}!",
                "achieved_date": datetime.utcnow(),
                "category": "offer_received",
                "impact_score": 10
            })


        # Check for New Job / Application Count Milestones
        if not old_job_data:
   
            await teams_dao.update_member_activity(team_id, uuid, "application_sent")
            
            all_jobs = await jobs_dao.get_all_jobs(uuid)
            count = len(all_jobs)
            
            milestone_title = None
            if count == 1: milestone_title = "First Application Sent!"
            elif count == 5: milestone_title = "5 Applications Sent!"
            elif count == 10: milestone_title = "10 Applications Sent!"
            elif count == 25: milestone_title = "25 Applications Sent!"
            elif count == 50: milestone_title = "50 Applications Sent!"

            if milestone_title:
                print(f"[Milestones] TRIGGER: {milestone_title}")
                await progress_sharing_dao.log_milestone(team_id, uuid, {
                    "id": f"apps_{count}_{datetime.utcnow().timestamp()}",
                    "title": f"📧 {milestone_title}",
                    "description": f"You've sent {count} job applications. Keep going!",
                    "achieved_date": datetime.utcnow(),
                    "category": "applications_milestone",
                    "impact_score": 5
                })
                print("[Milestones] Application Count Logged")
            else:
                print(f"[Milestones] Count {count} is not a milestone threshold")

    except Exception as e:
        print(f"[Milestones] CRITICAL ERROR: {str(e)}")
        traceback.print_exc()


@jobs_router.post("", tags=["jobs"])
async def add_job(job: Job, uuid: str = Depends(authorize)):
    try:
        model = job.model_dump()
        model["uuid"] = uuid
        
        # Extract Company Name
        company_name = None
        if isinstance(job.company, str):
            company_name = job.company
        elif isinstance(job.company, dict):
            company_name = job.company.get("name") or job.company.get("company")
        elif model.get("company"):
            company_name = model["company"]

        # Extract job description for requirements extraction
        description = model.get("description", "") or ""
        
        # Extract requirements from description
        required_skills = extract_skills(description)
        min_years = extract_years_experience(description)
        edu_level = extract_education_level(description)

        # Add extracted requirements to model
        model["requiredSkills"] = required_skills
        model["minYearsExperience"] = min_years
        model["educationLevel"] = edu_level

        print("📌 Auto-extracted requirements:")
        print("   Skills:", required_skills)
        print("   Min experience:", min_years)
        print("   Education:", edu_level)

        # PHASE 1: Create the job immediately WITHOUT research data
        job_id = await jobs_dao.add_job(model)
        print(f"✅ Job created successfully with ID: {job_id}")

        # Store extraction snapshot separately for auditing
        try:
            await job_requirements_extractor_dao.save_requirements(
                uuid=uuid,
                job_id=job_id,
                description=description,
                required_skills=required_skills,
                min_years_experience=min_years,
                education_level=edu_level,
            )
            print(f"✅ Requirements snapshot saved for job {job_id}")
        except Exception as e:
            print(f"⚠️ Failed to save requirements snapshot: {str(e)}")

        # PHASE 2: Add research data asynchronously (non-blocking)
        # If this fails, the job still exists
        if company_name:
            try:
                print(f"🔍 Starting automated research for company: {company_name}")
                
                # Run company research
                research_result = await run_company_research(company_name)
                
                # Run company news
                news_result = await run_company_news(company_name)
                
                # Run salary negotiation research
                salary_negotiation = None
                try:
                    salary_negotiation = await generate_job_salary_negotiation(
                        job_title=model.get("title", ""),
                        company=company_name,
                        location=model.get("location", ""),
                        company_size=research_result.get("basic_info", {}).get("size") if research_result else None
                    )
                except Exception as e:
                    print(f"⚠️ Failed to generate salary negotiation: {str(e)}")
                
                # Update job with research data
                research_update = {}
                if research_result:
                    research_update["company_research"] = research_result
                if news_result:
                    research_update["company_news"] = news_result
                if salary_negotiation:
                    research_update["salary_negotiation"] = salary_negotiation
                
                if research_update:
                    await jobs_dao.update_job(job_id, research_update)
                    print(f"✅ Research data added to job {job_id}")
                
            except Exception as research_error:
                # Log the error but don't fail the job creation
                print(f"⚠️ Research failed for job {job_id}: {str(research_error)}")
                print(f"Job was still created successfully")

        # Fetch the created job to return full object
        created_job = await jobs_dao.get_job(job_id)
        if created_job:
            created_job["_id"] = str(created_job["_id"])

        # TRIGGER MILESTONE CHECK
        print(f"[Jobs Router] Job Added. ID: {job_id}")
        await check_and_log_milestones(uuid, model, old_job_data=None)
        
        return {
            "detail": "Successfully added job",
            "job_id": job_id,
            "job": created_job
        }
        
    except DuplicateKeyError:
        raise HTTPException(400, "Job already exists")
    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"[Jobs Router] Add Error: {e}")
        traceback.print_exc()
        raise HTTPException(500, "Encountered internal server error")
        
# NEW ENDPOINT: Retry research for an existing job
@jobs_router.post("/{job_id}/retry-research", tags=["jobs"])
async def retry_job_research(job_id: str, uuid: str = Depends(authorize)):
    """Retry automated research for a job that failed during creation"""
    try:
        job = await jobs_dao.get_job(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        
        # Extract company name
        company_name = None
        if isinstance(job.get("company"), str):
            company_name = job["company"]
        elif isinstance(job.get("company"), dict):
            company_name = job["company"].get("name")
        
        if not company_name:
            raise HTTPException(400, "Job has no company name")
        
        print(f"🔄 Retrying research for job {job_id}, company: {company_name}")
        
        research_update = {}
        
        # Run company research
        try:
            research_result = await run_company_research(company_name)
            if research_result:
                research_update["company_research"] = research_result
        except Exception as e:
            print(f"⚠️ Company research failed: {str(e)}")
        
        # Run company news
        try:
            news_result = await run_company_news(company_name)
            if news_result:
                research_update["company_news"] = news_result
        except Exception as e:
            print(f"⚠️ Company news failed: {str(e)}")
        
        # Run salary negotiation
        try:
            salary_negotiation = await generate_job_salary_negotiation(
                job_title=job.get("title", ""),
                company=company_name,
                location=job.get("location", ""),
                company_size=research_update.get("company_research", {}).get("basic_info", {}).get("size") if research_update.get("company_research") else None
            )
            if salary_negotiation:
                research_update["salary_negotiation"] = salary_negotiation
        except Exception as e:
            print(f"⚠️ Salary negotiation failed: {str(e)}")
        
        if not research_update:
            raise HTTPException(500, "All research attempts failed")
        
        # Update job with research data
        await jobs_dao.update_job(job_id, research_update)
        
        return {
            "detail": "Research completed successfully",
            "updated_fields": list(research_update.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrying research: {e}")
        traceback.print_exc()
        raise HTTPException(500, f"Failed to retry research: {str(e)}")

@jobs_router.get("", tags=["jobs"])
async def get_job(job_id: str, uuid: str = Depends(authorize)):
    try:
        result = await jobs_dao.get_job(job_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result:
        result["_id"] = str(result["_id"])
        
        # Enrich with materials details if they exist
        if result.get("materials"):
            materials = result["materials"]
            
            if materials.get("resume_id"):
                try:
                    resume = await resumes_dao.get_resume(materials["resume_id"])
                    if resume:
                        materials["resume_name"] = resume.get("name", "Unnamed Resume")
                        materials["resume_version"] = resume.get("version_name", "Version 1")
                except Exception as e:
                    print(f"Error fetching resume details: {e}")
            
            if materials.get("cover_letter_id"):
                try:
                    cover_letter = await cover_letters_dao.get_cover_letter(
                        materials["cover_letter_id"], uuid
                    )
                    if cover_letter:
                        materials["cover_letter_name"] = cover_letter.get("title", "Unnamed Cover Letter")
                        materials["cover_letter_version"] = cover_letter.get("version_name", "Version 1")
                except Exception as e:
                    print(f"Error fetching cover letter details: {e}")
        
        result["company_research"] = result.get("company_research", None)
        result["company_news"] = result.get("company_news", None)
        result["salary_negotiation"] = result.get("salary_negotiation", None)
    
        return result
    else:
        raise HTTPException(400, "Job not found")


@jobs_router.get("/me", tags=["jobs"])
async def get_all_jobs(uuid: str = Depends(authorize)):
    try:
        results = await jobs_dao.get_all_jobs(uuid)
        
        for job in results:
            if job.get("materials"):
                materials = job["materials"]
                
                if materials.get("resume_id"):
                    try:
                        resume = await resumes_dao.get_resume(materials["resume_id"])
                        if resume:
                            materials["resume_name"] = resume.get("name", "Unnamed Resume")
                            materials["resume_version"] = resume.get("version_name", "Version 1")
                    except Exception as e:
                        print(f"Error fetching resume details: {e}")
                
                if materials.get("cover_letter_id"):
                    try:
                        cover_letter = await cover_letters_dao.get_cover_letter(
                            materials["cover_letter_id"], uuid
                        )
                        if cover_letter:
                            materials["cover_letter_name"] = cover_letter.get("title", "Unnamed Cover Letter")
                            materials["cover_letter_version"] = cover_letter.get("version_name", "Version 1")
                    except Exception as e:
                        print(f"Error fetching cover letter details: {e}")
        
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results


@jobs_router.put("", tags=["jobs"])
async def update_job(job_id: str, job: Job, uuid: str = Depends(authorize)):    
    try:
        # Get old data for comparison
        old_job = await jobs_dao.get_job(job_id)
        if not old_job:
            raise HTTPException(400, "Job not found")

        model = job.model_dump(exclude_unset=True)
        
        
        if model.get("materials"):
            print(f"Updating job {job_id} with materials: {model['materials']}")
            materials = model["materials"]
            
            if materials.get("resume_id"):
                try:
                    resume = await resumes_dao.get_resume(materials["resume_id"])
                    if resume:
                        materials["resume_name"] = resume.get("name", "Unnamed Resume")
                        materials["resume_version"] = resume.get("version_name", "Version 1")
                except Exception as e:
                    print(f"Error fetching resume details: {e}")
            
            if materials.get("cover_letter_id"):
                try:
                    cover_letter = await cover_letters_dao.get_cover_letter(
                        materials["cover_letter_id"], uuid
                    )
                    if cover_letter:
                        materials["cover_letter_name"] = cover_letter.get("title", "Unnamed Cover Letter")
                        materials["cover_letter_version"] = cover_letter.get("version_name", "Version 1")
                except Exception as e:
                    print(f"Error fetching cover letter details: {e}")
            
            model["materials"] = materials
        
        updated = await jobs_dao.update_job(job_id, model)

        # TRIGGER MILESTONE CHECK
        if updated:
            print(f"[Jobs Router] Job Updated. ID: {job_id}")
            # Merge old data with new model to get complete picture for milestone description
            merged_data = {**old_job, **model}
            await check_and_log_milestones(uuid, merged_data, old_job_data=old_job)

    except Exception as e:
        raise HTTPException(500, str(e))
    
    if updated == 0:
        raise HTTPException(400, "Job not found")
    else:
        return {
            "detail": "Successfully updated job",
            "materials": model.get("materials")
        }


@jobs_router.delete("", tags=["jobs"])
async def delete_job(job_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await jobs_dao.delete_job(job_id)
    except Exception as e:
        raise HTTPException(500, str(e))

    if deleted == 0:
        raise HTTPException(400, "Job not found")
    else:
        return {"detail": "Successfully deleted job"}


@jobs_router.post("/import", tags=["jobs"])
async def import_from_url(url: UrlBody):
    """
    Import job data from Indeed, LinkedIn, or Glassdoor URLs
    Supports automatic platform detection and data extraction
    """
    if not url.url:
        raise HTTPException(400, "URL cannot be empty")
    
    if not url.url.startswith(('http://', 'https://')):
        raise HTTPException(400, "URL must start with http:// or https://")
    
    # Log the import attempt
    print(f"\n{'='*60}")
    print(f"🔍 IMPORT REQUEST")
    print(f"{'='*60}")
    print(f"URL: {url.url}")
    
    try:
        # Call the scraper
        data = await job_from_url(url.url)
        
        # Log what we got back
        print(f"\n📊 SCRAPE RESULTS:")
        print(f"   Title: {data.get('title')[:50] if data.get('title') else 'None'}...")
        print(f"   Company: {data.get('company')}")
        print(f"   Location: {data.get('location')}")
        print(f"   Salary: {data.get('salary')}")
        print(f"   Job Type: {data.get('job_type')}")
        print(f"   Industry: {data.get('industry')}")
        print(f"   Description: {len(data.get('description', '')) if data.get('description') else 0} chars")
        
        # Check for company data
        company_data = data.get('company_data')
        if company_data:
            print(f"\n🏢 COMPANY DATA FOUND:")
            for key, value in company_data.items():
                if value:
                    if key == 'image':
                        print(f"   {key}: [Base64 data, {len(value)} chars]")
                    elif key == 'description':
                        print(f"   {key}: {value[:100]}..." if len(value) > 100 else f"   {key}: {value}")
                    else:
                        print(f"   {key}: {value}")
        else:
            print(f"\n⚠️ NO COMPANY DATA RETURNED")
        
        print(f"{'='*60}\n")
        
        # Ensure we return properly formatted data
        response_data = {
            "title": data.get("title"),
            "company": data.get("company"),
            "company_data": data.get("company_data"),
            "location": data.get("location"),
            "salary": data.get("salary"),
            "deadline": data.get("deadline"),
            "industry": data.get("industry"),
            "job_type": data.get("job_type"),
            "description": data.get("description"),
        }
        
        return response_data
        
    except URLScrapeError as e:
        print(f"❌ URLScrapeError: {str(e)}")
        print(f"{'='*60}\n")
        raise HTTPException(400, str(e))
    except ValueError as e:
        print(f"❌ ValueError: {str(e)}")
        print(f"{'='*60}\n")
        raise HTTPException(400, str(e))
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        print(f"{'='*60}\n")
        raise HTTPException(500, f"Failed to import job posting: {str(e)}")


@jobs_router.post("/upload-company-image", tags=["jobs"])
async def upload_image(job_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        media_id = await media_dao.add_media(job_id, media.filename, await media.read(), media.content_type)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media_id:
        raise HTTPException(500, "Unable to upload media")
    
    return {"detail": "Successfully uploaded file", "media_id": media_id}


@jobs_router.post("/download-company-image", tags=["jobs"])
async def download_image(media_id: str, uuid: str = Depends(authorize)):
    try:
        media = await media_dao.get_media(media_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media:
        raise HTTPException(400, "Could not find requested media")
    
    return StreamingResponse(
        BytesIO(media["contents"]),
        media_type=media["content_type"],
        headers={
            "Content-Disposition": f"inline; filename=\"{media['filename']}\""
        }
    )


@jobs_router.post("/send-deadline-reminder", tags=["jobs"])
async def send_deadline_reminder(
    email: str = Body(...),
    jobTitle: str = Body(...),
    company: str = Body(...),
    deadline: str = Body(...),
    daysUntil: int = Body(...),
    uuid: str = Depends(authorize)
):
    """Send a deadline reminder email immediately"""
    try:
        send_deadline_reminder_email(
            recipient_email=email,
            job_title=jobTitle,
            company=company,
            deadline=deadline,
            days_until=daysUntil
        )
        return {"detail": "Reminder email sent successfully"}
    except ValueError as e:
        raise HTTPException(500, f"Email configuration error: {str(e)}")
    except Exception as e:
        print(f"Error sending reminder: {e}")
        raise HTTPException(500, f"Failed to send reminder: {str(e)}")


@jobs_router.get("/{job_id}/materials", tags=["jobs"])
async def get_job_materials(job_id: str, uuid: str = Depends(authorize)):
    """Get full materials details for a job including resume and cover letter data"""
    try:
        job = await jobs_dao.get_job(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        
        if not job.get("materials"):
            return {"materials": None, "resume": None, "cover_letter": None}
        
        materials = job["materials"]
        result = {"materials": materials, "resume": None, "cover_letter": None}
        
        if materials.get("resume_id"):
            try:
                resume = await resumes_dao.get_resume(materials["resume_id"])
                if resume:
                    resume["_id"] = str(resume["_id"])
                    result["resume"] = resume
            except Exception as e:
                print(f"Error fetching resume: {e}")
        
        if materials.get("cover_letter_id"):
            try:
                cover_letter = await cover_letters_dao.get_cover_letter(
                    materials["cover_letter_id"], uuid
                )
                if cover_letter:
                    cover_letter["_id"] = str(cover_letter["_id"])
                    result["cover_letter"] = cover_letter
            except Exception as e:
                print(f"Error fetching cover letter: {e}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting job materials: {e}")
        raise HTTPException(500, "Failed to fetch job materials")


# NEW ENDPOINT: Download linked resume as PDF
@jobs_router.get("/{job_id}/materials/resume/pdf", tags=["jobs"])
async def download_linked_resume_pdf(job_id: str, uuid: str = Depends(authorize)):
    """Download the resume linked to this job as PDF"""
    try:
        import requests
        
        job = await jobs_dao.get_job(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        
        resume_id = job.get("materials", {}).get("resume_id")
        if not resume_id:
            raise HTTPException(404, "No resume linked to this job")
        
        # Get resume data
        resume = await resumes_dao.get_resume(resume_id)
        if not resume:
            raise HTTPException(404, "Resume not found")
        
        # Build HTML from resume data
        resume_html = HTMLPDFGenerator.build_resume_html_from_data(resume)
        full_html = HTMLPDFGenerator.wrap_resume_html(
            resume_html, 
            resume.get('colors'), 
            resume.get('fonts')
        )
        
        # Generate PDF using external service (same as cover letters)
        response = requests.post(
            'https://api.html2pdf.app/v1/generate',
            json={'html': full_html},
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(500, "PDF generation failed")
        
        filename = f"{resume.get('name', 'resume')}.pdf"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        
        return FileResponse(
            tmp_path,
            media_type='application/pdf',
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading resume PDF: {e}")
        raise HTTPException(500, f"Failed to download resume PDF: {str(e)}")


# NEW ENDPOINT: Download linked cover letter as PDF
@jobs_router.get("/{job_id}/materials/cover-letter/pdf", tags=["jobs"])
async def download_linked_cover_letter_pdf(job_id: str, uuid: str = Depends(authorize)):
    """Download the cover letter linked to this job as PDF"""
    try:
        import requests
        
        job = await jobs_dao.get_job(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        
        cover_letter_id = job.get("materials", {}).get("cover_letter_id")
        if not cover_letter_id:
            raise HTTPException(404, "No cover letter linked to this job")
        
        # Get cover letter data
        cover_letter = await cover_letters_dao.get_cover_letter(cover_letter_id, uuid)
        if not cover_letter:
            raise HTTPException(404, "Cover letter not found")
        
        html_content = cover_letter.get("content", "")
        if not html_content:
            raise HTTPException(400, "Cover letter has no content")
        
        filename = f"{cover_letter.get('title', 'cover_letter')}.pdf"
        
        # Use external PDF service
        response = requests.post(
            'https://api.html2pdf.app/v1/generate',
            json={'html': html_content},
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(500, "PDF generation failed")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        
        return FileResponse(
            tmp_path,
            media_type='application/pdf',
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading cover letter PDF: {e}")
        raise HTTPException(500, f"Failed to download cover letter PDF: {str(e)}")