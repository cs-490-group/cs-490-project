import requests
import json
import time
import os
import datetime
import logging
import random 

# CONFIGURATION
# BASE_URL = "http://localhost:8000/api" 
BASE_URL = "https://cs-490-project-production.up.railway.app/api"  # Production

# Base credentials
ATTACKER_CREDS = {
    "username": "attacker",
    "password": "password123",
    "email": "attacker@test.com",
    "full_name": "Attacker Account"
}

VICTIM_CREDS = {
    "username": "victim",
    "password": "password123",
    "email": "victim@test.com",
    "full_name": "Victim Account"
}

# --- SETUP LOGGING ---
if not os.path.exists('security_reports'):
    os.makedirs('security_reports')

timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
report_filename = f"security_reports/audit_{timestamp}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[
        logging.FileHandler(report_filename), 
        logging.StreamHandler()              
    ]
)

class Colors:
    HEADER = '\033[95m'
    OKGREEN = '\033[92m'
    FAIL = '\033[91m'
    WARNING = '\033[93m'
    ENDC = '\033[0m'

def log(message, type="INFO"):
    if type == "PASS": 
        print(f"{Colors.OKGREEN}[PASS]{Colors.ENDC} {message}")
        logging.info(f"[PASS] {message}")
    elif type == "FAIL": 
        print(f"{Colors.FAIL}[VULNERABLE]{Colors.ENDC} {message}")
        logging.error(f"[VULNERABLE] {message}")
    elif type == "WARN": 
        print(f"{Colors.WARNING}[WARNING]{Colors.ENDC} {message}")
        logging.warning(f"[WARNING] {message}")
    else: 
        print(f"[INFO] {message}")
        logging.info(f"[INFO] {message}")

