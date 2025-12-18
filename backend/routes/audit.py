from fastapi import APIRouter, HTTPException, Depends, Request
from sessions.session_authorizer import authorize
from mongo.audit_dao import audit_dao
from mongo.organizations_dao import organization_dao
from schema.audit import AuditLog

audit_router = APIRouter(prefix="/enterprise/audit")

@audit_router.get("/{org_id}", tags=["enterprise"])
async def get_audit_trail(
    org_id: str, 
    action: str = None,
    uuid: str = Depends(authorize)
):
    """
    Get compliance logs for the organization.
    Strictly limited to Org Admins.
    """
    # 1. Security Check
    org = await organization_dao.get_organization(org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
        
    # Ensure user is an admin of THIS org
    if uuid not in org.get("admin_ids", []):
        # Log this unauthorized attempt!
        await audit_dao.log_event({
            "actor_id": uuid,
            "actor_name": "Unknown",
            "action": "UNAUTHORIZED_ACCESS_ATTEMPT",
            "target_id": "audit_logs",
            "organization_id": org_id,
            "details": {"endpoint": "get_audit_trail"}
        })
        raise HTTPException(403, "Access Denied")

    # 2. Fetch Logs
    logs = await audit_dao.get_org_logs(org_id, limit=200, action_filter=action)
    
    return logs