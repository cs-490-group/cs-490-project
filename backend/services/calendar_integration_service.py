"""
Calendar Integration Service
Handles Google Calendar and Microsoft Outlook integration
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import httpx
import os


class CalendarIntegrationService:
    """Service for integrating with external calendar providers"""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_CALENDAR_API_KEY")
        self.microsoft_client_id = os.getenv("MICROSOFT_CLIENT_ID")
        self.microsoft_client_secret = os.getenv("MICROSOFT_CLIENT_SECRET")
    
    async def create_google_calendar_event(
        self,
        access_token: str,
        summary: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Create an event in Google Calendar
        
        Args:
            access_token: User's Google OAuth access token
            summary: Event title
            start_time: Event start datetime
            end_time: Event end datetime
            description: Event description
            location: Event location
            attendees: List of attendee emails
            
        Returns:
            Dict with event_id and other event details
        """
        url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        
        event_data = {
            "summary": summary,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC"
            }
        }
        
        if description:
            event_data["description"] = description
        
        if location:
            event_data["location"] = location
        
        if attendees:
            event_data["attendees"] = [{"email": email} for email in attendees]
        
        # Add reminders
        event_data["reminders"] = {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 1440},  # 24 hours
                {"method": "popup", "minutes": 120}     # 2 hours
            ]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=event_data,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "event_id": result.get("id"),
                    "html_link": result.get("htmlLink"),
                    "success": True
                }
            else:
                return {
                    "success": False,
                    "error": response.text
                }
    
    async def update_google_calendar_event(
        self,
        access_token: str,
        event_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing Google Calendar event"""
        url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                url,
                json=updates,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            return {
                "success": response.status_code == 200,
                "data": response.json() if response.status_code == 200 else None
            }
    
    async def delete_google_calendar_event(
        self,
        access_token: str,
        event_id: str
    ) -> bool:
        """Delete a Google Calendar event"""
        url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            return response.status_code == 204
    
    async def create_outlook_calendar_event(
        self,
        access_token: str,
        subject: str,
        start_time: datetime,
        end_time: datetime,
        body: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[list] = None
    ) -> Dict[str, Any]:
        """Create an event in Microsoft Outlook Calendar"""
        url = "https://graph.microsoft.com/v1.0/me/events"
        
        event_data = {
            "subject": subject,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC"
            }
        }
        
        if body:
            event_data["body"] = {
                "contentType": "HTML",
                "content": body
            }
        
        if location:
            event_data["location"] = {"displayName": location}
        
        if attendees:
            event_data["attendees"] = [
                {
                    "emailAddress": {"address": email},
                    "type": "required"
                }
                for email in attendees
            ]
        
        # Add reminders
        event_data["reminderMinutesBeforeStart"] = 120
        event_data["isReminderOn"] = True
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=event_data,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code == 201:
                result = response.json()
                return {
                    "event_id": result.get("id"),
                    "web_link": result.get("webLink"),
                    "success": True
                }
            else:
                return {
                    "success": False,
                    "error": response.text
                }
    
    async def update_outlook_calendar_event(
        self,
        access_token: str,
        event_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing Outlook Calendar event"""
        url = f"https://graph.microsoft.com/v1.0/me/events/{event_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                url,
                json=updates,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            return {
                "success": response.status_code == 200,
                "data": response.json() if response.status_code == 200 else None
            }
    
    async def delete_outlook_calendar_event(
        self,
        access_token: str,
        event_id: str
    ) -> bool:
        """Delete an Outlook Calendar event"""
        url = f"https://graph.microsoft.com/v1.0/me/events/{event_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            return response.status_code == 204
    
    def generate_video_conference_link(self, platform: str) -> Dict[str, str]:
        """
        Generate a video conference link
        
        For production: Integrate with Zoom API, Google Meet API, etc.
        For now: Return placeholder links
        """
        import secrets
        meeting_id = secrets.token_urlsafe(16)
        
        if platform == "zoom":
            return {
                "link": f"https://zoom.us/j/{meeting_id}",
                "meeting_id": meeting_id,
                "platform": "zoom"
            }
        elif platform == "google_meet":
            return {
                "link": f"https://meet.google.com/{meeting_id}",
                "meeting_id": meeting_id,
                "platform": "google_meet"
            }
        elif platform == "teams":
            return {
                "link": f"https://teams.microsoft.com/l/meetup-join/{meeting_id}",
                "meeting_id": meeting_id,
                "platform": "teams"
            }
        else:
            return {
                "link": "",
                "meeting_id": "",
                "platform": "unknown"
            }


class PreparationTaskGenerator:
    """Generate role-specific preparation tasks for interviews"""
    
    @staticmethod
    def generate_tasks(
        job_title: str,
        company_name: str,
        location_type: str,
        interviewer_name: Optional[str] = None
    ) -> list:
        """
        Generate a customized preparation checklist
        
        Returns list of task dictionaries
        """
        import uuid
        
        tasks = []
        
        # Company Research Tasks
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": f"Research {company_name}",
            "description": f"Study {company_name}'s mission, values, recent news, and products/services",
            "category": "research",
            "is_completed": False,
            "priority": "high"
        })
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Understand the role requirements",
            "description": f"Review the {job_title} job description and understand key responsibilities",
            "category": "research",
            "is_completed": False,
            "priority": "high"
        })
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Research industry trends",
            "description": f"Learn about current trends and challenges in the industry",
            "category": "research",
            "is_completed": False,
            "priority": "medium"
        })
        
        # Practice Tasks
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Practice behavioral questions",
            "description": "Prepare STAR-method responses for common behavioral questions",
            "category": "practice",
            "is_completed": False,
            "priority": "high"
        })
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Prepare questions for interviewer",
            "description": "Prepare 5-10 thoughtful questions about the role, team, and company",
            "category": "practice",
            "is_completed": False,
            "priority": "high"
        })
        
        if "engineer" in job_title.lower() or "developer" in job_title.lower():
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Review technical concepts",
                "description": "Review data structures, algorithms, and relevant technologies",
                "category": "practice",
                "is_completed": False,
                "priority": "high"
            })
        
        # Materials Preparation
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Prepare portfolio/work samples",
            "description": "Have examples of your work ready to discuss",
            "category": "materials",
            "is_completed": False,
            "priority": "medium"
        })
        
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Print/prepare resume copies",
            "description": "Have updated resume ready (digital and/or physical)",
            "category": "materials",
            "is_completed": False,
            "priority": "medium"
        })
        
        # Logistics Tasks
        if location_type == "video":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Test video setup",
                "description": "Test camera, microphone, lighting, and internet connection",
                "category": "logistics",
                "is_completed": False,
                "priority": "high"
            })
            
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Prepare interview environment",
                "description": "Choose quiet location with professional background",
                "category": "logistics",
                "is_completed": False,
                "priority": "high"
            })
        
        elif location_type == "in-person":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Plan your route",
                "description": "Know the location, parking, and plan to arrive 10-15 minutes early",
                "category": "logistics",
                "is_completed": False,
                "priority": "high"
            })
            
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Choose appropriate attire",
                "description": f"Select professional attire appropriate for {company_name}",
                "category": "logistics",
                "is_completed": False,
                "priority": "high"
            })
        
        elif location_type == "phone":
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": "Test phone connection",
                "description": "Ensure good signal/connection and quiet environment",
                "category": "logistics",
                "is_completed": False,
                "priority": "high"
            })
        
        # Interviewer-specific research
        if interviewer_name:
            tasks.append({
                "task_id": str(uuid.uuid4()),
                "title": f"Research {interviewer_name}",
                "description": f"Look up {interviewer_name} on LinkedIn to understand their background",
                "category": "research",
                "is_completed": False,
                "priority": "medium"
            })
        
        # Final preparation
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "title": "Mental preparation",
            "description": "Get good sleep, eat well, and practice relaxation techniques",
            "category": "practice",
            "is_completed": False,
            "priority": "medium"
        })
        
        return tasks