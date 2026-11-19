import { AgentType, LanguageCode, ChatMessage } from '@/types';
import { InterpretedIntent, OperationType, BusinessDomain } from './agentContracts';
import { isSimpleConversational } from './aiReasoningEngine';
import { MultilingualIntentNormalizer } from '@/lib/i18n/multilingualIntentNormalizer';

export class IntentEngine {
  private detectTargetAgentFromIntro(text: string): AgentType | null {
    const lower = text.toLowerCase();
    if (lower.includes('finance')) return 'Finance';
    if (lower.includes('marketing')) return 'Marketing';
    if (lower.includes('support') || lower.includes('helpdesk')) return 'Support';
    if (lower.includes('scheduler') || lower.includes('calendar')) return 'Scheduler';
    if (lower.includes('security')) return 'Security';
    if (lower.includes('analytics') || lower.includes('metric')) return 'Analytics';
    if (lower.includes('database') || lower.includes('inventory')) return 'Database';
    if (lower.includes('workflow')) return 'Workflow';
    if (lower.includes('document')) return 'Document';
    if (lower.includes('email')) return 'Email';
    if (lower.includes('knowledge')) return 'Knowledge';
    if (lower.includes('reporting')) return 'Reporting';
    if (lower.includes('sales') || lower.includes('crm')) return 'Sales';
    if (lower.includes('hr') || lower.includes('human resource')) return 'HR';
    if (lower.includes('ceo')) return 'CEO';
    return null;
  }

