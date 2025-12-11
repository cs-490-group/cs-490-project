from pydantic import BaseModel
from typing import Optional
    
class Skill(BaseModel):
    name: Optional[str] = None # NOTE: required for creation
    proficiency: Optional[str] = None
    category: Optional[str] = None
    position: Optional[int] = None
