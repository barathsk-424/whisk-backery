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

async function runTest() {
  console.log("=== Forgot Password Test (registered admin email) ===");
  const result = await makeRequest('POST', '/api/auth/forgot-password', {
    email: 'skbarath424@gmail.com'
  });
  console.log(`  Status: ${result.status}`);
  console.log(`  Success: ${result.body.success}`);
  console.log(`  Message: ${result.body.message}`);
  console.log(`  PASS: ${result.status === 200 && result.body.success === true ? '✅' : '❌'}`);
}

runTest().catch(console.error);
