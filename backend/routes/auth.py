from fastapi import APIRouter, Body, Depends, HTTPException,Request
from fastapi.responses import JSONResponse

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

auth_router = APIRouter(prefix = "/auth")

@auth_router.post("/register", tags = ["profiles"])
async def register(info: RegistInfo):
    # Authentication
    try:
        uuid = str(uuid4())
        pass_hash = bcrypt.hashpw(info.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        result = await auth_dao.add_user(uuid, {"email": info.email.lower(), "username": info.username, "password": pass_hash})
        print(result)
    except DuplicateKeyError:
        raise HTTPException(400, "User already exists")
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")
    
    # User Profile
    try:
        time = datetime.now(timezone.utc)

        data = info.model_dump()
        data.pop("password")
        profile = Profile.model_construct(**data)

        await profiles_dao.add_profile(uuid, profile.model_dump())
    except DuplicateKeyError:
        raise HTTPException(400, "User profile already exists")
    except Exception as e:
        raise HTTPException(500, "Encountered internal service error")

    # Begin Session
    session_token = session_manager.begin_session(uuid)

    return {"detail": "Sucessfully registered user", "uuid": uuid, "session_token": session_token}

@auth_router.post("/login", tags = ["profiles"])
async def login(credentials: LoginCred):
    # Authentication (for real this time)
    try:
        pass_hash = await auth_dao.get_password(credentials.email.lower())

        # Get uuid via associated email
        uuid = await auth_dao.get_uuid(credentials.email.lower())
    except Exception as e:
        raise HTTPException(500, "Encountered internal server error")
    
    if not pass_hash:
        raise HTTPException(401, "Invalid email or password.")
    
    if bcrypt.checkpw(credentials.password.encode("utf-8"), pass_hash.encode("utf-8")):
        # begin session
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
            fp = ForgotPassword() # ugly naming scheme fix later.
            token = fp.send_email(email.lower())
            uuid = str(uuid4())
            await fp.store_link(uuid,email.lower(),token)
            return True
    except Exception as e:
        print(e)
        return None
    
    
@auth_router.get("/password/reset", tags = ["profiles"])
async def reset_password(token: str):
    fp = ForgotPassword()
    print("IN HERE")
    print(token)
    uuid,expires = await fp.verify_link(token)
    print("OVER HERE")
    try:
        if (uuid):
            # if(datetime.now() < expires ): # The link is still valid.
            #     return JSONResponse(status_code = 200, content = {"uuid": uuid})
            print("VALID")
            return JSONResponse(status_code = 200, content = {"uuid": uuid})
    except Exception as e:
        print(e)
        return None
    

@auth_router.put("/password/update", tags = ["profiles"])
async def update_password(token: str = Body(...),password: str = Body(...), old_token: str=Body(...)):

    try:
        old_data = await profiles_dao.get_profile(token) or {}
        old_data["password"] = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        await auth_dao.update_password(token,old_data)
        fp = ForgotPassword()
        await fp.delete_link(old_token)
        print("OLDTOKEN")
        print(old_token)
        session_token = session_manager.begin_session(token)
    except Exception as e:

        return JSONResponse(status_code = 500, content = {"detail": f"Something went wrong {str(e)}"})
    return JSONResponse(status_code=200, content={"detail": "Sucessful Registration","uuid":token, "session_token": session_token})



@auth_router.post("/login/google", tags = ["profiles"])
async def verify_google_token(token: dict = Body(...)):

    credentials = token.get("credential")
    try:

        idinfo = id_token.verify_oauth2_token(credentials, requests.Request()) # returns user data such as email and profile picture

        data = await auth_dao.get_uuid(idinfo["email"]) # this returns a uuid
        pass_exists = None

        if (data): # if the user already exists, still log in because it doesn't matter.
            uuid = data
            pass_exists = await auth_dao.get_password_by_uuid(uuid)
        else:

            uuid = str(uuid4())
            idinfo["username"] = idinfo["email"]
            await auth_dao.add_user(uuid,idinfo)
            await profiles_dao.add_profile(uuid, idinfo)
            image = Requests.get(idinfo.get("picture"))
            await media_dao.add_media(uuid,idinfo.get("picture"),image.content,content_type="image/jpeg")
        
        session_token = session_manager.begin_session(uuid)
        print("here is it")
        print(data != None and pass_exists)


        return {
            "detail": "success",
            "uuid":uuid,
            "session_token": session_token,
            "has_password": data != None and pass_exists, #If the user's profile exists AND they have a password set...
        }

    except ValueError:
        raise HTTPException(status_code=400, detail = "invalid token")

    except GoogleAuthError as e:
        raise HTTPException(status_code=401, detail = f"Google auth failed: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail = f"Unknown Error while authenticating: {str(e)}")

@auth_router.put("/login/microsoft", tags=["profiles"])
async def verify_microsoft_token(request: Request):
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
        print(e)
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    email = claims.get("email") or claims.get("preferred_username")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in token")

    claims["username"] = email

    # Check if user exists in auth
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
            "password": "",  # No password for Microsoft users, yet.
        }
        await auth_dao.add_user(uuid, user_data)


        existing_profile = await profiles_dao.get_profile(uuid)
        if not existing_profile:
            await profiles_dao.add_profile(uuid, claims)

    session_token = session_manager.begin_session(uuid)

    return JSONResponse(
        status_code=200,
        content={"detail": "success", "uuid": uuid, "session_token": session_token,"has_password":existing_user!=None and pass_exists},
    )
