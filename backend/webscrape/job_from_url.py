from bs4 import BeautifulSoup
import requests, tldextract, asyncio, base64
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor


# INSTALLING PLAYWRIGHT --> do ```playwright install``` in your terminal

class URLScrapeError(Exception):
    def __init__(self, message: str = "Unable to scrape this URL"):
        super().__init__(message)

# Thread pool for running sync Playwright (Windows compatibility)
_executor = ThreadPoolExecutor(max_workers=3)

def _scrape_with_playwright(url: str) -> str:
    """Synchronous function that uses sync_playwright for Windows compatibility"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["image", "font"] else route.continue_())
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        html = page.content()
        browser.close()
        return html

async def job_from_url(url: str):
    ext = tldextract.extract(url)

    # Run the sync playwright code in a thread pool
    loop = asyncio.get_event_loop()
    html = await loop.run_in_executor(_executor, _scrape_with_playwright, url)
    
    try:
        if ext.domain.lower() == "indeed":
            return await indeed_scrape(html)
        else:
            raise URLScrapeError("Unsupported domain, please import from a supported website")
    except URLScrapeError:
        raise
    except Exception as e:
        raise ValueError(f"Error trying to scrape URL: {e}") from e

async def indeed_scrape(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    # Extract job title
    title_span = soup.select_one(".jobsearch-JobInfoHeader-title span")
    title = title_span.find(text = True, recursive = False) if title_span else None
    
    # Extract company NAME (this is the string we need)
    company_element = soup.select_one('[data-testid="jobsearch-CompanyInfoContainer"] a')
    company_name = company_element.get_text(strip=True) if company_element else None
    
    # Extract location
    location = soup.select_one('[data-testid="inlineHeader-companyLocation"] div')

    # Extract salary and job type - Multiple strategies
    salary = None
    job_type = None
    
    # Strategy 1: Try the salaryInfoAndJobType section
    info = soup.select_one("#salaryInfoAndJobType")
    if info:
        # Get all text from all elements
        all_text = info.get_text(separator="|", strip=True)
        parts = [p.strip() for p in all_text.split("|") if p.strip()]
        
        for part in parts:
            # Check for salary
            if not salary and ("$" in part or "hour" in part.lower() or "year" in part.lower() or "month" in part.lower()):
                salary = part
            # Check for job type
            if not job_type and any(keyword in part.lower() for keyword in ["full-time", "full time", "part-time", "part time", "contract", "temporary", "internship", "freelance"]):
                job_type = part
    
    # Strategy 2: Look for salary in metadata or attribute fields
    if not salary:
        salary_meta = soup.select_one('[data-testid="viewJobBodyJobCompensation"]')
        if salary_meta:
            salary = salary_meta.get_text(strip=True)
    
    # Strategy 3: Look for job type in metadata or attribute fields  
    if not job_type:
        job_type_meta = soup.select_one('[data-testid="viewJobBodyJobDetailsJobType"]')
        if job_type_meta:
            job_type = job_type_meta.get_text(strip=True)
    
    # Extract application deadline - only if explicitly stated
    deadline = None
    
    # Look for explicit deadline text only
    import re
    deadline_elements = soup.find_all(string=re.compile(r'(apply by|closes? on|deadline|due date)', re.IGNORECASE))
    for elem in deadline_elements:
        parent_text = elem.parent.get_text(strip=True) if elem.parent else ""
        # Try to extract date from text
        date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', parent_text)
        if date_match:
            deadline = date_match.group(1)
            break
    
    # Extract description
    description = soup.select_one("#jobDescriptionText")
    
    # Get company page URL
    href = soup.select_one('[data-testid="inlineHeader-companyName"] a')
    company_url = href.get("href") if href else None

    # Get full company data (size, industry, HQ, website, description, image)
    company_data = await indeed_company_info(company_url) if company_url else None

    # Return company name as string AND company_data as separate object
    return {
        "title": title.get_text(strip = True) if title else None,
        "company": company_name,
        "company_data": company_data,
        "location": location.get_text(strip = True) if location else None,
        "salary": salary,
        "deadline": None,
        "industry": company_data.get("industry") if company_data else None,
        "job_type": job_type,
        "description": description.get_text(strip = True) if description else None,
    }

async def indeed_company_info(url: str):
    loop = asyncio.get_event_loop()
    html = await loop.run_in_executor(_executor, _scrape_with_playwright, url)

    soup = BeautifulSoup(html, "html.parser")

    # company size
    size_tab = soup.select_one('li[data-testid="companyInfo-employee"]')
    outer_span = size_tab.find("span") if size_tab else None
    inner_span = outer_span.find("span") if outer_span else None

    inner_text = inner_span.get_text(strip = True) if inner_span else ""
    company_size = outer_span.get_text(strip = True).replace(inner_text, "") if outer_span  else ""
    comparator = inner_span.find(text = True, recursive = False) if inner_span else ""

    # company industry
    industry_div = soup.select_one('li[data-testid="companyInfo-industry"] > div:nth-of-type(2)')

    # company headquarters location
    headquarters_div = soup.select_one('li[data-testid="companyInfo-headquartersLocation"] > span:nth-of-type(1)')

    # company website
    homepage_link_element = soup.select_one('li[data-testid="companyInfo-companyWebsite"] > div:nth-of-type(2) > a')
    homepage_link = homepage_link_element.get("href") if homepage_link_element else None

    # company description
    description_element = soup.select_one('div[data-testid="less-text"] > p')
    description = description_element.get_text(strip = True) if description_element else None

    # profile image
    image_element = soup.select_one('div[data-testid="cmp-HeaderLayout"] img')
    image_url = image_element.get("src") if image_element else None
    
    img_b64 = None
    if image_url:
        try:
            # Handle relative URLs by prepending Indeed's base URL
            if image_url.startswith('/'):
                image_url = f"https://www.indeed.com{image_url}"
            elif not image_url.startswith('http'):
                image_url = f"https://www.indeed.com/{image_url}"
            
            res = requests.get(image_url)
            res.raise_for_status()
            img_b64 = base64.b64encode(res.content).decode("utf-8")
        except Exception as e:
            print(f"Failed to fetch company image: {e}")
            img_b64 = None
    
    return {
        "size": f"{comparator} {company_size}".strip() if company_size else None,
        "industry": industry_div.get_text(strip = True) if industry_div else None,
        "location": headquarters_div.get_text(strip = True) if headquarters_div else None,
        "website": homepage_link,
        "description": description,
        "image": img_b64
    }