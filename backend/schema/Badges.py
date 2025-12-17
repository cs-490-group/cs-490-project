from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Badge(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    earned_date: Optional[datetime] = None
    icon: Optional[str] = None  # Can be URL or base64 string
    category: Optional[str] = None  # For Codecademy: course, skill, career
    platform: str  # hackerrank or codecademy

class BadgeCreate(BaseModel):
    name: str
    description: str
    earned_date: Optional[datetime] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    platform: str

class BadgeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    earned_date: Optional[datetime] = None
    icon: Optional[str] = None
    category: Optional[str] = None

class BadgeResponse(BaseModel):
    badges: List[Badge]
