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
    "password": "Password_123!",
    "email": "attacker@test.com",
    "full_name": "Attacker Account"
}

VICTIM_CREDS = {
    "username": "victim",
    "password": "Password_123!",
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
        ATTACKER_CREDS["username"] = f"attacker_{unique_id}"
        VICTIM_CREDS["username"] = f"victim_{unique_id}"
        
        log(f"Generated unique test accounts: {ATTACKER_CREDS['email']}, {VICTIM_CREDS['email']}")
        log("Setting up Attacker and Victim accounts...")

        for creds in [ATTACKER_CREDS, VICTIM_CREDS]:
            # Register (Ignore errors if they exist)
            reg_resp = requests.post(f"{BASE_URL}/auth/register", json=creds)
            if reg_resp.status_code != 200 and reg_resp.status_code != 201:
                log(f"Registration failed for {creds['username']}: {reg_resp.text}", "WARN")
            
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
            log(f"Spamming {test} endpoint 50 times...", "INFO")
            
            blocked = False
            for i in range(50):
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
            else: log("No rate limiting detected. Sent 50 reqs without 429.", "FAIL")
    
    def test_session_invalidation(self):
        print(f"\n{Colors.HEADER}--- Testing Session Invalidation ---{Colors.ENDC}")
        if not self.victim_auth: 
            log("Skipping Session Test: No Victim Session", "FAIL")
            return

        # 1. Verify token works initially
        check = requests.post(f"{BASE_URL}/auth/validate-session", headers=self.victim_auth)
        if check.status_code != 200:
            log("Setup Failed: Token was already invalid.", "WARN")
            return

        # 2. Logout
        log("Logging out victim...", "INFO")
        logout_resp = requests.post(f"{BASE_URL}/auth/logout", headers=self.victim_auth)
        
        if logout_resp.status_code != 200:
            log(f"Logout endpoint failed: {logout_resp.status_code}", "WARN")

        # 3. Attempt to use the DEAD token
        # We try to hit a protected endpoint (validate-session) with the old headers
        retry = requests.post(f"{BASE_URL}/auth/validate-session", headers=self.victim_auth)
        
        if retry.status_code == 401 or retry.status_code == 403:
            log("Secure: Token was successfully invalidated server-side.", "PASS")
        else:
            log("VULNERABLE: Old token is STILL valid after logout!", "FAIL")

    def test_mass_assignment(self):
        print(f"\n{Colors.HEADER}--- Testing Mass Assignment (Privilege Esc) ---{Colors.ENDC}")
        
        # Attempt to register a user with 'admin' privileges injected
        payload = ATTACKER_CREDS.copy()
        payload["email"] = f"admin_try_{int(time.time())}@test.com"
        payload["username"] = f"admin_hack_{int(time.time())}"
        
        # INJECTED FIELDS
        payload["is_admin"] = True
        payload["role"] = "admin"
        payload["permissions"] = ["root", "all"]

        try:
            resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
            
            if resp.status_code in [200, 201]:
                data = resp.json()
                # Check if the server echoed back our malicious fields
                if data.get("is_admin") is True or data.get("role") == "admin":
                    log("VULNERABLE: Server accepted admin fields!", "FAIL")
                else:
                    log("Safe: Pydantic stripped unknown fields.", "PASS")
            else:
                log(f"Registration blocked (possibly due to schema validation). Status: {resp.status_code}", "PASS")
                
        except Exception as e:
            log(f"Mass assignment test error: {e}", "WARN")


    def test_file_upload(self):
        print(f"\n{Colors.HEADER}--- Testing Malicious File Uploads ---{Colors.ENDC}")
        if not self.victim_auth: 
            log("Skipping Upload Test: No Victim Session", "FAIL")
            return

        # 1. Payload: A binary "exploit" file disguised as HTML
        # The 'b\xFF\xFE' bytes are invalid UTF-8 (BOM for UTF-16), which should trigger your decode() error.
        fake_file_content = b'\xFF\xFE\x00\x00_MALICIOUS_BINARY_CODE_' 
        
        files = {
            'file': ('exploit.html', fake_file_content, 'text/html')
        }
        
        # 2. Required Form Data (Must match your endpoint)
        data = {
            "title": "Malicious Upload Test",
            "company": "Security Audit Corp",
            "position": "Penetration Tester",
            "version_name": "v1.0 (Exploit)"
        }
    
        upload_url = f"{BASE_URL}/cover-letters/upload" 
        
        try:
            log(f"Attempting to upload binary file to: {upload_url}", "INFO")
            resp = requests.post(upload_url, files=files, data=data, headers=self.victim_auth)
            
            if resp.status_code == 200:
                log("VULNERABLE: Server accepted a binary file disguised as HTML!", "FAIL")
                
            elif resp.status_code == 400:
                # We expect 400 because content.decode('utf-8') should fail on binary data
                if "Failed to read file" in resp.text or "supported" in resp.text:
                    log("Safe: Server correctly rejected the invalid file content.", "PASS")
                else:
                    log(f"Blocked with generic 400: {resp.text}", "PASS")
                    
            elif resp.status_code == 422:
                log("Configuration Error: Missing form fields or wrong endpoint URL.", "WARN")
                log(f"Response: {resp.text}", "WARN")
                
            else:
                log(f"Unexpected status: {resp.status_code} - {resp.text}", "INFO")

        except Exception as e:
            log(f"File upload test error: {e}", "WARN")

    def test_sensitive_headers(self):
        print(f"\n{Colors.HEADER}--- Testing Sensitive Headers ---{Colors.ENDC}")
        try:
            resp = requests.get(f"{BASE_URL}/auth/login")
            headers = resp.headers
        
            sensitive_headers = [h for h in headers if h in ["X-Powered-By"]]

            if sensitive_headers:
                log(f"Sensitive Header Found: {sensitive_headers}", "WARN")
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
        log(f"Victim created Job ID")

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
    scanner.test_file_upload()
    scanner.test_mass_assignment()
    scanner.test_session_invalidation()