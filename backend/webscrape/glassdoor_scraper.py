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
    
    # Company data from company page
    company_data = await scrape_glassdoor_company_page(company_html) if company_html else None
    
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


async def scrape_glassdoor_company_page(html: str) -> Optional[Dict[str, Any]]:
    """Extract company data from Glassdoor company page HTML with robust fallbacks"""
    if not html or len(html) < 500:
        logger.warning("HTML too short or empty")
        return None
    
    soup = BeautifulSoup(html, "html.parser")
    logger.info("🏢 Parsing Glassdoor company page...")
    
    company_data = {
        "size": None,
        "industry": None,
        "location": None,
        "website": None,
        "description": None,
        "image": None
    }
    
    # === COMPANY SIZE ===
    # Pattern: "1 to 50 Employees" in overview section
    size_pattern = re.compile(r'(\d+\s+to\s+\d+)\s+Employees', re.I)
    match = size_pattern.search(html)
    if match:
        company_data["size"] = match.group(1) + " employees"
        logger.info(f"✅ Company size: {company_data['size']}")
    
    # === LOCATION ===
    # Pattern: City, STATE after website - looks for "Atlanta, GA" pattern
    location_pattern = re.compile(r'(?:www\.[^\s<]+|https?://[^\s<]+)\s*(?:<[^>]*>)*\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2})\s*(?:<[^>]*>)*\s*\d+\s+to\s+\d+\s+Employees', re.I)
    match = location_pattern.search(html)
    if match:
        company_data["location"] = match.group(1).strip()
        logger.info(f"✅ Location: {company_data['location']}")
    
    # === INDUSTRY ===
    # Pattern: Last item in overview list after "Revenue:" - "Commercial Printing"
    industry_pattern = re.compile(r'Revenue:[^\n]*\n\s*(?:<[^>]*>)*\s*([A-Z][^\n<]+?)(?:\s*(?:<|The\s+\w+\s+reviews))', re.I)
    match = industry_pattern.search(html)
    if match:
        text = match.group(1).strip()
        # Clean up
        text = re.sub(r'\s+', ' ', text)
        if len(text) > 2:
            company_data["industry"] = text
            logger.info(f"✅ Industry: {company_data['industry']}")
    
    # Fallback: Look for "Type:" field
    if not company_data["industry"]:
        type_pattern = re.compile(r'Type:\s*([^\n<]+)', re.I)
        match = type_pattern.search(html)
        if match:
            company_data["industry"] = match.group(1).strip()
            logger.info(f"✅ Industry (from Type): {company_data['industry']}")
    
    # === WEBSITE ===
    # Pattern: "www.theupsstore.com" at beginning of overview
    website_pattern = re.compile(r'(www\.[a-z0-9\-]+\.[a-z]+(?:\.[a-z]+)?)', re.I)
    match = website_pattern.search(html)
    if match:
        website = match.group(1)
        if not website.startswith('http'):
            website = f"https://{website}"
        company_data["website"] = website
        logger.info(f"✅ Website: {company_data['website']}")
    
    # === DESCRIPTION ===
    # No description appears in the overview - skip or leave None
    company_data["description"] = None
    
    # === LOGO ===
    logo_selectors = [
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'img[class*="employer"]',
    ]
    
    for selector in logo_selectors:
        logo_elem = soup.select_one(selector)
        if logo_elem:
            img_url = logo_elem.get('src')
            if img_url and not img_url.startswith('data:') and len(img_url) > 20:
                try:
                    if img_url.startswith('//'):
                        img_url = 'https:' + img_url
                    elif img_url.startswith('/'):
                        img_url = f"https://www.glassdoor.com{img_url}"
                    
                    res = requests.get(img_url, timeout=10)
                    if res.status_code == 200 and len(res.content) > 100:
                        company_data["image"] = base64.b64encode(res.content).decode("utf-8")
                        logger.info(f"✅ Logo fetched")
                        break
                except Exception as e:
                    logger.warning(f"Failed to fetch logo: {e}")
    
    if any(company_data.values()):
        logger.info(f"✅ Extracted company data with {sum(1 for v in company_data.values() if v)} fields")
        return company_data
    
    logger.warning("⚠️ No company data extracted")
    return None