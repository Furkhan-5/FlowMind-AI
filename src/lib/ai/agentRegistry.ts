import { AgentType, ThoughtStep, ActionCardData, LanguageCode } from '@/types';
import { AgentDefinition, AgentRequestContext, AgentExecutionResult } from './agents/types';
import { SPECIALIZED_AGENT_PROMPTS } from './agents/prompts';
import { MOCK_AGENTS } from '@/lib/mockData';

// Helper for localized response strings for all 15 agents
const AGENT_RESPONSES: Record<string, Partial<Record<LanguageCode, string>>> = {
  CEO: {
    en: "CEO Agent evaluated enterprise performance and synchronized all 15 active domain agents.",
    te: "CEO ఏజెంట్ సంస్థ పనితీరును సమీక్షించింది మరియు 15 డొమైన్ ఏజెంట్లను అనుసంధానించింది.",
    hi: "CEO एजेंट ने उद्यम प्रदर्शन का मूल्यांकन किया और सभी 15 डोमेन एजेंटों को समन्वयित किया।",
    ta: "CEO முகவர் நிறுவன செயல்திறனை மதிப்பீடு செய்து 15 முகவர்களையும் ஒருங்கிணைத்தார்.",
    kn: "CEO ಏಜೆಂಟ್ ಸಂಸ್ಥೆಯ ಕಾರ್ಯಕ್ಷಮತೆಯನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಿದರು ಮತ್ತು 15 ಏಜೆಂಟ್‌ಗಳನ್ನು ಸಂಯೋಜಿಸಿದ್ದಾರೆ.",
    ml: "CEO ഏജന്റ് കമ്പനിയുടെ പ്രകടനം വിലയിരുത്തുകയും 15 ഏജന്റുമാരെ ഏകോപിപ്പിക്കുകയും ചെയ്തു.",
  },
  Sales: {
    en: "Sales Agent processed your lead request. Meeting scheduled & CRM lead pipeline updated.",
    te: "సేల్స్ ఏజెంట్ మీ లీడ్ అభ్యర్థనను పూర్తి చేసింది. సమావేశం షెడ్యూల్ చేయబడింది మరియు CRM అప్‌డేట్ చేయబడింది.",
    hi: "बिक्री एजेंट ने आपके अनुरोध को संसाधित किया। बैठक निर्धारित की गई और CRM अपडेट किया गया।",
    ta: "விற்பனை முகவர் உங்கள் கோரிக்கையை செயலாக்கினார். கூட்டம் திட்டமிடப்பட்டு CRM புதுப்பிக்கப்பட்டது.",
    kn: "ಮಾರಾಟ ಏಜೆಂಟ್ ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದಾರೆ. ಸಭೆಯನ್ನು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ ಮತ್ತು CRM ನವೀಕರಿಸಲಾಗಿದೆ.",
    ml: "സെയിൽസ് ഏജന്റ് നിങ്ങളുടെ അഭ്യർത്ഥന പൂർത്തിയാക്കി. മീറ്റിംഗ് നിശ്ചയിക്കുകയും CRM പുതുക്കുകയും ചെയ്തു.",
  },
  Finance: {
    en: "Finance Agent verified tax codes and calculated 18% GST breakdown. Invoice PDF draft is ready.",
    te: "ఫైనాన్స్ ఏజెంట్ 18% GST వివరాలను గణించింది. ఇన్వాయిస్ PDF డ్రాఫ్ట్ సిద్ధంగా ఉంది.",
    hi: "वित्त एजेंट ने 18% GST विवरण की गणना की। इनवॉइस PDF ड्राफ्ट तैयार है।",
    ta: "நிதி முகவர் 18% GST விவரங்களைக் கணக்கிட்டார். இன்வாய்ஸ் PDF வரைவு தயார்.",
    kn: "ಹಣಕಾಸು ಏಜೆಂಟ್ 18% GST ವಿವರಗಳನ್ನು ಲೆಕ್ಕಹಾಕಿದ್ದಾರೆ. ಇನ್‌ವಾಯ್ಸ್ PDF ಕರಡು ಸಿದ್ಧವಾಗಿದೆ.",
    ml: "ധനകാര്യ ഏജന്റ് 18% GST കണക്കാക്കി. ഇൻവോയ്സ് PDF ഡ്രാഫ്റ്റ് തയ്യാറാണ്.",
  },
  HR: {
    en: "HR Agent checked leave balance and processed employee HR approval request.",
    te: "HR ఏజెంట్ సెలవు నిల్వను పరిశీలించి ఉద్యోగి ఆమోద అభ్యర్థనను పూర్తి చేసింది.",
    hi: "HR एजेंट ने छुट्टी के संतुलन की जांच की और स्वीकृति संसाधित की।",
    ta: "HR முகவர் விடுப்பு இருப்பை சரிபார்த்து ஒப்புதல் கோரிக்கையை செயலாக்கினார்.",
    kn: "HR ಏಜೆಂಟ್ ರಜೆ ಬಾಕಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಅನುಮೋದನೆ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದಾರೆ.",
    ml: "HR ഏജന്റ് അവധി വിവരങ്ങൾ പരിശോധിച്ച് അംഗീകാരം നൽകി.",
  },
  Analytics: {
    en: "Analytics Agent calculated real-time KPI metrics and generated revenue trend report.",
    te: "అనలిటిక్స్ ఏజెంట్ రియల్-టైమ్ KPI గణాంకాలను మరియు రాబడి నివేదికను సిద్ధం చేసింది.",
    hi: "एनालिटिक्स एजेंट ने वास्तविक समय के KPI मेट्रिक्स और राजस्व रिपोर्ट तैयार की।",
    ta: "பகுப்பாய்வு முகவர் நிகழ்நேர KPI அளவீடுகள் மற்றும் வருவாய் அறிக்கையை உருவாக்கினார்.",
    kn: "ವಿಶ್ಲೇಷಣೆ ಏಜೆಂಟ್ ನೈಜ ಸಮಯದ KPI ಮಾಪನಗಳನ್ನು ಮತ್ತು ಆದಾಯ ವರದಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದಾರೆ.",
    ml: "അനലിറ്റിക്സ് ഏജന്റ് തത്സമയ KPI കണക്കുകൾ തയ്യാറാക്കി.",
  },
  Support: {
    en: "Customer Support Agent analyzed ticket priorities and dispatched automated resolution guidance.",
    te: "సపోర్ట్ ఏజెంట్ టికెట్ ప్రాధాన్యతను పరిశీలించి పరిష్కారం పంపింది.",
    hi: "सहायता एजेंट ने टिकट प्राथमिकताओं का विश्लेषण किया और समाधान भेजा।",
    ta: "ஆதரவு முகவர் டிக்கெட் முன்னுரிமைகளை ஆய்வு செய்து தீர்வை அனுப்பினார்.",
    kn: "ಬೆಂಬಲ ಏಜೆಂಟ್ ಟಿಕೆಟ್ ಆದ್ಯತೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಪರಿಹಾರವನ್ನು ರವಾನಿಸಿದ್ದಾರೆ.",
    ml: "സപ്പോർട്ട് ഏജന്റ് ടിക്കറ്റുകൾ പരിശോധിച്ച് മറുപടി അയച്ചു.",
  },
  Engineering: {
    en: "Engineering Agent executed automated system diagnostics and architecture check.",
    te: "ఇంజనీరింగ్ ఏజెంట్ సిస్టమ్ రోగనిర్ధారణ మరియు ఆర్కిటెక్చర్ తనిఖీని పూర్తి చేసింది.",
    hi: "इंजीनियरिंग एजेंट ने स्वचालित सिस्टम निदान और जांच की।",
    ta: "பொறியியல் முகவர் தானியங்கி கணினி பரிசோதனையை முடித்தார்.",
    kn: "ಎಂಜಿನಿಯರಿಂಗ್ ಏಜೆಂಟ್ ಸ್ವಯಂಚಾಲಿತ ಸಿಸ್ಟಮ್ ತಪಾಸಣೆ ಪೂರ್ಣಗೊಳಿಸಿದ್ದಾರೆ.",
    ml: "എഞ്ചിനീയറിംഗ് ഏജന്റ് സിസ്റ്റം പരിശോധന പൂർത്തിയാക്കി.",
  },
  Legal: {
    en: "Legal Agent audited contract compliance and verified governance risk factors.",
    te: "లీగల్ ఏజెంట్ కాంట్రాక్ట్ సమ్మతి మరియు గవర్నెన్స్ నిబంధనలను పరిశీలించింది.",
    hi: "लीगल एजेंट ने अनुबंध अनुपालन और जोखिम कारकों का ऑडिट किया।",
    ta: "சட்ட முகவர் ஒப்பந்த இணக்கம் மற்றும் அபாயங்களை தணிக்கை செய்தார்.",
    kn: "ನ್ಯಾಯಿಕ ಏಜೆಂಟ್ ಒಪ್ಪಂದದ ಅನುಸರಣೆ ಮತ್ತು ಅಪಾಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ.",
    ml: "ലീഗൽ ഏജന്റ് കരാറുകൾ പരിശോധിക്കുകയും സുരക്ഷ ഉറപ്പാക്കുകയും ചെയ്തു.",
  },
  Marketing: {
    en: "Marketing Agent evaluated campaign metrics and optimized multi-channel strategy.",
    te: "మార్కెటింగ్ ఏజెంట్ క్యాంపెయిన్ గణాంకాలను పరిశీలించి వ్యూహాన్ని మెరుగుపరిచింది.",
    hi: "मार्केटिंग एजेंट ने अभियान मेट्रिक्स का मूल्यांकन किया और रणनीति को अनुकूलित किया।",
    ta: "சந்தைப்படுத்தல் முகவர் பிரச்சார அளவீடுகளை ஆய்வு செய்து உத்தியை மேம்படுத்தினார்.",
    kn: "ಮಾರುಕಟ್ಟೆ ಏಜೆಂಟ್ ಪ್ರಚಾರ ಮಾಪನಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಿದ್ದಾರೆ.",
    ml: "മാർക്കറ്റിംഗ് ഏജന്റ് കാമ്പയിൻ കണക്കുകൾ വിലയിരുത്തി.",
  },
  Inventory: {
    en: "Inventory Agent checked warehouse stock levels and flagged low threshold items.",
    te: "ఇన్వెంటరీ ఏజెంట్ స్టాక్ స్థాయిలను పరిశీలించి తక్కువ నిల్వ ఉన్న వస్తువులను గుర్తించింది.",
    hi: "इन्वेंट्री एजेंट ने स्टॉक स्तरों की जांच की और कम इन्वेंट्री की पहचान की।",
    ta: "சரக்கு முகவர் இருப்புகளை சரிபார்த்து குறைந்த இருப்பை சுட்டிக்காட்டினார்.",
    kn: "ದಾಸ್ತಾನು ಏಜೆಂಟ್ ದಾಸ್ತಾನು ಮಟ್ಟಗಳನ್ನು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ.",
    ml: "ഇൻവെന്ററി ഏജന്റ് സ്റ്റോക്ക് വിവരങ്ങൾ പരിശോധിച്ചു.",
  },
  Operations: {
    en: "Operations Agent monitored workflow execution pipelines and optimized resource allocation.",
    te: "ఆపరేషన్స్ ఏజెంట్ వర్క్‌ఫ్లో పైప్‌లైన్‌లను మరియు వనరు కేటాయింపును సమీక్షించింది.",
    hi: "ऑपरेशंस एजेंट ने वर्कफ़्लो निष्पादन और संसाधन आवंटन की निगरानी की।",
    ta: "செயல்பாட்டு முகவர் பணிப்பாய்வு மற்றும் வள ஒதுக்கீட்டை கண்காணித்தார்.",
    kn: "ಕಾರ್ಯಾಚರಣೆ ಏಜೆಂಟ್ ಕಾರ್ಯಪ್ರವಾಹ ಮತ್ತು ಸಂಪನ್ಮೂಲಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿದ್ದಾರೆ.",
    ml: "ഓപ്പറേഷൻസ് ഏജന്റ് വർക്ക്ഫ്ലോ പ്രവർത്തനങ്ങൾ നിരീക്ഷിച്ചു.",
  },
  Product: {
    en: "Product Agent updated feature roadmap priorities and synthesized user feedback.",
    te: "ప్రాడక్ట్ ఏజెంట్ ఫీచర్ రోడ్‌మ్యాప్ మరియు వినియోగదారు అభిప్రాయాలను సమీక్షించింది.",
    hi: "प्रोडक्ट एजेंट ने रोडमैप प्राथमिकताओं और उपयोगकर्ता प्रतिक्रिया को अपडेट किया।",
    ta: "தயாரிப்பு முகவர் அம்சங்களின் முன்னுரிமைகளை புதுப்பித்தார்.",
    kn: "ಉತ್ಪನ್ನ ಏಜೆಂಟ್ ವೈಶಿಷ್ಟ್ಯಗಳ ಆದ್ಯತೆಗಳನ್ನು ನವೀಕರಿಸಿದ್ದಾರೆ.",
    ml: "പ്രൊഡക്റ്റ് ഏജന്റ് ഫീച്ചറുകൾ പുതുക്കി നിശ്ചയിച്ചു.",
  },
  Security: {
    en: "Security Agent monitored real-time threat vectors and enforced prompt injection guardrails.",
    te: "సెక్యూరిటీ ఏజెంట్ రియల్-టైమ్ భద్రతను పర్యవేక్షించి ప్రోంప్ట్ ఇంజెక్షన్ నిరోధించింది.",
    hi: "सुरक्षा एजेंट ने वास्तविक समय के खतरों की निगरानी की और सुरक्षा नियमों को लागू किया।",
    ta: "பாதுகாப்பு முகவர் நிகழ்நேர அச்சுறுத்தல்களை கண்காணித்து பாதுகாத்தார்.",
    kn: "ಸುರಕ್ಷತಾ ಏಜೆಂಟ್ ನೈಜ ಸಮಯದ ಬೆದರಿಕೆಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿದ್ದಾರೆ.",
    ml: "സെക്യൂരിറ്റി ഏജന്റ് സുരക്ഷാ ഭീഷണികൾ തടഞ്ഞു.",
  },
  Workflow: {
    en: "Workflow Agent compiled Natural Language DAG pipeline and validated execution node topology.",
    te: "వర్క్‌ఫ్లో ఏజెంట్ DAG పైప్‌లైన్‌ను కంపైల్ చేసి ఎగ్జిక్యూషన్ నోడ్లను పరిశీలించింది.",
    hi: "वर्कफ़्लो एजेंट ने नेचुरल लैंग्वेज DAG पाइपलाइन और निष्पादन नोड्स का सत्यापन किया।",
    ta: "பணிப்பாய்வு முகவர் DAG பைப்லைனை தொகுத்து சரிபார்த்தார்.",
    kn: "ಕಾರ್ಯಪ್ರವಾಹ ಏಜೆಂಟ್ DAG ಪೈಪ್‌ಲೈನ್ ಮತ್ತು ನೋಡ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ.",
    ml: "വർക്ക്ഫ്ലോ ഏജന്റ് DAG പൈപ്പ്‌ലൈൻ പരിശോധിച്ചു.",
  },
  Document: {
    en: "Document Agent extracted structured data and generated clean artifact exports.",
    te: "డాక్యుమెంట్ ఏజెంట్ డేటాను సంగ్రహించి ఆర్టిఫాక్ట్ నివేదికను రూపొందించింది.",
    hi: "डॉक्यूमेंट एजेंट ने संरचित डेटा निकाला और स्वच्छ रिपोर्ट तैयार की।",
    ta: "ஆவண முகவர் தரவை பிரித்தெடுத்து அறிக்கையை உருவாக்கினார்.",
    kn: "ದಾಖಲೆ ಏಜೆಂಟ್ ಡೇಟಾವನ್ನು ಹೊರತೆಗೆದು ವರದಿಯನ್ನು ತಯಾರಿಸಿದ್ದಾರೆ.",
    ml: "ഡോക്യുമെന്റ് ഏജന്റ് വിവരങ്ങൾ ശേഖരിച്ച് റിപ്പോർട്ട് തയ്യാറാക്കി.",
  },
};

