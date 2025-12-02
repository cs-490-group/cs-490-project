"""
Salary Negotiation and Offer Management Routes (UC-083)

Endpoints for:
- Managing job offers
- Generating salary negotiation preparation materials
- Tracking negotiation history and outcomes
- Downloading negotiation templates and guides
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.responses import StreamingResponse
from bson.objectid import ObjectId
from datetime import datetime
import json
from io import BytesIO

from mongo.offers_dao import OffersDAO
from mongo.jobs_dao import jobs_dao
from sessions.session_authorizer import authorize
from schema.Offer import (
    Offer, SalaryDetails, NegotiationPrep,
    NegotiationHistory, NegotiationOutcome
)
from services.salary_negotiation_service import generate_full_negotiation_prep
from services.pdf_export import export_negotiation_to_pdf, export_negotiation_to_docx

offers_router = APIRouter(prefix="/offers")

offers_dao = None

def set_offers_dao(dao: OffersDAO):
    """Set the DAO instance"""
    global offers_dao
    offers_dao = dao


# =============================================================================
# OFFER MANAGEMENT ENDPOINTS
# =============================================================================

@offers_router.post("", tags=["offers"])
async def create_offer(offer: Offer, uuid: str = Depends(authorize)):
    """Create a new job offer - UC-083"""
    try:
        offer_data = offer.model_dump()
        offer_data["uuid"] = uuid

        offer_id = await offers_dao.create_offer(offer_data, uuid)

        # Add offer ID to the associated job
        if offer.job_id:
            try:
                await jobs_dao.add_offer_to_job(offer.job_id, str(offer_id))
            except Exception as e:
                print(f"Warning: Could not link offer to job: {e}")

        return {"detail": "Offer created successfully", "offer_id": str(offer_id)}

    except Exception as e:
        print(f"Error creating offer: {e}")
        raise HTTPException(500, str(e))


@offers_router.get("/{offer_id}", tags=["offers"])
async def get_offer(offer_id: str, uuid: str = Depends(authorize)):
    """Get a specific offer by ID"""
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to view this offer")

        offer["_id"] = str(offer["_id"])
        return offer

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching offer: {e}")
        raise HTTPException(500, str(e))


@offers_router.get("", tags=["offers"])
async def get_user_offers(uuid: str = Depends(authorize)):
    """Get all offers for the current user"""
    try:
        offers = await offers_dao.get_user_offers(uuid)

        for offer in offers:
            offer["_id"] = str(offer["_id"])

        return offers

    except Exception as e:
        print(f"Error fetching offers: {e}")
        raise HTTPException(500, str(e))


@offers_router.get("/job/{job_id}", tags=["offers"])
async def get_offers_for_job(job_id: str, uuid: str = Depends(authorize)):
    """Get all offers for a specific job"""
    try:
        offers = await offers_dao.get_offers_for_job(job_id)

        user_offers = [o for o in offers if o["user_uuid"] == uuid]

        for offer in user_offers:
            offer["_id"] = str(offer["_id"])

        return user_offers

    except Exception as e:
        print(f"Error fetching job offers: {e}")
        raise HTTPException(500, str(e))


@offers_router.put("/{offer_id}", tags=["offers"])
async def update_offer(offer_id: str, offer: Offer, uuid: str = Depends(authorize)):
    """Update an existing offer"""
    try:
        existing = await offers_dao.get_offer(offer_id)

        if not existing:
            raise HTTPException(404, "Offer not found")

        if existing["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to update this offer")

        offer_data = offer.model_dump(exclude_unset=True)

        updated = await offers_dao.update_offer(offer_id, offer_data)

        if updated:
            updated["_id"] = str(updated["_id"])
            return updated
        else:
            raise HTTPException(500, "Failed to update offer")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating offer: {e}")
        raise HTTPException(500, str(e))


@offers_router.delete("/{offer_id}", tags=["offers"])
async def delete_offer(offer_id: str, uuid: str = Depends(authorize)):
    """Delete an offer"""
    try:
        existing = await offers_dao.get_offer(offer_id)

        if not existing:
            raise HTTPException(404, "Offer not found")

        if existing["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to delete this offer")

        success = await offers_dao.delete_offer(offer_id)

        if success:
            return {"detail": "Offer deleted successfully"}
        else:
            raise HTTPException(500, "Failed to delete offer")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting offer: {e}")
        raise HTTPException(500, str(e))


# =============================================================================
# SALARY NEGOTIATION PREPARATION ENDPOINTS
# =============================================================================

@offers_router.post("/{offer_id}/generate-negotiation-prep", tags=["offers", "negotiation"])
async def generate_negotiation_prep(
    offer_id: str,
    achievements: list = Body(default=[], description="List of key achievements"),
    uuid: str = Depends(authorize)
):
    """Generate comprehensive salary negotiation preparation materials - UC-083"""
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        print(f"🔍 Generating negotiation prep for offer {offer_id}")

        prep = await generate_full_negotiation_prep(
            job_id=offer.get("job_id"),
            role=offer["job_title"],
            company=offer["company"],
            location=offer["location"],
            offered_salary=offer["offered_salary_details"].get("base_salary", 0),
            years_of_experience=5,
            achievements=achievements if achievements else [],
            company_size=None
        )

        updated = await offers_dao.set_negotiation_prep(offer_id, prep)

        if updated:
            updated["_id"] = str(updated["_id"])
            return {
                "detail": "Negotiation prep generated successfully",
                "negotiation_prep": prep
            }
        else:
            raise HTTPException(500, "Failed to save negotiation prep")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating negotiation prep: {e}")
        raise HTTPException(500, str(e))


@offers_router.get("/{offer_id}/negotiation-prep", tags=["offers", "negotiation"])
async def get_negotiation_prep(offer_id: str, uuid: str = Depends(authorize)):
    """Get generated negotiation preparation materials for an offer"""
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        if not offer.get("negotiation_prep"):
            raise HTTPException(404, "No negotiation prep generated yet")

        return offer["negotiation_prep"]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching negotiation prep: {e}")
        raise HTTPException(500, str(e))


# =============================================================================
# OFFER STATUS AND NEGOTIATION TRACKING
# =============================================================================

@offers_router.put("/{offer_id}/status", tags=["offers"])
async def update_offer_status(
    offer_id: str,
    status: str = Body(..., description="New status"),
    uuid: str = Depends(authorize)
):
    """Update offer status"""
    try:
        valid_statuses = ["received", "negotiating", "accepted", "rejected", "withdrawn", "expired"]

        if status not in valid_statuses:
            raise HTTPException(400, f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        existing = await offers_dao.get_offer(offer_id)

        if not existing:
            raise HTTPException(404, "Offer not found")

        if existing["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to update this offer")

        updated = await offers_dao.update_offer_status(offer_id, status)

        if updated:
            updated["_id"] = str(updated["_id"])
            return updated
        else:
            raise HTTPException(500, "Failed to update status")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating status: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/negotiation-history", tags=["offers", "negotiation"])
async def add_negotiation_history(
    offer_id: str,
    history_entry: NegotiationHistory,
    uuid: str = Depends(authorize)
):
    """Add a negotiation history entry to track counter-offers"""
    try:
        existing = await offers_dao.get_offer(offer_id)

        if not existing:
            raise HTTPException(404, "Offer not found")

        if existing["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to update this offer")

        if not existing.get("negotiation_history"):
            history_entry.iteration = 1
        else:
            history_entry.iteration = len(existing["negotiation_history"]) + 1

        updated = await offers_dao.add_negotiation_history(offer_id, history_entry.model_dump())

        if updated:
            updated["_id"] = str(updated["_id"])
            return {
                "detail": f"Negotiation history added (iteration {history_entry.iteration})",
                "offer": updated
            }
        else:
            raise HTTPException(500, "Failed to add history")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding negotiation history: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/negotiation-outcome", tags=["offers", "negotiation"])
async def set_negotiation_outcome(
    offer_id: str,
    outcome: NegotiationOutcome,
    uuid: str = Depends(authorize)
):
    """Record the final outcome of negotiations - UC-083"""
    try:
        existing = await offers_dao.get_offer(offer_id)

        if not existing:
            raise HTTPException(404, "Offer not found")

        if existing["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to update this offer")

        updated = await offers_dao.update_negotiation_outcome(offer_id, outcome.model_dump())

        if updated:
            updated["_id"] = str(updated["_id"])
            return {
                "detail": "Negotiation outcome recorded",
                "offer": updated
            }
        else:
            raise HTTPException(500, "Failed to update outcome")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting outcome: {e}")
        raise HTTPException(500, str(e))


# =============================================================================
# EXPORT AND DOWNLOAD ENDPOINTS
# =============================================================================

@offers_router.get("/{offer_id}/export/pdf", tags=["offers", "export"])
async def export_negotiation_pdf(offer_id: str, uuid: str = Depends(authorize)):
    """Export negotiation prep materials as PDF - UC-083"""
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        if not offer.get("negotiation_prep"):
            raise HTTPException(400, "No negotiation prep to export")

        pdf_buffer = await export_negotiation_to_pdf(offer)

        return StreamingResponse(
            BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=salary_negotiation_{offer['company']}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting to PDF: {e}")
        raise HTTPException(500, str(e))


@offers_router.get("/{offer_id}/export/docx", tags=["offers", "export"])
async def export_negotiation_docx(offer_id: str, uuid: str = Depends(authorize)):
    """Export negotiation prep materials as DOCX - UC-083"""
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        if not offer.get("negotiation_prep"):
            raise HTTPException(400, "No negotiation prep to export")

        docx_buffer = await export_negotiation_to_docx(offer)

        return StreamingResponse(
            BytesIO(docx_buffer.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename=salary_negotiation_{offer['company']}.docx"}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting to DOCX: {e}")
        raise HTTPException(500, str(e))


@offers_router.get("/{offer_id}/export/json", tags=["offers", "export"])
async def export_negotiation_json(offer_id: str, uuid: str = Depends(authorize)):
    """Export negotiation prep as JSON for data portability"""
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        if not offer.get("negotiation_prep"):
            raise HTTPException(400, "No negotiation prep to export")

        offer["_id"] = str(offer["_id"])

        return StreamingResponse(
            BytesIO(json.dumps(offer, indent=2).encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=salary_negotiation_{offer['company']}.json"}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting to JSON: {e}")
        raise HTTPException(500, str(e))
