import json
import os
import cohere
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()
co = cohere.Client(os.getenv("COHERE_API_KEY"))


async def call_cohere_api(prompt: str) -> str:
    """Call Cohere API using the client"""
    try:
        response = co.chat(message=prompt)
        text = getattr(response, "text", None)

        if not text:
            raise Exception("Cohere returned no text")

        return text
    except Exception as e:
        raise Exception(f"Cohere API error: {str(e)}")


async def research_market_salary(
    role: str,
    location: str,
    years_of_experience: int,
    company: Optional[str] = None,
    company_size: Optional[str] = None
) -> Dict[str, Any]:
    """Research market salary data for a specific role and location using Cohere AI"""
    try:
        prompt = f"""Research market salary data for the following role and provide ONLY valid JSON output:
Role: {role}
Location: {location}
Years of Experience: {years_of_experience}
Company: {company or 'Not specified'}
Company Size: {company_size or 'Not specified'}

Return a JSON object with EXACTLY the following structure:
{{
  "median_salary": <number>,
  "percentile_25": <number>,
  "percentile_75": <number>,
  "percentile_90": <number>,
  "industry_average": <number>,
  "salary_trend": "<string>",
  "comparable_companies": ["<company1>", "<company2>"],
  "company_size_factor": "<string>"
}}

Rules:
- ALL FIELDS MUST BE FILLED. Never leave empty values.
- Use accurate, factual salary data when available.
- If something is not public, write a reasonable estimate, not empty.
- comparable_companies must be real companies.
- NO extra fields.
- NO markdown.
- ONLY return clean JSON."""

        response_text = await call_cohere_api(prompt)

        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        salary_data = json.loads(clean)
        return salary_data

    except Exception as e:
        print(f"Error researching market salary: {str(e)}")
        return {
            "median_salary": 100000,
            "percentile_25": 90000,
            "percentile_75": 120000,
            "percentile_90": 140000,
            "industry_average": 105000,
            "salary_trend": "Stable",
            "comparable_companies": [],
            "company_size_factor": "Standard"
        }


async def generate_negotiation_talking_points(
    role: str = "",
    company: str = "",
    location: str = "",
    years_of_experience: int = 0,
    achievements: Optional[list] = None,
    market_salary: Optional[Dict[str, Any]] = None
) -> list:
    """Generate negotiation talking points based on candidate's achievements and market data"""
    try:
        # Prepare achievements text
        achievements_text = ""
        if achievements and len(achievements) > 0:
            achievements_text = "\n\nCandidate's Key Achievements:\n" + "\n".join([f"- {a}" for a in achievements[:5]])

        # Prepare market data context
        market_context = ""
        if market_salary:
            median = market_salary.get("median_salary", "market median")
            percentile_90 = market_salary.get("percentile_90", "top 10%")
            market_context = f"\n\nMarket Context:\n- Median salary for this role: ${median:,}\n- 90th percentile: ${percentile_90:,}"

        prompt = f"""You are an expert salary negotiation coach. Generate 5 highly personalized and specific talking points for salary negotiation at {company}.

Role: {role}
Company: {company}
Location: {location}
Years of Experience: {years_of_experience}{achievements_text}{market_context}

Create talking points that:
1. SPECIFICALLY mention {company} and the role
2. Reference the candidate's actual achievements and experience
3. Address what {company} values in this role
4. Use concrete market data to support higher compensation requests
5. Show clear ROI for {company} hiring this candidate

Return ONLY a valid JSON array of 5 strings. Each point should be 1-2 sentences:
["Point 1 specific to {company} and candidate", "Point 2 specific to {company} and candidate", ...]

Rules:
- MUST personalize to {company} - not generic
- Reference candidate achievements where provided
- Include specific numbers/percentages from market data
- Make each point compelling and negotiation-focused
- Return EXACTLY 5 points in clean JSON array
- NO markdown, NO extra text
- ONLY return the JSON array"""

        response_text = await call_cohere_api(prompt)

        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "[" in clean:
            clean = clean[clean.find("["):]
        if "]" in clean:
            clean = clean[:clean.rfind("]") + 1]

        data = json.loads(clean)
        return data if isinstance(data, list) else ["Point not available"]

    except Exception as e:
        print(f"Error generating talking points: {str(e)}")
        return ["Research market rates for this role", "Highlight relevant experience", "Discuss market demand for skills", "Propose performance-based increases", "Consider total compensation package"]


