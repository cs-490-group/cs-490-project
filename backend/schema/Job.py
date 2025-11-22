from pydantic import BaseModel
from typing import Optional, Union, List

class Company(BaseModel):
    size: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None  # Base64 encoded image data

class JobMaterials(BaseModel):
    resume_id: Optional[str] = None
    cover_letter_id: Optional[str] = None
    linked_date: Optional[str] = None

class MaterialsHistoryEntry(BaseModel):
    date: str
    resume_id: Optional[str] = None
    cover_letter_id: Optional[str] = None
    action: str

class Job(BaseModel):
    title: Optional[str] = None
    company: Optional[Union[str, dict]] = None  # Can be string name or dict with company data
    location: Optional[str] = None
    salary: Optional[str] = None
    url: Optional[str] = None
    deadline: Optional[str] = None
    industry: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    contacts: Optional[str] = None
    salary_notes: Optional[str] = None
    interview_notes: Optional[str] = None
    status_history: Optional[list[tuple[str, str]]] = None
    archived: Optional[bool] = False
    archive_reason: Optional[str] = None
    archive_date: Optional[str] = None
    company_data: Optional[Union[dict, Company]] = None 
    materials: Optional[Union[dict, JobMaterials]] = None
    materials_history: Optional[List[Union[dict, MaterialsHistoryEntry]]] = None

class UrlBody(BaseModel):
    url: str