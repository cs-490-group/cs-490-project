from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class EquityDetails(BaseModel):
    """Detailed equity valuation (UC-127)"""
    equity_type: Optional[str] = None                    # "RSUs", "Stock Options", "ISO", "NSO"
    number_of_shares: Optional[int] = None
    current_stock_price: Optional[float] = None
    strike_price: Optional[float] = None                 # For stock options
    vesting_schedule: Optional[str] = None               # e.g., "4 years with 1 year cliff"
    vesting_years: Optional[int] = None
    cliff_months: Optional[int] = None
    refresh_grants: Optional[bool] = None
    estimated_value_at_vest: Optional[float] = None      # Calculated total value
    year_1_value: Optional[float] = None                 # Value vesting in year 1
    annual_equity_value: Optional[float] = None          # Average annual value

class BenefitsValuation(BaseModel):
    """Monetary valuation of benefits (UC-127)"""
    health_insurance_value: Optional[float] = None       # Employer contribution
    dental_vision_value: Optional[float] = None
    retirement_401k_match: Optional[float] = None        # Annual match amount
    life_insurance_value: Optional[float] = None
    disability_insurance_value: Optional[float] = None
    hsa_contribution: Optional[float] = None
    commuter_benefits: Optional[float] = None
    education_stipend: Optional[float] = None
    wellness_stipend: Optional[float] = None
    home_office_stipend: Optional[float] = None
    pto_monetary_value: Optional[float] = None           # Based on daily rate
    total_benefits_value: Optional[float] = None         # Sum of all benefits

class CostOfLiving(BaseModel):
    """Cost of living adjustment data (UC-127)"""
    location: str
    col_index: Optional[float] = None                    # 100 = national average
    housing_cost_index: Optional[float] = None
    tax_rate: Optional[float] = None                     # Effective tax rate (federal + state)
    adjusted_salary: Optional[float] = None              # Salary adjusted for COL

class TotalCompensation(BaseModel):
    """Complete compensation calculation (UC-127)"""
    base_salary: float
    signing_bonus: float = 0
    annual_bonus_min: float = 0
    annual_bonus_max: float = 0
    annual_bonus_expected: float = 0                     # Midpoint or expected value
    year_1_equity: float = 0
    annual_equity: float = 0
    total_benefits: float = 0

    # Year 1 total comp
    year_1_total: Optional[float] = None                 # base + signing + bonus + year_1_equity + benefits

    # Ongoing annual comp (year 2+)
    annual_total: Optional[float] = None                 # base + bonus + annual_equity + benefits

    # 4-year total comp
    four_year_total: Optional[float] = None

class NonFinancialFactors(BaseModel):
    """Non-financial scoring factors (UC-127)"""
    culture_fit: Optional[int] = None                    # 1-10 scale
    growth_opportunities: Optional[int] = None
    work_life_balance: Optional[int] = None
    team_quality: Optional[int] = None
    mission_alignment: Optional[int] = None
    commute_quality: Optional[int] = None
    job_security: Optional[int] = None
    learning_opportunities: Optional[int] = None

class OfferScore(BaseModel):
    """Comprehensive offer scoring (UC-127)"""
    financial_score: Optional[float] = None              # 0-100 based on total comp
    non_financial_score: Optional[float] = None          # 0-100 based on non-financial factors
    weighted_total_score: Optional[float] = None         # Combined score with user weights
    percentile_vs_market: Optional[float] = None         # How it compares to market
    recommendation: Optional[str] = None                 # "Strong Accept", "Negotiate", "Decline"

class ComparisonWeights(BaseModel):
    """User-defined weights for comparison (UC-127)"""
    base_salary_weight: float = 0.30
    equity_weight: float = 0.25
    benefits_weight: float = 0.15
    culture_weight: float = 0.10
    growth_weight: float = 0.10
    work_life_balance_weight: float = 0.10

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

    # UC-127 Extensions
    equity_details: Optional[EquityDetails] = None
    benefits_valuation: Optional[BenefitsValuation] = None
    cost_of_living: Optional[CostOfLiving] = None
    total_compensation: Optional[TotalCompensation] = None

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

    # Offer Analysis & Scoring
    offer_analysis: Optional[Dict[str, Any]] = None      # Score, percentile, breakdown, recommendations
    readiness_assessment: Optional[Dict[str, Any]] = None  # Readiness score and component breakdown
    negotiation_focus: Optional[Dict[str, Any]] = None   # Primary/secondary focus, action items

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
    offer_status: str                                    # received, negotiating, accepted, rejected, withdrawn, expired, archived

    # Negotiation Tracking
    negotiation_history: Optional[List[NegotiationHistory]] = None
    negotiation_outcome: Optional[NegotiationOutcome] = None

    # Salary Negotiation Preparation
    negotiation_prep: Optional[NegotiationPrep] = None   # Generated prep materials

    # UC-127: Offer Evaluation & Comparison
    non_financial_factors: Optional[NonFinancialFactors] = None
    offer_score: Optional[OfferScore] = None
    comparison_weights: Optional[ComparisonWeights] = None

    # UC-127: Archival (for declined offers)
    archived: Optional[bool] = False
    decline_reason: Optional[str] = None
    archived_date: Optional[str] = None

    # User Notes
    internal_notes: Optional[str] = None

    # Timestamps
    date_created: Optional[str] = None
    date_updated: Optional[str] = None
