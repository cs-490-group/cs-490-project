from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class ProfessionalReference(BaseModel):
    """UC-095: Professional Reference Management"""
    contact_id: str  # Link to professional contact
    reference_type: Literal["professional", "academic", "personal", "manager", "colleague", "client"]
    company: Optional[str] = None
    position: Optional[str] = None
    relationship_duration: Optional[str] = None
    availability: Literal["available", "busy", "unavailable", "ask_first"] = "ask_first"
    preferred_contact_method: Literal["email", "phone", "text"] = "email"
    best_time_to_contact: Optional[str] = None
    reference_strength: Literal["strong", "moderate", "general"] = "moderate"
    usage_history: Optional[List[dict]] = None
    last_used_date: Optional[str] = None
    usage_count: Optional[int] = 0
    notes_for_reference: Optional[str] = None
    key_talking_points: Optional[List[str]] = None
    specific_projects: Optional[List[str]] = None
    skills_to_highlight: Optional[List[str]] = None
    relationship_maintenance: Optional[str] = None
    thank_you_sent: Optional[bool] = False
    last_thank_you_date: Optional[str] = None
    feedback_received: Optional[str] = None
    reference_success_rate: Optional[float] = None

class ReferenceRequest(BaseModel):
    """Individual reference requests"""
    reference_id: str
    job_application_id: Optional[str] = None
    company: str
    position: str
    request_date: str
    request_method: Literal["email", "phone", "in_person", "text"]
    request_template: Optional[str] = None
    personalized_message: Optional[str] = None
    status: Literal["requested", "accepted", "declined", "completed", "no_response"] = "requested"
    response_date: Optional[str] = None
    reference_provided: Optional[bool] = False
    reference_content: Optional[str] = None
    follow_up_required: Optional[bool] = False
    follow_up_date: Optional[str] = None
    outcome: Optional[Literal["successful", "unsuccessful", "pending"]] = None
    notes: Optional[str] = None

class ReferencePreparation(BaseModel):
    """Reference preparation materials"""
    reference_id: str
    preparation_date: str
    target_opportunity_type: Optional[str] = None
    resume_copy: Optional[str] = None
    key_achievements: Optional[List[str]] = None
    projects_to_discuss: Optional[List[str]] = None
    skills_emphasis: Optional[List[str]] = None
    conversation_tips: Optional[str] = None
    potential_questions: Optional[List[str]] = None
    thank_you_template: Optional[str] = None
