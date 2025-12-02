from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SalaryDetails(BaseModel):
    """Detailed salary and compensation breakdown"""
    base_salary: Optional[int] = None                    # Annual salary in dollars
    signing_bonus: Optional[int] = None
    annual_bonus: Optional[str] = None                   # e.g., "10-20%" or "$10k-$20k"
    stock_options: Optional[str] = None                  # e.g., "0.5% vesting over 4 years"
    rsus: Optional[str] = None                           # Restricted Stock Units
    pto_days: Optional[int] = None
    remote_flexibility: Optional[str] = None             # full-remote, hybrid, on-site
    relocation_package: Optional[str] = None
    other_benefits: Optional[List[str]] = None           # healthcare, 401k match, etc.

class MarketSalaryData(BaseModel):
    """Market salary research data"""
    role: str
    location: str
    years_of_experience: int
    median_salary: int                                   # National median for role/location
    percentile_25: int
    percentile_50: int
    percentile_75: int
    percentile_90: int
    industry_average: Optional[int] = None
    company_size_factor: Optional[str] = None            # startup, mid-size, enterprise
    cost_of_living_adjustment: Optional[float] = None
    comparable_companies: Optional[List[str]] = None    # Companies paying similar roles
    salary_trend: Optional[str] = None                   # increasing, stable, decreasing
    sources: Optional[List[str]] = None                  # Glassdoor, Levels.fyi, Payscale, etc.
    last_updated: Optional[str] = None

class NegotiationTalkingPoint(BaseModel):
    """Individual negotiation talking point"""
    category: str                                        # market_data, experience, achievements, market_trend
    point: str
    supporting_data: Optional[str] = None
    confidence_level: Optional[int] = None              # 1-10 scale

class NegotiationScript(BaseModel):
    """Pre-written negotiation scenarios"""
    scenario: str                                        # e.g., "Initial salary discussion", "Handling rejection", "Counter-offer"
    opening_statement: str
    talking_points: List[str]
    potential_objections: Optional[List[str]] = None
    your_responses: Optional[List[str]] = None
    closing_statement: str
    tone_tips: Optional[str] = None                      # Professional tone guidance

class CounterOfferTemplate(BaseModel):
    """Template for evaluating and creating counter-offers"""
    metric: str                                          # e.g., "base salary", "signing bonus"
    offered_value: str
    market_value: str
    suggested_counter: str
    reasoning: str
    priority_level: str                                  # critical, high, medium, low

class NegotiationPrep(BaseModel):
    """Complete salary negotiation preparation"""
    job_id: str                                          # Link to job/offer
    role: str
    company: str
    location: str

    # Market Research
    market_salary_data: MarketSalaryData

    # Preparation Content
    talking_points: List[NegotiationTalkingPoint]
    negotiation_scripts: List[NegotiationScript]
    counter_offer_templates: List[CounterOfferTemplate]

    # Timing and Strategy
    timing_strategy: Optional[str] = None                # When to negotiate in interview process
    power_dynamics_analysis: Optional[str] = None        # What gives you leverage
    best_practices: Optional[List[str]] = None

    # Confidence Building
    confidence_exercises: Optional[List[str]] = None     # Role-play scenarios, practice talking points
    common_mistakes: Optional[List[str]] = None          # What to avoid
    red_flags: Optional[List[str]] = None               # Warning signs in offers

    # Generated Summary
    executive_summary: Optional[str] = None
    generated_at: Optional[str] = None
    generated_by_model: Optional[str] = None            # e.g., "cohere", "openai"

class NegotiationHistory(BaseModel):
    """Track negotiation attempts and outcomes"""
    date: str
    iteration: int                                       # 1st counter-offer, 2nd counter-offer, etc.
    your_offer: Dict[str, Any]                          # What you proposed
    their_response: Optional[Dict[str, Any]] = None
    accepted: bool = False
    notes: Optional[str] = None

class NegotiationOutcome(BaseModel):
    """Track the final outcome of negotiations"""
    status: str                                          # accepted, rejected, pending
    final_salary: Optional[int] = None
    final_benefits: Optional[SalaryDetails] = None
    negotiation_improvement: Optional[Dict[str, Any]] = None  # How much you improved from offer
    start_date: Optional[str] = None
    offer_acceptance_date: Optional[str] = None

class Offer(BaseModel):
    """Job offer with salary negotiation tracking"""
    # Basic offer details
    job_title: str                                       # e.g., "Senior Software Engineer"
    company: str
    location: str
    job_id: str                                          # Link to original Job (bidirectional reference)

    # Offer Details
    offered_salary_details: SalaryDetails
    offer_received_date: str                            # ISO date when offer was received
    decision_deadline: Optional[str] = None             # When you need to respond

    # Offer Status
    offer_status: str                                    # received, negotiating, accepted, rejected, withdrawn, expired

    # Negotiation Tracking
    negotiation_history: Optional[List[NegotiationHistory]] = None
    negotiation_outcome: Optional[NegotiationOutcome] = None

    # Salary Negotiation Preparation
    negotiation_prep: Optional[NegotiationPrep] = None   # Generated prep materials

    # User Notes
    internal_notes: Optional[str] = None

    # Timestamps
    date_created: Optional[str] = None
    date_updated: Optional[str] = None
