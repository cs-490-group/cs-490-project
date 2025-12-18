from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class Numbers(BaseModel):
    primary: Optional[str] = None  # Fixed: should be string, not literal
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
    type: Optional[Literal["call", "email", "meeting", "message", "event", "other"]] = None
    notes: Optional[str] = None

class ContactEducation(BaseModel):
    """Education information for network contacts"""
    institution_name: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_date: Optional[str] = None
    education_level: Optional[str] = None
    achievements: Optional[str] = None

class UserAssociation(BaseModel):
    """Tracks a user's association with a contact"""
    uuid: str  # User's UUID
    added_date: Optional[datetime] = None
    relationship_to_owner: Optional[Literal["direct", "colleague_referral", "alumni", "discovery", "imported"]] = "direct"
    personal_notes: Optional[str] = None  # User-specific notes about this contact

class Contact(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None  # UNIQUE IDENTIFIER
    phone_numbers: Optional[Numbers] = None
    websites: Optional[Websites] = None
    employment: Optional[Employment] = None
    education: Optional[ContactEducation] = None
    
    # UC-086: Relationship context and categorization
    relationship_type: Optional[Literal["colleague", "mentor", "mentee", "friend", "client", "recruiter", "other"]] = None
    industry: Optional[str] = None
    relationship_strength: Optional[Literal["strong", "moderate", "weak"]] = None
    industry_professional: Optional[bool] = False
    
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
    
    # NEW: Contact ownership and user associations
    owned_by: Optional[str] = None  # UUID of user who originally created this contact
    associated_users: Optional[List[UserAssociation]] = None  # All users who have associated with this contact