from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel


Difficulty = Literal["Easy", "Medium", "Hard"]
Platform = Literal["hackerrank", "codecademy"]


class ProblemSubmissionBase(BaseModel):
    platform: Platform
    problem_title: str
    description: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    language: Optional[str] = None
    submission_date: Optional[datetime] = None


class ProblemSubmissionCreate(ProblemSubmissionBase):
    pass


class ProblemSubmissionUpdate(BaseModel):
    problem_title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    language: Optional[str] = None
    submission_date: Optional[datetime] = None


class ProblemSubmission(ProblemSubmissionBase):
    _id: str
    user_id: str
    date_created: datetime
    date_updated: datetime

