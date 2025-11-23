from pydantic import BaseModel
from typing import Optional

class CoverLetterIn(BaseModel):
    title: str
    company: str = ""
    position: str = ""
    content: str
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