export class AgentRegistryService {
  private registry: Map<AgentType, AgentDefinition> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry() {
    MOCK_AGENTS.forEach((info) => {
      const prompt = SPECIALIZED_AGENT_PROMPTS[info.id] || `You are the ${info.name}.`;
      
      const definition: AgentDefinition = {
        id: info.id,
        name: info.name,
        roleTitle: info.roleTitle,
        domain: info.domain,
        description: info.description,
        systemPrompt: prompt,
        capabilities: [info.domain, 'Task Execution', 'Status Logging'],
        canProposeActions: ['Sales', 'Finance', 'HR', 'Document', 'Workflow'].includes(info.id),
        requiresApproval: ['Sales', 'Finance', 'HR', 'Document', 'Workflow'].includes(info.id),
        execute: (context) => this.executeAgent(info.id, context),
      };

      this.registry.set(info.id, definition);
    });
  }

  public getAgent(id: AgentType): AgentDefinition | undefined {
    return this.registry.get(id);
  }

  public getAllAgents(): AgentDefinition[] {
    return Array.from(this.registry.values());
  }

  private executeAgent(agentId: AgentType, context: AgentRequestContext): AgentExecutionResult {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lang = context.language || 'en';

    // Safe execution status events ONLY (never expose private chain-of-thought or internal prompts)
    const thoughtSteps: ThoughtStep[] = [
      { agent: agentId, action: `Understanding user request (${lang.toUpperCase()})`, timestamp: timeStr, status: 'DONE' },
      { agent: agentId, action: `Evaluating ${agentId} domain rules & permissions`, timestamp: timeStr, status: 'DONE' },
    ];

    let responseText = `${agentId} Agent processed your request across system modules.`;
    const localizedMap = AGENT_RESPONSES[agentId];
    if (localizedMap && localizedMap[lang]) {
      responseText = localizedMap[lang];
    }

    let proposedAction: ActionCardData | undefined = undefined;

    // Generate proposed action cards for action-producing agents
    if (agentId === 'Sales') {
      thoughtSteps.push({ agent: 'Sales', action: 'Preparing sales meeting & lead update', timestamp: timeStr, status: 'DONE' });
      thoughtSteps.push({ agent: 'Sales', action: 'Waiting for user approval on Action Card', timestamp: timeStr, status: 'PENDING' });

      proposedAction = {
        id: `ACT-${Date.now()}`,
        title: 'Schedule Sales Meeting & Update CRM Lead',
        description: 'Sales Agent parsed request and drafted meeting invitation for tomorrow 10:00 AM IST.',
        agent: 'Sales',
        module: 'Sales',
        details: context.contextParams || { client: 'Apex Tech Solutions', time: 'Tomorrow 10:00 AM IST', dealValue: '₹1,25,000' },
        status: 'PENDING',
        confirmLabel: 'Approve & Schedule Meeting',
      };
    } else if (agentId === 'Finance') {
      thoughtSteps.push({ agent: 'Finance', action: 'Calculating 18% GST & invoice details', timestamp: timeStr, status: 'DONE' });
      thoughtSteps.push({ agent: 'Finance', action: 'Waiting for user approval on Action Card', timestamp: timeStr, status: 'PENDING' });

      proposedAction = {
        id: `ACT-${Date.now()}`,
        title: 'Issue Client Invoice PDF (#INV-2026-990)',
        description: 'Finance Agent verified tax codes and created invoice draft with 18% GST.',
        agent: 'Finance',
        module: 'Finance',
        details: context.contextParams || { client: 'Apex Tech Solutions', amount: '₹1,25,000', tax: '₹22,500 (18% GST)' },
        status: 'PENDING',
        confirmLabel: 'Approve & Dispatch Invoice',
      };
    } else if (agentId === 'HR') {
      thoughtSteps.push({ agent: 'HR', action: 'Verifying employee leave balance & HR policy', timestamp: timeStr, status: 'DONE' });
      thoughtSteps.push({ agent: 'HR', action: 'Waiting for user approval on Action Card', timestamp: timeStr, status: 'PENDING' });

      proposedAction = {
        id: `ACT-${Date.now()}`,
        title: 'Approve Employee Leave Request (2 Days)',
        description: 'HR Agent verified leave balance for Rajesh Kumar and prepared leave approval entry.',
        agent: 'HR',
        module: 'HR',
        details: context.contextParams || { employee: 'Rajesh Kumar', leaveDays: 2, leaveType: 'Casual Leave' },
        status: 'PENDING',
        confirmLabel: 'Approve Employee Leave',
      };
    } else if (agentId === 'Analytics') {
      thoughtSteps.push({ agent: 'Analytics', action: 'Calculating real-time KPI metrics & revenue trends', timestamp: timeStr, status: 'DONE' });
    } else {
      thoughtSteps.push({ agent: agentId, action: `Executed ${agentId} domain task successfully`, timestamp: timeStr, status: 'DONE' });
    }

    return {
      responseText,
      thoughtSteps,
      proposedAction,
      confidence: 0.95,
    };
  }
}

export const agentRegistry = new AgentRegistryService();
