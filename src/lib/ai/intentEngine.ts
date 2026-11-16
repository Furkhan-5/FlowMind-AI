import { AgentType, LanguageCode, ChatMessage } from '@/types';
import { InterpretedIntent, OperationType, BusinessDomain } from './agentContracts';

export class IntentEngine {
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
        entities: { fact: factClean },
        parameters: { content: factClean },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'CONFIRMATION_CARD',
      };
    }

    // 3. Multi-Domain Cross-Department Queries
    const hasInvoiceTerm = /invoice|payment|money\s+pending|unpaid|overdue|paid\b|hasn't\s+paid|haven't\s+paid|receivables|billing/i.test(lower);
    const hasTicketTerm = /support\s*ticket|open\s*ticket|ticket|customer\s*issue/i.test(lower);

    if (
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

    // 4. Workflow Queries
    if (/workflow|automation|dag\s+pipeline|dag/i.test(lower)) {
      if (/find|search|get|retrieve|show|where is|earlier\s+workflow/i.test(lower)) {
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
      if (/create|build|generate|make|set up|new workflow/i.test(lower)) {
        return {
          primaryIntent: 'WORKFLOW_CREATE',
          operationType: 'WORKFLOW',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_create'],
          entities: { topic: lower.includes('overdue') ? 'OVERDUE_NOTIFICATIONS' : 'GENERAL_AUTOMATION' },
          parameters: {
            title: lower.includes('overdue') ? 'Automated Invoice Overdue Recovery Workflow' : 'Custom Automated Business Workflow',
            trigger: lower.includes('overdue') ? 'INVOICE_OVERDUE' : 'MANUAL_TRIGGER',
          },
          confidence: 0.96,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }
    }

    // 5. RAG & Knowledge Hub Queries
    if (
      /summarize|summary|policy|document|handbook|sop|uploaded\s+(?:company\s+)?policy|leave\s+governance|guidelines?/i.test(lower) &&
      !/create|send|approve/i.test(lower)
    ) {
      return {
        primaryIntent: 'KNOWLEDGE_QUERY_POLICY',
        operationType: 'KNOWLEDGE_RAG',
        businessDomain: 'KNOWLEDGE',
        targetAgent: 'Knowledge',
        requiredTools: ['knowledge_query'],
        entities: { query: text },
        parameters: { query: text },
        confidence: 0.93,
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
    if (hasInvoiceTerm || /receivables|billing|tax|gst\b/i.test(lower)) {
      // 7.1 Analytical
      if (/calculate|breakdown|total\s+(?:tax|gst|revenue)/i.test(lower)) {
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

      // 7.3 Action Mutation (Create / Draft / Generate Invoice or Invoice PDF)
      if (
        /(?:create|generate|draft|issue|make|bill)\s+(?:a\s+)?(?:new\s+)?(?:pdf\s+(?:for|of)\s+(?:the\s+)?)?(?:client\s+)?invoice|invoice\s+(?:for|of)\s+[\d,]+|invoice\s+for\s+[A-Za-z]|(?:generate|create|make|issue|draft)\s+(?:a\s+)?pdf\s+(?:for|of)\s+(?:the\s+)?invoice/i.test(
          lower
        )
      ) {
        const client = this.extractCompanyName(text);
        const amount = this.extractAmount(text);
        const targetAgent: AgentType = options.selectedAgentOverride === 'Sales' || lower.includes('sales') ? 'Sales' : 'Finance';
        return {
          primaryIntent: 'FINANCE_CREATE_INVOICE',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'FINANCE',
          targetAgent,
          requiredTools: ['finance_create_invoice'],
          entities: { client, amount },
          parameters: { client, amount, taxRate: '18% GST' },
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
    if (/lead|prospect|crm|pipeline|deals?/i.test(lower)) {
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
        return {
          primaryIntent: 'CRM_CREATE_LEAD',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_create_lead'],
          entities: { company },
          parameters: {
            company: company || 'ABC Technologies',
            name: `${company || 'ABC Technologies'} Representative`,
            email: `contact@${(company || 'abctech').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            value: 200000,
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
    if (/analyze|analytics|performance|kpi|metrics|conversion\s+rate|mrr|arr/i.test(lower)) {
      return {
        primaryIntent: 'ANALYTICS_OVERVIEW',
        operationType: 'ANALYTICAL',
        businessDomain: 'ANALYTICS',
        targetAgent: 'Analytics',
        requiredTools: ['crm_get_leads', 'finance_get_invoices'],
        entities: {},
        parameters: {},
        confidence: 0.91,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // 13. General Conversational / Executive Inquiries
    return {
      primaryIntent: 'GENERAL_EXECUTIVE_QUERY',
      operationType: 'INFORMATIONAL',
      businessDomain: 'GENERAL',
      targetAgent: 'CEO',
      requiredTools: [],
      entities: {},
      parameters: { query: text },
      confidence: 0.75,
      confidenceLevel: 'MEDIUM',
      expectedResponseFormat: 'TEXT',
    };
  }

  // --- Entity Extraction Helpers ---

  private extractCompanyName(text: string): string {
    // 1. Explicit client/customer/company phrasing
    const explicit = text.match(
      /(?:for\s+client|client|for\s+company|customer|account)\s+([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,4})/i
    );
    if (explicit && explicit[1]) {
      const clean = explicit[1].replace(/\b(?:of|with|amount|and|for)\b.*$/i, '').trim();
      if (clean.length > 1 && !/^(?:the\s+)?(?:invoice|pdf|bill)$/i.test(clean)) return clean;
    }

    // 2. Scan all 'for [Company]' or 'to [Company]' occurrences from end to start
    const allForMatches = [...text.matchAll(/(?:for|to)\s+([A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+){0,3})/gi)];
    for (let i = allForMatches.length - 1; i >= 0; i--) {
      const candidate = allForMatches[i][1].replace(/\b(?:of|with|amount|and|for)\b.*$/i, '').trim();
      if (candidate.length > 1 && !/^(?:the\s+)?(?:invoice|pdf|bill|new\s+invoice)$/i.test(candidate)) {
        return candidate;
      }
    }

    return 'Acme Corp';
  }

  private extractAmount(text: string): number {
    // 1. Check currency prefixed: ₹50,000, $50,000, Rs 50000, INR 50000
    const currMatch = text.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?)/i);
    if (currMatch) return parseFloat(currMatch[1].replace(/,/g, ''));

    // 2. Check contextual numbers following 'of', 'for', 'amount', 'worth'
    const contextMatch = text.match(
      /(?:of|for|amount|worth|value|total|sum)\s+(?:the\s+)?(?:sum\s+of\s+)?([\d,]{2,}(?:\.\d+)?)/i
    );
    if (contextMatch) {
      const cleanNum = contextMatch[1].replace(/,/g, '');
      const val = parseFloat(cleanNum);
      if (!isNaN(val) && val > 0) return val;
    }

    // 3. Check standalone number with comma or 4+ digits: 50,000 or 50000
    const plainMatch = text.match(/\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?)\b/);
    if (plainMatch) {
      const cleanNum = plainMatch[1].replace(/,/g, '');
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

    return 50000;
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
    if (text.includes('payment') || text.includes('reminder') || text.includes('invoice')) {
      return 'payment reminders';
    }
    if (text.includes('contact') || text.includes('lead')) {
      return 'contact form';
    }
    return 'workflow';
  }
}

export const intentEngine = new IntentEngine();
