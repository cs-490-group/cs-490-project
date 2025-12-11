from pydantic import BaseModel
from typing import Optional

class Education(BaseModel):
    institution_name: Optional[str] = None # NOTE: required for creation
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_date: Optional[str] = None # date?
    gpa: Optional[float] = None
    gpa_private: Optional[bool] = False
    education_level: Optional[str] = None
    achievements: Optional[str] = None
    position: Optional[int] = None
