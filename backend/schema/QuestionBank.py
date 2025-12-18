from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# ============================================================================
# INDUSTRY SCHEMAS
# ============================================================================

class QuestionIndustry(BaseModel):
    """Schema for a question bank industry (e.g., Engineering, Finance)"""
    uuid: str = Field(..., description="Unique identifier for the industry")
    name: str = Field(..., description="Industry name (e.g., Engineering, Finance)")
    icon: str = Field(..., description="Icon name or URL for the industry")
    description: Optional[str] = Field(None, description="Brief description of the industry")
    roles: List[str] = Field(default_factory=list, description="List of role UUIDs in this industry")
    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# ROLE SCHEMAS
# ============================================================================

class QuestionRole(BaseModel):
    """Schema for a role within an industry (e.g., Software Engineer)"""
    uuid: str = Field(..., description="Unique identifier for the role")
    industry_uuid: str = Field(..., description="UUID of the parent industry")
    name: str = Field(..., description="Role name (e.g., Software Engineer)")
    description: Optional[str] = Field(None, description="Role description")
    question_ids: List[str] = Field(default_factory=list, description="List of question UUIDs for this role")
    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# QUESTION SCHEMAS
# ============================================================================

class STARFramework(BaseModel):
    """STAR framework components for behavioral questions"""
    s: str = Field(..., description="Situation - Set the stage")
    t: str = Field(..., description="Task - Describe the challenge")
    a: str = Field(..., description="Action - Explain your approach")
    r: str = Field(..., description="Result - Share the outcome")


class Question(BaseModel):
    """Schema for an interview question"""
    uuid: str = Field(..., description="Unique identifier for the question")
    role_uuid: str = Field(..., description="UUID of the role this question belongs to")
    category: str = Field(..., description="Question category: behavioral, technical, situational, or company")
    difficulty: str = Field(..., description="Difficulty level: entry, mid, or senior")
    prompt: str = Field(..., description="The actual question text")
    expected_skills: List[str] = Field(default_factory=list, description="Skills tested by this question")
    interviewer_guidance: Optional[str] = Field(None, description="What the interviewer looks for in answers")
    star_framework: Optional[STARFramework] = Field(None, description="STAR framework guidance for behavioral questions")
    sample_answers: List[str] = Field(default_factory=list, description="Example good answers")
    company_context: Optional[List[str]] = Field(None, description="Company-specific challenges or opportunities")
    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# USER PRACTICE RESPONSE SCHEMAS
# ============================================================================

class UserPracticedQuestion(BaseModel):
    """Schema for user's saved response to a question"""
    uuid: str = Field(..., description="Unique identifier for this practice record")
    user_uuid: str = Field(..., description="UUID of the user")
    question_uuid: str = Field(..., description="UUID of the question")
    response_html: str = Field(..., description="User's rich-text response (HTML)")
    is_marked_practiced: bool = Field(default=False, description="Whether user marked this as practiced")
    last_practiced: datetime = Field(default_factory=datetime.utcnow, description="Last time this was practiced")
    practice_count: int = Field(default=1, description="How many times this question has been practiced")
    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)


class SaveQuestionResponseRequest(BaseModel):
    """Request schema for saving a question response"""
    response_html: str = Field(..., description="Rich-text HTML response")
    is_marked_practiced: Optional[bool] = Field(False, description="Mark as practiced")


class SaveQuestionResponseResponse(BaseModel):
    """Response after saving a question answer"""
    detail: str
    response_id: str
