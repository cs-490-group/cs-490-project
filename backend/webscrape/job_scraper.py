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

_executor = ThreadPoolExecutor(max_workers=3)

class URLScrapeError(Exception):
    """Custom exception for scraping errors"""
    def __init__(self, message: str = "Unable to scrape this URL"):
        super().__init__(message)


def _scrape_with_playwright_sync(url: str, scrape_company: bool = False) -> Tuple[str, Optional[str]]:
    """Scrape job page and optionally company page with a fresh browser context."""
    job_html = None
    company_html = None

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=False,
                slow_mo=50,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )

            # --------------------
            # TAB 1: Job Page
            # --------------------
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                timezone_id='America/New_York'
            )

            job_page = context.new_page()
            job_page.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
            job_page.route("**/*", lambda route: (
                route.abort() if route.request.resource_type in ["image", "font", "media"]
                else route.continue_()
            ))

            logger.info(f"📄 Fetching job page: {url}")
            job_page.goto(url, wait_until="domcontentloaded", timeout=45000)
            job_page.wait_for_timeout(2000)
            job_page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
            job_page.wait_for_timeout(1000)
            job_html = job_page.content()
            logger.info(f"✅ Job page loaded: {job_page.title()}")

            # Extract company URL
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(job_html, "html.parser")
            company_elem = soup.select_one(
                'a[data-tracking-control-name="public_jobs_topcard-org-name"], a[data-tracking-control-name="public_jobs_topcard-logo"]'
            )
            company_url = company_elem['href'] if company_elem else None
            if not company_url:
                company_text_elem = soup.select_one('a.topcard__org-name-link')
                if company_text_elem:
                    company_text = company_text_elem.get_text(strip=True).lower().replace(' ', '-')
                    company_url = f"https://www.linkedin.com/company/{company_text}"
                    logger.info(f"🏢 Constructed company URL: {company_url}")

            # Close job page and clear context
            job_page.close()
            context.close()

            # --------------------
            # TAB 2: Company Page
            # --------------------
            if scrape_company and company_url:
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080},
                    locale='en-US',
                    timezone_id='America/New_York'
                )
                company_page = context.new_page()
                company_page.goto(company_url, wait_until="domcontentloaded", timeout=30000)
                company_page.wait_for_timeout(2000)
                company_page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                company_page.wait_for_timeout(1000)
                company_html = company_page.content()
                company_page.close()
                context.close()

            browser.close()
            return job_html, company_html

    except Exception as e:
        logger.error(f"❌ Error in Playwright scraping: {e}")
        raise URLScrapeError(f"Failed to fetch page: {str(e)}")


async def job_from_url(url: str) -> Dict[str, Any]:
    ext = tldextract.extract(url)
    domain = ext.domain.lower()

    logger.info(f"🔍 Starting scrape for {domain.upper()}")
    logger.info(f"🔗 URL: {url}")

    try:
        loop = asyncio.get_event_loop()
        job_html, company_html = await loop.run_in_executor(
            _executor,
            _scrape_with_playwright_sync,
            url,
            True
        )

        if domain == "indeed":
            return await scrape_indeed(job_html, company_html, url)
        elif domain == "linkedin":
            return await scrape_linkedin(job_html, company_html, url)
        elif domain == "glassdoor":
            return await scrape_glassdoor(job_html, company_html, url)
        else:
            raise URLScrapeError(
                f"Unsupported platform: {domain}. Supported platforms: Indeed, LinkedIn, Glassdoor"
            )

    except URLScrapeError:
        raise
    except Exception as e:
        logger.error(f"❌ Error scraping URL: {e}")
        logger.error(traceback.format_exc())
        raise ValueError(f"Failed to scrape job posting: {str(e)}")
