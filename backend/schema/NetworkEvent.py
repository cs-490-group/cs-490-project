from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class NetworkingEvent(BaseModel):
    """UC-088: Networking Event Management"""
    event_name: str
    event_type: Literal["conference", "meetup", "workshop", "webinar", "social", "virtual", "other"]
    event_date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    registration_status: Literal["not_registered", "registered", "attended", "cancelled"] = "not_registered"
    networking_goals: Optional[List[str]] = None
    pre_event_prep: Optional[str] = None
    target_companies: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    attendance_confirmed: Optional[bool] = False
    new_connections_made: Optional[List[str]] = None  # Contact IDs
    follow_up_actions: Optional[List[str]] = None
    event_notes: Optional[str] = None
    roi_rating: Optional[Literal["high", "medium", "low", "none"]] = None
    would_recommend: Optional[bool] = None

class EventPreparation(BaseModel):
    """Pre-event research and preparation"""
    event_id: str
    research_companies: Optional[List[str]] = None
    research_attendees: Optional[List[str]] = None
    preparation_notes: Optional[str] = None
    questions_prepared: Optional[List[str]] = None
    elevator_pitch: Optional[str] = None

class EventFollowUp(BaseModel):
    """Post-event follow-up tracking"""
    event_id: str
    follow_up_date: str
    contact_id: str
    follow_up_type: Literal["email", "linkedin", "phone", "meeting"]
    follow_up_status: Literal["pending", "completed", "scheduled"] = "pending"
    notes: Optional[str] = None
    next_action: Optional[str] = None
