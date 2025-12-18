import requests
import json
import time
import os
import datetime
import logging
import random 

# CONFIGURATION
# BASE_URL = "http://localhost:8000/api" 
BASE_URL = "https://cs-490-project-staging.up.railway.app/api"  # staging

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
        print(f"\n{Colors.HEADER}--- Testing Mass Assignment on Multiple Endpoints ---{Colors.ENDC}")
        
        vulnerable_count = 0
        tested_count = 0

        # Test 1: Register endpoint (original test)
        log("Testing Mass Assignment on /auth/register...", "INFO")
        payload = ATTACKER_CREDS.copy()
        payload["email"] = f"admin_try_{int(time.time())}@test.com"
        payload["username"] = f"admin_hack_{int(time.time())}"
        
        # INJECTED FIELDS
        payload["is_admin"] = True
        payload["role"] = "admin"
        payload["permissions"] = ["root", "all"]

        try:
            resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
            tested_count += 1
            
            if resp.status_code in [200, 201]:
                data = resp.json()
                if data.get("is_admin") is True or data.get("role") == "admin":
                    log("VULNERABLE: Register - Server accepted admin fields!", "FAIL")
                    vulnerable_count += 1
                else:
                    log("Safe: Register - Pydantic stripped unknown fields.", "PASS")
            else:
                log(f"Register - Blocked with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Register mass assignment test error: {e}", "WARN")

        # Test 2: Jobs endpoint - try to inject owner/uuid
        log("Testing Mass Assignment on /jobs endpoint...", "INFO")
        if self.attacker_auth:
            job_payload = {
                "title": "Mass Assignment Test",
                "company": "Evil Corp",
                "deadline": "2025-01-01",
                # INJECTED FIELDS
                "uuid": "fake-uuid-12345",  # Try to set different owner
                "owner": "admin",
                "is_featured": True,
                "priority": 999
            }
            
            try:
                resp = requests.post(f"{BASE_URL}/jobs", json=job_payload, headers=self.attacker_auth)
                tested_count += 1
                
                if resp.status_code in [200, 201]:
                    job_id = resp.json().get("_id") or resp.json().get("id")
                    check = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=self.attacker_auth)
                    
                    check_data = check.json()
                    if (check_data.get("uuid") == "fake-uuid-12345" or 
                        check_data.get("is_featured") is True or 
                        check_data.get("priority") == 999):
                        log("VULNERABLE: Jobs - Server accepted injected fields!", "FAIL")
                        vulnerable_count += 1
                    else:
                        log("Safe: Jobs - Injected fields were stripped.", "PASS")
                else:
                    log(f"Jobs - Blocked with status {resp.status_code}", "PASS")
            except Exception as e:
                log(f"Jobs mass assignment test error: {e}", "WARN")

        # Test 3: Resumes endpoint
        log("Testing Mass Assignment on /resumes endpoint...", "INFO")
        if self.attacker_auth:
            resume_payload = {
                "name": "Mass Assignment Resume",
                "template": "modern",
                # INJECTED FIELDS
                "uuid": "fake-uuid-67890",
                "is_public": True,
                "view_count": 9999,
                "featured": True
            }
            
            try:
                resp = requests.post(f"{BASE_URL}/resumes", json=resume_payload, headers=self.attacker_auth)
                tested_count += 1
                
                if resp.status_code in [200, 201]:
                    resume_id = resp.json().get("resume_id")
                    check = requests.get(f"{BASE_URL}/resumes?resume_id={resume_id}", headers=self.attacker_auth)
                    
                    check_data = check.json()
                    if (check_data.get("uuid") == "fake-uuid-67890" or 
                        check_data.get("view_count") == 9999):
                        log("VULNERABLE: Resumes - Server accepted injected fields!", "FAIL")
                        vulnerable_count += 1
                    else:
                        log("Safe: Resumes - Injected fields were stripped.", "PASS")
                else:
                    log(f"Resumes - Blocked with status {resp.status_code}", "PASS")
            except Exception as e:
                log(f"Resumes mass assignment test error: {e}", "WARN")

        # Test 4: Update endpoints - try to modify protected fields
        log("Testing Mass Assignment on UPDATE operations...", "INFO")
        if self.attacker_auth:
            # Create a job first
            job_data = {"title": "Original Title", "company": "Test Co", "deadline": "2025-01-01"}
            resp = requests.post(f"{BASE_URL}/jobs", json=job_data, headers=self.attacker_auth)
            
            if resp.status_code in [200, 201]:
                job_id = resp.json().get("_id") or resp.json().get("id")
                
                # Try to update with injected fields
                update_payload = {
                    "title": "Updated Title",
                    # INJECTED FIELDS
                    "uuid": "different-owner-uuid",
                    "created_at": "1970-01-01",
                    "_id": "fake-id-12345"
                }
                
                try:
                    resp = requests.put(f"{BASE_URL}/jobs/{job_id}", 
                                    json=update_payload, 
                                    headers=self.attacker_auth)
                    tested_count += 1
                    
                    if resp.status_code in [200, 204]:
                        check = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=self.attacker_auth)
                        check_data = check.json()
                        
                        if (check_data.get("uuid") == "different-owner-uuid" or 
                            check_data.get("created_at") == "1970-01-01"):
                            log("VULNERABLE: Update - Protected fields were modified!", "FAIL")
                            vulnerable_count += 1
                        else:
                            log("Safe: Update - Protected fields cannot be modified.", "PASS")
                    else:
                        log(f"Update - Blocked with status {resp.status_code}", "PASS")
                except Exception as e:
                    log(f"Update mass assignment test error: {e}", "WARN")

        # Summary
        print(f"\n{Colors.HEADER}--- Mass Assignment Test Summary ---{Colors.ENDC}")
        log(f"Tested {tested_count} endpoints/operations", "INFO")
        if vulnerable_count > 0:
            log(f"Found {vulnerable_count} mass assignment vulnerabilities!", "FAIL")
        else:
            log(f"All tested endpoints properly filter input fields", "PASS")


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
        print(f"\n{Colors.HEADER}--- Testing CSRF on Multiple Endpoints ---{Colors.ENDC}")
        if not self.victim_auth:
            log("Skipping CSRF: No Victim Session", "FAIL")
            return

        vulnerable_count = 0
        tested_count = 0
        
        vulnerable_headers = {
            "Content-Type": "application/json"
            # NOTE: Authorization header is intentionally REMOVED
        }

        # Test 1: Jobs endpoint
        log("Testing CSRF on /jobs endpoint...", "INFO")
        csrf_payload = {
            "title": "CSRF Attack Job",
            "company": "Hacker Inc",
            "description": "If this exists, CSRF is possible.",
            "status": "Applied",
            "deadline": "2025-12-31"
        }

        try:
            resp = requests.post(f"{BASE_URL}/jobs", json=csrf_payload, headers=vulnerable_headers)
            tested_count += 1

            if resp.status_code in [200, 201]:
                log("VULNERABLE: Jobs - Request succeeded without Auth header!", "FAIL")
                vulnerable_count += 1
            elif resp.status_code in [401, 403]:
                log("Safe: Jobs - Server rejected request without Authorization.", "PASS")
            else:
                log(f"Safe: Jobs - Request failed with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Jobs CSRF test error: {e}", "WARN")

        # Test 2: Education endpoint
        log("Testing CSRF on /education endpoint...", "INFO")
        edu_payload = {
            "institution_name": "CSRF University",
            "degree": "Bachelor's",
            "start_date": "2020-01-01"
        }

        try:
            resp = requests.post(f"{BASE_URL}/education", json=edu_payload, headers=vulnerable_headers)
            tested_count += 1

            if resp.status_code in [200, 201]:
                log("VULNERABLE: Education - Request succeeded without Auth header!", "FAIL")
                vulnerable_count += 1
            elif resp.status_code in [401, 403]:
                log("Safe: Education - Server rejected request without Authorization.", "PASS")
            else:
                log(f"Safe: Education - Request failed with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Education CSRF test error: {e}", "WARN")

        # Test 3: Skills endpoint
        log("Testing CSRF on /skills endpoint...", "INFO")
        skill_payload = {
            "name": "CSRF Skill",
            "proficiency": "Expert"
        }

        try:
            resp = requests.post(f"{BASE_URL}/skills", json=skill_payload, headers=vulnerable_headers)
            tested_count += 1

            if resp.status_code in [200, 201]:
                log("VULNERABLE: Skills - Request succeeded without Auth header!", "FAIL")
                vulnerable_count += 1
            elif resp.status_code in [401, 403]:
                log("Safe: Skills - Server rejected request without Authorization.", "PASS")
            else:
                log(f"Safe: Skills - Request failed with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Skills CSRF test error: {e}", "WARN")

        # Test 4: Resumes endpoint
        log("Testing CSRF on /resumes endpoint...", "INFO")
        resume_payload = {
            "name": "CSRF Resume",
            "template": "modern"
        }

        try:
            resp = requests.post(f"{BASE_URL}/resumes", json=resume_payload, headers=vulnerable_headers)
            tested_count += 1

            if resp.status_code in [200, 201]:
                log("VULNERABLE: Resumes - Request succeeded without Auth header!", "FAIL")
                vulnerable_count += 1
            elif resp.status_code in [401, 403]:
                log("Safe: Resumes - Server rejected request without Authorization.", "PASS")
            else:
                log(f"Safe: Resumes - Request failed with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Resumes CSRF test error: {e}", "WARN")

        # Summary
        print(f"\n{Colors.HEADER}--- CSRF Test Summary ---{Colors.ENDC}")
        log(f"Tested {tested_count} endpoints", "INFO")
        if vulnerable_count > 0:
            log(f"Found {vulnerable_count} potential CSRF vulnerabilities!", "FAIL")
        else:
            log(f"All tested endpoints require proper authorization", "PASS")

    def test_nosql_injection(self):
        print(f"\n{Colors.HEADER}--- Testing NoSQL Injection on Multiple Endpoints ---{Colors.ENDC}")
        
        vulnerable_count = 0
        tested_count = 0

        # Test 1: Login endpoint (original test)
        log("Testing NoSQL Injection on /auth/login...", "INFO")
        payload = {
            "email": VICTIM_CREDS["email"],
            "password": {"$ne": None} 
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/auth/login", json=payload) 
            tested_count += 1
            
            if resp.status_code == 200:
                log("VULNERABLE: Login - NoSQL Injection bypassed authentication!", "FAIL")
                vulnerable_count += 1
            elif resp.status_code in [422, 400]:
                log("Safe: Login - Pydantic blocked the injection.", "PASS")
            else:
                log(f"Login - Injection failed with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Login injection test error: {e}", "WARN")

        # Test 2: Jobs query injection (if there's a search/filter endpoint)
        log("Testing NoSQL Injection on potential query parameters...", "INFO")
        if self.attacker_auth:
            # Try injection in query parameters
            injection_params = {
                "status": {"$ne": None},  # Try to bypass filters
                "company": {"$regex": ".*"}  # Try regex injection
            }
            
            try:
                # Attempt to exploit query parameters
                resp = requests.get(f"{BASE_URL}/jobs/me", 
                                params=injection_params, 
                                headers=self.attacker_auth)
                tested_count += 1
                
                # If the server accepts dictionary params, it might be vulnerable
                if resp.status_code == 200:
                    # Check if response seems abnormal (hard to detect automatically)
                    log("Query params accepted - manual review needed", "WARN")
                else:
                    log(f"Query injection blocked with status {resp.status_code}", "PASS")
            except Exception as e:
                log(f"Query injection test error: {e}", "WARN")

        # Test 3: Registration with injection
        log("Testing NoSQL Injection on /auth/register...", "INFO")
        register_payload = {
            "username": f"inject_test_{int(time.time())}",
            "email": f"inject_{int(time.time())}@test.com",
            "password": {"$ne": ""},  # Try to inject in password field
            "full_name": "Injection Test"
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
            tested_count += 1
            
            if resp.status_code in [200, 201]:
                log("VULNERABLE: Register - NoSQL object accepted in password field!", "FAIL")
                vulnerable_count += 1
            elif resp.status_code in [422, 400]:
                log("Safe: Register - Pydantic blocked the injection.", "PASS")
            else:
                log(f"Register - Injection failed with status {resp.status_code}", "PASS")
        except Exception as e:
            log(f"Register injection test error: {e}", "WARN")

        # Test 4: Try operator injection in filter/search
        log("Testing MongoDB operator injection...", "INFO")
        if self.attacker_auth:
            # Create a job first
            job_data = {"title": "Test Job", "company": "Test Co", "deadline": "2025-01-01"}
            resp = requests.post(f"{BASE_URL}/jobs", json=job_data, headers=self.attacker_auth)
            
            if resp.status_code in [200, 201]:
                job_id = resp.json().get("_id") or resp.json().get("id")
                
                # Try to exploit with MongoDB operators in update
                exploit_update = {
                    "title": {"$set": {"is_admin": True}},  # Try to inject $set operator
                    "status": "Applied"
                }
                
                try:
                    resp = requests.put(f"{BASE_URL}/jobs/{job_id}", 
                                    json=exploit_update, 
                                    headers=self.attacker_auth)
                    tested_count += 1
                    
                    if resp.status_code in [200, 204]:
                        # Check if the exploit worked by retrieving the job
                        check = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=self.attacker_auth)
                        if "is_admin" in check.text:
                            log("VULNERABLE: MongoDB operator injection succeeded!", "FAIL")
                            vulnerable_count += 1
                        else:
                            log("Safe: Operator injection blocked or sanitized.", "PASS")
                    else:
                        log(f"Operator injection blocked with status {resp.status_code}", "PASS")
                except Exception as e:
                    log(f"Operator injection test error: {e}", "WARN")

        # Summary
        print(f"\n{Colors.HEADER}--- NoSQL Injection Test Summary ---{Colors.ENDC}")
        log(f"Tested {tested_count} injection vectors", "INFO")
        if vulnerable_count > 0:
            log(f"Found {vulnerable_count} NoSQL injection vulnerabilities!", "FAIL")
        else:
            log(f"All tested endpoints appear to validate input types properly", "PASS")

    def test_xss(self):
        print(f"\n{Colors.HEADER}--- Testing Stored XSS (Multiple Endpoints) ---{Colors.ENDC}")
        if not self.attacker_auth: 
            log("Skipping XSS: No Attacker Token", "FAIL")
            return

        xss_payloads = [
            "<img src=x onerror=alert('XSS')>",
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//"
        ]
        
        vulnerable_count = 0
        tested_count = 0
        
        # Test 1: Jobs endpoint (description field)
        log("Testing /jobs endpoint...", "INFO")
        for payload in xss_payloads[:2]:  # Test first 2 payloads
            data = {
                "title": "XSS Test Job",
                "company": "Evil Corp",
                "description": payload,
                "status": "Interested",
                "deadline": "2025-01-01"
            }
            
            resp = requests.post(f"{BASE_URL}/jobs", json=data, headers=self.attacker_auth)
            tested_count += 1
            
            if resp.status_code in [200, 201]:
                job_id = resp.json().get("_id") or resp.json().get("id")
                get_resp = requests.get(f"{BASE_URL}/jobs/{job_id}", headers=self.attacker_auth)
                
                if payload in get_resp.text:
                    log(f"VULNERABLE: Jobs endpoint - XSS payload returned unsanitized: {payload[:30]}...", "FAIL")
                    vulnerable_count += 1
                else:
                    log(f"Safe: Jobs endpoint sanitized payload: {payload[:30]}...", "PASS")
            else:
                log(f"Could not create job. Status: {resp.status_code}", "WARN")

        # Test 2: Education endpoint (institution_name, degree, field_of_study)
        log("Testing /education endpoint...", "INFO")
        edu_data = {
            "institution_name": xss_payloads[0],
            "degree": "Bachelor's",
            "field_of_study": xss_payloads[1],
            "start_date": "2020-01-01",
            "end_date": "2024-01-01"
        }
        
        resp = requests.post(f"{BASE_URL}/education", json=edu_data, headers=self.attacker_auth)
        tested_count += 1
        
        if resp.status_code in [200, 201]:
            edu_id = resp.json().get("education_id")
            get_resp = requests.get(f"{BASE_URL}/education?education_id={edu_id}", headers=self.attacker_auth)
            
            if any(payload in get_resp.text for payload in [xss_payloads[0], xss_payloads[1]]):
                log("VULNERABLE: Education endpoint - XSS payload returned unsanitized!", "FAIL")
                vulnerable_count += 1
            else:
                log("Safe: Education endpoint sanitized payloads.", "PASS")
        else:
            log(f"Could not create education. Status: {resp.status_code}", "WARN")

        # Test 3: Employment endpoint (title, company, description)
        log("Testing /employment endpoint...", "INFO")
        emp_data = {
            "title": xss_payloads[0],
            "company": "Test Company",
            "description": xss_payloads[2],
            "start_date": "2020-01-01"
        }
        
        resp = requests.post(f"{BASE_URL}/employment", json=emp_data, headers=self.attacker_auth)
        tested_count += 1
        
        if resp.status_code in [200, 201]:
            emp_id = resp.json().get("employment_id")
            get_resp = requests.get(f"{BASE_URL}/employment?employment_id={emp_id}", headers=self.attacker_auth)
            
            if any(payload in get_resp.text for payload in [xss_payloads[0], xss_payloads[2]]):
                log("VULNERABLE: Employment endpoint - XSS payload returned unsanitized!", "FAIL")
                vulnerable_count += 1
            else:
                log("Safe: Employment endpoint sanitized payloads.", "PASS")
        else:
            log(f"Could not create employment. Status: {resp.status_code}", "WARN")

        # Test 4: Skills endpoint (name field)
        log("Testing /skills endpoint...", "INFO")
        skill_data = {
            "name": xss_payloads[0],
            "proficiency": "Expert"
        }
        
        resp = requests.post(f"{BASE_URL}/skills", json=skill_data, headers=self.attacker_auth)
        tested_count += 1
        
        if resp.status_code in [200, 201]:
            skill_id = resp.json().get("skill_id")
            get_resp = requests.get(f"{BASE_URL}/skills?skill_id={skill_id}", headers=self.attacker_auth)
            
            if xss_payloads[0] in get_resp.text:
                log("VULNERABLE: Skills endpoint - XSS payload returned unsanitized!", "FAIL")
                vulnerable_count += 1
            else:
                log("Safe: Skills endpoint sanitized payload.", "PASS")
        else:
            log(f"Could not create skill. Status: {resp.status_code}", "WARN")

        # Test 5: Resume endpoint (name, summary)
        log("Testing /resumes endpoint...", "INFO")
        resume_data = {
            "name": xss_payloads[0],
            "summary": xss_payloads[3],
            "template": "modern"
        }
        
        resp = requests.post(f"{BASE_URL}/resumes", json=resume_data, headers=self.attacker_auth)
        tested_count += 1
        
        if resp.status_code in [200, 201]:
            resume_id = resp.json().get("resume_id")
            get_resp = requests.get(f"{BASE_URL}/resumes?resume_id={resume_id}", headers=self.attacker_auth)
            
            if any(payload in get_resp.text for payload in [xss_payloads[0], xss_payloads[3]]):
                log("VULNERABLE: Resumes endpoint - XSS payload returned unsanitized!", "FAIL")
                vulnerable_count += 1
            else:
                log("Safe: Resumes endpoint sanitized payloads.", "PASS")
        else:
            log(f"Could not create resume. Status: {resp.status_code}", "WARN")

        # Test 6: Resume Feedback endpoint (reviewer_name, comment)
        log("Testing /resumes feedback endpoint...", "INFO")
        # First create a clean resume to attach feedback to
        clean_resume = {
            "name": "Test Resume for Feedback",
            "summary": "Testing feedback XSS",
            "template": "modern"
        }
        resp = requests.post(f"{BASE_URL}/resumes", json=clean_resume, headers=self.attacker_auth)
        
        if resp.status_code in [200, 201]:
            resume_id = resp.json().get("resume_id")
            
            feedback_data = {
                "reviewer_name": xss_payloads[0],
                "comment": xss_payloads[1],
                "rating": 5
            }
            
            resp = requests.post(f"{BASE_URL}/resumes/{resume_id}/feedback", json=feedback_data, headers=self.attacker_auth)
            tested_count += 1
            
            if resp.status_code in [200, 201]:
                get_resp = requests.get(f"{BASE_URL}/resumes/{resume_id}/feedback", headers=self.attacker_auth)
                
                if any(payload in get_resp.text for payload in [xss_payloads[0], xss_payloads[1]]):
                    log("VULNERABLE: Resume Feedback endpoint - XSS payload returned unsanitized!", "FAIL")
                    vulnerable_count += 1
                else:
                    log("Safe: Resume Feedback endpoint sanitized payloads.", "PASS")
            else:
                log(f"Could not create feedback. Status: {resp.status_code}", "WARN")
        else:
            log(f"Could not create resume for feedback test. Status: {resp.status_code}", "WARN")

        # Summary
        print(f"\n{Colors.HEADER}--- XSS Test Summary ---{Colors.ENDC}")
        log(f"Tested {tested_count} endpoints/payloads", "INFO")
        if vulnerable_count > 0:
            log(f"Found {vulnerable_count} vulnerable endpoints!", "FAIL")
        else:
            log(f"All tested endpoints appear to sanitize XSS payloads", "PASS")

    def test_idor(self):
        print(f"\n{Colors.HEADER}--- Testing IDOR (AuthZ) on Multiple Endpoints ---{Colors.ENDC}")
        if not self.victim_auth or not self.attacker_auth:
            log("Skipping IDOR: Missing tokens", "FAIL")
            return

        vulnerable_count = 0
        tested_count = 0

        # Test 1: Jobs endpoint
        log("Testing IDOR on /jobs endpoint...", "INFO")
        job_data = {"title": "Victim Job", "company": "Safe Co", "deadline": "2025-01-01"}
        resp = requests.post(f"{BASE_URL}/jobs", json=job_data, headers=self.victim_auth)
        
        if resp.status_code in [200, 201]:
            victim_job_id = resp.json().get("_id") or resp.json().get("id")
            
            # Try to DELETE victim's job as attacker
            del_resp = requests.delete(f"{BASE_URL}/jobs/{victim_job_id}", headers=self.attacker_auth)
            tested_count += 1
            
            if del_resp.status_code in [200, 204]:
                log("VULNERABLE: Jobs - Attacker deleted Victim's job!", "FAIL")
                vulnerable_count += 1
            elif del_resp.status_code in [403, 404]:
                log("Safe: Jobs - Access Denied.", "PASS")
            else:
                log(f"Jobs - Unexpected status: {del_resp.status_code}", "WARN")
        else:
            log(f"Could not create victim job. Status: {resp.status_code}", "WARN")

        # Test 2: Education endpoint
        log("Testing IDOR on /education endpoint...", "INFO")
        edu_data = {
            "institution_name": "Victim University",
            "degree": "Bachelor's",
            "field_of_study": "Computer Science",
            "start_date": "2020-01-01",
            "end_date": "2024-01-01"
        }
        resp = requests.post(f"{BASE_URL}/education", json=edu_data, headers=self.victim_auth)
        
        if resp.status_code in [200, 201]:
            victim_edu_id = resp.json().get("education_id")
            
            # Try to DELETE victim's education as attacker
            del_resp = requests.delete(f"{BASE_URL}/education?education_id={victim_edu_id}", headers=self.attacker_auth)
            tested_count += 1
            
            if del_resp.status_code in [200, 204]:
                log("VULNERABLE: Education - Attacker deleted Victim's education!", "FAIL")
                vulnerable_count += 1
            elif del_resp.status_code in [403, 404, 400]:
                log("Safe: Education - Access Denied.", "PASS")
            else:
                log(f"Education - Unexpected status: {del_resp.status_code}", "WARN")
        else:
            log(f"Could not create victim education. Status: {resp.status_code}", "WARN")

        # Test 3: Employment endpoint
        log("Testing IDOR on /employment endpoint...", "INFO")
        emp_data = {
            "title": "Software Engineer",
            "company": "Victim Corp",
            "start_date": "2020-01-01"
        }
        resp = requests.post(f"{BASE_URL}/employment", json=emp_data, headers=self.victim_auth)
        
        if resp.status_code in [200, 201]:
            victim_emp_id = resp.json().get("employment_id")
            
            # Try to UPDATE victim's employment as attacker
            update_data = {"title": "Hacked Title"}
            update_resp = requests.put(f"{BASE_URL}/employment?employment_id={victim_emp_id}", 
                                    json=update_data, headers=self.attacker_auth)
            tested_count += 1
            
            if update_resp.status_code in [200, 204]:
                log("VULNERABLE: Employment - Attacker updated Victim's employment!", "FAIL")
                vulnerable_count += 1
            elif update_resp.status_code in [403, 404, 400]:
                log("Safe: Employment - Access Denied.", "PASS")
            else:
                log(f"Employment - Unexpected status: {update_resp.status_code}", "WARN")
        else:
            log(f"Could not create victim employment. Status: {resp.status_code}", "WARN")

        # Test 4: Skills endpoint
        log("Testing IDOR on /skills endpoint...", "INFO")
        skill_data = {"name": "Python", "proficiency": "Expert"}
        resp = requests.post(f"{BASE_URL}/skills", json=skill_data, headers=self.victim_auth)
        
        if resp.status_code in [200, 201]:
            victim_skill_id = resp.json().get("skill_id")
            
            # Try to DELETE victim's skill as attacker
            del_resp = requests.delete(f"{BASE_URL}/skills?skill_id={victim_skill_id}", headers=self.attacker_auth)
            tested_count += 1
            
            if del_resp.status_code in [200, 204]:
                log("VULNERABLE: Skills - Attacker deleted Victim's skill!", "FAIL")
                vulnerable_count += 1
            elif del_resp.status_code in [403, 404, 400]:
                log("Safe: Skills - Access Denied.", "PASS")
            else:
                log(f"Skills - Unexpected status: {del_resp.status_code}", "WARN")
        else:
            log(f"Could not create victim skill. Status: {resp.status_code}", "WARN")

        # Test 5: Resumes endpoint
        log("Testing IDOR on /resumes endpoint...", "INFO")
        resume_data = {
            "name": "Victim's Resume",
            "summary": "Private resume",
            "template": "modern"
        }
        resp = requests.post(f"{BASE_URL}/resumes", json=resume_data, headers=self.victim_auth)
        
        if resp.status_code in [200, 201]:
            victim_resume_id = resp.json().get("resume_id")
            
            # Try to READ victim's resume as attacker
            get_resp = requests.get(f"{BASE_URL}/resumes?resume_id={victim_resume_id}", headers=self.attacker_auth)
            tested_count += 1
            
            if get_resp.status_code == 200:
                log("VULNERABLE: Resumes - Attacker read Victim's private resume!", "FAIL")
                vulnerable_count += 1
            elif get_resp.status_code in [403, 404, 400]:
                log("Safe: Resumes - Access Denied.", "PASS")
            else:
                log(f"Resumes - Unexpected status: {get_resp.status_code}", "WARN")
        else:
            log(f"Could not create victim resume. Status: {resp.status_code}", "WARN")

        # Summary
        print(f"\n{Colors.HEADER}--- IDOR Test Summary ---{Colors.ENDC}")
        log(f"Tested {tested_count} endpoints", "INFO")
        if vulnerable_count > 0:
            log(f"Found {vulnerable_count} IDOR vulnerabilities!", "FAIL")
        else:
            log(f"All tested endpoints properly enforce authorization", "PASS")

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