from enum import Enum
from typing import Dict, List, Optional, Any

from pydantic import BaseModel


class RelationshipStrength(str, Enum):
    NEW = "new"
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    DORMANT = "dormant"


class EngagementQuality(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class NetworkingEventType(str, Enum):
    COFFEE_CHAT = "coffee_chat"
    NETWORKING_EVENT = "networking_event"
    CONFERENCE = "conference"
    MEETUP = "meetup"
    WORKSHOP = "workshop"
    WEBINAR = "webinar"
    SOCIAL = "social"
    VIRTUAL = "virtual"
    INFORMATIONAL_INTERVIEW = "informational_interview"
    OTHER = "other"


class ROIMetricType(str, Enum):
    JOB_OPPORTUNITY = "job_opportunity"
    REFERRAL = "referral"
    INTERVIEW = "interview"
    OFFER = "offer"
    PROMOTION = "promotion"
    OTHER = "other"


class NetworkingAnalytics(BaseModel):
    analytics_period: str

    # Core activity metrics
    total_networking_activities: int
    total_contacts_made: int
    quality_conversations_ratio: float
    average_event_satisfaction: float

    # ROI metrics
    total_investment: float
    total_roi_value: float
    roi_percentage: float

    # Relationship analytics
    new_relationships: int
    strengthened_relationships: int
    relationship_strength_distribution: Dict[RelationshipStrength, int]
    average_trust_score: float
    high_value_relationships: int

    # Engagement analytics
    average_response_rate: float
    follow_up_completion_rate: float
    interaction_frequency_trend: str

    # Opportunity analytics
    referrals_generated: int
    interviews_from_networking: int
    offers_from_networking: int
    accepted_offers_from_networking: int
    opportunities_by_event_type: Dict[NetworkingEventType, int]

    # Event-level ROI analytics
    event_roi_by_type: Dict[NetworkingEventType, float]
    most_profitable_event_types: List[NetworkingEventType]
    cost_per_opportunity: float
    time_to_opportunity: int
    best_conversion_channels: List[str]

    # Benchmarks and recommendations
    industry_benchmarks: Dict[str, Any]
    improvement_recommendations: List[str]
