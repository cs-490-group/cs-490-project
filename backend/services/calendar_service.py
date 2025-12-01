"""
Combined Calendar Integration and Reminder Service
Handles Google Calendar, Outlook sync, reminders, and preparation tasks
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime, timedelta, timezone
import os
from typing import Optional, Dict, Any, List
import msal
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
import secrets


class CalendarService:
    """Unified calendar sync and reminder service"""
    
    def __init__(self):
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.google_redirect_uri = os.getenv("FRONTEND_URL", "http://localhost:3000") + "/calendar/callback"
        
        self.microsoft_client_id = os.getenv("MICROSOFT_CLIENT_ID")
        self.microsoft_issuer = os.getenv("MICROSOFT_ISSUER", "https://login.microsoftonline.com/common/v2.0")
        
        self.sender_email = os.getenv("GMAIL_SENDER")
        self.sender_password = os.getenv("GMAIL_APP_PASSWORD")
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # ============================================================================
    # GOOGLE CALENDAR INTEGRATION
    # ============================================================================
    
    def get_google_auth_url(self, user_uuid: str) -> str:
        """Generate Google Calendar OAuth URL"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.google_client_id,
                    "client_secret": self.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.google_redirect_uri]
                }
            },
            scopes=['https://www.googleapis.com/auth/calendar'],
            redirect_uri=self.google_redirect_uri
        )
        
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=user_uuid
        )
        
        return auth_url
    
    async def handle_google_callback(self, code: str, state: str) -> Dict[str, Any]:
        """Handle Google OAuth callback"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.google_client_id,
                    "client_secret": self.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.google_redirect_uri]
                }
            },
            scopes=['https://www.googleapis.com/auth/calendar'],
            redirect_uri=self.google_redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        return {
            "user_uuid": state,
            "provider": "google",
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None
        }
    
    async def create_google_event(
        self, 
        credentials_dict: Dict[str, Any],
        interview_data: Dict[str, Any]
    ) -> str:
        """Create a Google Calendar event"""
        credentials = Credentials(
            token=credentials_dict.get("access_token"),
            refresh_token=credentials_dict.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.google_client_id,
            client_secret=self.google_client_secret
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Build event
        event = {
            'summary': f"Interview: {interview_data.get('job_title', 'Position')}",
            'description': self._build_event_description(interview_data),
            'start': {
                'dateTime': interview_data['interview_datetime'].isoformat(),
                'timeZone': interview_data.get('timezone', 'UTC'),
            },
            'end': {
                'dateTime': (interview_data['interview_datetime'] + 
                           timedelta(minutes=interview_data.get('duration_minutes', 60))).isoformat(),
                'timeZone': interview_data.get('timezone', 'UTC'),
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 120},
                ],
            },
        }
        
        if interview_data.get('location_type') == 'video' and interview_data.get('video_link'):
            event['location'] = interview_data['video_link']
        elif interview_data.get('location_details'):
            event['location'] = interview_data['location_details']
        
        if interview_data.get('interviewer_email'):
            event['attendees'] = [{'email': interview_data['interviewer_email']}]
        
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()
        
        return created_event['id']
    
    # ============================================================================
    # MICROSOFT OUTLOOK INTEGRATION
    # ============================================================================
    
    def get_outlook_auth_url(self, user_uuid: str) -> str:
        """Generate Outlook Calendar OAuth URL"""
        app = msal.PublicClientApplication(
            self.microsoft_client_id,
            authority=self.microsoft_issuer
        )
        
        auth_url = app.get_authorization_request_url(
            scopes=["https://graph.microsoft.com/Calendars.ReadWrite"],
            state=user_uuid,
            redirect_uri=self.google_redirect_uri
        )
        
        return auth_url
    
    # ============================================================================
    # EMAIL REMINDERS
    # ============================================================================
    
    def send_email_reminder(
        self,
        recipient_email: str,
        interview_data: Dict[str, Any],
        hours_until: int
    ) -> bool:
        """Send email reminder for upcoming interview"""
        
        if not self.sender_email or not self.sender_password:
            print("Email credentials not configured")
            return False
        
        message = MIMEMultipart("alternative")
        
        if hours_until == 24:
            subject = f"Tomorrow: Interview at {interview_data.get('company_name', 'Company')}"
        elif hours_until == 2:
            subject = f"In 2 Hours: Interview at {interview_data.get('company_name', 'Company')}"
        elif hours_until == 1:
            subject = f"In 1 Hour: Interview at {interview_data.get('company_name', 'Company')}"
        else:
            subject = f"Upcoming Interview Reminder"
        
        message["Subject"] = subject
        message["From"] = self.sender_email
        message["To"] = recipient_email
        
        interview_time = interview_data['interview_datetime']
        formatted_date = interview_time.strftime("%A, %B %d, %Y")
        formatted_time = interview_time.strftime("%I:%M %p")
        
        text = f"""
