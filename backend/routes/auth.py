from fastapi import APIRouter, Body, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from pymongo.errors import DuplicateKeyError

from uuid import uuid4
import bcrypt
from datetime import datetime, timezone
import requests as Requests

from google.oauth2 import id_token
from google.auth.transport import requests
from google.auth.exceptions import GoogleAuthError

from mongo.auth_dao import auth_dao
from mongo.profiles_dao import profiles_dao
from mongo.media_dao import media_dao
from mongo.forgotPassword import ForgotPassword
from sessions.session_manager import session_manager
from sessions.session_authorizer import authorize
from schema.Auth import RegistInfo, LoginCred
from schema.Profile import Profile

import httpx
from jose import jwt, JWTError
import os
from bson import ObjectId
import asyncio

RATE_LIMITING_ENABLED = os.getenv("RATE_LIMITING_ENABLED", "true").lower() == "true"

def conditional_limiter(limit_string):
    """Apply rate limit only if enabled"""
    def decorator(func):
        if RATE_LIMITING_ENABLED:
            return limiter.limit(limit_string)(func)
        return func
    return decorator

auth_router = APIRouter(prefix = "/auth")
limiter = Limiter(key_func=get_remote_address)

# ===== BACKGROUND TASK: Move contact creation out of login =====
async def ensure_user_contact(uuid: str, email: str, user_profile: dict = None):
    """Background task to ensure user has a contact card - NON-BLOCKING"""
    try:
        from mongo.network_dao import networks_dao
        
        # Skip if contact already exists
        existing_contacts = await networks_dao.get_all_contacts(uuid)
        if existing_contacts:
            return
        
        contact_collection = networks_dao.collection
        matching_contact = await contact_collection.find_one({"email": email.lower()})
        
        if matching_contact:
            # Link to existing contact
            associated_users = matching_contact.get("associated_users", [])
            if not any(user.get("uuid") == uuid for user in associated_users):
                await contact_collection.update_one(
                    {"_id": ObjectId(str(matching_contact["_id"]))},
                    {"$push": {"associated_users": {
                        "uuid": uuid,
                        "relationship_to_owner": "self",
                        "date_added": datetime.now(timezone.utc).isoformat()
                    }}}
                )
        else:
            # Create new contact
            if not user_profile:
                user_profile = await profiles_dao.get_profile(uuid) or {}
            
            contact_data = {
                "name": user_profile.get("full_name", email.split("@")[0]),
                "email": email.lower(),
                "phone_numbers": {"primary": user_profile.get("phone_number")} if user_profile.get("phone_number") else None,
                "employment": {"position": user_profile.get("title"), "company": None} if user_profile.get("title") else None,
                "industry": user_profile.get("industry"),
                "notes": user_profile.get("biography"),
                "associated_users": [{
                    "uuid": uuid,
                    "relationship_to_owner": "self",
                    "date_added": datetime.now(timezone.utc).isoformat()
                }]
            }
            contact_data = {k: v for k, v in contact_data.items() if v is not None}
            await networks_dao.add_contact(contact_data)
    except Exception as e:
        print(f"Warning: Could not ensure contact for user {uuid}: {e}")


