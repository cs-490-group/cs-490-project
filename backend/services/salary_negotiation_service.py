"""
Salary Negotiation Preparation Service

Generates comprehensive salary negotiation materials including:
- Market research data
- Talking points
- Negotiation scripts
- Counter-offer templates
- Confidence building exercises
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from .salary_research import (
    research_market_salary,
    generate_negotiation_talking_points,
    generate_negotiation_scripts,
    generate_counter_offer_templates,
    generate_confidence_exercises,
    generate_negotiation_warnings
)

async def generate_full_negotiation_prep(
    job_id: str,
    role: str,
    company: str,
    location: str,
    offered_salary: int,
    years_of_experience: int = 5,
    achievements: Optional[List[str]] = None,
    company_size: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate complete salary negotiation preparation materials

    Args:
        job_id: Reference to job posting
        role: Job title
        company: Company name
        location: Job location
        offered_salary: Offered salary amount
        years_of_experience: Candidate's experience level
        achievements: List of key achievements
        company_size: Company size (startup, mid-size, enterprise)

    Returns:
        Complete NegotiationPrep dict with all materials
    """
    try:
        print(f"🔍 Generating salary negotiation prep for {role} at {company}")

        # 1. Research market salary
        print("📊 Researching market salary data...")
        market_salary_data = await research_market_salary(
            role=role,
            location=location,
            years_of_experience=years_of_experience,
            company=company,
            company_size=company_size
        )

        # 2. Generate talking points
        print("💬 Generating negotiation talking points...")
        talking_points = await generate_negotiation_talking_points(
            role=role,
            company=company,
            location=location,
            years_of_experience=years_of_experience,
            achievements=achievements,
            market_salary=market_salary_data
        )

        # 3. Generate negotiation scripts
        print("📝 Creating negotiation scripts...")
        negotiation_scripts = await generate_negotiation_scripts(
            role=role,
            company=company,
            offered_salary=offered_salary,
            market_salary=market_salary_data
        )

        # 4. Generate counter-offer templates
        print("📋 Building counter-offer templates...")
        counter_offer_templates = await generate_counter_offer_templates(
            offered_salary=offered_salary,
            market_salary=market_salary_data
        )

        # 5. Generate confidence exercises
        print("💪 Preparing confidence exercises...")
        confidence_exercises = await generate_confidence_exercises()

        # 6. Get common mistakes and red flags
        print("⚠️ Compiling warnings and best practices...")
        warnings = await generate_negotiation_warnings()

        # 7. Generate timing strategy
        timing_strategy = generate_timing_strategy(years_of_experience)

        # 8. Generate power dynamics analysis
        power_dynamics = generate_power_dynamics_analysis(company_size)

        # 9. Generate best practices
        best_practices = generate_best_practices()

        # 10. Generate executive summary
        executive_summary = generate_executive_summary(
            role=role,
            company=company,
            offered_salary=offered_salary,
            market_salary=market_salary_data
        )

        # Compile everything
        negotiation_prep = {
            "job_id": job_id,
            "role": role,
            "company": company,
            "location": location,
            "market_salary_data": market_salary_data,
            "talking_points": talking_points,
            "negotiation_scripts": negotiation_scripts,
            "counter_offer_templates": counter_offer_templates,
            "timing_strategy": timing_strategy,
            "power_dynamics_analysis": power_dynamics,
            "best_practices": best_practices,
            "confidence_exercises": confidence_exercises,
            "common_mistakes": warnings.get("common_mistakes", []),
            "red_flags": warnings.get("red_flags", []),
            "executive_summary": executive_summary,
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by_model": "cohere-command-r-plus"
        }

        print("✅ Salary negotiation prep generated successfully!")
        return negotiation_prep

    except Exception as e:
        print(f"❌ Error generating negotiation prep: {str(e)}")
        raise

def generate_timing_strategy(years_of_experience: int) -> str:
    """Generate timing strategy based on experience level"""
    if years_of_experience < 2:
        return """TIMING STRATEGY (Entry Level):
- Negotiate early in the offer stage
- Many entry-level positions have less flexibility, so focus on total package
- Ask for equity, signing bonus, or additional PTO if base salary is fixed
- Wait until written offer to negotiate (shows professionalism)
- Respond within 24-48 hours of receiving offer"""
    elif years_of_experience < 5:
        return """TIMING STRATEGY (Mid Level):
- Open negotiations within 24 hours of receiving offer
- Frame negotiation positively: "I'm excited about the role and want to discuss..."
- Negotiate before accepting to have maximum leverage
- Come prepared with your research and data
- Give them 2-3 business days to respond to your counter-offer"""
    else:
        return """TIMING STRATEGY (Senior Level):
- You have the most leverage - use it strategically
- Delay accepting for 3-5 days to show you're considering carefully
- Negotiate multiple aspects of the package (salary, bonus, equity, flexibility)
- Reference your experience and track record
- Be prepared to walk away if offer doesn't meet minimum requirements
- Consider negotiating after accepting (rare but possible for senior roles)"""

