# backend/services/scheduling_service.py
"""
Application Scheduling and Reminder Service
Sends email notifications for scheduled applications and deadline reminders
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class SchedulingService:
    """Service for sending scheduling and reminder emails"""
    
    def __init__(self):
        """Initialize email configuration"""
        self.sender_email = os.getenv("GMAIL_SENDER")
        self.sender_password = os.getenv("GMAIL_APP_PASSWORD")
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 465
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    def _validate_credentials(self) -> None:
        """Validate that email credentials are configured"""
        if not self.sender_email or not self.sender_password:
            raise ValueError(
                "Email credentials not configured. "
                "Please set GMAIL_SENDER and GMAIL_APP_PASSWORD environment variables."
            )
    
    def _send_email(
        self,
        recipient_email: str,
        subject: str,
        text_body: str,
        html_body: str
    ) -> Dict[str, Any]:
        """
        Internal method to send email via SMTP
        
        Returns:
            Dict with success status and metadata
        """
        self._validate_credentials()
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.sender_email
        message["To"] = recipient_email
        
        # Attach both text and HTML versions
        part1 = MIMEText(text_body, "plain")
        part2 = MIMEText(html_body, "html")
        message.attach(part1)
        message.attach(part2)
        
        try:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            return {
                "success": True,
                "sent_to": recipient_email,
                "sent_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            raise Exception(f"Failed to send email: {str(e)}")
    
    def send_scheduled_submission_reminder(
        self,
        recipient_email: str,
        job_title: str,
        company: str,
        scheduled_time: str,
        package_name: str,
        hours_until: int
    ) -> Dict[str, Any]:
        """
        Send reminder that a scheduled application submission is coming up
        
        Args:
            recipient_email: Email address of the user
            job_title: Position title
            company: Company name
            scheduled_time: ISO format datetime string
            package_name: Name of the application package
            hours_until: Hours until scheduled submission
        
        Returns:
            Dict with success status and metadata
        """
        # Format time
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            formatted_time = scheduled_dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            formatted_time = scheduled_time
        
        # Determine urgency
        if hours_until <= 1:
            urgency = "VERY SOON"
            urgency_color = "#dc3545"
        elif hours_until <= 3:
            urgency = "SOON"
            urgency_color = "#fd7e14"
        elif hours_until <= 12:
            urgency = "TODAY"
            urgency_color = "#ffc107"
        else:
            urgency = "UPCOMING"
            urgency_color = "#667eea"
        
        subject = f"⏰ Scheduled Application: {company}"
        
        # Plain text version
        text = f"""
Scheduled Application Reminder

Your application is scheduled to be submitted soon!

Position: {job_title}
Company: {company}
Package: {package_name}
Scheduled Time: {formatted_time}

Time Until Submission: {hours_until} hours

Make sure you're ready for the submission. You can view or modify this scheduled application in your Job Tracker.

---
Job Opportunities Tracker - Metamorphosis
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
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Scheduled Application</h1>
                        </td>
                    </tr>
                    
                    <!-- Urgency Badge -->
                    <tr>
                        <td style="padding: 30px 20px 20px 20px; text-align: center;">
                            <div style="display: inline-block; background-color: {urgency_color}; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 18px;">
                                {urgency}: {hours_until} hours until submission
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Job Details -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Position:</strong><br>
                                        <span style="color: #667eea; font-size: 18px; font-weight: 600;">{job_title}</span>
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
                                        <strong style="color: #6c757d; font-size: 14px;">Package:</strong><br>
                                        <span style="color: #333; font-size: 16px;">📦 {package_name}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Scheduled Time:</strong><br>
                                        <span style="color: #333; font-size: 16px;">📅 {formatted_time}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Action Button -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="{self.frontend_url}/application-workflow?tab=schedules" 
                               style="display: inline-block; background-color: #667eea; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);">
                                View Scheduled Applications
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px;">
                                Make sure you're ready for the submission
                            </p>
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                Metamorphosis - Job Opportunities Tracker
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
        
        return self._send_email(recipient_email, subject, text, html)
    
    def send_deadline_reminder(
        self,
        recipient_email: str,
        job_title: str,
        company: str,
        deadline: str,
        days_until: int
    ) -> Dict[str, Any]:
        """
        Send application deadline reminder
        
        Args:
            recipient_email: Email address of the user
            job_title: Position title
            company: Company name
            deadline: ISO format deadline datetime
            days_until: Days until deadline
        
        Returns:
            Dict with success status and metadata
        """
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
        
        subject = f"⏰ Reminder: {company} Application Deadline"
        
        # Plain text version
        text = f"""
Job Application Deadline Reminder
{urgency}: {deadline_text}

Position: {job_title}
Company: {company}
Deadline: {formatted_deadline}

Don't forget to complete your application!

---
Job Opportunities Tracker - Metamorphosis
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
                            <a href="{self.frontend_url}/jobs" 
                               style="display: inline-block; background-color: #00bf72; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 10px rgba(0, 191, 114, 0.3);">
                                View in Job Tracker
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px;">
                                Don't forget to complete your application!
                            </p>
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                Metamorphosis - Job Opportunities Tracker
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
        
        return self._send_email(recipient_email, subject, text, html)
    
    def send_submission_success_notification(
        self,
        recipient_email: str,
        job_title: str,
        company: str,
        package_name: str,
        submission_time: str
    ) -> Dict[str, Any]:
        """
        Send confirmation that scheduled application was submitted
        
        Args:
            recipient_email: Email address of the user
            job_title: Position title
            company: Company name
            package_name: Name of the application package
            submission_time: ISO format datetime of submission
        
        Returns:
            Dict with success status and metadata
        """
        try:
            submitted_dt = datetime.fromisoformat(submission_time.replace('Z', '+00:00'))
            formatted_time = submitted_dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            formatted_time = submission_time
        
        subject = f"✅ Application Submitted: {company}"
        
        text = f"""
Application Submitted Successfully!

Your scheduled application has been submitted.

Position: {job_title}
Company: {company}
Package Used: {package_name}
Submitted: {formatted_time}

Great job staying on track with your applications!

---
Job Opportunities Tracker - Metamorphosis
"""
        
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
                        <td style="background: linear-gradient(135deg, #00bf72, #00d084); padding: 40px 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Application Submitted!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 20px 20px 20px; text-align: center;">
                            <p style="margin: 0; font-size: 18px; color: #333; font-weight: 600;">
                                Your scheduled application has been submitted successfully
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Position:</strong><br>
                                        <span style="color: #00bf72; font-size: 18px; font-weight: 600;">{job_title}</span>
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
                                        <strong style="color: #6c757d; font-size: 14px;">Package Used:</strong><br>
                                        <span style="color: #333; font-size: 16px;">📦 {package_name}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <strong style="color: #6c757d; font-size: 14px;">Submitted:</strong><br>
                                        <span style="color: #333; font-size: 16px;">📅 {formatted_time}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 20px 30px; text-align: center;">
                            <p style="margin: 0; color: #6c757d; font-size: 15px;">
                                🎯 Great job staying on track with your applications!
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="{self.frontend_url}/jobs" 
                               style="display: inline-block; background-color: #00bf72; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 10px rgba(0, 191, 114, 0.3);">
                                View Application Status
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                Metamorphosis - Job Opportunities Tracker
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
        
        return self._send_email(recipient_email, subject, text, html)


# Singleton instance
scheduling_service = SchedulingService()