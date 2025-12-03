"""
Offer Analysis & Scoring Engine for UC-083 Demo

Provides comprehensive offer analysis including:
- Offer scoring (how good is this offer vs market?)
- Negotiation readiness assessment
- Recommended focus areas for negotiation
- Position summary and recommendations

This module synthesizes market data, user profile, and offer details
to provide actionable intelligence for salary negotiation.
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass


@dataclass
class OfferScore:
    """Structured offer evaluation score."""
    total_score: int  # 0-100
    base_salary_score: int
    bonus_score: int
    equity_score: int
    benefits_score: int
    market_percentile: int  # Where offer ranks: 25, 50, 75, 90
    vs_median: str  # "below", "at", "above"
    improvement_potential: Dict[str, Any]  # What can be negotiated


@dataclass
class NegotiationFocus:
    """Recommended negotiation priorities."""
    primary: str  # Main item to focus on
    secondary: List[str]  # Secondary items
    reasoning: str  # Why these priorities
    talking_points_by_focus: Dict[str, List[str]]  # Points for each focus


def analyze_offer(
    offered_salary: int,
    offered_bonus: Optional[str] = None,
    offered_equity: Optional[str] = None,
    offered_benefits: Optional[Dict[str, Any]] = None,
    market_data: Optional[Dict[str, Any]] = None,
    user_experience: int = 5,
    role: str = "",
    company_size: str = "mid-size"
) -> Dict[str, Any]:
    """
    Comprehensive offer analysis.

    Analyzes an offer against market data and generates:
    - Offer score (0-100)
    - Percentile ranking
    - Negotiation recommendations
    - Improvement opportunities

    Args:
        offered_salary: Base salary offered (annual)
        offered_bonus: Annual bonus (% or amount)
        offered_equity: Equity/stock options
        offered_benefits: Benefits package dict
        market_data: Market research data with percentiles
        user_experience: Years of experience
        role: Job title/role
        company_size: Company size category

    Returns:
        dict: Comprehensive analysis with scores and recommendations
    """

    if not market_data or not offered_salary:
        return _fallback_analysis(offered_salary, role)

    median_salary = market_data.get("median_salary", 100000)
    percentile_25 = market_data.get("percentile_25", median_salary * 0.85)
    percentile_75 = market_data.get("percentile_75", median_salary * 1.25)
    percentile_90 = market_data.get("percentile_90", median_salary * 1.50)

    # Calculate salary score (primary component)
    salary_score = _calculate_salary_score(offered_salary, percentile_25, percentile_75, percentile_90)

    # Calculate other component scores
    bonus_score = _calculate_bonus_score(offered_bonus, median_salary)
    equity_score = _calculate_equity_score(offered_equity, company_size)
    benefits_score = _calculate_benefits_score(offered_benefits)

    # Weighted total (salary is most important)
    total_score = int(
        salary_score * 0.50 +
        bonus_score * 0.20 +
        equity_score * 0.15 +
        benefits_score * 0.15
    )

    # Determine market percentile
    if offered_salary >= percentile_90:
        percentile = 90
    elif offered_salary >= percentile_75:
        percentile = 75
    elif offered_salary >= median_salary:
        percentile = 50
    elif offered_salary >= percentile_25:
        percentile = 25
    else:
        percentile = 10

    # Determine vs median
    salary_diff = offered_salary - median_salary
    if salary_diff > 10000:
        vs_median = "above"
    elif salary_diff < -10000:
        vs_median = "below"
    else:
        vs_median = "at"

    # Calculate improvement potential
    improvement = {
        "salary_gap_to_median": max(0, median_salary - offered_salary),
        "salary_gap_to_p75": max(0, percentile_75 - offered_salary),
        "salary_gap_to_p90": max(0, percentile_90 - offered_salary),
        "potential_improvement_percent": round(
            ((percentile_75 - offered_salary) / offered_salary * 100) if offered_salary > 0 else 0,
            1
        ),
        "recommended_counter": _calculate_recommended_counter(
            offered_salary,
            percentile_75,
            percentile_90,
            user_experience
        )
    }

    return {
        "offer_score": total_score,
        "market_percentile": percentile,
        "vs_median": vs_median,
        "breakdown": {
            "salary": salary_score,
            "bonus": bonus_score,
            "equity": equity_score,
            "benefits": benefits_score
        },
        "improvement_potential": improvement,
        "score_interpretation": _interpret_score(total_score, percentile),
        "negotiation_recommendation": _get_negotiation_recommendation(total_score, percentile, vs_median)
    }


def calculate_negotiation_readiness(
    prep_data: Dict[str, Any],
    offer_score: int,
    user_experience: int = 5
) -> Dict[str, Any]:
    """
    Calculate negotiation readiness score.

    Evaluates how well-prepared the candidate is for negotiation based on:
    - Available talking points
    - Market data quality
    - Experience level
    - Preparation materials

    Args:
        prep_data: Generated negotiation prep data
        offer_score: Offer analysis score (0-100)
        user_experience: Years of professional experience

    Returns:
        dict: Readiness assessment with score and confidence
    """

    readiness_score = 0
    components = {}

    # Evaluate talking points (max 25 points)
    talking_points = prep_data.get("talking_points", [])
    if talking_points:
        tp_score = min(25, len(talking_points) * 5)
        components["talking_points"] = {
            "score": tp_score,
            "count": len(talking_points),
            "note": f"You have {len(talking_points)} strong talking points"
        }
        readiness_score += tp_score

    # Evaluate market data (max 25 points)
    market_data = prep_data.get("market_salary_data", {})
    if market_data and "median_salary" in market_data:
        market_score = 25
        components["market_data"] = {
            "score": market_score,
            "note": "Strong market data to support negotiations"
        }
        readiness_score += market_score

    # Evaluate scripts (max 20 points)
    scripts = prep_data.get("negotiation_scripts", [])
    if scripts:
        script_score = min(20, len(scripts) * 7)
        components["scripts"] = {
            "score": script_score,
            "count": len(scripts),
            "note": f"You have {len(scripts)} negotiation scripts prepared"
        }
        readiness_score += script_score

    # Evaluate confidence exercises (max 15 points)
    exercises = prep_data.get("confidence_exercises", [])
    if exercises:
        exercise_score = min(15, len(exercises) * 5)
        components["exercises"] = {
            "score": exercise_score,
            "count": len(exercises),
            "note": "Confidence exercises to practice before negotiation"
        }
        readiness_score += exercise_score

    # Experience level bonus (max 15 points)
    exp_score = min(15, (user_experience - 1) * 2)
    components["experience"] = {
        "score": exp_score,
        "years": user_experience,
        "note": f"{user_experience} years of experience gives you leverage"
    }
    readiness_score += exp_score

    # Cap at 100
    readiness_score = min(100, readiness_score)

    # Interpret readiness
    if readiness_score >= 85:
        interpretation = "Excellent - You're extremely well-prepared for negotiation"
        emoji = "🟢"
    elif readiness_score >= 70:
        interpretation = "Strong - You're well-prepared with solid materials"
        emoji = "🟡"
    elif readiness_score >= 50:
        interpretation = "Good - You have key materials, room to prepare more"
        emoji = "🟡"
    else:
        interpretation = "Fair - Consider reviewing materials before negotiation"
        emoji = "🔴"

    return {
        "readiness_score": readiness_score,
        "interpretation": interpretation,
        "emoji": emoji,
        "components": components,
        "advice": _get_readiness_advice(readiness_score, offer_score, user_experience)
    }


def generate_negotiation_focus(
    offer_score: int,
    market_percentile: int,
    talking_points: List[Dict[str, Any]],
    market_data: Optional[Dict[str, Any]] = None,
    user_experience: int = 5
) -> Dict[str, Any]:
    """
    Generate recommended negotiation focus areas.

    Determines what the candidate should prioritize negotiating based on:
    - How good/bad the offer is
    - Market data
    - Available talking points
    - Experience level

    Args:
        offer_score: Offer analysis score
        market_percentile: Where offer ranks in market
        talking_points: Generated talking points
        market_data: Market salary research
        user_experience: Years of experience

    Returns:
        dict: Recommended focus areas and talking points for each
    """

    focus = {
        "primary": None,
        "secondary": [],
        "reasoning": "",
        "action_items": []
    }

    # Determine primary focus based on offer quality
    if market_percentile < 25:
        focus["primary"] = "Base Salary"
        focus["reasoning"] = "Your offer is significantly below market median. Focus negotiation on increasing base salary."
        focus["action_items"] = [
            "Lead with market research data",
            "Request 10-15% increase to reach market median",
            "Use comparable company data"
        ]
        focus["secondary"] = ["Signing Bonus", "Equity"]
        focus["urgency"] = "HIGH"
        focus["emoji"] = "⚠️"

    elif market_percentile < 50:
        focus["primary"] = "Base Salary"
        focus["reasoning"] = "Your offer is below market median. Negotiate base salary to market rate."
        focus["action_items"] = [
            "Reference market median data",
            "Request 5-10% increase",
            "Also negotiate signing bonus"
        ]
        focus["secondary"] = ["Signing Bonus", "Benefits"]
        focus["urgency"] = "MEDIUM"
        focus["emoji"] = "🟡"

    elif market_percentile < 75:
        focus["primary"] = "Equity or Signing Bonus"
        focus["reasoning"] = "Your base salary is competitive. Focus on non-salary components."
        focus["action_items"] = [
            "Negotiate equity/stock options",
            "Request signing bonus or performance bonus",
            "Optimize benefits package"
        ]
        focus["secondary"] = ["Benefits", "Remote Flexibility"]
        focus["urgency"] = "LOW"
        focus["emoji"] = "🟢"

    else:
        focus["primary"] = "Benefits and Flexibility"
        focus["reasoning"] = "Your offer is excellent. Fine-tune non-salary benefits."
        focus["action_items"] = [
            "Confirm equity vesting schedule",
            "Negotiate remote/flexible work",
            "Discuss professional development budget"
        ]
        focus["secondary"] = []
        focus["urgency"] = "LOW"
        focus["emoji"] = "🟢"

    # Add relevant talking points for primary focus
    focus["talking_points_for_focus"] = []
    for point in talking_points:
        if focus["primary"].lower() in str(point).lower():
            focus["talking_points_for_focus"].append(point)

    return focus


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _calculate_salary_score(salary: int, p25: int, p50: int, p75: int) -> int:
    """Calculate salary component score (0-100)."""
    if salary >= p75:
        return 100
    elif salary >= p50:
        return int(50 + ((salary - p50) / (p75 - p50) * 50))
    elif salary >= p25:
        return int(((salary - p25) / (p50 - p25) * 50))
    else:
        return int((salary / p25) * 25)


def _calculate_bonus_score(bonus: Optional[str], median: int) -> int:
    """Calculate bonus component score (0-100)."""
    if not bonus:
        return 30

    try:
        if "%" in str(bonus):
            percent = float(str(bonus).strip("%"))
            # 20% is excellent, 10% is average, 0% is poor
            return min(100, int((percent / 20) * 100))
        elif "$" in str(bonus) or str(bonus).isdigit():
            amount = int(str(bonus).replace("$", "").replace(",", ""))
            # 20% of median is excellent
            return min(100, int((amount / (median * 0.20)) * 100))
    except:
        pass

    return 50


def _calculate_equity_score(equity: Optional[str], company_size: str) -> int:
    """Calculate equity component score (0-100)."""
    if not equity:
        return 0 if company_size == "startup" else 40

    # Startup with equity is great
    if company_size == "startup":
        return 80

    # Established company with equity is good
    return 60


def _calculate_benefits_score(benefits: Optional[Dict[str, Any]]) -> int:
    """Calculate benefits package score (0-100)."""
    if not benefits:
        return 50

    score = 0
    max_points = 0

    # PTO days (max 30 points)
    if "pto_days" in benefits:
        pto = benefits["pto_days"]
        if isinstance(pto, int):
            if pto >= 20:
                score += 30
            elif pto >= 15:
                score += 25
            elif pto >= 10:
                score += 15
            else:
                score += 10
    max_points += 30

    # Remote flexibility (max 30 points)
    if "remote_flexibility" in benefits:
        remote = str(benefits["remote_flexibility"]).lower()
        if "full" in remote or "100" in remote:
            score += 30
        elif "flexible" in remote or "hybrid" in remote:
            score += 20
        else:
            score += 10
    max_points += 30

    # Other benefits (max 40 points)
    other = benefits.get("other_benefits", [])
    if isinstance(other, list):
        score += min(40, len(other) * 5)
    max_points += 40

    return min(100, int((score / max_points * 100) if max_points > 0 else 50))


def _calculate_recommended_counter(salary: int, p75: int, p90: int, experience: int) -> str:
    """Calculate recommended counter-offer amount."""
    # Based on experience level and market position
    if experience < 2:
        target = p75
    elif experience < 5:
        target = max(salary, (p75 + salary) / 2)
    else:
        target = p75

    # Round to nearest 5k
    target = int((target / 5000)) * 5000

    return f"${target:,}"


def _interpret_score(score: int, percentile: int) -> str:
    """Interpret offer score."""
    if score >= 85:
        return "Excellent offer - Competitive with market"
    elif score >= 70:
        return "Good offer - Acceptable, room for negotiation"
    elif score >= 50:
        return "Fair offer - Below market, negotiate"
    else:
        return "Below market - Significant negotiation opportunity"


def _get_negotiation_recommendation(score: int, percentile: int, vs_median: str) -> str:
    """Get negotiation recommendation based on offer analysis."""
    if percentile < 25:
        return "This offer is significantly below market. Strongly recommend negotiating for base salary increase."
    elif percentile < 50:
        return "This offer is below market median. Recommend negotiating base salary and signing bonus."
    elif percentile < 75:
        return "This offer is competitive. Consider negotiating non-salary benefits."
    else:
        return "Excellent offer at or above market rate. Fine-tune benefits if needed."


def _get_readiness_advice(readiness_score: int, offer_score: int, experience: int) -> str:
    """Get personalized advice based on readiness."""
    advice = []

    if readiness_score < 50:
        advice.append("⚠️ Review the negotiation scripts before your call")

    if offer_score < 50:
        advice.append("💪 Use the market data and talking points aggressively")

    if experience < 3:
        advice.append("💡 Remember: many companies expect negotiation. Don't be afraid to ask")

    if readiness_score >= 85:
        advice.append("✅ You're ready! Approach negotiation with confidence")

    return " | ".join(advice) if advice else "You're well-prepared for negotiation"


def _fallback_analysis(salary: int, role: str) -> Dict[str, Any]:
    """Return analysis when market data unavailable."""
    return {
        "offer_score": 50,
        "market_percentile": 50,
        "vs_median": "at",
        "breakdown": {
            "salary": 50,
            "bonus": 40,
            "equity": 40,
            "benefits": 50
        },
        "improvement_potential": {
            "note": "Market data unavailable - consider researching independently"
        },
        "score_interpretation": "Unable to evaluate without market data",
        "negotiation_recommendation": "Research market rates for this role and location before negotiating"
    }
