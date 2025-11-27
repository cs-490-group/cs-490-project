from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId
from mongo.groups_dao import groups_dao
from schema.groups import *

groups_router = APIRouter(prefix="/groups")


@groups_router.post("/create")
async def create_group(request: CreateGroupRequest):
    try:
        group_data = {
            "name": request.name,
            "category": request.category,
            "maxMembers": request.maxMembers,
            "creator_id": request.uuid,
            "members": [{"uuid": request.uuid, "role": "admin"}],
            "postsVisibleToNonMembers": True,  
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        group_id = await groups_dao.add_group(group_data)
        
        return {
            "id": str(group_id),
            "name": request.name,
            "category": request.category,
            "maxMembers": request.maxMembers,
            "message": "Group created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.get("/")
async def get_all_groups():
    try:
        groups = await groups_dao.get_all_groups()
        return [
            {
                "id": str(group["_id"]),
                "name": group.get("name"),
                "category": group.get("category"),
                "memberCount": len(group.get("members", [])),
                "maxMembers": group.get("maxMembers"),
                "members": group.get("members", [])
            }
            for group in groups
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.get("/{group_id}")
async def get_group(group_id: str):
    try:
        group = await groups_dao.get_group(group_id)
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
        return {
            "id": str(group["_id"]),
            "name": group.get("name"),
            "category": group.get("category"),
            "maxMembers": group.get("maxMembers"),
            "members": group.get("members", []),
            "postsVisibleToNonMembers": group.get("postsVisibleToNonMembers", True),  
            "createdAt": group.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.get("/user/{user_id}")
async def get_user_groups(user_id: str):
    try:
        groups = await groups_dao.get_all_user_groups(user_id)
        return [
            {
                "id": str(group["_id"]),
                "name": group.get("name"),
                "category": group.get("category"),
                "memberCount": len(group.get("members", [])),
                "maxMembers": group.get("maxMembers")
            }
            for group in groups
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.get("/{group_id}/user/{user_id}")
async def get_user_group(group_id: str, user_id: str):
    try:
        group_id = ObjectId(group_id)
        group = await groups_dao.collection.find_one({"_id": group_id})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
        user_member = next((m for m in group.get("members", []) if m["uuid"] == user_id), None)
        if not user_member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not in group")
        
        return {
            "groupId": str(group["_id"]),
            "uuid": user_id,
            "role": user_member.get("role"),
            "groupName": group.get("name")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.post("/join")
async def join_group(request: JoinGroupRequest):
    try:
        group_id = ObjectId(request.groupId)
        group = await groups_dao.collection.find_one({"_id": group_id})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
        if any(m["uuid"] == request.uuid for m in group.get("members", [])):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already a member")
        
        if len(group.get("members", [])) >= group.get("maxMembers", 50):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group is full")
        
        result = await groups_dao.add_user_to_group(group_id, request.uuid, request.role)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to join group")
        
        return {"message": f"Successfully joined {group.get('name')}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.post("/{group_id}/leave")
async def leave_group(group_id: str, request: JoinGroupRequest):
    try:
        group_id = ObjectId(group_id)
        result = await groups_dao.remove_user_from_group(group_id, request.uuid)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to leave group")
        return {"message": "Successfully left the group"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.put("/{group_id}/user/{user_id}")
async def update_user_in_group(group_id: str, user_id: str, request: UpdateUserRoleRequest):
    try:
        group_id = ObjectId(group_id)
        result = await groups_dao.update_user_role(group_id, user_id, request.newRole)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update user role")
        return {"message": f"User role updated to {request.newRole}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.put("/{group_id}")
async def update_group(group_id: str, request: UpdateGroupRequest):
    try:
        group_id = ObjectId(group_id)
        update_data = {}
        if request.name:
            update_data["name"] = request.name
        if request.category:
            update_data["category"] = request.category
        if request.maxMembers:
            update_data["maxMembers"] = request.maxMembers
        if hasattr(request, "postsVisibleToNonMembers"):
            update_data["postsVisibleToNonMembers"] = request.postsVisibleToNonMembers
        update_data["updated_at"] = datetime.utcnow()
        
        result = await groups_dao.update_group(group_id, update_data)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        return {"message": "Group updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@groups_router.delete("/{group_id}")
async def delete_group(group_id: str):
    try:
        group_id = ObjectId(group_id)
        result = await groups_dao.delete_group(group_id)
        if result == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        return {"message": "Group deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
