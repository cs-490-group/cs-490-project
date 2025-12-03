from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.exceptions import HTTPException
from fastapi.responses import StreamingResponse
from pymongo.errors import DuplicateKeyError
from io import BytesIO
from pathlib import Path

from sessions.session_authorizer import authorize
from schema.Network import Contact
from mongo.network_dao import networks_dao
from mongo.media_dao import media_dao

networks_router = APIRouter(prefix = "/networks")

@networks_router.post("", tags = ["networks"])
async def add_contact(contact: Contact, uuid: str = Depends(authorize)):
    try:
        model = contact.model_dump()
        model["uuid"] = uuid
        result = await networks_dao.add_contact(model)
    except DuplicateKeyError:
        raise HTTPException(400, "Contact already exists")
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return {"contact_id": result}

@networks_router.get("", tags = ["networks"])
async def get_contact(contact_id: str, uuid: str = Depends(authorize)):
    try:
        result = await networks_dao.get_contact(contact_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result:
        return {"contact": result}
    else:
        raise HTTPException(400, "Could not find contact")

@networks_router.get("/me", tags = ["networks"])
async def get_all_contacts(uuid: str = Depends(authorize)):
    try:
        results = await networks_dao.get_all_contacts(uuid)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results

@networks_router.put("", tags = ["networks"])
async def update_contact(contact_id: str, contact: Contact, uuid: str = Depends(authorize)):
    try:
        result = await networks_dao.update_contact(contact_id, contact.model_dump(exclude_unset = True))
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result == 0:
        raise HTTPException(400, "Could not find contact to update")
    else:
        return {"detail": "Sucessfully updated contact"}

@networks_router.delete("", tags = ["networks"])
async def delete_contact(contact_id: str, uuid: str = Depends(authorize)):
    try:
        result = await networks_dao.delete_contact(contact_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if result == 0:
        raise HTTPException(400, "Could not find contact to delete")
    else:
        return {"detail": "Sucessfully deleted contact"}

@networks_router.post("/avatar", tags = ["networks"])
async def upload_avatar(contact_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        media_id = await media_dao.add_media(contact_id, media.filename, await media.read(), media.content_type)
    except Exception as e:
        raise HTTPException(400, "Unable to find media")

    if not media_id:
        raise HTTPException(400, "Unable to upload media")
    
    return {"media_id": media_id}

@networks_router.get("/avatar", tags = ["networks"])
async def download_avatar(contact_id: str, uuid: str = Depends(authorize)):
    try:
        media_ids = await media_dao.get_all_associated_media_ids(contact_id)
        print(media_ids)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media_ids:
        # Return default profile picture if contact hasn't set one
        default_image_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "default.png"

        if not default_image_path.exists():
            raise HTTPException(500, "Default profile picture not found")

        try:
            with open(default_image_path, "rb") as f:
                default_image_content = f.read()

            return StreamingResponse(
                BytesIO(default_image_content),
                media_type="image/png",
                headers={
                    "Content-Disposition": 'inline; filename="default.png"'
                }
            )
        except Exception as e:
            raise HTTPException(500, "Could not load default profile picture")
    
    try:
        media = await media_dao.get_media(media_ids[-1])
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media:
        # Return default profile picture if media not found
        default_image_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "default.png"

        if not default_image_path.exists():
            raise HTTPException(500, "Default profile picture not found")

        try:
            with open(default_image_path, "rb") as f:
                default_image_content = f.read()

            return StreamingResponse(
                BytesIO(default_image_content),
                media_type="image/png",
                headers={
                    "Content-Disposition": 'inline; filename="default.png"'
                }
            )
        except Exception as e:
            raise HTTPException(500, "Could not load default profile picture")

    return StreamingResponse(
        BytesIO(media["contents"]),
        media_type = media["content_type"],
        headers = {
            "Content-Disposition": f"inline; filename=\"{media['filename']}\""
        }
    )

@networks_router.put("/avatar", tags = ["networks"])
async def update_avatar(contact_id: str, media: UploadFile, uuid: str = Depends(authorize)):
    try:
        media_ids = await media_dao.get_all_associated_media_ids(contact_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media_ids:
        raise HTTPException(400, "Could not find requested media")
    
    try:
        updated = await media_dao.update_media(media_ids[-1], media.filename, await media.read(), None, media.content_type)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not updated:
        raise HTTPException(500, "Unable to update media")
    
    return {"detail": "Sucessfully updated file"}

@networks_router.get("/discovery", tags = ["networks"])
async def get_all_discovery_contacts(uuid: str = Depends(authorize)):
    try:
        results = await networks_dao.get_all_discovery_contacts(uuid)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    return results

@networks_router.delete("/avatar", tags = ["networks"])
async def delete_avatar(contact_id: str, uuid: str = Depends(authorize)):
    try:
        media_ids = await media_dao.get_all_associated_media_ids(contact_id)
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not media_ids:
        raise HTTPException(400, "Could not find requested media")
    
    try:
        deleted = await media_dao.delete_media(media_ids[-1])
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not deleted:
        raise HTTPException(500, "Unable to delete media")
    
    return {"detail": "Sucessfully deleted file"}