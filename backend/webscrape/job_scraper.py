"""
Enhanced Job Scraper for Indeed, LinkedIn, and Glassdoor
Main entry point and shared utilities
"""

import asyncio
import logging
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from typing import Optional, Dict, Any, Tuple
from concurrent.futures import ThreadPoolExecutor
import traceback
import tldextract

from .indeed_scraper import scrape_indeed
from .linkedin_scraper import scrape_linkedin
from .glassdoor_scraper import scrape_glassdoor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread pool for running sync Playwright (Windows compatibility)
_executor = ThreadPoolExecutor(max_workers=3)


class URLScrapeError(Exception):
    """Custom exception for scraping errors"""
    def __init__(self, message: str = "Unable to scrape this URL"):
        super().__init__(message)


def _scrape_with_playwright_sync(url: str, scrape_company: bool = False) -> Tuple[str, Optional[str]]:
    """
    Synchronous function to fetch and optionally navigate to company page using Playwright
    Returns: (job_html, company_html)
    """
    job_html = None
    company_html = None
    
    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )
            
            # Create context with realistic settings
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                timezone_id='America/New_York',
                extra_http_headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            )
            
            page = context.new_page()
            
            # Remove webdriver detection
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)
            
            # Block unnecessary resources
            page.route("**/*", lambda route: (
                route.abort() if route.request.resource_type in ["image", "font", "media"] 
                else route.continue_()
            ))
            
            logger.info(f"📄 Fetching job page: {url}")
            
            # Navigate to job page
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(3000)
                
                title = page.title()
                logger.info(f"✅ Job page loaded: {title}")
                
                # Check for CloudFlare
                page_content = page.content()
                if 'checking your browser' in page_content.lower() or 'just a moment' in page_content.lower():
                    logger.warning("⏳ CloudFlare detected, waiting longer...")
                    page.wait_for_timeout(5000)
                    page_content = page.content()
                
                job_html = page_content
                
                # Now try to navigate to company page if requested
                if scrape_company:
                    logger.info("🏢 Looking for company page link...")
                    
                    domain = tldextract.extract(url).domain.lower()
                    
                    try:
                        if domain == "linkedin":
                            # LinkedIn: Click on company name/logo
                            selectors = [
                                'a.topcard__org-name-link',
                                'a[data-tracking-control-name*="public_jobs_topcard-org-name"]',
                                '.top-card-layout__second-subline a',
                                'a[href*="/company/"]'
                            ]
                            
                            for selector in selectors:
                                try:
                                    element = page.wait_for_selector(selector, timeout=3000)
                                    if element:
                                        company_url = element.get_attribute('href')
                                        if company_url and '/company/' in company_url:
                                            # Make sure it's a full URL
                                            if not company_url.startswith('http'):
                                                company_url = f"https://www.linkedin.com{company_url}"
                                            
                                            logger.info(f"✅ Found LinkedIn company link: {company_url}")
                                            
                                            # Navigate to company page
                                            page.goto(company_url, wait_until="domcontentloaded", timeout=30000)
                                            page.wait_for_timeout(3000)
                                                                                    
                                            company_html = page.content()
                                            logger.info(f"✅ LinkedIn company page loaded: {page.title()}")
                                            break
                                except:
                                    continue
                        
                        elif domain == "glassdoor":
                            # Glassdoor: Click on company name
                            selectors = [
                                'a[data-test="employer-name"]',
                                'div[data-test="employer-name"] a',
                                'a[class*="EmployerProfile_employerName"]',
                                'a[href*="/Overview/"]'
                            ]
                            
                            for selector in selectors:
                                try:
                                    element = page.wait_for_selector(selector, timeout=3000)
                                    if element:
                                        logger.info(f"✅ Found Glassdoor company link, clicking...")
                                        element.click()
                                        page.wait_for_timeout(3000)
                                        
                                        company_html = page.content()
                                        logger.info(f"✅ Glassdoor company page loaded: {page.title()}")
                                        break
                                except:
                                    continue
                        
                        elif domain == "indeed":
                            # Indeed: Click on company name
                            selectors = [
                                'div[data-testid="inlineHeader-companyName"] a',
                                '[data-testid="inlineHeader-companyName"] a',
                                'a[data-tn-element="companyName"]',
                                'a.css-1ioi40n'
                            ]
                            
                            for selector in selectors:
                                try:
                                    element = page.wait_for_selector(selector, timeout=3000)
                                    if element:
                                        logger.info(f"✅ Found Indeed company link, clicking...")
                                        element.click()
                                        page.wait_for_timeout(3000)
                                        
                                        company_html = page.content()
                                        logger.info(f"✅ Indeed company page loaded: {page.title()}")
                                        break
                                except:
                                    continue
                        
                        if not company_html:
                            logger.warning("⚠️ Could not navigate to company page")
                            
                    except Exception as e:
                        logger.warning(f"⚠️ Error navigating to company page: {e}")
                
            except PlaywrightTimeout:
                logger.error("❌ Timeout loading page")
                raise URLScrapeError("Page took too long to load")
            
            browser.close()
            return (job_html, company_html)
            
    except Exception as e:
        logger.error(f"❌ Error in Playwright scraping: {e}")
        raise URLScrapeError(f"Failed to fetch page: {str(e)}")


async def job_from_url(url: str) -> Dict[str, Any]:
    """
    Main entry point for job scraping
    Detects platform and routes to appropriate scraper
    """
    ext = tldextract.extract(url)
    domain = ext.domain.lower()
    
    logger.info(f"🔍 Starting scrape for {domain.upper()}")
    logger.info(f"🔗 URL: {url}")
    
    try:
        # Run sync Playwright in thread pool - now also navigates to company page
        loop = asyncio.get_event_loop()
        job_html, company_html = await loop.run_in_executor(
            _executor, 
            _scrape_with_playwright_sync, 
            url, 
            True  # scrape_company = True
        )
        
        # Route to appropriate scraper
        if domain == "indeed":
            return await scrape_indeed(job_html, company_html, url)
        elif domain == "linkedin":
            return await scrape_linkedin(job_html, company_html, url)
        elif domain == "glassdoor":
            return await scrape_glassdoor(job_html, company_html, url)
        else:
            raise URLScrapeError(
                f"Unsupported platform: {domain}. "
                "Supported platforms: Indeed, LinkedIn, Glassdoor"
            )
            
    except URLScrapeError:
        raise
    except Exception as e:
        logger.error(f"❌ Error scraping URL: {e}")
        logger.error(traceback.format_exc())
        raise ValueError(f"Failed to scrape job posting: {str(e)}")