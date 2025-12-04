"""
Combined Follow-Up Template Service with Email Sending
Generates personalized follow-up communication templates and sends emails
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, List, Any


class FollowUpService:
    """Service for generating interview follow-up templates and sending emails"""
    
    def __init__(self):
        """Initialize email configuration"""
        self.sender_email = os.getenv("GMAIL_SENDER")
        self.sender_password = os.getenv("GMAIL_APP_PASSWORD")
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 465
    
    # ========================================================================
    # EMAIL SENDING METHODS
    # ========================================================================
    
    def _validate_credentials(self) -> None:
        """Validate that email credentials are configured"""
        if not self.sender_email or not self.sender_password:
            raise ValueError(
                "Email credentials not configured. "
                "Please set GMAIL_SENDER and GMAIL_APP_PASSWORD environment variables."
            )
    
    def _get_emoji_for_template_type(self, template_type: str) -> str:
        """Get the appropriate emoji for a template type"""
        emoji_map = {
            "thank_you": "✉️",
            "status_inquiry": "❓",
            "feedback_request": "📝",
            "networking": "🤝",
            "reminder": "⏰"
        }
        return emoji_map.get(template_type, "📧")
    
    def _create_html_body(self, body: str, template_type: str) -> str:
        """Create formatted HTML email body"""
        emoji = self._get_emoji_for_template_type(template_type)
        
        return f"""
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
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <div style="white-space: pre-wrap; font-size: 16px; line-height: 1.8; color: #333;">
{body}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;">
                                {emoji} This email was sent via <strong style="color: #004d7a;">Metamorphosis</strong> Interview Follow-Up Manager
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
    
    def send_followup_email(
        self,
        recipient_email: str,
        sender_name: str,
        subject: str,
        body: str,
        template_type: str
    ) -> Dict[str, Any]:
        """
        Send a follow-up email using Gmail SMTP
        
        Args:
            recipient_email: Email address of the recipient
            sender_name: Name of the person sending the email
            subject: Email subject line
            body: Email body content (plain text)
            template_type: Type of template (thank_you, status_inquiry, etc.)
        
        Returns:
            Dict with success status and metadata
        
        Raises:
            ValueError: If email credentials are not configured
            Exception: If email sending fails
        """
        self._validate_credentials()
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{sender_name} <{self.sender_email}>"
        message["To"] = recipient_email
        message["Reply-To"] = self.sender_email
        
        # Create both plain text and HTML versions
        text_part = MIMEText(body, "plain")
        html_part = MIMEText(self._create_html_body(body, template_type), "html")
        
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
                "template_type": template_type
            }
        except smtplib.SMTPAuthenticationError as e:
            raise Exception(f"Email authentication failed. Check credentials: {str(e)}")
        except smtplib.SMTPException as e:
            raise Exception(f"SMTP error occurred: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to send email: {str(e)}")
    
    def send_interview_reminder(
        self,
        recipient_email: str,
        recipient_name: str,
        interview_data: Dict[str, Any],
        hours_until: int
    ) -> Dict[str, Any]:
        """
        Send an interview reminder email
        
        Args:
            recipient_email: Email address of the recipient
            recipient_name: Name of the recipient
            interview_data: Dictionary with interview details
            hours_until: Number of hours until the interview
        
        Returns:
            Dict with success status and metadata
        """
        self._validate_credentials()
        
        # Format reminder message
        subject = f"Interview Reminder: {interview_data.get('job_title')} at {interview_data.get('company_name')}"
        
        body = f"""Dear {recipient_name},

This is a reminder that you have an interview coming up in {hours_until} hour(s).

Interview Details:
- Position: {interview_data.get('job_title')}
- Company: {interview_data.get('company_name')}
- Date & Time: {interview_data.get('interview_datetime')}
- Format: {interview_data.get('location_type', 'TBD')}

"""
        
        # Add location-specific details
        if interview_data.get('location_type') == 'video' and interview_data.get('video_link'):
            body += f"Video Link: {interview_data['video_link']}\n"
        elif interview_data.get('location_details'):
            body += f"Location: {interview_data['location_details']}\n"
        
        if interview_data.get('interviewer_name'):
            body += f"Interviewer: {interview_data['interviewer_name']}"
            if interview_data.get('interviewer_title'):
                body += f" ({interview_data['interviewer_title']})"
            body += "\n"
        
        body += f"""
Preparation Status: {interview_data.get('preparation_completion_percentage', 0)}% complete

Good luck with your interview!

Best regards,
Metamorphosis Interview Manager
"""
        
        return self.send_followup_email(
            recipient_email=recipient_email,
            sender_name="Metamorphosis",
            subject=subject,
            body=body,
            template_type="reminder"
        )
    
    # ========================================================================
    # TEMPLATE GENERATION METHODS
    # ========================================================================
    
    @staticmethod
    def generate_thank_you_email(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        interview_date: datetime,
        user_full_name: Optional[str] = None,
        specific_topics: Optional[List[str]] = None,
        custom_notes: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate a personalized thank you email template"""
        date_str = interview_date.strftime("%B %d")
        subject = f"Thank You - {job_title} Interview"
        
        body_parts = []
        
        # Opening
        body_parts.append(f"Dear {interviewer_name}," if interviewer_name else "Dear Hiring Team,")
        body_parts.append("")
        
        # Main paragraph
        body_parts.append(
            f"Thank you for taking the time to meet with me on {date_str} to discuss the "
            f"{job_title} position at {company_name}. I truly enjoyed our conversation and "
            f"learning more about the role and your team."
        )
        body_parts.append("")
        
        # Specific topics
        if specific_topics and len(specific_topics) > 0:
            if len(specific_topics) == 1:
                body_parts.append(
                    f"I was particularly interested in our discussion about {specific_topics[0]}. "
                    f"It reinforced my enthusiasm for this opportunity and how my skills align "
                    f"with the team's needs."
                )
            else:
                topics_str = ", ".join(specific_topics[:-1]) + f", and {specific_topics[-1]}"
                body_parts.append(
                    f"I was particularly interested in our discussions about {topics_str}. "
                    f"These conversations reinforced my enthusiasm for this opportunity and "
                    f"confirmed that my background aligns well with what you're looking for."
                )
            body_parts.append("")
        
        # Custom notes
        if custom_notes:
            body_parts.append(custom_notes)
            body_parts.append("")
        
        # Value proposition
        body_parts.append(
            f"I'm excited about the possibility of contributing to {company_name}'s success "
            f"and believe my experience would enable me to make an immediate impact on your team. "
            f"I'm confident that I would be a strong addition to your organization."
        )
        body_parts.append("")
        
        # Closing
        body_parts.append(
            f"Thank you again for the opportunity to interview. I look forward to hearing "
            f"from you about the next steps in the process. Please don't hesitate to reach "
            f"out if you need any additional information."
        )
        body_parts.append("")
        body_parts.append("Best regards,")
        body_parts.append(user_full_name if user_full_name else "[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts)
        }
    
    @staticmethod
    def generate_status_inquiry(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        interview_date: datetime,
        days_since_interview: int,
        user_full_name: Optional[str] = None,
        specific_topics: Optional[List[str]] = None,
        custom_notes: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate a status inquiry email for delayed response"""
        subject = f"Following Up - {job_title} Position"
        
        body_parts = []
        body_parts.append(f"Dear {interviewer_name}," if interviewer_name else "Dear Hiring Team,")
        body_parts.append("")
        
        date_str = interview_date.strftime("%B %d")
        body_parts.append(
            f"I hope this email finds you well. I wanted to follow up regarding the "
            f"{job_title} position we discussed during our interview on {date_str}."
        )
        body_parts.append("")
        
        body_parts.append(
            f"I remain very interested in joining {company_name} and contributing to "
            f"your team's success. Our conversation further confirmed that this role "
            f"aligns well with my skills and career goals."
        )
        body_parts.append("")
        
        # Add specific topics if provided
        if specific_topics and len(specific_topics) > 0:
            if len(specific_topics) == 1:
                body_parts.append(
                    f"I've continued to think about our discussion regarding {specific_topics[0]}, "
                    f"and it has only increased my enthusiasm for this opportunity."
                )
            else:
                topics_str = ", ".join(specific_topics[:-1]) + f", and {specific_topics[-1]}"
                body_parts.append(
                    f"I've continued to reflect on our discussions about {topics_str}, "
                    f"and these areas have only increased my enthusiasm for this role."
                )
            body_parts.append("")
        
        # Add custom notes if provided
        if custom_notes:
            body_parts.append(custom_notes)
            body_parts.append("")
        
        if days_since_interview < 10:
            body_parts.append(
                "I understand that these decisions take time. I wanted to check in to see "
                "if there are any updates on the hiring timeline or if you need any "
                "additional information from me."
            )
        else:
            body_parts.append(
                "I wanted to check in to see if there are any updates on the position or "
                "if you need any additional information from me to help with your decision."
            )
        
        body_parts.append("")
        body_parts.append("Thank you again for considering my application. I look forward to hearing from you.")
        body_parts.append("")
        body_parts.append("Best regards,")
        body_parts.append(user_full_name if user_full_name else "[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts)
        }
    
    @staticmethod
    def generate_feedback_request(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        was_selected: bool,
        user_full_name: Optional[str] = None,
        specific_topics: Optional[List[str]] = None,
        custom_notes: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate a feedback request email"""
        subject = f"Thank You - {job_title} Offer" if was_selected else f"Feedback Request - {job_title} Interview"
        
        body_parts = []
        body_parts.append(f"Dear {interviewer_name}," if interviewer_name else "Dear Hiring Team,")
        body_parts.append("")
        
        if was_selected:
            body_parts.append(
                f"I'm excited to have accepted the {job_title} position at {company_name}. "
                f"As I prepare to join the team, I would appreciate any feedback or insights "
                f"you can share about areas where I can focus my preparation to ensure a "
                f"smooth start."
            )
            body_parts.append("")
            
            # Add specific topics for accepted offer
            if specific_topics and len(specific_topics) > 0:
                if len(specific_topics) == 1:
                    body_parts.append(
                        f"I'm particularly looking forward to working on {specific_topics[0]} "
                        f"and would appreciate any guidance on how to best prepare."
                    )
                else:
                    topics_str = ", ".join(specific_topics[:-1]) + f", and {specific_topics[-1]}"
                    body_parts.append(
                        f"I'm particularly looking forward to working on areas like {topics_str} "
                        f"and would appreciate any guidance on how to best prepare for these aspects of the role."
                    )
                body_parts.append("")
        else:
            body_parts.append(
                f"Thank you for taking the time to interview me for the {job_title} position. "
                f"While I'm disappointed not to be moving forward, I appreciate the opportunity "
                f"to learn about {company_name}."
            )
            body_parts.append("")
            
            # Add specific topics for rejection
            if specific_topics and len(specific_topics) > 0:
                if len(specific_topics) == 1:
                    body_parts.append(
                        f"I particularly valued our discussion about {specific_topics[0]} "
                        f"and would appreciate any feedback on how I presented myself in this area."
                    )
                else:
                    topics_str = ", ".join(specific_topics[:-1]) + f", and {specific_topics[-1]}"
                    body_parts.append(
                        f"I particularly valued our discussions about {topics_str} "
                        f"and would appreciate feedback on these aspects of my candidacy."
                    )
                body_parts.append("")
            
            body_parts.append(
                "I'm committed to continuous improvement and would greatly appreciate any "
                "feedback you could provide about my interview performance. Understanding "
                "areas where I could strengthen my candidacy would be invaluable for my "
                "professional development."
            )
        
        body_parts.append("")
        
        # Add custom notes if provided
        if custom_notes:
            body_parts.append(custom_notes)
            body_parts.append("")
        
        body_parts.append(
            "Any insights you can share would be greatly appreciated. Thank you again for "
            "your time and consideration."
        )
        body_parts.append("")
        body_parts.append("Best regards,")
        body_parts.append(user_full_name if user_full_name else "[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts)
        }
    
    @staticmethod
    def generate_networking_followup(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        user_full_name: Optional[str] = None,
        connection_request: bool = True,
        specific_topics: Optional[List[str]] = None,
        custom_notes: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate a networking follow-up for rejected applications"""
        subject = "Thank You and Staying Connected"
        
        body_parts = []
        body_parts.append(f"Dear {interviewer_name}," if interviewer_name else "Dear Hiring Team,")
        body_parts.append("")
        
        body_parts.append(
            f"I wanted to reach out one more time to thank you for the opportunity to "
            f"interview for the {job_title} position at {company_name}. Although I won't "
            f"be joining the team at this time, I truly enjoyed learning about your work "
            f"and the culture at {company_name}."
        )
        body_parts.append("")
        
        # Add specific topics if provided
        if specific_topics and len(specific_topics) > 0:
            if len(specific_topics) == 1:
                body_parts.append(
                    f"Our conversation about {specific_topics[0]} was particularly enlightening "
                    f"and has given me valuable perspective on the field."
                )
            else:
                topics_str = ", ".join(specific_topics[:-1]) + f", and {specific_topics[-1]}"
                body_parts.append(
                    f"Our discussions about {topics_str} were particularly enlightening "
                    f"and have given me valuable perspective on these areas."
                )
            body_parts.append("")
        
        # Add custom notes if provided
        if custom_notes:
            body_parts.append(custom_notes)
            body_parts.append("")
        
        if connection_request and interviewer_name:
            body_parts.append(
                "I would love to stay connected and hear about any future opportunities "
                "that might be a good fit. I've been following your work and would be "
                "interested in keeping in touch as our careers progress."
            )
            body_parts.append("")
            body_parts.append(
                "If you're open to it, I'd appreciate the opportunity to connect on LinkedIn "
                "and stay in touch."
            )
        else:
            body_parts.append(
                "I would appreciate being kept in mind for any future opportunities at "
                f"{company_name} that might align with my background and skills."
            )
        
        body_parts.append("")
        body_parts.append("Wishing you and the team continued success.")
        body_parts.append("")
        body_parts.append("Best regards,")
        body_parts.append(user_full_name if user_full_name else "[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts)
        }
    
    @staticmethod
    def get_recommended_timing(template_type: str, interview_date: datetime) -> datetime:
        """Get recommended send time for different template types"""
        now = datetime.now(timezone.utc)
        
        if template_type == "thank_you":
            # Send within a few hours of interview
            recommended = interview_date + timedelta(hours=4)
            return max(recommended, now)
        elif template_type == "status_inquiry":
            # Follow up after 5 days
            recommended = interview_date + timedelta(days=5)
            return max(recommended, now)
        elif template_type == "feedback_request":
            # Give them a few days to decide
            return now + timedelta(days=3)
        elif template_type == "networking":
            # Wait a week after rejection
            return now + timedelta(days=7)
        else:
            return now


# Singleton instance
followup_service = FollowUpService()