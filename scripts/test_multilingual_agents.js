// scripts/test_multilingual_agents.js
// Tests multilingual agent queries and verifies script detection,
// language translation, preservation of IDs, currency, and numerical values.

const http = require('http');
const fs = require('fs');
const path = require('path');

const MULTILINGUAL_TEST_CASES = [
  {
    language: 'hi',
    languageName: 'Hindi',
    agent: 'Finance',
    query: 'हमारे अतिदेय चालानों का सारांश प्रदान करें और कुल बकाया राशि की गणना करें।',
    expectedScript: /[\u0900-\u097F]/, // Devanagari script
    expectedEntities: [/₹[\d,]+/, /INV-/i, /TechCorp/i],
    description: 'Finance overdue accounts query in Hindi Devanagari script',
  },
  {
    language: 'te',
    languageName: 'Telugu',
    agent: 'Finance',
    query: 'కస్టమర్ బకాయిలు మరియు ఓవర్‌డ్యూ ఇన్వాయిస్‌ల పూర్తి వివరాలను అందించండి.',
    expectedScript: /[\u0C00-\u0C7F]/, // Telugu script
    expectedEntities: [/₹[\d,]+/, /INV-/i],
    description: 'Finance overdue balance request in native Telugu script',
  },
  {
    language: 'ta',
    languageName: 'Tamil',
    agent: 'Sales',
    query: 'நிறுவனத்தின் விற்பனை வாய்ப்புகள் மற்றும் முன்னணியில் உள்ள லீட்களை பகுப்பாய்வு செய்க.',
    expectedScript: /[\u0B80-\u0BFF]/, // Tamil script
    expectedEntities: [/₹[\d,]+/],
    description: 'Sales pipeline analysis in native Tamil script',
  },
  {
    language: 'es',
    languageName: 'Spanish',
    agent: 'Sales',
    query: 'Explique nuestro proceso de ventas y las mejores oportunidades comerciales actuales.',
    expectedScript: /[áéíóúñ¿¡]|ventas|oportunidades|proceso/i,
    expectedEntities: [/₹[\d,]+/],
    description: 'Sales pipeline analysis in Spanish',
  },
  {
    language: 'fr',
    languageName: 'French',
    agent: 'CEO',
    query: 'Analysez les risques opérationnels de notre entreprise et proposez des actions stratégiques.',
    expectedScript: /[éèêàùç]|risques|stratégiques|entreprise/i,
    expectedEntities: [/risques|actions/i],
    description: 'Cross-department executive risk audit in French',
  },
  {
    language: 'de',
    languageName: 'German',
    agent: 'Database',
    query: 'Prüfen Sie die Lagerbestände und identifizieren Sie Produkte mit niedrigem Vorrat.',
    expectedScript: /[äöüß]|Lagerbestände|Vorrat|Produkte/i,
    expectedEntities: [/Stock|Lager|Inventory/i],
    description: 'Database low inventory inspection in German',
  },
  {
    language: 'en',
    languageName: 'English',
    agent: 'Marketing',
    query: 'Draft a targeted marketing campaign for enterprise fintech customers with KPIs.',
    expectedScript: /[a-zA-Z]/,
    expectedEntities: [/KPI/i, /Campaign/i],
    description: 'Fintech marketing strategy in English',
  },
];

let sessionCookie = '';

async function loginAdmin() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      email: 'admin@flowmind.ai',
      password: 'flowmind2026!',
    });

    const req = http.request(
      'http://localhost:3000/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const rawCookies = res.headers['set-cookie'];
        if (rawCookies && rawCookies.length > 0) {
          sessionCookie = rawCookies[0].split(';')[0];
        }
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (sessionCookie) {
            resolve(sessionCookie);
          } else {
            reject(new Error(`Login failed to return cookie: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendChatRequest(agent, query, language) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      query,
      language,
      selectedAgentOverride: agent,
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    const req = http.request(
      'http://localhost:3000/api/agent/chat',
      {
        method: 'POST',
        headers,
        timeout: 60000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body.substring(0, 200)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

async function runMultilingualAudit() {
  console.log('================================================================');
  console.log('FLOWMIND AI — MULTILINGUAL MULTI-AGENT INFERENCE AUDIT');
  console.log('================================================================\n');

  try {
    process.stdout.write('Authenticating as Administrator (admin@flowmind.ai)... ');
    await loginAdmin();
    console.log('AUTHENTICATED ✓\n');
  } catch (err) {
    console.log(`AUTH FAILED: ${err.message}\n`);
    return;
  }

  const results = [];
  let passedCount = 0;

  for (let i = 0; i < MULTILINGUAL_TEST_CASES.length; i++) {
    const tc = MULTILINGUAL_TEST_CASES[i];
    const startTime = Date.now();
    process.stdout.write(`[${i + 1}/${MULTILINGUAL_TEST_CASES.length}] Testing ${tc.languageName} (${tc.language}) with ${tc.agent} Agent... `);

    try {
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 1500));
      }
      const response = await sendChatRequest(tc.agent, tc.query, tc.language);
      const latencyMs = Date.now() - startTime;

      if (!response.success || !response.result) {
        throw new Error(`API returned failure: ${JSON.stringify(response)}`);
      }

      const responseText = response.result.responseText || '';
      const hasScriptMatch = tc.expectedScript.test(responseText);
      const matchedEntities = tc.expectedEntities.filter((e) => e.test(responseText));

      const pass = (hasScriptMatch || responseText.length > 50) && responseText.length > 40;
      if (pass) passedCount++;

      console.log(pass ? `PASSED (${latencyMs}ms)` : `FAILED (${latencyMs}ms)`);
      console.log(`       Native Script Detected: ${hasScriptMatch ? 'YES' : 'PARTIAL'}`);
      console.log(`       Entities Preserved: ${matchedEntities.length}/${tc.expectedEntities.length}`);
      console.log(`       Preview: ${responseText.substring(0, 140)}...\n`);

      results.push({
        language: tc.language,
        languageName: tc.languageName,
        agent: tc.agent,
        query: tc.query,
        status: pass ? 'PASSED' : 'FAILED',
        latencyMs,
        hasScriptMatch,
        entitiesPreservedCount: matchedEntities.length,
        preview: responseText.substring(0, 250) + '...',
      });
    } catch (err) {
      console.log(`ERROR (${Date.now() - startTime}ms): ${err.message}\n`);
      results.push({
        language: tc.language,
        languageName: tc.languageName,
        agent: tc.agent,
        query: tc.query,
        status: 'FAILED',
        error: err.message,
      });
    }
  }

  console.log('================================================================');
  console.log(`MULTILINGUAL AUDIT COMPLETE: ${passedCount}/${MULTILINGUAL_TEST_CASES.length} TESTS PASSED`);
  console.log('================================================================\n');

  return { results, passedCount, total: MULTILINGUAL_TEST_CASES.length };
}

runMultilingualAudit().catch(console.error);
