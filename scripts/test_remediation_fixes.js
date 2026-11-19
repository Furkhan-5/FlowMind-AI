const fs = require('fs');

async function testFixes() {
  console.log('Testing remediation fixes...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@flowmind.ai', password: 'flowmind2026!' }),
  });
  const cookie = loginRes.headers.get('set-cookie').split(';')[0];

  const tests = [
    {
      name: 'Scheduler [ML]',
      agent: 'Scheduler',
      lang: 'ml',
      query: 'ഷെഡ്യൂൾ ചെയ്ത ആവർത്തന ജോലികൾ, കലണ്ടർ അപ്പോയിന്റ്മെന്റുകൾ, നിർവ്വഹണ സമയക്രമങ്ങൾ എന്നിവ കാണിക്കുക.',
      expectedTool: 'workflow_get_scheduled'
    },
    {
      name: 'Security [EN]',
      agent: 'Security',
      lang: 'en',
      query: 'Inspect system security status, role-based access logs, and active safeguards.',
      expectedTool: 'security_inspect_logs'
    },
    {
      name: 'Security [HI]',
      agent: 'Security',
      lang: 'hi',
      query: 'सिस्टम सुरक्षा स्थिति, भूमिका-आधारित पहुंच लॉग और सक्रिय सुरक्षा उपायों का निरीक्षण करें।',
      expectedTool: 'security_inspect_logs'
    },
    {
      name: 'Security [TE]',
      agent: 'Security',
      lang: 'te',
      query: 'సిస్టమ్ భద్రతా స్థితి, రోల్-ఆధారిత యాక్సెస్ లాగ్‌లు మరియు రక్షణలను పరిశీలించండి.',
      expectedTool: 'security_inspect_logs'
    },
    {
      name: 'Security [TA]',
      agent: 'Security',
      lang: 'ta',
      query: 'கணினி பாதுகாப்பு நிலை, பங்கு அடிப்படையிலான அணுகல் பதிவுகள் மற்றும் பாதுகாப்புகளை ஆய்வு செய்யவும்.',
      expectedTool: 'security_inspect_logs'
    },
    {
      name: 'Security [KN]',
      agent: 'Security',
      lang: 'kn',
      query: 'ಸಿಸ್ಟಮ್ ಭದ್ರತಾ ಸ್ಥಿತಿ, ಪಾತ್ರ-ಆಧಾರಿತ ಪ್ರವೇಶ ಲಾಗ್‌ಗಳು ಮತ್ತು ಸಕ್ರಿಯ ರಕ್ಷಣೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
      expectedTool: 'security_inspect_logs'
    },
    {
      name: 'Security [ML]',
      agent: 'Security',
      lang: 'ml',
      query: 'സിസ്റ്റം സുരക്ഷാ നില, റോൾ അടിസ്ഥാനമാക്കിയുള്ള ആക്സസ് ലോഗുകൾ, സജീവ സുരക്ഷാ മുൻകരുതലുകൾ എന്നിവ പരിശോധിക്കുക.',
      expectedTool: 'security_inspect_logs'
    },
    {
      name: 'Cross-Domain Sales -> CEO [HI]',
      agent: 'Sales',
      lang: 'hi',
      query: 'हमारे शीर्ष अतिदेय ग्राहक कौन से हैं और उनके लिए सहायता टिकट क्या हैं?',
      isCrossDomain: true
    },
    {
      name: 'Cross-Domain Support -> CEO [TE]',
      agent: 'Support',
      lang: 'te',
      query: 'బకాయి ఉన్న ఖాతాలు మరియు వాటి సపోర్ట్ టిక్కెట్ల వివరాలను సమన్వయం చేయండి.',
      isCrossDomain: true
    }
  ];

  for (const t of tests) {
    const res = await fetch('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ query: t.query, language: t.lang, selectedAgentOverride: t.agent })
    });
    const json = await res.json();
    const result = json.result || {};
    const tools = (result.universalResponse?.metadata?.toolExecutions || []).map(x => x.toolName);
    const targetAgent = result.targetAgent || result.universalResponse?.agent?.id;

    if (t.isCrossDomain) {
      const passed = targetAgent === 'CEO' && (tools.includes('finance_get_invoices') || tools.includes('support_get_tickets') || result.responseText?.length > 100);
      console.log(`[${t.name}] Passed: ${passed} | Target Agent: ${targetAgent} | Tools: [${tools.join(', ')}]`);
    } else {
      const passed = tools.includes(t.expectedTool);
      console.log(`[${t.name}] Passed: ${passed} | Tools: [${tools.join(', ')}] | Length: ${result.responseText?.length}`);
    }
  }
}

testFixes().catch(console.error);
