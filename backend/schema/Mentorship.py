from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class MentorshipRelationship(BaseModel):
    """UC-091: Mentor and Career Coach Integration"""
    contact_id: str  # Link to professional contact
    relationship_type: Literal["mentor", "career_coach"]
    status: Literal["invited", "active", "paused", "completed"] = "invited"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    invitation_date: Optional[str] = None
    access_level: Literal["full", "limited", "custom"] = "limited"
    shared_data_types: Optional[List[Literal["profile", "resume", "applications", "interviews", "analytics"]]] = None
    mentorship_goals: Optional[List[str]] = None
    focus_areas: Optional[List[str]] = None
    meeting_frequency: Literal["weekly", "biweekly", "monthly", "quarterly", "as_needed"] = "monthly"
    communication_preferences: Optional[List[Literal["email", "phone", "video", "in_person"]]] = None
    progress_sharing_frequency: Literal["weekly", "biweekly", "monthly", "quarterly"] = "monthly"
    feedback_received: Optional[List[str]] = None
    recommendations_implemented: Optional[List[str]] = None
    mentor_notes: Optional[str] = None
    relationship_rating: Optional[Literal["excellent", "good", "fair", "poor"]] = None
    achievements: Optional[List[str]] = None

class MentorshipInvitation(BaseModel):
    """Invitation sent to mentors/coaches"""
    mentorship_id: str
    invitation_message: Optional[str] = None
    access_permissions: Optional[List[str]] = None
    expected_commitment: Optional[str] = None
    invitation_status: Literal["sent", "accepted", "declined", "pending"] = "sent"
    response_date: Optional[str] = None

class ProgressReport(BaseModel):
    """Regular progress reports for mentors"""
    mentorship_id: str
    report_date: str
    period_covered: str
    applications_submitted: Optional[int] = 0
    interviews_scheduled: Optional[int] = 0
    interviews_completed: Optional[int] = 0
    offers_received: Optional[int] = 0
    key_achievements: Optional[List[str]] = None
    challenges_faced: Optional[List[str]] = None
    next_steps: Optional[List[str]] = None
    mentor_feedback: Optional[str] = None

class MentorshipSession(BaseModel):
    """Individual mentoring sessions"""
    mentorship_id: str
    session_date: str
    session_type: Literal["planning", "review", "interview_prep", "negotiation", "networking", "general"]
    duration_minutes: Optional[int] = 60
    topics_discussed: Optional[List[str]] = None
    key_takeaways: Optional[str] = None
    action_items: Optional[List[str]] = None
    next_session_date: Optional[str] = None
