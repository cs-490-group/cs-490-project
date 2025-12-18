from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class MemberKPIs(BaseModel):
    completedGoals: int = 0
    pendingGoals: int = 0
    engagement: int = 0
    applications: int = 0
    lastLogin: Optional[str] = None

class Goal(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    dueDate: Optional[str] = None
    completed: bool
    createdAt: Optional[str] = None
    completedAt: Optional[str] = None
    
class UpdateGoalsRequest(BaseModel):
    goals: List[dict]

class Material(BaseModel):
    name: str
    link: str

class Application(BaseModel):
    id: str
    position: str
    company: str
    status: str  # applied, interview, rejected, offer
    materials: Optional[List[Material]] = []

class TeamMember(BaseModel):
    uuid: str
    email: str
    name: str
    role: str  # admin, mentor, candidate
    status: str = "active"  # active, invited, inactive
    # Progress and Goals are specific to THIS team context
    progress: dict = {"overall": 0} 
    kpis: Optional[MemberKPIs] = None
    goals: Optional[List[Goal]] = []
    applications: Optional[List[Application]] = []
    joined_at: Optional[datetime] = None

class BillingInfo(BaseModel):
    plan: str = "basic"
    status: str = "active"
    price: int = 99
    renewalDate: Optional[str] = None
    cardBrand: Optional[str] = None
    last4: Optional[str] = None
    expMonth: Optional[str] = None
    expYear: Optional[str] = None
    invoices: Optional[List[dict]] = []

class TeamSettings(BaseModel):
    maxMembers: int = 50
    visibility: str = "private"
    allowInvites: bool = True

class CreateTeamRequest(BaseModel):
    # Removed uuid here, usually inferred from the logged-in user (token)
    email: Optional[str] = None
    name: str
    description: Optional[str] = None

# === NEW: For switching context ===
class SwitchTeamRequest(BaseModel):
    team_id: str
# ==================================

class UpdateTeamRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    billingPlan: Optional[str] = None
    maxMembers: Optional[int] = None

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str  

class AcceptInvitationRequest(BaseModel):
    email: EmailStr
    uuid: str
    team_id: str # Explicitly state which team is being accepted

class UpdateMemberRequest(BaseModel):
    role: str

class UpdateBillingRequest(BaseModel):
    plan: str

class SendFeedbackRequest(BaseModel):
    feedback: str
    mentorId: str


class TeamSummary(BaseModel):
    id: str
    name: str
    role: str
    description: Optional[str] = None

class UserTeamsResponse(BaseModel):
    active_team_id: Optional[str]
    teams: List[TeamSummary]


class TeamResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    memberCount: int
    admins: int
    mentors: int
    candidates: int
    currentUserRole: str
    progress: int
    goalsCompleted: int
    applicationsSent: int
    avgEngagement: int
    members: List[TeamMember]
    billing: BillingInfo
    settings: TeamSettings
    createdAt: Optional[datetime] = None