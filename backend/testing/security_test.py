import requests
import json
import time

# CONFIGURATION
#BASE_URL = "http://localhost:8000/api" 
BASE_URL = "https://cs-490-project-production.up.railway.app/api"  #Use for actual website.

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

class Colors:
    HEADER = '\033[95m'
    OKGREEN = '\033[92m'
    FAIL = '\033[91m'
    WARNING = '\033[93m'
    ENDC = '\033[0m'

def log(message, type="INFO"):
    if type == "PASS": print(f"{Colors.OKGREEN}[PASS]{Colors.ENDC} {message}")
    elif type == "FAIL": print(f"{Colors.FAIL}[VULNERABLE]{Colors.ENDC} {message}")
    elif type == "WARN": print(f"{Colors.WARNING}[WARNING]{Colors.ENDC} {message}")
    else: print(f"[INFO] {message}")

class MetamorphosisScanner:
    def __init__(self):
        self.victim_auth = None 
        self.attacker_auth = None

    def setup_users(self):
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
                    "uuid": data["uuid"],
                    "Authorization": f"Bearer {data['session_token']}"
                }
                if creds == ATTACKER_CREDS: self.attacker_auth = auth_headers
                else: self.victim_auth = auth_headers
                log(f"Logged in as {creds['username']}")
            else:
                log(f"Login failed for {creds['username']}: {resp.status_code}", "FAIL")

    def test_rate_limiting(self):
        print(f"\n{Colors.HEADER}--- Testing Rate Limiting ---{Colors.ENDC}")

        for test in ["register", "login"]:
            url = f"{BASE_URL}/auth/{test}"
            log(f"Spamming {test} endpoint 20 times...", "INFO")
            
            blocked = False
            for i in range(20):
                # Send correct payload structure so we test logic, not schema validation
                resp = requests.post(f"{BASE_URL}/auth/register", json=ATTACKER_CREDS) if test == "register" else requests.post(f"{BASE_URL}/auth/login", json={"email": "attacker@test.com", "password": f"wrong{i}"})
                if resp.status_code == 429:
                    blocked = True
                    break
            
            if blocked: log(f"Rate limiting active. Blocked after {i} requests.", "PASS")
            else: log("No rate limiting detected. Sent 20 reqs without 429.", "FAIL")

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
            elif resp.status_code == 422:
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