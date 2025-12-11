# Goal.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class Milestone(BaseModel):
    _id: Optional[str] = None
    name: str
    completed: bool = False
    completed_at: Optional[datetime] = None
    order_index: Optional[int] = None

class Goal(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    type: str = Field(..., pattern="^(short-term|long-term)$")
    target_date: Optional[date] = None
    progress: int = Field(default=0, ge=0, le=100)
    status: str = Field(default="in-progress", pattern="^(completed|in-progress|at-risk|overdue|not-started)$")
    metrics: Optional[str] = None
    milestones: Optional[List[Milestone]] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Complete AWS Certification",
                "category": "Skills Development",
                "type": "short-term",
                "target_date": "2025-03-15",
                "progress": 65,
                "status": "in-progress",
                "metrics": "Pass exam with 80%+ score",
                "milestones": [
                    {"name": "Complete coursework", "completed": True},
                    {"name": "Practice exams", "completed": False}
                ]
            }
        }

class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = Field(None, pattern="^(short-term|long-term)$")
    target_date: Optional[date] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = Field(None, pattern="^(completed|in-progress|at-risk|overdue|not-started)$")
    metrics: Optional[str] = None
    milestones: Optional[List[Milestone]] = None

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    completed: Optional[bool] = None
    order_index: Optional[int] = None