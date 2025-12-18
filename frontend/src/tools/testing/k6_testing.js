import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.API_URL || 'https://cs-490-project-development.up.railway.app';
// Use: k6 run -e API_URL=https://your-load-test-env.up.railway.app load_test.js

// Generate 50 test users (enough for 50+ concurrent load testing)
const users = new SharedArray('users', function () {
  const userList = [];
  for (let i = 1; i <= 50; i++) {
    userList.push({
      email: `user${i}@test.com`,
      username: `testuser${i}`,
      password: 'TestPass_123!',
      full_name: `Test User ${i}`
    });
  }
  return userList;
});

// Test configuration
export const options = {
  setupTimeout: '5m', // 5 minutes is plenty now (50 users * 0.2s = 10 seconds)
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users (baseline)
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },    // Stay at 50 users (peak load)
    { duration: '30s', target: 100 },  // Ramp up to 100 users (stress test)
    { duration: '2m', target: 100 },   // Stay at 100 users (breaking point)
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],  // Less than 5% errors
    'http_req_duration{scenario:login}': ['p(95)<500'],
    'http_req_duration{scenario:upload}': ['p(95)<5000'],
    'http_req_duration{scenario:download}': ['p(95)<3000'],
  },
};

// Sample HTML cover letter for upload
const COVER_LETTER_HTML = `
<!DOCTYPE html>
<html>
<head><title>Test Cover Letter</title></head>
<body>
  <div class="container" style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <header style="text-align: right; margin-bottom: 30px;">
      <h1>John Doe</h1>
      <p>test@example.com | (555) 123-4567</p>
    </header>
    <p>December 17, 2025</p>
    <p><strong>Hiring Manager</strong><br>Test Company</p>
    <p>Dear Hiring Manager,</p>
    <p>I am writing to express my interest in the QA Engineer position.</p>
    <p>My experience includes performance testing with k6, API testing, and database optimization.</p>
    <p>Sincerely,<br>John Doe</p>
  </div>
</body>
</html>
`;

// Setup function - runs once before the test starts
export function setup() {
  console.log('🔧 Setup: Registering test users...');
  
  const registeredUsers = [];
  const failedUsers = [];
  
  users.forEach((user, index) => {
    const registerPayload = JSON.stringify({
      email: user.email,
      username: user.username,
      password: user.password,
      full_name: user.full_name,
    });

    const registerParams = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`,
      registerPayload,
      registerParams
    );

    if (registerRes.status === 200 || registerRes.status === 201) {
      registeredUsers.push(user.email);
      console.log(`✅ Registered: ${user.email}`);
    } else if (registerRes.status === 400 && registerRes.body.includes('already exists')) {
      // User already exists, that's fine
      registeredUsers.push(user.email);
      console.log(`ℹ️  Already exists: ${user.email}`);
    } else {
      failedUsers.push(user.email);
      console.log(`❌ Failed to register ${user.email}: ${registerRes.status} - ${registerRes.body}`);
    }

    // No rate limiting on test environment - register quickly!
    sleep(0.2);
  });

  console.log(`\n📊 Registration Summary:`);
  console.log(`   ✅ Successful/Existing: ${registeredUsers.length}`);
  console.log(`   ❌ Failed: ${failedUsers.length}`);
  console.log(`\n🚀 Starting load test...\n`);

  return { registeredUsers, failedUsers };
}

export default function (data) {
  // Get a user for this virtual user
  const user = users[__VU % users.length];
  
  // ===================
  // 1. LOGIN
  // ===================
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { scenario: 'login' },
  };

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    loginParams
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has session token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.session_token !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    console.error(`Login failed for ${user.email}: ${loginRes.status} - ${loginRes.body}`);
    sleep(1);
    return;
  }

  const loginBody = JSON.parse(loginRes.body);
  const sessionToken = loginBody.session_token;
  const userId = loginBody.uuid; // Extract uuid from login response

  sleep(1); // Think time

  // ===================
  // 2. UPLOAD COVER LETTER
  // ===================
  const uploadData = {
    file: http.file(COVER_LETTER_HTML, 'cover_letter.html', 'text/html'),
    title: `Load Test Cover Letter ${__VU}-${__ITER}`,
    company: 'Test Company',
    position: 'QA Engineer',
    version_name: 'Version 1',
  };

  const uploadParams = {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'uuid': userId, // Add uuid header required by your API
    },
    tags: { scenario: 'upload' },
  };

  const uploadRes = http.post(
    `${BASE_URL}/api/cover-letters/upload`,
    uploadData,
    uploadParams
  );

  const uploadSuccess = check(uploadRes, {
    'upload status is 200': (r) => r.status === 200,
    'upload has letter id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data._id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!uploadSuccess) {
    console.error(`Upload failed: ${uploadRes.status} - ${uploadRes.body}`);
    sleep(1);
    return;
  }

  const letterId = JSON.parse(uploadRes.body).data._id;

  sleep(0.5); // Think time

  // ===================
  // 3. DOWNLOAD PDF
  // ===================
  const downloadParams = {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'uuid': userId, // Add uuid header
    },
    tags: { scenario: 'download' },
  };

  const downloadRes = http.get(
    `${BASE_URL}/api/cover-letters/${letterId}/download/pdf`,
    downloadParams
  );

  check(downloadRes, {
    'download status is 200': (r) => r.status === 200,
    'download is PDF': (r) => r.headers['Content-Type']?.includes('pdf'),
  });

  sleep(1); // Think time

  // ===================
  // 4. GET MY COVER LETTERS (List)
  // ===================
  const listParams = {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'uuid': userId, // Add uuid header
    },
    tags: { scenario: 'list' },
  };

  const listRes = http.get(
    `${BASE_URL}/api/cover-letters/me`,
    listParams
  );

  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(1); // Think time between iterations
}

// Teardown function - runs once after the test completes
export function teardown(data) {
  console.log('\n🏁 Test Complete!');
  console.log(`   Total users: ${users.length}`);
  console.log(`   Registered/Existing: ${data.registeredUsers.length}`);
  if (data.failedUsers.length > 0) {
    console.log(`   ⚠️  Failed registrations: ${data.failedUsers.length}`);
    console.log(`   Failed users: ${data.failedUsers.join(', ')}`);
  }
}

// Generate HTML report at the end
export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "summary.json": JSON.stringify(data),
  };
}