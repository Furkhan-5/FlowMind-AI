const fs = require('fs');

async function testSalesMultilingualParity() {
  console.log('===============================================================');
  console.log('FLOWMIND AI — SALES AGENT MULTILINGUAL PARITY VERIFICATION');
  console.log('===============================================================\n');

  console.log('1. Authenticating as admin@flowmind.ai ...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@flowmind.ai', password: 'flowmind2026!' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with HTTP status ${loginRes.status}`);
  }

  const cookieHeader = loginRes.headers.get('set-cookie');
  const cookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  console.log('✅ Authenticated successfully.\n');

  const queries = [
    {
      lang: 'en',
      name: 'English',
      query: 'Show me all active sales deals, their stages and total pipeline value.',
    },
    {
      lang: 'hi',
      name: 'Hindi',
      query: 'मेरे सभी सक्रिय बिक्री सौदे दिखाइए। उनके चरण और कुल बिक्री मूल्य भी बताइए।',
    },
    {
      lang: 'te',
      name: 'Telugu',
      query: 'నా యాక్టివ్ సేల్స్ డీల్స్, వాటి దశలు మరియు మొత్తం పైప్‌లైన్ విలువను చూపించండి.',
    },
    {
      lang: 'ta',
      name: 'Tamil',
      query: 'எனது செயலில் உள்ள விற்பனை ஒப்பந்தங்கள், அவற்றின் நிலைகள் மற்றும் மொத்த பைப்லைன் மதிப்பைக் காட்டுங்கள்.',
    },
    {
      lang: 'kn',
      name: 'Kannada',
      query: 'ನನ್ನ ಎಲ್ಲಾ ಸಕ್ರಿಯ ಮಾರಾಟ ಡೀಲ್‌ಗಳು, ಅವುಗಳ ಹಂತಗಳು ಮತ್ತು ಒಟ್ಟು ಪೈಪ್‌ಲೈನ್ ಮೌಲ್ಯವನ್ನು ತೋರಿಸಿ.',
    },
    {
      lang: 'ml',
      name: 'Malayalam',
      query: 'എന്റെ എല്ലാ സജീവ വിൽപ്പന ഡീലുകളും അവയുടെ ഘട്ടങ്ങളും ആകെ പൈപ്പ്‌ലൈൻ മൂല്യവും കാണിക്കുക.',
    },
    {
      lang: 'hi',
      name: 'Hinglish (Romanized Hindi)',
      query: 'Mere saare active sales deals, unke stages aur total pipeline value dikhao.',
    },
  ];

  const results = [];

  for (const item of queries) {
    console.log(`\nTesting [${item.lang.toUpperCase()}] ${item.name}: "${item.query}"`);
    const startTime = Date.now();
    const res = await fetch('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
      body: JSON.stringify({
        query: item.query,
        language: item.lang,
        selectedAgentOverride: 'Sales',
      }),
    });

    const elapsed = Date.now() - startTime;
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}: ${res.statusText}`);
      const errText = await res.text();
      console.error(`Error body:`, errText);
      results.push({ lang: item.lang, name: item.name, status: 'FAILED_HTTP', error: errText });
      continue;
    }

    const data = await res.json();
    const resultObj = data.result || {};
    const responseText = resultObj.responseText || '';
    const metadata = resultObj.universalResponse?.metadata || {};
    const toolExecutions = metadata.toolExecutions || [];
    const toolsUsed = toolExecutions.map(t => t.toolName);

    console.log(`⚡ Response Time: ${elapsed}ms`);
    console.log(`🔧 Tools Used: ${JSON.stringify(toolsUsed)}`);
    console.log(`📝 Response Sample (first 250 chars):`);
    console.log(responseText.substring(0, 250) + '...\n');

    // Parity Checks:
    // 52 opportunities
    const mentions52 = /52/.test(responseText);
    // ₹97,00,000 or 97 Lakh
    const mentions97Lakh = /97[,.]?00[,.]?000|97\s*Lakh|97\s*लाख|97\s*లక్ష|97\s*லட்ச|97\s*ಲಕ್ಷ|97\s*ലക്ഷ/i.test(responseText);
    // Tata Motors
    const mentionsTata = /Tata\s*Motors/i.test(responseText);
    // CRM Tool executed
    const toolCalled = toolsUsed.includes('crm_get_leads') || toolsUsed.some(t => t.includes('crm'));

    const passed = toolCalled && (mentions52 || mentions97Lakh);

    results.push({
      lang: item.lang,
      name: item.name,
      passed,
      toolsUsed,
      mentions52,
      mentions97Lakh,
      mentionsTata,
      fullResponse: responseText,
    });

    console.log(`Verdict: ${passed ? '✅ PASSED PARITY' : '❌ FAILED PARITY'} (Tool: ${toolCalled}, 52 Deals: ${mentions52}, ₹97L: ${mentions97Lakh}, Tata: ${mentionsTata})`);
  }

  console.log('\n===============================================================');
  console.log('SUMMARY OF SALES AGENT MULTILINGUAL PARITY:');
  console.log('===============================================================');
  let passCount = 0;
  for (const r of results) {
    if (r.passed) passCount++;
    console.log(`- [${r.lang}] ${r.name.padEnd(26)}: ${r.passed ? '✅ PASSED' : '❌ FAILED'} | Tools: ${JSON.stringify(r.toolsUsed)} | 52 Deals: ${r.mentions52} | ₹97L Value: ${r.mentions97Lakh}`);
  }
  console.log(`\nTOTAL: ${passCount}/${results.length} PASSED`);

  fs.writeFileSync('scripts/sales_parity_result.json', JSON.stringify(results, null, 2));
}

testSalesMultilingualParity().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
