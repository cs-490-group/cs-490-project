from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================================
# INTERVIEW SCHEDULE SCHEMAS
# ============================================================================

class InterviewSchedule(BaseModel):
    """Schema for an interview schedule with calendar integration"""
    uuid: str = Field(..., description="User UUID who owns this schedule")
    job_application_uuid: str = Field(..., description="Link to job application")
    
    # Interview timing
    interview_datetime: datetime = Field(..., description="Date and time of interview")
    duration_minutes: int = Field(default=60, description="Expected duration in minutes")
    timezone: str = Field(default="UTC", description="Timezone for interview")
    
    # Location details
    location_type: str = Field(..., description="in-person, video, or phone")
    location_details: Optional[str] = Field(None, description="Address or meeting details")
    video_platform: Optional[str] = Field(None, description="zoom, google_meet, teams, etc")
    video_link: Optional[str] = Field(None, description="Video conference link")
    phone_number: Optional[str] = Field(None, description="Phone number for call")
    
    # Interviewer information
    interviewer_name: Optional[str] = Field(None, description="Name of interviewer")
    interviewer_email: Optional[str] = Field(None, description="Email of interviewer")
    interviewer_phone: Optional[str] = Field(None, description="Phone of interviewer")
    interviewer_title: Optional[str] = Field(None, description="Title/role of interviewer")
    
    # Calendar integration
    calendar_event_id: Optional[str] = Field(None, description="External calendar event ID")
    calendar_provider: Optional[str] = Field(None, description="google, outlook, etc")
    calendar_synced: bool = Field(default=False, description="Whether synced to calendar")
    
    # Preparation tracking
    preparation_tasks: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of preparation tasks with completion status"
    )
    preparation_completion_percentage: int = Field(default=0, description="0-100")
    
    # Reminders
    reminders_sent: Dict[str, bool] = Field(
        default_factory=lambda: {"24h": False, "2h": False, "1h": False},
        description="Track which reminders have been sent"
    )
    reminder_preferences: Dict[str, bool] = Field(
        default_factory=lambda: {"email": True, "sms": False, "push": True},
        description="User's reminder delivery preferences"
    )
    
    # Interview outcome
    status: str = Field(default="scheduled", description="scheduled, completed, cancelled, rescheduled")
    outcome: Optional[str] = Field(None, description="passed, rejected, pending, etc")
    outcome_notes: Optional[str] = Field(None, description="Notes about interview outcome")
    interviewer_feedback: Optional[str] = Field(None, description="Feedback from interviewer")
    
    # Follow-up tracking
    follow_up_actions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Post-interview actions (thank you note, etc)"
    )
    thank_you_note_sent: bool = Field(default=False, description="Thank you email sent")
    thank_you_note_sent_at: Optional[datetime] = Field(None, description="When thank you was sent")

    # Company Research (UC-074)
    research: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Company research report with insights for interview preparation"
    )

    # Metadata
    notes: Optional[str] = Field(None, description="Additional notes")
    attachments: List[Dict[str, str]] = Field(default_factory=list, description="Documents, links")
    
    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)

    @validator('location_type')
    def validate_location_type(cls, v):
        allowed = ['in-person', 'video', 'phone']
        if v not in allowed:
            raise ValueError(f'location_type must be one of {allowed}')
        return v

    @validator('status')
    def validate_status(cls, v):
        allowed = ['scheduled', 'completed', 'cancelled', 'rescheduled']
        if v not in allowed:
            raise ValueError(f'status must be one of {allowed}')
        return v


class CreateInterviewScheduleRequest(BaseModel):
    """Request to create a new interview schedule"""
    job_application_uuid: str
    interview_datetime: datetime
    duration_minutes: int = 60
    timezone: str = "UTC"
    location_type: str
    location_details: Optional[str] = None
    video_platform: Optional[str] = None
    video_link: Optional[str] = None
    phone_number: Optional[str] = None
    interviewer_name: Optional[str] = None
    interviewer_email: Optional[str] = None
    interviewer_phone: Optional[str] = None
    interviewer_title: Optional[str] = None
    calendar_provider: Optional[str] = None
    auto_generate_prep_tasks: bool = True
    notes: Optional[str] = None
    # Add these for manual entry
    scenario_name: Optional[str] = None
    company_name: Optional[str] = None


class UpdateInterviewScheduleRequest(BaseModel):
    """Request to update an interview schedule"""
    interview_datetime: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location_type: Optional[str] = None
    location_details: Optional[str] = None
    video_link: Optional[str] = None
    interviewer_name: Optional[str] = None
    interviewer_email: Optional[str] = None
    notes: Optional[str] = None


class CompleteInterviewRequest(BaseModel):
    """Request to mark interview as complete with outcome"""
    outcome: str  # passed, rejected, pending
    outcome_notes: Optional[str] = None
    interviewer_feedback: Optional[str] = None


class PreparationTask(BaseModel):
    """Schema for a preparation task"""
    task_id: str
    title: str
    description: str
    category: str  # research, practice, logistics, materials
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    priority: str = "medium"  # low, medium, high


