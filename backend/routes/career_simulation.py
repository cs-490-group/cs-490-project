from fastapi import APIRouter, HTTPException, Depends, Body
from pymongo.errors import DuplicateKeyError
from datetime import datetime
import traceback
import re
from typing import Dict, List, Optional, Any

from mongo.career_simulation_dao import career_simulation_dao
from mongo.offers_dao import offers_dao
from sessions.session_authorizer import authorize
from schema.CareerSimulation import CareerSimulationRequest, CareerSimulationResponse

career_simulation_router = APIRouter(prefix="/career-simulation")


def _safe_float(value, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _extract_base_salary_from_offer(offer: dict) -> float:
    salary_details = offer.get("offered_salary_details") or {}

    base_salary = salary_details.get("base_salary")
    if base_salary is not None:
        return _safe_float(base_salary, 0.0)

    total_comp = salary_details.get("total_compensation")
    if isinstance(total_comp, dict):
        # Prefer actual base salary; fall back to annual totals if that's all we have.
        return _safe_float(
            total_comp.get("base_salary")
            or total_comp.get("annual_total")
            or total_comp.get("year_1_total"),
            0.0,
        )

    return _safe_float(total_comp, 0.0)


def _safe_int(value, default: int = 0) -> int:
    if value is None or value == "":
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _parse_bonus_value(annual_bonus: Any, base_salary: float) -> float:
    if annual_bonus is None or annual_bonus == "":
        return 0.0
    if isinstance(annual_bonus, (int, float)):
        return float(annual_bonus)
    s = str(annual_bonus).strip()
    m = re.match(r"^(\d+(?:\.\d+)?)%$", s)
    if m:
        return base_salary * (float(m.group(1)) / 100.0)
    m = re.match(r"^\$?([\d,]+(?:\.\d+)?)k?$", s, re.IGNORECASE)
    if m:
        val = float(m.group(1).replace(",", ""))
        if "k" in s.lower():
            val *= 1000.0
        return val
    return 0.0


def _default_raise_scenarios(annual_raise_percent: float) -> Dict[str, float]:
    expected = _safe_float(annual_raise_percent, 3.0)
    return {
        "conservative": max(0.0, expected * 0.5),
        "expected": max(0.0, expected),
        "optimistic": max(0.0, expected * 1.5),
    }


def _normalize_raise_scenarios(annual_raise_percent: float, raise_scenarios: Optional[Dict[str, float]]) -> Dict[str, float]:
    base = _default_raise_scenarios(annual_raise_percent)
    if not raise_scenarios:
        return base
    for k, v in raise_scenarios.items():
        if k in base:
            base[k] = max(0.0, _safe_float(v, base[k]))
    return base


def _apply_milestones(
    year: int,
    salary: float,
    milestones_by_year: Dict[int, dict],
) -> float:
    m = milestones_by_year.get(year)
    if not m:
        return salary
    if m.get("new_base_salary") is not None:
        return _safe_float(m.get("new_base_salary"), salary)
    if m.get("raise_percent") is not None:
        rp = _safe_float(m.get("raise_percent"), 0.0)
        return salary * (1.0 + (rp / 100.0))
    return salary


def _project_compensation(
    starting_salary: float,
    annual_raise_percent: float,
    years: int,
    annual_bonus: Any,
    annual_equity: Optional[float],
    milestones: Optional[List[dict]],
) -> dict:
    milestones_by_year: Dict[int, dict] = {}
    for m in milestones or []:
        y = _safe_int(m.get("year"), 0)
        if y > 0:
            milestones_by_year[y] = m

    salary_by_year: List[float] = []
    bonus_by_year: List[float] = []
    equity_by_year: List[float] = []
    total_comp_by_year: List[float] = []

    current_salary = _safe_float(starting_salary, 0.0)
    equity_default = _safe_float(annual_equity, 0.0)
    for y in range(0, years + 1):
        if y > 0:
            current_salary = current_salary * (1.0 + (_safe_float(annual_raise_percent, 0.0) / 100.0))
            current_salary = _apply_milestones(y, current_salary, milestones_by_year)

        m = milestones_by_year.get(y)
        bonus_val = _parse_bonus_value(m.get("bonus_expected") if m else annual_bonus, current_salary)
        equity_val = _safe_float(m.get("equity_value") if m else equity_default, 0.0)

        salary_by_year.append(current_salary)
        bonus_by_year.append(bonus_val)
        equity_by_year.append(equity_val)
        total_comp_by_year.append(current_salary + bonus_val + equity_val)

    total_earnings = sum(total_comp_by_year[1:])
    peak_salary = max(salary_by_year) if salary_by_year else 0.0
    return {
        "salary_by_year": salary_by_year,
        "bonus_by_year": bonus_by_year,
        "equity_by_year": equity_by_year,
        "total_comp_by_year": total_comp_by_year,
        "total_earnings": total_earnings,
        "peak_salary": peak_salary,
    }

@career_simulation_router.post("/simulate", tags=["career-simulation"])
async def create_career_simulation(request: CareerSimulationRequest, uuid: str = Depends(authorize)):
    """Create a new career path simulation"""
    try:
        # Validate that the offer exists and belongs to the user
        offer = await offers_dao.get_offer(request.offer_id)
        if not offer:
            raise HTTPException(404, "Offer not found")
        
        if offer.get("user_uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        # Create simulation record
        simulation_data = {
            "request": request.model_dump(),
            "status": "pending"
        }
        
        simulation_id = await career_simulation_dao.create_simulation(simulation_data, uuid)
        
        # Extract form parameters
        simulation_years = request.simulation_years
        personal_growth_rate = request.personal_growth_rate
        risk_tolerance = request.risk_tolerance
        job_change_frequency = request.job_change_frequency
        geographic_flexibility = request.geographic_flexibility
        industry_switch_willingness = request.industry_switch_willingness
        
        # Extract actual offer salary data
        base_salary = _extract_base_salary_from_offer(offer)

        starting_salary = _safe_float(request.starting_salary, 0.0) or base_salary
        if not starting_salary:
            starting_salary = 100000.0

        annual_raise_percent = _safe_float(request.annual_raise_percent, 3.0)
        raise_scenarios = _normalize_raise_scenarios(annual_raise_percent, request.raise_scenarios)

        offer_salary_details = offer.get("offered_salary_details") or {}
        offer_annual_bonus = offer_salary_details.get("annual_bonus")
        annual_bonus = request.annual_bonus if request.annual_bonus is not None else offer_annual_bonus
        annual_equity = request.annual_equity

        milestones = [m.model_dump() if hasattr(m, "model_dump") else m for m in (request.milestones or [])]
        
        # Extract success criteria weights
        salary_weight = 0.4
        work_life_weight = 0.3
        learning_weight = 0.2
        impact_weight = 0.1
        
        for criteria in request.success_criteria:
            criteria_type = str(criteria.criteria_type)
            if criteria_type == 'salary':
                salary_weight = criteria.weight
            elif criteria_type == 'work_life_balance':
                work_life_weight = criteria.weight
            elif criteria_type == 'learning_opportunities':
                learning_weight = criteria.weight
            elif criteria_type == 'impact':
                impact_weight = criteria.weight
        
        # Calculate dynamic values based on parameters
        growth_multiplier = 1 + (personal_growth_rate * simulation_years * 0.1)
        risk_adjustment = 1 + (risk_tolerance - 0.5) * 0.3
        flexibility_bonus = 1.1 if geographic_flexibility else 1.0
        
        projection_years = max(10, _safe_int(simulation_years, 5))
        scenario_results: Dict[str, dict] = {}
        for scenario_name, scenario_raise in raise_scenarios.items():
            scenario_results[scenario_name] = _project_compensation(
                starting_salary=starting_salary,
                annual_raise_percent=scenario_raise,
                years=projection_years,
                annual_bonus=annual_bonus,
                annual_equity=annual_equity,
                milestones=milestones,
            )

        def _build_path(name: str, scenario_name: str) -> dict:
            sr = scenario_results[scenario_name]
            total_earnings_5yr = sum(sr["total_comp_by_year"][1:6])
            total_earnings_10yr = sum(sr["total_comp_by_year"][1:11])
            peak_salary = sr["peak_salary"]
            growth_rate = _safe_float(scenario_raise, 0.0) / 100.0
            return {
                "path_name": name,
                "scenario": scenario_name,
                "total_earnings_5yr": total_earnings_5yr,
                "total_earnings_10yr": total_earnings_10yr,
                "peak_salary": peak_salary,
                "career_growth_rate": growth_rate,
                "overall_score": int(70 + personal_growth_rate * 20 + (1 - risk_tolerance) * 10),
                "salary_score": int(60 + salary_weight * 40),
                "work_life_balance_score": int(60 + work_life_weight * 40),
                "learning_score": int(60 + learning_weight * 40),
                "impact_score": int(60 + impact_weight * 40),
                "title_progression": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
                "companies_worked": [offer.get("company", "Current Company")],
                "probability_outcomes": [],
                "decision_points": [],
            }

        mock_response = {
            "projection_years": projection_years,
            "projections": {
                "starting_salary": starting_salary,
                "annual_raise_percent": annual_raise_percent,
                "raise_scenarios": raise_scenarios,
                "annual_bonus": annual_bonus,
                "annual_equity": annual_equity,
                "milestones": milestones,
                "notes": request.notes,
                "scenarios": scenario_results,
            },
            "career_paths": [
                {
                    "path_name": "Conservative Raise",
                    **{
                        "scenario": "conservative",
                        "total_earnings_5yr": sum(scenario_results["conservative"]["total_comp_by_year"][1:6]),
                        "total_earnings_10yr": sum(scenario_results["conservative"]["total_comp_by_year"][1:11]),
                        "peak_salary": scenario_results["conservative"]["peak_salary"],
                        "career_growth_rate": raise_scenarios["conservative"] / 100.0,
                        "overall_score": int(65 + personal_growth_rate * 25),
                        "salary_score": int(60 + salary_weight * 40),
                        "work_life_balance_score": int(60 + work_life_weight * 40),
                        "learning_score": int(60 + learning_weight * 40),
                        "impact_score": int(60 + impact_weight * 40),
                        "title_progression": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
                        "companies_worked": [offer.get("company", "Current Company")],
                        "probability_outcomes": [],
                        "decision_points": [],
                    }
                },
                {
                    "path_name": "Expected Raise",
                    **{
                        "scenario": "expected",
                        "total_earnings_5yr": sum(scenario_results["expected"]["total_comp_by_year"][1:6]),
                        "total_earnings_10yr": sum(scenario_results["expected"]["total_comp_by_year"][1:11]),
                        "peak_salary": scenario_results["expected"]["peak_salary"],
                        "career_growth_rate": raise_scenarios["expected"] / 100.0,
                        "overall_score": int(70 + personal_growth_rate * 20 + (1 - risk_tolerance) * 10),
                        "salary_score": int(60 + salary_weight * 40),
                        "work_life_balance_score": int(60 + work_life_weight * 40),
                        "learning_score": int(60 + learning_weight * 40),
                        "impact_score": int(60 + impact_weight * 40),
                        "title_progression": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
                        "companies_worked": [offer.get("company", "Current Company")],
                        "probability_outcomes": [],
                        "decision_points": [],
                    }
                },
                {
                    "path_name": "Optimistic Raise",
                    **{
                        "scenario": "optimistic",
                        "total_earnings_5yr": sum(scenario_results["optimistic"]["total_comp_by_year"][1:6]),
                        "total_earnings_10yr": sum(scenario_results["optimistic"]["total_comp_by_year"][1:11]),
                        "peak_salary": scenario_results["optimistic"]["peak_salary"],
                        "career_growth_rate": raise_scenarios["optimistic"] / 100.0,
                        "overall_score": int(75 + personal_growth_rate * 20 + risk_tolerance * 5),
                        "salary_score": int(60 + salary_weight * 40),
                        "work_life_balance_score": int(60 + work_life_weight * 40),
                        "learning_score": int(60 + learning_weight * 40),
                        "impact_score": int(60 + impact_weight * 40),
                        "title_progression": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
                        "companies_worked": [offer.get("company", "Current Company")],
                        "probability_outcomes": [],
                        "decision_points": [],
                    }
                },
            ],
            "optimal_path": {
                "path_name": "Expected Raise",
                "scenario": "expected",
                "total_earnings_5yr": sum(scenario_results["expected"]["total_comp_by_year"][1:6]),
                "total_earnings_10yr": sum(scenario_results["expected"]["total_comp_by_year"][1:11]),
                "peak_salary": scenario_results["expected"]["peak_salary"],
                "career_growth_rate": raise_scenarios["expected"] / 100.0,
                "overall_score": int(70 + personal_growth_rate * 20 + (1 - risk_tolerance) * 10),
                "salary_score": int(60 + salary_weight * 40),
                "work_life_balance_score": int(60 + work_life_weight * 40),
                "learning_score": int(60 + learning_weight * 40),
                "impact_score": int(60 + impact_weight * 40),
                "title_progression": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
                "companies_worked": [offer.get("company", "Current Company")],
                "probability_outcomes": [],
                "decision_points": [],
            },
            "path_rankings": [
                {"path": "Optimistic Raise", "score": int(75 + personal_growth_rate * 20 + risk_tolerance * 5), "reason": "Higher upside"},
                {"path": "Expected Raise", "score": int(70 + personal_growth_rate * 20 + (1 - risk_tolerance) * 10), "reason": "Balanced"},
                {"path": "Conservative Raise", "score": int(65 + personal_growth_rate * 25), "reason": "Lower volatility"},
            ],
            "decision_insights": [
                "Try adjusting raise scenarios and adding milestones to see how your path changes.",
            ],
            "risk_assessments": [],
            "opportunity_analysis": [],
            "next_step_recommendation": "Add a promotion milestone to model title/comp changes.",
            "long_term_strategy": "Compare scenarios across offers to pick the best long-term trajectory.",
            "confidence_level": min(0.95, 0.75 + personal_growth_rate * 0.2),
            "data_sources": ["Offer base salary", "User assumptions"],
        }
        
        # Save the mock response
        await career_simulation_dao.save_simulation_response(
            simulation_id, 
            mock_response, 
            computation_time=0.5
        )
        
        return {
            "detail": "Career simulation started",
            "simulation_id": simulation_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating career simulation: {e}")
        traceback.print_exc()
        try:
            # best-effort: record the failure on the simulation document
            if 'simulation_id' in locals() and simulation_id:
                await career_simulation_dao.update_simulation_status(
                    simulation_id,
                    status="failed",
                    error_message=str(e)
                )
        except Exception:
            pass
        raise HTTPException(500, "Failed to create career simulation")


@career_simulation_router.post("/compare", tags=["career-simulation"])
async def compare_career_simulations(
    payload: dict = Body(...),
    uuid: str = Depends(authorize)
):
    try:
        offer_ids = payload.get("offer_ids") or []
        if not isinstance(offer_ids, list) or len(offer_ids) < 2:
            raise HTTPException(422, "offer_ids must be a list with at least 2 offer IDs")

        simulation_years = _safe_int(payload.get("simulation_years"), 10)
        annual_raise_percent = _safe_float(payload.get("annual_raise_percent"), 3.0)
        raise_scenarios = _normalize_raise_scenarios(annual_raise_percent, payload.get("raise_scenarios"))
        annual_bonus = payload.get("annual_bonus")
        annual_equity = payload.get("annual_equity")
        milestones = payload.get("milestones") or []

        projection_years = max(10, simulation_years)

        results = []
        for oid in offer_ids:
            offer = await offers_dao.get_offer(oid)
            if not offer:
                continue
            if offer.get("user_uuid") != uuid:
                continue

            base_salary = _extract_base_salary_from_offer(offer)
            starting_salary = _safe_float(payload.get("starting_salary"), 0.0) or base_salary or 100000.0
            offer_bonus = (offer.get("offered_salary_details") or {}).get("annual_bonus")
            effective_bonus = annual_bonus if annual_bonus is not None else offer_bonus

            scenarios_out = {}
            for scenario_name, scenario_raise in raise_scenarios.items():
                scenarios_out[scenario_name] = _project_compensation(
                    starting_salary=starting_salary,
                    annual_raise_percent=scenario_raise,
                    years=projection_years,
                    annual_bonus=effective_bonus,
                    annual_equity=annual_equity,
                    milestones=milestones,
                )

            results.append({
                "offer_id": oid,
                "company": offer.get("company"),
                "job_title": offer.get("job_title"),
                "starting_salary": starting_salary,
                "annual_raise_percent": annual_raise_percent,
                "raise_scenarios": raise_scenarios,
                "projection_years": projection_years,
                "scenarios": scenarios_out,
            })

        return {
            "detail": "Career simulation comparison complete",
            "offers": results,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error comparing career simulations: {e}")
        traceback.print_exc()
        raise HTTPException(500, "Failed to compare career simulations")

@career_simulation_router.get("/{simulation_id}", tags=["career-simulation"])
async def get_simulation(simulation_id: str, uuid: str = Depends(authorize)):
    """Get a specific career simulation"""
    try:
        simulation = await career_simulation_dao.get_simulation(simulation_id)
        if not simulation:
            raise HTTPException(404, "Simulation not found")
        
        if simulation.get("user_uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        return simulation
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting simulation: {e}")
        raise HTTPException(500, "Failed to get simulation")

@career_simulation_router.get("/offer/{offer_id}", tags=["career-simulation"])
async def get_simulations_for_offer(offer_id: str, uuid: str = Depends(authorize)):
    """Get all simulations for a specific offer"""
    try:
        # Validate offer ownership
        offer = await offers_dao.get_offer(offer_id)
        if not offer:
            raise HTTPException(404, "Offer not found")
        
        if offer.get("user_uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        simulations = await career_simulation_dao.get_simulations_for_offer(offer_id)
        
        # Filter out archived simulations
        active_simulations = [s for s in simulations if s.get("status") != "archived"]
        
        return active_simulations
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting simulations for offer: {e}")
        raise HTTPException(500, "Failed to get simulations")

@career_simulation_router.get("/me", tags=["career-simulation"])
async def get_user_simulations(uuid: str = Depends(authorize)):
    """Get all career simulations for the user"""
    try:
        simulations = await career_simulation_dao.get_user_simulations(uuid)
        
        # Filter out archived simulations
        active_simulations = [s for s in simulations if s.get("status") != "archived"]
        
        return active_simulations
        
    except Exception as e:
        print(f"Error getting user simulations: {e}")
        raise HTTPException(500, "Failed to get simulations")

@career_simulation_router.delete("/{simulation_id}", tags=["career-simulation"])
async def delete_simulation(simulation_id: str, uuid: str = Depends(authorize)):
    """Delete a career simulation"""
    try:
        # Validate simulation ownership
        simulation = await career_simulation_dao.get_simulation(simulation_id)
        if not simulation:
            raise HTTPException(404, "Simulation not found")
        
        if simulation.get("user_uuid") != uuid:
            raise HTTPException(403, "Access denied")
        
        deleted = await career_simulation_dao.delete_simulation(simulation_id)
        if not deleted:
            raise HTTPException(404, "Simulation not found")
        
        return {"detail": "Simulation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting simulation: {e}")
        raise HTTPException(500, "Failed to delete simulation")

@career_simulation_router.get("/statistics/me", tags=["career-simulation"])
async def get_simulation_statistics(uuid: str = Depends(authorize)):
    """Get statistics about user's career simulations"""
    try:
        stats = await career_simulation_dao.get_simulation_statistics(uuid)
        return stats
        
    except Exception as e:
        print(f"Error getting simulation statistics: {e}")
        raise HTTPException(500, "Failed to get statistics")
