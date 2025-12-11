from pydantic import BaseModel
from typing import Optional

class Project(BaseModel):
    project_name: Optional[str] = None # NOTE: required for creation
    description: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None # date?
    end_date: Optional[str] = None # date?
    skills: Optional[list[str]] = None
    team_size: Optional[int] = None
    details: Optional[str] = None
    project_url: Optional[str] = None
    achievements: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[str] = None
    thumbnail_id: Optional[str] = None
    # MUTLIMEDIA
