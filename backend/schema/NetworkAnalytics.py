from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class NetworkAnalytics(BaseModel):
    """UC-096-099: Analytics Dashboard and Performance Insights"""
    analytics_date: str
    period_type: Literal["daily", "weekly", "monthly", "quarterly", "yearly"]
    period_start: str
    period_end: str
    
    # UC-096: Job Search Performance Dashboard
    applications_sent: Optional[int] = 0
    interviews_scheduled: Optional[int] = 0
    interviews_completed: Optional[int] = 0
    offers_received: Optional[int] = 0
    offers_accepted: Optional[int] = 0
    application_to_interview_rate: Optional[float] = 0.0
    interview_to_offer_rate: Optional[float] = 0.0
    average_response_time_days: Optional[float] = 0.0
    time_to_first_interview: Optional[int] = 0
    time_to_first_offer: Optional[int] = 0
    
    # UC-097: Application Success Rate Analysis
    success_by_industry: Optional[dict] = None
    success_by_company_size: Optional[dict] = None
    success_by_role_type: Optional[dict] = None
    success_by_application_method: Optional[dict] = None
    resume_customization_impact: Optional[float] = 0.0
    cover_letter_impact: Optional[float] = 0.0
    timing_patterns: Optional[dict] = None
    optimization_recommendations: Optional[List[str]] = None
    
    # UC-098: Interview Performance Tracking
    interview_formats_performance: Optional[dict] = None
    mock_vs_real_improvement: Optional[float] = 0.0
    industry_performance: Optional[dict] = None
    feedback_themes: Optional[List[str]] = None
    confidence_progress: Optional[float] = 0.0
    coaching_recommendations: Optional[List[str]] = None
    benchmark_comparison: Optional[dict] = None
    
    # UC-099: Network ROI and Relationship Analytics
    networking_activities: Optional[int] = 0
    referrals_generated: Optional[int] = 0
    opportunities_from_network: Optional[int] = 0
    relationship_strength_progress: Optional[dict] = None
    networking_event_roi: Optional[dict] = None
    reciprocity_rate: Optional[float] = 0.0
    manual_outreach_attempts: Optional[int] = 0
    effective_strategies: Optional[List[str]] = None
    industry_benchmarks: Optional[dict] = None

class PerformanceGoal(BaseModel):
    """Goal setting and progress tracking"""
    goal_type: Literal["applications", "interviews", "offers", "networking", "skill_development"]
    target_value: int
    current_value: int = 0
    start_date: str
    target_date: str
    unit: Literal["count", "rate", "days"] = "count"
    status: Literal["on_track", "behind", "ahead", "completed"] = "on_track"
    milestones: Optional[List[str]] = None
    progress_notes: Optional[str] = None

class NetworkInsight(BaseModel):
    """AI-generated insights and recommendations"""
    insight_date: str
    insight_type: Literal["performance", "opportunity", "relationship", "strategy"]
    priority: Literal["high", "medium", "low"]
    title: str
    description: str
    action_items: Optional[List[str]] = None
    impact_prediction: Optional[str] = None
    implementation_difficulty: Literal["easy", "moderate", "challenging"]
    success_metrics: Optional[List[str]] = None

class TrendAnalysis(BaseModel):
    """Trend tracking over time"""
    metric_name: str
    trend_direction: Literal["improving", "declining", "stable"]
    trend_percentage: Optional[float] = 0.0
    data_points: Optional[List[dict]] = None
    analysis_period: str
    significance_level: Optional[str] = None
    contributing_factors: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
