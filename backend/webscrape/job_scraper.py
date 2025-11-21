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
import requests
import base64

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
    job_html = None
    company_html = None

    try:
        with sync_playwright() as p:
            # Launch browser in headless mode (set False for debugging)
            browser = p.chromium.launch(
                headless=True,
                slow_mo=50,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )

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

            # Load job page
            logger.info(f"📄 Fetching job page: {url}")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(2000)
                page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                page.wait_for_timeout(1000)

                job_html = page.content()
                logger.info(f"✅ Job page loaded: {page.title()}")

                # Scrape company page if requested
                if scrape_company:
                    domain = tldextract.extract(url).domain.lower()

                    if domain == "linkedin":
                        # Attempt to find company name or logo link
                        company_name_elem = page.query_selector(
                            'a[data-tracking-control-name="public_jobs_topcard-org-name"], a[data-tracking-control-name="public_jobs_topcard_logo"]'
                        )

                        company_url = None
                        if company_name_elem:
                            company_url = company_name_elem.get_attribute('href')

                        # Fallback: construct LinkedIn company URL from name if known
                        if not company_url:
                            try:
                                # Try to extract company name text
                                company_text = page.query_selector('a.topcard__org-name-link').inner_text()
                                company_text = company_text.strip().lower().replace(' ', '-')
                                company_url = f"https://www.linkedin.com/company/{company_text}"
                                logger.info(f"🏢 Fetching company page directly: {company_url}")
                            except Exception:
                                logger.warning("⚠️ Company name not provided; cannot construct LinkedIn URL")

                        if company_url:
                            page.goto(company_url, wait_until="domcontentloaded")
                            page.wait_for_timeout(2000)

                            # Detect and remove login overlay if it appears
                            try:
                                overlay = page.query_selector('div[role="dialog"]')
                                if overlay:
                                    page.evaluate('(el) => el.remove()', overlay)
                                    logger.info("✅ Removed LinkedIn login overlay")
                            except Exception as e:
                                logger.debug(f"No overlay found: {e}")

                            # Scroll again to load lazy content
                            page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                            page.wait_for_timeout(1000)

                            company_html = page.content()
                            logger.info("✅ Company page loaded (overlay removed)")

            except PlaywrightTimeout:
                logger.error("❌ Timeout loading page")
                raise URLScrapeError("Page took too long to load")

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
