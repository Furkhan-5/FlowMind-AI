import { intentEngine } from '@/lib/ai/intentEngine';
import { toolRegistry } from '@/lib/ai/toolRegistry';
import { responseQualityValidator } from '@/lib/ai/responseQualityValidator';
import { agentDiagnosticTracer } from '@/lib/ai/agentDiagnosticTracer';
import {
  validateAgentTaskEnvelope,
  validateAgentResponseEnvelope,
  AgentTaskEnvelope,
  AgentResponseEnvelope,
} from '@/lib/ai/agentContracts';

describe('Universal AI Agent Intelligence & Intent Accuracy Suite', () => {
  const testUser = {
    id: 'user-audit-01',
    name: 'Audit Administrator',
    email: 'audit@flowmind.ai',
    role: 'ADMIN' as const,
    avatar: '',
    preferredLanguage: 'en' as const,
    organizationId: 'ORG-01',
  };

  // =========================================================================
  // 1. Intent Understanding & Natural Language Synonyms
  // =========================================================================
  describe('1. Natural Language Intent Understanding & Synonyms', () => {
    test('understands "Any money pending from customers?" as pending/overdue invoices', () => {
      const intent = intentEngine.analyzeIntent('Any money pending from customers?');
      expect(intent.primaryIntent).toBe('FINANCE_GET_OVERDUE_INVOICES');
      expect(intent.operationType).toBe('DATA_RETRIEVAL');
      expect(intent.targetAgent).toBe('Finance');
      expect(intent.requiredTools).toContain('finance_get_invoices');
    });

    test('understands "Who hasn\'t paid yet?" as overdue customer invoices', () => {
      const intent = intentEngine.analyzeIntent("Who hasn't paid yet?");
      expect(intent.primaryIntent).toBe('FINANCE_GET_OVERDUE_INVOICES');
      expect(intent.operationType).toBe('DATA_RETRIEVAL');
      expect(intent.targetAgent).toBe('Finance');
    });

    test('understands "Show me the deals that are almost closed" as late-stage CRM leads', () => {
      const intent = intentEngine.analyzeIntent('Show me the deals that are almost closed');
      expect(intent.primaryIntent).toBe('CRM_GET_LATE_STAGE_DEALS');
      expect(intent.operationType).toBe('DATA_RETRIEVAL');
      expect(intent.targetAgent).toBe('Sales');
      expect(intent.parameters.stage).toBe('PROPOSAL');
    });

    test('understands "Which sales representative converted the most leads?" as analytical request', () => {
      const intent = intentEngine.analyzeIntent('Which sales representative converted the most leads?');
      expect(intent.primaryIntent).toBe('CRM_ANALYZE_TOP_REPRESENTATIVE');
      expect(intent.operationType).toBe('ANALYTICAL');
      expect(intent.targetAgent).toBe('Sales');
      expect(intent.requiredTools).toContain('crm_get_leads');
    });

    test('distinguishes informational CRM explanation from lead creation or retrieval', () => {
      const intent = intentEngine.analyzeIntent('Explain how our CRM works');
      expect(intent.primaryIntent).toBe('CRM_EXPLAIN_PROCESS');
      expect(intent.operationType).toBe('INFORMATIONAL');
      expect(intent.targetAgent).toBe('Sales');
      expect(intent.requiredTools.length).toBe(0); // Informational requests do not invoke mutation tools
    });

    test('identifies multi-domain cross-department query (overdue invoices + support tickets)', () => {
      const intent = intentEngine.analyzeIntent(
        'Show me customers who have both overdue invoices and unresolved support tickets'
      );
      expect(intent.primaryIntent).toBe('CROSS_DOMAIN_OVERDUE_AND_SUPPORT');
      expect(intent.isMultiDomain).toBe(true);
      expect(intent.targetAgent).toBe('CEO');
      expect(intent.requiredTools).toContain('finance_get_invoices');
      expect(intent.requiredTools).toContain('support_get_tickets');
    });
  });

  // =========================================================================
  // 2. Strict Structured Agent Input & Output Contracts
  // =========================================================================
  describe('2. Strict Structured Agent Input & Output Contracts', () => {
    test('validates conformant AgentTaskEnvelope', () => {
      const task: AgentTaskEnvelope = {
        requestId: 'REQ-101',
        userId: testUser.id,
        organizationId: testUser.organizationId,
        userMessage: 'Show pending invoices',
        language: 'en',
        userRole: testUser.role,
        interpretedIntent: {
          primaryIntent: 'FINANCE_GET_PENDING_INVOICES',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: {},
          parameters: {},
          confidence: 0.96,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        },
        context: { recentMessages: [] },
        availableTools: ['finance_get_invoices'],
        permissions: ['READ_FINANCE'],
        requiredOutputFormat: 'TABLE',
      };

      const val = validateAgentTaskEnvelope(task);
      expect(val.valid).toBe(true);
      expect(val.errors.length).toBe(0);
    });

    test('rejects malformed AgentTaskEnvelope missing required fields', () => {
      const invalidTask = {
        requestId: 'REQ-102',
        // missing userId, organizationId, userMessage
      };

      const val = validateAgentTaskEnvelope(invalidTask);
      expect(val.valid).toBe(false);
      expect(val.errors.length).toBeGreaterThan(0);
    });

    test('validates conformant AgentResponseEnvelope', () => {
      const response: AgentResponseEnvelope = {
        agentId: 'Finance',
        requestId: 'REQ-103',
        interpretedIntent: 'FINANCE_GET_OVERDUE_INVOICES',
        executionStatus: 'COMPLETED',
        userFacingResponse: 'Retrieved 1 overdue invoice.',
        riskLevel: 'LOW',
        approvalRequired: false,
      };

      const val = validateAgentResponseEnvelope(response);
      expect(val.valid).toBe(true);
    });
  });

  // =========================================================================
  // 3. Response Quality Validation Layer
  // =========================================================================
  describe('3. Response Quality Validation Layer', () => {
    test('catches dishonest response claiming success when underlying tool execution failed', () => {
      const failedEnvelope: AgentResponseEnvelope = {
        agentId: 'Sales',
        requestId: 'REQ-FAIL-1',
        interpretedIntent: 'CRM_CREATE_LEAD',
        executionStatus: 'FAILED',
        userFacingResponse: 'Successfully created the lead for ABC Technologies in PostgreSQL.',
        toolExecutionDetails: [
          {
            toolName: 'crm_create_lead',
            inputParameters: { company: 'ABC Technologies' },
            executionStatus: 'FAILED',
            durationMs: 45,
            errorMessage: 'Database connection timeout',
          },
        ],
        riskLevel: 'LOW',
        approvalRequired: false,
      };

      const intent = intentEngine.analyzeIntent('Create a new lead for ABC Technologies');
      const evalRes = responseQualityValidator.validate(failedEnvelope, intent, 'Create a new lead for ABC Technologies');

      expect(evalRes.isValid).toBe(false);
      expect(evalRes.checks.toolExecutionHonest).toBe(false);
      expect(evalRes.defects[0]).toContain('falsely claimed successful operation');
      expect(evalRes.correctedResponse).toContain('Unable to complete CRM_CREATE_LEAD');
    });

    test('validates honest data-grounded response containing real table', () => {
      const successEnvelope: AgentResponseEnvelope = {
        agentId: 'Finance',
        requestId: 'REQ-OK-1',
        interpretedIntent: 'FINANCE_GET_OVERDUE_INVOICES',
        executionStatus: 'COMPLETED',
        userFacingResponse: '### 💳 Overdue Customer Invoices\n| Invoice # | Customer | Total |\n| INV-002 | TechCorp India | ₹2,36,000 |',
        actualResultData: [{ id: 'INV-002', customerName: 'TechCorp India' }],
        toolExecutionDetails: [
          {
            toolName: 'finance_get_invoices',
            inputParameters: { status: 'OVERDUE' },
            executionStatus: 'SUCCESS',
            durationMs: 12,
          },
        ],
        riskLevel: 'LOW',
        approvalRequired: false,
      };

      const intent = intentEngine.analyzeIntent('Which customers have overdue payments?');
      const evalRes = responseQualityValidator.validate(successEnvelope, intent, 'Which customers have overdue payments?');

      expect(evalRes.isValid).toBe(true);
      expect(evalRes.score).toBe(1.0);
    });
  });

  // =========================================================================
  // 4. Diagnostic Tracing & Observability
  // =========================================================================
  describe('4. Diagnostic Tracing & Observability', () => {
    test('records and retrieves sanitized diagnostic trace for ADMIN role', () => {
      agentDiagnosticTracer.clearTracesForTesting();

      agentDiagnosticTracer.recordTrace({
        requestId: 'TRACE-TEST-001',
        timestamp: new Date().toISOString(),
        userId: testUser.id,
        organizationId: testUser.organizationId,
        selectedAgent: 'Finance',
        interpretedIntent: 'FINANCE_GET_OVERDUE_INVOICES',
        operationType: 'DATA_RETRIEVAL',
        routingConfidence: 0.98,
        contextRetrievalStatus: 'DATABASE_HIT',
        selectedTools: ['finance_get_invoices'],
        toolExecutionStatus: 'ALL_SUCCESS',
        executionDurationMs: 15,
        validationStatus: 'PASSED',
        qualityScore: 1.0,
      });

      const traces = agentDiagnosticTracer.getTraces('ADMIN');
      expect(traces.length).toBe(1);
      expect(traces[0].requestId).toBe('TRACE-TEST-001');
      expect(traces[0].selectedAgent).toBe('Finance');
    });

    test('denies diagnostic trace access to EMPLOYEE role', () => {
      const traces = agentDiagnosticTracer.getTraces('EMPLOYEE');
      expect(traces.length).toBe(0);
    });
  });
});
