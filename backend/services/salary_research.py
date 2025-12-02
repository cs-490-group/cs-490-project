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
    """Generate negotiation talking points"""
    try:
        prompt = f"""Generate 5 key talking points for salary negotiation for a {role} position at {company} in {location}.
Return ONLY a valid JSON array like:
["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]

Rules:
- Return exactly 5 points.
- Each point should be actionable and specific.
- NO markdown or extra text.
- ONLY return clean JSON array."""

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


async def generate_job_salary_negotiation(
    job_title: str,
    company: str,
    location: str,
    company_size: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate salary negotiation research for a specific job posting.
    This is a simplified version tailored for job listings (no user achievements).
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

        return {
            "job_title": job_title,
            "company": company,
            "location": location,
            "market_data": market_data,
            "talking_points": talking_points[:5],
            "timing_strategy": timing_strategy,
            "best_practices": best_practices
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
            "best_practices": ["Do your research", "Know your worth", "Be professional"]
        }
