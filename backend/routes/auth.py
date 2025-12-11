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
from bson import ObjectId

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
        raise HTTPException(500, str(e))
    
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
        raise HTTPException(500, str(e))
    
    # Create user as a contact in the global network
    try:
        from mongo.network_dao import networks_dao
        contact_data = {
            "name": info.username,
            "email": info.email.lower(),
            "uuid": uuid,
            "relationship_to_owner": "self"
        }
        await networks_dao.add_contact(contact_data)
    except Exception as e:
        # Non-critical error - user registration should succeed even if contact creation fails
        print(f"Warning: Could not create contact for new user: {e}")

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
        raise HTTPException(500, str(e))
    
    if not pass_hash:
        raise HTTPException(401, "Invalid email or password.")
    
    if bcrypt.checkpw(credentials.password.encode("utf-8"), pass_hash.encode("utf-8")):
        # Ensure user has a contact card
        try:
            from mongo.network_dao import networks_dao
            existing_contacts = await networks_dao.get_all_contacts(uuid)
            
            if not existing_contacts or len(existing_contacts) == 0:
                # Try to find existing contact by email using direct collection access
                contact_collection = networks_dao.collection
                matching_contact = await contact_collection.find_one({"email": credentials.email.lower()})
                
                if matching_contact:
                    # Link existing contact to this user
                    contact_id = str(matching_contact["_id"])
                    associated_users = matching_contact.get("associated_users", [])
                    
                    # Check if user is already associated
                    user_already_associated = any(
                        user.get("uuid") == uuid for user in associated_users
                    )
                    
                    if not user_already_associated:
                        # Add user to associated_users array
                        await contact_collection.update_one(
                            {"_id": ObjectId(contact_id)},
                            {
                                "$push": {
                                    "associated_users": {
                                        "uuid": uuid,
                                        "relationship_to_owner": "self",
                                        "date_added": datetime.now(timezone.utc).isoformat()
                                    }
                                }
                            }
                        )
                else:
                    # Create new contact card
                    print(f"Regular Login: Creating new contact for email {credentials.email.lower()}")
                    # Get user profile data for contact creation
                    user_profile = await profiles_dao.get_profile(uuid)
                    
                    # Create new contact card with profile data
                    contact_data = {
                        "name": user_profile.get("full_name", credentials.email.split("@")[0]),
                        "email": credentials.email.lower(),
                        "phone_numbers": {
                            "primary": user_profile.get("phone_number")
                        } if user_profile.get("phone_number") else None,
                        "employment": {
                            "position": user_profile.get("title"),
                            "company": None  # Could be extracted from email domain
                        } if user_profile.get("title") else None,
                        "industry": user_profile.get("industry"),
                        "notes": user_profile.get("biography"),
                        "associated_users": [{
                            "uuid": uuid,
                            "relationship_to_owner": "self",
                            "date_added": datetime.now(timezone.utc).isoformat()
                        }]
                    }
                    # Remove None values to keep contact clean
                    contact_data = {k: v for k, v in contact_data.items() if v is not None}
                    await networks_dao.add_contact(contact_data)
                    print(f"Regular Login: Created new contact")
        except Exception as e:
            # Non-critical error - login should succeed even if contact creation fails
            print(f"Warning: Could not ensure contact for user {uuid}: {e}")
        
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

        idinfo = id_token.verify_oauth2_token(credentials, requests.Request())

        data = await auth_dao.get_uuid(idinfo["email"])
        pass_exists = None

        if (data):
            uuid = data
            pass_exists = await auth_dao.get_password_by_uuid(uuid)
        else:
            uuid = str(uuid4())
            idinfo["username"] = idinfo["email"]
            await auth_dao.add_user(uuid,idinfo)
            await profiles_dao.add_profile(uuid, idinfo)
            image = Requests.get(idinfo.get("picture"))
            await media_dao.add_media(uuid,idinfo.get("picture"),image.content,content_type="image/jpeg")
        
        # Ensure user has a contact card (for both new and existing users)
        try:
            from mongo.network_dao import networks_dao
            print(f"Google OAuth: Checking contacts for user {uuid}")
            existing_contacts = await networks_dao.get_all_contacts(uuid)
            print(f"Google OAuth: Found {len(existing_contacts) if existing_contacts else 0} existing contacts")
            
            # Check if user has their own contact (relationship_to_owner: "self")
            has_self_contact = False
            if existing_contacts:
                for contact in existing_contacts:
                    associated_users = contact.get("associated_users", [])
                    user_association = next((user for user in associated_users if user.get("uuid") == uuid), None)
                    if user_association and user_association.get("relationship_to_owner") == "self":
                        has_self_contact = True
                        print(f"Google OAuth: User already has self contact")
                        break
            
            if not has_self_contact:
                print(f"Google OAuth: No self contact found, searching for email {idinfo['email'].lower()}")
                # Try to find existing contact by email using direct collection access
                contact_collection = networks_dao.collection
                matching_contact = await contact_collection.find_one({"email": idinfo["email"].lower()})
                print(f"Google OAuth: Matching contact found: {matching_contact is not None}")
                
                if matching_contact:
                    print(f"Google OAuth: Linking to existing contact {matching_contact['_id']}")
                    # Link existing contact to this user
                    contact_id = str(matching_contact["_id"])
                    associated_users = matching_contact.get("associated_users", [])
                    
                    # Check if user is already associated
                    user_already_associated = any(
                        user.get("uuid") == uuid for user in associated_users
                    )
                    print(f"Google OAuth: User already associated: {user_already_associated}")
                    
                    if not user_already_associated:
                        # Add user to associated_users array
                        await contact_collection.update_one(
                            {"_id": ObjectId(contact_id)},
                            {
                                "$push": {
                                    "associated_users": {
                                        "uuid": uuid,
                                        "relationship_to_owner": "self",
                                        "date_added": datetime.now(timezone.utc).isoformat()
                                    }
                                }
                            }
                        )
                        print(f"Google OAuth: Successfully linked user to existing contact")
                else:
                    print(f"Google OAuth: Creating new contact for email {idinfo['email'].lower()}")
                    # Get user profile data for contact creation
                    user_profile = await profiles_dao.get_profile(uuid)
                    
                    # Create new contact card with profile data
                    contact_data = {
                        "name": idinfo.get("name", user_profile.get("full_name", idinfo["email"].split("@")[0])),
                        "email": idinfo["email"].lower(),
                        "phone_numbers": {
                            "primary": user_profile.get("phone_number")
                        } if user_profile.get("phone_number") else None,
                        "websites": {
                            "linkedin": idinfo.get("sub")  # Google sub is unique identifier
                        } if idinfo.get("sub") else None,
                        "employment": {
                            "position": user_profile.get("title"),
                            "company": None  # Could be extracted from email domain
                        } if user_profile.get("title") else None,
                        "industry": user_profile.get("industry"),
                        "notes": user_profile.get("biography"),
                        "associated_users": [{
                            "uuid": uuid,
                            "relationship_to_owner": "self",
                            "date_added": datetime.now(timezone.utc).isoformat()
                        }]
                    }
                    # Remove None values to keep contact clean
                    contact_data = {k: v for k, v in contact_data.items() if v is not None}
                    result = await networks_dao.add_contact(contact_data)
                    print(f"Google OAuth: Created new contact with ID: {result}")
            else:
                print(f"Google OAuth: User already has self contact, skipping creation")
        except Exception as e:
            # Non-critical error - login should succeed even if contact creation fails
            print(f"ERROR: Could not ensure contact for OAuth user {uuid}: {e}")
            import traceback
            traceback.print_exc()
        
        session_token = session_manager.begin_session(uuid)
        print("here is it")
        print(data != None and pass_exists)

        return {
            "detail": "success",
            "uuid": uuid,
            "email": idinfo["email"],  
            "session_token": session_token,
            "has_password": data != None and pass_exists,
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
        
        # Ensure user has a contact card (for both new and existing users)
        try:
            from mongo.network_dao import networks_dao
            existing_contacts = await networks_dao.get_all_contacts(uuid)
            
            if not existing_contacts or len(existing_contacts) == 0:
                # Try to find existing contact by email using direct collection access
                contact_collection = networks_dao.collection
                matching_contact = await contact_collection.find_one({"email": email.lower()})
                
                if matching_contact:
                    # Link existing contact to this user
                    contact_id = str(matching_contact["_id"])
                    associated_users = matching_contact.get("associated_users", [])
                    
                    # Check if user is already associated
                    user_already_associated = any(
                        user.get("uuid") == uuid for user in associated_users
                    )
                    
                    if not user_already_associated:
                        # Add user to associated_users array
                        await contact_collection.update_one(
                            {"_id": ObjectId(contact_id)},
                            {
                                "$push": {
                                    "associated_users": {
                                        "uuid": uuid,
                                        "relationship_to_owner": "self",
                                        "date_added": datetime.now(timezone.utc).isoformat()
                                    }
                                }
                            }
                        )
                else:
                    print(f"Microsoft OAuth: Creating new contact for email {email.lower()}")
                    # Get user profile data for contact creation
                    user_profile = await profiles_dao.get_profile(uuid)
                    
                    # Create new contact card with profile data
                    contact_data = {
                        "name": claims.get("name", user_profile.get("full_name", email.split("@")[0])),
                        "email": email.lower(),
                        "phone_numbers": {
                            "primary": user_profile.get("phone_number")
                        } if user_profile.get("phone_number") else None,
                        "websites": {
                            "linkedin": claims.get("sub")  # Microsoft sub is unique identifier
                        } if claims.get("sub") else None,
                        "employment": {
                            "position": user_profile.get("title"),
                            "company": None  # Could be extracted from email domain
                        } if user_profile.get("title") else None,
                        "industry": user_profile.get("industry"),
                        "notes": user_profile.get("biography"),
                        "associated_users": [{
                            "uuid": uuid,
                            "relationship_to_owner": "self",
                            "date_added": datetime.now(timezone.utc).isoformat()
                        }]
                    }
                    # Remove None values to keep contact clean
                    contact_data = {k: v for k, v in contact_data.items() if v is not None}
                    await networks_dao.add_contact(contact_data)
                    print(f"Microsoft OAuth: Created new contact")
        except Exception as e:
            # Non-critical error - login should succeed even if contact creation fails
            print(f"Warning: Could not ensure contact for Microsoft user {uuid}: {e}")
    
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
async def verify_linkedin_token(request: Request):
    LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
    
    data = await request.json()
    code = data.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    # Exchange authorization code for access token
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
            print(f"LinkedIn OAuth Error - Status: {token_response.status_code}")
            print(f"LinkedIn OAuth Error - Response: {token_response.text}")
            print(f"LinkedIn OAuth Error - Data sent: {token_data}")
            raise HTTPException(status_code=400, detail=f"Failed to exchange code for token: {token_response.text}")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
    
    # Get user profile from LinkedIn OpenID Connect
    # LinkedIn OpenID Connect provides user info directly in the token response
    # or we can use the userinfo endpoint
    userinfo_url = "https://api.linkedin.com/v2/userinfo"
    headers = {
        "Authorization": f"Bearer {access_token}",
    }
    
    async with httpx.AsyncClient() as client:
        userinfo_response = await client.get(userinfo_url, headers=headers)
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch LinkedIn user info")
        
        user_info = userinfo_response.json()
        print(f"LinkedIn OAuth: Raw user info received: {user_info}")
    
    # Extract user information from OpenID Connect response
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in LinkedIn response")
    
    # Extract name from OpenID Connect response
    name = user_info.get("name", "")
    given_name = user_info.get("given_name", "")
    family_name = user_info.get("family_name", "")
    
    # Fallback parsing if name is not provided
    if not name and (given_name or family_name):
        name = f"{given_name} {family_name}".strip()
    
    # Extract other useful fields
    sub = user_info.get("sub", "")  # LinkedIn user ID
    picture = user_info.get("picture")  # Profile picture URL
    
    print(f"LinkedIn OAuth: Extracted data - email: {email}, name: {name}, picture: {picture}")
    
    linkedin_data = {
        "email": email,
        "username": email.split("@")[0],  # Use email username (minus domain)
        "full_name": name,
        "first_name": given_name,
        "last_name": family_name,
        "linkedin_id": sub,
        "picture": picture,
    }
    
    # Check if user exists
    existing_user = await auth_dao.get_uuid(email)
    pass_exists = None
    
    if existing_user:
        uuid = existing_user
        pass_exists = await auth_dao.get_password_by_uuid(uuid)
    else:
        uuid = str(uuid4())
        user_data = {
            "email": email,
            "username": email.split("@")[0],  # Use email username (minus domain)
            "password": "",  # No password for LinkedIn users
        }
        await auth_dao.add_user(uuid, user_data)
        
        existing_profile = await profiles_dao.get_profile(uuid)
        if not existing_profile:
            print(f"LinkedIn OAuth: Creating new profile with data: {linkedin_data}")
            await profiles_dao.add_profile(uuid, linkedin_data)
            
            # Download and store profile picture if available
            if picture:
                try:
                    print(f"LinkedIn OAuth: Downloading profile picture from {picture}")
                    image_response = Requests.get(picture)
                    if image_response.status_code == 200:
                        await media_dao.add_media(uuid, picture, image_response.content, content_type="image/jpeg")
                        print(f"LinkedIn OAuth: Successfully stored profile picture")
                    else:
                        print(f"LinkedIn OAuth: Failed to download profile picture, status: {image_response.status_code}")
                except Exception as e:
                    print(f"LinkedIn OAuth: Error downloading profile picture: {e}")
        else:
            print(f"LinkedIn OAuth: User already has profile, skipping creation")
        
        # Ensure user has a contact card (for both new and existing users)
        try:
            from mongo.network_dao import networks_dao
            existing_contacts = await networks_dao.get_all_contacts(uuid)
            
            if not existing_contacts or len(existing_contacts) == 0:
                # Try to find existing contact by email using direct collection access
                contact_collection = networks_dao.collection
                matching_contact = await contact_collection.find_one({"email": email.lower()})
                
                if matching_contact:
                    # Link existing contact to this user
                    contact_id = str(matching_contact["_id"])
                    associated_users = matching_contact.get("associated_users", [])
                    
                    # Check if user is already associated
                    user_already_associated = any(
                        user.get("uuid") == uuid for user in associated_users
                    )
                    
                    if not user_already_associated:
                        # Add user to associated_users array
                        await contact_collection.update_one(
                            {"_id": ObjectId(contact_id)},
                            {
                                "$push": {
                                    "associated_users": {
                                        "uuid": uuid,
                                        "relationship_to_owner": "self",
                                        "date_added": datetime.now(timezone.utc).isoformat()
                                    }
                                }
                            }
                        )
                else:
                    print(f"LinkedIn OAuth: Creating new contact for email {email.lower()}")
                    # Get user profile data for contact creation
                    user_profile = await profiles_dao.get_profile(uuid)
                    
                    # Create new contact card with profile data
                    contact_data = {
                        "name": name or user_profile.get("full_name", email.split("@")[0]),
                        "email": email.lower(),
                        "phone_numbers": {
                            "primary": user_profile.get("phone_number")
                        } if user_profile.get("phone_number") else None,
                        "websites": {
                            "linkedin": sub  # LinkedIn sub is unique identifier
                        } if sub else None,
                        "employment": {
                            "position": user_profile.get("title"),
                            "company": None  # Could be extracted from email domain
                        } if user_profile.get("title") else None,
                        "industry": user_profile.get("industry"),
                        "notes": user_profile.get("biography"),
                        "associated_users": [{
                            "uuid": uuid,
                            "relationship_to_owner": "self",
                            "date_added": datetime.now(timezone.utc).isoformat()
                        }]
                    }
                    # Remove None values to keep contact clean
                    contact_data = {k: v for k, v in contact_data.items() if v is not None}
                    await networks_dao.add_contact(contact_data)
                    print(f"LinkedIn OAuth: Created new contact")
        except Exception as e:
            # Non-critical error - login should succeed even if contact creation fails
            print(f"Warning: Could not ensure contact for LinkedIn user {uuid}: {e}")
    
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
