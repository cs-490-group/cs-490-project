from bs4 import BeautifulSoup
import requests
import base64
import logging
import re
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

async def scrape_linkedin(job_html: str, company_html: Optional[str], url: str) -> Dict[str, Any]:
    soup = BeautifulSoup(job_html, "html.parser")
    logger.info("🔍 Parsing LinkedIn job page...")
    
    title = soup.select_one('h1') and soup.select_one('h1').get_text(strip=True)
    company_name = soup.select_one('a[data-tracking-control-name="public_jobs_topcard-org-name"]')
    company_name = company_name.get_text(strip=True) if company_name else None
    location_elem = soup.select_one('.topcard__flavor--bullet')
    location = location_elem.get_text(strip=True) if location_elem else None
    description_elem = soup.select_one('.show-more-less-html__markup')
    description = description_elem.get_text(strip=True) if description_elem else None

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


async def scrape_linkedin_company_page(html: str) -> Optional[Dict[str, Any]]:
    if not html or len(html) < 500:
        logger.warning("⚠ Company HTML too short or empty")
        return None

    soup = BeautifulSoup(html, "html.parser")
    logger.info("🔍 Parsing LinkedIn company page")
    
    company_data = {
        "logo": None,
        "size": None,
        "industry": None,
        "location": None,
        "website": None,
        "description": None,
    }

    # Attempt dt/dd pairs
    for dt_tag in soup.find_all('dt'):
        label_text = dt_tag.get_text(strip=True).lower()
        dd_tag = dt_tag.find_next_sibling('dd')
        if not dd_tag:
            continue
        value_text = dd_tag.get_text(strip=True)
        if 'website' in label_text:
            company_data["website"] = value_text
        elif 'industry' in label_text:
            company_data["industry"] = value_text
        elif 'company size' in label_text or 'size' in label_text:
            company_data["size"] = value_text
        elif 'headquarters' in label_text:
            company_data["location"] = value_text

    # Try logo
    logo_tag = soup.select_one('img[alt*="logo" i], img[class*="logo"]')
    if logo_tag:
        img_url = logo_tag.get("src")
        if img_url:
            try:
                if img_url.startswith("//"):
                    img_url = "https:" + img_url
                res = requests.get(img_url, timeout=10)
                if res.status_code == 200 and len(res.content) > 100:
                    company_data["logo"] = base64.b64encode(res.content).decode("utf-8")
            except:
                pass

    if not any(company_data.values()):
        logger.warning("⚠ No company data extracted from page")
        return None

    logger.info(f"✨ Extracted {sum(1 for v in company_data.values() if v)} company fields")
    return company_data
