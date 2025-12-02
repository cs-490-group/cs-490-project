from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class PrivacySettings(BaseModel):
    """Control what data is shared with specific people"""
    can_see_goals: bool = True
    can_see_applications: bool = True
    can_see_engagement: bool = True
    can_see_full_progress: bool = False  # Hide if under certain threshold
    can_see_milestones: bool = True
    can_see_feedback: bool = False


class ShareWithRequest(BaseModel):
    """Invite someone to view your progress"""
    email: EmailStr
    name: Optional[str] = None
    relationship: str  # mentor, family, friend, accountability_partner
    privacy_settings: Optional[PrivacySettings] = None


class ProgressReportFilter(BaseModel):
    """Filter options for progress reports"""
    show_goals: bool = True
    show_applications: bool = True
    show_engagement: bool = True
    show_milestones: bool = True
    include_feedback: bool = False
    hide_sensitive: bool = False  # Hide contact info, salary, etc


class MilestoneAchievement(BaseModel):
    """Track milestones and achievements"""
    id: str
    title: str
    description: str
    achieved_date: datetime
    category: str  # goal_completed, interview_scheduled, offer_received, etc
    impact_score: int  
    celebration_message: Optional[str] = None


class SharedProgressAccess(BaseModel):
    """Who can see the user's progress"""
    accessor_uuid: Optional[str] = None  # If registered user
    accessor_email: str
    accessor_name: str
    relationship: str
    shared_date: datetime
    last_viewed: Optional[datetime] = None
    view_count: int = 0
    privacy_settings: PrivacySettings


class ProgressSharingSettings(BaseModel):
    """User's progress sharing configuration"""
    allow_sharing: bool = True
    default_privacy_settings: PrivacySettings
    shared_with: List[SharedProgressAccess] = []
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()



