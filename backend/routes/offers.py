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

from mongo.offers_dao import offers_dao
from mongo.jobs_dao import jobs_dao
from mongo.employment_dao import employment_dao
from mongo.projects_dao import projects_dao
from mongo.resumes_dao import resumes_dao
from sessions.session_authorizer import authorize
from schema.Offer import (
    Offer, SalaryDetails, NegotiationPrep,
    NegotiationHistory, NegotiationOutcome
)
from services.salary_negotiation_service import generate_full_negotiation_prep
from services.pdf_export import export_negotiation_to_pdf, export_negotiation_to_docx
from services.market_data_cache import get_cache_stats
from services.offer_comparison_service import offer_comparison_service

offers_router = APIRouter(prefix="/offers")


async def extract_user_achievements(uuid: str) -> list:
    """
    Extract achievements from user's existing data:
    - Employment history (job titles, responsibilities, accomplishments)
    - Projects (descriptions, impacts)
    - Resume highlights
    """
    achievements = []

    try:
        # Get employment history
        employment_list = await employment_dao.get_all_employment(uuid)
        for emp in employment_list:
            if emp.get("job_title"):
                achievements.append(f"Worked as {emp.get('job_title')} at {emp.get('company_name', 'various companies')}")
            if emp.get("accomplishments"):
                accomplishments = emp.get("accomplishments")
                if isinstance(accomplishments, list):
                    achievements.extend(accomplishments[:2])  # Top 2 accomplishments
                elif isinstance(accomplishments, str):
                    achievements.append(accomplishments)

        # Get projects
        projects_list = await projects_dao.get_all_projects(uuid)
        for project in projects_list:
            if project.get("title"):
                achievements.append(f"Project: {project.get('title')} - {project.get('description', '')[:100]}")

        # Get resume highlights
        resumes = await resumes_dao.get_all_resumes(uuid)
        if resumes:
            # Take first resume's summary
            resume = resumes[0]
            if resume.get("summary"):
                achievements.append(resume.get("summary")[:150])

    except Exception as e:
        print(f"Error extracting achievements: {e}")

    return achievements[:10]  # Return top 10 achievements


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


@offers_router.get("/active", tags=["offers"])
async def get_active_offers(uuid: str = Depends(authorize)):
    """Get all non-archived offers - UC-127"""
    try:
        offers = await offers_dao.get_active_offers(uuid)

        for offer in offers:
            offer["_id"] = str(offer["_id"])

        return offers

    except Exception as e:
        print(f"Error fetching active offers: {e}")
        raise HTTPException(500, str(e))


