"""
Combined Follow-Up Template Service
Generates personalized follow-up communication templates
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, List


class FollowUpService:
    """Service for generating interview follow-up templates"""
    
    @staticmethod
    def generate_thank_you_email(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        interview_date: datetime,
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
        body_parts.append("[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts),
            "suggested_send_time": interview_date + timedelta(hours=24)
        }
    
    @staticmethod
    def generate_status_inquiry(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        interview_date: datetime,
        days_since_interview: int
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
        body_parts.append("[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts)
        }
    
    @staticmethod
    def generate_feedback_request(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        was_selected: bool
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
        else:
            body_parts.append(
                f"Thank you for taking the time to interview me for the {job_title} position. "
                f"While I'm disappointed not to be moving forward, I appreciate the opportunity "
                f"to learn about {company_name}."
            )
            body_parts.append("")
            body_parts.append(
                "I'm committed to continuous improvement and would greatly appreciate any "
                "feedback you could provide about my interview performance. Understanding "
                "areas where I could strengthen my candidacy would be invaluable for my "
                "professional development."
            )
        
        body_parts.append("")
        body_parts.append(
            "Any insights you can share would be greatly appreciated. Thank you again for "
            "your time and consideration."
        )
        body_parts.append("")
        body_parts.append("Best regards,")
        body_parts.append("[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts)
        }
    
    @staticmethod
    def generate_networking_followup(
        interviewer_name: str,
        company_name: str,
        job_title: str,
        connection_request: bool = True
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
        body_parts.append("[Your Name]")
        
        return {
            "subject": subject,
            "body": "\n".join(body_parts)
        }
    
    @staticmethod
    def get_recommended_timing(template_type: str, interview_date: datetime) -> datetime:
        """Get recommended send time for different template types"""
        from datetime import datetime, timezone
        
        now = datetime.now(timezone.utc)
        
        if template_type == "thank_you":
            recommended = interview_date + timedelta(hours=24)
            return max(recommended, now)
        elif template_type == "status_inquiry":
            recommended = interview_date + timedelta(days=8)
            return max(recommended, now)
        elif template_type == "feedback_request":
            return now + timedelta(days=2)
        elif template_type == "networking":
            return now + timedelta(days=7)
        else:
            return now


# Singleton instance
followup_service = FollowUpService()