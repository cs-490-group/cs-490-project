from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class InformationalInterview(BaseModel):
    """UC-090: Informational Interview Management"""
    contact_id: str  # Link to professional contact
    company: Optional[str] = None
    industry: Optional[str] = None
    request_date: Optional[str] = None
    scheduled_date: Optional[str] = None
    status: Literal["requested", "scheduled", "confirmed", "completed", "cancelled", "no_response"] = "requested"
    request_template: Optional[str] = None
    personalized_request: Optional[str] = None
    preparation_framework: Optional[str] = None
    interview_format: Literal["phone", "video", "in_person", "coffee"] = "video"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    topics_to_cover: Optional[List[str]] = None
    questions_prepared: Optional[List[str]] = None
    interview_notes: Optional[str] = None
    key_insights: Optional[str] = None
    industry_intelligence: Optional[str] = None
    relationship_outcome: Literal["strengthened", "maintained", "weakened"] = "maintained"
    follow_up_sent: Optional[bool] = False
    follow_up_date: Optional[str] = None
    future_opportunities: Optional[List[str]] = None
    impact_on_job_search: Optional[Literal["high", "medium", "low", "none"]] = None

class InterviewPreparation(BaseModel):
    """Preparation framework for informational interviews"""
    interview_id: str
    research_topics: Optional[List[str]] = None
    company_research: Optional[str] = None
    person_research: Optional[str] = None
    career_questions: Optional[List[str]] = None
    industry_questions: Optional[List[str]] = None
    personal_story: Optional[str] = None
    talking_points: Optional[List[str]] = None

class InterviewFollowUp(BaseModel):
    """Post-interview follow-up templates and actions"""
    interview_id: str
    thank_you_template: Optional[str] = None
    personalized_message: Optional[str] = None
    follow_up_type: Literal["email", "linkedin_message", "handwritten_note"] = "email"
    sent_date: Optional[str] = None
    response_received: Optional[bool] = False
    next_steps: Optional[str] = None
