"""
Referral Follow-Up Reminder Service
Handles scheduled reminders to send follow-up messages to referral contacts.
Supports two follow-up types:
- "standard": Regular follow-up message
- "thank_you": Thank you message
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Any, List
import pytz


class ReferralFollowUpService:
    """Service for generating and sending referral follow-up reminder emails"""
    
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
    # FOLLOW-UP TYPE CONFIGURATIONS
    # ========================================================================
    
    def _get_followup_config(self, followup_type: str) -> Dict[str, Any]:
        """Get configuration for follow-up type"""
        configs = {
            "standard": {
                "icon": "📧",
                "title": "Follow-Up Message",
                "description": "Send a follow-up message to continue the conversation",
                "action_purpose": "keep the conversation going",
                "color": "#0066cc"
            },
            "thank_you": {
                "icon": "🙏",
                "title": "Thank You Message",
                "description": "Send a thank you message to show appreciation",
                "action_purpose": "express your gratitude",
                "color": "#00aa44"
            }
        }
        return configs.get(followup_type, configs["standard"])
    
    # ========================================================================
    # EMAIL TEMPLATE METHODS
    # ========================================================================
    
    def _build_followup_html(
        self, 
        followup_data: Dict[str, Any],
        referral_data: Dict[str, Any],
        contact_info: Dict[str, Any],
        hours_until: int,
        user_email: str
    ) -> str:
        """
        Build HTML email template for follow-up reminder
        """
        followup_type = followup_data.get('type', 'standard')
        config = self._get_followup_config(followup_type)
        
        urgency_class = "urgent" if hours_until == 0 else "upcoming"
        urgency_text = "TODAY - Time to send your follow-up!" if hours_until == 0 else "TOMORROW - Prepare to send your follow-up"
        urgency_color = "#dc3545" if hours_until == 0 else "#ffc107"
        action_button_text = "Send Follow-Up Now" if hours_until == 0 else "View & Prepare Follow-Up"
        action_link = f"{self.frontend_url}/network/referrals"
        
        contact_name = contact_info.get('name', 'Your Contact')
        contact_email = contact_info.get('email', 'N/A')
        contact_company = contact_info.get('company', 'N/A')
        contact_title = contact_info.get('title', 'N/A')
        
        referral_company = referral_data.get('company', 'N/A')
        referral_position = referral_data.get('position', 'N/A')
        followup_message = followup_data.get('message', '')
        referral_notes = referral_data.get('notes', '')
        
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
                                {config['icon']} {config['title']} Reminder
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
                                <span style="font-size: 32px;">{'⚡' if hours_until == 0 else '📅'}</span>
                                <div>
                                    <strong style="color: {urgency_color}; font-size: 14px;">
                                        {'Action Required Today!' if hours_until == 0 else 'Prepare Tomorrow'}
                                    </strong>
                                    <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">
                                        {'It\'s time to send your follow-up message.' if hours_until == 0 else 'You have one day to prepare before sending your follow-up message.'}
                                    </p>
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 25px 0; color: #333; font-size: 20px;">
                                📋 Follow-Up Details
                            </h2>
                            
                            <!-- Follow-Up Type Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid {config['color']}; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: {config['color']}; font-size: 16px;">
                                    {config['icon']} Follow-Up Type
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.8; color: #333;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600; width: 150px;">Type:</td>
                                        <td style="padding: 8px 0;">{config['title']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Purpose:</td>
                                        <td style="padding: 8px 0;">Help {config['action_purpose']} with {contact_name}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Contact Information Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #004d7a; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #004d7a; font-size: 16px;">
                                    👤 Contact Information
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.8; color: #333;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600; width: 150px;">Name:</td>
                                        <td style="padding: 8px 0;">{contact_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Email:</td>
                                        <td style="padding: 8px 0;">
                                            <code style="background-color: #fff3cd; padding: 2px 6px; border-radius: 3px; font-family: monospace;">{contact_email}</code>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Title:</td>
                                        <td style="padding: 8px 0;">{contact_title}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Company:</td>
                                        <td style="padding: 8px 0;">{contact_company}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Job Information Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #00bf72; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #00bf72; font-size: 16px;">
                                    💼 Position Context
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.8; color: #333;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600; width: 150px;">Position:</td>
                                        <td style="padding: 8px 0;">{referral_position}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: 600;">Company:</td>
                                        <td style="padding: 8px 0;">{referral_company}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Follow-Up Message Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid {config['color']}; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: {config['color']}; font-size: 16px;">
                                    ✍️ Your Follow-Up Message
                                </h3>
                                <div style="background-color: white; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #333;">
                                    {followup_message if followup_message else '(No message added)'}
                                </div>
                            </div>
                            
                            {f'''
                            <!-- Additional Context Section -->
                            <div style="background-color: #f9f9f9; border-left: 4px solid #6f42c1; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #6f42c1; font-size: 16px;">
                                    📝 Context from Original Referral
                                </h3>
                                <div style="font-size: 14px; line-height: 1.6; color: #333;">
                                    {referral_notes}
                                </div>
                            </div>
                            ''' if referral_notes else ''}
                            
                            <!-- Action Items -->
                            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #004d7a; font-size: 16px;">
                                    ✓ Quick Checklist
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #333;">
                                    <li>Review the follow-up message and context</li>
                                    <li>Personalize if needed for the moment</li>
                                    <li>Check contact information is current</li>
                                    <li>Send the follow-up email to {contact_name}</li>
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
                                {config['icon']} This is a reminder from <strong style="color: #004d7a;">Metamorphosis</strong> - your follow-up is scheduled for {('today' if hours_until == 0 else 'tomorrow')}.
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
    
    def _build_followup_text(
        self,
        followup_data: Dict[str, Any],
        referral_data: Dict[str, Any],
        contact_info: Dict[str, Any],
        hours_until: int
    ) -> str:
        """Build plain text version of follow-up reminder"""
        followup_type = followup_data.get('type', 'standard')
        config = self._get_followup_config(followup_type)
        
        urgency_text = "TODAY - Time to send your follow-up!" if hours_until == 0 else "TOMORROW - Prepare to send your follow-up"
        
        contact_name = contact_info.get('name', 'Your Contact')
        contact_email = contact_info.get('email', 'N/A')
        contact_company = contact_info.get('company', 'N/A')
        contact_title = contact_info.get('title', 'N/A')
        
        referral_company = referral_data.get('company', 'N/A')
        referral_position = referral_data.get('position', 'N/A')
        followup_message = followup_data.get('message', '(No message added)')
        referral_notes = referral_data.get('notes', '')
        
        text = f"""
{config['icon']} FOLLOW-UP REMINDER

