import json
import base64
import requests
import logging
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


async def scrape_linkedin(job_html: str, company_html: Optional[str], url: str) -> Dict[str, Any]:
    """
    Scrape job page and optionally company page from LinkedIn
    """
    soup = BeautifulSoup(job_html, "html.parser")
    logger.info("🔍 Parsing LinkedIn job page...")

    title = soup.select_one('h1') and soup.select_one('h1').get_text(strip=True)
    company_name_elem = soup.select_one('a[data-tracking-control-name="public_jobs_topcard-org-name"]')
    company_name = company_name_elem.get_text(strip=True) if company_name_elem else None
    location_elem = soup.select_one('.topcard__flavor--bullet')
    location = location_elem.get_text(strip=True) if location_elem else None
    description_elem = soup.select_one('.show-more-less-html__markup')
    description = description_elem.get_text(strip=True) if description_elem else None

    # Extract company data
    company_data = await scrape_linkedin_company_page(company_html) if company_html else None

    return {
        "title": title,
        "company": company_name,
        "company_data": company_data,
        "location": location,
        "salary": None,
        "deadline": None,
        "industry": company_data.get("industry") if company_data else None,
        "job_type": None,
        "description": description[:2000] if description else None,
    }


async def scrape_linkedin_company_page(html: str) -> Optional[Dict[str, str]]:
    if not html or len(html) < 500:
        logger.warning("⚠ Company HTML too short or empty")
        return None

    soup = BeautifulSoup(html, "html.parser")
    logger.info("🔍 Parsing LinkedIn company page")

    company_data = {
        "description": None,
        "website": None,
        "industry": None,
        "size": None,
        "location": None,
        "type": None,
        "image": None
    }

    # About / Description
    about_elem = soup.select_one('p[data-test-id="about-us__description"]')
    if about_elem:
        company_data["description"] = about_elem.get_text(strip=True)

    # Website
    website_elem = soup.select_one('div[data-test-id="about-us__website"] dd a')
    if website_elem:
        company_data["website"] = website_elem.get_text(strip=True)

    # Industry
    industry_elem = soup.select_one('div[data-test-id="about-us__industry"] dd')
    if industry_elem:
        company_data["industry"] = industry_elem.get_text(strip=True)

    # Company Size
    size_elem = soup.select_one('div[data-test-id="about-us__size"] dd')
    if size_elem:
        company_data["size"] = size_elem.get_text(strip=True)

    # Location
    hq_elem = soup.select_one('div[data-test-id="about-us__headquarters"] dd')
    if hq_elem:
        company_data["location"] = hq_elem.get_text(strip=True)

    # Type
    type_elem = soup.select_one('div[data-test-id="about-us__organizationType"] dd')
    if type_elem:
        company_data["type"] = type_elem.get_text(strip=True)

    # If nothing extracted, return None
    if not any(company_data.values()):
        logger.warning("⚠ No company data extracted from page")
        return None

    # === LOGO / IMAGE SCRAPING ===
    img_selectors = [
        'div.top-card-layout__entity-image-container img',
        'img[class*="entity-image" i]',
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'div[class*="company"] img',
    ]

    for selector in img_selectors:
        img_elem = soup.select_one(selector)
        if img_elem:
            img_url = img_elem.get("src")
            if img_url and not img_url.startswith('data:') and len(img_url) > 20:
                try:
                    # LinkedIn often returns abs URLs, but just in case:
                    if img_url.startswith('/'):
                        img_url = f"https://www.linkedin.com{img_url}"

                    res = requests.get(img_url, timeout=10)
                    if res.status_code == 200 and len(res.content) > 100:
                        company_data["image"] = base64.b64encode(res.content).decode("utf-8")
                        logger.info(f"📸 LinkedIn logo fetched: {len(company_data['image'])} chars")
                        break
                except Exception as e:
                    logger.warning(f"Failed to fetch LinkedIn logo: {e}")
                    
    logger.info(f"✨ Extracted {sum(1 for v in company_data.values() if v)} company fields")
    return company_data