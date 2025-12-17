import asyncio
from playwright.async_api import async_playwright
from axe_playwright_python.async_playwright import Axe
from datetime import datetime

# CONFIGURATION
BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/login"
TEST_USER = {"email": "ninja33910@gmail.com", "password": "CS490Password"}

# PAGES
PAGES_TO_SCAN = [
    "/dashboard",
    "/profile",
    "/analytics",
    "/newGroup",           
    "/setup-team",         
    "/teams",              
    "/enterprise",
    "/setup-org",
    "/employment-history", 
    "/forgotPassword",     
    "/set-password",
    "/cover-Letter",       
    "/job-matching",
    "/skills",
    "/education",
    "/certifications",
    "/projects",
    "/jobs",
    "/offers",
    "/resumes",
    "/resumes/templates",  
    
    # Interview Section
    "/interview/question-library", # Was /question-bank
    "/interview/my-practice",
    "/interview/progress",
    "/interview/mock-interview-start",
    "/interview/schedule-interview",
    "/interview/analytics",        # Was /interview-analytics
    "/interview/follow-up",
    "/interview/writing-practice",
    "/interview/success-probability",
    "/interview/calendar",
    "/interview/performance",

    # Technical Prep
    "/technical-prep",
    "/technical-prep/coding",
    "/technical-prep/system-design",
    "/technical-prep/case-study",
    "/technical-prep/whiteboarding",
    "/pipeline-management",

    # Network
    "/network",
    "/network/referrals",
    "/network/events",
    "/network/interviews",
    "/network/mentorship",
    "/network/discovery",
    "/network/analytics",
    
    "/api-metrics"
]

class AccessibilityScanner:
    def __init__(self):
        self.results = []

    async def run(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()

            print(f"🔵 Starting Comprehensive Scan on {BASE_URL}...")

            # --- 1. LOGIN ---
            print("🔑 Logging in...")
            try:
                await page.goto(LOGIN_URL)
                await page.fill('input[type="email"]', TEST_USER["email"])
                await page.fill('input[type="password"]', TEST_USER["password"])
                
                if await page.locator('button[type="submit"]').count() > 0:
                    await page.click('button[type="submit"]')
                else:
                    await page.keyboard.press('Enter')
                
                try:
                    await page.wait_for_url("**/dashboard", timeout=5000)
                except:
                    print("Login redirect wait timed out (continuing)...")
                
                print("Login sequence finished")
            except Exception as e:
                print(f"Login failed: {e}")
                await browser.close()
                return

            # --- 2. SCAN PAGES ---
            axe = Axe()
            
            for path in PAGES_TO_SCAN:
                full_url = f"{BASE_URL}{path}"
                print(f"\nScanning: {path}...")
                
                try:
                    await page.goto(full_url)
                    await page.wait_for_load_state("domcontentloaded")
                    await page.wait_for_timeout(1500) 
                    
                    # Run Axe
                    results = await axe.run(page)
                    
                    # Try accessing violations in different ways to handle version diffs
                    violations = []
                    
                    if hasattr(results, 'violations'):
                        violations = results.violations
                    elif isinstance(results, dict) and 'violations' in results:
                        violations = results['violations']
                    # Some versions return the raw JSON dict directly
                    elif hasattr(results, 'response'): 
                         violations = results.response.get('violations', [])
                    
                    violation_count = len(violations)

                    if violation_count > 0:
                        print(f"   ⚠️  Found {violation_count} violations")
                        self.log_violations(path, violations)
                    else:
                        print("   ✨ Clean!")
                        
                except Exception as e:
                    print(f" Error scanning {path}: {e}")

            await browser.close()
            self.generate_report()

    def log_violations(self, page_url, violations):
        for v in violations:
            # Handle object vs dict access for individual violation items
            if isinstance(v, dict):
                impact = v.get('impact', 'unknown')
                issue = v.get('help', 'No help text')
                description = v.get('description', 'No description')
                nodes = v.get('nodes', [])
                element = nodes[0].get('html', 'Unknown') if nodes else 'Unknown'
            else:
                # Object access
                impact = getattr(v, 'impact', 'unknown')
                issue = getattr(v, 'help', 'No help text')
                description = getattr(v, 'description', 'No description')
                nodes = getattr(v, 'nodes', [])
                # Nodes might be objects too
                if nodes and hasattr(nodes[0], 'html'):
                    element = nodes[0].html
                else:
                    element = "Unknown"

            self.results.append({
                "page": page_url,
                "impact": impact,
                "issue": issue,
                "description": description,
                "element": element
            })

    def generate_report(self):
        print("\n" + "="*60)
        print(f"METAMORPHOSIS ACCESSIBILITY REPORT - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print("="*60)
        
        if not self.results:
            print("No violations found! Your app is accessible.")
            return

        critical = [r for r in self.results if r['impact'] == 'critical']
        
        print(f"SUMMARY: {len(critical)} Critical Issues Found (Total: {len(self.results)})\n")

        if critical:
            print("CRITICAL ISSUES (FIX IMMEDIATELY):")
            for item in critical:
                print(f"  • Page: {item['page']}")
                print(f"    Issue: {item['issue']}")
                print(f"    Code: {item['element'][:80]}...")
                print("-" * 30)

        with open("accessibility_report.txt", "w", encoding="utf-8") as f:
            for item in self.results:
                f.write(f"[{str(item['impact']).upper()}] {item['page']}\n")
                f.write(f"Issue: {item['issue']}\n")
                f.write(f"Desc: {item['description']}\n")
                f.write(f"Element: {item['element']}\n")
                f.write("-" * 40 + "\n")
        
        print(f"\nFull report saved to 'accessibility_report.txt'")

if __name__ == "__main__":
    scanner = AccessibilityScanner()
    asyncio.run(scanner.run())