def generate_power_dynamics_analysis(company_size: Optional[str]) -> str:
    """Generate power dynamics analysis"""
    size = company_size or "unknown"
    if size.lower() == "startup":
        return """POWER DYNAMICS - STARTUP:
YOUR LEVERAGE:
- You're likely solving a critical problem for them
- Startups move fast and want to move quickly on hiring
- Equity can be significant if company performs well
- You can negotiate flexibility and impact opportunities

THEIR LEVERAGE:
- May have less capital for salaries
- Multiple candidates competing for the role
- Limited benefits structure
- Early-stage uncertainty

STRATEGY: Focus on impact, equity upside, and flexibility. Be realistic about salary but optimize other areas."""
    elif size.lower() == "enterprise":
        return """POWER DYNAMICS - ENTERPRISE:
YOUR LEVERAGE:
- Large companies have structured compensation
- They expect and budget for negotiation
- Your experience is valuable to them
- You may have competing offers from other enterprises

THEIR LEVERAGE:
- Large applicant pools
- Structured salary bands (but some flexibility)
- Strong benefits packages
- Slower hiring processes

STRATEGY: Reference industry standards and competing offers. Focus on your unique value and fit."""
    else:
        return """POWER DYNAMICS - MID-SIZE:
YOUR LEVERAGE:
- Growing companies often have salary flexibility
- You're likely helping them scale
- You may have niche expertise they need
- Faster decision-making than enterprise

THEIR LEVERAGE:
- More candidates than startups
- Some budget constraints
- Established processes
- Growth uncertainty

STRATEGY: Balance between startup negotiation (impact/flexibility) and enterprise (market data/standards)."""

def generate_best_practices() -> List[str]:
    """Generate best practices for salary negotiation"""
    return [
        "Always negotiate - even small improvements matter (1% raise = $1000/year on $100k)",
        "Do your research - know market rates before negotiations",
        "Never accept the first offer without countering",
        "Always negotiate before accepting - harder after accepting",
        "Focus on 'win-win' language - you want the company to feel good about the deal",
        "Anchor your negotiation with market data, not personal needs",
        "Get everything in writing - verbal agreements aren't binding",
        "Negotiate the full package - base, bonus, equity, benefits, flexibility",
        "Be prepared to walk away - best negotiating position is being willing to leave",
        "Stay professional and respectful throughout - you may work with them for years",
        "Don't negotiate via email alone - have a phone call for important discussions",
        "Ask for time to think - never feel pressured to accept immediately",
        "Practice your talking points before the conversation",
        "Listen more than you talk - understand their constraints and priorities",
        "Be specific in your counter-offers - vague requests get vague responses"
    ]

def generate_executive_summary(
    role: str,
    company: str,
    offered_salary: int,
    market_salary: Dict[str, Any]
) -> str:
    """Generate executive summary of negotiation position"""
    median = market_salary.get('median_salary', offered_salary)
    percentile_75 = market_salary.get('percentile_75', offered_salary)
    percentile_90 = market_salary.get('percentile_90', offered_salary)
    trend = market_salary.get('salary_trend', 'unknown')

    gap_from_median = ((offered_salary - median) / median * 100) if median > 0 else 0
    gap_from_75 = ((offered_salary - percentile_75) / percentile_75 * 100) if percentile_75 > 0 else 0

    summary = f"""EXECUTIVE SUMMARY - SALARY NEGOTIATION POSITION

Role: {role}
Company: {company}
Offered Salary: ${offered_salary:,}

MARKET CONTEXT:
- Market Median: ${median:,} ({gap_from_median:+.1f}% vs. offer)
- 75th Percentile: ${percentile_75:,} ({gap_from_75:+.1f}% vs. offer)
- 90th Percentile: ${percentile_90:,}
- Market Trend: {trend}

NEGOTIATION POSITION:
"""

    if gap_from_median > 5:
        summary += "✅ Your offer is ABOVE market median - strong position\n"
    elif gap_from_median > -5:
        summary += "✓ Your offer is IN LINE with market median - fair position\n"
    else:
        summary += "⚠️ Your offer is BELOW market median - negotiate strongly\n"

    summary += f"""
RECOMMENDED APPROACH:
1. Research completed - you have data to support negotiations
2. Review talking points tailored to your experience
3. Practice negotiation scripts before conversations
4. Prioritize counter-offers from highest to lowest impact
5. Be prepared to walk away if demands aren't met

Remember: You have more leverage than you think. Companies expect negotiation."""

    return summary
