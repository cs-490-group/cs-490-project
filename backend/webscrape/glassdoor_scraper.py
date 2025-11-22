import json
import base64
import requests
import re
import logging
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


async def scrape_glassdoor(job_html: str, company_html: Optional[str], url: str) -> Dict[str, Any]:
    """Scrape job data from Glassdoor"""
    soup = BeautifulSoup(job_html, "html.parser")
    logger.info("🔍 Parsing Glassdoor job page...")

    # --- Job title ---
    title = None
    for selector in ['[data-test="job-title"]', 'h1']:
        elem = soup.select_one(selector)
        if elem:
            title = elem.get_text(strip=True)
            logger.info(f"✅ Title: {title[:50]}...")
            break

    # --- Company name ---
    company_name = None
    for selector in ['[data-test="employer-name"]', 'div[class*="EmployerProfile_employerName"]']:
        elem = soup.select_one(selector)
        if elem:
            company_name = elem.get_text(strip=True)
            company_name = re.sub(r'\d+\.\d+', '', company_name).strip()
            logger.info(f"✅ Company: {company_name}")
            break

    # --- Location ---
    location = None
    for selector in ['[data-test="location"]', 'div[class*="JobDetails_location"]']:
        elem = soup.select_one(selector)
        if elem:
            location = elem.get_text(strip=True)
            logger.info(f"✅ Location: {location}")
            break

    # --- Salary ---
    salary = None
    for selector in ['[data-test="detailSalary"]', '.salarySnippet']:
        elem = soup.select_one(selector)
        if elem:
            salary = elem.get_text(strip=True)
            logger.info(f"✅ Salary: {salary}")
            break

    # --- Job type ---
    job_type = None
    elem = soup.select_one('[data-test="job-type"]')
    if elem:
        job_type = elem.get_text(strip=True)
        logger.info(f"✅ Job type: {job_type}")

    # --- Description ---
    description = None
    for selector in ['[data-test="jobDescriptionContent"]', 'div[class*="JobDetails_jobDescription"]']:
        elem = soup.select_one(selector)
        if elem:
            description = elem.get_text(strip=True)
            logger.info(f"✅ Description: {len(description)} chars")
            break

    # --- Company data ---
    company_data = await scrape_glassdoor_company_page(company_html) if company_html else None
    if company_data:
        logger.info(f"✅ Company data extracted: keys={list(company_data.keys())}, image={'Yes' if company_data.get('image') else 'No'}")
    else:
        logger.warning("⚠️ No company data available")

    # --- Return final schema ---
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
        "image": company_data.get("image") if company_data else None,  # top-level image
    }


async def scrape_glassdoor_company_page(html: str) -> Optional[Dict[str, Any]]:
    """Extract company data from Glassdoor company page HTML"""
    if not html or len(html) < 500:
        logger.warning("⚠ Company HTML too short or empty")
        return None

    soup = BeautifulSoup(html, "html.parser")
    logger.info("🔍 Parsing Glassdoor company page")

    company_data = {
        "size": None,
        "industry": None,
        "location": None,
        "website": None,
        "description": None,
        "type": None,
        "image": None,  # Single image string (URL)
    }

    # --- Extract overview items ---
    overview_items = soup.select(
        'ul.employer-overview_employerDetails__cVnc_ li.employer-overview_employerEntityContainer__RsMbe'
    )
    for item in overview_items:
        text = item.get_text(strip=True)
        link = item.select_one('a.employer-overview_employerOverviewLink__P8pxW')

        if link and 'employer-overview_websiteLink__vj3I0' in link.get('class', []):
            company_data["website"] = text
            logger.info(f"✅ Website: {text}")
            continue

        if re.search(r'[A-Z][a-z]+,\s*[A-Z]{2}', text) or re.search(r'[A-Z][a-z]+,\s*[A-Z][a-z]+', text):
            if not link or 'Location' not in link.get('href', ''):
                company_data["location"] = text
                logger.info(f"✅ Location: {text}")
                continue

        if 'employee' in text.lower():
            company_data["size"] = text
            logger.info(f"✅ Size: {text}")
            continue

        if text.startswith('Type:'):
            company_data["type"] = text.replace('Type:', '').strip()
            logger.info(f"✅ Type: {company_data['type']}")
            continue

        if link and not company_data["industry"]:
            href = link.get('href', '')
            if 'Explore' in href or 'II.' in href or 'IIND' in href:
                company_data["industry"] = text
                logger.info(f"✅ Industry: {text}")
                continue

    # --- Description ---
    desc_elem = soup.select_one('[data-test="employerDescription"]')
    if desc_elem:
        clamped_span = desc_elem.select_one('span[style*="--lineLimit"]')
        if clamped_span:
            company_data["description"] = re.sub(r'\s+', ' ', clamped_span.get_text(separator=' ', strip=True)).strip()[:2000]
            logger.info(f"✅ Description: {len(company_data['description'])} chars")

    if not company_data["description"]:
        mission_elem = soup.select_one('[data-test="employerMission"]')
        if mission_elem:
            clamped_span = mission_elem.select_one('span.text-block_clamped__RDgUG')
            if clamped_span:
                company_data["description"] = re.sub(r'\s+', ' ', clamped_span.get_text(separator=' ', strip=True)).strip()[:2000]
                logger.info(f"✅ Mission: {len(company_data['description'])} chars")

    # --- Add https:// to website if missing ---
    if company_data["website"] and not company_data["website"].startswith(('http://', 'https://')):
        company_data["website"] = f"https://{company_data['website']}"
        logger.info(f"✅ Added https:// to website: {company_data['website']}")

    # === LOGO / IMAGE SCRAPING ===    
    imgs = soup.select('div[class*="employer"] img, div[class*="employer"] image')

    urls = []
    for img in imgs:
        src = img.get("src") or img.get("href")
        if src:
            urls.append(src)

    logger.info(f"🔍 Employer image URLs found: {urls}")

    # filter ONLY logo URLs
    logo_urls = [u for u in urls if "/sql/" in u or "/sqls/" in u]

    logger.info(f"🎯 Filtered logos: {logo_urls}")

    def _resolve_url(u: str) -> str:
        u = u.strip()
        if u.startswith("//"):
            return "https:" + u
        if u.startswith("/"):
            return "https://www.glassdoor.com" + u
        if not re.match(r'^https?:\/\/', u):
            return "https://" + u
        return u

    if logo_urls:
        company_data["image"] = _resolve_url(logo_urls[0])  # store URL directly
        logger.info(f"📸 Selected logo image URL: {company_data['image']}")

    logger.info(f"✨ Extracted {sum(1 for v in company_data.values() if v)} company fields")
    logger.info(f"✅ Company data extracted: keys={list(company_data.keys())}, image={'Yes' if company_data.get('image') else 'No'}")
    return company_data