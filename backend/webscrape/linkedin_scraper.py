"""
LinkedIn Job Scraper
Extracts job and company data from LinkedIn job postings
"""

from bs4 import BeautifulSoup
import requests
import base64
import re
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


async def scrape_linkedin(job_html: str, company_html: Optional[str], url: str) -> Dict[str, Any]:
    """Scrape job data from LinkedIn"""
    soup = BeautifulSoup(job_html, "html.parser")
    logger.info("🔍 Parsing LinkedIn job page...")
    
    # Job title
    title = None
    for selector in ['.top-card-layout__title', 'h1.t-24', 'h1']:
        elem = soup.select_one(selector)
        if elem:
            title = elem.get_text(strip=True)
            logger.info(f"✅ Title: {title[:50]}...")
            break
    
    # Company name
    company_name = None
    for selector in ['.topcard__org-name-link', '.top-card-layout__second-subline a', 'a[data-tracking-control-name*="topcard-org-name"]']:
        elem = soup.select_one(selector)
        if elem:
            company_name = elem.get_text(strip=True)
            logger.info(f"✅ Company: {company_name}")
            break
    
    # Location
    location = None
    for selector in ['.topcard__flavor--bullet', '.top-card-layout__second-subline span']:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if company_name and company_name not in text:
                location = text
                logger.info(f"✅ Location: {location}")
                break
    
    # Job details
    job_type = None
    salary = None
    
    criteria_items = soup.select('.description__job-criteria-item')
    for item in criteria_items:
        header = item.select_one('.description__job-criteria-subheader')
        value = item.select_one('.description__job-criteria-text')
        if header and value:
            header_text = header.get_text(strip=True).lower()
            value_text = value.get_text(strip=True)
            if 'employment type' in header_text:
                job_type = value_text
            elif 'salary' in header_text:
                salary = value_text
    
    # Description
    description = None
    for selector in ['.show-more-less-html__markup', '.description__text']:
        elem = soup.select_one(selector)
        if elem:
            description = elem.get_text(strip=True)
            logger.info(f"✅ Description: {len(description)} chars")
            break
    
    
    # Company data from company page
    company_data = await scrape_linkedin_company_page(company_html) if company_html else None
    
    if company_data:
        logger.info(f"✅ Company data extracted from company page")
    
    return {
        "title": title,
        "company": company_name,
        "company_data": company_data,
        "location": location,
        "salary": salary,
        "deadline": None,
        "industry": company_data.get("industry") if company_data else None,
        "job_type": job_type,
        "description": description[:2000] if description else None,
    }


async def scrape_linkedin_company_page(html: str) -> Optional[Dict[str, Any]]:
    """
    Extract LinkedIn company data even when displayed outside an "About" tab.
    Supports pages where info shows immediately (like screenshot).
    """
    if not html or len(html) < 500:
        logger.warning("⚠ Company HTML too short or empty")
        return None

    from bs4 import BeautifulSoup
    import base64, re, requests

    soup = BeautifulSoup(html, "html.parser")
    logger.info("🔍 Parsing LinkedIn company page (full visible)")

    company_data = {
        "logo": None,
        "size": None,
        "industry": None,
        "location": None,
        "website": None,
        "description": None,
    }

    # ======================
    # 1️⃣ STRUCTURED EXTRACTION (dt / dd format)
    # ======================
    for row in soup.select("dl > div"):
        label = row.select_one("dt")
        value = row.select_one("dd")
        if not label or not value:
            continue

        label_text = label.get_text(strip=True).lower()
        value_text = value.get_text(strip=True)

        if "size" in label_text:
            company_data["size"] = value_text + " employees"
        elif "industry" in label_text:
            company_data["industry"] = value_text
        elif "headquarters" in label_text:
            company_data["location"] = value_text
        elif "website" in label_text:
            company_data["website"] = value_text
        elif "company type" in label_text:
            pass  # optional unused for now

    # ======================
    # 2️⃣ DESCRIPTION (if visible directly)
    # ======================
    desc_element = soup.find(lambda tag: tag.name in ["p", "div"] and "About us" in tag.get_text())
    if desc_element:
        desc_text = re.sub(r"[^\x00-\x7F]+", " ", desc_element.get_text(strip=True))
        company_data["description"] = re.sub(r"\s+", " ", desc_text)

    # ======================
    # 3️⃣ LOGO EXTRACTION (unchanged)
    # ======================
    logo_selectors = [
        'img[alt*="logo" i]',
        'img[src*="logo"]',
        'img[class*="company"]',
    ]

    for selector in logo_selectors:
        tag = soup.select_one(selector)
        if tag and (img_url := tag.get("src")):
            try:
                if img_url.startswith("//"):
                    img_url = "https:" + img_url
                elif img_url.startswith("/"):
                    img_url = "https://www.linkedin.com" + img_url

                res = requests.get(img_url, timeout=10)
                if res.status_code == 200 and len(res.content) > 100:
                    company_data["logo"] = base64.b64encode(res.content).decode("utf-8")
                    logger.info("🖼 Company logo extracted successfully")
                    break
            except Exception as e:
                logger.warning(f"❌ Logo fetch failed: {e}")

    # ======================
    # 4️⃣ VALIDATE RETURN
    # ======================
    extracted_count = sum(1 for v in company_data.values() if v)
    if extracted_count > 0:
        logger.info(f"✨ Extracted {extracted_count} visible company fields")
        return company_data

    logger.warning("⚠ No company data extracted from visible page")
    return None
