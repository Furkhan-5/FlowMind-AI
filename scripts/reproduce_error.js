const http = require('http');

async function loginAndGetCookie() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@flowmind.ai',
      password: 'flowmind2026!',
      role: 'ADMIN',
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
        resolve(cookies);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testPrompt() {
  const cookie = await loginAndGetCookie();
  console.log('Got cookie, sending query...');

  const postData = JSON.stringify({
    query: 'Create a workflow named Weekly Finance Review. Every Monday at 9 AM, retrieve overdue invoices, calculate the total outstanding balance, generate a financial summary and prepare an email for the Finance Manager',
    selectedAgentOverride: 'Workflow',
    language: 'en',
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/agent/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': cookie,
    },
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', console.error);
  req.write(postData);
  req.end();
}

testPrompt();
