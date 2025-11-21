"""
Indeed Job Scraper
Extracts job and company data from Indeed job postings
"""

from bs4 import BeautifulSoup
import requests
import base64
import re
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


async def scrape_indeed(job_html: str, company_html: Optional[str], url: str) -> Dict[str, Any]:
    """Scrape job data from Indeed"""
    soup = BeautifulSoup(job_html, "html.parser")
    
    logger.info(f"📊 Job HTML length: {len(job_html)} characters")
    
    # Check if we hit CloudFlare or verification
    if len(job_html) < 1000 or 'verification' in job_html.lower() or 'additional verification' in soup.get_text().lower():
        raise ValueError("Indeed is currently blocking automated access. Please try again later or use a different job board.")
    
    # === JOB TITLE ===
    title = None
    title_selectors = [
        'h1[class*="jobsearch-JobInfoHeader-title"]',
        '.jobsearch-JobInfoHeader-title span',
        'h1.icl-u-xs-mb--xs',
        'h1'
    ]
    
    for selector in title_selectors:
        title_elem = soup.select_one(selector)
        if title_elem:
            title = title_elem.get_text(strip=True)
            if title and 'verification' not in title.lower():
                logger.info(f"✅ Found title: {title[:50]}...")
                break
    
    # === COMPANY NAME ===
    company_name = None
    company_selectors = [
        '[data-testid="inlineHeader-companyName"]',
        'div[data-testid="inlineHeader-companyName"] a',
        'div[data-testid="inlineHeader-companyName"] span',
        '.jobsearch-InlineCompanyRating-companyHeader'
    ]
    
    for selector in company_selectors:
        company_elem = soup.select_one(selector)
        if company_elem:
            company_name = company_elem.get_text(strip=True)
            logger.info(f"✅ Found company: {company_name}")
            break
    
    # === LOCATION ===
    location = None
    location_selectors = [
        '[data-testid="inlineHeader-companyLocation"]',
        'div[data-testid="inlineHeader-companyLocation"] div',
        '.jobsearch-JobInfoHeader-subtitle div'
    ]
    
    for selector in location_selectors:
        location_elem = soup.select_one(selector)
        if location_elem:
            location = location_elem.get_text(strip=True)
            logger.info(f"✅ Found location: {location}")
            break
    
    # === SALARY & JOB TYPE ===
    salary = None
    job_type = None
    
    salary_selectors = [
        '[data-testid="jobsearch-JobMetadataHeader-salary"]',
        '[id*="salaryInfoAndJobType"]'
    ]
    
    for selector in salary_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if '$' in text or 'hour' in text or 'year' in text:
                salary = text
                logger.info(f"✅ Found salary: {salary}")
                break
    
    attributes = soup.select('[data-testid="jobsearch-JobMetadataHeader-item"]')
    for attr in attributes:
        text = attr.get_text(strip=True).lower()
        if any(x in text for x in ["full-time", "part-time", "contract", "temporary", "internship"]):
            job_type = attr.get_text(strip=True)
            logger.info(f"✅ Found job type: {job_type}")
            break
    
    # === DESCRIPTION ===
    description = None
    description_selectors = [
        '#jobDescriptionText',
        '[data-testid="jobsearch-JobComponent-description"]'
    ]
    
    for selector in description_selectors:
        desc_elem = soup.select_one(selector)
        if desc_elem:
            description = desc_elem.get_text(strip=True)
            logger.info(f"✅ Found description: {len(description)} chars")
            break
    
    # === COMPANY DATA ===
    company_data = await scrape_indeed_company_page(company_html) if company_html else None
    
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


