const http = require('http');

const optionsSignup = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const reqSignup = http.request(optionsSignup, (res) => {
  console.log(`SIGNUP STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  res.on('end', () => {
    console.log(`SIGNUP RESPONSE: ${data}`);
  })
});

reqSignup.on('error', (error) => {
  console.error('SIGNUP ERROR:', error);
});

reqSignup.write(JSON.stringify({
  name: 'Test',
  email: 'testnewuser12345@gmail.com',
  password: 'DummyPassword123!@#'
}));
reqSignup.end();
