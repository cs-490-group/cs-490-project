from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

class BrandingConfig(BaseModel):
    """White-label settings for the institution"""
    logo_url: Optional[str] = None
    primary_color: str = "#2196f3"  # Default blue
    secondary_color: str = "#1a1a1a"
    institution_name: str = "Career Services"
    portal_title: str = "Student Success Portal"

class Organization(BaseModel):
    name: str
    domain_restriction: Optional[str] = None  # e.g., "@njit.edu" - auto-adds users to org
    admin_ids: List[str] = []  # UUIDs of Career Services staff
    cohort_ids: List[str] = [] # List of Team IDs belonging to this Org
    branding: BrandingConfig = BrandingConfig()
    subscription_tier: str = "enterprise_v1"
    settings: Dict = {"allow_student_team_creation": False}
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

class BulkImportRequest(BaseModel):
    """Schema for CSV/Bulk upload"""
    cohort_name: str
    users: List[Dict[str, str]] # List of {email, name, role}


class JoinOrgRequest(BaseModel):
    """Request to join an existing organization via code/ID"""
    org_id: str