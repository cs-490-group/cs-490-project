from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from io import BytesIO
import bcrypt
from pathlib import Path

from mongo.profiles_dao import profiles_dao
from mongo.media_dao import media_dao
from mongo.auth_dao import auth_dao
from mongo.certifications_dao import certifications_dao
from mongo.cover_letters_dao import cover_letters_dao
from mongo.education_dao import education_dao
from mongo.employment_dao import employment_dao
from mongo.jobs_dao import jobs_dao
from mongo.projects_dao import projects_dao
from mongo.skills_dao import skills_dao
from mongo.teams_dao import teams_dao
from sessions.session_manager import session_manager
from sessions.session_authorizer import authorize
from schema.Profile import Profile, DeletePassword

profiles_router = APIRouter(prefix = "/users")

# NOTE: creation of profile not available here as that should only be done via /api/auth/register

@profiles_router.get("/me", tags = ["profiles"])
async def get_profile(uuid: str = Depends(authorize)):    
    try:
        profile = await profiles_dao.get_profile(uuid)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if profile:
        return profile
    else:
        raise HTTPException(400, "User profile not found")

@profiles_router.put("/me", tags = ["profiles"])
async def update_profile(profile: Profile, uuid: str = Depends(authorize)):
    try:
        model = profile.model_dump(exclude_unset = True)
        model["date_updated"] = datetime.now(timezone.utc)
        updated = await profiles_dao.update_profile(uuid, model)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if updated == 0:
        raise HTTPException(400, "User profile not found")  
    else:
        return {"detail": "Successfully updated profile"}

@profiles_router.post("/me", tags = ["profiles"])
async def delete_profile(passSchema: DeletePassword, uuid: str = Depends(authorize)):
    try:
        pass_hash = await auth_dao.get_password_by_uuid(uuid)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if not bcrypt.checkpw(passSchema.password.encode("utf-8"), pass_hash.encode("utf-8")):
        raise HTTPException(401, "Invalid credentials")
    
    # continue to delete all data if password succeeds

    try:
        cert_list = await certifications_dao.get_all_certifications(uuid)
        for cert in cert_list:
            media_ids = await media_dao.get_all_associated_media_ids(cert.get("_id"))
            for id in media_ids:
                await media_dao.delete_media(id)
            await certifications_dao.delete_certification(cert.get("_id"))
        
        cov_list = await cover_letters_dao.get_all_cover_letters(uuid)
        for cov in cov_list:
            await cover_letters_dao.delete_cover_letter(cov.get("_id"))
        
        education_list = await education_dao.get_all_education(uuid)
        for education in education_list:
            await education_dao.delete_education(education.get("_id"))

        employment_list = await employment_dao.get_all_employment(uuid)
        for employment in employment_list:
            await employment_dao.delete_employment(employment.get("_id"))

        jobs_list = await jobs_dao.get_all_jobs(uuid)
        for job in jobs_list:
            await jobs_dao.delete_job(job.get("_id"))

        projects_list = await projects_dao.get_all_projects(uuid)
        for project in projects_list:
            media_ids = await media_dao.get_all_associated_media_ids(project.get("_id"))
            for id in media_ids:
                await media_dao.delete_media(id)
            await projects_dao.delete_project(project.get("_id"))
        
        skills_list = await skills_dao.get_all_skills(uuid)
        for skill in skills_list:
            await skills_dao.delete_skill(skill.get("_id"))

        media_ids = await media_dao.get_all_associated_media_ids(uuid)
        for id in media_ids:
            await media_dao.delete_media(id)
        await profiles_dao.delete_profile(uuid)

        user_team = await teams_dao.get_user_team(uuid)
        if user_team:
            team_id = user_team.get("_id")
            # Just remove user from team (don't delete the entire team)
            await teams_dao.remove_member_from_team(team_id, uuid)

        session_manager.kill_session(uuid)

        await auth_dao.delete_user(uuid)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    return {"detail": "Sucessfully deleted all user data"}
    
@profiles_router.post("/me/avatar", tags = ["profiles"])
async def upload_pfp(image: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        media_id = await media_dao.add_media(uuid, image.filename, await image.read(), image.content_type)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    if not media_id:
        raise HTTPException(500, "Unable to upload image")
    
    return {"detail": "Sucess", "image_id": media_id}

@profiles_router.get("/me/avatar", tags = ["profiles"])
async def retrieve_pfp(uuid: str = Depends(authorize)):
    try:
        media_ids = await media_dao.get_all_associated_media_ids(uuid)
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    if not media_ids:
        # Return default profile picture if user hasn't set one
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
    except:
        raise HTTPException(500, "Encountered internal server error")

    return StreamingResponse(
        BytesIO(media["contents"]),
        media_type = media["content_type"],
        headers = {
            "Content-Disposition": f"inline; filename=\"{media['filename']}\""
        }
    )

@profiles_router.put("/me/avatar", tags = ["profiles"])
async def update_pfp(media_id: str, media: UploadFile = File(...), uuid: str = Depends(authorize)):
    try:
        updated = media_dao.update_media(media_id, media.filename, await media.read(), uuid, media.content_type)
    except Exception as e:
        raise HTTPException(500, "Encountered internal server error")
    
    if not updated:
        raise HTTPException(400, "Could not update profile picture")
    
    return {"detail": "Sucessfully updated profile picture"}
    
@profiles_router.delete("/me/avatar", tags = ["projects"])
async def delete_pfp(media_id: str, uuid: str = Depends(authorize)):
    try:
        deleted = await media_dao.delete_media(media_id)
    except Exception as e:
        raise HTTPException(500, "Encountered interal service error")
    
    if not deleted:
        raise HTTPException(500, "Unable to delete profile picture")
    
    return {"detail": "Sucessfully deleted profile picture"}