from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.Referral import ReferralRequest, ReferralOutcome
from mongo.referrals_dao import referrals_dao

referrals_router = APIRouter(prefix="/referrals")

@referrals_router.post("", tags=["referrals"])
async def create_referral_request(referral: ReferralRequest, uuid: str = Depends(authorize)):
    try:
        model = referral.model_dump()
        model["uuid"] = uuid
        result = await referrals_dao.add_referral(model)
        return {"referral_id": result}
    except Exception as e:
        raise HTTPException(500, str(e))

@referrals_router.get("", tags=["referrals"])
async def get_all_referrals(uuid: str = Depends(authorize)):
    try:
        results = await referrals_dao.get_all_referrals(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@referrals_router.get("/{referral_id}", tags=["referrals"])
async def get_referral(referral_id: str, uuid: str = Depends(authorize)):
    try:
        result = await referrals_dao.get_referral(referral_id)
        if not result:
            raise HTTPException(404, "Referral not found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@referrals_router.put("/{referral_id}", tags=["referrals"])
async def update_referral(referral_id: str, referral: ReferralRequest, uuid: str = Depends(authorize)):
    try:
        result = await referrals_dao.update_referral(referral_id, referral.model_dump(exclude_unset=True))
        if result == 0:
            raise HTTPException(404, "Referral not found")
        return {"detail": "Referral updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@referrals_router.delete("/{referral_id}", tags=["referrals"])
async def delete_referral(referral_id: str, uuid: str = Depends(authorize)):
    try:
        result = await referrals_dao.delete_referral(referral_id)
        if result == 0:
            raise HTTPException(404, "Referral not found")
        return {"detail": "Referral deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@referrals_router.get("/status/{status}", tags=["referrals"])
async def get_referrals_by_status(status: str, uuid: str = Depends(authorize)):
    try:
        results = await referrals_dao.get_referrals_by_status(uuid, status)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@referrals_router.get("/contact/{contact_id}", tags=["referrals"])
async def get_referrals_by_contact(contact_id: str, uuid: str = Depends(authorize)):
    try:
        results = await referrals_dao.get_referrals_by_contact(uuid, contact_id)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@referrals_router.post("/{referral_id}/outcome", tags=["referrals"])
async def record_referral_outcome(referral_id: str, outcome: ReferralOutcome, uuid: str = Depends(authorize)):
    try:
        # Update the referral with outcome information
        update_data = {
            "referral_success": outcome.outcome,
            "outcome_date": outcome.outcome_date,
            "feedback_received": outcome.feedback_received,
            "relationship_maintained": outcome.relationship_maintained,
            "reciprocity_opportunity": outcome.reciprocity_opportunity
        }
        result = await referrals_dao.update_referral(referral_id, update_data)
        if result == 0:
            raise HTTPException(404, "Referral not found")
        return {"detail": "Referral outcome recorded successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
