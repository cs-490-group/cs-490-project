from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from enum import Enum

class IndustryTrend(str, Enum):
    GROWING = "growing"
    STABLE = "stable"
    DECLINING = "declining"
    VOLATILE = "volatile"

class CompanyStage(str, Enum):
    STARTUP = "startup"
    EARLY_STAGE = "early_stage"
    GROWTH_STAGE = "growth_stage"
    MATURE = "mature"
    ENTERPRISE = "enterprise"

class EconomicCondition(str, Enum):
    BOOM = "boom"
    EXPANSION = "expansion"
    STABLE = "stable"
    CONTRACTION = "contraction"
    RECESSION = "recession"

class SuccessCriteriaType(str, Enum):
    SALARY = "salary"
    WORK_LIFE_BALANCE = "work_life_balance"
    LEARNING_OPPORTUNITIES = "learning_opportunities"
    IMPACT = "impact"
    CAREER_GROWTH = "career_growth"
    JOB_SECURITY = "job_security"

class CareerMilestone(BaseModel):
    """Career milestone in simulation timeline"""
    year: int
    title: str
    company: str
    salary_base: float
    salary_total: float
    equity_value: float = 0
    bonus_expected: float = 0
    responsibilities_level: int  # 1-10 scale
    learning_score: int  # 1-10 scale
    work_life_balance: int  # 1-10 scale
    impact_score: int  # 1-10 scale
    job_security_score: int  # 1-10 scale
    market_demand: int  # 1-10 scale
    career_satisfaction: int  # 1-10 scale

class ProbabilityOutcome(BaseModel):
    """Probability distribution for career outcomes"""
    scenario: str  # best_case, average_case, worst_case
    probability: float  # 0.0 to 1.0
    final_salary_5yr: float
    final_salary_10yr: float
    total_earnings_5yr: float
    total_earnings_10yr: float
    final_title: str
    final_company_stage: CompanyStage
    career_satisfaction: int
    work_life_balance: int
    learning_achievements: List[str]

class DecisionPoint(BaseModel):
    """Key decision points where career paths diverge"""
    year: int
    decision_type: str  # promotion, job_change, company_switch, industry_pivot
    options: List[str]
    impact_analysis: Dict[str, Any]
    recommendation: str
    confidence_level: float  # 0.0 to 1.0

class CareerPath(BaseModel):
    """Complete career path simulation"""
    path_id: str
    path_name: str
    base_offer_id: str  # Reference to the starting offer
    simulation_years: int  # 5 or 10
    
    # Input Parameters
    industry_trend: IndustryTrend
    company_stage: CompanyStage
    economic_condition: EconomicCondition
    personal_growth_rate: float  # 0.0 to 1.0
    risk_tolerance: float  # 0.0 to 1.0
    job_change_frequency: float  # Average years between job changes
    
    # Career Trajectory
    milestones: List[CareerMilestone]
    
    # Outcomes
    total_earnings_5yr: float
    total_earnings_10yr: float
    peak_salary: float
    career_growth_rate: float  # Annual percentage
    title_progression: List[str]
    companies_worked: List[str]
    
    # Probability Analysis
    probability_outcomes: List[ProbabilityOutcome]
    
    # Decision Points
    decision_points: List[DecisionPoint]
    
    # Success Metrics
    overall_score: float  # 0-100
    salary_score: float  # 0-100
    work_life_balance_score: float  # 0-100
    learning_score: float  # 0-100
    impact_score: float  # 0-100

class SuccessCriteria(BaseModel):
    """User-defined success criteria for career evaluation"""
    criteria_type: SuccessCriteriaType
    weight: float  # 0.0 to 1.0
    target_value: Union[float, int, str]
    importance: str  # critical, high, medium, low
    description: str


class UserMilestone(BaseModel):
    year: int
    title: Optional[str] = None
    raise_percent: Optional[float] = None
    new_base_salary: Optional[float] = None
    bonus_expected: Optional[float] = None
    equity_value: Optional[float] = None

class CareerSimulationRequest(BaseModel):
    """Request to run career simulation"""
    offer_id: str
    simulation_years: int = 5  # 5 or 10
    success_criteria: List[SuccessCriteria]
    
    # Personal Factors
    personal_growth_rate: float = 0.5  # 0.0 to 1.0
    risk_tolerance: float = 0.5  # 0.0 to 1.0
    job_change_frequency: float = 2.5  # Average years between changes
    geographic_flexibility: bool = True
    industry_switch_willingness: bool = False
    
    # Economic Assumptions
    inflation_rate: float = 0.025  # 2.5% annual
    market_growth_rate: float = 0.05  # 5% annual
    industry_trend_override: Optional[IndustryTrend] = None

    starting_salary: Optional[float] = None
    annual_raise_percent: float = 3.0
    raise_scenarios: Optional[Dict[str, float]] = None
    milestones: Optional[List[UserMilestone]] = None
    annual_bonus: Optional[float] = None
    annual_equity: Optional[float] = None
    notes: Optional[str] = None

class CareerSimulationResponse(BaseModel):
    """Response containing career simulation results"""
    simulation_id: str
    request: CareerSimulationRequest
    
    # Multiple Career Paths
    career_paths: List[CareerPath]
    
    # Comparative Analysis
    optimal_path: CareerPath
    path_rankings: List[Dict[str, Any]]
    
    # Key Insights
    decision_insights: List[str]
    risk_assessments: List[str]
    opportunity_analysis: List[str]
    
    # Recommendations
    next_step_recommendation: str
    long_term_strategy: str
    
    # Metadata
    generated_at: str
    confidence_level: float  # Overall confidence in predictions
    data_sources: List[str]

class SimulationParameters(BaseModel):
    """Internal parameters for simulation engine"""
    # Salary Growth Factors
    base_salary_growth_annual: float = 0.03  # 3% base
    promotion_salary_boost: float = 0.15  # 15% on promotion
    job_change_salary_boost: float = 0.12  # 12% on job change
    
    # Title Progression Timeline (years)
    junior_to_mid: float = 2.0
    mid_to_senior: float = 3.0
    senior_to_lead: float = 4.0
    lead_to_principal: float = 5.0
    principal_to_staff: float = 6.0
    
    # Company Stage Multipliers
    startup_growth_multiplier: float = 1.4
    early_stage_growth_multiplier: float = 1.2
    growth_stage_growth_multiplier: float = 1.1
    mature_growth_multiplier: float = 0.8
    enterprise_growth_multiplier: float = 0.6
    
    # Industry Trend Multipliers
    growing_industry_multiplier: float = 1.3
    stable_industry_multiplier: float = 1.0
    declining_industry_multiplier: float = 0.7
    volatile_industry_multiplier: float = 1.1
    
    # Economic Condition Multipliers
    boom_economy_multiplier: float = 1.2
    expansion_economy_multiplier: float = 1.1
    stable_economy_multiplier: float = 1.0
    contraction_economy_multiplier: float = 0.8
    recession_economy_multiplier: float = 0.6

class CareerSimulation(BaseModel):
    """Complete career simulation document"""
    # Metadata
    user_uuid: str
    simulation_id: str
    created_at: str
    updated_at: str
    
    # Request and Response
    request: CareerSimulationRequest
    response: CareerSimulationResponse
    
    # Simulation Parameters Used
    parameters: SimulationParameters
    
    # Status
    status: str  # pending, running, completed, failed
    error_message: Optional[str] = None
    
    # Analytics
    computation_time_seconds: Optional[float] = None
    scenarios_generated: int = 0
    confidence_score: Optional[float] = None
