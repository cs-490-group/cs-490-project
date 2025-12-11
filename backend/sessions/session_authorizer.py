from fastapi import Header, HTTPException
from sessions.session_manager import session_manager

async def authorize(uuid: str = Header(None), authorization: str = Header(None)):
    """
    Authorize a request using uuid and authorization headers
    Returns the uuid if valid, raises HTTPException if invalid
    """
    # Check if headers are present
    if not uuid:
        print("[Authorize] Missing uuid header")
        raise HTTPException(401, "Missing uuid header")

    if not authorization:
        print("[Authorize] Missing authorization header")
        raise HTTPException(401, "Missing authorization header")

    # Validate authorization header format
    if not authorization.startswith("Bearer "):
        print(f"[Authorize] Invalid authorization format: {authorization[:20]}")
        raise HTTPException(401, "Invalid authorization format - expected 'Bearer <token>'")

    # Extract token
    token = authorization.removeprefix("Bearer ").strip()

    # Authenticate session
    if session_manager.authenticate_session(uuid, token):
        print(f"[Authorize] Session authenticated for uuid={uuid}")
        return uuid
    else:
        print(f"[Authorize] Session authentication failed for uuid={uuid}")
        raise HTTPException(401, "Invalid session")