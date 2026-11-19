const fs = require('fs');

async function runLiveChatValidation() {
  console.log('=== PHASE 5: LIVE CHAT VALIDATION VIA POST /api/agent/chat ===\n');

  // 1. Authenticate to obtain valid session cookie
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@flowmind.ai',
      password: 'flowmind2026!'
    })
  });

  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login Status:', loginRes.status, 'Session Cookie Obtained:', !!cookie);

  const testCases = [
    {
      agent: 'CEO',
      query: 'Analyze our current business operations and identify three important risks.'
    },
    {
      agent: 'Finance',
      query: 'Retrieve overdue invoices and calculate the total outstanding balance.'
    },
    {
      agent: 'Sales',
      query: 'Explain our current sales pipeline and identify the strongest opportunities.'
    },
    {
      agent: 'Marketing',
      query: 'Create a marketing strategy for FlowMind AI targeting SMEs.'
    }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Executing ${tc.agent} Agent Request: "${tc.query}"`);
    await new Promise(r => setTimeout(r, 1200)); // Graceful inter-request spacing
    const reqStart = Date.now();

    const res = await fetch('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie || ''
      },
      body: JSON.stringify({
        query: tc.query,
        selectedAgentOverride: tc.agent,
        language: 'en'
      })
    });

    const latencyMs = Date.now() - reqStart;
    const json = await res.json();
    console.log(`HTTP Status: ${res.status} (Total Route Latency: ${latencyMs}ms)`);

    const result = json.result || {};
    const thoughtStream = result.thoughtStream || [];
    const reasoningStep = thoughtStream.find(t => t.action && t.action.includes('AI Reasoning Engine')) || thoughtStream[0];
    const isGemini = thoughtStream.some(t => t.action && t.action.includes('GEMINI'));
    const isFallback = thoughtStream.some(t => t.action && t.action.includes('Deterministic Operational Engine'));

    console.log('Target Agent:', result.targetAgent);
    console.log('Intent Action:', result.intentAction);
    console.log('Reasoning Mode Step:', reasoningStep ? reasoningStep.action : 'None');
    console.log('Gemini Active:', isGemini);
    console.log('Fallback Status:', isFallback ? 'DETERMINISTIC_FALLBACK' : 'NO_FALLBACK (LIVE_GEMINI)');
    console.log('Response Snippet (first 250 chars):\n', (result.responseText || '').substring(0, 250) + '...\n');

    results.push({
      agent: tc.agent,
      query: tc.query,
      httpStatus: res.status,
      latencyMs,
      targetAgent: result.targetAgent,
      intentAction: result.intentAction,
      thoughtStream,
      isGemini,
      isFallback,
      responseText: result.responseText
    });
  }

  // 2. Fetch Telemetry
  console.log('\n============================================================');
  console.log('Querying Live Telemetry (/api/settings/ai-providers/telemetry)...');
  const telemRes = await fetch('http://localhost:3000/api/settings/ai-providers/telemetry', {
    headers: { 'Cookie': cookie || '' }
  });
  const telemJson = await telemRes.json();
  console.log('Telemetry Data:', JSON.stringify(telemJson, null, 2));

  fs.writeFileSync('docs/phase5_live_validation_results.json', JSON.stringify({ results, telemetry: telemJson }, null, 2));
  console.log('\nResults saved to docs/phase5_live_validation_results.json');
}

runLiveChatValidation().catch(e => console.error('Validation error:', e));
