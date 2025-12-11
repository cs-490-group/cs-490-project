from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class TimeEntry(BaseModel):
    """Schema for time tracking entry"""
    activity_type: str = Field(..., min_length=1, max_length=100)
    date: str  # ISO format date string
    duration: float = Field(..., gt=0, le=24)  # Hours, max 24 per day
    notes: Optional[str] = Field(None, max_length=500)
    
    @field_validator('activity_type')
    @classmethod
    def validate_activity_type(cls, v):
        valid_types = [
            'Networking',
            'Applications',
            'Interview Prep',
            'Skill Development',
            'Research',
            'Follow-ups',
            'Portfolio Work',
            'Other'
        ]
        if v not in valid_types:
            raise ValueError(f'activity_type must be one of: {", ".join(valid_types)}')
        return v
    
    @field_validator('duration')
    @classmethod
    def validate_duration(cls, v):
        # Round to 2 decimal places (quarter hours)
        return round(v, 2)

class TimeEntryUpdate(BaseModel):
    """Schema for updating time tracking entry"""
    activity_type: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[str] = None
    duration: Optional[float] = Field(None, gt=0, le=24)
    notes: Optional[str] = Field(None, max_length=500)
    
    @field_validator('activity_type')
    @classmethod
    def validate_activity_type(cls, v):
        if v is not None:
            valid_types = [
                'Networking',
                'Applications',
                'Interview Prep',
                'Skill Development',
                'Research',
                'Follow-ups',
                'Portfolio Work',
                'Other'
            ]
            if v not in valid_types:
                raise ValueError(f'activity_type must be one of: {", ".join(valid_types)}')
        return v
    
    @field_validator('duration')
    @classmethod
    def validate_duration(cls, v):
        if v is not None:
            return round(v, 2)
        return v