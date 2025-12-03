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

        prompt = f"""You are a salary negotiation expert. Generate 5 personalized and specific talking points for salary negotiation.

Role: {role}
Company: {company}
Location: {location}
Years of Experience: {years_of_experience}{achievements_text}{market_context}

Generate talking points that:
1. Reference the candidate's specific achievements
2. Use market data to support salary requests
3. Show the candidate's unique value proposition
4. Are specific and actionable

Return ONLY a valid JSON array of strings:
["Point 1 with specific details", "Point 2 with specific details", "Point 3 with specific details", "Point 4 with specific details", "Point 5 with specific details"]

Rules:
- Each point MUST be specific to this candidate (reference their achievements)
- Make talking points compelling and detailed
- Return exactly 5 points
- NO markdown or extra text
- ONLY return clean JSON array"""

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
    location: str
) -> Dict[str, str]:
    """Generate negotiation scripts for different scenarios"""
    try:
        prompt = f"""Create negotiation scripts for a {job_title} at {company} in {location}.
Provide 3 key scenarios with sample dialogue.

Return as JSON with this structure:
{{
  "initial_offer_response": "<A script for when you receive the initial offer. Be professional and positive>",
  "counteroffer_request": "<A script for requesting a higher salary based on market research>",
  "benefits_negotiation": "<A script for negotiating additional benefits if salary is fixed>"
}}

Rules:
- Each script should be 2-3 sentences
- Use professional language
- Make them adaptable templates
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
        print(f"Error generating negotiation scripts: {str(e)}")
        return {
            "initial_offer_response": "Thank you for the offer. I'm excited about this opportunity. I'd like to review the details and get back to you within 48 hours.",
            "counteroffer_request": "Based on my research of market rates for this role in this location, combined with my experience, I believe a salary of $X would be fair. Would you be able to match that?",
            "benefits_negotiation": "If the salary is at its maximum, I'd like to discuss other components like additional PTO, flexible work arrangements, or professional development budget."
        }


async def generate_counteroffer_template(
    job_title: str,
    company: str
) -> Dict[str, Any]:
    """Generate counteroffer evaluation template"""
    try:
        prompt = f"""Create a counteroffer evaluation template for comparing offers for a {job_title} position.
Provide a template that helps someone evaluate and compare multiple offers.

Return as JSON with this structure:
{{
  "offer_comparison_fields": [
    {{"field": "Base Salary", "importance": "Critical"}},
    {{"field": "Signing Bonus", "importance": "High"}},
    {{"field": "Annual Bonus", "importance": "High"}},
    {{"field": "Equity/Stock Options", "importance": "Medium"}},
    {{"field": "Health Insurance", "importance": "High"}},
    {{"field": "Retirement (401k)", "importance": "High"}},
    {{"field": "PTO Days", "importance": "High"}},
    {{"field": "Remote Work Policy", "importance": "Medium"}},
    {{"field": "Professional Development", "importance": "Medium"}},
    {{"field": "Job Security/Growth", "importance": "Medium"}}
  ],
  "evaluation_note": "<Brief note on how to use this template>"
}}

Rules:
- Order by importance
- Include realistic fields for this role
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
        print(f"Error generating counteroffer template: {str(e)}")
        return {
            "offer_comparison_fields": [
                {"field": "Base Salary", "importance": "Critical"},
                {"field": "Signing Bonus", "importance": "High"},
                {"field": "Annual Bonus", "importance": "High"},
                {"field": "Equity/Stock Options", "importance": "Medium"},
                {"field": "Health Insurance", "importance": "High"},
                {"field": "PTO Days", "importance": "High"},
                {"field": "Remote Work Policy", "importance": "Medium"},
                {"field": "Professional Development", "importance": "Medium"}
            ],
            "evaluation_note": "Fill in values for each offer and compare them side-by-side"
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
