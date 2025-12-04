from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pymongo.errors import DuplicateKeyError
from io import BytesIO

from mongo.projects_dao import projects_dao
from mongo.media_dao import media_dao
from sessions.session_authorizer import authorize
from schema.Project import Project

projects_router = APIRouter(prefix = "/projects")

@projects_router.post("", tags = ["projects"])
async def add_project(project: Project, uuid: str = Depends(authorize)):
    try:
        model = project.model_dump()

        if not model.get("project_name"):
            raise HTTPException(422, "Project requires a project name")

        model["uuid"] = uuid
        result = await projects_dao.add_project(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Project already exists") # FIXME: redundant since keys are generated uniquely?
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"detail": "Successfully added project", "project_id": result}

@projects_router.get("", tags = ["projects"])
async def get_project(project_id: str, uuid: str = Depends(authorize)):
    try:
        result = await projects_dao.get_project(project_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result:
        result["_id"] = str(result["_id"])
        return result
    else:
        raise HTTPException(400, "Project not found")

@projects_router.get("/me", tags = ["projects"])
async def get_all_projects(uuid: str = Depends(authorize)):
    try:
        results = await projects_dao.get_all_projects(uuid)
        # NOTE: do not raise http exception for empty projects, as it can lead to inconsistent behavior on the frontend
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results


@projects_router.put("", tags = ["projects"])
async def update_project(project_id: str, project: Project, uuid: str = Depends(authorize)):
    try:
        model = project.model_dump(exclude_unset = True)
        updated = await projects_dao.update_project(project_id, model)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if updated == 0:
        raise HTTPException(400, "Project not found")
    else:
        return {"detail": "Successfully updated project"}

@projects_router.delete("", tags = ["projects"])
async def delete_project(project_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await projects_dao.delete_project(project_id)
    except Exception as e:
        raise HTTPException(500, str(e))

    if deleted == 0:
        raise HTTPException(400, "Project not found")
    else:
        return {"detail": "Successfully deleted project"}
    
@projects_router.post("/media", tags = ["projects"])
async def upload_media(project_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        media_id = await media_dao.add_media(project_id, media.filename, await media.read(), media.content_type)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media_id:
        raise HTTPException(500, "Unable to upload media")
    
    return {"detail": "Sucessfully uploaded file", "media_id": media_id}

@projects_router.get('/media', tags = "projects")
async def download_media(media_id, uuid: str = Depends(authorize)):
    try:
        media = await media_dao.get_media(media_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media:
        raise HTTPException(400, "Could not find requested media")

    return StreamingResponse(
        BytesIO(media["contents"]),
        media_type = media["content_type"],
        headers = {
            "Content-Disposition": f"inline; filename=\"{media['filename']}\""
        }
    )

@projects_router.get("/media/ids", tags = ["projects"])
async def get_all_media_ids(project_id: str, uuid: str = Depends(authorize)):
    try:
        media_ids = await media_dao.get_all_associated_media_ids(project_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"detail": "Sucessfully gotten media ids", "media_id_list": media_ids}

@projects_router.put("/media", tags = ["projects"])
async def update_media(project_id: str, media_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        updated = await media_dao.update_media(media_id, media.filename, await media.read(), project_id, media.content_type)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not updated:
        raise HTTPException(500, "Unable to update media")
    
    return {"detail": "Sucessfully updated file"}

@projects_router.delete("/media", tags = ["projects"])
async def delete_media(media_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await media_dao.delete_media(media_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not deleted:
        raise HTTPException(500, "Unable to delete media")
    
    return {"detail": "Sucessfully deleted file"}