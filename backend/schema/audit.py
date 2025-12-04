from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class AuditLog(BaseModel):
    actor_id: str        # UUID of the person performing the action
    actor_name: str      # Name for display
    action: str          # e.g., "VIEW_PROFILE", "EXPORT_CSV", "DELETE_USER"
    target_id: Optional[str] = None  # The ID of the object being acted upon
    organization_id: str # The Institution ID
    ip_address: Optional[str] = None
    details: Dict[str, Any] = {}     # Metadata (e.g., "Exported 500 records")
    timestamp: datetime = datetime.utcnow()