const http = require('http');
const fs = require('fs');
const path = require('path');
const { SignJWT } = require('jose');

const PORT = 3000;
const HOST = '127.0.0.1';
const JWT_SECRET_STRING = 'flowmind-ai-super-secret-jwt-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);

async function getAuthCookie(orgId = 'ORG-01', role = 'ADMIN', userId = 'USR-0001', lang = 'en') {
  const token = await new SignJWT({
    userId,
    email: `${userId.toLowerCase()}@flowmind.ai`,
    role,
    name: 'Acceptance Runner',
    organizationId: orgId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return `flowmind_session=${token}; flowmind_lang=${lang}`;
}

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
];

const AGENTS = [
  'CEO', 'Sales', 'Finance', 'HR', 'Support', 'Marketing', 'Analytics',
  'Workflow', 'Scheduler', 'Document', 'Email', 'Knowledge', 'Reporting', 'Security', 'Inventory'
];

function sendPostRequest(path, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, error: e.message });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

function sendGetRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

function detectScript(text) {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(text)) return 'Devanagari';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam';
  return 'Latin';
}

async function runComprehensiveAudit() {
  console.log('================================================================');
  console.log('FLOWMIND AI — SIX-LANGUAGE PLATFORM-WIDE LOCALIZATION AUDIT');
  console.log('Languages: English, Hindi, Telugu, Tamil, Kannada, Malayalam');
  console.log('================================================================\n');

  const auditResults = {
    timestamp: new Date().toISOString(),
    localesValidation: {},
    uiPagesValidation: {},
    agentLanguageMatrix: [],
    businessOperationsTests: [],
    romanizedInputTests: [],
    crossAgentDelegation: null,
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      passRate: '0%',
    },
  };

  // 1. Verify JSON translation files on disk
  console.log('--- 1. LOCALE DICTIONARIES VALIDATION ---');
  for (const lang of LANGUAGES) {
    const filePath = path.join(__dirname, '..', 'src', 'locales', lang.code, 'common.json');
    const exists = fs.existsSync(filePath);
    let keyCount = 0;
    let validJson = false;

    if (exists) {
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        validJson = true;
        const countKeys = (obj) => {
          let count = 0;
          for (const k in obj) {
            if (typeof obj[k] === 'object' && obj[k] !== null) count += countKeys(obj[k]);
            else count++;
          }
          return count;
        };
        keyCount = countKeys(raw);
      } catch (e) {}
    }

    const passed = exists && validJson && keyCount >= 100;
    auditResults.summary.totalTests++;
    if (passed) auditResults.summary.passed++;
    else auditResults.summary.failed++;

    auditResults.localesValidation[lang.code] = {
      name: lang.name,
      exists,
      validJson,
      keyCount,
      passed,
    };

    console.log(`[${passed ? 'PASS' : 'FAIL'}] Locale ${lang.code} (${lang.name}): ${keyCount} keys parsed`);
  }

  // 2. Test 90 Agent-Language Combinations (15 agents x 6 languages)
  console.log('\n--- 2. 90 AGENT-LANGUAGE SYNTHESIS MATRIX (15 AGENTS x 6 LANGUAGES) ---');
  const greetingPrompts = {
    en: 'Introduce yourself and state your role.',
    hi: 'अपना परिचय दें और अपनी भूमिका बताएं।',
    te: 'మీ పరిచయం ఇవ్వండి మరియు మీ పాత్రను వివరించండి.',
    ta: 'உங்களை அறிமுகப்படுத்தி உங்கள் பணியை விளக்குங்கள்.',
    kn: 'ನಿಮ್ಮ ಪರಿಚಯ ನೀಡಿ ಮತ್ತು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ವಿವರಿಸಿ.',
    ml: 'നിങ്ങളെ പരിചയപ്പെടുത്തുകയും നിങ്ങളുടെ ജോലി വിശദീകരിക്കുകയും ചെയ്യുക.',
  };

  for (const agent of AGENTS) {
    console.log(`\nTesting Agent: ${agent}`);
    for (const lang of LANGUAGES) {
      auditResults.summary.totalTests++;
      const query = greetingPrompts[lang.code];
      const cookie = await getAuthCookie('ORG-01', 'ADMIN', 'USR-0001', lang.code);
      await new Promise((r) => setTimeout(r, 150));

      try {
        const res = await sendPostRequest('/api/agent/chat', {
          query,
          language: lang.code,
          selectedAgentOverride: agent,
        }, { Cookie: cookie });

        const success = res.status === 200 && res.data?.success;
        const responseText = res.data?.result?.responseText || res.data?.result?.universalResponse?.response?.text || '';
        const detectedScript = detectScript(responseText);
        const scriptMatches = lang.code === 'en' ? true : (detectedScript === lang.script);
        const hasContent = responseText.length > 20;

        const passed = success && hasContent && (lang.code === 'en' || scriptMatches);
        if (passed) auditResults.summary.passed++;
        else auditResults.summary.failed++;

        const entry = {
          agent,
          language: lang.code,
          languageName: lang.name,
          expectedScript: lang.script,
          detectedScript,
          scriptMatches,
          status: passed ? 'PASSED' : 'FAILED',
          responseSnippet: responseText.slice(0, 100).replace(/\n/g, ' '),
        };

        auditResults.agentLanguageMatrix.push(entry);
        console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${agent} + ${lang.code} (${lang.name}): script=${detectedScript}, len=${responseText.length}`);
      } catch (err) {
        auditResults.summary.failed++;
        auditResults.agentLanguageMatrix.push({
          agent,
          language: lang.code,
          status: 'FAILED',
          error: err.message,
        });
        console.log(`  [FAIL] ${agent} + ${lang.code} ERROR: ${err.message}`);
      }
    }
  }

  // 3. Test Business Operations in all 6 Languages
  console.log('\n--- 3. BUSINESS OPERATIONS IN ALL 6 LANGUAGES ---');
  const businessQueries = [
    { lang: 'en', query: 'Show overdue invoices and calculate total pending balance', agent: 'Finance' },
    { lang: 'hi', query: 'अतिदेय चालान दिखाएं और कुल बकाया राशि की गणना करें', agent: 'Finance' },
    { lang: 'te', query: 'గడువు ముగిసిన ఇన్వాయిస్‌లను చూపించి మొత్తం బకాయి లెక్కించండి', agent: 'Finance' },
    { lang: 'ta', query: 'காலாவதியான விலைப்பட்டியல்களைக் காட்டி மொத்த நிலுவைத் தொகையைக் கணக்கிடுங்கள்', agent: 'Finance' },
    { lang: 'kn', query: 'ಅವಧಿ ಮೀರಿದ ಇನ್‌ವಾಯ್ಸ್‌ಗಳನ್ನು ತೋರಿಸಿ ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತವನ್ನು ಲೆಕ್ಕ ಹಾಕಿ', agent: 'Finance' },
    { lang: 'ml', query: 'കാലഹരണപ്പെട്ട ഇൻവോയ്സുകൾ കാണിച്ച് ആകെ കുടിശ്ശിക തുക കണക്കാക്കുക', agent: 'Finance' },
  ];

  for (const bq of businessQueries) {
    auditResults.summary.totalTests++;
    await new Promise((r) => setTimeout(r, 600));
    const cookie = await getAuthCookie('ORG-01', 'ADMIN', 'USR-0001', bq.lang);
    try {
      const res = await sendPostRequest('/api/agent/chat', {
        query: bq.query,
        language: bq.lang,
        selectedAgentOverride: bq.agent,
      }, { Cookie: cookie });

      const responseText = res.data?.result?.responseText || res.data?.result?.universalResponse?.response?.text || '';
      const containsRupee = responseText.includes('₹') || responseText.includes('8,85,000') || responseText.includes('50,000');
      const containsInvoiceId = /INV-2026/i.test(responseText);
      const detectedScript = detectScript(responseText);
      const targetLangMeta = LANGUAGES.find((l) => l.code === bq.lang);
      const scriptOk = bq.lang === 'en' ? true : detectedScript === targetLangMeta.script;

      const passed = res.status === 200 && responseText.length > 50 && (containsRupee || containsInvoiceId) && scriptOk;
      if (passed) auditResults.summary.passed++;
      else auditResults.summary.failed++;

      auditResults.businessOperationsTests.push({
        language: bq.lang,
        query: bq.query,
        containsRupee,
        containsInvoiceId,
        detectedScript,
        passed,
        snippet: responseText.slice(0, 120).replace(/\n/g, ' '),
      });

      console.log(`[${passed ? 'PASS' : 'FAIL'}] Business Query (${bq.lang}): script=${detectedScript}, ₹=${containsRupee}, INV=${containsInvoiceId}`);
    } catch (err) {
      auditResults.summary.failed++;
      auditResults.businessOperationsTests.push({ language: bq.lang, passed: false, error: err.message });
      console.log(`[FAIL] Business Query (${bq.lang}) ERROR: ${err.message}`);
    }
  }

  // 4. Test Romanized / Mixed Language Input
  console.log('\n--- 4. ROMANIZED & TRANSLITERATED INPUT TESTS ---');
  const romanizedQueries = [
    { lang: 'te', expectedScript: 'Telugu', query: 'Overdue invoices entha pending unnayi?' },
    { lang: 'hi', expectedScript: 'Devanagari', query: 'mere pending invoices kitne hain?' },
    { lang: 'ta', expectedScript: 'Tamil', query: 'overdue invoices evvalavu irukku?' },
    { lang: 'kn', expectedScript: 'Kannada', query: 'overdue invoices eshtu ide?' },
    { lang: 'ml', expectedScript: 'Malayalam', query: 'overdue invoices ethra undu?' },
  ];

  for (const rq of romanizedQueries) {
    auditResults.summary.totalTests++;
    await new Promise((r) => setTimeout(r, 600));
    const cookie = await getAuthCookie('ORG-01', 'ADMIN', 'USR-0001', rq.lang);
    try {
      const res = await sendPostRequest('/api/agent/chat', {
        query: rq.query,
        language: rq.lang,
        selectedAgentOverride: 'Finance',
      }, { Cookie: cookie });

      const responseText = res.data?.result?.responseText || res.data?.result?.universalResponse?.response?.text || '';
      const detectedScript = detectScript(responseText);
      const passed = res.status === 200 && responseText.length > 50 && detectedScript === rq.expectedScript;

      if (passed) auditResults.summary.passed++;
      else auditResults.summary.failed++;

      auditResults.romanizedInputTests.push({
        query: rq.query,
        targetLanguage: rq.lang,
        expectedScript: rq.expectedScript,
        detectedScript,
        passed,
        snippet: responseText.slice(0, 100).replace(/\n/g, ' '),
      });

      console.log(`[${passed ? 'PASS' : 'FAIL'}] Romanized (${rq.lang} -> ${rq.expectedScript}): detected=${detectedScript}`);
    } catch (err) {
      auditResults.summary.failed++;
      console.log(`[FAIL] Romanized (${rq.lang}) ERROR: ${err.message}`);
    }
  }

  // 5. Cross-Agent Delegation in Indic Language (Telugu)
  console.log('\n--- 5. CROSS-AGENT DELEGATION IN INDIC SCRIPT (TELUGU) ---');
  await new Promise((r) => setTimeout(r, 600));
  auditResults.summary.totalTests++;
  try {
    const teCookie = await getAuthCookie('ORG-01', 'ADMIN', 'USR-0001', 'te');
    const res = await sendPostRequest('/api/agent/chat', {
      query: 'ఆర్థిక రాబడులు మరియు సెలవులో ఉన్న HR ఉద్యోగులను సమీక్షించండి',
      language: 'te',
      selectedAgentOverride: 'CEO',
    }, { Cookie: teCookie });

    const responseText = res.data?.result?.responseText || res.data?.result?.universalResponse?.response?.text || '';
    const detectedScript = detectScript(responseText);
    const passed = res.status === 200 && responseText.length > 50 && detectedScript === 'Telugu';

    if (passed) auditResults.summary.passed++;
    else auditResults.summary.failed++;

    auditResults.crossAgentDelegation = {
      query: 'ఆర్థిక రాబడులు మరియు సెలవులో ఉన్న HR ఉద్యోగులను సమీక్షించండి',
      language: 'te',
      expectedScript: 'Telugu',
      detectedScript,
      passed,
      snippet: responseText.slice(0, 120).replace(/\n/g, ' '),
    };

    console.log(`[${passed ? 'PASS' : 'FAIL'}] Cross-Agent Delegation (Telugu): detected=${detectedScript}, len=${responseText.length}`);
  } catch (err) {
    auditResults.summary.failed++;
    console.log(`[FAIL] Cross-Agent Delegation (Telugu) ERROR: ${err.message}`);
  }

  // Calculate final summary
  auditResults.summary.passRate = `${((auditResults.summary.passed / auditResults.summary.totalTests) * 100).toFixed(1)}%`;

  console.log('\n================================================================');
  console.log(`AUDIT COMPLETE: ${auditResults.summary.passed} / ${auditResults.summary.totalTests} Passed (${auditResults.summary.passRate})`);
  console.log('================================================================\n');

  // Save audit artifact
  const outJson = path.join(__dirname, '..', 'FLOWMIND_90_AGENT_LANGUAGE_MATRIX.json');
  fs.writeFileSync(outJson, JSON.stringify(auditResults, null, 2), 'utf8');
  console.log(`Artifact saved: ${outJson}`);

  // Also write to brain artifact directory if possible
  const brainDir = 'C:\\Users\\furkh\\.gemini\\antigravity\\brain\\c7490880-ff79-4a0d-8d40-b570a9b30c72';
  try {
    fs.writeFileSync(path.join(brainDir, 'FLOWMIND_90_AGENT_LANGUAGE_MATRIX.json'), JSON.stringify(auditResults, null, 2), 'utf8');
  } catch (e) {}

  return auditResults;
}

if (require.main === module) {
  runComprehensiveAudit().catch(console.error);
}

module.exports = { runComprehensiveAudit };
