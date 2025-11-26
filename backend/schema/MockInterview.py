from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================================
# INTERVIEW SESSION RESPONSE SCHEMAS
# ============================================================================

class InterviewSessionResponse(BaseModel):
    """Schema for a user's response to an interview question"""
    question_id: str = Field(..., description="UUID of the question")
    question_text: str = Field(..., description="The actual question text")
    question_category: str = Field(..., description="Category: behavioral, technical, situational, company")
    question_difficulty: str = Field(..., description="Difficulty: entry, mid, senior")
    response_text: str = Field(..., description="User's text response")
    word_count: int = Field(..., description="Number of words in response")
    response_duration_seconds: int = Field(..., description="How long user spent on this question")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When response was submitted")

    # Will be populated by AI coaching (UC-076) - initially None
    coaching_feedback: Optional[Dict[str, Any]] = Field(None, description="AI coaching feedback from UC-076")
    coaching_score: Optional[float] = Field(None, description="Overall score from AI coaching (0-100)")
    coaching_timestamp: Optional[datetime] = Field(None, description="When coaching feedback was generated")


# ============================================================================
# MOCK INTERVIEW SESSION SCHEMAS
# ============================================================================

class MockInterviewSession(BaseModel):
    """Schema for a complete mock interview session"""
    uuid: str = Field(..., description="Unique identifier for this mock interview session")
    user_uuid: str = Field(..., description="UUID of the user conducting the interview")
    role_uuid: str = Field(..., description="UUID of the target role for this interview")
    industry_uuid: str = Field(..., description="UUID of the target industry")

    # Interview metadata
    scenario_name: str = Field(..., description="Name/title of the interview scenario")
    scenario_description: Optional[str] = Field(None, description="Description of the interview scenario")
    difficulty_level: str = Field(..., description="Difficulty: entry, mid, senior")
    estimated_duration_minutes: int = Field(..., description="Estimated total interview duration")

    # Question progression
    question_sequence: List[str] = Field(default_factory=list, description="Ordered list of question IDs in this interview")
    question_categories: Dict[str, int] = Field(
        default_factory=lambda: {"behavioral": 0, "technical": 0, "situational": 0, "company": 0},
        description="Count of questions by category"
    )

    # User responses (one per question in sequence)
    responses: List[InterviewSessionResponse] = Field(
        default_factory=list,
        description="Array of user responses (in question order)"
    )

    # Interview status
    status: str = Field(default="in_progress", description="Status: in_progress, completed, abandoned")
    current_question_index: int = Field(default=0, description="Index of current question being answered")
    started_at: datetime = Field(default_factory=datetime.utcnow, description="When interview started")
    completed_at: Optional[datetime] = Field(None, description="When interview completed")

    # Performance summary (populated after completion)
    performance_summary: Optional[Dict[str, Any]] = Field(None, description="Summary metrics after completion (UC-080, UC-085)")

    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# REQUEST/RESPONSE SCHEMAS FOR ENDPOINTS
# ============================================================================

class CreateMockInterviewSessionRequest(BaseModel):
    """Request to create a new mock interview session"""
    role_uuid: str = Field(..., description="UUID of target role")
    industry_uuid: str = Field(..., description="UUID of target industry")
    difficulty_level: str = Field(..., description="entry, mid, or senior")
    include_technical: bool = Field(default=True, description="Include technical round")
    include_behavioral: bool = Field(default=True, description="Include behavioral questions")
    include_situational: bool = Field(default=True, description="Include situational questions")


class CreateMockInterviewSessionResponse(BaseModel):
    """Response when creating a mock interview session"""
    session_id: str = Field(..., description="UUID of created session")
    role_uuid: str
    industry_uuid: str
    difficulty_level: str
    question_count: int = Field(..., description="Number of questions in this session")
    estimated_duration_minutes: int
    first_question: Optional[Dict[str, Any]] = Field(None, description="First question to display")
    detail: str


class SubmitInterviewResponseRequest(BaseModel):
    """Request to submit a response to an interview question"""
    response_text: str = Field(..., description="User's text response to the question")
    response_duration_seconds: int = Field(..., description="How many seconds user spent on this question")


class SubmitInterviewResponseResponse(BaseModel):
    """Response after submitting an interview response"""
    detail: str
    session_id: str = Field(..., description="Session UUID")
    response_saved: bool
    next_question: Optional[Dict[str, Any]] = Field(None, description="Next question or None if done")
    questions_remaining: int = Field(..., description="How many more questions in this session")


class GetMockInterviewSessionResponse(BaseModel):
    """Response when fetching a mock interview session"""
    session: MockInterviewSession
    current_progress: Dict[str, Any] = Field(
        description="Progress info: completed_questions, total_questions, percentage"
    )


class CompleteMockInterviewSessionResponse(BaseModel):
    """Response when completing a mock interview"""
    session_id: str
    total_questions: int
    responses_saved: int
    overall_performance_score: Optional[float] = Field(None, description="Will be populated by UC-080/085")
    summary: Optional[Dict[str, Any]] = Field(None, description="Performance summary from UC-080/085")
    detail: str


# ============================================================================
# INTERVIEW SCENARIO GENERATION SCHEMAS
# ============================================================================

class InterviewScenarioDetails(BaseModel):
    """Internal schema for interview scenario details"""
    role_name: str
    industry_name: str
    difficulty_level: str
    scenario_name: str
    scenario_description: str
    behavioral_questions: List[str] = Field(default_factory=list, description="Question IDs for behavioral round")
    technical_questions: List[str] = Field(default_factory=list, description="Question IDs for technical round")
    situational_questions: List[str] = Field(default_factory=list, description="Question IDs for situational round")
    company_questions: List[str] = Field(default_factory=list, description="Question IDs for company-specific round")
    total_questions: int
    estimated_duration_minutes: int
