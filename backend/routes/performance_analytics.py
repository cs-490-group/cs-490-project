from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import statistics
from bson import ObjectId
import math

from sessions.session_authorizer import authorize
from mongo.dao_setup import db_client, AUTH, JOBS, INFORMATIONAL_INTERVIEWS, SALARY, SKILLS

router = APIRouter(prefix="/performance-analytics", tags=["performance-analytics"])
performance_analytics_router = router

@router.get("/competitive-analysis")
async def get_competitive_analysis(
    uuid: str = Depends(authorize)
):
    """
    UC-104: Competitive Analysis and Benchmarking
    Compare user performance against anonymous peer benchmarks
    """
    try:
        user_id = uuid
        
        # Get user's data
        user_applications = await db_client[JOBS].find({"user_id": user_id}).to_list(None)
        user_interviews = await db_client[INFORMATIONAL_INTERVIEWS].find({"user_id": user_id}).to_list(None)
        user_salaries = await db_client[SALARY].find({"user_id": user_id}).to_list(None)
        user_skills = await db_client[SKILLS].find({"user_id": user_id}).to_list(None)
        
        # Get peer data (anonymous benchmarks)
        peer_data = await get_peer_benchmarks(user_id)
        
        # Calculate competitive metrics
        analysis = {
            "job_search_performance": analyze_job_search_performance(user_applications, peer_data["applications"]),
            "competitive_positioning": analyze_competitive_positioning(user_id, user_skills, peer_data["skills"]),
            "industry_standards": analyze_industry_standards(user_applications, peer_data["applications"]),
            "career_progression": analyze_career_progression(user_applications, user_interviews, peer_data["career_data"]),
            "skill_gap_analysis": analyze_skill_gaps(user_skills, peer_data["skills"]),
            "recommendations": generate_competitive_recommendations(user_id, user_applications, user_skills, peer_data),
            "market_positioning": analyze_market_positioning(user_id, user_salaries, peer_data["salaries"]),
            "differentiation_strategies": generate_differentiation_strategies(user_skills, peer_data["skills"])
        }
        
        return {
            "success": True,
            "data": analysis,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating competitive analysis: {str(e)}")

@router.get("/performance-prediction")
async def get_performance_prediction(
    uuid: str = Depends(authorize)
):
    """
    UC-107: Performance Prediction and Forecasting
    Predict future job search outcomes based on historical data
    """
    try:
        user_id = uuid
        
        # Get user's historical data
        user_applications = await db_client[JOBS].find({"user_id": user_id}).to_list(None)
        user_interviews = await db_client[INFORMATIONAL_INTERVIEWS].find({"user_id": user_id}).to_list(None)
        user_salaries = await db_client[SALARY].find({"user_id": user_id}).to_list(None)
        
        # Generate predictions
        predictions = {
            "interview_success": predict_interview_success(user_interviews, user_applications),
            "job_search_timeline": predict_job_search_timeline(user_applications, user_interviews),
            "salary_negotiation": predict_salary_negotiation_outcomes(user_salaries, user_interviews),
            "optimal_timing": predict_optimal_career_timing(user_applications, user_interviews),
            "scenario_planning": generate_scenario_planning(user_applications, user_interviews, user_salaries),
            "improvement_recommendations": generate_improvement_recommendations(user_applications, user_interviews),
            "prediction_accuracy": calculate_prediction_accuracy(user_applications, user_interviews)
        }
        
        return {
            "success": True,
            "data": predictions,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating performance predictions: {str(e)}")

async def get_peer_benchmarks(user_id):
    """Get anonymous peer benchmark data"""
    try:
        # Get users with similar profiles (same industry, experience level)
        peer_users = await db_client[AUTH].find({
            "_id": {"$ne": ObjectId(user_id)},
            # Add criteria for similar profiles (industry, experience level, etc.)
            # This is simplified - would use actual profile matching
        }).limit(100).to_list(None)
        
        peer_data = {
            "applications": [],
            "interviews": [],
            "salaries": [],
            "skills": [],
            "career_data": []
        }
        
        for peer in peer_users:
            peer_id = str(peer["_id"])
            peer_applications = await db_client[JOBS].find({"user_id": peer_id}).to_list(None)
            peer_interviews = await db_client[INFORMATIONAL_INTERVIEWS].find({"user_id": peer_id}).to_list(None)
            peer_salaries = await db_client[SALARY].find({"user_id": peer_id}).to_list(None)
            peer_skills = await db_client[SKILLS].find({"user_id": peer_id}).to_list(None)
            
            peer_data["applications"].extend(peer_applications)
            peer_data["interviews"].extend(peer_interviews)
            peer_data["salaries"].extend(peer_salaries)
            peer_data["skills"].extend(peer_skills)
            
            # Career progression data
            career_entry = {
                "total_applications": len(peer_applications),
                "total_interviews": len(peer_interviews),
                "success_rate": len([app for app in peer_applications if app.get("status") == "accepted"]) / len(peer_applications) if peer_applications else 0,
                "interview_rate": len(peer_interviews) / len(peer_applications) if peer_applications else 0
            }
            peer_data["career_data"].append(career_entry)
        
        return peer_data
        
    except Exception as e:
        print(f"Error getting peer benchmarks: {e}")
        return {"applications": [], "interviews": [], "salaries": [], "skills": [], "career_data": []}

def analyze_job_search_performance(user_applications, peer_applications):
    """Compare job search performance against peers"""
    user_stats = calculate_application_stats(user_applications)
    peer_stats = calculate_application_stats(peer_applications)
    
    return {
        "user_performance": user_stats,
        "peer_benchmarks": {
            "average_applications_per_month": peer_stats["avg_applications_per_month"],
            "average_success_rate": peer_stats["success_rate"],
            "average_interview_rate": peer_stats["interview_rate"],
            "percentile_ranking": calculate_percentile_ranking(user_stats["success_rate"], 
                                                             [app["success_rate"] for app in peer_stats["individual_stats"]])
        },
        "performance_vs_peers": {
            "applications_volume": "above_average" if user_stats["avg_applications_per_month"] > peer_stats["avg_applications_per_month"] else "below_average",
            "success_rate": "above_average" if user_stats["success_rate"] > peer_stats["success_rate"] else "below_average",
            "interview_rate": "above_average" if user_stats["interview_rate"] > peer_stats["interview_rate"] else "below_average"
        }
    }

def analyze_competitive_positioning(user_id, user_skills, peer_skills):
    """Analyze competitive positioning based on skills and experience"""
    user_skill_count = len(user_skills) if user_skills else 0
    peer_skill_counts = [len(skills) for skills in peer_skills] if peer_skills else [0]
    
    # Skill categories analysis
    user_categories = set(skill.category for skill in user_skills) if user_skills else set()
    peer_categories = [set(skill.category for skill in skills) for skills in peer_skills] if peer_skills else [set()]
    
    return {
        "skills_competitiveness": {
            "total_skills": user_skill_count,
            "peer_average": statistics.mean(peer_skill_counts) if peer_skill_counts else 0,
            "skill_diversity": len(user_categories),
            "peer_average_diversity": statistics.mean([len(cats) for cats in peer_categories]) if peer_categories else 0
        },
        "experience_positioning": {
            "years_experience": calculate_years_experience(user_id),
            "industry_alignment": calculate_industry_alignment(user_id, user_skills)
        },
        "achievements_comparison": {
            "certifications": len([skill for skill in user_skills if skill.type == "certification"]) if user_skills else 0,
            "projects": len([skill for skill in user_skills if skill.type == "project"]) if user_skills else 0
        }
    }

def analyze_industry_standards(user_applications, peer_applications):
    """Monitor industry standards for application volume and success rates"""
    user_industry_stats = {}
    peer_industry_stats = {}
    
    # Group by industry
    for app in user_applications:
        industry = app.company_industry or "Unknown"
        if industry not in user_industry_stats:
            user_industry_stats[industry] = []
        user_industry_stats[industry].append(app)
    
    for app in peer_applications:
        industry = app.company_industry or "Unknown"
        if industry not in peer_industry_stats:
            peer_industry_stats[industry] = []
        peer_industry_stats[industry].append(app)
    
    industry_analysis = {}
    for industry in user_industry_stats:
        user_apps = user_industry_stats[industry]
        peer_apps = peer_industry_stats.get(industry, [])
        
        industry_analysis[industry] = {
            "user_success_rate": len([app for app in user_apps if app.status == "accepted"]) / len(user_apps) if user_apps else 0,
            "industry_success_rate": len([app for app in peer_apps if app.status == "accepted"]) / len(peer_apps) if peer_apps else 0,
            "user_application_volume": len(user_apps),
            "industry_average_volume": statistics.mean([len(peer_industry_stats.get(ind, [])) for ind in peer_industry_stats]) if peer_industry_stats else 0
        }
    
    return industry_analysis

def analyze_career_progression(user_applications, user_interviews, peer_career_data):
    """Track performance against successful career progression patterns"""
    user_progression = {
        "total_applications": len(user_applications),
        "total_interviews": len(user_interviews),
        "success_rate": len([app for app in user_applications if app.status == "accepted"]) / len(user_applications) if user_applications else 0,
        "interview_rate": len(user_interviews) / len(user_applications) if user_applications else 0
    }
    
    peer_success_patterns = {
        "average_success_rate": statistics.mean([data["success_rate"] for data in peer_career_data]) if peer_career_data else 0,
        "average_interview_rate": statistics.mean([data["interview_rate"] for data in peer_career_data]) if peer_career_data else 0,
        "top_performers_success_rate": statistics.quantile([data["success_rate"] for data in peer_career_data], 0.9) if peer_career_data else 0
    }
    
    return {
        "user_progression": user_progression,
        "peer_patterns": peer_success_patterns,
        "progression_assessment": "on_track" if user_progression["success_rate"] >= peer_success_patterns["average_success_rate"] else "needs_improvement",
        "time_to_success": calculate_time_to_success(user_applications)
    }

def analyze_skill_gaps(user_skills, peer_skills):
    """Include skill gap analysis compared to top performers"""
    user_skill_names = set(skill.name.lower() for skill in user_skills) if user_skills else set()
    
    # Find most common skills among peers
    all_peer_skills = []
    for skills in peer_skills:
        all_peer_skills.extend([skill.name.lower() for skill in skills])
    
    skill_frequency = {}
    for skill in all_peer_skills:
        skill_frequency[skill] = skill_frequency.get(skill, 0) + 1
    
    # Identify missing skills
    common_peer_skills = set(skill for skill, freq in skill_frequency.items() if freq > len(peer_skills) * 0.3)  # Skills held by 30%+ of peers
    missing_skills = common_peer_skills - user_skill_names
    
    # Identify in-demand skills
    in_demand_skills = set(skill for skill, freq in skill_frequency.items() if freq > len(peer_skills) * 0.5)  # Skills held by 50%+ of peers
    
    return {
        "current_skills": list(user_skill_names),
        "missing_common_skills": list(missing_skills),
        "in_demand_skills": list(in_demand_skills - user_skill_names),
        "skill_coverage_percentage": len(user_skill_names & common_peer_skills) / len(common_peer_skills) * 100 if common_peer_skills else 0,
        "recommended_skills_to_acquire": list(missing_skills)[:5]  # Top 5 missing skills
    }

def generate_competitive_recommendations(user_id, user_applications, user_skills, peer_data):
    """Generate recommendations for competitive advantage development"""
    recommendations = []
    
    # Application strategy recommendations
    app_stats = calculate_application_stats(user_applications)
    if app_stats["success_rate"] < 0.1:  # Less than 10% success rate
        recommendations.append({
            "type": "application_strategy",
            "priority": "high",
            "recommendation": "Focus on quality over quantity - tailor applications more carefully to job requirements",
            "expected_impact": "30-50% improvement in response rates"
        })
    
    # Skill development recommendations
    skill_gaps = analyze_skill_gaps(user_skills, peer_data["skills"])
    if len(skill_gaps["missing_common_skills"]) > 3:
        recommendations.append({
            "type": "skill_development",
            "priority": "medium",
            "recommendation": f"Consider acquiring these in-demand skills: {', '.join(skill_gaps['recommended_skills_to_acquire'][:3])}",
            "expected_impact": "Increased competitiveness in target market"
        })
    
    # Networking recommendations
    if len(user_applications) > 20 and app_stats["interview_rate"] < 0.2:
        recommendations.append({
            "type": "networking",
            "priority": "medium",
            "recommendation": "Leverage professional network to get referrals and increase interview opportunities",
            "expected_impact": "2-3x increase in interview rates"
        })
    
    return recommendations

def analyze_market_positioning(user_id, user_salaries, peer_salaries):
    """Provide insights on market positioning optimization"""
    user_salary_data = analyze_salary_progression(user_salaries) if user_salaries else {}
    peer_salary_data = analyze_salary_progression(peer_salaries) if peer_salaries else {}
    
    return {
        "salary_positioning": {
            "current_salary_range": user_salary_data.get("current_salary", 0),
            "peer_average": peer_salary_data.get("average_salary", 0),
            "market_percentile": calculate_salary_percentile(user_salary_data.get("current_salary", 0), 
                                                          [salary.get("current_salary", 0) for salary in peer_salary_data.get("individual_salaries", [])])
        },
        "positioning_suggestions": generate_positioning_suggestions(user_id, user_salary_data, peer_salary_data)
    }

def generate_differentiation_strategies(user_skills, peer_skills):
    """Provide differentiation strategies and unique value propositions"""
    user_unique_skills = find_unique_skills(user_skills, peer_skills)
    
    strategies = []
    
    if user_unique_skills:
        strategies.append({
            "strategy": "specialized_expertise",
            "description": f"Leverage your unique skills: {', '.join(user_unique_skills[:3])}",
            "implementation": "Highlight these specialized skills in resumes and interviews"
        })
    
    strategies.append({
        "strategy": "industry_specialization",
        "description": "Focus on specific industry niches where you have competitive advantage",
        "implementation": "Develop case studies and success stories in target industries"
    })
    
    return strategies

def predict_interview_success(user_interviews, user_applications):
    """Predict interview success probability based on preparation and historical performance"""
    if not user_interviews:
        return {
            "success_probability": 0.5,  # Default baseline
            "confidence_interval": [0.3, 0.7],
            "factors": ["insufficient_data"],
            "recommendations": ["Complete more interviews to improve prediction accuracy"]
        }
    
    # Calculate historical success rate
    successful_interviews = len([interview for interview in user_interviews if interview.outcome == "offer"])
    success_rate = successful_interviews / len(user_interviews)
    
    # Calculate confidence based on sample size
    confidence = min(0.95, len(user_interviews) / 20)  # More confidence with more data
    
    return {
        "success_probability": success_rate,
        "confidence_interval": [max(0, success_rate - (1 - confidence)), min(1, success_rate + (1 - confidence))],
        "factors": analyze_success_factors(user_interviews),
        "recommendations": generate_interview_recommendations(user_interviews)
    }

def predict_job_search_timeline(user_applications, user_interviews):
    """Forecast job search timeline based on current activity and market conditions"""
    if not user_applications:
        return {
            "estimated_timeline_days": 90,  # Industry average
            "confidence_level": "low",
            "factors": ["no_historical_data"],
            "recommendations": ["Start applying to jobs to generate timeline predictions"]
        }
    
    # Helper function to parse date_created field
    def parse_date_created(app):
        date_str = app.get("date_created")
        if not date_str:
            return datetime.utcnow()
        try:
            if isinstance(date_str, str):
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_str
        except:
            return datetime.utcnow()
    
    # Calculate application rate and success patterns
    now = datetime.utcnow()
    recent_applications = [app for app in user_applications if 
                          (now - parse_date_created(app)).days <= 30]
    application_rate = len(recent_applications) / 30 if recent_applications else 0
    
    # Calculate average time to success
    successful_applications = [app for app in user_applications if app.get("status") == "Offer"]
    if successful_applications:
        avg_time_to_success = statistics.mean([(now - parse_date_created(app)).days for app in successful_applications])
    else:
        avg_time_to_success = 60  # Industry average
    
    # Adjust based on current application rate
    if application_rate > 10:  # High activity
        predicted_timeline = avg_time_to_success * 0.8
    elif application_rate < 5:  # Low activity
        predicted_timeline = avg_time_to_success * 1.5
    else:
        predicted_timeline = avg_time_to_success
    
    return {
        "estimated_timeline_days": int(predicted_timeline),
        "confidence_level": "high" if len(user_applications) > 10 else "medium",
        "factors": [
            f"application_rate: {application_rate:.1f}/month",
            f"historical_success_time: {avg_time_to_success:.0f} days"
        ],
        "recommendations": generate_timeline_recommendations(application_rate, avg_time_to_success)
    }

def predict_salary_negotiation_outcomes(user_salaries, user_interviews):
    """Generate salary negotiation outcome predictions"""
    if not user_salaries:
        return {
            "negotiation_success_probability": 0.6,
            "expected_increase_percentage": 10,
            "confidence_level": "low",
            "factors": ["no_salary_history"],
            "recommendations": ["Research market rates and prepare negotiation strategy"]
        }
    
    # Analyze historical salary data
    salary_growth = calculate_salary_growth(user_salaries)
    negotiation_success_rate = calculate_negotiation_success_rate(user_interviews)
    
    predicted_success = negotiation_success_rate * (1 + salary_growth / 100)
    
    return {
        "negotiation_success_probability": min(0.95, predicted_success),
        "expected_increase_percentage": salary_growth + 5,  # Base growth plus negotiation premium
        "confidence_level": "high" if len(user_salaries) > 2 else "medium",
        "factors": [
            f"historical_growth: {salary_growth}%",
            f"negotiation_success_rate: {negotiation_success_rate}"
        ],
        "recommendations": generate_negotiation_recommendations(salary_growth, negotiation_success_rate)
    }

def predict_optimal_career_timing(user_applications, user_interviews):
    """Predict optimal timing for career moves and job search activities"""
    # Analyze seasonal patterns
    seasonal_data = analyze_seasonal_patterns(user_applications)
    
    # Current market conditions (simplified)
    current_month = datetime.utcnow().month
    optimal_months = [1, 2, 3, 9, 10]  # Jan-Mar, Sep-Oct typically strong hiring periods
    
    timing_score = 1.0 if current_month in optimal_months else 0.7
    
    return {
        "optimal_timing_score": timing_score,
        "best_months_to_apply": optimal_months,
        "current_month_assessment": "optimal" if current_month in optimal_months else "suboptimal",
        "recommendations": generate_timing_recommendations(current_month, seasonal_data)
    }

def generate_scenario_planning(user_applications, user_interviews, user_salaries):
    """Generate scenario planning for different job search strategies"""
    scenarios = {
        "aggressive_strategy": {
            "description": "High volume applications (15+/month)",
            "predicted_success_rate": 0.15,
            "estimated_timeline_days": 45,
            "required_effort": "high"
        },
        "targeted_strategy": {
            "description": "Quality-focused applications (5-10/month)",
            "predicted_success_rate": 0.25,
            "estimated_timeline_days": 60,
            "required_effort": "medium"
        },
        "passive_strategy": {
            "description": "Low volume applications (<5/month)",
            "predicted_success_rate": 0.08,
            "estimated_timeline_days": 120,
            "required_effort": "low"
        }
    }
    
    # Adjust scenarios based on user's historical performance
    user_success_rate = len([app for app in user_applications if app.status == "accepted"]) / len(user_applications) if user_applications else 0.1
    
    for scenario in scenarios.values():
        scenario["predicted_success_rate"] *= (user_success_rate / 0.1)  # Adjust based on user's performance
    
    return scenarios

def generate_improvement_recommendations(user_applications, user_interviews):
    """Provide recommendations for improving predicted outcomes"""
    recommendations = []
    
    # Application improvements
    app_success_rate = len([app for app in user_applications if app.status == "accepted"]) / len(user_applications) if user_applications else 0
    if app_success_rate < 0.1:
        recommendations.append({
            "area": "applications",
            "recommendation": "Improve resume tailoring and cover letter customization",
            "expected_improvement": "15-25% increase in response rates"
        })
    
    # Interview improvements
    if user_interviews:
        interview_success_rate = len([interview for interview in user_interviews if interview.outcome == "offer"]) / len(user_interviews)
        if interview_success_rate < 0.3:
            recommendations.append({
                "area": "interviews",
                "recommendation": "Practice mock interviews and develop STAR method responses",
                "expected_improvement": "20-30% increase in offer rates"
            })
    
    return recommendations

def calculate_prediction_accuracy(user_applications, user_interviews):
    """Track prediction accuracy and model improvement over time"""
    # This would typically compare past predictions with actual outcomes
    # For now, return placeholder data
    return {
        "model_accuracy": 0.75,  # 75% accuracy historically
        "sample_size": len(user_applications) + len(user_interviews),
        "confidence_level": "high" if (len(user_applications) + len(user_interviews)) > 20 else "medium",
        "improvement_trend": "increasing"
    }

# Helper functions
def calculate_application_stats(applications):
    if not applications:
        return {"avg_applications_per_month": 0, "success_rate": 0, "interview_rate": 0, "individual_stats": []}
    
    # Helper function to parse date_created field
    def parse_date_created(app):
        date_str = app.get("date_created")
        if not date_str:
            return datetime.utcnow()
        try:
            if isinstance(date_str, str):
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_str
        except:
            return datetime.utcnow()
    
    # Calculate monthly application rate
    app_dates = [parse_date_created(app) for app in applications]
    date_range = max(app_dates) - min(app_dates)
    months = max(1, date_range.days / 30)
    avg_applications_per_month = len(applications) / months
    
    # Calculate success and interview rates
    successful_apps = len([app for app in applications if app.get("status") == "Offer"])
    success_rate = successful_apps / len(applications)
    
    # Interview rate (simplified - would need actual interview data linkage)
    interview_rate = len([app for app in applications if app.get("status") == "Interview"]) / len(applications)
    
    return {
        "avg_applications_per_month": avg_applications_per_month,
        "success_rate": success_rate,
        "interview_rate": interview_rate,
        "individual_stats": []  # Would contain individual user stats for percentile calculation
    }

def calculate_percentile_ranking(user_value, peer_values):
    if not peer_values:
        return 50  # Default to 50th percentile
    
    sorted_values = sorted(peer_values)
    rank = sum(1 for val in sorted_values if val <= user_value)
    return (rank / len(sorted_values)) * 100

def calculate_years_experience(user_id):
    # Simplified calculation - would use actual employment history
    return 5  # Placeholder

def calculate_industry_alignment(user_id, user_skills):
    # Simplified alignment calculation
    return 0.8  # Placeholder

def calculate_time_to_success(applications):
    successful_apps = [app for app in applications if app.status == "accepted"]
    if not successful_apps:
        return None
    
    time_to_success = [(app.updated_at - app.created_at).days for app in successful_apps]
    return statistics.mean(time_to_success)

def find_unique_skills(user_skills, peer_skills):
    user_skill_names = set(skill.name.lower() for skill in user_skills) if user_skills else set()
    
    all_peer_skills = set()
    for skills in peer_skills:
        all_peer_skills.update([skill.name.lower() for skill in skills])
    
    return list(user_skill_names - all_peer_skills)

def analyze_salary_progression(salaries):
    if not salaries:
        return {"current_salary": 0, "average_salary": 0, "individual_salaries": []}
    
    current_salary = max([salary.base_salary for salary in salaries]) if salaries else 0
    average_salary = statistics.mean([salary.base_salary for salary in salaries]) if salaries else 0
    
    return {
        "current_salary": current_salary,
        "average_salary": average_salary,
        "individual_salaries": [{"current_salary": salary.base_salary} for salary in salaries]
    }

def calculate_salary_percentile(user_salary, peer_salaries):
    if not peer_salaries:
        return 50
    
    sorted_salaries = sorted(peer_salaries)
    rank = sum(1 for salary in sorted_salaries if salary <= user_salary)
    return (rank / len(sorted_salaries)) * 100

def generate_positioning_suggestions(user_id, user_salary_data, peer_salary_data):
    suggestions = []
    
    if user_salary_data.get("current_salary", 0) < peer_salary_data.get("average_salary", 0):
        suggestions.append("Consider targeting higher-paying roles or negotiate for better compensation")
    
    return suggestions

def analyze_success_factors(interviews):
    factors = []
    
    # Analyze what correlates with success
    successful_interviews = [interview for interview in interviews if interview.outcome == "offer"]
    if successful_interviews:
        factors.append("historical_success_pattern")
    
    return factors

def generate_interview_recommendations(interviews):
    recommendations = []
    
    if len(interviews) < 5:
        recommendations.append("Gain more interview experience to improve success rates")
    
    return recommendations

def generate_timeline_recommendations(application_rate, avg_time_to_success):
    recommendations = []
    
    if application_rate < 5:
        recommendations.append("Increase application volume to reduce job search timeline")
    
    return recommendations

def calculate_salary_growth(salaries):
    if len(salaries) < 2:
        return 5  # Default 5% growth
    
    # Calculate year-over-year growth
    sorted_salaries = sorted(salaries, key=lambda x: x.created_at)
    growth_rates = []
    
    for i in range(1, len(sorted_salaries)):
        prev_salary = sorted_salaries[i-1].base_salary
        curr_salary = sorted_salaries[i].base_salary
        if prev_salary > 0:
            growth_rate = ((curr_salary - prev_salary) / prev_salary) * 100
            growth_rates.append(growth_rate)
    
    return statistics.mean(growth_rates) if growth_rates else 5

def calculate_negotiation_success_rate(interviews):
    # Simplified calculation - would need actual negotiation data
    return 0.7  # 70% success rate

def generate_negotiation_recommendations(salary_growth, negotiation_success_rate):
    recommendations = []
    
    if negotiation_success_rate < 0.6:
        recommendations.append("Practice negotiation techniques and research market rates")
    
    return recommendations

def analyze_seasonal_patterns(applications):
    # Simplified seasonal analysis
    return {
        "spring_strength": 1.2,
        "summer_strength": 0.8,
        "fall_strength": 1.1,
        "winter_strength": 0.9
    }

def generate_timing_recommendations(current_month, seasonal_data):
    recommendations = []
    
    if current_month in [6, 7, 8]:  # Summer
        recommendations.append("Summer hiring is typically slower - consider fall for better opportunities")
    
    return recommendations
