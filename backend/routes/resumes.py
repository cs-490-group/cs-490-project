from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from pymongo.errors import DuplicateKeyError
import tempfile
import requests
import asyncio
from concurrent.futures import ThreadPoolExecutor

from mongo.resumes_dao import resumes_dao
from mongo.jobs_dao import jobs_dao
from sessions.session_authorizer import authorize
from schema.Resume import Resume, ResumeVersion, ResumeFeedback, ResumeShare,ApprovalRequest
from services.resume_validator import ResumeValidator
from services.ai_generator import AIGenerator
from services.html_pdf_generator import HTMLPDFGenerator

resumes_router = APIRouter(prefix = "/resumes")

@resumes_router.post("", tags = ["resumes"])
async def add_resume(resume: Resume, uuid: str = Depends(authorize)):
    try:
        model = resume.model_dump()

        model["uuid"] = uuid
        result = await resumes_dao.add_resume(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Resume already exists") # FIXME: redundant since keys are generated uniquely?
    except Exception as e:
        raise HTTPException(500, "Encountered internal server error")

    return {"detail": "Sucessfully added resume", "resume_id": result}

@resumes_router.get("", tags = ["resumes"])
async def get_resume(resume_id: str, uuid: str = Depends(authorize)):
    try:
        result = await resumes_dao.get_resume(resume_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if result:
        result["_id"] = str(result["_id"])
        return result
    else:
        raise HTTPException(400, "Resume not found")

@resumes_router.get("/me", tags = ["resumes"])
async def get_all_resumes(uuid: str = Depends(authorize)):
    try:
        results = await resumes_dao.get_all_resumes(uuid)
        # NOTE: do not raise http exception for empty resumes, as it can lead to inconsistent behavior on the frontend
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    return results

# PUBLIC: Get resume by share token (no auth required)
# This must come BEFORE other /{param} routes to be matched correctly
@resumes_router.get("/public/{token}", tags = ["resumes"])
async def get_shared_resume(token: str):
    print(f"[DEBUG] Getting shared resume with token: {token}")
    try:
        print(f"[DEBUG] Calling get_resume_by_share_token...")
        result = await resumes_dao.get_resume_by_share_token(token)
        print(f"[DEBUG] Got result: {result is not None}")
    except Exception as e:
        print(f"[DEBUG] Exception: {e}")
        raise HTTPException(500, "Encountered internal service error")

    if result:
        print(f"[DEBUG] Returning result")
        return result
    else:
        print(f"[DEBUG] Token invalid or expired")
        raise HTTPException(400, "Invalid or expired share link")

# PUBLIC: Add feedback to shared resume (no auth required)
@resumes_router.post("/public/{token}/feedback", tags = ["resumes"])
async def add_feedback_to_shared_resume(token: str, feedback: ResumeFeedback):
    print(f"[DEBUG] Public feedback endpoint called with token: {token}")
    print(f"[DEBUG] Feedback data: {feedback}")
    try:
        # First verify the token is valid and get the resume
        resume = await resumes_dao.get_resume_by_share_token(token)
        print(f"[DEBUG] Got resume: {resume is not None}")
        if not resume:
            raise HTTPException(400, "Invalid or expired share link")

        # Check if comments are allowed
        can_comment = resume.get("share_settings", {}).get("can_comment", False)
        print(f"[DEBUG] Can comment: {can_comment}")
        if not can_comment:
            raise HTTPException(403, "Comments are not allowed for this shared resume")

        # Add feedback to the resume
        model = feedback.model_dump()
        print(f"[DEBUG] Feedback model: {model}")
        model["resume_id"] = resume["_id"]  # Use the resume's _id, not the share's _id
        result = await resumes_dao.add_resume_feedback(model)
        print(f"[DEBUG] Feedback added with ID: {result}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG] Exception in public feedback: {e}")
        raise HTTPException(500, f"Encountered internal service error: {str(e)}")

    return {"detail": "Feedback added successfully", "feedback_id": result}

@resumes_router.put("", tags = ["resumes"])
async def update_resume(resume_id: str, resume: Resume, uuid: str = Depends(authorize)):
    try:
        model = resume.model_dump(exclude_unset = True)
        updated = await resumes_dao.update_resume(resume_id, model)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if updated == 0:
        raise HTTPException(400, "Resume not found")
    else:
        return {"detail": "Successfully updated resume"}

@resumes_router.delete("", tags = ["resumes"])
async def delete_resume(resume_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await resumes_dao.delete_resume(resume_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if deleted == 0:
        raise HTTPException(400, "Resume not found")
    else:
        return {"detail": "Successfully deleted resume"}

# SET DEFAULT RESUME
@resumes_router.put("/{resume_id}/set-default", tags = ["resumes"])
async def set_default_resume(resume_id: str, uuid: str = Depends(authorize)):
    try:
        updated = await resumes_dao.set_default_resume(resume_id, uuid)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if updated == 0:
        raise HTTPException(400, "Resume not found")
    else:
        return {"detail": "Successfully set default resume"}

# RESUME VALIDATION
@resumes_router.post("/{resume_id}/validate", tags = ["resumes"])
async def validate_resume(resume_id: str, uuid: str = Depends(authorize)):
    """
    Comprehensive resume validation and ATS scoring
    Related to UC-053: Resume Preview and Validation

    Returns:
    {
        valid: bool,
        score: 0-100 (overall validation score),
        ats_score: 0-100 (ATS compatibility score),
        errors: [critical issues],
        warnings: [non-critical issues],
        suggestions: [improvement recommendations],
        missing_sections: [incomplete sections],
        metrics: {word_count, character_count, page estimate, etc},
        summary: readable summary
    }
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Validate resume
        validation_result = ResumeValidator.validate_resume(resume)

        return validation_result

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[Resume Validation] Error: {error_msg}")
        raise HTTPException(500, f"Validation error: {error_msg}")

# ============================================
# AI-POWERED RESUME FEATURES
# ============================================

# UC-047: GENERATE RESUME CONTENT
@resumes_router.post("/{resume_id}/generate-content", tags = ["resumes"])
async def generate_resume_content(resume_id: str, request: Request, uuid: str = Depends(authorize)):
    """
    UC-047: Generate AI resume content based on job posting

    Request body:
    {
        'job_posting': {
            'title': str,
            'description': str,
            'requirements': str
        }
    }

    Returns:
    {
        'generated_summary': str,
        'generated_bullets': [str],
        'suggested_skills': [str],
        'relevance_score': int,
        'keywords_found': [str]
    }
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Get job posting from request body
        try:
            body = await request.json()
            job_posting = body.get("job_posting", {})

            if not job_posting or not job_posting.get("title"):
                raise HTTPException(400, "Job posting with title is required")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(400, f"Invalid request body: {str(e)}")

        # Generate content using AI
        result = AIGenerator.generate_ai_content(resume, job_posting)

        return result

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[AI Generate Content] Error: {error_msg}")
        raise HTTPException(500, f"Content generation error: {error_msg}")


# UC-049: OPTIMIZE SKILLS
@resumes_router.post("/{resume_id}/optimize-skills", tags = ["resumes"])
async def optimize_resume_skills(resume_id: str, request: Request, uuid: str = Depends(authorize)):
    """
    UC-049: Optimize resume skills based on job posting

    Request body:
    {
        'job_posting': {
            'title': str,
            'description': str,
            'requirements': str
        }
    }

    Returns:
    {
        'skills_to_emphasize': [str],
        'recommended_skills': [str],
        'missing_skills': [str],
        'optimization_score': int,
        'total_match': str
    }
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Get job posting from request body
        try:
            body = await request.json()
            job_posting = body.get("job_posting", {})

            if not job_posting or not job_posting.get("title"):
                raise HTTPException(400, "Job posting with title is required")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(400, f"Invalid request body: {str(e)}")

        # Optimize skills using AI
        result = AIGenerator.optimize_skills(resume, job_posting)

        return result

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[AI Optimize Skills] Error: {error_msg}")
        raise HTTPException(500, f"Skills optimization error: {error_msg}")


# UC-050: TAILOR EXPERIENCE
@resumes_router.post("/{resume_id}/tailor-experience", tags = ["resumes"])
async def tailor_resume_experience(resume_id: str, request: Request, uuid: str = Depends(authorize)):
    """
    UC-050: Generate tailored experience descriptions based on job posting

    Request body:
    {
        'job_posting': {
            'title': str,
            'description': str,
            'requirements': str
        }
    }

    Returns:
    {
        'tailored_experiences': [
            {
                'index': int,
                'original': str,
                'title': str,
                'variations': [str],
                'relevance_score': int,
                'matched_keywords': [str]
            }
        ],
        'total_experiences': int,
        'average_relevance': int
    }
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Get job posting from request body
        try:
            body = await request.json()
            job_posting = body.get("job_posting", {})

            if not job_posting or not job_posting.get("title"):
                raise HTTPException(400, "Job posting with title is required")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(400, f"Invalid request body: {str(e)}")

        # Tailor experience using AI
        result = AIGenerator.tailor_experience(resume, job_posting)

        return result

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[AI Tailor Experience] Error: {error_msg}")
        raise HTTPException(500, f"Experience tailoring error: {error_msg}")

# RESUME VERSIONS
@resumes_router.post("/{resume_id}/versions", tags = ["resumes"])
async def create_resume_version(resume_id: str, version: ResumeVersion, uuid: str = Depends(authorize)):
    try:
        model = version.model_dump()
        result = await resumes_dao.create_resume_version(resume_id, model)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    return {"detail": "Successfully created version", "version_id": result}

@resumes_router.get("/{resume_id}/versions", tags = ["resumes"])
async def get_resume_versions(resume_id: str, uuid: str = Depends(authorize)):
    try:
        results = await resumes_dao.get_resume_versions(resume_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    return results

@resumes_router.post("/{resume_id}/versions/{version_id}/restore", tags = ["resumes"])
async def restore_resume_version(resume_id: str, version_id: str, uuid: str = Depends(authorize)):
    try:
        updated = await resumes_dao.restore_resume_version(resume_id, version_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if updated == 0:
        raise HTTPException(400, "Version or resume not found")
    else:
        return {"detail": "Successfully restored version"}

@resumes_router.delete("/{resume_id}/versions/{version_id}", tags = ["resumes"])
async def delete_resume_version(resume_id: str, version_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await resumes_dao.delete_resume_version(version_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if deleted == 0:
        raise HTTPException(400, "Version not found")
    else:
        return {"detail": "Successfully deleted version"}

@resumes_router.put("/{resume_id}/versions/{version_id}/rename", tags = ["resumes"])
async def rename_resume_version(resume_id: str, version_id: str, name: str, description: str = None, job_linked: str = None, uuid: str = Depends(authorize)):
    """Rename a resume version and optionally update description and job link"""
    try:
        if not name or not name.strip():
            raise HTTPException(400, "Version name is required")
        updated = await resumes_dao.rename_resume_version(version_id, name.strip(), description, job_linked)
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if updated == 0:
        raise HTTPException(400, "Version not found")
    else:
        return {"detail": "Successfully renamed version"}

# RESUME FEEDBACK
@resumes_router.post("/{resume_id}/feedback", tags = ["resumes"])
async def add_resume_feedback(resume_id: str, feedback: ResumeFeedback, uuid: str = Depends(authorize)):
    try:
        model = feedback.model_dump()
        model["resume_id"] = resume_id
        result = await resumes_dao.add_resume_feedback(model)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    return {"detail": "Feedback added successfully", "feedback_id": result}

@resumes_router.get("/{resume_id}/feedback", tags = ["resumes"])
async def get_resume_feedback(resume_id: str, uuid: str = Depends(authorize)):
    try:
        results = await resumes_dao.get_resume_feedback(resume_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    return results

@resumes_router.put("/{resume_id}/feedback/{feedback_id}", tags = ["resumes"])
async def update_resume_feedback(resume_id: str, feedback_id: str, feedback: ResumeFeedback, uuid: str = Depends(authorize)):
    try:
        model = feedback.model_dump(exclude_unset = True)
        updated = await resumes_dao.update_resume_feedback(feedback_id, model)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if updated == 0:
        raise HTTPException(400, "Feedback not found")
    else:
        return {"detail": "Feedback updated successfully"}

@resumes_router.delete("/{resume_id}/feedback/{feedback_id}", tags = ["resumes"])
async def delete_resume_feedback(resume_id: str, feedback_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await resumes_dao.delete_resume_feedback(feedback_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if deleted == 0:
        raise HTTPException(400, "Feedback not found")
    else:
        return {"detail": "Successfully deleted feedback"}

# RESUME SHARING
@resumes_router.post("/{resume_id}/share", tags = ["resumes"])
async def create_share_link(resume_id: str, share: ResumeShare, uuid: str = Depends(authorize)):
    try:
        model = share.model_dump()
        result = await resumes_dao.create_share_link(resume_id, model)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    return {"detail": "Share link generated", "share_link": result.get("token"), "share_data": result}

@resumes_router.get("/{resume_id}/share", tags = ["resumes"])
async def get_share_link(resume_id: str, uuid: str = Depends(authorize)):
    try:
        result = await resumes_dao.get_share_link(resume_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if result:
        return result
    else:
        raise HTTPException(400, "No active share link found")

@resumes_router.delete("/{resume_id}/share", tags = ["resumes"])
async def revoke_share_link(resume_id: str, uuid: str = Depends(authorize)):
    try:
        updated = await resumes_dao.revoke_share_link(resume_id)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if updated == 0:
        raise HTTPException(400, "Share link not found")
    else:
        return {"detail": "Share link revoked successfully"}

# ============================================
# EXPORT RESUME AS PDF (Windows-compatible)
# ============================================

def _generate_pdf_sync(html_content: str) -> bytes:
    """Synchronous wrapper for Playwright PDF generation (Windows-compatible)"""
    import asyncio
    from playwright.sync_api import sync_playwright
    
    try:
        print(f"[PDF Sync] Starting synchronous PDF generation...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(html_content)
            
            # Generate PDF
            pdf_bytes = page.pdf(
                format='Letter',
                margin={'top': '0.5in', 'right': '0.5in', 'bottom': '0.5in', 'left': '0.5in'},
            )
            
            browser.close()
            print(f"[PDF Sync] PDF generated successfully, size: {len(pdf_bytes)} bytes")
            return pdf_bytes
    except Exception as e:
        print(f"[PDF Sync] ERROR: {type(e).__name__}: {str(e)}")
        raise


@resumes_router.post("/{resume_id}/export-pdf", tags=["resumes"])
async def export_resume_pdf(resume_id: str, uuid: str = Depends(authorize)):
    """Export resume as PDF using Playwright (Windows-compatible version)"""
    tmp_path = None
    try:
        print(f"[PDF Export] Starting export for resume_id: {resume_id}")
        
        # Get resume data
        resume = await resumes_dao.get_resume(resume_id)
        if not resume:
            print(f"[PDF Export] Resume not found: {resume_id}")
            raise HTTPException(404, "Resume not found")
        
        print(f"[PDF Export] Resume found: {resume.get('name', 'unnamed')}")
        
        # Verify ownership
        if resume.get("uuid") != uuid:
            print(f"[PDF Export] Unauthorized access attempt")
            raise HTTPException(403, "Not authorized to access this resume")
        
        print(f"[PDF Export] Building HTML...")
        # Build HTML from resume data
        resume_html = HTMLPDFGenerator.build_resume_html_from_data(resume)
        full_html = HTMLPDFGenerator.wrap_resume_html(
            resume_html, 
            resume.get('colors'), 
            resume.get('fonts')
        )
        
        print(f"[PDF Export] HTML built, length: {len(full_html)} chars")
        print(f"[PDF Export] Generating PDF with Playwright (sync mode)...")
        
        # Run synchronous Playwright in a thread pool to avoid Windows asyncio issues
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            pdf_bytes = await loop.run_in_executor(executor, _generate_pdf_sync, full_html)
        
        print(f"[PDF Export] PDF generated successfully, size: {len(pdf_bytes)} bytes")
        
        filename = f"{resume.get('name', 'resume')}.pdf"
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        
        print(f"[PDF Export] Temporary file created at: {tmp_path}")
        print(f"[PDF Export] Returning FileResponse with filename: {filename}")
        
        return FileResponse(
            tmp_path,
            media_type='application/pdf',
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PDF Export] ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to export resume PDF: {str(e)}")
    
@resumes_router.post("/public/{token}/status", tags=["resumes"])
async def set_public_resume_status(token: str, request: ApprovalRequest):
    """Allow a reviewer to set approval status"""
    resume = await resumes_dao.get_resume_by_share_token(token)
    if not resume:
        raise HTTPException(400, "Invalid token")
    
    # Check permissions (reuse comment permission or assume reviewers can approve)
    if not resume.get("share_settings", {}).get("can_comment"):
        raise HTTPException(403, "Reviewer permissions disabled")

    await resumes_dao.update_approval_status(resume["_id"], request.status)
    return {"detail": f"Status updated to {request.status}"}

@resumes_router.get("/analytics/impact", tags=["resumes"])
async def get_review_impact_stats(uuid: str = Depends(authorize)):
    """
    compares succsess of review and non-reviewed resumes.
    """
    try:
        jobs = await jobs_dao.get_all_jobs(uuid)
        resumes = await resumes_dao.get_all_resumes(uuid)
        
        # Create a map for each resume's status.
        # Resume is "Reviewed" if it is approved OR has feedback
        resume_status = {}
        for r in resumes:
            r_id = str(r["_id"])
            # Check if approved
            is_approved = r.get("approval_status") == "approved"
            
            # Check if has feedback (need to check feedback collection)
            feedback = await resumes_dao.get_resume_feedback(r_id)
            has_feedback = len(feedback) > 0
            
            resume_status[r_id] = is_approved or has_feedback

        reviewed_stats = {"total": 0, "success": 0}   # Interview or Offer
        unreviewed_stats = {"total": 0, "success": 0}
        
        for job in jobs:
            # Check if job has a linked resume
            materials = job.get("materials", {})
            if not materials or not materials.get("resume_id"):
                continue
                
            rid = materials.get("resume_id")
            is_success = job.get("status") in ["Interview", "Offer"]
            
            if resume_status.get(rid):
                reviewed_stats["total"] += 1
                if is_success: reviewed_stats["success"] += 1
            else:
                unreviewed_stats["total"] += 1
                if is_success: unreviewed_stats["success"] += 1
                

        def calc_rate(stats):
            if stats["total"] == 0: return 0
            return round((stats["success"] / stats["total"]) * 100, 1)

        return {
            "reviewed": {
                "count": reviewed_stats["total"],
                "success_rate": calc_rate(reviewed_stats),
                "interviews": reviewed_stats["success"]
            },
            "unreviewed": {
                "count": unreviewed_stats["total"],
                "success_rate": calc_rate(unreviewed_stats),
                "interviews": unreviewed_stats["success"]
            },
            "lift": calc_rate(reviewed_stats) - calc_rate(unreviewed_stats)
        }

    except Exception as e:
        print(f"Error calculating impact: {e}")
        raise HTTPException(500, str(e))