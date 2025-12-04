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


class ResumeVersion(BaseModel):
    resume_id: Optional[str] = None 
    name: Optional[str] = None 
    description: Optional[str] = None
    resume_data: Optional[dict] = None 
    job_linked: Optional[str] = None 


class ResumeFeedback(BaseModel):
    resume_id: Optional[str] = None 
    reviewer: Optional[str] = None
    email: Optional[str] = None 
    comment: Optional[str] = None 
    resolved: Optional[bool] = False 


class ResumeShare(BaseModel):
    resume_id: Optional[str] = None 
    can_comment: Optional[bool] = True 
    can_download: Optional[bool] = True 
    expiration_days: Optional[int] = 30 

# RESUME APPROVAL SCHEMA (Anthony UC-110)
class ApprovalRequest(BaseModel):
    status: str