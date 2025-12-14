"""
Email Integration API Router
Complete endpoints for Gmail integration and email linking
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import os
import httpx
import base64

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from sessions.session_authorizer import authorize
from mongo.linked_emails_dao import linked_emails_dao
from mongo.gmail_tokens_dao import gmail_tokens_dao

emails_router = APIRouter(prefix="/emails")


# ============================================================================
# Pydantic Models
# ============================================================================

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


# ============================================================================
# Helper Functions
# ============================================================================

async def get_gmail_service(uuid: str):
    """Get authenticated Gmail service for a user"""
    tokens = await gmail_tokens_dao.get_tokens(uuid)
    
    if not tokens or not tokens.get("access_token"):
        raise HTTPException(401, "Gmail not connected")
    
    credentials = Credentials(
        token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET")
    )
    
    service = build('gmail', 'v1', credentials=credentials)
    return service


def parse_email(message):
    """Parse Gmail API message into simplified format"""
    headers = message['payload']['headers']
    
    subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), 'No Subject')
    from_header = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'Unknown')
    date = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')
    
    # Get snippet
    snippet = message.get('snippet', '')
    
    return {
        'id': message['id'],
        'thread_id': message.get('threadId', ''),
        'subject': subject,
        'from': from_header,
        'date': date,
        'snippet': snippet
    }


def detect_status_from_email(subject: str, snippet: str) -> Optional[str]:
    """Detect application status from email content"""
    content = (subject + " " + snippet).lower()
    
    if any(word in content for word in ['interview', 'schedule', 'meet', 'zoom', 'teams']):
        return 'Interview'
    elif any(word in content for word in ['offer', 'congratulations', 'pleased to offer', 'accept']):
        return 'Offer'
    elif any(word in content for word in ['rejected', 'unfortunately', 'not moving forward', 'other candidates']):
        return 'Rejected'
    elif any(word in content for word in ['screening', 'phone screen', 'initial call']):
        return 'Screening'
    else:
        return None


def get_email_body(payload):
    """Extract email body from Gmail API payload"""
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data', '')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8')
            elif 'parts' in part:
                result = get_email_body(part)
                if result:
                    return result
    else:
        data = payload['body'].get('data', '')
        if data:
            return base64.urlsafe_b64decode(data).decode('utf-8')
    return ''


# ============================================================================
# OAuth / Authentication Endpoints
# ============================================================================

@emails_router.get("/auth/status", tags=["emails"])
async def check_gmail_auth_status(uuid: str = Depends(authorize)):
    """
    Check if user has authenticated with Gmail
    Returns authentication status and email address if connected
    """
    try:
        tokens = await gmail_tokens_dao.get_tokens(uuid)
        
        if tokens and tokens.get("access_token"):
            return {
                "authenticated": True,
                "email": tokens.get("email", "")
            }
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
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(500, "Google Client ID not configured")
        
        # Use localhost for development, update for production
        REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/api/emails/auth/callback")
        
        # Gmail readonly scope
        SCOPES = [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/userinfo.email"
        ]
        
        # Construct OAuth URL
        auth_url = (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={GOOGLE_CLIENT_ID}&"
            f"redirect_uri={REDIRECT_URI}&"
            f"response_type=code&"
            f"scope={'+'.join(SCOPES)}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={uuid}"  # Pass uuid to link back to user
        )
        
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
        uuid = state  # State contains user uuid
        
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
        REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/api/emails/auth/callback")
        
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise HTTPException(500, "Google credentials not configured")
        
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            # Get access and refresh tokens
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                print(f"Token exchange failed: {token_response.text}")
                frontend_url = "http://localhost:3000/jobs?gmail_error=true"
                return RedirectResponse(url=frontend_url)
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")
            expires_in = tokens.get("expires_in")
            
            if not access_token:
                frontend_url = "http://localhost:3000/jobs?gmail_error=true"
                return RedirectResponse(url=frontend_url)
            
            # Get user's Gmail address
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                frontend_url = "http://localhost:3000/jobs?gmail_error=true"
                return RedirectResponse(url=frontend_url)
            
            user_info = userinfo_response.json()
            email = user_info.get("email")
            
            # Store tokens in database
            await gmail_tokens_dao.store_tokens(uuid, {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "email": email,
                "expires_in": expires_in,
                "token_type": "Bearer"
            })
            
            # Redirect to frontend with success
            frontend_url = "http://localhost:3000/jobs?gmail_connected=true"
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
        success = await gmail_tokens_dao.delete_tokens(uuid)
        
        if success:
            return {"detail": "Gmail access revoked successfully"}
        else:
            return {"detail": "No Gmail connection found"}
            
    except Exception as e:
        print(f"Error disconnecting Gmail: {e}")
        raise HTTPException(500, "Failed to disconnect Gmail")


# ============================================================================
# Email Search Endpoints
# ============================================================================

@emails_router.get("/search/company/{company_name}", tags=["emails"])
async def search_emails_by_company(
    company_name: str,
    days_back: int = Query(90, ge=1, le=365),
    uuid: str = Depends(authorize)
):
    """Search emails by company name"""
    try:
        service = await get_gmail_service(uuid)
        
        # Build search query
        query = f'from:*{company_name}* OR to:*{company_name}* OR subject:{company_name}'
        
        # Search emails
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=20
        ).execute()
        
        messages = results.get('messages', [])
        
        # Get full message details
        emails = []
        for msg in messages:
            full_msg = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='full'
            ).execute()
            
            email = parse_email(full_msg)
            email['detected_status'] = detect_status_from_email(email['subject'], email['snippet'])
            emails.append(email)
        
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
    """Search emails by keywords"""
    try:
        service = await get_gmail_service(uuid)
        
        # Build search query from keywords
        query_parts = [f'({kw})' for kw in keywords if kw]
        query = ' OR '.join(query_parts)
        
        # Search emails
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=20
        ).execute()
        
        messages = results.get('messages', [])
        
        # Get full message details
        emails = []
        for msg in messages:
            full_msg = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='full'
            ).execute()
            
            email = parse_email(full_msg)
            email['detected_status'] = detect_status_from_email(email['subject'], email['snippet'])
            emails.append(email)
        
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
    """Search emails with custom query"""
    try:
        service = await get_gmail_service(uuid)
        
        # Search emails
        results = service.users().messages().list(
            userId='me',
            q=request.query,
            maxResults=request.max_results
        ).execute()
        
        messages = results.get('messages', [])
        
        # Get full message details
        emails = []
        for msg in messages:
            full_msg = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='full'
            ).execute()
            
            email = parse_email(full_msg)
            email['detected_status'] = detect_status_from_email(email['subject'], email['snippet'])
            emails.append(email)
        
        return {"emails": emails, "count": len(emails)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching emails: {e}")
        raise HTTPException(500, f"Failed to search emails: {str(e)}")


@emails_router.get("/email/{email_id}/body", tags=["emails"])
async def get_email_body_endpoint(
    email_id: str,
    uuid: str = Depends(authorize)
):
    """Get full email body text"""
    try:
        service = await get_gmail_service(uuid)
        
        # Get message with full body
        message = service.users().messages().get(
            userId='me',
            id=email_id,
            format='full'
        ).execute()
        
        # Extract body
        body = get_email_body(message['payload'])
        
        return {"body": body or "No text content available"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting email body: {e}")
        raise HTTPException(500, f"Failed to get email body: {str(e)}")


# ============================================================================
# Email Linking Endpoints
# ============================================================================

@emails_router.post("/link", tags=["emails"])
async def link_email_to_job(
    request: LinkEmailRequest,
    uuid: str = Depends(authorize)
):
    """Link an email to a job application"""
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
    """Get all emails linked to a job application"""
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
    """Unlink an email from a job application"""
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
    """Update notes for a linked email"""
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


# ============================================================================
# Statistics Endpoints
# ============================================================================

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
        from datetime import timedelta
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