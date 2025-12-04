# Salary.py
from pydantic import BaseModel, Field
from typing import Optional

class SalaryRecord(BaseModel):
    year: int = Field(..., ge=2000, le=2100)
    salary_amount: float = Field(..., gt=0)
    job_role: Optional[str] = Field(None, max_length=100)
    company: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    employment_type: Optional[str] = Field(None, pattern="^(full-time|part-time|contract|freelance)$")
    currency: str = Field(default="USD", max_length=3)
    bonus: Optional[float] = Field(None, ge=0)
    equity_value: Optional[float] = Field(None, ge=0)
    total_compensation: Optional[float] = None
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "year": 2024,
                "salary_amount": 105000,
                "job_role": "Senior Software Engineer",
                "company": "Tech Corp",
                "location": "San Francisco, CA",
                "employment_type": "full-time",
                "currency": "USD",
                "bonus": 15000,
                "equity_value": 20000,
                "notes": "Includes stock options"
            }
        }

class SalaryRecordUpdate(BaseModel):
    year: Optional[int] = Field(None, ge=2000, le=2100)
    salary_amount: Optional[float] = Field(None, gt=0)
    job_role: Optional[str] = Field(None, max_length=100)
    company: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    employment_type: Optional[str] = Field(None, pattern="^(full-time|part-time|contract|freelance)$")
    currency: Optional[str] = Field(None, max_length=3)
    bonus: Optional[float] = Field(None, ge=0)
    equity_value: Optional[float] = Field(None, ge=0)
    total_compensation: Optional[float] = None
    notes: Optional[str] = None

class MarketData(BaseModel):
    year: int = Field(..., ge=2000, le=2100)
    job_role: str = Field(..., max_length=100)
    location: str = Field(..., max_length=100)
    market_average: float = Field(..., gt=0)
    percentile_25: Optional[float] = Field(None, gt=0)
    percentile_50: Optional[float] = Field(None, gt=0)
    percentile_75: Optional[float] = Field(None, gt=0)
    percentile_90: Optional[float] = Field(None, gt=0)
    sample_size: Optional[int] = Field(None, ge=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "year": 2024,
                "job_role": "Software Engineer",
                "location": "San Francisco, CA",
                "market_average": 98000,
                "percentile_50": 95000,
                "percentile_75": 110000,
                "percentile_90": 130000,
                "sample_size": 1500
            }
        }