import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_company_research(company: str):
    """Ask OpenAI to generate structured company research"""

    prompt = f"""
    You are generating detailed structured research about the company: {company}.

    Return JSON ONLY with exactly this structure:

    {{
        "overview": "...",
        "industry": "...",
        "size": "...",
        "mission": "...",
        "values": "...",
        "culture": "...",
        "products": ["...", "..."],
        "competitors": ["...", "..."],
        "news": [
            {{
                "title": "...",
                "date": "...",
                "source": "...",
                "url": "..."
            }}
        ],
        "socials": ["...", "..."],
        "summary": "..."
    }}
    """

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    return response.output_text