async def generate_total_compensation_framework(
    job_title: str,
    company: str,
    market_salary: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate total compensation framework"""
    try:
        prompt = f"""For a {job_title} position at {company}, create a comprehensive total compensation framework.
Consider the following components and provide realistic estimates for the industry:

Return as JSON with this exact structure:
{{
  "base_salary": {{"description": "<description>", "percentage": 60}},
  "bonus": {{"description": "<description>", "percentage": 15}},
  "benefits": {{"description": "<description>", "percentage": 15}},
  "equity": {{"description": "<description>", "percentage": 10}},
  "total_compensation_note": "<explanation of how these add up>"
}}

Rules:
- All percentages must total 100
- Make percentages realistic for this industry
- NO markdown or extra text.
- ONLY return clean JSON."""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        return json.loads(clean)
    except Exception as e:
        print(f"Error generating compensation framework: {str(e)}")
        return {
            "base_salary": {"description": "Core salary component", "percentage": 60},
            "bonus": {"description": "Annual performance bonus (typically 10-20% of salary)", "percentage": 15},
            "benefits": {"description": "Health insurance, 401k, PTO, etc.", "percentage": 15},
            "equity": {"description": "Stock options or equity grants", "percentage": 10},
            "total_compensation_note": "Total compensation accounts for salary, bonus, benefits, and equity"
        }


async def generate_negotiation_scripts(
    job_title: str,
    company: str,
    location: str = "",
    market_salary: Optional[Dict[str, Any]] = None,
    offered_salary: Optional[int] = None
) -> Dict[str, str]:
    """Generate detailed, company-personalized negotiation scripts for different scenarios"""
    try:
        # Add market context if available
        market_context = ""
        if market_salary and offered_salary:
            median = market_salary.get("median_salary", 0)
            p90 = market_salary.get("percentile_90", 0)
            market_context = f"""
Market Context for Negotiation:
- Role {job_title} median salary in {location}: ${median:,}
- 90th percentile: ${p90:,}
- Your offer: ${offered_salary:,}
- Your offer is {'ABOVE' if offered_salary >= p90 else 'at' if offered_salary >= median else 'BELOW'} market median"""

        prompt = f"""You are a senior salary negotiation coach. Create DETAILED, company-specific negotiation scripts for a {job_title} role at {company} in {location}.{market_context}

Generate 3 critical scenarios with realistic dialogue. Each script should be detailed (3-4 sentences) and specifically reference {company} and the {job_title} role.

Return as JSON with this structure:
{{
  "initial_offer_response": "<Detailed response when receiving initial offer - acknowledge, express enthusiasm, ask for time to review, mention research>",
  "counteroffer_request": "<Request for higher salary with specific references to market data and value. 3-4 sentences with concrete reasoning>",
  "benefits_negotiation": "<Script for negotiating benefits/equity if salary is fixed. Reference specific benefits valuable for this role>"
}}

Rules:
- Reference {company} specifically - not generic
- Each script should be 3-4 sentences with concrete details
- Scripts should feel natural and professional
- For counteroffer_request: mention market research, your experience, value to {company}
- NO markdown or extra text
- ONLY return clean JSON"""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        return json.loads(clean)
    except Exception as e:
        print(f"Error generating negotiation scripts: {str(e)}")
        return {
            "initial_offer_response": "Thank you for the offer. I'm genuinely excited about this opportunity to join your team. I'd like to thoroughly review the complete compensation package and do some market research - can I get back to you within 48 hours?",
            "counteroffer_request": "Based on my research and experience, I'd like to discuss the compensation package for this role. Would you have flexibility to adjust the base salary closer to the market median for this position?",
            "benefits_negotiation": "If the base salary is at its maximum, I'd love to discuss other valuable components like additional PTO, flexible work arrangements, or a professional development budget."
        }


async def generate_counteroffer_template(
    job_title: str,
    company: str,
    market_salary: Optional[Dict[str, Any]] = None,
    offered_salary: Optional[int] = None
) -> Dict[str, Any]:
    """Generate counteroffer evaluation template with market context and specific guidance"""
    try:
        # Build market context for the prompt
        market_context = ""
        if market_salary and offered_salary:
            median = market_salary.get("median_salary", 0)
            p75 = market_salary.get("percentile_75", 0)
            p90 = market_salary.get("percentile_90", 0)

            if offered_salary < median:
                gap_info = f"Your offer (${offered_salary:,}) is ${median - offered_salary:,} below market median (${median:,})"
            elif offered_salary < p75:
                gap_info = f"Your offer (${offered_salary:,}) is below 75th percentile (${p75:,})"
            else:
                gap_info = f"Your offer (${offered_salary:,}) is competitive"

            market_context = f"""
Current Offer Context:
{gap_info}
- 75th percentile for {job_title}: ${p75:,}
- 90th percentile: ${p90:,}

Use these benchmarks when evaluating counteroffer importance."""

        prompt = f"""Create a detailed counteroffer evaluation template for a {job_title} position at {company}.{market_context}

Generate the compensation components that should be prioritized for this specific role, ordered by importance.
For a {job_title} at {company}, determine which components are most valuable and negotiable.

Return as JSON with this structure:
{{
  "offer_comparison_fields": [
    {{"field": "ComponentName", "importance": "Critical|High|Medium"}},
    ...
  ],
  "evaluation_note": "<Specific guidance for this role and company>"
}}

Rules:
- Order by importance and negotiability for this specific role
- Include 8-10 realistic components for a {job_title}
- Consider what matters for {job_title} roles in this industry
- NO markdown or extra text
- ONLY return clean JSON"""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "{" in clean:
            clean = clean[clean.find("{"):]
        if "}" in clean:
            clean = clean[:clean.rfind("}") + 1]

        return json.loads(clean)
    except Exception as e:
        print(f"Error generating counteroffer template: {str(e)}")
        return {
            "offer_comparison_fields": [
                {"field": "Base Salary", "importance": "Critical"},
                {"field": "Signing Bonus", "importance": "High"},
                {"field": "Annual Bonus/Target Bonus", "importance": "High"},
                {"field": "Equity/Stock Options", "importance": "High"},
                {"field": "Health Insurance Coverage", "importance": "High"},
                {"field": "Retirement (401k/Match)", "importance": "High"},
                {"field": "PTO Days", "importance": "Medium"},
                {"field": "Remote Work Flexibility", "importance": "Medium"},
                {"field": "Professional Development Budget", "importance": "Medium"},
                {"field": "Career Growth Path", "importance": "Medium"}
            ],
            "evaluation_note": "Prioritize Base Salary if below market median, then Signing Bonus, then other components"
        }


async def generate_confidence_exercises(
    job_title: str,
    company: str
) -> list:
    """Generate confidence building exercises"""
    try:
        prompt = f"""Create 3 confidence-building exercises for negotiating a {job_title} offer at {company}.
These should be practical, actionable exercises someone can do before their negotiation conversation.

Return as JSON array like:
[
  {{"title": "<Exercise Title>", "description": "<How to do it>", "time": "<Time required>"}},
  {{"title": "<Exercise Title>", "description": "<How to do it>", "time": "<Time required>"}},
  {{"title": "<Exercise Title>", "description": "<How to do it>", "time": "<Time required>"}}
]

Rules:
- Each exercise should be practical and doable before the call
- Include time estimates
- Make them confidence-boosting
- NO markdown or extra text.
- ONLY return clean JSON array."""

        response_text = await call_cohere_api(prompt)
        clean = response_text.replace("```json", "").replace("```", "").strip()

        if "[" in clean:
            clean = clean[clean.find("["):]
        if "]" in clean:
            clean = clean[:clean.rfind("]") + 1]

        return json.loads(clean) if json.loads(clean) else []
    except Exception as e:
        print(f"Error generating confidence exercises: {str(e)}")
        return [
            {"title": "Practice Your Pitch", "description": "Record yourself explaining why you deserve the salary you're asking for. Watch it back and refine.", "time": "15 minutes"},
            {"title": "Role Play", "description": "Ask a friend or mentor to role play as the hiring manager. Practice your negotiation conversation.", "time": "20 minutes"},
            {"title": "Research Success Stories", "description": "Read 2-3 articles about successful salary negotiations. Build your confidence with real examples.", "time": "10 minutes"}
        ]


async def generate_job_salary_negotiation(
    job_title: str,
    company: str,
    location: str,
    company_size: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate comprehensive salary negotiation research for a specific job posting.
    Includes market data, talking points, timing, scripts, templates, and exercises.
    """
    try:
        # Research market salary data for this role
        market_data = await research_market_salary(
            role=job_title,
            location=location,
            years_of_experience=3,
            company=company,
            company_size=company_size
        )

        # Generate basic talking points
        talking_points = await generate_negotiation_talking_points(
            role=job_title,
            company=company,
            location=location,
            years_of_experience=3,
            achievements=[]
        )

        # Generate timing strategy
        timing_prompt = f"""Provide a brief salary negotiation timing strategy for a {job_title} role at {company} in {location}.
Include best times to discuss salary and how to approach the conversation. Keep it concise (2-3 paragraphs).
NO markdown or extra formatting. Return only plain text."""

        timing_strategy = await call_cohere_api(timing_prompt)

        # Generate best practices
        practices_prompt = f"""Generate 5 best practices for negotiating salary for a {job_title} position at {company}.
Return as a numbered list like:
1. Practice 1
2. Practice 2
3. Practice 3
4. Practice 4
5. Practice 5

Rules:
- Return exactly 5 practices.
- Use numbered list format.
- NO markdown or extra text."""

        practices_text = await call_cohere_api(practices_prompt)

        best_practices = []
        for line in practices_text.split('\n'):
            if line.strip() and line.strip()[0].isdigit():
                practice = line.split('. ', 1)[-1].strip() if '. ' in line else line.strip()
                if practice and practice not in ["", "."]:
                    best_practices.append(practice)

        # Generate total compensation framework
        compensation_framework = await generate_total_compensation_framework(
            job_title, company, market_data
        )

        # Generate negotiation scripts
        negotiation_scripts = await generate_negotiation_scripts(
            job_title, company, location
        )

        # Generate counteroffer evaluation template
        counteroffer_template = await generate_counteroffer_template(
            job_title, company
        )

        # Generate confidence building exercises
        confidence_exercises = await generate_confidence_exercises(
            job_title, company
        )

        return {
            "job_title": job_title,
            "company": company,
            "location": location,
            "market_data": market_data,
            "talking_points": talking_points[:5],
            "timing_strategy": timing_strategy,
            "best_practices": best_practices,
            "compensation_framework": compensation_framework,
            "negotiation_scripts": negotiation_scripts,
            "counteroffer_template": counteroffer_template,
            "confidence_exercises": confidence_exercises
        }

    except Exception as e:
        print(f"Error generating job salary negotiation: {str(e)}")
        return {
            "error": "Failed to generate salary negotiation research",
            "details": str(e),
            "market_data": {
                "median_salary": 100000,
                "percentile_25": 90000,
                "percentile_75": 120000,
                "percentile_90": 140000,
                "industry_average": 105000,
                "salary_trend": "Stable",
                "comparable_companies": [],
                "company_size_factor": "Standard"
            },
            "talking_points": ["Research market rates", "Highlight experience", "Discuss demand"],
            "timing_strategy": "Discuss salary after initial offer and before final decision",
            "best_practices": ["Do your research", "Know your worth", "Be professional"],
            "compensation_framework": {},
            "negotiation_scripts": {},
            "counteroffer_template": {},
            "confidence_exercises": []
        }
