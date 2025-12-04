from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class AdvisorInvite(BaseModel):
    email: EmailStr
    name: str
    rate: Optional[str] = None
    payment_link: Optional[str] = None

class CoachingSession(BaseModel):
    id: str
    coach_email: str
    date: datetime
    meeting_link: Optional[str] = None
    status: str = "scheduled" # scheduled, completed, cancelled
    notes: Optional[str] = ""

class AdvisorTask(BaseModel):
    id: str
    title: str
    status: str = "pending" # pending, in_progress, completed
    assigned_by: str
    due_date: Optional[datetime] = None
    impact_tag: Optional[str] = "General"

class CoachingEngagement(BaseModel):
    user_uuid: str
    coach_email: str
    coach_name: str
    status: str = "active"
    hourly_rate: Optional[str] = None
    payment_link: Optional[str] = None
    joined_at: datetime = datetime.utcnow()
    sessions: List[CoachingSession] = []
    tasks: List[AdvisorTask] = []