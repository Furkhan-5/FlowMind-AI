const fs = require('fs');

if (fs.existsSync('.env.local')) {
  try { process.loadEnvFile('.env.local'); } catch {}
}
if (fs.existsSync('.env')) {
  try { process.loadEnvFile('.env'); } catch {}
}

const apiKey = process.env.GEMINI_API_KEY;

async function testJson() {
  const model = 'gemini-flash-lite-latest';
  console.log(`Testing structured JSON with ${model}...`);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [{ parts: [{ text: 'User Request: "Find overdue customer invoices." Respond with a JSON object containing "intent", "targetAgent", and "reasoningSteps".' }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 256,
      responseMimeType: 'application/json'
    }
  };

  const start = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const latency = Date.now() - start;
  console.log('Status:', res.status, `(${latency}ms)`);
  const data = await res.json();
  console.log('Candidates text:', data?.candidates?.[0]?.content?.parts?.[0]?.text);
  console.log('Usage:', data?.usageMetadata);
}

testJson();
