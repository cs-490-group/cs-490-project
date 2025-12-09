import os
from services.tracked_ai_clients import TrackedCohereClient
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from datetime import datetime, timedelta
import re
from dateutil import parser as dateparser

load_dotenv()
co = TrackedCohereClient()


# ============================================================
# NORMALIZE ANY DATE STRING → YYYY-MM-DD
# ============================================================
def normalize_date(date_str: str):
    if not date_str:
        return ""

    date_str = date_str.lower().strip()

    # Case 1 — Relative time (e.g. "5 hours ago")
    match = re.match(r"(\d+)\s+(hour|hours|day|days|week|weeks|month|months|year|years)\s+ago", date_str)
    if match:
        num = int(match.group(1))
        unit = match.group(2)
        now = datetime.now()

        if "hour" in unit:
            return (now - timedelta(hours=num)).strftime("%Y-%m-%d")
        if "day" in unit:
            return (now - timedelta(days=num)).strftime("%Y-%m-%d")
        if "week" in unit:
            return (now - timedelta(weeks=num)).strftime("%Y-%m-%d")
        if "month" in unit:
            return (now - timedelta(days=num * 30)).strftime("%Y-%m-%d")
        if "year" in unit:
            return (now - timedelta(days=num * 365)).strftime("%Y-%m-%d")

    # Case 2 — Standard date formats (e.g. "Jan 4, 2024")
    try:
        return dateparser.parse(date_str).strftime("%Y-%m-%d")
    except:
        return ""


# ============================================================
# EXTRACT RAW DATE FROM BING ARTICLE HTML
# (handles many different HTML structures)
# ============================================================
def extract_raw_date(parent):
    # 1. Direct .time tag
    time_el = parent.select_one(".time")
    if time_el:
        return time_el.get_text(strip=True)

    # 2. ".source" like "CNN · 5 hours ago"
    source_el = parent.select_one(".source")
    if source_el:
        text = source_el.get_text(strip=True)
        if "·" in text:
            right_side = text.split("·")[1].strip()
            if re.search(r"ago|\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec", right_side.lower()):
                return right_side

    # 3. Search ANY child tag (<span>, <div>, <a>, etc.)
    for elem in parent.find_all(True):  # True = any tag
        t = elem.get_text(strip=True).lower()
        if re.search(r"ago|\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec", t):
            return t


    # 4. Search entire parent text for "5 hours ago"
    full_text = parent.get_text(" ", strip=True).lower()
    match = re.search(r"(\d+\s+(hours?|days?|weeks?|months?|years?)\s+ago)", full_text)
    if match:
        return match.group(1)

    return ""


# ============================================================
# SCRAPE NEWS FROM BING
# ============================================================
async def scrape_news(company_name: str):
    query = company_name.replace(" ", "+")
    url = f"https://www.bing.com/news/search?q={query}&sortby=date"

    html = requests.get(url, timeout=10).text
    soup = BeautifulSoup(html, "html.parser")

    articles = []

    for a in soup.select("a.title")[:10]:
        parent = a.find_parent("div")

        title = a.get_text(strip=True)
        link = a.get("href")

        # Extract source
        source_el = parent.select_one(".source")
        source_text = source_el.get_text(strip=True) if source_el else ""
        source = source_text.split("·")[0].strip() if "·" in source_text else source_text or "Unknown"

        # Extract + normalize date
        raw_date = extract_raw_date(parent)
        date = normalize_date(raw_date)

        articles.append({
            "title": title,
            "url": link,
            "source": source,
            "date": date,
        })

    return articles


# ============================================================
# SUMMARIZE WITH COHERE
# ============================================================
async def run_company_news(company_name: str):
    articles = await scrape_news(company_name)

    if not articles:
        return []

    # Format scraped articles for prompt input
    articles_text = "\n\n".join(
        f"- Title: {a['title']}\n  Source: {a['source']}\n  Date: {a['date']}\n  URL: {a['url']}"
        for a in articles
    )

    prompt = f"""
You are given a list of REAL recent news articles about {company_name}.
Summarize ONLY these articles — do NOT invent or modify anything.

Articles:
{articles_text}

Return ONLY valid JSON (no markdown). The output must be a JSON ARRAY.

Schema:
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
- Keep the same titles, dates, URLs, and sources.
- 2–3 sentence summary.
- 3–5 key_points.
- category must be: "funding", "product launch", "acquisition", "hiring", "lawsuit", "partnership", or "general".
- relevance_score: 1–100.
"""

    response = co.chat(
        model="command-a-03-2025",
        messages=[{"role": "user", "content": prompt}]
    )

    # --- extract text safely ---
    text = None
    if hasattr(response, "message") and response.message:
        try:
            text = response.message.content[0].text
        except:
            text = None

    if not text:
        return {"error": "Could not read cohere output", "raw": str(response)}

    # --- clean ---
    clean = text.replace("```json", "").replace("```", "").strip()
    if "[" in clean:
        clean = clean[clean.find("["):]
    if "]" in clean:
        clean = clean[:clean.rfind("]") + 1]

    # --- parse ---
    try:
        return json.loads(clean)
    except Exception as e:
        return {
            "error": "JSON parsing failed",
            "raw": text,
            "cleaned_attempt": clean,
            "exception": str(e)
        }