@offers_router.get("/archived", tags=["offers"])
async def get_archived_offers(uuid: str = Depends(authorize)):
    """Get all archived offers - UC-127"""
    try:
        offers = await offers_dao.get_archived_offers(uuid)

        for offer in offers:
            offer["_id"] = str(offer["_id"])

        return offers

    except Exception as e:
        print(f"Error fetching archived offers: {e}")
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
    uuid: str = Depends(authorize)
):
    """Generate comprehensive salary negotiation preparation materials - UC-083

    Automatically extracts achievements from user's employment history, projects, and resume.
    No manual input required - uses existing profile data.
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        print(f"🔍 Generating negotiation prep for offer {offer_id}")
        print(f"📋 Extracting achievements from user profile...")

        # Auto-extract achievements from user's existing data
        achievements = await extract_user_achievements(uuid)
        print(f"✅ Found {len(achievements)} achievements from profile")

        prep = await generate_full_negotiation_prep(
            job_id=offer.get("job_id"),
            role=offer["job_title"],
            company=offer["company"],
            location=offer["location"],
            offered_salary=offer["offered_salary_details"].get("base_salary", 0),
            offered_salary_details=offer.get("offered_salary_details", {}),
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


# =============================================================================
# MONITORING & ANALYTICS
# =============================================================================

@offers_router.get("/analytics/cache-stats", tags=["analytics"])
async def get_market_cache_statistics(uuid: str = Depends(authorize)):
    """
    Get market salary data cache statistics (admin/monitoring endpoint).

    Returns cache hit rate, number of cached entries, and TTL information.
    This helps monitor API quota efficiency and system performance.

    Returns:
        dict: Cache statistics including hit rate and entry count
    """
    return get_cache_stats()


# =============================================================================
# UC-127: OFFER EVALUATION & COMPARISON
# =============================================================================

@offers_router.post("/{offer_id}/calculate-total-comp", tags=["offers", "evaluation"])
async def calculate_total_compensation(offer_id: str, uuid: str = Depends(authorize)):
    """
    Calculate comprehensive total compensation breakdown - UC-127

    Calculates:
    - Year 1 total comp (base + signing + bonus + equity + benefits)
    - Annual total comp (year 2+)
    - 4-year total comp
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        total_comp = await offer_comparison_service.calculate_total_compensation(offer_id, offer)

        return {
            "detail": "Total compensation calculated",
            "total_compensation": total_comp
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating total comp: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/calculate-equity", tags=["offers", "evaluation"])
async def calculate_equity_valuation(
    offer_id: str,
    equity_data: dict = Body(...),
    uuid: str = Depends(authorize)
):
    """
    Calculate equity valuation (RSUs or Stock Options) - UC-127

    Body should contain:
    - equity_type: "RSUs" or "Stock Options"
    - number_of_shares: int
    - current_stock_price: float
    - strike_price: float (for options only)
    - vesting_years: int
    - cliff_months: int
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        equity_details = await offer_comparison_service.calculate_equity_value(offer_id, equity_data)

        return {
            "detail": "Equity valuation calculated",
            "equity_details": equity_details
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating equity: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/calculate-benefits", tags=["offers", "evaluation"])
async def calculate_benefits_valuation(
    offer_id: str,
    benefits_data: dict = Body(...),
    uuid: str = Depends(authorize)
):
    """
    Calculate monetary value of benefits - UC-127

    Body can include:
    - health_insurance_value: float
    - dental_vision_value: float
    - retirement_401k_match: string (e.g., "6%") or float
    - life_insurance_value: float
    - disability_insurance_value: float
    - hsa_contribution: float
    - commuter_benefits: float
    - education_stipend: float
    - wellness_stipend: float
    - home_office_stipend: float
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        base_salary = offer.get("offered_salary_details", {}).get("base_salary", 0)
        pto_days = offer.get("offered_salary_details", {}).get("pto_days", 0)

        benefits_val = await offer_comparison_service.calculate_benefits_value(
            offer_id, benefits_data, base_salary, pto_days
        )

        return {
            "detail": "Benefits valuation calculated",
            "benefits_valuation": benefits_val
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating benefits: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/calculate-col", tags=["offers", "evaluation"])
async def calculate_cost_of_living(offer_id: str, uuid: str = Depends(authorize)):
    """
    Calculate cost-of-living adjusted salary - UC-127

    Uses offer's location and base salary to calculate COL adjustment
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        location = offer.get("location", "Other")
        base_salary = offer.get("offered_salary_details", {}).get("base_salary", 0)

        col_data = await offer_comparison_service.calculate_cost_of_living_adjustment(
            offer_id, location, base_salary
        )

        return {
            "detail": "Cost of living calculated",
            "cost_of_living": col_data
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating COL: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/calculate-score", tags=["offers", "evaluation"])
async def calculate_offer_score(
    offer_id: str,
    non_financial_factors: dict = Body(...),
    market_median: float = Body(None),
    weights: dict = Body(None),
    uuid: str = Depends(authorize)
):
    """
    Calculate comprehensive offer score - UC-127

    Body should contain:
    - non_financial_factors: dict with 1-10 ratings for:
      - culture_fit
      - growth_opportunities
      - work_life_balance
      - team_quality
      - mission_alignment
      - commute_quality
      - job_security
      - learning_opportunities
    - market_median: optional float (market median salary for comparison)
    - weights: optional dict with financial_weight (default 0.6)
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        # Save non-financial factors
        await offers_dao.update_non_financial_factors(offer_id, non_financial_factors)

        # Get total comp
        total_comp = offer.get("offered_salary_details", {}).get("total_compensation", {})

        if not total_comp:
            raise HTTPException(400, "Total compensation not calculated yet. Call /calculate-total-comp first.")

        score = await offer_comparison_service.calculate_offer_score(
            offer_id, total_comp, non_financial_factors, market_median, weights
        )

        return {
            "detail": "Offer score calculated",
            "offer_score": score
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating score: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/scenario-analysis", tags=["offers", "evaluation"])
async def run_scenario_analysis(
    offer_id: str,
    scenarios: list = Body(...),
    uuid: str = Depends(authorize)
):
    """
    Run "what-if" scenario analysis - UC-127

    Body should be a list of scenarios:
    [
        {
            "name": "Negotiate 10% higher salary",
            "changes": {"base_salary": 165000}
        },
        {
            "name": "More equity",
            "changes": {"equity_number_of_shares": 5000}
        }
    ]

    Returns recalculated total comp for each scenario
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        results = await offer_comparison_service.run_scenario_analysis(offer_id, scenarios)

        return {
            "detail": "Scenario analysis complete",
            "scenarios": results
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error running scenario analysis: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/compare", tags=["offers", "evaluation"])
async def compare_offers(
    offer_ids: list = Body(...),
    weights: dict = Body(None),
    uuid: str = Depends(authorize)
):
    """
    Get side-by-side comparison of multiple offers - UC-127

    Body should contain:
    - offer_ids: list of offer IDs to compare
    - weights: optional dict with comparison weights

    Returns:
    - offers: List of offer summaries
    - winner: Offer with highest weighted score
    - comparison_matrix: Side-by-side breakdown
    """
    try:
        if not offer_ids or len(offer_ids) < 2:
            raise HTTPException(400, "At least 2 offers required for comparison")

        # Verify all offers belong to user
        for oid in offer_ids:
            offer = await offers_dao.get_offer(oid)
            if not offer:
                raise HTTPException(404, f"Offer {oid} not found")
            if offer["user_uuid"] != uuid:
                raise HTTPException(403, f"Not authorized to access offer {oid}")

        comparison = await offer_comparison_service.compare_offers(offer_ids, weights)

        return {
            "detail": "Comparison complete",
            **comparison
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error comparing offers: {e}")
        raise HTTPException(500, str(e))


@offers_router.post("/{offer_id}/archive", tags=["offers"])
async def archive_offer(
    offer_id: str,
    decline_reason: str = Body(None),
    uuid: str = Depends(authorize)
):
    """
    Archive a declined offer - UC-127

    Body can include decline_reason (optional string)
    """
    try:
        offer = await offers_dao.get_offer(offer_id)

        if not offer:
            raise HTTPException(404, "Offer not found")

        if offer["user_uuid"] != uuid:
            raise HTTPException(403, "Not authorized to access this offer")

        archived = await offers_dao.archive_offer(offer_id, decline_reason)

        if archived:
            archived["_id"] = str(archived["_id"])
            return {
                "detail": "Offer archived",
                "offer": archived
            }
        else:
            raise HTTPException(500, "Failed to archive offer")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error archiving offer: {e}")
        raise HTTPException(500, str(e))
