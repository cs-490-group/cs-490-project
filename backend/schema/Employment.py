from pydantic import BaseModel
from typing import Optional, List

class Employment(BaseModel):
    title: Optional[str] = None # NOTE: required for creation
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None # end?
    end_date: Optional[str] = None # end?
    description: Optional[str] = None
    accomplishments: Optional[List[str]] = None  # Key achievements/impact from this role
