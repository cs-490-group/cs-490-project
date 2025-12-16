from fastapi import APIRouter, HTTPException, Depends
from pymongo.errors import DuplicateKeyError
from datetime import datetime
import traceback

from mongo.career_simulation_dao import career_simulation_dao
from mongo.offers_dao import offers_dao
from sessions.session_authorizer import authorize
from schema.CareerSimulation import CareerSimulationRequest, CareerSimulationResponse

career_simulation_router = APIRouter(prefix="/career-simulation")

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
        base_salary = 0
        if offer and "offered_salary_details" in offer:
            salary_details = offer["offered_salary_details"]
            if "base_salary" in salary_details:
                base_salary = salary_details["base_salary"]
            elif "total_compensation" in salary_details:
                base_salary = salary_details["total_compensation"]
        
        # Fallback to default if no salary data
        if base_salary == 0:
            base_salary = 100000
        
        # Extract success criteria weights
        salary_weight = 0.4
        work_life_weight = 0.3
        learning_weight = 0.2
        impact_weight = 0.1
        
        for criteria in request.success_criteria:
            if criteria.criteria_type == 'salary':
                salary_weight = criteria.weight
            elif criteria.criteria_type == 'work_life_balance':
                work_life_weight = criteria.weight
            elif criteria.criteria_type == 'learning_opportunities':
                learning_weight = criteria.weight
            elif criteria.criteria_type == 'impact':
                impact_weight = criteria.weight
        
        # Calculate dynamic values based on parameters
        growth_multiplier = 1 + (personal_growth_rate * simulation_years * 0.1)
        risk_adjustment = 1 + (risk_tolerance - 0.5) * 0.3
        flexibility_bonus = 1.1 if geographic_flexibility else 1.0
        
        # Generate dynamic simulation results
        mock_response = {
            "career_paths": [
                {
                    "path_name": "Technical Leadership Track",
                    "total_earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus),
                    "total_earnings_10yr": int(base_salary * 10 * growth_multiplier * risk_adjustment * flexibility_bonus * 1.1),
                    "peak_salary": int(base_salary * growth_multiplier * 2.5),
                    "career_growth_rate": 0.05 + (personal_growth_rate * 0.1),
                    "overall_score": int(70 + personal_growth_rate * 20 + (1 - risk_tolerance) * 10),
                    "salary_score": int(60 + salary_weight * 40),
                    "work_life_balance_score": int(60 + work_life_weight * 40),
                    "learning_score": int(60 + learning_weight * 40),
                    "impact_score": int(60 + impact_weight * 40),
                    "title_progression": [
                        "Senior Software Engineer",
                        "Staff Software Engineer", 
                        "Principal Engineer",
                        "Engineering Manager"
                    ],
                    "companies_worked": [offer.get("company", "Current Company")],
                    "probability_outcomes": [
                        {"scenario": "best_case", "probability": 0.2 + risk_tolerance * 0.1, "earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus * 1.2)},
                        {"scenario": "average_case", "probability": 0.6 - risk_tolerance * 0.1, "earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus)},
                        {"scenario": "worst_case", "probability": 0.2 - risk_tolerance * 0.1, "earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus * 0.8)}
                    ],
                    "decision_points": [
                        {
                            "year": max(2, int(simulation_years * 0.6)),
                            "decision": "Technical vs Management track",
                            "impact": "High",
                            "options": ["Stay Technical", "Move to Management"]
                        }
                    ]
                },
                {
                    "path_name": "Fast-Growth Startup Track" if risk_tolerance > 0.5 else "Stable Corporate Track",
                    "total_earnings_5yr": int(base_salary * 5 * growth_multiplier * 1.2 * risk_adjustment),
                    "total_earnings_10yr": int(base_salary * 10 * growth_multiplier * 1.3 * risk_adjustment),
                    "peak_salary": int(base_salary * growth_multiplier * 3.2),
                    "career_growth_rate": 0.08 + (personal_growth_rate * 0.15),
                    "overall_score": int(65 + personal_growth_rate * 25 + risk_tolerance * 10),
                    "salary_score": int(55 + salary_weight * 45),
                    "work_life_balance_score": int(70 + work_life_weight * 30 - risk_tolerance * 20),
                    "learning_score": int(70 + learning_weight * 30),
                    "impact_score": int(65 + impact_weight * 35),
                    "title_progression": [
                        "Senior Software Engineer",
                        "Lead Engineer",
                        "Head of Engineering",
                        "CTO"
                    ],
                    "companies_worked": [offer.get("company", "Current Company"), "Series A Startup" if risk_tolerance > 0.5 else "Enterprise Company"],
                    "probability_outcomes": [
                        {"scenario": "best_case", "probability": 0.15 + risk_tolerance * 0.15, "earnings_5yr": int(base_salary * 5 * growth_multiplier * 1.2 * risk_adjustment * 1.3)},
                        {"scenario": "average_case", "probability": 0.55 - risk_tolerance * 0.05, "earnings_5yr": int(base_salary * 5 * growth_multiplier * 1.2 * risk_adjustment)},
                        {"scenario": "worst_case", "probability": 0.30 - risk_tolerance * 0.1, "earnings_5yr": int(base_salary * 5 * growth_multiplier * 1.2 * risk_adjustment * 0.7)}
                    ],
                    "decision_points": [
                        {
                            "year": max(1, int(simulation_years * 0.4)),
                            "decision": "Join early-stage startup" if risk_tolerance > 0.5 else "Pursue specialization",
                            "impact": "Very High" if risk_tolerance > 0.5 else "Medium",
                            "options": ["Join Startup", "Stay Corporate"] if risk_tolerance > 0.5 else ["Deepen Expertise", "Broaden Skills"]
                        }
                    ]
                }
            ],
            "optimal_path": {
                "path_name": "Technical Leadership Track" if work_life_weight > 0.3 else "Fast-Growth Startup Track",
                "total_earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus) if work_life_weight > 0.3 else int(base_salary * 5 * growth_multiplier * 1.2 * risk_adjustment),
                "total_earnings_10yr": int(base_salary * 10 * growth_multiplier * risk_adjustment * flexibility_bonus * 1.1) if work_life_weight > 0.3 else int(base_salary * 10 * growth_multiplier * 1.3 * risk_adjustment),
                "peak_salary": int(base_salary * growth_multiplier * 2.5) if work_life_weight > 0.3 else int(base_salary * growth_multiplier * 3.2),
                "career_growth_rate": 0.05 + (personal_growth_rate * 0.1),
                "overall_score": int(70 + personal_growth_rate * 20 + (1 - risk_tolerance) * 10),
                "salary_score": int(60 + salary_weight * 40),
                "work_life_balance_score": int(60 + work_life_weight * 40),
                "learning_score": int(60 + learning_weight * 40),
                "impact_score": int(60 + impact_weight * 40),
                "title_progression": [
                    "Senior Software Engineer",
                    "Staff Software Engineer", 
                    "Principal Engineer",
                    "Engineering Manager"
                ],
                "companies_worked": [offer.get("company", "Current Company")],
                "probability_outcomes": [
                    {"scenario": "best_case", "probability": 0.2 + risk_tolerance * 0.1, "earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus * 1.2)},
                    {"scenario": "average_case", "probability": 0.6 - risk_tolerance * 0.1, "earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus)},
                    {"scenario": "worst_case", "probability": 0.2 - risk_tolerance * 0.1, "earnings_5yr": int(base_salary * 5 * growth_multiplier * risk_adjustment * flexibility_bonus * 0.8)}
                ],
                "decision_points": [
                    {
                        "year": max(2, int(simulation_years * 0.6)),
                        "decision": "Technical vs Management track",
                        "impact": "High",
                        "options": ["Stay Technical", "Move to Management"]
                    }
                ]
            },
            "path_rankings": [
                {"path": "Technical Leadership Track", "score": int(70 + personal_growth_rate * 20 + (1 - risk_tolerance) * 10), "reason": "Balanced growth with good work-life balance"},
                {"path": "Fast-Growth Startup Track", "score": int(65 + personal_growth_rate * 25 + risk_tolerance * 10), "reason": "Higher potential but more risk"}
            ],
            "decision_insights": [
                f"Year {max(2, int(simulation_years * 0.6))} presents a critical decision point between technical and management tracks",
                f"Consider your {simulation_years}-year career goals before this decision",
                "Technical track offers higher work-life balance scores" if work_life_weight > 0.3 else "Startup track offers higher growth potential"
            ],
            "risk_assessments": [
                {"factor": "Market volatility", "risk_level": "Medium" if risk_tolerance < 0.7 else "High", "mitigation": "Diversify skills"},
                {"factor": "Company stability", "risk_level": "Low", "mitigation": "Continuous learning"}
            ],
            "opportunity_analysis": [
                "Strong demand for technical leadership skills",
                "Growing need for engineers with business acumen",
                "Remote work opportunities expanding" if geographic_flexibility else "Local opportunities available"
            ],
            "next_step_recommendation": f"Focus on developing leadership skills while maintaining technical expertise" if work_life_weight > 0.3 else f"Consider high-growth opportunities with calculated risks",
            "long_term_strategy": f"Build a foundation that allows flexibility between technical and management tracks over {simulation_years} years",
            "confidence_level": min(0.95, 0.75 + personal_growth_rate * 0.2),
            "data_sources": ["Market analysis", "Industry trends", "Salary data", "User preferences"]
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
        raise HTTPException(500, "Failed to create career simulation")

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
