from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import List

from mongo.badges_dao import badges_dao
from sessions.session_authorizer import authorize
from schema.Badges import Badge, BadgeCreate, BadgeUpdate, BadgeResponse

badges_router = APIRouter(prefix="/badges", tags=["badges"])

@badges_router.get("/", response_model=BadgeResponse, tags=["badges"])
async def get_user_badges(platform: str = None, uuid: str = Depends(authorize)):
    """Get all badges for the authenticated user, optionally filtered by platform"""
    try:
        badges = await badges_dao.get_user_badges(uuid, platform)
        return {"badges": badges}
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch badges: {str(e)}")

@badges_router.get("/platform/{platform}", response_model=BadgeResponse, tags=["badges"])
async def get_platform_badges(platform: str, uuid: str = Depends(authorize)):
    """Get badges for a specific platform (hackerrank or codecademy)"""
    if platform not in ["hackerrank", "codecademy"]:
        raise HTTPException(400, "Invalid platform. Must be 'hackerrank' or 'codecademy'")
    
    try:
        badges = await badges_dao.get_user_badges(uuid, platform)
        return {"badges": badges}
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch {platform} badges: {str(e)}")

@badges_router.get("/platform/{platform}/category/{category}", response_model=BadgeResponse, tags=["badges"])
async def get_platform_category_badges(platform: str, category: str, uuid: str = Depends(authorize)):
    """Get badges for a specific platform and category (mainly for Codecademy)"""
    if platform not in ["hackerrank", "codecademy"]:
        raise HTTPException(400, "Invalid platform. Must be 'hackerrank' or 'codecademy'")
    
    try:
        badges = await badges_dao.get_badges_by_category(uuid, platform, category)
        return {"badges": badges}
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch {platform} {category} badges: {str(e)}")

@badges_router.get("/{badge_id}", response_model=Badge, tags=["badges"])
async def get_badge(badge_id: str, uuid: str = Depends(authorize)):
    """Get a specific badge by ID"""
    try:
        badge = await badges_dao.get_badge(uuid, badge_id)
        if not badge:
            raise HTTPException(404, "Badge not found")
        return badge
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch badge: {str(e)}")

@badges_router.post("/", response_model=Badge, tags=["badges"])
async def create_badge(badge: BadgeCreate, uuid: str = Depends(authorize)):
    """Create a new badge"""
    if badge.platform not in ["hackerrank", "codecademy"]:
        raise HTTPException(400, "Invalid platform. Must be 'hackerrank' or 'codecademy'")
    
    try:
        badge_data = badge.model_dump()
        
        # Parse earned_date if provided
        if badge_data.get("earned_date"):
            if isinstance(badge_data["earned_date"], str):
                badge_data["earned_date"] = datetime.fromisoformat(badge_data["earned_date"].replace('Z', '+00:00'))
        
        badge_id = await badges_dao.add_badge(uuid, badge_data)
        created_badge = await badges_dao.get_badge(uuid, badge_id)
        return created_badge
    except Exception as e:
        raise HTTPException(500, f"Failed to create badge: {str(e)}")

@badges_router.put("/{badge_id}", response_model=Badge, tags=["badges"])
async def update_badge(badge_id: str, badge_update: BadgeUpdate, uuid: str = Depends(authorize)):
    """Update an existing badge"""
    try:
        # Check if badge exists and belongs to user
        existing_badge = await badges_dao.get_badge(uuid, badge_id)
        if not existing_badge:
            raise HTTPException(404, "Badge not found")
        
        # Update only provided fields
        update_data = badge_update.model_dump(exclude_unset=True)
        
        if update_data:
            updated_count = await badges_dao.update_badge(uuid, badge_id, update_data)
            if updated_count == 0:
                raise HTTPException(404, "Badge not found")
        
        # Return updated badge
        updated_badge = await badges_dao.get_badge(uuid, badge_id)
        return updated_badge
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update badge: {str(e)}")

@badges_router.delete("/{badge_id}", tags=["badges"])
async def delete_badge(badge_id: str, uuid: str = Depends(authorize)):
    """Delete a badge"""
    try:
        # Check if badge exists and belongs to user
        existing_badge = await badges_dao.get_badge(uuid, badge_id)
        if not existing_badge:
            raise HTTPException(404, "Badge not found")
        
        deleted_count = await badges_dao.delete_badge(uuid, badge_id)
        if deleted_count == 0:
            raise HTTPException(404, "Badge not found")
        
        return {"message": "Badge deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete badge: {str(e)}")

@badges_router.delete("/platform/{platform}", tags=["badges"])
async def delete_platform_badges(platform: str, uuid: str = Depends(authorize)):
    """Delete all badges for a specific platform"""
    if platform not in ["hackerrank", "codecademy"]:
        raise HTTPException(400, "Invalid platform. Must be 'hackerrank' or 'codecademy'")
    
    try:
        deleted_count = await badges_dao.delete_all_user_badges(uuid, platform)
        return {"message": f"Deleted {deleted_count} {platform} badges"}
    except Exception as e:
        raise HTTPException(500, f"Failed to delete {platform} badges: {str(e)}")
