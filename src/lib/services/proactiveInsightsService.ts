import { prisma } from '@/lib/prisma';
import { businessService } from './businessService';
import { approvalService } from './approvalService';
import {
  ProactiveInsight,
  InsightSeverity,
  InsightStatus,
  GovernedActionProposal,
  User,
} from '@/types';
import { auditLogger } from '@/lib/security/auditLogger';

// Initial Active Store of Proactive Insights
let insightsStore: ProactiveInsight[] = [
  {
    id: 'INS-AUTO-001',
    organizationId: 'ORG-01',
    module: 'FINANCE',
    insightType: 'THRESHOLD_BREACH',
    title: 'High-Value Overdue Invoices Detected (₹2,36,000)',
    description:
      'Enterprise client Innovate Solutions has 1 overdue invoice (#INV-2026-102) past Net 15 terms. Total overdue balance represents 22% of active receivables.',
    severity: 'HIGH',
    conditionTrigger: 'Invoice due date expired past 15 days threshold with total balance > ₹50,000',
    supportingData: {
      invoiceNumber: 'INV-2026-102',
      customerName: 'Innovate Solutions',
      amount: 236000,
      daysOverdue: 18,
    },
    recommendedAction: {
      label: 'Dispatch Payment Reminder & Schedule Manager Call',
      actionType: 'SEND_PAYMENT_REMINDER',
      module: 'FINANCE',
      parameters: { invoiceNumber: 'INV-2026-102', recipient: 'billing@innovatesol.com' },
      workflowId: 'WF-TEMPLATE-01',
      riskLevel: 'MEDIUM',
      requiresApproval: true,
      targetEntityId: 'INV-2026-102',
    },
    status: 'NEW',
    dedupHash: 'FINANCE_OVERDUE_INV_2026_102',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INS-AUTO-002',
    organizationId: 'ORG-01',
    module: 'INVENTORY',
    insightType: 'ANOMALY',
    title: 'Safety Reorder Threshold Reached: AI Edge Server Gateway',
    description:
      'Inventory SKU #HW-SRV-01 has dropped to 3 units in stock, below the minimum buffer threshold of 10 units. Projected stockout in 4 business days.',
    severity: 'CRITICAL',
    conditionTrigger: 'Current stock (3) <= Configured Reorder Threshold (10)',
    supportingData: {
      sku: 'HW-SRV-01',
      productName: 'FlowMind AI Edge Server Gateway',
      currentStock: 3,
      reorderLevel: 10,
    },
    recommendedAction: {
      label: 'Generate Supplier Purchase Order (50 Units)',
      actionType: 'CREATE_PURCHASE_ORDER',
      module: 'INVENTORY',
      parameters: { sku: 'HW-SRV-01', quantityToOrder: 50, estimatedCost: 425000 },
      riskLevel: 'HIGH',
      requiresApproval: true,
      targetEntityId: 'HW-SRV-01',
    },
    status: 'NEW',
    dedupHash: 'INVENTORY_LOW_STOCK_HW_SRV_01',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INS-AUTO-003',
    organizationId: 'ORG-01',
    module: 'CRM',
    insightType: 'TREND_SHIFT',
    title: 'High-Value Lead Pipeline Inactivity (> 5 Days)',
    description:
      'Lead TechCorp India (₹2,50,000) has remained in New Lead stage without follow-up logging for 5 days. BANT criteria indicates high closing probability.',
    severity: 'MEDIUM',
    conditionTrigger: 'Lead value >= ₹1,50,000 and days in stage > 4',
    supportingData: {
      leadId: 'LEAD-101',
      leadName: 'Aarav Sharma',
      company: 'TechCorp India',
      value: 250000,
    },
    recommendedAction: {
      label: 'Draft Tailored Executive Proposal via Sales Agent',
      actionType: 'DRAFT_SALES_PROPOSAL',
      module: 'CRM',
      parameters: { leadId: 'LEAD-101', targetContract: 'Enterprise 15-Agent License' },
      riskLevel: 'LOW',
      requiresApproval: false,
      targetEntityId: 'LEAD-101',
    },
    status: 'NEW',
    dedupHash: 'CRM_STALE_LEAD_LEAD_101',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INS-AUTO-004',
    organizationId: 'ORG-01',
    module: 'SUPPORT',
    insightType: 'BOTTLENECK',
    title: 'Critical Support SLA Breach Risk: Ticket #TICK-8012',
    description:
      'Customer ticket regarding DAG Node Timeout has exceeded 2 hours in Open state without assigned technician.',
    severity: 'CRITICAL',
    conditionTrigger: 'Priority == CRITICAL and status == OPEN and unassignedTime > 2 hours',
    supportingData: {
      ticketNumber: 'TICK-8012',
      title: 'DAG Node Execution Timeout in Production',
      priority: 'CRITICAL',
    },
    recommendedAction: {
      label: 'Auto-Assign to Senior Support Engineer & Page On-Duty Agent',
      actionType: 'ESCALATE_TICKET',
      module: 'SUPPORT',
      parameters: { ticketNumber: 'TICK-8012', targetAgent: 'Support' },
      riskLevel: 'LOW',
      requiresApproval: false,
      targetEntityId: 'TICK-8012',
    },
    status: 'NEW',
    dedupHash: 'SUPPORT_SLA_BREACH_TICK_8012',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class ProactiveInsightsService {
  /**
   * Retrieves active proactive insights for organization
   */
  public async getInsights(orgId: string = 'ORG-01'): Promise<ProactiveInsight[]> {
    try {
      const dbInsights = await prisma.proactiveInsight.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });

      if (dbInsights && dbInsights.length > 0) {
        return dbInsights.map((i) => ({
          id: i.id,
          organizationId: i.organizationId,
          module: i.module as any,
          insightType: i.insightType as any,
          title: i.title,
          description: i.description,
          severity: i.severity as InsightSeverity,
          conditionTrigger: i.conditionTrigger,
          supportingData: (i.supportingData as any) || undefined,
          recommendedAction: (i.recommendedAction as any) || undefined,
          status: i.status as InsightStatus,
          assignedToId: i.assignedToId || undefined,
          resolvedAt: i.resolvedAt?.toISOString(),
          workflowId: i.workflowId || undefined,
          dedupHash: i.dedupHash,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        }));
      }
    } catch {
      // In-memory fallback
    }

    return insightsStore.filter((i) => i.organizationId === orgId);
  }

  /**
   * Evaluates live business state and detects new anomalies/threshold breaches
   */
  public async scanAndDetectInsights(orgId: string = 'ORG-01'): Promise<ProactiveInsight[]> {
    const invoices = await businessService.getInvoices(orgId);
    const products = await businessService.getProducts(orgId);
    const leads = await businessService.getLeads(orgId);
    const tickets = await businessService.getTickets(orgId);

    const detected: ProactiveInsight[] = [];

    // 1. Scan for Overdue Invoices > ₹50k
    const overdue = invoices.filter((i) => i.status === 'OVERDUE' && i.total >= 50000);
    overdue.forEach((inv) => {
      const dedupHash = `FINANCE_OVERDUE_${inv.invoiceNumber}`;
      if (!insightsStore.some((i) => i.dedupHash === dedupHash)) {
        detected.push({
          id: `INS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          organizationId: orgId,
          module: 'FINANCE',
          insightType: 'THRESHOLD_BREACH',
          title: `Overdue Invoice: ${inv.invoiceNumber} (${inv.customerName})`,
          description: `Invoice balance of ₹${inv.total.toLocaleString()} is past due date (${inv.dueDate.split('T')[0]}).`,
          severity: 'HIGH',
          conditionTrigger: 'status == OVERDUE and total >= 50000',
          supportingData: { invoiceNumber: inv.invoiceNumber, amount: inv.total, customer: inv.customerName },
          recommendedAction: {
            label: 'Trigger Payment Reminder Notice',
            actionType: 'SEND_PAYMENT_REMINDER',
            module: 'FINANCE',
            parameters: { invoiceNumber: inv.invoiceNumber },
            riskLevel: 'MEDIUM',
            requiresApproval: true,
          },
          status: 'NEW',
          dedupHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // 2. Scan for Low Stock Products
    const lowStock = products.filter((p) => p.quantity <= p.reorderLevel);
    lowStock.forEach((prod) => {
      const dedupHash = `INVENTORY_LOW_${prod.sku}`;
      if (!insightsStore.some((i) => i.dedupHash === dedupHash)) {
        detected.push({
          id: `INS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          organizationId: orgId,
          module: 'INVENTORY',
          insightType: 'ANOMALY',
          title: `Low Inventory Alert: ${prod.name}`,
          description: `Current quantity (${prod.quantity}) has fallen below reorder threshold (${prod.reorderLevel}).`,
          severity: prod.quantity <= 0 ? 'CRITICAL' : 'HIGH',
          conditionTrigger: 'quantity <= reorderLevel',
          supportingData: { sku: prod.sku, quantity: prod.quantity, reorderLevel: prod.reorderLevel },
          recommendedAction: {
            label: 'Create Hardware Restock Order',
            actionType: 'REPLENISH_STOCK',
            module: 'INVENTORY',
            parameters: { sku: prod.sku, quantity: 25 },
            riskLevel: 'HIGH',
            requiresApproval: true,
          },
          status: 'NEW',
          dedupHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // Append newly detected insights to store
    if (detected.length > 0) {
      insightsStore.unshift(...detected);
    }

    return this.getInsights(orgId);
  }

  /**
   * Advances insight lifecycle status (NEW -> ACKNOWLEDGED -> RESOLVED)
   */
  public async updateInsightStatus(
    insightId: string,
    status: InsightStatus,
    user: User
  ): Promise<ProactiveInsight | null> {
    const insight = insightsStore.find((i) => i.id === insightId);
    if (!insight) return null;

    insight.status = status;
    insight.updatedAt = new Date().toISOString();
    if (status === 'RESOLVED') {
      insight.resolvedAt = new Date().toISOString();
    }

    try {
      await prisma.proactiveInsight.update({
        where: { id: insightId },
        data: {
          status: status as any,
          resolvedAt: status === 'RESOLVED' ? new Date() : null,
          history: {
            create: {
              actorId: user.id,
              actorName: user.name,
              action: status as any,
              notes: `Status changed to ${status} by ${user.name}`,
            },
          },
        },
      });
    } catch {
      // Store already updated
    }

    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: user.organizationId || 'ORG-01',
      requestId: `REQ-INSIGHT-STATUS-${Date.now()}`,
      agentId: 'Analytics',
      actionType: 'UPDATE_INSIGHT_STATUS',
      parameters: { insightId, newStatus: status },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
    });

    return insight;
  }

  /**
   * Triggers a Governed Action recommended by an insight:
   * If action is HIGH/CRITICAL risk, routes to approvalService for human approval.
   * If action is LOW/MEDIUM risk without approval requirement, executes immediately.
   */
  public async executeGovernedAction(
    insightId: string,
    user: User
  ): Promise<{ success: boolean; requiresApproval: boolean; message: string }> {
    const insight = insightsStore.find((i) => i.id === insightId);
    if (!insight || !insight.recommendedAction) {
      return { success: false, requiresApproval: false, message: 'Insight or action not found' };
    }

    const action = insight.recommendedAction;

    // Check Action Governance & Approval Requirement
    if (action.requiresApproval || action.riskLevel === 'HIGH' || action.riskLevel === 'CRITICAL') {
      await approvalService.createApprovalRequest({
        organizationId: user.organizationId || 'ORG-01',
        actionType: `${action.module}_${action.actionType}`,
        actionPayload: { insightId, ...action.parameters },
        riskLevel: action.riskLevel,
        requestedById: user.id,
      });

      await this.updateInsightStatus(insightId, 'ACKNOWLEDGED', user);

      return {
        success: true,
        requiresApproval: true,
        message: `Action '${action.label}' submitted to Action Governance queue for Manager/Admin approval.`,
      };
    }

    // Direct Execution for Low-Risk Actions
    await this.updateInsightStatus(insightId, 'RESOLVED', user);

    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: user.organizationId || 'ORG-01',
      requestId: `REQ-ACTION-EXEC-${Date.now()}`,
      agentId: 'Workflow',
      actionType: action.actionType,
      parameters: action.parameters,
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    return {
      success: true,
      requiresApproval: false,
      message: `Action '${action.label}' executed successfully by ${action.module} Agent.`,
    };
  }
}

export const proactiveInsightsService = new ProactiveInsightsService();