  /**
   * Analyzes the user message in the context of recent messages to produce
   * a canonical, structured interpretation of the user's intent.
   */
  public analyzeIntent(
    userMessage: string,
    options: {
      language?: LanguageCode;
      recentMessages?: ChatMessage[];
      userRole?: string;
      selectedAgentOverride?: AgentType | null;
    } = {}
  ): InterpretedIntent {
    const text = (userMessage || '').trim();
    const lower = text.toLowerCase();
    const recent = options.recentMessages || [];
    const lastAgentMessage = [...recent].reverse().find((m) => m.sender === 'AGENT');

    // 0. Simple Conversational Introduction / Role Query Check (Zero DB queries)
    if (isSimpleConversational(text)) {
      const targetAgent = options.selectedAgentOverride || this.detectTargetAgentFromIntro(text) || 'CEO';
      return {
        primaryIntent: 'AGENT_CONVERSATIONAL_INTRO',
        operationType: 'CONVERSATIONAL',
        businessDomain: 'GENERAL',
        targetAgent,
        requiredTools: [],
        entities: {},
        parameters: { query: text },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TEXT',
      };
    }

    // 1. Follow-up / Conversational Simplification Check
    if (
      /^(?:can you\s+)?explain\s+(?:that|this|the\s+previous\s+result|again)\s+in\s+simpler\s+(?:words|terms|language)/i.test(lower) ||
      /^(?:what does that mean|simplify this|make it simple|in plain english|break it down)/i.test(lower)
    ) {
      return {
        primaryIntent: 'EXPLAIN_SIMPLER',
        operationType: 'CONVERSATIONAL',
        businessDomain: 'GENERAL',
        targetAgent: lastAgentMessage?.activeAgent || 'CEO',
        requiredTools: [],
        entities: {},
        parameters: { targetMessageContent: lastAgentMessage?.content || '' },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TEXT',
        isFollowUp: true,
      };
    }

    // 2. Explicit Persistent Memory Command
    if (/^(?:please\s+)?(?:remember|note|keep in mind)(?:\s+that)?\s+(.+)/i.test(text)) {
      const factClean = text.replace(/^(?:please\s+)?(?:remember|note|keep in mind)(?:\s+that)?\s+/i, '').trim();
      return {
        primaryIntent: 'MEMORY_PERSIST',
        operationType: 'MEMORY',
        businessDomain: 'GENERAL',
        targetAgent: 'CEO',
        requiredTools: ['memory_save'],
        entities: {},
        parameters: { fact: factClean, scope: 'ORGANIZATION' },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TEXT',
      };
    }

    // 2.5 Centralized Multilingual Intent Normalization
    // Normalizes user queries across English, Hindi, Telugu, Tamil, Kannada, and Malayalam
    // into canonical, language-independent operational intents.
    const normalized = MultilingualIntentNormalizer.normalize(text, {
      language: options.language,
      selectedAgentOverride: options.selectedAgentOverride,
      userRole: options.userRole,
    });
    if (normalized) {
      return normalized;
    }

    // 2b. Explicit Agent Overrides & Dedicated Domain Handlers
    if (options.selectedAgentOverride === 'Email' || /draft\s+(?:an?\s+)?(?:urgent\s+)?(?:payment\s+reminder\s+)?email/i.test(lower)) {
      if (/email|send|draft|reminder|dispatch|notification/i.test(lower)) {
        return {
          primaryIntent: 'EMAIL_PREPARE_DISPATCH',
          operationType: 'COMMUNICATION',
          businessDomain: 'COMMUNICATION',
          targetAgent: 'Email',
          requiredTools: ['email_generate_invite'],
          entities: {},
          parameters: { message: text },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }
    }

    if (options.selectedAgentOverride === 'Marketing' || (lower.includes('campaign') && (lower.includes('marketing') || lower.includes('outreach') || lower.includes('fintech') || lower.includes('draft')))) {
      return {
        primaryIntent: 'MARKETING_DRAFT_CAMPAIGN',
        operationType: 'ACTION_MUTATION',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Marketing',
        requiredTools: ['crm_get_leads'],
        entities: {},
        parameters: { topic: text },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    if (options.selectedAgentOverride === 'Reporting' || (/compliance.*report|audit.*report|regulatory.*report/i.test(lower))) {
      return {
        primaryIntent: 'REPORTING_GENERATE_AUDIT',
        operationType: 'ANALYTICAL',
        businessDomain: 'GENERAL',
        targetAgent: 'Reporting',
        requiredTools: ['finance_get_invoices', 'crm_get_leads', 'hr_get_employees'],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'RECORD',
      };
    }

    // 3. Multi-Domain Cross-Department Queries & Executive Risk Analysis
    const hasInvoiceTerm = /invoice|payment|money\s+pending|unpaid|overdue|paid\b|hasn't\s+paid|haven't\s+paid|receivables|billing/i.test(lower);
    const hasTicketTerm = /support\s*ticket|open\s*ticket|ticket|customer\s*issue/i.test(lower);
    const isRiskAnalysis = /risk|business\s+operations|operational\s+risks?|analyze\s+(?:our\s+)?(?:current\s+)?(?:business\s+)?operations/i.test(lower);

    if (
      options.selectedAgentOverride === 'CEO' &&
      /executive\s+summary|strategic|guidance|overview|leadership/i.test(lower) &&
      !(hasInvoiceTerm && hasTicketTerm)
    ) {
      return {
        primaryIntent: 'GENERAL_EXECUTIVE_QUERY',
        operationType: 'CONVERSATIONAL',
        businessDomain: 'EXECUTIVE',
        targetAgent: 'CEO',
        requiredTools: [],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    if (
      isRiskAnalysis ||
      (hasInvoiceTerm && hasTicketTerm) ||
      (/both\s+(?:overdue\s+invoices?|unpaid).*(?:support\s+tickets?|tickets?)/i.test(lower))
    ) {
      return {
        primaryIntent: 'CROSS_DOMAIN_OVERDUE_AND_SUPPORT',
        secondaryIntent: 'ANALYZE_RISK_ACCOUNTS',
        operationType: 'ANALYTICAL',
        businessDomain: 'EXECUTIVE',
        targetAgent: 'CEO',
        requiredTools: ['finance_get_invoices', 'support_get_tickets'],
        entities: {},
        parameters: { joinEntity: 'customerName' },
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
        isMultiDomain: true,
        secondaryDomains: ['FINANCE', 'SUPPORT'],
      };
    }

    // 4. Workflow Queries & Automation Management
    if (
      options.selectedAgentOverride === 'Workflow' ||
      options.selectedAgentOverride === 'Scheduler' ||
      /workflow|automation|dag\s+pipeline|dag|scheduled\s+meeting|scheduled\s+workflows?|what\s+meetings/i.test(lower) ||
      (/schedule/i.test(lower) && /tomorrow|monday|every|10\s*am|9\s*am|history|failed|pause|resume|activate/i.test(lower))
    ) {
      // 4.0 Schedule a Meeting / Calendar Invite: "Schedule a meeting at 9:00 AM tomorrow", "Book a meeting..."
      if (/schedule\s+(?:a\s+)?meeting|book\s+(?:a\s+)?meeting|calendar\s+invite|demo\s+meeting/i.test(lower)) {
        const timeParsed = this.extractDateTime(text);
        const attendees = lower.includes('sales') ? 'Sales Team' : 'Executive Team';
        return {
          primaryIntent: 'SCHEDULE_MEETING',
          operationType: 'COMMUNICATION',
          businessDomain: 'COMMUNICATION',
          targetAgent: 'Scheduler',
          requiredTools: ['email_generate_invite'],
          entities: {
            meetingTime: timeParsed || 'Tomorrow at 9:00 AM IST',
            attendees,
          },
          parameters: {
            time: timeParsed || 'Tomorrow at 9:00 AM IST',
            attendees,
            title: `Sync with ${attendees}`,
          },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 4.1 Reschedule meeting or workflow: "Update the meeting workflow to 10 AM", "Reschedule meeting to 10 AM", "Change schedule to Monday 10 AM"
      if (/update.*to\s+|reschedule|move.*to\s+|change.*time.*to|change.*schedule/i.test(lower)) {
        const timeMatch = text.match(/(?:to|for|at)\s+((?:every\s+)?(?:[a-zA-Z]+\s+)?(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?:\s*ist)?)/i);
        let newTime = 'Every Monday at 10:00 AM IST';
        if (timeMatch && timeMatch[1]) {
          const t = timeMatch[1].trim();
          newTime = t.toUpperCase().includes('IST') ? t : `${t} IST`;
        }
        const kw = this.extractWorkflowKeyword(lower);
        return {
          primaryIntent: 'WORKFLOW_RESCHEDULE',
          operationType: 'WORKFLOW',
          businessDomain: 'WORKFLOW',
          targetAgent: options.selectedAgentOverride === 'Scheduler' ? 'Scheduler' : 'Workflow',
          requiredTools: ['workflow_reschedule'],
          entities: { keyword: kw, newTime },
          parameters: { keyword: kw, newTime },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 4.2 Pause workflow: "Pause the workflow that sends payment reminders"
      if (/pause|halt|stop\s+workflow|freeze\s+workflow/i.test(lower)) {
        const kw = lower.includes('payment') ? 'payment reminders' : this.extractWorkflowKeyword(lower);
        return {
          primaryIntent: 'WORKFLOW_PAUSE',
          operationType: 'WORKFLOW',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_pause'],
          entities: { keyword: kw },
          parameters: { keyword: kw },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      // 4.3 Activate/Resume workflow: "Activate the workflow...", "Resume workflow..."
      if (/activate|resume|unpause|enable\s+workflow/i.test(lower)) {
        const kw = this.extractWorkflowKeyword(lower);
        return {
          primaryIntent: 'WORKFLOW_ACTIVATE',
          operationType: 'WORKFLOW',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_activate'],
          entities: { keyword: kw },
          parameters: { keyword: kw },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      // 4.4 Failed workflows: "Which workflows failed during their last execution?"
      if (!/create|build|make|generate/i.test(lower) && /failed|errors?|crashed|failures?/i.test(lower) && /workflow|execution|run/i.test(lower)) {
        return {
          primaryIntent: 'WORKFLOW_GET_FAILED',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_get_history'],
          entities: {},
          parameters: {},
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 4.5 Execution history: "Show me the execution history of my latest workflow", "execution history", "run logs"
      if (/execution\s+history|run\s+history|logs|last\s+execution/i.test(lower)) {
        return {
          primaryIntent: 'WORKFLOW_GET_HISTORY',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_get_history'],
          entities: {},
          parameters: { limit: 10 },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 4.6 Scheduled workflows / meetings query: "What meetings have I scheduled?", "Show my workflows scheduled for tomorrow."
      if (
        /what\s+meetings|show.*scheduled|my\s+scheduled|workflows?\s+scheduled|upcoming\s+meetings|calendar\s+meetings/i.test(lower) ||
        (options.selectedAgentOverride === 'Scheduler' && /show|list|get|upcoming|what|status/i.test(lower))
      ) {
        return {
          primaryIntent: 'WORKFLOW_GET_SCHEDULED',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'WORKFLOW',
          targetAgent: options.selectedAgentOverride === 'Scheduler' ? 'Scheduler' : 'Workflow',
          requiredTools: ['workflow_get_scheduled'],
          entities: { dateFilter: lower.includes('tomorrow') ? 'tomorrow' : undefined },
          parameters: { dateFilter: lower.includes('tomorrow') ? 'tomorrow' : undefined },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      // 4.7 Explain DAG structure: "Explain the DAG structure of my Lead Qualification workflow."
      if (/explain.*dag|dag\s+structure|topology\s+of|describe.*dag|how\s+is.*structured/i.test(lower)) {
        const idMatch = text.match(/\b(WF-[A-Za-z0-9_-]+)\b/i);
        const nameMatch = idMatch ? idMatch[1] : (lower.includes('lead') ? 'Lead Qualification' : this.extractWorkflowKeyword(lower));
        return {
          primaryIntent: 'WORKFLOW_EXPLAIN_DAG',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_get_details'],
          entities: { name: nameMatch, workflowId: idMatch ? idMatch[1] : undefined },
          parameters: { name: nameMatch, workflowId: idMatch ? idMatch[1] : undefined },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      // 4.8 List Workflows (All or Active): "Show me all workflows I have created", "Which workflows are currently active?"
      if (
        (/all\s+workflows?|show\s+(?:me\s+)?all\s+workflows?|list.*workflows?|my\s+workflows?|which\s+workflows|what\s+workflows|currently\s+active|active\s+workflows?/i.test(lower)) &&
        !/weekly finance review|named|called/i.test(lower)
      ) {
        const isActiveOnly = /currently\s+active|active\s+workflows?/i.test(lower);
        return {
          primaryIntent: 'WORKFLOW_LIST',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_list'],
          entities: isActiveOnly ? { status: 'ACTIVE' } : {},
          parameters: isActiveOnly ? { status: 'ACTIVE' } : {},
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      // 4.9 Create workflow (including scheduled workflows e.g. "Create a workflow that schedules a meeting every Monday at 9 AM")
      if (/(?:create|build|generate|make|set\s*up)\s+(?:a\s+)?(?:new\s+)?workflow|new\s+workflow\b/i.test(lower)) {
        const nameMatch = text.match(/(?:named|called|title(?:d)?)\s+([A-Za-z0-9\s_-]+?)(?:\.|\,|$|\b(?:every|when|if|to|with)\b)/i);
        const extractedTitle = nameMatch ? nameMatch[1].trim() : null;
        const defaultTitle = /monday|schedule/i.test(lower)
          ? (lower.includes('finance') || lower.includes('overdue') ? 'Weekly Finance Review' : 'Weekly Monday Meeting Schedule Workflow')
          : (lower.includes('overdue') ? 'Automated Invoice Overdue Recovery Workflow' : 'Custom Automated Business Workflow');
        const computedTitle = extractedTitle || defaultTitle;

        return {
          primaryIntent: 'WORKFLOW_CREATE',
          operationType: 'WORKFLOW',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_create'],
          entities: {
            title: computedTitle,
            prompt: text,
          },
          parameters: {
            title: computedTitle,
            prompt: text,
          },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 4.11 Default workflow find
      return {
        primaryIntent: 'WORKFLOW_FIND',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'WORKFLOW',
        targetAgent: 'Workflow',
        requiredTools: ['workflow_find'],
        entities: { keyword: this.extractWorkflowKeyword(lower) },
        parameters: { keyword: this.extractWorkflowKeyword(lower) },
        confidence: 0.94,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'RECORD',
      };
    }

    // 5. Document Export & Generation Domain (Priority over knowledge search when generation/export verbs are used)
    if (
      !/invoice|bill\b/i.test(lower) &&
      (/(?:generate|export|create|compile|draft|build|make)\s+(?:a\s+)?(?:[\w\s-]+\s+)?(?:pdf|word|excel|csv|document|doc|sheet)\b|document\s+(?:export|generation)/i.test(lower) ||
      options.selectedAgentOverride === 'Document')
    ) {
      return {
        primaryIntent: 'DOCUMENT_GENERATE_REPORT',
        operationType: 'ACTION_MUTATION',
        businessDomain: 'GENERAL',
        targetAgent: 'Document',
        requiredTools: ['finance_get_invoices', 'crm_get_leads'],
        entities: {},
        parameters: { query: text },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'RECORD',
      };
    }

    // 5.1 RAG & Knowledge Hub Policy Queries
    if (
      /(?:company\s+)?policy|handbook|sop|leave\s+governance|guidelines?|(?:what\s+is|what're|how\s+to|explain)\s+(?:our\s+)?(?:policy|guidelines|handbook)/i.test(lower) ||
      options.selectedAgentOverride === 'Knowledge'
    ) {
      return {
        primaryIntent: 'KNOWLEDGE_QUERY_POLICY',
        operationType: 'KNOWLEDGE_RAG',
        businessDomain: 'KNOWLEDGE',
        targetAgent: 'Knowledge',
        requiredTools: ['knowledge_query'],
        entities: { query: text },
        parameters: { query: text },
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // 6. Meeting Scheduling & Communication
    if (/schedule\s+(?:a\s+)?meeting|book\s+(?:a\s+)?meeting|calendar\s+invite|demo\s+meeting/i.test(lower)) {
      const timeParsed = this.extractDateTime(text);
      const attendees = lower.includes('sales') ? 'Sales Team' : 'Executive Team';
      return {
        primaryIntent: 'SCHEDULE_MEETING',
        operationType: 'COMMUNICATION',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Scheduler',
        requiredTools: ['email_generate_invite'],
        entities: {
          meetingTime: timeParsed || 'Tomorrow at 3:00 PM IST',
          attendees,
        },
        parameters: {
          time: timeParsed || 'Tomorrow at 3:00 PM IST',
          attendees,
          title: `Sync with ${attendees}`,
        },
        confidence: 0.96,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'CONFIRMATION_CARD',
      };
    }

    // 7. Finance & Invoicing Domain
    // Distinction: Data Retrieval ("Show pending", "Who hasn't paid") vs Action ("Create invoice") vs Informational
    if (hasInvoiceTerm || /receivables|billing|tax|gst\b/i.test(lower) || options.selectedAgentOverride === 'Finance') {
      // 7.1 Data Retrieval: Overdue Payments ("Who hasn't paid yet", "overdue invoices", "outstanding amount", recovery follow-ups)
      if (
        /overdue|unpaid|hasn't\s+paid|haven't\s+paid|pending\s+from\s+customers?|outstanding|recovered|remaining|collection|debt/i.test(lower) ||
        /(?:अतिदेय|बकाया|लंबित|चालान|గడువు|బకాయి|పెండింగ్|ఇన్వాయిస్|காலாவதியான|நிலுவை|விலைப்பட்டியல்|ಅವಧಿ|ಬಾಕಿ|ಇನ್‌ವಾಯ್ಸ್|കാലഹരണപ്പെട്ട|കുടിശ്ശിക|ഇൻവോയ്സ്)/i.test(text) ||
        /\b(?:entha|unnayi|kitne|hai|hain|evvalavu|irukku|eshtu|ide|ethra|undu)\b/i.test(lower) ||
        (options.selectedAgentOverride === 'Finance' && /highest|duration|terms|escalation|notice|recommendation|total/i.test(lower))
      ) {
        return {
          primaryIntent: 'FINANCE_GET_OVERDUE_INVOICES',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: { status: 'OVERDUE' },
          parameters: { status: 'OVERDUE' },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 7.2 Analytical Tax & GST Breakdown
      if (/(?:calculate|breakdown|total)\s+(?:the\s+)?(?:tax|gst|revenue)\b/i.test(lower)) {
        return {
          primaryIntent: 'FINANCE_ANALYZE_TAX',
          operationType: 'ANALYTICAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: {},
          parameters: {},
          confidence: 0.92,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'SUMMARY',
        };
      }

      // 7.2 Download or Export Existing Invoice PDF (explicit retrieval)
      if (
        /(?:download|export|print|get)\s+(?:the\s+)?(?:invoice|pdf)|(?:invoice\s+pdf|pdf\s+invoice)|(?:pdf\s+(?:copy|version)\s+of\s+(?:the\s+)?invoice)/i.test(
          lower
        ) &&
        !/(?:create|generate|draft|issue|make|bill)\s+(?:a\s+)?(?:new\s+)?(?:pdf\s+(?:for|of)\s+(?:the\s+)?)?invoice/i.test(lower) &&
        !/\b(?:of|for)\s+[\d,]{3,}\b/i.test(lower)
      ) {
        const client = this.extractCompanyName(text);
        const invMatch = text.match(/INV-[\w-]+/i);
        const targetAgent: AgentType = options.selectedAgentOverride === 'Sales' || lower.includes('sales') ? 'Sales' : 'Finance';
        return {
          primaryIntent: 'FINANCE_DOWNLOAD_INVOICE_PDF',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'FINANCE',
          targetAgent,
          requiredTools: ['finance_get_invoices'],
          entities: { client, invoiceNumber: invMatch ? invMatch[0].toUpperCase() : undefined },
          parameters: { client, invoiceNumber: invMatch ? invMatch[0].toUpperCase() : undefined },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      // 7.2b Initiate Invoice from CRM Won Deal ("Generate an invoice for my latest won deal", "invoice won deal")
      if (
        /(?:generate|create|draft|issue|make)\s+(?:an?\s+)?invoices?\s+(?:for|from)\s+(?:my\s+|the\s+)?(?:latest\s+|recent\s+)?won\s+deals?|invoice\s+(?:the\s+)?(?:latest\s+|recent\s+)?won\s+deal/i.test(
          lower
        )
      ) {
        const targetAgent: AgentType = options.selectedAgentOverride === 'Finance' ? 'Finance' : 'Sales';
        return {
          primaryIntent: 'SALES_GENERATE_INVOICE_FROM_WON_DEAL',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'FINANCE',
          targetAgent,
          requiredTools: ['crm_get_leads', 'finance_create_invoice'],
          entities: { dealType: 'WON' },
          parameters: { dealType: 'WON' },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 7.3 Action Mutation (Create / Draft / Generate Invoice or Invoice PDF)
      if (
        /(?:create|generate|draft|issue|make|bill)\s+(?:a\s+)?(?:new\s+)?(?:pdf\s+(?:for|of)\s+(?:the\s+)?)?(?:client\s+)?invoices?\b|invoices?\s+(?:for|of)\s+[\d,]+|invoices?\s+for\s+[A-Za-z]|(?:generate|create|make|issue|draft)\s+(?:a\s+)?pdf\s+(?:for|of)\s+(?:the\s+)?invoices?\b/i.test(
          lower
        )
      ) {
        const client = this.extractCompanyName(text);
        const amount = this.extractAmount(text);
        const targetAgent: AgentType = options.selectedAgentOverride === 'Sales' || lower.includes('sales') ? 'Sales' : 'Finance';
        const isMissingDetails = !client || !amount;

        return {
          primaryIntent: 'FINANCE_CREATE_INVOICE',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'FINANCE',
          targetAgent,
          requiredTools: isMissingDetails ? [] : ['finance_create_invoice'],
          entities: { client: client || undefined, amount: amount || undefined },
          parameters: {
            client: client || undefined,
            amount: amount || undefined,
            taxRate: '18% GST',
            missingDetails: isMissingDetails,
            query: text,
          },
          confidence: 0.96,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 7.3 Data Retrieval: Overdue Payments ("Who hasn't paid yet", "overdue invoices")
      if (/overdue|unpaid|hasn't\s+paid|haven't\s+paid|pending\s+from\s+customers?/i.test(lower)) {
        return {
          primaryIntent: 'FINANCE_GET_OVERDUE_INVOICES',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: { status: 'OVERDUE' },
          parameters: { status: 'OVERDUE' },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 7.4 Data Retrieval: All Pending / Outstanding Invoices
      if (/pending|outstanding|all\s+(?:my\s+)?invoices|show\s+invoices|list\s+invoices/i.test(lower)) {
        return {
          primaryIntent: 'FINANCE_GET_PENDING_INVOICES',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: {},
          parameters: { filter: 'PENDING_OR_OVERDUE' },
          confidence: 0.96,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }
    }

    // 8. CRM & Sales Domain
    if (/lead|prospect|crm|pipeline|deals?/i.test(lower) || options.selectedAgentOverride === 'Sales') {
      // 8.0 Analytical Pipeline: "Explain our current sales pipeline and identify the strongest opportunities"
      if (/(?:sales\s+)?pipeline|strongest\s+opportunities|deal\s+opportunities|top\s+opportunities/i.test(lower)) {
        return {
          primaryIntent: 'CRM_ANALYZE_PIPELINE',
          operationType: 'ANALYTICAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: {},
          confidence: 0.96,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'SUMMARY',
        };
      }

      // 8.1 Informational: "Explain how our CRM works"
      if (/explain|how\s+does\s+(?:our\s+)?crm\s+work|what\s+is\s+crm/i.test(lower)) {
        return {
          primaryIntent: 'CRM_EXPLAIN_PROCESS',
          operationType: 'INFORMATIONAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: [],
          entities: {},
          parameters: {},
          confidence: 0.96,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TEXT',
        };
      }

      // 8.2 Analytical: "Which sales representative converted the most leads?"
      if (/which\s+sales\s+(?:rep|representative|person|agent).*converted|most\s+leads|top\s+converting/i.test(lower)) {
        return {
          primaryIntent: 'CRM_ANALYZE_TOP_REPRESENTATIVE',
          operationType: 'ANALYTICAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: { metric: 'CONVERSIONS' },
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'SUMMARY',
        };
      }

      // 8.3 Action: "Create a new lead for ABC Technologies"
      if (/create\s+(?:a\s+)?(?:new\s+)?lead|add\s+(?:a\s+)?(?:new\s+)?lead|new\s+prospect/i.test(lower)) {
        const company = this.extractCompanyName(text);
        const amount = this.extractAmount(text);
        return {
          primaryIntent: 'CRM_CREATE_LEAD',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_create_lead'],
          entities: { company, amount },
          parameters: {
            company: company || 'ABC Technologies',
            name: `${company || 'ABC Technologies'} Representative`,
            email: `contact@${(company || 'abctech').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            value: amount !== null ? amount : 50000,
            stage: 'NEW',
          },
          confidence: 0.97,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 8.4 Data Retrieval: Stale Leads without Follow-ups
      if (/not\s+received\s+follow-?ups?|no\s+follow-?up|stale\s+leads|untouched/i.test(lower)) {
        return {
          primaryIntent: 'CRM_GET_STALE_LEADS',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: { filter: 'NO_FOLLOW_UP' },
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 8.5 Data Retrieval: Deals almost closed / Late stage
      if (/almost\s+closed|late\s+stage|proposal|negotiation/i.test(lower)) {
        return {
          primaryIntent: 'CRM_GET_LATE_STAGE_DEALS',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: { stage: 'PROPOSAL' },
          confidence: 0.94,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 8.6 Data Retrieval: General Leads ("Show my sales leads")
      if (/show|list|get|all\s+leads|my\s+leads/i.test(lower)) {
        return {
          primaryIntent: 'CRM_GET_LEADS',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: {},
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }
    }

    // 9. HR & Leave Domain
    if (/leave|employee|staff|payroll|vacation|salary/i.test(lower)) {
      // 9.1 Data Retrieval: Employees on leave
      if (/on\s+leave|taking\s+leave|vacation\s+currently|leave\s+requests/i.test(lower)) {
        return {
          primaryIntent: 'HR_GET_EMPLOYEES_ON_LEAVE',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'HR',
          targetAgent: 'HR',
          requiredTools: ['hr_get_leaves', 'hr_get_employees'],
          entities: {},
          parameters: { filter: 'ACTIVE_OR_PENDING_LEAVE' },
          confidence: 0.97,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 9.2 Data Retrieval: General Employees
      if (/show\s+employees|list\s+employees|directory/i.test(lower)) {
        return {
          primaryIntent: 'HR_GET_EMPLOYEES',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'HR',
          targetAgent: 'HR',
          requiredTools: ['hr_get_employees'],
          entities: {},
          parameters: {},
          confidence: 0.93,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }
    }

    // 10. Inventory Domain (Handled by Database Agent)
    if (/inventory|product|stock|warehouse|reorder|threshold/i.test(lower)) {
      if (/below\s+(?:their\s+)?(?:stock\s+)?threshold|low\s+stock|out\s+of\s+stock/i.test(lower)) {
        return {
          primaryIntent: 'INVENTORY_GET_LOW_STOCK',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'INVENTORY',
          targetAgent: 'Database',
          requiredTools: ['inventory_get_products'],
          entities: {},
          parameters: { filter: 'LOW_STOCK' },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      return {
        primaryIntent: 'INVENTORY_GET_PRODUCTS',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'INVENTORY',
        targetAgent: 'Database',
        requiredTools: ['inventory_get_products'],
        entities: {},
        parameters: {},
        confidence: 0.93,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
      };
    }

    // 11. Support Domain
    if (/support|ticket|issue|bug|complaint/i.test(lower)) {
      if (/unresolved|high-?priority|open\s+tickets|urgent/i.test(lower)) {
        return {
          primaryIntent: 'SUPPORT_GET_HIGH_PRIORITY_TICKETS',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'SUPPORT',
          targetAgent: 'Support',
          requiredTools: ['support_get_tickets'],
          entities: { priority: 'HIGH' },
          parameters: { priority: 'HIGH', statusFilter: 'UNRESOLVED' },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      return {
        primaryIntent: 'SUPPORT_GET_TICKETS',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'SUPPORT',
        targetAgent: 'Support',
        requiredTools: ['support_get_tickets'],
        entities: {},
        parameters: {},
        confidence: 0.94,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
      };
    }

    // 12. Analytics Domain
    if (/analyze|analytics|performance|kpi|metrics|conversion\s+rate|mrr|arr/i.test(lower) || options.selectedAgentOverride === 'Analytics') {
      return {
        primaryIntent: 'ANALYTICS_OVERVIEW',
        operationType: 'ANALYTICAL',
        businessDomain: 'ANALYTICS',
        targetAgent: 'Analytics',
        requiredTools: ['crm_get_leads', 'finance_get_invoices'],
        entities: {},
        parameters: {},
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // 13. Marketing Domain
    if (/marketing|campaign|promotion|promotional|launch\s+announcement|ad\s+copy|outreach/i.test(lower)) {
      return {
        primaryIntent: 'MARKETING_DRAFT_CAMPAIGN',
        operationType: 'ACTION_MUTATION',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Marketing',
        requiredTools: ['crm_get_leads'],
        entities: {},
        parameters: { topic: text },
        confidence: 0.95,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // 14. Email Dispatch Domain
    if (/email\s+(?:notification|notice|reminder|dispatch|blast)|send\s+(?:an?\s+)?email|draft\s+(?:an?\s+)?email\b/i.test(lower) || options.selectedAgentOverride === 'Email') {
      return {
        primaryIntent: 'EMAIL_PREPARE_DISPATCH',
        operationType: 'COMMUNICATION',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Email',
        requiredTools: ['email_generate_invite'],
        entities: {},
        parameters: { message: text },
        confidence: 0.96,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'CONFIRMATION_CARD',
      };
    }



    // 16. Executive Reporting Domain
    if (/executive\s+report|compliance\s+report|audit\s+report|monthly\s+report|quarterly\s+report|operations\s+report/i.test(lower)) {
      return {
        primaryIntent: 'REPORTING_GENERATE_AUDIT',
        operationType: 'ANALYTICAL',
        businessDomain: 'GENERAL',
        targetAgent: 'Reporting',
        requiredTools: ['finance_get_invoices', 'crm_get_leads', 'hr_get_employees'],
        entities: {},
        parameters: {},
        confidence: 0.96,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'RECORD',
      };
    }

    // 17. Security & Governance Domain
    if (/security\s+status|audit\s+logs?|rbac|encryption\s+status|prompt\s+injection\s+shield|threat\s+report/i.test(lower) || options.selectedAgentOverride === 'Security') {
      return {
        primaryIntent: 'SECURITY_AUDIT_STATUS',
        operationType: 'INFORMATIONAL',
        businessDomain: 'SECURITY',
        targetAgent: 'Security',
        requiredTools: [],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // 18. General Conversational / Executive Inquiries
    return {
      primaryIntent: 'GENERAL_EXECUTIVE_QUERY',
      operationType: 'INFORMATIONAL',
      businessDomain: 'GENERAL',
      targetAgent: options.selectedAgentOverride || 'CEO',
      requiredTools: [],
      entities: {},
      parameters: { query: text },
      confidence: 0.85,
      confidenceLevel: 'HIGH',
      expectedResponseFormat: 'TEXT',
    };
  }

  // --- Entity Extraction Helpers ---

  private extractCompanyName(text: string): string | null {
    // 1. Explicit client/customer/company phrasing
    const explicit = text.match(
      /(?:for\s+client|client|for\s+company|customer|account)\s+([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,4})/i
    );
    if (explicit && explicit[1]) {
      const clean = explicit[1].replace(/\b(?:of|with|amount|and|for)\b.*$/i, '').trim();
      if (clean.length > 1 && !/^(?:the\s+)?(?:invoice|invoices|pdf|bill)$/i.test(clean)) return clean;
    }

    // 2. Scan all 'for [Company]' or 'to [Company]' occurrences from end to start
    const allForMatches = [...text.matchAll(/(?:for|to)\s+([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,3})/gi)];
    for (let i = allForMatches.length - 1; i >= 0; i--) {
      const candidate = allForMatches[i][1].replace(/\b(?:of|with|amount|and|for)\b.*$/i, '').trim();
      if (candidate.length > 1 && !/^(?:the\s+)?(?:invoice|invoices|pdf|bill|new\s+invoice)$/i.test(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private extractAmount(text: string): number | null {
    // 1. Check currency prefixed: ₹50,000, $50,000, Rs 50000, INR 50000
    const currMatch = text.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?)/i);
    if (currMatch) return parseFloat(currMatch[1].replace(/,/g, ''));

    // 2. Explicit deal value / invoice value phrasing: "deal value of 450000", "deal value: 450000", "value of 450000"
    const dealMatch = text.match(
      /(?:deal\s+value|value|amount|sum|worth|price)(?:\s*(?:of|is|:|=)\s*|\s+)(?:the\s+)?(?:sum\s+of\s+)?(?:₹|rs\.?|inr|\$)?\s*([\d,]+(?:\.\d+)?)/i
    );
    if (dealMatch) {
      const cleanNum = dealMatch[1].replace(/,/g, '');
      const val = parseFloat(cleanNum);
      if (!isNaN(val) && val > 0) return val;
    }

    // 3. Check contextual numbers following 'of', 'for', 'amount', 'worth'
    const contextMatch = text.match(
      /(?:of|for|amount|worth|value|total|sum)\s+(?:the\s+)?(?:sum\s+of\s+)?([\d,]{2,}(?:\.\d+)?)/i
    );
    if (contextMatch) {
      const cleanNum = contextMatch[1].replace(/,/g, '');
      const val = parseFloat(cleanNum);
      if (!isNaN(val) && val > 0) return val;
    }

    // 4. Check word multipliers: 50k, 2 lakh, 1 cr, 50 thousand
    const wordMatch = text.match(/(\d+)\s*(?:thousand|k|lakh|cr)/i);
    if (wordMatch) {
      let val = parseFloat(wordMatch[1]);
      if (text.toLowerCase().includes('lakh')) val *= 100000;
      if (text.toLowerCase().includes('thousand') || text.toLowerCase().includes('k')) val *= 1000;
      return val;
    }

    // 5. Check standalone number with comma or 4+ digits: 50,000 or 50000
    const plainMatch = text.match(/\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?)\b/);
    if (plainMatch) {
      const cleanNum = plainMatch[1].replace(/,/g, '');
      const val = parseFloat(cleanNum);
      if (!isNaN(val) && val > 0) return val;
    }

    return null;
  }

  private extractDateTime(text: string): string | null {
    const timeMatch = text.match(/(tomorrow|today|next\s+\w+)?\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeMatch) {
      const rawDay = timeMatch[1] || 'Tomorrow';
      const day = rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase();
      let rawTime = (timeMatch[2] || '3:00 PM').trim();
      if (/^\d{1,2}\s*(?:am|pm)$/i.test(rawTime)) {
        const num = rawTime.replace(/[^0-9]/g, '');
        const ampm = rawTime.replace(/[^a-zA-Z]/g, '').toUpperCase();
        rawTime = `${num}:00 ${ampm}`;
      }
      return `${day} at ${rawTime.toUpperCase()} IST`;
    }
    return null;
  }

  private extractWorkflowKeyword(text: string): string {
    const idMatch = text.match(/\b(WF-[A-Za-z0-9_-]+)\b/i);
    if (idMatch) {
      return idMatch[1];
    }
    const specificMatch = text.match(/(?:show|find|get|describe|explain|details\s+for|about)\s+(?:the\s+)?([A-Za-z0-9\s_-]+?)(?:\s+workflow|\s+dag|$)/i);
    if (specificMatch && specificMatch[1] && !/all|my|active|list/i.test(specificMatch[1].trim())) {
      return specificMatch[1].trim();
    }
    if (text.includes('weekly finance') || text.includes('finance review')) {
      return 'Weekly Finance Review';
    }
    if (text.includes('payment') || text.includes('reminder')) {
      return 'payment reminders';
    }
    if (text.includes('contact') || text.includes('lead')) {
      return 'contact form';
    }
    return 'workflow';
  }
}

export const intentEngine = new IntentEngine();
