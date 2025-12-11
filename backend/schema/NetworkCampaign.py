from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class NetworkCampaign(BaseModel):
    """UC-094: Networking Campaign Management"""
    campaign_name: str
    campaign_type: Literal["target_companies", "industry_expansion", "role_transition", "geographic_relocation", "general"]
    target_companies: Optional[List[str]] = None
    target_industries: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    target_locations: Optional[List[str]] = None
    start_date: str
    end_date: Optional[str] = None
    status: Literal["planning", "active", "paused", "completed"] = "planning"
    networking_goals: Optional[List[str]] = None
    outreach_goal: Optional[int] = None
    response_goal: Optional[int] = None
    meeting_goal: Optional[int] = None
    current_outreach_count: Optional[int] = 0
    current_response_count: Optional[int] = 0
    current_meeting_count: Optional[int] = 0
    campaign_strategy: Optional[str] = None
    a_b_testing_enabled: Optional[bool] = False
    template_variants: Optional[List[str]] = None
    performance_tracking: Optional[dict] = None
    effectiveness_rating: Optional[Literal["high", "medium", "low"]] = None
    roi_metrics: Optional[dict] = None
    lessons_learned: Optional[str] = None

class CampaignOutreach(BaseModel):
    """Individual outreach attempts within campaigns"""
    campaign_id: str
    contact_id: str
    outreach_date: str
    outreach_method: Literal["email", "linkedin", "phone", "introduction", "other"]
    template_used: Optional[str] = None
    personalized_content: Optional[str] = None
    variant: Optional[str] = None  # For A/B testing
    response_status: Literal["pending", "responded", "declined", "no_response"] = "pending"
    response_date: Optional[str] = None
    meeting_scheduled: Optional[bool] = False
    meeting_date: Optional[str] = None
    outcome: Optional[Literal["meeting", "conversation", "referral", "opportunity", "none"]] = None
    notes: Optional[str] = None

class CampaignAnalytics(BaseModel):
    """Campaign performance analytics"""
    campaign_id: str
    analytics_date: str
    outreach_volume: Optional[int] = 0
    response_rate: Optional[float] = 0.0
    meeting_rate: Optional[float] = 0.0
    conversion_funnel: Optional[dict] = None
    best_performing_template: Optional[str] = None
    worst_performing_template: Optional[str] = None
    insights: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    benchmark_comparison: Optional[dict] = None
