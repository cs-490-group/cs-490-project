from fastapi import APIRouter, Depends, HTTPException
from sessions.session_authorizer import authorize
from schema.ProfessionalReference import ProfessionalReference, ReferenceRequest, ReferencePreparation
from mongo.professional_references_dao import professional_references_dao

professional_references_router = APIRouter(prefix="/references")

@professional_references_router.post("", tags=["references"])
async def create_reference(reference: ProfessionalReference, uuid: str = Depends(authorize)):
    try:
        model = reference.model_dump()
        model["uuid"] = uuid
        result = await professional_references_dao.add_reference(model)
        return {"reference_id": result}
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.get("", tags=["references"])
async def get_all_references(uuid: str = Depends(authorize)):
    try:
        results = await professional_references_dao.get_all_references(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.get("/{reference_id}", tags=["references"])
async def get_reference(reference_id: str, uuid: str = Depends(authorize)):
    try:
        result = await professional_references_dao.get_reference(reference_id)
        if not result:
            raise HTTPException(404, "Reference not found")
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.put("/{reference_id}", tags=["references"])
async def update_reference(reference_id: str, reference: ProfessionalReference, uuid: str = Depends(authorize)):
    try:
        result = await professional_references_dao.update_reference(reference_id, reference.model_dump(exclude_unset=True))
        if result == 0:
            raise HTTPException(404, "Reference not found")
        return {"detail": "Reference updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.delete("/{reference_id}", tags=["references"])
async def delete_reference(reference_id: str, uuid: str = Depends(authorize)):
    try:
        result = await professional_references_dao.delete_reference(reference_id)
        if result == 0:
            raise HTTPException(404, "Reference not found")
        return {"detail": "Reference deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.get("/available", tags=["references"])
async def get_available_references(uuid: str = Depends(authorize)):
    try:
        results = await professional_references_dao.get_available_references(uuid)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.get("/company/{company}", tags=["references"])
async def get_references_by_company(company: str, uuid: str = Depends(authorize)):
    try:
        results = await professional_references_dao.get_references_by_company(uuid, company)
        return results
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.post("/{reference_id}/request", tags=["references"])
async def request_reference(reference_id: str, request: ReferenceRequest, uuid: str = Depends(authorize)):
    try:
        # Verify reference belongs to user
        reference = await professional_references_dao.get_reference(reference_id)
        if not reference or reference.get("uuid") != uuid:
            raise HTTPException(404, "Reference not found")
        
        # Add request to reference's usage history
        current_history = reference.get("usage_history", [])
        request_data = request.model_dump()
        current_history.append(request_data)
        
        # Update reference usage count and last used date
        current_count = reference.get("usage_count", 0)
        update_data = {
            "usage_history": current_history,
            "usage_count": current_count + 1,
            "last_used_date": request.request_date
        }
        
        result = await professional_references_dao.update_reference(reference_id, update_data)
        return {"detail": "Reference request added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.post("/{reference_id}/preparation", tags=["references"])
async def add_reference_preparation(reference_id: str, preparation: ReferencePreparation, uuid: str = Depends(authorize)):
    try:
        # Verify reference belongs to user
        reference = await professional_references_dao.get_reference(reference_id)
        if not reference or reference.get("uuid") != uuid:
            raise HTTPException(404, "Reference not found")
        
        # Add preparation to reference
        update_data = {"preparation_data": preparation.model_dump()}
        result = await professional_references_dao.update_reference(reference_id, update_data)
        return {"detail": "Reference preparation added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.put("/{reference_id}/feedback", tags=["references"])
async def update_reference_feedback(reference_id: str, feedback_data: dict, uuid: str = Depends(authorize)):
    try:
        # Verify reference belongs to user
        reference = await professional_references_dao.get_reference(reference_id)
        if not reference or reference.get("uuid") != uuid:
            raise HTTPException(404, "Reference not found")
        
        # Update reference with feedback
        update_data = {
            "feedback_received": feedback_data.get("feedback_received"),
            "reference_success_rate": feedback_data.get("reference_success_rate")
        }
        
        result = await professional_references_dao.update_reference(reference_id, update_data)
        return {"detail": "Reference feedback updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@professional_references_router.post("/{reference_id}/thank-you", tags=["references"])
async def mark_thank_you_sent(reference_id: str, thank_you_data: dict, uuid: str = Depends(authorize)):
    try:
        # Verify reference belongs to user
        reference = await professional_references_dao.get_reference(reference_id)
        if not reference or reference.get("uuid") != uuid:
            raise HTTPException(404, "Reference not found")
        
        # Update reference with thank you information
        update_data = {
            "thank_you_sent": True,
            "last_thank_you_date": thank_you_data.get("thank_you_date")
        }
        
        result = await professional_references_dao.update_reference(reference_id, update_data)
        return {"detail": "Thank you status updated successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
