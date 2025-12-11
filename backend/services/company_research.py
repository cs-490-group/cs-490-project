import os
from services.tracked_ai_clients import TrackedCohereClient
import json
from dotenv import load_dotenv

load_dotenv()
co = TrackedCohereClient()

async def run_company_research(company_name: str):
    """Generate detailed structured company research for a company."""
    if not company_name:
        return None

    prompt = f"""
    Create a comprehensive company research profile for: {company_name}

    Return a JSON object with EXACTLY the following structure:

    {{
      "basic_info": {{
        "industry": "",
        "size": "",
        "headquarters": "",
        "founded": "",
        "website": ""
      }},
      "mission_values": {{
        "mission": "",
        "values": [],
        "culture": ""
      }},
      "products_services": [],
      "leadership": {{
        "ceo": "",
        "key_executives": [
          {{ "name": "", "title": "" }}
        ]
      }},
      "competitive_landscape": {{
        "top_competitors": [],
      }},
      "social_media": [
        {{ "platform": "LinkedIn", "url": "" }},
        {{ "platform": "Twitter", "url": "" }},
        {{ "platform": "YouTube", "url": "" }}
      ],
      "interview_prep": {{
        "strengths": [],
        "challenges": [],
        "questions_to_ask": []
      }},
      "summary": ""
    }}

    Rules:
    - ALL FIELDS MUST BE FILLED. Never leave empty strings.
    - Use **accurate**, factual information when available.
    - If something is not public, write a **reasonable estimate**, not empty.
    - Values arrays must have **at least 3 items**.
    - Competitors MUST be real companies.
    - “questions_to_ask” MUST be interview questions candidates ask.
    - NO extra fields.
    - NO markdown.
    - ONLY return clean JSON.
    """

    response = co.chat(
        model="command-a-03-2025",
        messages=[{"role": "user", "content": prompt}]
    )

    text = None
    if hasattr(response, "message") and response.message:
        try:
            text = response.message.content[0].text
        except:
            text = None

    if not text:
        return {"error": "Cohere returned no text"}

    clean = (
        text.replace("```json", "")
            .replace("```", "")
            .strip()
    )

    if "{" in clean:
        clean = clean[clean.find("{"):]
    if "}" in clean:
        clean = clean[:clean.rfind("}") + 1]

    try:
        return json.loads(clean)
    except:
        return {
            "error": "JSON parse failed",
            "raw": text,
            "cleaned_attempt": clean
        }






