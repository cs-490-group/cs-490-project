from pydantic import BaseModel
from typing import Optional, Literal

class Numbers(BaseModel):
    primary: Optional[Literal["home", "work", "mobile"]] = None
    home: Optional[str] = None
    work: Optional[str] = None
    mobile: Optional[str] = None

class Websites(BaseModel):
    linkedin: Optional[str] = None
    # TODO: add more if necessary

    other: Optional[str] = None # any personal websites

class Employment(BaseModel):
    position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None

class Contact(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone_numbers: Optional[Numbers] = None
    websites: Optional[Websites] = None
    employment: Optional[Employment] = None

    #TODO: Include profile picture~~