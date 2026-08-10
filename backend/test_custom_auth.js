const http = require('http');

const dataSignup = JSON.stringify({
  name: "API Test User",
  email: "apitest2_new@gmail.com",
  password: "Dummy123!@#"
});

const reqSignup = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': dataSignup.length
  }
}, (res) => {
  console.log(`SIGNUP STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});
reqSignup.on('error', console.error);
reqSignup.write(dataSignup);
reqSignup.end();

setTimeout(() => {
  const dataLogin = JSON.stringify({
    email: "skbarath424@gmail.com",
    password: "06022007"
  });

  const reqLogin = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': dataLogin.length
    }
  }, (res) => {
    console.log(`\nLOGIN STATUS: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
  });
  reqLogin.on('error', console.error);
  reqLogin.write(dataLogin);
  reqLogin.end();
}, 1000);
