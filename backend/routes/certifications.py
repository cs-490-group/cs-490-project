from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pymongo.errors import DuplicateKeyError
from io import BytesIO

from mongo.certifications_dao import certifications_dao
from mongo.media_dao import media_dao
from sessions.session_authorizer import authorize
from schema.Certification import Certification

certifications_router = APIRouter(prefix = "/certifications")

@certifications_router.post("", tags = ["certifications"])
async def add_cert(cert: Certification, uuid: str = Depends(authorize)):
    try:
        model = cert.model_dump()

        if not model.get("name"):
            raise HTTPException(422, "Certification requires a name")

        model["uuid"] = uuid
        result = await certifications_dao.add_certification(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Certification already exists") # FIXME: redundant since keys are generated uniquely?
    except HTTPException as http:
        raise http
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"detail": "Sucessfully added certfication", "certification_id": result}

@certifications_router.get("", tags = ["certifications"])
async def get_certification(certification_id: str, uuid: str = Depends(authorize)):
    try:
        result = await certifications_dao.get_certification(certification_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result:
        id = result.pop("_id")
        result["_id"] = str(result["_id"])
        return result
    else:
        raise HTTPException(400, "Certification not found")

@certifications_router.get("/me", tags = ["certifications"])
async def get_all_certifications(uuid: str = Depends(authorize)):
    try:
        results = await certifications_dao.get_all_certifications(uuid)
        # NOTE: do not raise http exception for empty skills, as it can lead to inconsistent behavior on the frontend
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results

@certifications_router.put("", tags = ["certifications"])
async def update_certification(certification_id: str, certification: Certification, uuid: str = Depends(authorize)):    
    try:
        model = certification.model_dump(exclude_unset = True)
        updated = await certifications_dao.update_certification(certification_id, model)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if updated == 0:
        raise HTTPException(400, "Certification not found")
    else:
        return {"detail": "Successfully updated certification"}
    
@certifications_router.delete("", tags = ["certifications"])
async def delete_certification(certification_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await certifications_dao.delete_certification(certification_id)
    except Exception as e:
        raise HTTPException(500, str(e))

    if deleted == 0:
        raise HTTPException(400, "Certification not found")
    else:
        return {"detail": "Successfully deleted certification"}
    
@certifications_router.post("/media", tags = ["certifications"])
async def upload_media(certification_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        media_id = await media_dao.add_media(certification_id, media.filename, await media.read(), media.content_type)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media_id:
        raise HTTPException(500, "Unable to upload media")
    
    return {"detail": "Sucessfully uploaded file", "media_id": media_id}

@certifications_router.get('/media', tags = "certifications")
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

@certifications_router.get("/media/ids", tags = ["certifications"])
async def get_all_media_ids(certification_id: str, uuid: str = Depends(authorize)):
    try:
        media_ids = await media_dao.get_all_associated_media_ids(certification_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"detail": "Sucessfully gotten media ids", "media_id_list": media_ids}

@certifications_router.put("/media", tags = ["certifications"])
async def update_media(certification_id: str, media_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        updated = await media_dao.update_media(media_id, media.filename, await media.read(), certification_id, media.content_type)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not updated:
        raise HTTPException(500, "Unable to update media")
    
    return {"detail": "Sucessfully updated file"}

@certifications_router.delete("/media", tags = ["certifications"])
async def delete_media(media_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await media_dao.delete_media(media_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not deleted:
        raise HTTPException(500, "Unable to delete media")
    
    return {"detail": "Sucessfully deleted file"}