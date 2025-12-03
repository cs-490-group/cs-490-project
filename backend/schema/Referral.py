from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class ReferralRequest(BaseModel):
    """UC-087: Referral Request Management"""
    contact_id: str  # Link to professional contact
    job_application_id: Optional[str] = None  # Link to specific job application
    company: str
    position: str
    request_date: Optional[str] = None
    status: Optional[Literal["pending", "requested", "accepted", "declined", "completed"]] = "pending"
    request_template: Optional[str] = None
    personalized_message: Optional[str] = None
    follow_up_date: Optional[str] = None
    response_date: Optional[str] = None
    referral_success: Optional[Literal["pending", "successful", "unsuccessful"]] = None
    notes: Optional[str] = None
    relationship_impact: Optional[Literal["positive", "neutral", "negative"]] = None
    gratitude_sent: Optional[bool] = False
    gratitude_date: Optional[str] = None

class ReferralOutcome(BaseModel):
    """Track referral results and relationship impact"""
    referral_id: str
    outcome: Literal["interview_scheduled", "offer_received", "rejected", "no_response"]
    outcome_date: Optional[str] = None
    feedback_received: Optional[str] = None
    relationship_maintained: Optional[bool] = True
    reciprocity_opportunity: Optional[str] = None
