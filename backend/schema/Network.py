from pydantic import BaseModel
from typing import Optional, Literal, List

class Numbers(BaseModel):
    primary: Optional[Literal["home", "work", "mobile"]] = None
    home: Optional[str] = None
    work: Optional[str] = None
    mobile: Optional[str] = None

class Websites(BaseModel):
    linkedin: Optional[str] = None
    # TODO: add more if necessary
    other: Optional[str] = None # any personal websites

class Employment(BaseModel):
    position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None

class InteractionRecord(BaseModel):
    """Track individual interactions with a contact"""
    date: Optional[str] = None
    type: Optional[Literal["call", "email", "meeting", "message", "other"]] = None
    notes: Optional[str] = None

class Contact(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone_numbers: Optional[Numbers] = None
    websites: Optional[Websites] = None
    employment: Optional[Employment] = None
    
    # UC-086: Relationship context and categorization
    relationship_type: Optional[Literal["colleague", "mentor", "mentee", "friend", "client", "recruiter", "other"]] = None
    industry: Optional[str] = None
    relationship_strength: Optional[Literal["strong", "moderate", "weak"]] = None
    
    # UC-086: Interaction history
    interaction_history: Optional[List[InteractionRecord]] = None
    last_interaction_date: Optional[str] = None
    
    # UC-086: Personal and professional interests
    professional_interests: Optional[str] = None
    personal_interests: Optional[str] = None
    
    # UC-086: Relationship maintenance
    notes: Optional[str] = None
    reminder_frequency: Optional[Literal["weekly", "monthly", "quarterly", "yearly", "none"]] = None
    next_reminder_date: Optional[str] = None
    
    # UC-086: Mutual connections and opportunities
    mutual_connections: Optional[List[str]] = None  # List of contact IDs
    linked_job_opportunities: Optional[List[str]] = None  # List of job opportunity IDs
    linked_companies: Optional[List[str]] = None  # List of company IDs