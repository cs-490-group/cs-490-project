from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TestCase(BaseModel):
    """Test case for coding challenges"""
    input: Dict[str, Any]
    expected_output: Any
    description: Optional[str] = None
    is_hidden: bool = False  # Hidden test cases not shown to user

class SolutionFramework(BaseModel):
    """Solution framework for challenges"""
    title: str
    overview: str
    steps: List[str]
    pseudocode: Optional[str] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    common_mistakes: List[str] = []
    alternative_approaches: List[str] = []
    real_world_correlation: Optional[str] = None
    whiteboard_checklist: List[str] = []

class CodingChallenge(BaseModel):
    """Coding challenge question"""
    challenge_type: str = "coding"
    title: str
    description: str
    difficulty: str  # easy, medium, hard
    required_languages: List[str] = []  # e.g., ["Python", "Java", "JavaScript"]
    required_skills: List[str] = []
    time_limit_minutes: Optional[int] = None
    constraints: List[str] = []
    test_cases: List[TestCase] = []
    solution_framework: Optional[SolutionFramework] = None
    example_input: Optional[str] = None
    example_output: Optional[str] = None
    follow_up_questions: List[str] = []

class SystemDesignQuestion(BaseModel):
    """System design interview question"""
    challenge_type: str = "system_design"
    title: str
    prompt: str
    difficulty: str  # junior, senior, architect
    required_skills: List[str] = []
    time_limit_minutes: Optional[int] = None
    architecture_focus: List[str] = []  # e.g., ["Scalability", "Reliability", "Latency"]
    evaluation_metrics: Dict[str, str] = {}  # e.g., {"Throughput": "requests/second"}
    diagram_requirements: List[str] = []
    solution_framework: Optional[SolutionFramework] = None
    follow_up_questions: List[str] = []

class CaseStudy(BaseModel):
    """Business case study for consulting roles"""
    challenge_type: str = "case_study"
    title: str
    scenario: str
    industry: str
    company_size: Optional[str] = None
    problem_statement: str
    constraints: List[str] = []
    data_provided: Dict[str, Any] = {}
    questions: List[str] = []
    solution_framework: Optional[SolutionFramework] = None
    evaluation_criteria: List[str] = []

class TechnicalChallenge(BaseModel):
    """Base technical challenge document"""
    uuid: str  # User ID
    challenge_id: Optional[str] = None
    challenge_type: str  # coding, system_design, case_study, behavioral
    title: str
    description: str
    difficulty: str
    industry: Optional[str] = None
    job_role: Optional[str] = None  # e.g., "Software Engineer", "Data Scientist", "Product Manager"
    required_skills: List[str] = []
    required_tech_stack: List[str] = []
    time_limit_minutes: Optional[int] = None
    tags: List[str] = []

    # For coding challenges
    coding_challenge: Optional[CodingChallenge] = None

    # For system design
    system_design: Optional[SystemDesignQuestion] = None

    # For case studies
    case_study: Optional[CaseStudy] = None

    # Metadata
    role_based: bool = False
    ai_generated: bool = False
    source: str = "manual"  # manual, ai_generated, template
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChallengeAttempt(BaseModel):
    """User's attempt at a challenge"""
    uuid: str  # User ID
    challenge_id: str  # Reference to TechnicalChallenge._id
    challenge_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    # Performance metrics
    language: Optional[str] = None  # Programming language used
    attempts: int = 0
    score: Optional[float] = None  # 0-100
    passed_tests: int = 0
    total_tests: int = 0
    failed_tests: int = 0
    improvement_trend: List[float] = []  # Track score improvements across attempts

    # Solution details
    user_code: Optional[str] = None  # Code submitted
    test_results: List[Dict[str, Any]] = []
    feedback: Optional[str] = None

    # Status
    status: str = "in_progress"  # in_progress, completed, abandoned

    # Metadata
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