class InterviewReminderData(BaseModel):
    """Data needed for sending reminders"""
    interview_uuid: str
    user_email: str
    user_phone: Optional[str] = None
    interview_datetime: datetime
    location_type: str
    location_details: Optional[str] = None
    video_link: Optional[str] = None
    interviewer_name: Optional[str] = None
    job_title: str
    company_name: str
    preparation_completion: int


# ============================================================================
# INTERVIEW ANALYTICS SCHEMAS
# ============================================================================

class InterviewPerformanceMetrics(BaseModel):
    """Aggregated performance metrics across interviews"""
    user_uuid: str
    total_interviews: int
    interviews_completed: int
    interviews_pending: int
    interviews_cancelled: int
    
    # Conversion rates
    offer_conversion_rate: float = Field(description="Percentage: interviews to offers")
    second_round_conversion_rate: float = Field(description="Percentage: first to second round")
    
    # Performance by category
    behavioral_avg_score: Optional[float] = None
    technical_avg_score: Optional[float] = None
    situational_avg_score: Optional[float] = None
    
    # Performance by company type
    startup_performance: Optional[Dict[str, Any]] = None
    enterprise_performance: Optional[Dict[str, Any]] = None
    
    # Performance by interview format
    phone_success_rate: Optional[float] = None
    video_success_rate: Optional[float] = None
    in_person_success_rate: Optional[float] = None
    
    # Trends
    performance_trend: str = Field(description="improving, stable, declining")
    strongest_areas: List[str] = Field(default_factory=list)
    weakest_areas: List[str] = Field(default_factory=list)
    
    # Benchmarking
    industry_benchmark_comparison: Optional[float] = None
    
    date_generated: datetime = Field(default_factory=datetime.utcnow)


class InterviewSuccessPrediction(BaseModel):
    """Prediction of interview success probability"""
    interview_uuid: str
    user_uuid: str
    
    # Overall score
    success_probability: float = Field(description="0-100 score")
    confidence_level: str = Field(description="low, medium, high")
    
    # Contributing factors
    preparation_score: float = Field(description="Completeness of preparation")
    role_match_score: float = Field(description="Match between user skills and role")
    practice_hours: float = Field(description="Total hours of practice")
    historical_performance_score: float = Field(description="Based on past interviews")
    mock_interview_performance: Optional[float] = Field(None, description="Mock interview scores")
    
    # Category-specific predictions
    behavioral_prediction: float
    technical_prediction: float
    situational_prediction: float
    
    # Recommendations
    prioritized_actions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Actions to improve success probability"
    )
    
    # Comparison
    comparison_with_other_interviews: Optional[Dict[str, float]] = None
    
    date_generated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# FOLLOW-UP TEMPLATE SCHEMAS
# ============================================================================

class FollowUpTemplate(BaseModel):
    """Schema for follow-up communication templates"""
    uuid: str
    user_uuid: str
    interview_uuid: str
    
    template_type: str = Field(description="thank_you, status_inquiry, feedback_request, networking")
    
    # Template content
    subject_line: str
    email_body: str
    
    # Personalization data
    interviewer_name: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    specific_topics_discussed: List[str] = Field(default_factory=list)
    
    # Timing
    suggested_send_time: Optional[datetime] = None
    actual_sent_time: Optional[datetime] = None
    
    # Tracking
    is_sent: bool = False
    response_received: bool = False
    response_received_at: Optional[datetime] = None
    response_sentiment: Optional[str] = None
    
    date_created: datetime = Field(default_factory=datetime.utcnow)


class GenerateFollowUpRequest(BaseModel):
    """Request to generate a follow-up template"""
    interview_uuid: str
    template_type: str
    custom_notes: Optional[str] = None
    specific_topics: Optional[List[str]] = None


# ============================================================================
# COMPANY RESEARCH SCHEMAS (UC-074)
# ============================================================================

class CompanyResearchReport(BaseModel):
    """Complete company research report for interview preparation"""
    company_profile: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Company overview: name, description, size, industry, location, website"
    )
    history: Optional[str] = Field(
        default=None,
        description="Company founding date and major milestones"
    )
    mission_and_values: Optional[str] = Field(
        default=None,
        description="Company mission statement and core values"
    )
    leadership_team: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="List of key leaders with names, titles, and background"
    )
    recent_news: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Recent announcements, partnerships, press releases"
    )
    funding: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Funding rounds, investors, total raised (for startups)"
    )
    competition: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Competitors, market position, market threats and opportunities"
    )
    market_position: Optional[str] = Field(
        default=None,
        description="Market overview, differentiation, competitive advantages"
    )
    talking_points: Optional[List[str]] = Field(
        default=None,
        description="6-10 personalized talking points based on role and company"
    )
    intelligent_questions: Optional[Dict[str, List[str]]] = Field(
        default=None,
        description="Questions organized by category: role_alignment, strategy, team_culture, projects"
    )
    generated_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when research was generated"
    )


class GenerateCompanyResearchRequest(BaseModel):
    """Request to generate company research for an interview"""
    interview_id: str = Field(..., description="MongoDB _id of the interview schedule")
    regenerate: bool = Field(
        default=False,
        description="Force regenerate even if research exists"
    )
    custom_prompt: Optional[str] = Field(
        default=None,
        description="Custom instructions for research generation"
    )
