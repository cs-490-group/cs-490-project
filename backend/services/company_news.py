import os
import cohere
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()
co = cohere.Client(os.getenv("COHERE_API_KEY"))

# STEP 1: SCRAPE NEWS
async def scrape_news(company_name: str):
    query = company_name.replace(" ", "+")
    url = f"https://www.bing.com/news/search?q={query}"

    html = requests.get(url, timeout=10).text
    soup = BeautifulSoup(html, "html.parser")

    articles = []
    for item in soup.select("div.t_s, div.news-card"):
        a = item.select_one("a")
        if not a:
            continue

        articles.append({
            "title": a.get_text(strip=True),
            "url": a.get("href"),
            "source":
                item.select_one(".source").get_text(strip=True)
                if item.select_one(".source") else "Unknown",
            "date":
                item.select_one(".time").get_text(strip=True)
                if item.select_one(".time") else "",
        })

    return articles[:8]


# STEP 2: SUMMARIZE WITH COHERE
async def run_company_news(company_name: str):
    articles = await scrape_news(company_name)

    if not articles:
        return {"items": []}

    prompt = f"""
    Generate a structured list of recent news articles about {company_name}.

    Return ONLY valid JSON (no markdown, no backticks).

    Each article MUST follow EXACTLY this schema:

    [
    {{
        "title": "",
        "summary": "",
        "category": "",
        "source": "",
        "url": "",
        "date": "",
        "relevance_score": 0,
        "key_points": []
    }}
    ]

    Rules:
    - Provide **5–7 high-quality recent articles**.
    - Category must be accurate: "funding", "product launch", "acquisition", "hiring", "lawsuit", "partnership", or "general".
    - Summary must be 2–3 sentences.
    - key_points must contain 3–5 bullets.
    - relevance_score must be a number between 1–100 (higher = more relevant for job seekers).
    - ALWAYS return a JSON **array**, never an object.
    """

    response = co.chat(message=prompt)

    # --- NEW EXTRACTION LOGIC ---
    text = None

    # Preferred Cohere SDK format: response.text
    if hasattr(response, "text") and response.text:
        text = response.text

    # Legacy format: response.message.content
    elif hasattr(response, "message") and response.message and response.message.content:
        try:
            text = response.message.content[0].text
        except:
            pass

    if not text:
        return {"error": "Could not read cohere output", "raw": str(response)}

    # --- CLEAN THE OUTPUT ---
    clean = (
        text.replace("```json", "")
            .replace("```", "")
            .strip()
    )

    # Trim to valid JSON object
    if "{" in clean:
        clean = clean[clean.find("{"):]
    if "}" in clean:
        clean = clean[:clean.rfind("}") + 1]

    # --- PARSE JSON ---
    try:
        return json.loads(clean)
    except Exception as e:
        return {
            "error": "JSON parsing failed",
            "raw": text,
            "cleaned_attempt": clean,
            "exception": str(e)
        }


