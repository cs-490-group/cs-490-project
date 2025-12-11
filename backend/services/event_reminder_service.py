"""
Network Event Reminder Service
Handles scheduled reminders to attend networking events.
Sends reminders at:
- 1 day before event (preparation reminder)
- 1 hour before event (urgent action reminder)
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Any, List
import pytz


class EventReminderService:
    """Service for generating and sending event reminder emails"""
    
    def __init__(self):
        """Initialize email configuration"""
        self.sender_email = os.getenv("GMAIL_SENDER")
        self.sender_password = os.getenv("GMAIL_APP_PASSWORD")
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 465
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # ========================================================================
    # EMAIL VALIDATION & CREDENTIALS
    # ========================================================================
    
    def _validate_credentials(self) -> None:
        """Validate that email credentials are configured"""
        if not self.sender_email or not self.sender_password:
            raise ValueError(
                "Email credentials not configured. "
                "Please set GMAIL_SENDER and GMAIL_APP_PASSWORD environment variables."
            )
    
    # ========================================================================
    # EMAIL TEMPLATE METHODS
    # ========================================================================
    
    def _build_event_reminder_html(
        self,
        event_data: Dict[str, Any],
        hours_until: int,
        user_email: str
    ) -> str:
        """
        Build HTML email template for event reminder
        
        Args:
            event_data: Event details
            hours_until: Hours until event (24 or 1)
            user_email: Email of the user being reminded
        """
        is_urgent = hours_until == 1
        urgency_text = "Starting in 1 Hour - Time to head out!" if is_urgent else "Tomorrow - Time to prepare!"
        urgency_color = "#dc3545" if is_urgent else "#ffc107"
        action_button_text = "Go to Event Details NOW" if is_urgent else "View & Prepare for Event"
        action_link = f"{self.frontend_url}/network/events"
        
        event_name = event_data.get('event_name', 'Event')
        event_type = event_data.get('event_type', 'Event')
        event_date = event_data.get('event_date', 'N/A')
        start_time = event_data.get('start_time', 'N/A')
        end_time = event_data.get('end_time', 'N/A')
        location = event_data.get('location', 'N/A')
        virtual_link = event_data.get('virtual_link', '')
        industry = event_data.get('industry', '')
        description = event_data.get('description', '')
        networking_goals = event_data.get('networking_goals', [])
        pre_event_prep = event_data.get('pre_event_prep', '')
        target_companies = event_data.get('target_companies', [])
        target_roles = event_data.get('target_roles', [])
        event_notes = event_data.get('event_notes', '')
        
        # Format date nicely
        try:
            event_datetime = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
            formatted_date = event_datetime.strftime("%A, %B %d, %Y")
        except:
            formatted_date = event_date
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', 'Arial', sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="650" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, {urgency_color} 0%, rgba({self._hex_to_rgb(urgency_color)}, 0.8) 100%); padding: 40px 40px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
                                🎪 Event Reminder
                            </h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
                                {urgency_text}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Urgency Alert -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fff9e6; border-bottom: 2px solid {urgency_color};">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <span style="font-size: 32px;">{'⚡' if is_urgent else '📅'}</span>
                                <div>
                                    <strong style="color: {urgency_color}; font-size: 14px;">
                                        {'Action Required Now!' if is_urgent else 'Time to Prepare'}
                                    </strong>
                                    <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">
                                        {'Get ready to head to the event!' if is_urgent else 'Review event details and prepare for networking.'}
                                    </p>
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 25px 0; color: #333; font-size: 20px;">
                                📍 Event Details
                            </h2>
                            
                            <!-- Event Information Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #004d7a; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #004d7a; font-size: 16px;">
                                    🎯 Event Information
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.8; color: #333;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600; width: 150px;">Event Name:</td>
                                        <td style="padding: 8px 0;">{event_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Type:</td>
                                        <td style="padding: 8px 0;">{event_type.title()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Date:</td>
                                        <td style="padding: 8px 0;">{formatted_date}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Time:</td>
                                        <td style="padding: 8px 0;">{start_time} - {end_time}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Location Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #00bf72; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #00bf72; font-size: 16px;">
                                    📌 Location
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.8; color: #333;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600; width: 150px;">Venue:</td>
                                        <td style="padding: 8px 0;">{location}</td>
                                    </tr>
                                    {f'''<tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Virtual Link:</td>
                                        <td style="padding: 8px 0;"><a href="{virtual_link}" style="color: #0066cc; text-decoration: none;">{virtual_link}</a></td>
                                    </tr>''' if virtual_link else ''}
                                </table>
                            </div>
                            
                            {f'''
                            <!-- Industry & Description Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #6f42c1; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #6f42c1; font-size: 16px;">
                                    📚 Event Overview
                                </h3>
                                {f'<p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>Industry:</strong> {industry}</p>' if industry else ''}
                                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{description}</p>
                            </div>
                            ''' if industry or description else ''}
                            
                            {f'''
                            <!-- Networking Goals Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #fd7e14; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #fd7e14; font-size: 16px;">
                                    🎯 Your Networking Goals
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #333;">
                                    {chr(10).join(f'<li>{goal}</li>' for goal in networking_goals)}
                                </ul>
                            </div>
                            ''' if networking_goals else ''}
                            
                            {f'''
                            <!-- Target Focus Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #17a2b8; font-size: 16px;">
                                    🔍 Target Focus
                                </h3>
                                {f'<p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>Target Companies:</strong> {", ".join(target_companies)}</p>' if target_companies else ''}
                                {f'<p style="margin: 0; color: #666; font-size: 14px;"><strong>Target Roles:</strong> {", ".join(target_roles)}</p>' if target_roles else ''}
                            </div>
                            ''' if target_companies or target_roles else ''}
                            
                            {f'''
                            <!-- Preparation Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #6c757d; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px;">
                                    ✅ Pre-Event Preparation
                                </h3>
                                <div style="font-size: 14px; line-height: 1.6; color: #333;">
                                    {pre_event_prep}
                                </div>
                            </div>
                            ''' if pre_event_prep else ''}
                            
                            {f'''
                            <!-- Event Notes Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #6c757d; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px;">
                                    📝 Notes
                                </h3>
                                <div style="font-size: 14px; line-height: 1.6; color: #333;">
                                    {event_notes}
                                </div>
                            </div>
                            ''' if event_notes else ''}
                            
                            <!-- Action Items -->
                            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #004d7a; font-size: 16px;">
                                    ✓ Pre-Event Checklist
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #333;">
                                    <li>Review the event details and location</li>
                                    <li>Plan your outfit and what to bring</li>
                                    <li>Review your networking goals</li>
                                    <li>{"Prepare your elevator pitch" if is_urgent else "Practice your elevator pitch"}</li>
                                    <li>{"Arrive 10-15 minutes early" if is_urgent else "Set a reminder for the event start time"}</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Action Button -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: center;">
                            <a href="{action_link}" style="display: inline-block; padding: 14px 32px; background-color: {urgency_color}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.3s;">
                                {action_button_text}
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;">
                                🎪 This is a reminder from <strong style="color: #004d7a;">Metamorphosis</strong> - your event is happening {('in 1 hour' if is_urgent else 'tomorrow')}.
                            </p>
                            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
                                Reminder sent to: {user_email}
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
        return html
    
    def _build_event_reminder_text(
        self,
        event_data: Dict[str, Any],
        hours_until: int
    ) -> str:
        """Build plain text version of event reminder"""
        is_urgent = hours_until == 1
        urgency_text = "Starting in 1 Hour - Time to head out!" if is_urgent else "Tomorrow - Time to prepare!"
        
        event_name = event_data.get('event_name', 'Event')
        event_type = event_data.get('event_type', 'Event')
        event_date = event_data.get('event_date', 'N/A')
        start_time = event_data.get('start_time', 'N/A')
        end_time = event_data.get('end_time', 'N/A')
        location = event_data.get('location', 'N/A')
        virtual_link = event_data.get('virtual_link', '')
        industry = event_data.get('industry', '')
        description = event_data.get('description', '')
        networking_goals = event_data.get('networking_goals', [])
        pre_event_prep = event_data.get('pre_event_prep', '')
        target_companies = event_data.get('target_companies', [])
        target_roles = event_data.get('target_roles', [])
        event_notes = event_data.get('event_notes', '')
        
        text = f"""
