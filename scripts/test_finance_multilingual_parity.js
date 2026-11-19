const fs = require('fs');

async function testFinanceMultilingualParity() {
  console.log('===============================================================');
  console.log('FLOWMIND AI — FINANCE AGENT MULTILINGUAL PARITY VERIFICATION');
  console.log('===============================================================\n');

  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@flowmind.ai', password: 'flowmind2026!' }),
  });

  const cookie = loginRes.headers.get('set-cookie').split(';')[0];

  const queries = [
    { lang: 'en', name: 'English', query: 'Show me all overdue invoices and calculate total outstanding balance.' },
    { lang: 'hi', name: 'Hindi', query: 'सभी अतिदेय चालान और कुल बकाया राशि दिखाइए।' },
    { lang: 'te', name: 'Telugu', query: 'అన్ని గడువు ముగిసిన ఇన్వాయిస్‌లు మరియు మొత్తం బకాయి మొత్తాన్ని చూపించండి.' },
    { lang: 'ta', name: 'Tamil', query: 'காலாவதியான அனைத்து விலைப்பட்டியல்களையும் மொத்த நிலுவைத் தொகையையும் காட்டுங்கள்.' },
    { lang: 'kn', name: 'Kannada', query: 'ಎಲ್ಲಾ ಅವಧಿ ಮೀರಿದ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ಮತ್ತು ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತವನ್ನು ತೋರಿಸಿ.' },
    { lang: 'ml', name: 'Malayalam', query: 'എല്ലാ കുടിശ്ശികയുള്ള ഇൻവോയ്സുകളും ആകെ കുടിശ്ശിക തുകയും കാണിക്കുക.' },
    { lang: 'hi', name: 'Hinglish', query: 'Saare overdue invoices aur total outstanding balance dikhao.' }
  ];

  const results = [];

  for (const item of queries) {
    console.log(`\nTesting [${item.lang.toUpperCase()}] ${item.name}: "${item.query}"`);
    const startTime = Date.now();
    const res = await fetch('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({
        query: item.query,
        language: item.lang,
        selectedAgentOverride: 'Finance',
      }),
    });

    const elapsed = Date.now() - startTime;
    const data = await res.json();
    const resultObj = data.result || {};
    const responseText = resultObj.responseText || '';
    const metadata = resultObj.universalResponse?.metadata || {};
    const toolExecutions = metadata.toolExecutions || [];
    const toolsUsed = toolExecutions.map(t => t.toolName);

    console.log(`⚡ Response Time: ${elapsed}ms`);
    console.log(`🔧 Tools Used: ${JSON.stringify(toolsUsed)}`);
    console.log(`📝 Response Sample:\n${responseText.substring(0, 300)}...\n`);

    const toolCalled = toolsUsed.includes('finance_get_invoices');
    const mentionsTechCorp = /TechCorp/i.test(responseText);
    const mentionsAmount = /8[,.]?85[,.]?000|8\.85|85,000|8,85,000|₹/i.test(responseText);
    const passed = toolCalled && (mentionsTechCorp || mentionsAmount);

    results.push({
      lang: item.lang,
      name: item.name,
      passed,
      toolsUsed,
      mentionsTechCorp,
      mentionsAmount,
      responseText
    });

    console.log(`Verdict: ${passed ? '✅ PASSED PARITY' : '❌ FAILED PARITY'}`);
  }

  console.log('\n===============================================================');
  console.log('SUMMARY OF FINANCE AGENT MULTILINGUAL PARITY:');
  console.log('===============================================================');
  let passCount = 0;
  for (const r of results) {
    if (r.passed) passCount++;
    console.log(`- [${r.lang}] ${r.name.padEnd(20)}: ${r.passed ? '✅ PASSED' : '❌ FAILED'} | Tools: ${JSON.stringify(r.toolsUsed)}`);
  }
  console.log(`\nTOTAL: ${passCount}/${results.length} PASSED`);
}

testFinanceMultilingualParity().catch(console.error);
