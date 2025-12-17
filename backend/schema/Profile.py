from pydantic import BaseModel
from typing import Optional, Dict, Any


# NOTE: anything noted as required for creation should be validated in the endpoints

class Profile(BaseModel):
    username: Optional[str] = None # NOTE: required for creation
    email: Optional[str] = None # NOTE: required for creation
    full_name: Optional[str] = None # NOTE: required for creation
    phone_number: Optional[str] = None
    address: Optional[str] = None
    title: Optional[str] = None
    biography: Optional[str] = None
    industry: Optional[str] = None
    experience_level: Optional[str] = None
    account_tier: Optional[str] = "base_member" # "base_member" or "admin"
    leetcode: Optional[str] = None # Store external platform links and data
    hackerrank: Optional[str] = None
    codeacademy: Optional[str] = None
    # IMAGE MEDIA

class DeletePassword(BaseModel): # for profile deletion
    password: str