🎪 EVENT REMINDER

{urgency_text}

============================================
EVENT INFORMATION
============================================
Event: {event_name}
Type: {event_type.title()}
Date: {event_date}
Time: {start_time} - {end_time}

============================================
LOCATION
============================================
Venue: {location}
"""
        
        if virtual_link:
            text += f"Virtual Link: {virtual_link}\n"
        
        if industry or description:
            text += f"""
============================================
EVENT OVERVIEW
============================================
"""
            if industry:
                text += f"Industry: {industry}\n"
            if description:
                text += f"Description: {description}\n"
        
        if networking_goals:
            text += f"""
============================================
YOUR NETWORKING GOALS
============================================
"""
            for goal in networking_goals:
                text += f"• {goal}\n"
        
        if target_companies or target_roles:
            text += f"""
============================================
TARGET FOCUS
============================================
"""
            if target_companies:
                text += f"Target Companies: {', '.join(target_companies)}\n"
            if target_roles:
                text += f"Target Roles: {', '.join(target_roles)}\n"
        
        if pre_event_prep:
            text += f"""
============================================
PRE-EVENT PREPARATION
============================================
{pre_event_prep}

"""
        
        if event_notes:
            text += f"""
============================================
NOTES
============================================
{event_notes}

"""
        
        text += f"""
