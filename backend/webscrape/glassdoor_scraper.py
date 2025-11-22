"""
Glassdoor Job Scraper
Extracts job and company data from Glassdoor job postings
"""

from bs4 import BeautifulSoup
import requests
import base64
import re
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


async def scrape_glassdoor(job_html: str, company_html: Optional[str], url: str) -> Dict[str, Any]:
    """Scrape job data from Glassdoor"""
    soup = BeautifulSoup(job_html, "html.parser")
    logger.info("🔍 Parsing Glassdoor job page...")
    
    # Job title
    title = None
    for selector in ['[data-test="job-title"]', 'h1']:
        elem = soup.select_one(selector)
        if elem:
            title = elem.get_text(strip=True)
            logger.info(f"✅ Title: {title[:50]}...")
            break
    
    # Company name (clean up rating)
    company_name = None
    for selector in ['[data-test="employer-name"]', 'div[class*="EmployerProfile_employerName"]']:
        elem = soup.select_one(selector)
        if elem:
            company_name = elem.get_text(strip=True)
            # Remove rating numbers (e.g., "3.5")
            company_name = re.sub(r'\d+\.\d+', '', company_name).strip()
            logger.info(f"✅ Company: {company_name}")
            break
    
    # Location
    location = None
    for selector in ['[data-test="location"]', 'div[class*="JobDetails_location"]']:
        elem = soup.select_one(selector)
        if elem:
            location = elem.get_text(strip=True)
            logger.info(f"✅ Location: {location}")
            break
    
    # Salary
    salary = None
    for selector in ['[data-test="detailSalary"]', '.salarySnippet']:
        elem = soup.select_one(selector)
        if elem:
            salary = elem.get_text(strip=True)
            logger.info(f"✅ Salary: {salary}")
            break
    
    # Job type
    job_type = None
    elem = soup.select_one('[data-test="job-type"]')
    if elem:
        job_type = elem.get_text(strip=True)
        logger.info(f"✅ Job type: {job_type}")
    
    # Description
    description = None
    for selector in ['[data-test="jobDescriptionContent"]', 'div[class*="JobDetails_jobDescription"]']:
        elem = soup.select_one(selector)
        if elem:
            description = elem.get_text(strip=True)
            logger.info(f"✅ Description: {len(description)} chars")
            break
    
    # === COMPANY DATA ===
    company_data = await scrape_glassdoor_company_page(company_html) if company_html else None
    
    if company_data:
        logger.info(f"✅ Company data extracted from company page")
    else:
        logger.warning("⚠️ No company data available")
    
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
        "image": None
    }
    
    # Extract from employer overview list
    overview_items = soup.select('ul.employer-overview_employerDetails__cVnc_ li.employer-overview_employerEntityContainer__RsMbe')
    
    for item in overview_items:
        text = item.get_text(strip=True)
        
        # Website - has a link with websiteLink class
        link = item.select_one('a.employer-overview_employerOverviewLink__P8pxW')
        if link and 'employer-overview_websiteLink__vj3I0' in link.get('class', []):
            company_data["website"] = text
            logger.info(f"✅ Website: {text}")
            continue
        
        # Location - contains city, state/country pattern
        if re.search(r'[A-Z][a-z]+,\s*[A-Z]{2}', text) or re.search(r'[A-Z][a-z]+,\s*[A-Z][a-z]+', text):
            # Make sure it's not in a link (locations link is for office locations page)
            if not link or 'Location' not in link.get('href', ''):
                company_data["location"] = text
                logger.info(f"✅ Location: {text}")
                continue
        
        # Size - contains "Employees"
        if 'employee' in text.lower():
            company_data["size"] = text
            logger.info(f"✅ Size: {text}")
            continue
        
        # Type - starts with "Type:"
        if text.startswith('Type:'):
            company_data["type"] = text.replace('Type:', '').strip()
            logger.info(f"✅ Type: {company_data['type']}")
            continue
        
        # Industry - if it's a link to Explore page
        if link and not company_data["industry"]:
            href = link.get('href', '')
            if 'Explore' in href or 'II.' in href or 'IIND' in href:
                company_data["industry"] = text
                logger.info(f"✅ Industry: {text}")
                continue
    
    # === DESCRIPTION ===
    # Look for employer description
    desc_elem = soup.select_one('[data-test="employerDescription"]')
    if desc_elem:
        # Get the text from the span inside the clamped span
        clamped_span = desc_elem.select_one('span[style*="--lineLimit"]')
        if clamped_span:
            # Get text and clean up HTML breaks
            desc_text = clamped_span.get_text(separator=' ', strip=True)
            # Remove excessive whitespace
            company_data["description"] = re.sub(r'\s+', ' ', desc_text).strip()
            logger.info(f"✅ Description: {len(company_data['description'])} chars")
    
    # === MISSION (if description not found) ===
    if not company_data["description"]:
        mission_elem = soup.select_one('[data-test="employerMission"]')
        if mission_elem:
            # Skip the "Mission:" title and get the actual content
            clamped_span = mission_elem.select_one('span.text-block_clamped__RDgUG')
            if clamped_span:
                mission_text = clamped_span.get_text(separator=' ', strip=True)
                company_data["description"] = re.sub(r'\s+', ' ', mission_text).strip()
                logger.info(f"✅ Mission: {len(company_data['description'])} chars")
    
    # === WEBSITE - Add https:// if missing ===
    if company_data["website"] and not company_data["website"].startswith(('http://', 'https://')):
        company_data["website"] = f"https://{company_data['website']}"
        logger.info(f"✅ Added https:// to website: {company_data['website']}")
    
    # === LOGO / IMAGE SCRAPING ===
    company_data["image"] = None

    # Select company logo image - try multiple selectors
    img_elem = (
        soup.select_one('img.employer-header_employerImage__23pQJ') or
        soup.select_one('img.employer-header_employerImg__hO2Op') or
        soup.select_one('a[data-test="ei-hero-overview-link"] img')
    )
    if img_elem:
        img_url = img_elem.get("src") or img_elem.get("data-src")
        if img_url and not img_url.startswith('data:') and 'default-ei-banner' not in img_url:
            try:
                # Handle relative URLs
                if img_url.startswith('//'):
                    img_url = 'https:' + img_url
                elif img_url.startswith('/'):
                    img_url = f"https://www.glassdoor.com{img_url}"
                elif not img_url.startswith('http'):
                    img_url = f"https://www.glassdoor.com/{img_url}"

                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                res = requests.get(img_url, timeout=10, headers=headers)
                if res.status_code == 200 and len(res.content) > 100:
                    company_data["image"] = base64.b64encode(res.content).decode("utf-8")
                    logger.info(f"📸 Glassdoor logo fetched ({len(res.content)} bytes)")
            except Exception as e:
                logger.warning(f"Failed to fetch Glassdoor logo: {e}")
    else:
        logger.warning("⚠ No logo found on Glassdoor company page")
    
    # Return None if nothing extracted
    if not any(company_data.values()):
        logger.warning("⚠ No company data extracted from page")
        return None
    
    logger.info(f"✨ Extracted {sum(1 for v in company_data.values() if v)} company fields")
    return company_data