from pydantic import BaseModel
from typing import Optional

class Certification(BaseModel): 
    name: Optional[str] = None # NOTE: required for creation
    issuer: Optional[str] = None
    date_earned: Optional[str] = None # date?
    date_expiry: Optional[str] = None # date?
    cert_number: Optional[str] = None
    category: Optional[str] = None
    position: Optional[str] = None
    verified: Optional[bool] = False
    document_name: Optional[str] = None
    # DOCUMENT-MEDIA