class MetamorphosisScanner:
    def __init__(self):
        self.victim_auth = None 
        self.attacker_auth = None

    def setup_users(self):
        # ⚡ FIX: Generate unique emails based on time to avoid "User Already Exists" errors
        unique_id = int(time.time())
        ATTACKER_CREDS["email"] = f"attacker_{unique_id}@test.com"
        VICTIM_CREDS["email"] = f"victim_{unique_id}@test.com"
        
        log(f"Generated unique test accounts: {ATTACKER_CREDS['email']}, {VICTIM_CREDS['email']}")
        log("Setting up Attacker and Victim accounts...")

        for creds in [ATTACKER_CREDS, VICTIM_CREDS]:
            # Register (Ignore errors if they exist)
            requests.post(f"{BASE_URL}/auth/register", json=creds)
            
            # Login
            login_payload = {"email": creds["email"], "password": creds["password"]}
            resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
            
            if resp.status_code == 200:
                data = resp.json()
                auth_headers = {
                    "uuid": data.get("uuid"), 
                    "Authorization": f"Bearer {data.get('session_token')}"
                }
                if creds == ATTACKER_CREDS: self.attacker_auth = auth_headers
                else: self.victim_auth = auth_headers
                log(f"Logged in as {creds['username']}")
            else:
                # ⚡ FIX: Print the ACTUAL error message from the server
                log(f"Login failed for {creds['username']}: {resp.status_code} - RESPONSE: {resp.text}", "FAIL")

    def test_rate_limiting(self):
        print(f"\n{Colors.HEADER}--- Testing Rate Limiting ---{Colors.ENDC}")

        # Use the randomized credentials for the test
        for test in ["register", "login"]:
            log(f"Spamming {test} endpoint 20 times...", "INFO")
            
            blocked = False
            for i in range(20):
                # Send valid JSON structure
                if test == "register":
                    payload = ATTACKER_CREDS.copy()
                    payload["email"] = f"spam_{i}_{int(time.time())}@test.com" # Unique email per spam
                    resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
                else:
                    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": ATTACKER_CREDS["email"], "password": f"wrong{i}"})
                
                if resp.status_code == 429:
                    blocked = True
                    break
            
            if blocked: log(f"Rate limiting active. Blocked after {i} requests.", "PASS")
            else: log("No rate limiting detected. Sent 20 reqs without 429.", "FAIL")
    
    def test_sensitive_headers(self):
        print(f"\n{Colors.HEADER}--- Testing Sensitive Headers ---{Colors.ENDC}")
        try:
            resp = requests.get(f"{BASE_URL}/auth/login")
            headers = resp.headers
            
            if "Server" in headers or "X-Powered-By" in headers:
                log(f"Sensitive Header Found: {headers.get('Server', '')} {headers.get('X-Powered-By', '')}", "WARN")
            else:
                log("Server headers are hidden.", "PASS")
        except Exception as e:
            log(f"Header check failed: {e}", "WARN")

    def test_csrf(self):
        print(f"\n{Colors.HEADER}--- Testing CSRF Vulnerabilities ---{Colors.ENDC}")
        if not self.victim_auth:
            log("Skipping CSRF: No Victim Session", "FAIL")
            return

        csrf_payload = {
            "title": "CSRF Attack Job",
            "company": "Hacker Inc",
            "description": "If this exists, CSRF is possible.",
            "status": "Applied",
            "deadline": "2025-12-31"
        }

        vulnerable_headers = {
            "Content-Type": "application/json"
            # NOTE: Authorization header is intentionally REMOVED
        }

        try:
            resp = requests.post(f"{BASE_URL}/jobs", json=csrf_payload, headers=vulnerable_headers)

            if resp.status_code == 200 or resp.status_code == 201:
                log("VULNERABLE: Request succeeded without Auth header! (Possible CSRF)", "FAIL")
            elif resp.status_code == 401 or resp.status_code == 403:
                log("Safe: Server rejected request without explicit Authorization header.", "PASS")
            else:
                log(f"Safe: Request failed with status {resp.status_code}", "PASS")
                
        except Exception as e:
            log(f"CSRF test error: {e}", "WARN")

    def test_nosql_injection(self):
        print(f"\n{Colors.HEADER}--- Testing NoSQL Injection ---{Colors.ENDC}")
        # Payload: Pass a dictionary instead of a string to bypass password check
        payload = {
            "email": VICTIM_CREDS["email"],
            "password": {"$ne": None} 
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/auth/login", json=payload) 
            
            if resp.status_code == 200:
                log("NoSQL Injection Successful! Login bypassed.", "FAIL")
            elif resp.status_code == 422 or resp.status_code == 400:
                log("Pydantic blocked the injection (Type Validation).", "PASS")
            else:
                log(f"Injection failed with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Error testing injection: {e}", "WARN")

    def test_xss(self):
        print(f"\n{Colors.HEADER}--- Testing Stored XSS ---{Colors.ENDC}")
        if not self.attacker_auth: 
            log("Skipping XSS: No Attacker Token", "FAIL")
            return

        xss_payload = "<img src=x onerror=alert('XSS')>"
        data = {
            "title": "XSS Test Job",
            "company": "Evil Corp",
            "description": xss_payload,
            "status": "Interested",
            "deadline": "2025-01-01"
        }
        
        # Attacker creates the malicious job
        resp = requests.post(f"{BASE_URL}/jobs", json=data, headers=self.attacker_auth)
        
        if resp.status_code in [200, 201]:
            job_id = resp.json().get("_id") or resp.json().get("id")
            
            # Fetch it back to see if it was sanitized
            get_resp = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=self.attacker_auth)
            if xss_payload in get_resp.text:
                log("VULNERABLE: XSS payload returned unsanitized!", "FAIL")
            else:
                log("Safe: XSS Payload sanitized or encoded.", "PASS")
        else:
            log(f"Could not create job. Status: {resp.status_code}", "WARNING")

    def test_idor(self):
        print(f"\n{Colors.HEADER}--- Testing IDOR (AuthZ) ---{Colors.ENDC}")
        if not self.victim_auth or not self.attacker_auth:
            log("Skipping IDOR: Missing tokens", "FAIL")
            return

        # 1. Victim creates a job
        job_data = {"title": "Victim Job", "company": "Safe Co", "deadline": "2025-01-01"}
        resp = requests.post(f"{BASE_URL}/jobs", json=job_data, headers=self.victim_auth)
        
        if resp.status_code not in [200, 201]:
            log("Victim could not create job. IDOR test aborted.", "FAIL")
            return

        victim_job_id = resp.json().get("_id") or resp.json().get("id")
        log(f"Victim created Job ID: {victim_job_id}")

        # 2. Attacker tries to DELETE it
        del_resp = requests.delete(f"{BASE_URL}/jobs/{victim_job_id}", headers=self.attacker_auth)
        
        if del_resp.status_code in [200, 204]:
            log("VULNERABLE: Attacker deleted Victim's job!", "FAIL")
        elif del_resp.status_code in [403, 404]:
            log("Secure: Access Denied.", "PASS")
        else:
            log(f"Unexpected status: {del_resp.status_code}", "WARNING")

if __name__ == "__main__":
    scanner = MetamorphosisScanner()
    scanner.setup_users()
    scanner.test_rate_limiting()
    scanner.test_nosql_injection()
    scanner.test_xss()
    scanner.test_idor()
    scanner.test_csrf()
    scanner.test_sensitive_headers()