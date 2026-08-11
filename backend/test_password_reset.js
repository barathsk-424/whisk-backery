const http = require('http');

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("=== TEST 1: Admin Login ===");
  const login1 = await makeRequest('POST', '/api/auth/login', {
    email: 'skbarath424@gmail.com',
    password: '06022007'
  });
  console.log(`  Status: ${login1.status}`);
  console.log(`  Success: ${login1.body.success}`);
  console.log(`  Role: ${login1.body.user?.role}`);
  console.log(`  PASS: ${login1.status === 200 && login1.body.success === true && login1.body.user?.role === 'admin' ? '✅' : '❌'}\n`);

  console.log("=== TEST 2: New User Signup ===");
  const signup = await makeRequest('POST', '/api/auth/signup', {
    name: 'Reset Test User',
    email: 'reset_test_user_' + Date.now() + '@gmail.com',
    password: 'TestPassword123'
  });
  console.log(`  Status: ${signup.status}`);
  console.log(`  Success: ${signup.body.success}`);
  console.log(`  PASS: ${signup.status === 201 && signup.body.success === true ? '✅' : '❌'}\n`);

  console.log("=== TEST 3: Forgot Password (registered email) ===");
  const forgot1 = await makeRequest('POST', '/api/auth/forgot-password', {
    email: 'skbarath424@gmail.com'
  });
  console.log(`  Status: ${forgot1.status}`);
  console.log(`  Success: ${forgot1.body.success}`);
  console.log(`  Message: ${forgot1.body.message}`);
  console.log(`  PASS: ${forgot1.status === 200 && forgot1.body.success === true ? '✅' : '❌'}\n`);

  console.log("=== TEST 4: Forgot Password (unregistered email — must still return success) ===");
  const forgot2 = await makeRequest('POST', '/api/auth/forgot-password', {
    email: 'nobody_exists_here@gmail.com'
  });
  console.log(`  Status: ${forgot2.status}`);
  console.log(`  Success: ${forgot2.body.success}`);
  console.log(`  Message: ${forgot2.body.message}`);
  console.log(`  PASS: ${forgot2.status === 200 && forgot2.body.success === true ? '✅' : '❌'}\n`);

  console.log("=== TEST 5: Reset Password with invalid token ===");
  const reset1 = await makeRequest('POST', '/api/auth/reset-password', {
    token: 'totally_fake_token_12345',
    newPassword: 'NewPassword123'
  });
  console.log(`  Status: ${reset1.status}`);
  console.log(`  Success: ${reset1.body.success}`);
  console.log(`  Message: ${reset1.body.message}`);
  console.log(`  PASS: ${reset1.status === 400 && reset1.body.success === false ? '✅' : '❌'}\n`);

  console.log("=== TEST 6: Reset Password with missing token ===");
  const reset2 = await makeRequest('POST', '/api/auth/reset-password', {
    newPassword: 'NewPassword123'
  });
  console.log(`  Status: ${reset2.status}`);
  console.log(`  Success: ${reset2.body.success}`);
  console.log(`  PASS: ${reset2.status === 400 && reset2.body.success === false ? '✅' : '❌'}\n`);

  console.log("=== TEST 7: Reset Password with short password ===");
  const reset3 = await makeRequest('POST', '/api/auth/reset-password', {
    token: 'some_token',
    newPassword: '12345'
  });
  console.log(`  Status: ${reset3.status}`);
  console.log(`  Success: ${reset3.body.success}`);
  console.log(`  PASS: ${reset3.status === 400 && reset3.body.success === false ? '✅' : '❌'}\n`);
}

runTests().catch(console.error);
