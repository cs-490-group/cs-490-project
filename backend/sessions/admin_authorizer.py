from fastapi import Depends, HTTPException
from sessions.session_authorizer import authorize
from mongo.profiles_dao import profiles_dao

async def authorize_admin(uuid: str = Depends(authorize)):
    """
    Authorize a request for admin-only endpoints
    First validates session using authorize(), then checks admin tier
    Returns the uuid if user is admin, raises 403 if not
    """
    # Check if user has admin tier
    is_admin = await profiles_dao.is_admin(uuid)

    if not is_admin:
        print(f"[AdminAuthorize] Access denied for uuid={uuid} - not an admin")
        raise HTTPException(403, "Admin access required")

    print(f"[AdminAuthorize] Admin access granted for uuid={uuid}")
    return uuid
