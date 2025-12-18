from fastapi import APIRouter, HTTPException, Depends, Header, File, UploadFile, Form
from typing import Optional
import os
import json
import re
from datetime import datetime, timezone
from uuid import uuid4

from mongo.templates_dao import templates_dao
from mongo.resumes_dao import resumes_dao
from sessions.session_authorizer import authorize
from sessions.session_manager import session_manager
from schema.Template import Template

# Optional authorization that returns None if auth fails
async def authorize_optional(uuid: str = Header(None), authorization: str = Header(None)):
    """Optional authorization that returns None instead of raising exception"""
    if not uuid or not authorization:
        return None
    try:
        if authorization.startswith("Bearer ") and session_manager.authenticate_session(uuid, authorization.removeprefix("Bearer ").strip()):
            return uuid
    except:
        pass
    return None

templates_router = APIRouter(prefix="/templates")


def extract_colors_and_fonts_from_html(html_content: str) -> tuple:
    """
    Extract colors and fonts from HTML/CSS content
    Looks for common color hex values and font-family declarations
    Returns (colors_dict, fonts_dict)
    """
    colors = {'primary': '#1a1a1a', 'accent': '#2c3e50'}  # defaults
    fonts = {'heading': 'Calibri', 'body': 'Calibri'}  # defaults

    try:
        # Find all hex colors in the HTML
        hex_colors = re.findall(r'#[0-9a-fA-F]{6}', html_content)
        if len(hex_colors) >= 1:
            colors['primary'] = hex_colors[0]  # First color is primary
        if len(hex_colors) >= 2:
            colors['accent'] = hex_colors[1]   # Second color is accent

        # Find font-family declarations
        font_families = re.findall(r'font-family:\s*([^;,\n}]+)', html_content)
        if font_families:
            # Clean up font names (remove quotes and extra spaces)
            cleaned_fonts = [f.strip().strip("'\"") for f in font_families]
            # Use first font as heading, last unique as body
            if cleaned_fonts:
                fonts['heading'] = cleaned_fonts[0]
                fonts['body'] = cleaned_fonts[-1] if len(cleaned_fonts) > 1 else cleaned_fonts[0]

    except Exception as e:
        print(f"[Extract Styles] Error extracting colors/fonts: {e}")
        # Return defaults on error

    return colors, fonts


@templates_router.post("", tags=["templates"])
async def create_template(template: Template, uuid: str = Depends(authorize)):
    """
    Create a new resume template
    Related to UC-046
    """
    try:
        model = template.model_dump(exclude_unset=True)

        if not model.get("name"):
            raise HTTPException(422, "Template requires a name")

        model["uuid"] = uuid
        result = await templates_dao.add_template(model)
    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"Error creating template: {e}")
        raise HTTPException(500, str(e))

    return {"detail": "Successfully created template", "template_id": result}


@templates_router.post("/upload", tags=["templates"])
async def upload_resume_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    uuid: str = Header(default=None)
):
    """
    Upload an HTML resume file as a template
    Related to UC-046: Resume Template Management - Import existing resume as template
    """
    # Verify user is authenticated
    if not uuid:
        raise HTTPException(status_code=401, detail="User authentication required - missing uuid")

    # Validate file type
    if file.content_type != "text/html" and not file.filename.lower().endswith('.html'):
        raise HTTPException(status_code=400, detail="Only HTML files are supported")

    try:
        # Read HTML content
        content = await file.read()
        html_content = content.decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read HTML file: {str(e)}")

    try:
        # Generate unique ID for template
        template_id = str(uuid4())
        created_at = datetime.now(timezone.utc)

        # Extract colors and fonts from the HTML
        print(f"[Upload Template] Extracting colors and fonts from HTML")
        extracted_colors, extracted_fonts = extract_colors_and_fonts_from_html(html_content)
        print(f"[Upload Template] Extracted colors: {extracted_colors}, fonts: {extracted_fonts}")

        # Create new template document
        new_template = {
            "_id": template_id,
            "uuid": uuid,
            "name": name,
            "description": description,
            "template_type": "imported",
            "html_content": html_content,  # Store raw HTML for reference
            "colors": extracted_colors,    # Store extracted colors
            "fonts": extracted_fonts,      # Store extracted fonts
            "sections": ["contact", "summary", "experience", "education", "skills"],
            "is_default": False,
            "created_at": created_at,
            "updated_at": created_at,
            "is_public": False,
            "uploadedFile": True  # Mark as imported file
        }

        # Save to database
        await templates_dao.add_template(new_template)

        return {
            "template_id": template_id,
            "template": {
                "_id": template_id,
                "uuid": uuid,
                "name": name,
                "description": description,
                "template_type": "imported",
                "is_default": False,
                "created_at": created_at.isoformat(),
                "uploadedFile": True
            }
        }
    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"Error uploading template: {e}")
        raise HTTPException(500, str(e))


@templates_router.get("/library", tags=["templates"])
async def get_template_library():
    """
    Get built-in template library (no authentication required)
    Related to UC-046
    """
    try:
        # Get the path to templates_library.json
        template_path = os.path.join(os.path.dirname(__file__), "..", "templates_library.json")

        if not os.path.exists(template_path):
            return []

        with open(template_path, 'r') as f:
            templates = json.load(f)

        return templates
    except Exception as e:
        print(f"Error loading template library: {e}")
        raise HTTPException(500, "Failed to load template library")


