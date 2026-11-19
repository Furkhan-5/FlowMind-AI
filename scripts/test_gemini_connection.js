const fs = require('fs');

// Load environment variables safely
if (fs.existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    const lines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        if (k && !process.env[k]) process.env[k] = v;
      }
    }
  }
}
if (fs.existsSync('.env')) {
  try { process.loadEnvFile('.env'); } catch {}
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in process.env');
  process.exit(1);
}

// Log confirmation without exposing secret
console.log('GEMINI_API_KEY detected in process.env. Key length:', apiKey.length, 'Masked:', apiKey.substring(0, 4) + '••••' + apiKey.substring(apiKey.length - 4));

async function testGemini() {
  const startTime = Date.now();
  console.log('\n--- 1. Testing Model Availability ---');
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    const listStatus = listRes.status;
    console.log('HTTP Status from /v1beta/models:', listStatus);
    
    if (!listRes.ok) {
      const errText = await listRes.text();
      console.error('Models API error:', errText);
      return;
    }
    
    const listData = await listRes.json();
    const models = (listData.models || []).map(m => m.name.replace('models/', ''));
    console.log(`Found ${models.length} models available.`);
    const geminiModels = models.filter(m => m.includes('gemini'));
    console.log('Available Gemini Models:', geminiModels.slice(0, 15).join(', '));

    console.log('\n--- 2. Testing Live Generation ---');
    const testModels = [
      'gemini-flash-lite-latest',
      'gemini-2.5-flash-lite',
      'gemini-pro-latest',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ];
    for (const testModel of testModels) {
      console.log(`\nTesting generation with model: "${testModel}"...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        const genStart = Date.now();
        const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with: "GEMINI_ACTIVE_CONFIRMED"' }] }],
            generationConfig: {
              maxOutputTokens: 50,
              temperature: 0.1
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const genLatency = Date.now() - genStart;
        console.log(`Model ${testModel} -> Status:`, genRes.status, `(Latency: ${genLatency}ms)`);
        if (genRes.ok) {
          const genData = await genRes.json();
          const reply = genData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          console.log(`SUCCESS! Reply: "${reply}"`);
          console.log('Usage:', genData?.usageMetadata);
        } else {
          const errBody = await genRes.text();
          console.log(`Error body: ${errBody}`);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.log(`Fetch error for ${testModel}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Network or fetch error:', err.message);
  }
}

testGemini();
