from fastapi import APIRouter, HTTPException, Depends, Body, UploadFile, File
from fastapi.responses import StreamingResponse
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timezone
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from io import BytesIO

from mongo.jobs_dao import jobs_dao
from mongo.media_dao import media_dao
from mongo.resumes_dao import resumes_dao
from mongo.cover_letters_dao import cover_letters_dao
from sessions.session_authorizer import authorize
from schema.Job import Job, UrlBody

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


@jobs_router.post("", tags=["jobs"])
async def add_job(job: Job, uuid: str = Depends(authorize)):
    try:
        model = job.model_dump()
        model["uuid"] = uuid
        result = await jobs_dao.add_job(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Job already exists")
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal server error")
    
    return {"detail": "Successfully added job", "job_id": result}


@jobs_router.get("", tags=["jobs"])
async def get_job(job_id: str, uuid: str = Depends(authorize)):
    try:
        result = await jobs_dao.get_job(job_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
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
        raise HTTPException(500, "Encountered internal service error")
    
    return results


@jobs_router.put("", tags=["jobs"])
async def update_job(job_id: str, job: Job, uuid: str = Depends(authorize)):    
    try:
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
    except Exception as e:
        print(f"Error updating job: {e}")
        raise HTTPException(500, "Encountered internal service error")
    
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
        raise HTTPException(500, "Encountered internal service error")

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
        #print(f"Traceback: {traceback.format_exc()}")
        print(f"{'='*60}\n")
        raise HTTPException(500, f"Failed to import job posting: {str(e)}")


@jobs_router.post("/upload-company-image", tags=["jobs"])
async def upload_image(job_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        media_id = await media_dao.add_media(job_id, media.filename, await media.read(), media.content_type)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if not media_id:
        raise HTTPException(500, "Unable to upload media")
    
    return {"detail": "Successfully uploaded file", "media_id": media_id}


@jobs_router.post("/download-company-image", tags=["jobs"])
async def download_image(media_id: str, uuid: str = Depends(authorize)):
    try:
        media = await media_dao.get_media(media_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
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