async def scrape_indeed_company_page(html: str) -> Optional[Dict[str, Any]]:
    """Extract company data from Indeed company page HTML with robust fallbacks"""
    if not html or len(html) < 500:
        logger.warning("HTML too short or empty")
        return None
    
    soup = BeautifulSoup(html, "html.parser")
    logger.info("🏢 Parsing Indeed company page...")
    
    company_data = {
        "size": None,
        "industry": None,
        "location": None,
        "website": None,
        "description": None,
        "image": None
    }
    
    # === COMPANY SIZE ===
    size_selectors = [
        'li[data-testid="companyInfo-employee"]',
        'span[data-testid="companySize"]',
        '[data-testid="employeeCount"]'
    ]
    
    for selector in size_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if text and ('employee' in text.lower() or 'people' in text.lower()):
                company_data["size"] = text
                logger.info(f"✅ Company size (selector): {company_data['size']}")
                break
    
    # Pattern matching fallback
    if not company_data["size"]:
        patterns = [
            re.compile(r'(\d+[\s,]*(?:to|-|–)[\s,]*\d+)\s*(?:employee|Employee|people|People)', re.I),
            re.compile(r'(\d+\+?)\s*(?:employee|Employee|people|People)', re.I),
        ]
        for pattern in patterns:
            match = pattern.search(html)
            if match:
                company_data["size"] = match.group(1).strip() + " employees"
                logger.info(f"✅ Company size (pattern): {company_data['size']}")
                break
    
    # === INDUSTRY ===
    industry_selectors = [
        'li[data-testid="companyInfo-industry"]',
        '[data-testid="industry"]',
        'div[class*="industry"]',
    ]
    
    for selector in industry_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if ':' in text:
                text = text.split(':', 1)[-1].strip()
            if text and text.lower() != 'industry':
                company_data["industry"] = text
                logger.info(f"✅ Industry (selector): {company_data['industry']}")
                break
    
    # Look for "Industry" label
    if not company_data["industry"]:
        industry_label = soup.find(string=re.compile(r'^\s*Industry\s*$', re.I))
        if industry_label:
            parent = industry_label.find_parent()
            if parent:
                text = parent.get_text(strip=True)
                if ':' in text:
                    industry_text = text.split(':', 1)[-1].strip()
                    if industry_text:
                        company_data["industry"] = industry_text
                        logger.info(f"✅ Industry (label): {company_data['industry']}")
    
    # === HEADQUARTERS/LOCATION ===
    hq_selectors = [
        'li[data-testid="companyInfo-headquartersLocation"]',
        '[data-testid="headquarters"]',
        'div[class*="headquarters"]',
    ]
    
    for selector in hq_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if ':' in text:
                text = text.split(':', 1)[-1].strip()
            if text and text.lower() != 'headquarters':
                company_data["location"] = text
                logger.info(f"✅ Headquarters (selector): {company_data['location']}")
                break
    
    # Look for "Headquarters" label
    if not company_data["location"]:
        hq_label = soup.find(string=re.compile(r'Headquarters', re.I))
        if hq_label:
            parent = hq_label.find_parent()
            if parent:
                text = parent.get_text(strip=True)
                if ':' in text:
                    location_text = text.split(':', 1)[-1].strip()
                    if location_text:
                        company_data["location"] = location_text
                        logger.info(f"✅ Headquarters (label): {company_data['location']}")
    
    # === WEBSITE ===
    website_elem = soup.select_one('li[data-testid="companyInfo-companyWebsite"] a')
    if website_elem:
        company_data["website"] = website_elem.get("href")
        logger.info(f"✅ Website (selector): {company_data['website']}")
    
    # Look for external links (not Indeed)
    if not company_data["website"]:
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if href.startswith('http') and 'indeed.com' not in href.lower():
                link_text = link.get_text(strip=True).lower()
                if any(x in link_text for x in ['website', 'visit', 'company site']) or href.count('/') <= 3:
                    company_data["website"] = href
                    logger.info(f"✅ Website (link): {company_data['website']}")
                    break
    
    # === DESCRIPTION ===
    desc_selectors = [
        'div[data-testid="less-text"] p',
        'div[data-testid="companyDescription"]',
        'div[class*="description"] p',
        'section[class*="about"] p',
    ]
    
    for selector in desc_selectors:
        elem = soup.select_one(selector)
        if elem:
            company_data["description"] = elem.get_text(strip=True)
            logger.info(f"✅ Description (selector): {len(company_data['description'])} chars")
            break
    
    # Look for "About" section
    if not company_data["description"]:
        about_heading = soup.find(string=re.compile(r'About|Overview|Description', re.I))
        if about_heading:
            parent = about_heading.find_parent()
            if parent:
                next_elem = parent.find_next(['p', 'div'])
                if next_elem:
                    desc_text = next_elem.get_text(strip=True)
                    if len(desc_text) > 50:
                        company_data["description"] = desc_text
                        logger.info(f"✅ Description (about): {len(company_data['description'])} chars")
    
    # === LOGO/IMAGE ===
    img_selectors = [
        'div[data-testid="cmp-HeaderLayout"] img',
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
                    if img_url.startswith('/'):
                        img_url = f"https://www.indeed.com{img_url}"
                    
                    res = requests.get(img_url, timeout=10)
                    if res.status_code == 200 and len(res.content) > 100:
                        company_data["image"] = base64.b64encode(res.content).decode("utf-8")
                        logger.info(f"✅ Logo fetched: {len(company_data['image'])} chars")
                        break
                except Exception as e:
                    logger.warning(f"Failed to fetch image: {e}")
    
    if any(company_data.values()):
        logger.info(f"✅ Extracted company data with {sum(1 for v in company_data.values() if v)} fields")
        return company_data
    
    logger.warning("⚠️ No company data extracted")
    return None