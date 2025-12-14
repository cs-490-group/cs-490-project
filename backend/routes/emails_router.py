"""
Email Integration API Router
Endpoints for Gmail integration and email linking
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from sessions.session_authorizer import authorize
from services.gmail_service import gmail_service
from mongo.linked_emails_dao import linked_emails_dao

emails_router = APIRouter(prefix="/emails")


class LinkEmailRequest(BaseModel):
    """Request to link an email to a job"""
    job_id: str
    email_id: str
    thread_id: Optional[str] = None
    subject: str
    from_email: EmailStr
    from_name: Optional[str] = ""
    date: str
    snippet: str
    detected_status: Optional[str] = None
    notes: Optional[str] = ""


class EmailSearchRequest(BaseModel):
    """Request to search emails"""
    query: str
    max_results: int = 20


class UnlinkEmailRequest(BaseModel):
    """Request to unlink an email"""
    linked_email_id: str


class UpdateEmailNotesRequest(BaseModel):
    """Request to update email notes"""
    linked_email_id: str
    notes: str


@emails_router.get("/auth/status", tags=["emails"])
async def check_gmail_auth_status(uuid: str = Depends(authorize)):
    """
    Check if user has authenticated with Gmail
    Returns authentication status and email address if connected
    """
    try:
        is_authenticated = gmail_service.authenticate(uuid)
        
        if is_authenticated:
            # Get user's email address
            try:
                service = gmail_service.service
                profile = service.users().getProfile(userId='me').execute()
                email_address = profile.get('emailAddress', '')
                
                return {
                    "authenticated": True,
                    "email": email_address
                }
            except Exception as e:
                print(f"Error getting profile: {e}")
                return {"authenticated": True, "email": ""}
        else:
            return {"authenticated": False}
            
    except Exception as e:
        print(f"Error checking auth status: {e}")
        return {"authenticated": False}


@emails_router.get("/auth/connect", tags=["emails"])
async def initiate_gmail_connection(uuid: str = Depends(authorize)):
    """
    Initiate Gmail OAuth flow
    Returns authorization URL for user to visit
    """
    try:
        auth_url = gmail_service.get_oauth_url(uuid)
        return {"auth_url": auth_url}
    except Exception as e:
        print(f"Error initiating Gmail connection: {e}")
        raise HTTPException(500, "Failed to initiate Gmail connection")


@emails_router.get("/auth/callback", tags=["emails"])
async def gmail_oauth_callback(code: str, state: str):
    """
    Handle Gmail OAuth callback
    Redirects to frontend after successful authentication
    """
    try:
        user_id = state  # State contains user_id
        
        success = gmail_service.handle_oauth_callback(code, user_id)
        
        if success:
            # Redirect to frontend with success
            frontend_url = "http://localhost:3000/jobs?gmail_connected=true"
            return RedirectResponse(url=frontend_url)
        else:
            # Redirect to frontend with error
            frontend_url = "http://localhost:3000/jobs?gmail_error=true"
            return RedirectResponse(url=frontend_url)
            
    except Exception as e:
        print(f"Error in OAuth callback: {e}")
        frontend_url = "http://localhost:3000/jobs?gmail_error=true"
        return RedirectResponse(url=frontend_url)


@emails_router.post("/auth/disconnect", tags=["emails"])
async def disconnect_gmail(uuid: str = Depends(authorize)):
    """
    Revoke Gmail access and delete stored credentials
    """
    try:
        success = gmail_service.revoke_access(uuid)
        
        if success:
            return {"detail": "Gmail access revoked successfully"}
        else:
            raise HTTPException(500, "Failed to revoke Gmail access")
            
    except Exception as e:
        print(f"Error disconnecting Gmail: {e}")
        raise HTTPException(500, "Failed to disconnect Gmail")


@emails_router.get("/search/company/{company_name}", tags=["emails"])
async def search_emails_by_company(
    company_name: str,
    days_back: int = Query(90, ge=1, le=365),
    uuid: str = Depends(authorize)
):
    """
    Search emails by company name
    Returns emails from the specified number of days back
    """
    try:
        # Authenticate
        if not gmail_service.authenticate(uuid):
            raise HTTPException(401, "Gmail not connected. Please connect your Gmail account first.")
        
        # Search emails
        emails = gmail_service.search_by_company(company_name, days_back)
        
        # Add status detection
        for email in emails:
            detected_status = gmail_service.detect_status_from_email(
                email['subject'],
                email['snippet']
            )
            email['detected_status'] = detected_status
        
        return {"emails": emails, "count": len(emails)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching emails: {e}")
        raise HTTPException(500, f"Failed to search emails: {str(e)}")


@emails_router.post("/search/keywords", tags=["emails"])
async def search_emails_by_keywords(
    keywords: List[str],
    days_back: int = Query(90, ge=1, le=365),
    uuid: str = Depends(authorize)
):
    """
    Search emails by keywords
    """
    try:
        # Authenticate
        if not gmail_service.authenticate(uuid):
            raise HTTPException(401, "Gmail not connected. Please connect your Gmail account first.")
        
        # Search emails
        emails = gmail_service.search_by_keywords(keywords, days_back)
        
        # Add status detection
        for email in emails:
            detected_status = gmail_service.detect_status_from_email(
                email['subject'],
                email['snippet']
            )
            email['detected_status'] = detected_status
        
        return {"emails": emails, "count": len(emails)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching emails: {e}")
        raise HTTPException(500, f"Failed to search emails: {str(e)}")


@emails_router.post("/search", tags=["emails"])
async def search_emails_custom(
    request: EmailSearchRequest,
    uuid: str = Depends(authorize)
):
    """
    Search emails with custom query
    """
    try:
        # Authenticate
        if not gmail_service.authenticate(uuid):
            raise HTTPException(401, "Gmail not connected. Please connect your Gmail account first.")
        
        # Search emails
        emails = gmail_service.search_emails(request.query, request.max_results)
        
        # Add status detection
        for email in emails:
            detected_status = gmail_service.detect_status_from_email(
                email['subject'],
                email['snippet']
            )
            email['detected_status'] = detected_status
        
        return {"emails": emails, "count": len(emails)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching emails: {e}")
        raise HTTPException(500, f"Failed to search emails: {str(e)}")


@emails_router.post("/link", tags=["emails"])
async def link_email_to_job(
    request: LinkEmailRequest,
    uuid: str = Depends(authorize)
):
    """
    Link an email to a job application
    """
    try:
        # Check if email already linked
        is_linked = await linked_emails_dao.is_email_linked(
            request.job_id,
            request.email_id
        )
        
        if is_linked:
            raise HTTPException(400, "This email is already linked to this job")
        
        # Create linked email record
        email_data = {
            "email_id": request.email_id,
            "thread_id": request.thread_id,
            "subject": request.subject,
            "from_email": request.from_email,
            "from_name": request.from_name,
            "date": request.date,
            "snippet": request.snippet,
            "linked_by": uuid,
            "detected_status": request.detected_status,
            "notes": request.notes
        }
        
        linked_id = await linked_emails_dao.link_email(request.job_id, email_data)
        
        return {
            "detail": "Email linked successfully",
            "linked_email_id": linked_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error linking email: {e}")
        raise HTTPException(500, f"Failed to link email: {str(e)}")


@emails_router.get("/job/{job_id}", tags=["emails"])
async def get_job_linked_emails(
    job_id: str,
    uuid: str = Depends(authorize)
):
    """
    Get all emails linked to a job application
    Returns emails sorted chronologically
    """
    try:
        emails = await linked_emails_dao.get_job_emails(job_id)
        
        return {
            "emails": emails,
            "count": len(emails)
        }
        
    except Exception as e:
        print(f"Error getting job emails: {e}")
        raise HTTPException(500, f"Failed to get linked emails: {str(e)}")


@emails_router.post("/unlink", tags=["emails"])
async def unlink_email_from_job(
    request: UnlinkEmailRequest,
    uuid: str = Depends(authorize)
):
    """
    Unlink an email from a job application
    """
    try:
        success = await linked_emails_dao.unlink_email(request.linked_email_id)
        
        if success:
            return {"detail": "Email unlinked successfully"}
        else:
            raise HTTPException(404, "Linked email not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unlinking email: {e}")
        raise HTTPException(500, f"Failed to unlink email: {str(e)}")


@emails_router.post("/notes", tags=["emails"])
async def update_email_notes(
    request: UpdateEmailNotesRequest,
    uuid: str = Depends(authorize)
):
    """
    Update notes for a linked email
    """
    try:
        success = await linked_emails_dao.update_email_notes(
            request.linked_email_id,
            request.notes
        )
        
        if success:
            return {"detail": "Email notes updated successfully"}
        else:
            raise HTTPException(404, "Linked email not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating email notes: {e}")
        raise HTTPException(500, f"Failed to update email notes: {str(e)}")


@emails_router.get("/email/{email_id}/body", tags=["emails"])
async def get_email_body(
    email_id: str,
    uuid: str = Depends(authorize)
):
    """
    Get full email body text
    Requires Gmail authentication
    """
    try:
        # Authenticate
        if not gmail_service.authenticate(uuid):
            raise HTTPException(401, "Gmail not connected. Please connect your Gmail account first.")
        
        # Get email body
        body = gmail_service.get_email_body(email_id)
        
        return {"body": body}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting email body: {e}")
        raise HTTPException(500, f"Failed to get email body: {str(e)}")


@emails_router.get("/stats", tags=["emails"])
async def get_email_stats(uuid: str = Depends(authorize)):
    """
    Get email integration statistics for user
    Returns total linked emails and recent activity
    """
    try:
        all_emails = await linked_emails_dao.get_user_linked_emails(uuid)
        
        # Calculate stats
        total_linked = len(all_emails)
        
        # Group by status
        status_counts = {}
        for email in all_emails:
            status = email.get('detected_status', 'Unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Recent activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.now() - timedelta(days=7)
        recent_count = sum(1 for e in all_emails if e.get('linked_at', datetime.min) > week_ago)
        
        return {
            "total_linked": total_linked,
            "status_breakdown": status_counts,
            "recent_activity": recent_count
        }
        
    except Exception as e:
        print(f"Error getting email stats: {e}")
        raise HTTPException(500, f"Failed to get email stats: {str(e)}")