Interview Reminder

Your interview is coming up {self._format_time_until(hours_until)}!

Position: {interview_data.get('job_title', 'Position')}
Company: {interview_data.get('company_name', 'Company')}
Date: {formatted_date}
Time: {formatted_time} ({interview_data.get('timezone', 'UTC')})
Format: {interview_data.get('location_type', 'Interview').title()}

{self._get_location_text(interview_data)}

Preparation: {interview_data.get('preparation_completion_percentage', 0)}% complete

Good luck!

View details: {self.frontend_url}/interview/details/{interview_data.get('schedule_uuid')}
"""
        
        html = self._build_reminder_html(interview_data, hours_until, formatted_date, formatted_time)
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        message.attach(part1)
        message.attach(part2)
        
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            return True
        except Exception as e:
            print(f"Failed to send reminder email: {e}")
            return False
    
    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    def generate_video_conference_link(self, platform: str) -> Dict[str, str]:
        """Generate a video conference link"""
        meeting_id = secrets.token_urlsafe(16)
        
        if platform == "zoom":
            return {"link": f"https://zoom.us/j/{meeting_id}", "platform": "zoom"}
        elif platform == "google_meet":
            return {"link": f"https://meet.google.com/{meeting_id}", "platform": "google_meet"}
        elif platform == "teams":
            return {"link": f"https://teams.microsoft.com/l/meetup-join/{meeting_id}", "platform": "teams"}
        else:
            return {"link": "", "platform": "unknown"}
    
    def _build_event_description(self, interview_data: Dict[str, Any]) -> str:
        """Build formatted event description"""
        parts = []
        
        if interview_data.get('company_name'):
            parts.append(f"Company: {interview_data['company_name']}")
        
        if interview_data.get('interviewer_name'):
            parts.append(f"Interviewer: {interview_data['interviewer_name']}")
            if interview_data.get('interviewer_title'):
                parts[-1] += f" ({interview_data['interviewer_title']})"
        
        if interview_data.get('location_type'):
            parts.append(f"Format: {interview_data['location_type'].title()}")
        
        if interview_data.get('video_link'):
            parts.append(f"Join: {interview_data['video_link']}")
        
        if interview_data.get('notes'):
            parts.append(f"\nNotes: {interview_data['notes']}")
        
        return "\n".join(parts)
    
    def _format_time_until(self, hours: int) -> str:
        """Format time until interview"""
        if hours == 24:
            return "in 24 hours"
        elif hours == 2:
            return "in 2 hours"
        elif hours == 1:
            return "in 1 hour"
        else:
            return f"in {hours} hours"
    
    def _get_location_text(self, interview_data: Dict[str, Any]) -> str:
        """Get location details text"""
        location_type = interview_data.get('location_type', '').lower()
        
        if location_type == 'video':
            video_link = interview_data.get('video_link', '')
            platform = interview_data.get('video_platform', 'Video').title()
            return f"{platform} Link: {video_link}" if video_link else "Video interview (link TBD)"
        elif location_type == 'phone':
            phone = interview_data.get('phone_number', '')
            return f"Phone: {phone}" if phone else "Phone interview"
        elif location_type == 'in-person':
            location = interview_data.get('location_details', '')
            return f"Location: {location}" if location else "In-person interview"
        else:
            return ""
    
    def _build_reminder_html(
        self,
        interview_data: Dict[str, Any],
        hours_until: int,
        formatted_date: str,
        formatted_time: str
    ) -> str:
        """Build HTML email reminder"""
        completion = interview_data.get('preparation_completion_percentage', 0)
        
        if hours_until <= 2:
            urgency_color = "#dc3545"
            urgency_text = "SOON"
        elif hours_until <= 24:
            urgency_color = "#ffc107"
            urgency_text = "TOMORROW"
        else:
            urgency_color = "#007bff"
            urgency_text = "UPCOMING"
        
        return f"""
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #004d7a, #008793, #00bf72); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">📅 Interview Reminder</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 20px 20px 20px; text-align: center;">
                            <div style="display: inline-block; background-color: {urgency_color}; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 18px;">
                                {urgency_text}
                            </div>
                            <p style="margin: 15px 0 0 0; font-size: 16px; color: #333; font-weight: 600;">
                                Your interview is {self._format_time_until(hours_until)}!
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Position:</strong><br>
                                        <span style="color: #004d7a; font-size: 18px; font-weight: 600;">{interview_data.get('job_title', 'Position')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Company:</strong><br>
                                        <span style="color: #333; font-size: 16px;">{interview_data.get('company_name', 'Company')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Date & Time:</strong><br>
                                        <span style="color: #333; font-size: 16px;">📅 {formatted_date} at {formatted_time}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Format:</strong><br>
                                        <span style="color: #333; font-size: 16px;">{self._get_location_text(interview_data)}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #6c757d; font-size: 14px;">Preparation Progress:</strong>
                                    <span style="color: #004d7a; font-weight: 600; float: right;">{completion}%</span>
                                </div>
                                <div style="width: 100%; height: 8px; background-color: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: {completion}%; height: 100%; background-color: #00bf72;"></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="{self.frontend_url}/interview/prepare/{interview_data.get('schedule_uuid')}" 
                               style="display: inline-block; background-color: #00bf72; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Prepare Now
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


class PreparationTaskGenerator:
    """Generate role-specific preparation tasks"""
    
    @staticmethod
    def generate_tasks(
        job_title: str,
        company_name: str,
        location_type: str,
        interviewer_name: Optional[str] = None,
        interviewer_title: Optional[str] = None,
        industry: Optional[str] = None,
        job_description: Optional[str] = None,
        company_info: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """Generate customized preparation checklist"""
        tasks = []
        
        # Research tasks
        tasks.extend([
            {
                "task_id": str(uuid.uuid4()),
                "title": f"Research {company_name}",
                "description": f"Study {company_name}'s mission, values, recent news, and products/services",
                "category": "research",
                "is_completed": False,
                "priority": "high"
            },
            {
                "task_id": str(uuid.uuid4()),
                "title": "Understand the role requirements",
                "description": f"Review the {job_title} job description and key responsibilities",
                "category": "research",
                "is_completed": False,
                "priority": "high"
            },
            {
                "task_id": str(uuid.uuid4()),
                "title": "Research industry trends",
                "description": "Learn about current trends and challenges in the industry",
                "category": "research",
                "is_completed": False,
                "priority": "medium"
            }
        ])
        
        # Practice tasks
        tasks.extend([
            {
                "task_id": str(uuid.uuid4()),
                "title": "Practice behavioral questions",
                "description": "Prepare STAR-method responses for common behavioral questions",
                "category": "practice",
                "is_completed": False,
                "priority": "high"
            },
            {
                "task_id": str(uuid.uuid4()),
                "title": "Prepare questions for interviewer",
                "description": "Prepare 5-10 thoughtful questions about the role, team, and company",
                "category": "practice",
                "is_completed": False,
                "priority": "high"
            }
        ])
        
        # Technical prep for tech roles
        if any(keyword in job_title.lower() for keyword in ["engineer", "developer", "programmer"]):
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Review technical concepts",
                "description": "Review data structures, algorithms, and relevant technologies",
                "category": "practice",
                "is_completed": False,
                "priority": "high"
            })
        
        # Materials
        tasks.extend([
            {
                "task_id": str(uuid.uuid4()),
                "title": "Prepare portfolio/work samples",
                "description": "Have examples of your work ready to discuss",
                "category": "materials",
                "is_completed": False,
                "priority": "medium"
            },
            {
                "task_id": str(uuid.uuid4()),
                "title": "Prepare resume copies",
                "description": "Have updated resume ready (digital and/or physical)",
                "category": "materials",
                "is_completed": False,
                "priority": "medium"
            }
        ])
        
        # Logistics based on format
        if location_type == "video":
            tasks.extend([
                {
                    "task_id": str(uuid.uuid4()),
                    "title": "Test video setup",
                    "description": "Test camera, microphone, lighting, and internet connection",
                    "category": "logistics",
                    "is_completed": False,
                    "priority": "high"
                },
                {
                    "task_id": str(uuid.uuid4()),
                    "title": "Prepare interview environment",
                    "description": "Choose quiet location with professional background",
                    "category": "logistics",
                    "is_completed": False,
                    "priority": "high"
                }
            ])
        elif location_type == "in-person":
            tasks.extend([
                {
                    "task_id": str(uuid.uuid4()),
                    "title": "Plan your route",
                    "description": "Know the location, parking, plan to arrive 10-15 minutes early",
                    "category": "logistics",
                    "is_completed": False,
                    "priority": "high"
                },
                {
                    "task_id": str(uuid.uuid4()),
                    "title": "Choose appropriate attire",
                    "description": f"Select professional attire appropriate for {company_name}",
                    "category": "logistics",
                    "is_completed": False,
                    "priority": "high"
                }
            ])
        elif location_type == "phone":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Test phone connection",
                "description": "Ensure good signal/connection and quiet environment",
                "category": "logistics",
                "is_completed": False,
                "priority": "high"
            })
        
        # Interviewer research
        if interviewer_name:
            title_context = f" ({interviewer_title})" if interviewer_title else ""
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": f"Research {interviewer_name}",
                "description": f"Look up {interviewer_name}{title_context} on LinkedIn to understand their background and experience",
                "category": "research",
                "is_completed": False,
                "priority": "medium"
            })
        
        return tasks


# Singleton instance
calendar_service = CalendarService()