@auth_router.post("/register", tags = ["profiles"])
@conditional_limiter("5/minute")
async def register(request: Request, info: RegistInfo, background_tasks: BackgroundTasks):
    uuid = str(uuid4())
    pass_hash = bcrypt.hashpw(info.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    try:
        result = await auth_dao.add_user(uuid, {"email": info.email.lower(), "username": info.username, "password": pass_hash})
    except DuplicateKeyError:
        raise HTTPException(400, "User already exists")
    except Exception as e:
        raise HTTPException(500, str(e))
    
    try:
        data = info.model_dump()
        data.pop("password")
        profile = Profile.model_construct(**data)
        await profiles_dao.add_profile(uuid, profile.model_dump())
    except DuplicateKeyError:
        raise HTTPException(400, "User profile already exists")
    except Exception as e:
        raise HTTPException(500, str(e))
    
    # Queue contact creation as background task - DON'T BLOCK LOGIN
    background_tasks.add_task(ensure_user_contact, uuid, info.email.lower())
    
    session_token = session_manager.begin_session(uuid)
    return {"detail": "Sucessfully registered user", "uuid": uuid, "session_token": session_token}


@auth_router.post("/login", tags = ["profiles"])
@conditional_limiter("5/minute")
async def login(request: Request, credentials: LoginCred, background_tasks: BackgroundTasks):
    try:
        pass_hash = await auth_dao.get_password(credentials.email.lower())
        uuid = await auth_dao.get_uuid(credentials.email.lower())
    except Exception as e:
        raise HTTPException(500, str(e))
    
    if not pass_hash:
        raise HTTPException(401, "Invalid email or password.")
    
    # Password check is fast, keep it in request
    if bcrypt.checkpw(credentials.password.encode("utf-8"), pass_hash.encode("utf-8")):
        # Queue contact sync as background task - FAST LOGIN
        background_tasks.add_task(ensure_user_contact, uuid, credentials.email.lower())
        
        session_token = session_manager.begin_session(uuid)
        return {"detail": "Successfully logged in", "uuid": uuid, "session_token": session_token}
    else:
        raise HTTPException(401, "Invalid email or password.")


@auth_router.post("/logout", tags = ["profiles"])
async def logout(uuid: str = Depends(authorize)):
    if session_manager.kill_session(uuid):
        return {"detail": "Successfully logged out"}
    else:
        raise HTTPException(400, "Session not found")


@auth_router.post("/validate-session")
async def validate_session(uuid: str = Depends(authorize)):
    return {"detail": "Successfully validated session"}


@auth_router.post("/password/forgot", tags = ["profiles"])
async def forgot_password(email: str = Body(..., embed=True)):
    exists = await auth_dao.get_uuid(email.lower())
    try:
        if exists:
            fp = ForgotPassword()
            token = fp.send_email(email.lower())
            uuid = str(uuid4())
            await fp.store_link(uuid, email.lower(), token)
            return True
    except Exception as e:
        print(e)
        return None
    
    
@auth_router.get("/password/reset", tags = ["profiles"])
async def reset_password(token: str):
    fp = ForgotPassword()
    uuid, expires = await fp.verify_link(token)
    try:
        if uuid:
            return JSONResponse(status_code=200, content={"uuid": uuid})
    except Exception as e:
        print(e)
        return None
    

@auth_router.put("/password/update", tags = ["profiles"])
async def update_password(token: str = Body(...), password: str = Body(...), old_token: str = Body(...)):
    try:
        old_data = await profiles_dao.get_profile(token) or {}
        old_data["password"] = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        await auth_dao.update_password(token, old_data)
        fp = ForgotPassword()
        await fp.delete_link(old_token)
        session_token = session_manager.begin_session(token)
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Something went wrong {str(e)}"})
    return JSONResponse(status_code=200, content={"detail": "Sucessful Registration", "uuid": token, "session_token": session_token})


@auth_router.post("/login/google", tags = ["profiles"])
async def verify_google_token(token: dict = Body(...), background_tasks: BackgroundTasks= None):
    credentials = token.get("credential")
    try:
        idinfo = id_token.verify_oauth2_token(credentials, requests.Request())
        data = await auth_dao.get_uuid(idinfo["email"])
        pass_exists = None

        if data:
            uuid = data
            pass_exists = await auth_dao.get_password_by_uuid(uuid)
        else:
            uuid = str(uuid4())
            idinfo["username"] = idinfo["email"]
            await auth_dao.add_user(uuid, idinfo)
            await profiles_dao.add_profile(uuid, idinfo)
            
            # Download image asynchronously in background
            try:
                image = Requests.get(idinfo.get("picture"))
                await media_dao.add_media(uuid, idinfo.get("picture"), image.content, content_type="image/jpeg")
            except:
                pass
        
        # Queue contact sync as background task
        background_tasks.add_task(ensure_user_contact, uuid, idinfo["email"].lower(), idinfo)
        
        session_token = session_manager.begin_session(uuid)
        return {
            "detail": "success",
            "uuid": uuid,
            "email": idinfo["email"],  
            "session_token": session_token,
            "has_password": data != None and pass_exists,
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="invalid token")
    except GoogleAuthError as e:
        raise HTTPException(status_code=401, detail=f"Google auth failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unknown Error while authenticating: {str(e)}")


@auth_router.put("/login/microsoft", tags=["profiles"])
async def verify_microsoft_token(request: Request, background_tasks: BackgroundTasks):
    MICROSOFT_ISSUER = os.getenv("MICROSOFT_ISSUER")
    MICROSOFT_KEYS_URL = os.getenv("MICROSOFT_KEYS_URL")
    MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")

    data = await request.json()
    token = data.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    async with httpx.AsyncClient() as client:
        jwks_resp = await client.get(MICROSOFT_KEYS_URL)
        if jwks_resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Could not fetch Microsoft keys")
        jwks = jwks_resp.json()

    try:
        header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
        if not key:
            raise HTTPException(status_code=400, detail="Key not found")

        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=MICROSOFT_CLIENT_ID,
            issuer=MICROSOFT_ISSUER,
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    email = claims.get("email") or claims.get("preferred_username")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in token")

    claims["username"] = email
    existing_user = await auth_dao.get_uuid(email)
    pass_exists = None

    if existing_user:
        uuid = existing_user
        pass_exists = await auth_dao.get_password_by_uuid(uuid)
    else:
        uuid = str(uuid4())
        user_data = {
            "email": email,
            "username": email,
            "password": "",
        }
        await auth_dao.add_user(uuid, user_data)
        existing_profile = await profiles_dao.get_profile(uuid)
        if not existing_profile:
            await profiles_dao.add_profile(uuid, claims)
    
    # Queue contact sync as background task
    background_tasks.add_task(ensure_user_contact, uuid, email.lower(), claims)
    session_token = session_manager.begin_session(uuid)

    return JSONResponse(
        status_code=200,
        content={
            "detail": "success",
            "uuid": uuid,
            "email": email,  
            "session_token": session_token,
            "has_password": existing_user != None and pass_exists
        },
    )


@auth_router.post("/login/linkedin", tags=["profiles"])
async def verify_linkedin_token(request: Request, background_tasks: BackgroundTasks):
    LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
    
    data = await request.json()
    code = data.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:3000/callback/linkedin"),
        "client_id": LINKEDIN_CLIENT_ID,
        "client_secret": LINKEDIN_CLIENT_SECRET,
    }
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange code for token: {token_response.text}")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
    
    userinfo_url = "https://api.linkedin.com/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient() as client:
        userinfo_response = await client.get(userinfo_url, headers=headers)
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch LinkedIn user info")
        user_info = userinfo_response.json()
    
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in LinkedIn response")
    
    name = user_info.get("name", "")
    given_name = user_info.get("given_name", "")
    family_name = user_info.get("family_name", "")
    
    if not name and (given_name or family_name):
        name = f"{given_name} {family_name}".strip()
    
    sub = user_info.get("sub", "")
    picture = user_info.get("picture")
    
    linkedin_data = {
        "email": email,
        "username": email.split("@")[0],
        "full_name": name,
        "first_name": given_name,
        "last_name": family_name,
        "linkedin_id": sub,
        "picture": picture,
    }
    
    existing_user = await auth_dao.get_uuid(email)
    pass_exists = None
    
    if existing_user:
        uuid = existing_user
        pass_exists = await auth_dao.get_password_by_uuid(uuid)
    else:
        uuid = str(uuid4())
        user_data = {
            "email": email,
            "username": email.split("@")[0],
            "password": "",
        }
        await auth_dao.add_user(uuid, user_data)
        existing_profile = await profiles_dao.get_profile(uuid)
        if not existing_profile:
            await profiles_dao.add_profile(uuid, linkedin_data)
            
            # Download picture in background if needed
            if picture:
                background_tasks.add_task(_download_profile_picture, uuid, picture)
    
    # Queue contact sync as background task
    background_tasks.add_task(ensure_user_contact, uuid, email.lower(), linkedin_data)
    session_token = session_manager.begin_session(uuid)
    
    return JSONResponse(
        status_code=200,
        content={
            "detail": "success",
            "uuid": uuid,
            "email": email,
            "session_token": session_token,
            "has_password": existing_user != None and pass_exists
        },
    )


# Helper to download images in background
async def _download_profile_picture(uuid: str, picture_url: str):
    try:
        image_response = Requests.get(picture_url)
        if image_response.status_code == 200:
            await media_dao.add_media(uuid, picture_url, image_response.content, content_type="image/jpeg")
    except Exception as e:
        print(f"Warning: Could not download profile picture: {e}")