@templates_router.get("/me", tags=["templates"])
async def get_user_templates(uuid: Optional[str] = Depends(authorize_optional)):
    """
    Get all templates for the current user (including shared ones)
    Related to UC-046
    """
    # Return empty list if not authenticated
    if not uuid:
        return []

    try:
        results = await templates_dao.get_user_templates(uuid)
        return results
    except Exception as e:
        print(f"Error fetching user templates: {e}")
        # Return empty list on error so built-in templates still show
        return []


@templates_router.get("/default", tags=["templates"])
async def get_default_template(uuid: str = Depends(authorize)):
    """
    Get the user's default template
    Related to UC-046
    """
    try:
        result = await templates_dao.get_user_default_template(uuid)
    except Exception as e:
        print(f"Error fetching default template: {e}")
        raise HTTPException(500, str(e))

    if result:
        return result
    else:
        # If no default template, return first user template or None
        templates = await templates_dao.get_user_templates(uuid)
        if templates:
            return templates[0]
        return None


@templates_router.get("/public", tags=["templates"])
async def get_public_templates(limit: int = 20):
    """
    Get public templates available to all users
    Related to UC-046
    """
    try:
        results = await templates_dao.get_public_templates(limit)
    except Exception as e:
        print(f"Error fetching public templates: {e}")
        raise HTTPException(500, str(e))

    return results


@templates_router.get("", tags=["templates"])
async def get_template(template_id: str, uuid: str = Depends(authorize)):
    """
    Get a specific template by ID
    Related to UC-046
    """
    try:
        result = await templates_dao.get_template(template_id)
    except Exception as e:
        print(f"Error fetching template: {e}")
        raise HTTPException(500, str(e))

    if result:
        return result
    else:
        raise HTTPException(404, "Template not found")


@templates_router.put("", tags=["templates"])
async def update_template(
    template_id: str,
    template: Template,
    uuid: str = Depends(authorize)
):
    """
    Update a template
    Related to UC-046
    """
    try:
        # Verify ownership
        existing = await templates_dao.get_template(template_id)
        if not existing or existing.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to update this template")

        model = template.model_dump(exclude_unset=True)
        updated = await templates_dao.update_template(template_id, model)
    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"Error updating template: {e}")
        raise HTTPException(500, str(e))

    if updated == 0:
        raise HTTPException(404, "Template not found")
    else:
        return {"detail": "Successfully updated template"}


@templates_router.delete("", tags=["templates"])
async def delete_template(template_id: str, uuid: str = Depends(authorize)):
    """
    Delete a template
    Related to UC-046
    """
    try:
        # Verify ownership
        existing = await templates_dao.get_template(template_id)
        if not existing or existing.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to delete this template")

        deleted = await templates_dao.delete_template(template_id)
    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"Error deleting template: {e}")
        raise HTTPException(500, str(e))

    if deleted == 0:
        raise HTTPException(404, "Template not found")
    else:
        return {"detail": "Successfully deleted template"}


@templates_router.put("/{template_id}/set-default", tags=["templates"])
async def set_default_template(
    template_id: str,
    uuid: str = Depends(authorize)
):
    """
    Set a template as the user's default
    Related to UC-046
    """
    try:
        # Verify ownership
        existing = await templates_dao.get_template(template_id)
        if not existing or existing.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to set this template")

        updated = await templates_dao.set_default_template(uuid, template_id)
    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"Error setting default template: {e}")
        raise HTTPException(500, str(e))

    if updated == 0:
        raise HTTPException(404, "Template not found")
    else:
        return {"detail": "Successfully set as default template"}


@templates_router.post("/{resume_id}/from-resume", tags=["templates"])
async def create_template_from_resume(
    resume_id: str,
    name: Optional[str] = None,
    uuid: str = Depends(authorize)
):
    """
    Create a new template from an existing resume
    Related to UC-046
    """
    try:
        # Get the resume
        resume = await resumes_dao.get_resume(resume_id)
        if not resume or resume.get("uuid") != uuid:
            raise HTTPException(404, "Resume not found")

        # Create template
        template_id = await templates_dao.create_template_from_resume(
            resume_id,
            resume,
            uuid
        )

        # Update template name if provided
        if name:
            await templates_dao.update_template(template_id, {"name": name})

    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"Error creating template from resume: {e}")
        raise HTTPException(500, str(e))

    return {
        "detail": "Successfully created template from resume",
        "template_id": template_id
    }


@templates_router.put("/{template_id}/share", tags=["templates"])
async def share_template(
    template_id: str,
    user_ids: list[str],
    uuid: str = Depends(authorize)
):
    """
    Share a template with other users
    Related to UC-046
    """
    try:
        # Verify ownership
        existing = await templates_dao.get_template(template_id)
        if not existing or existing.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to share this template")

        updated = await templates_dao.share_template(template_id, user_ids)
    except HTTPException as http:
        raise http
    except Exception as e:
        print(f"Error sharing template: {e}")
        raise HTTPException(500, str(e))

    if updated == 0:
        raise HTTPException(404, "Template not found")
    else:
        return {"detail": "Successfully shared template"}


@templates_router.get("/search/{query}", tags=["templates"])
async def search_templates(query: str, uuid: str = Depends(authorize)):
    """
    Search user's templates by name, description, or tags
    Related to UC-046
    """
    try:
        results = await templates_dao.search_templates(uuid, query)
    except Exception as e:
        print(f"Error searching templates: {e}")
        raise HTTPException(500, str(e))

    return results