============================================
PRE-EVENT CHECKLIST
============================================
□ Review the event details and location
□ Plan your outfit and what to bring
□ Review your networking goals
□ {"Prepare your elevator pitch" if is_urgent else "Practice your elevator pitch"}
□ {"Arrive 10-15 minutes early" if is_urgent else "Set a reminder for the event start time"}

View and manage your events: {self.frontend_url}/network/events

Need help? Contact support or check our knowledge base.
"""
        
        return text
    
    def _hex_to_rgb(self, hex_color: str) -> str:
        """Convert hex color to rgb values for use in CSS"""
        hex_color = hex_color.lstrip('#')
        return f"{int(hex_color[0:2], 16)}, {int(hex_color[2:4], 16)}, {int(hex_color[4:6], 16)}"
    
    # ========================================================================
    # EMAIL SENDING METHODS
    # ========================================================================
    
    def send_event_reminder_email(
        self,
        recipient_email: str,
        event_data: Dict[str, Any],
        hours_until: int
    ) -> Dict[str, Any]:
        """
        Send an event reminder email to the user
        
        Args:
            recipient_email: Email address of the user being reminded
            event_data: Event details
            hours_until: Hours until event (24 or 1)
        
        Returns:
            Dict with success status and metadata
        
        Raises:
            ValueError: If email credentials are not configured
            Exception: If email sending fails
        """
        self._validate_credentials()
        
        event_name = event_data.get('event_name', 'Event')
        event_type = event_data.get('event_type', 'Event')
        
        if hours_until == 24:
            subject = f"🎪 Event Reminder: {event_name} - Tomorrow!"
        elif hours_until == 1:
            subject = f"⚡ URGENT: {event_name} starts in 1 hour!"
        else:
            subject = f"🎪 Event Reminder: {event_name}"
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.sender_email
        message["To"] = recipient_email
        
        # Create both plain text and HTML versions
        text_part = MIMEText(
            self._build_event_reminder_text(event_data, hours_until),
            "plain"
        )
        html_part = MIMEText(
            self._build_event_reminder_html(event_data, hours_until, recipient_email),
            "html"
        )
        
        # Attach both versions (email clients will prefer HTML if available)
        message.attach(text_part)
        message.attach(html_part)
        
        # Send email
        try:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            return {
                "success": True,
                "sent_to": recipient_email,
                "sent_from": self.sender_email,
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "event_name": event_name,
                "event_type": event_type,
                "hours_until": hours_until,
                "urgency": "URGENT" if hours_until == 1 else "upcoming"
            }
        except smtplib.SMTPAuthenticationError as e:
            raise Exception(f"Email authentication failed. Check credentials: {str(e)}")
        except smtplib.SMTPException as e:
            raise Exception(f"SMTP error occurred: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to send event reminder email: {str(e)}")


# Global instance
event_reminder_service = EventReminderService()
