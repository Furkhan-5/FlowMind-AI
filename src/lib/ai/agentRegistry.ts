import { AgentType, ThoughtStep, ActionCardData, LanguageCode } from '@/types';
import { AgentDefinition, AgentRequestContext, AgentExecutionResult } from './agents/types';
import { SPECIALIZED_AGENT_PROMPTS } from './agents/prompts';
import { MOCK_AGENTS } from '@/lib/mockData';

// Helper for localized response strings
const AGENT_RESPONSES: Record<string, Record<LanguageCode, string>> = {
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
