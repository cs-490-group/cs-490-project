from pydantic import BaseModel
from typing import Optional

from schema.Employment import Employment
from schema.Education import Education
from schema.Certification import Certification
from schema.Project import Project
from schema.Skill import Skill

class ContactInfo(BaseModel): # related to Resume
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None # renamed from "location"
    linkedin: Optional[str] = None # link/url

class Colors(BaseModel):
    primary: Optional[str] = None
    accent: Optional[str] = None

class Fonts(BaseModel):
    heading: Optional[str] = None
    body: Optional[str] = None

class Resume(BaseModel):
    name: Optional[str] = None
    template: Optional[str] = None
    templateId: Optional[str] = None  # Template ID for rendering (e.g., "professional-clean", "modern-bold")
    contact: Optional[ContactInfo] = None # can use above custom schema if needed
    summary: Optional[str] = None
    experience: Optional[list[Employment]] = None
    education: Optional[list[Education]] = None
    certifications: Optional[list[Certification]] = None
    projects: Optional[list[Project]] = None
    skills: Optional[list[Skill]] = None
    colors: Optional[Colors] = None
    fonts: Optional[Fonts] = None
    sections: Optional[list[str]] = None
    default_resume: Optional[bool] = False
    approval_status: Optional[str] = "pending"

# RESUME VERSION SCHEMA
class ResumeVersion(BaseModel):
    resume_id: Optional[str] = None # Reference to parent resume
    name: Optional[str] = None # Version name
    description: Optional[str] = None # Version description
    resume_data: Optional[dict] = None # Full resume snapshot
    job_linked: Optional[str] = None # Linked job ID (optional)

# RESUME FEEDBACK SCHEMA
class ResumeFeedback(BaseModel):
    resume_id: Optional[str] = None # Reference to parent resume
    reviewer: Optional[str] = None # Reviewer name
    email: Optional[str] = None # Reviewer email
    comment: Optional[str] = None # Feedback comment
    resolved: Optional[bool] = False # Whether feedback has been addressed

# RESUME SHARE SCHEMA
class ResumeShare(BaseModel):
    resume_id: Optional[str] = None # Reference to parent resume
    can_comment: Optional[bool] = True # Allow reviewers to comment
    can_download: Optional[bool] = True # Allow reviewers to download
    expiration_days: Optional[int] = 30 # Number of days before link expires

# RESUME APPROVAL SCHEMA (Anthony UC-110)
class ApprovalRequest(BaseModel):
    status: str