from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from schema.Resume import ContactInfo, Colors, Fonts


class Template(BaseModel):
    """
    Resume Template Schema
    Related to UC-046: Resume Template Management
    Allows users to save and reuse custom resume templates
    """
    name: Optional[str] = None
    description: Optional[str] = None
    template_type: Optional[str] = None  # chronological, functional, hybrid

    # Template styling
    colors: Optional[Colors] = None
    fonts: Optional[Fonts] = None
    sections: Optional[list[str]] = None  # Default sections for this template

    # Template metadata
    is_default: Optional[bool] = False  # Mark as default template
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # User ownership
    uuid: Optional[str] = None  # User ID (owner of the template)

    # Template preview data
    preview_image: Optional[str] = None  # Base64 encoded preview image
    sample_resume_id: Optional[str] = None  # Reference to a sample resume for preview

    # Tags and organization
    tags: Optional[list[str]] = None  # For categorizing templates
    is_public: Optional[bool] = False  # Can be shared with other users
    shared_with: Optional[list[str]] = None  # User IDs template is shared with