{urgency_text}

============================================
FOLLOW-UP TYPE
============================================
Type: {config['title']}
Purpose: {config['action_purpose']}

============================================
CONTACT INFORMATION
============================================
Name: {contact_name}
Email: {contact_email}
Title: {contact_title}
Company: {contact_company}

============================================
POSITION CONTEXT
============================================
Position: {referral_position}
Company: {referral_company}

============================================
YOUR FOLLOW-UP MESSAGE
============================================
{followup_message}

"""
        
        if referral_notes:
            text += f"""============================================
CONTEXT FROM ORIGINAL REFERRAL
============================================
{referral_notes}

"""
        
        text += f"""============================================
NEXT STEPS
============================================
1. Review the follow-up message above
2. Consider the context and timing
3. When ready, send an email to {contact_name} at {contact_email}
4. Mark the follow-up as sent in Metamorphosis

View and manage your referrals: {self.frontend_url}/network/referrals

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
    
    def send_followup_reminder_email(
        self,
        recipient_email: str,
        followup_data: Dict[str, Any],
        referral_data: Dict[str, Any],
        contact_info: Dict[str, Any],
        hours_until: int
    ) -> Dict[str, Any]:
        """
        Send a follow-up reminder email to the user
        
        Args:
            recipient_email: Email address of the user being reminded
            followup_data: Follow-up details (type, message)
            referral_data: Original referral details (company, position, notes)
            contact_info: Contact details to follow up with
            hours_until: Hours until follow-up date (24 or 0)
        
        Returns:
            Dict with success status and metadata
        
        Raises:
            ValueError: If email credentials are not configured
            Exception: If email sending fails
        """
        self._validate_credentials()
        
        followup_type = followup_data.get('type', 'standard')
        config = self._get_followup_config(followup_type)
        contact_name = contact_info.get('name', 'Contact')
        company = referral_data.get('company', 'Company')
        
        if hours_until == 24:
            subject = f"{config['icon']} Follow-Up Reminder: {contact_name} at {company} (Tomorrow)"
        elif hours_until == 0:
            subject = f"⚡ URGENT: Send Your Follow-Up Today - {contact_name} at {company}"
        else:
            subject = f"{config['icon']} Follow-Up Reminder: {contact_name}"
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.sender_email
        message["To"] = recipient_email
        
        # Create both plain text and HTML versions
        text_part = MIMEText(
            self._build_followup_text(followup_data, referral_data, contact_info, hours_until),
            "plain"
        )
        html_part = MIMEText(
            self._build_followup_html(followup_data, referral_data, contact_info, hours_until, recipient_email),
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
                "contact_name": contact_name,
                "company": company,
                "followup_type": followup_type,
                "hours_until": hours_until,
                "urgency": "URGENT" if hours_until == 0 else "upcoming"
            }
        except smtplib.SMTPAuthenticationError as e:
            raise Exception(f"Email authentication failed. Check credentials: {str(e)}")
        except smtplib.SMTPException as e:
            raise Exception(f"SMTP error occurred: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to send follow-up reminder email: {str(e)}")


# Global instance
referral_followup_service = ReferralFollowUpService()
