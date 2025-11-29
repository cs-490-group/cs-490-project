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
    completed: bool


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
    progress: dict = {"overall": 0}
    kpis: Optional[MemberKPIs] = None
    goals: Optional[List[Goal]] = []
    applications: Optional[List[Application]] = []
    joined_at: Optional[datetime] = None


class BillingInfo(BaseModel):
    plan: str = "basic"  # basic, standard, premium
    status: str = "active"  # active, cancelled, expired
    price: int = 99
    renewalDate: Optional[str] = None
    cardBrand: Optional[str] = None
    last4: Optional[str] = None
    expMonth: Optional[str] = None
    expYear: Optional[str] = None
    invoices: Optional[List[dict]] = []


class TeamSettings(BaseModel):
    maxMembers: int = 50
    visibility: str = "private"  # private, public
    allowInvites: bool = True


class CreateTeamRequest(BaseModel):
    uuid: str
    email: Optional[str] = None
    name: str
    description: Optional[str] = None


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

class UpdateMemberRequest(BaseModel):
    role: str


class UpdateBillingRequest(BaseModel):
    plan: str  # basic, standard, premium


class SendFeedbackRequest(BaseModel):
    feedback: str
    mentorId: str


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