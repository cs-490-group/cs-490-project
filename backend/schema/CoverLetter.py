from pydantic import BaseModel
from typing import Optional, List

class CoverLetterIn(BaseModel):
    title: str
    company: str = ""
    position: str = ""
    content: str
    template_type: Optional[str] = None

class CoverLetterUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    content: Optional[str] = None
    job_id: Optional[str] = None
    template_type: Optional[str] = None

class CoverLetterOut(BaseModel):
    id: str
    user_id: str
    title: str
    company: str
    position: str
    content: str
    created_at: str
    template_type: Optional[str] = None
    usage_count: Optional[int] = 0
    default_cover_letter: Optional[bool] = False
    job_id: Optional[str] = None
    approval_status: Optional[str] = "pending"


class CoverLetterFeedback(BaseModel):
    cover_letter_id: Optional[str] = None
    reviewer: Optional[str] = None
    email: Optional[str] = None
    comment: Optional[str] = None
    resolved: Optional[bool] = False
    status: Optional[str] = "comment" 

class CoverLetterShare(BaseModel):
    cover_letter_id: Optional[str] = None
    can_comment: Optional[bool] = True
    can_download: Optional[bool] = True
    expiration_days: Optional[int] = 30

class CoverLetterVersion(BaseModel):
    cover_letter_id: Optional[str] = None
    version_name: Optional[str] = "Auto-Save"
    title_snapshot: Optional[str] = None
    content_snapshot: Optional[str] = None
    created_at: Optional[str] = None

class ApprovalRequest(BaseModel):
    status: str