"""
Informational Interview Reminder Email Service

Sends reminder emails to users before scheduled informational interviews.
Supports two reminder types:
- 24-hour reminder: Preparation and review
- 1-hour reminder: Urgent action (attend interview)
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os


class InterviewReminderService:
    """Generates and sends informational interview reminder emails"""

    def __init__(self):
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 465
        self.sender_email = os.getenv("GMAIL_SENDER")
        self.sender_password = os.getenv("GMAIL_APP_PASSWORD")

    async def send_interview_reminder_email(
        self,
        recipient_email: str,
        interview_data: dict,
        contact_info: dict,
        hours_until: int,
    ) -> dict:
        """
        Send an interview reminder email

        Args:
            recipient_email: User's email address
            interview_data: Interview details (company, format, topics, etc.)
            contact_info: Contact details (name, title, company)
            hours_until: Hours until interview (24 or 1)

        Returns:
            dict with success status and message
        """
        try:
            self._validate_credentials()

            # Determine urgency level
            if hours_until == 24:
                subject = f"📅 Interview Reminder: {contact_info.get('name', 'Contact')} - Tomorrow!"
                header_text = "Tomorrow - Time to prepare!"
                header_color = "#ffc107"  # Gold
                icon = "📅"
            else:  # 1 hour
                subject = f"⚡ URGENT: Interview with {contact_info.get('name', 'Contact')} starts in 1 hour!"
                header_text = "Starting in 1 Hour - Time to join!"
                header_color = "#dc3545"  # Red
                icon = "⚡"

            html_content = self._build_interview_html(
                interview_data, contact_info, hours_until, header_text, header_color, icon
            )
            text_content = self._build_interview_text(
                interview_data, contact_info, hours_until
            )

            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = recipient_email

            message.attach(MIMEText(text_content, "plain"))
            message.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())

            return {"success": True, "message": f"Interview reminder sent to {recipient_email}"}

        except smtplib.SMTPAuthenticationError:
            return {"success": False, "message": "Email authentication failed - check credentials"}
        except smtplib.SMTPException as e:
            return {"success": False, "message": f"SMTP error: {str(e)}"}
        except Exception as e:
            return {"success": False, "message": f"Error sending email: {str(e)}"}

    def _build_interview_html(
        self,
        interview_data: dict,
        contact_info: dict,
        hours_until: int,
        header_text: str,
        header_color: str,
        icon: str,
    ) -> str:
        """Build HTML email template for interview reminder"""

        interview_format = interview_data.get("interview_format", "video")
        format_emoji = self._get_format_emoji(interview_format)

        # Build topics section if available
        topics_html = ""
        if interview_data.get("topics_to_cover"):
            topics_list = "".join(
                [f"<li>{topic}</li>" for topic in interview_data.get("topics_to_cover", [])]
            )
            topics_html = f"""
            <tr>
                <td colspan="2" style="padding: 20px 20px 10px 20px; border-bottom: 1px solid #e0e0e0;">
                    <h4 style="color: #333; margin: 0 0 10px 0;">🎯 Topics to Cover</h4>
                    <ul style="color: #666; margin: 0; padding-left: 20px;">
                        {topics_list}
                    </ul>
                </td>
            </tr>
            """

        # Build questions section if available
        questions_html = ""
        if interview_data.get("questions_prepared"):
            questions_list = "".join(
                [f"<li>{q}</li>" for q in interview_data.get("questions_prepared", [])]
            )
            questions_html = f"""
            <tr>
                <td colspan="2" style="padding: 20px 20px 10px 20px; border-bottom: 1px solid #e0e0e0;">
                    <h4 style="color: #333; margin: 0 0 10px 0;">❓ Questions Prepared</h4>
                    <ul style="color: #666; margin: 0; padding-left: 20px;">
                        {questions_list}
                    </ul>
                </td>
            </tr>
            """

        # Build preparation framework section if available
        prep_html = ""
        if interview_data.get("preparation_framework"):
            prep_html = f"""
            <tr>
                <td colspan="2" style="padding: 20px 20px 10px 20px; border-bottom: 1px solid #e0e0e0;">
                    <h4 style="color: #333; margin: 0 0 10px 0;">📋 Preparation Framework</h4>
                    <div style="color: #666; white-space: pre-wrap; font-family: 'Courier New', monospace;">
                        {interview_data.get('preparation_framework')}
                    </div>
                </td>
            </tr>
            """

        # Build interview notes section if available
        notes_html = ""
        if interview_data.get("interview_notes"):
            notes_html = f"""
            <tr>
                <td colspan="2" style="padding: 20px 20px 10px 20px; border-bottom: 1px solid #e0e0e0;">
                    <h4 style="color: #333; margin: 0 0 10px 0;">📝 Notes</h4>
                    <div style="color: #666;">
                        {interview_data.get('interview_notes')}
                    </div>
                </td>
            </tr>
            """

        # Build checklist based on urgency
        if hours_until == 24:
            checklist = """
            <tr>
                <td colspan="2" style="padding: 20px 20px 10px 20px;">
                    <h4 style="color: #333; margin: 0 0 10px 0;">✅ Pre-Interview Checklist</h4>
                    <div style="color: #666; line-height: 1.8;">
                        <div>✓ Review company and person research</div>
                        <div>✓ Prepare your talking points and stories</div>
                        <div>✓ Test your technology (camera, microphone, internet)</div>
                        <div>✓ Find a quiet location for the interview</div>
                        <div>✓ Have questions ready to ask</div>
                        <div>✓ Set a reminder for 30 minutes before</div>
                    </div>
                </td>
            </tr>
            """
        else:  # 1 hour
            checklist = """
            <tr>
                <td colspan="2" style="padding: 20px 20px 10px 20px;">
                    <h4 style="color: #333; margin: 0 0 10px 0;">⚡ Get Ready Now</h4>
                    <div style="color: #666; line-height: 1.8;">
                        <div>✓ Test your technology setup immediately</div>
                        <div>✓ Find a quiet location</div>
                        <div>✓ Quick mental review of key points</div>
                        <div>✓ Have interview details ready</div>
                        <div>✓ Set timer for exact interview time</div>
                    </div>
                </td>
            </tr>
            """

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                table {{ width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse; }}
                .header {{ background-color: {header_color}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .header h2 {{ margin: 0; font-size: 24px; }}
                .header p {{ margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }}
                .content {{ background-color: #f9f9f9; padding: 0; }}
                .content h3 {{ color: #0066cc; margin: 15px 0 10px 0; }}
                .section {{ padding: 15px 20px; border-bottom: 1px solid #e0e0e0; }}
                .section-title {{ font-weight: bold; color: #333; margin-bottom: 5px; }}
                .section-value {{ color: #666; }}
                .footer {{ background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px; }}
                .button {{ background-color: {header_color}; color: white; padding: 12px 30px; text-align: center; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 10px; }}
            </style>
        </head>
        <body>
            <table>
                <tr>
                    <td class="header">
                        <h2>{icon} {header_text}</h2>
                        <p>Interview with {contact_info.get('name', 'Contact')}</p>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 20px 20px 10px 20px; border-bottom: 1px solid #e0e0e0;">
                        <h4 style="color: #333; margin: 0 0 10px 0;">👤 Contact Information</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="width: 40%; padding: 5px; color: #999; font-size: 12px;">Name</td>
                                <td style="padding: 5px; color: #333;">{contact_info.get('name', 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="width: 40%; padding: 5px; color: #999; font-size: 12px;">Title</td>
                                <td style="padding: 5px; color: #333;">{contact_info.get('title', 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="width: 40%; padding: 5px; color: #999; font-size: 12px;">Company</td>
                                <td style="padding: 5px; color: #333;">{contact_info.get('company', 'N/A')}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 20px 20px 10px 20px; border-bottom: 1px solid #e0e0e0;">
                        <h4 style="color: #333; margin: 0 0 10px 0;">🎙️ Interview Details</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="width: 40%; padding: 5px; color: #999; font-size: 12px;">Format</td>
                                <td style="padding: 5px; color: #333;">{format_emoji} {interview_format.capitalize()}</td>
                            </tr>
                            <tr>
                                <td style="width: 40%; padding: 5px; color: #999; font-size: 12px;">Date</td>
                                <td style="padding: 5px; color: #333;">{interview_data.get('scheduled_date', 'N/A')}</td>
                            </tr>
                            <tr>
                                <td style="width: 40%; padding: 5px; color: #999; font-size: 12px;">Time</td>
                                <td style="padding: 5px; color: #333;">{interview_data.get('start_time', 'N/A')}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                {topics_html}
                {questions_html}
                {prep_html}
                {notes_html}
                {checklist}
                <tr>
                    <td colspan="2" style="padding: 20px; text-align: center;">
                        <a href="#" class="button">View Interview Details</a>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" class="footer">
                        <p>This is an automated reminder. Your interview is scheduled for {interview_data.get('scheduled_date')} at {interview_data.get('start_time')}.</p>
                        <p>Good luck! Make it a great conversation! 💪</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        return html

    def _build_interview_text(
        self, interview_data: dict, contact_info: dict, hours_until: int
    ) -> str:
        """Build plain text email template for interview reminder"""

        interview_format = interview_data.get("interview_format", "video")

        if hours_until == 24:
            header = "TOMORROW - Time to prepare for your interview!"
        else:
            header = "URGENT: Your interview starts in 1 hour!"

        text = f"""
{header}

Interview with {contact_info.get('name', 'Contact')}
{'='*60}

👤 Contact Information
  Name: {contact_info.get('name', 'N/A')}
  Title: {contact_info.get('title', 'N/A')}
  Company: {contact_info.get('company', 'N/A')}

🎙️ Interview Details
  Format: {interview_format.capitalize()}
  Date: {interview_data.get('scheduled_date', 'N/A')}
  Time: {interview_data.get('start_time', 'N/A')}
"""

        # Add topics if available
        if interview_data.get("topics_to_cover"):
            text += "\n🎯 Topics to Cover\n"
            for topic in interview_data.get("topics_to_cover", []):
                text += f"  • {topic}\n"

        # Add questions if available
        if interview_data.get("questions_prepared"):
            text += "\n❓ Questions Prepared\n"
            for question in interview_data.get("questions_prepared", []):
                text += f"  • {question}\n"

        # Add preparation framework if available
        if interview_data.get("preparation_framework"):
            text += f"\n📋 Preparation Framework\n{interview_data.get('preparation_framework')}\n"

        # Add notes if available
        if interview_data.get("interview_notes"):
            text += f"\n📝 Notes\n{interview_data.get('interview_notes')}\n"

        # Add checklist
        if hours_until == 24:
            text += """
✅ Pre-Interview Checklist
  ✓ Review company and person research
  ✓ Prepare your talking points and stories
  ✓ Test your technology (camera, microphone, internet)
  ✓ Find a quiet location for the interview
  ✓ Have questions ready to ask
  ✓ Set a reminder for 30 minutes before
"""
        else:
            text += """
⚡ Get Ready Now
  ✓ Test your technology setup immediately
  ✓ Find a quiet location
  ✓ Quick mental review of key points
  ✓ Have interview details ready
  ✓ Set timer for exact interview time
"""

        text += f"""
{'='*60}
Good luck! Make it a great conversation! 💪

This is an automated reminder. Your interview is scheduled for {interview_data.get('scheduled_date')} at {interview_data.get('start_time')}.
"""
        return text

    def _get_format_emoji(self, format_type: str) -> str:
        """Get emoji for interview format"""
        emojis = {
            "phone": "☎️",
            "video": "📹",
            "in_person": "🤝",
            "coffee": "☕",
        }
        return emojis.get(format_type, "🎙️")

    def _validate_credentials(self) -> bool:
        """Validate email credentials are configured"""
        if not self.sender_email or not self.sender_password:
            raise ValueError("Email credentials not configured (GMAIL_SENDER, GMAIL_APP_PASSWORD)")
        return True


interview_reminder_service = InterviewReminderService()
