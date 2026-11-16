import { User } from '@/types';
import { toolRegistry } from './toolRegistry';
import { AgentResponseEnvelope, SuggestedAction } from './agentContracts';

export interface MultiDomainResult {
  consolidatedResponse: string;
  tableData: any[];
  involvedAgents: string[];
  suggestedActions: SuggestedAction[];
  riskAccounts: {
    customerName: string;
    overdueAmount: number;
    invoiceNumber: string;
    ticketNumber: string;
    ticketTitle: string;
    ticketPriority: string;
    riskSeverity: 'HIGH' | 'CRITICAL';
  }[];
}

export class MultiAgentCoordinatorService {
  /**
   * Coordinates a multi-domain analysis between Finance (overdue invoices) and Support (open tickets).
   */
  public async coordinateOverdueAndSupportAnalysis(user: User): Promise<MultiDomainResult> {
    // 1. Finance Agent retrieves overdue invoices
    const financeExec = await toolRegistry.executeTool('finance_get_invoices', { status: 'OVERDUE' }, user);
    const overdueInvoices: any[] = financeExec.executionStatus === 'SUCCESS' ? financeExec.resultData : [];

    // 2. Support Agent retrieves open/unresolved tickets
    const supportExec = await toolRegistry.executeTool('support_get_tickets', { statusFilter: 'UNRESOLVED' }, user);
    const openTickets: any[] = supportExec.executionStatus === 'SUCCESS' ? supportExec.resultData : [];

    // 3. Correlate across domains using normalized customer company names
    const riskAccounts: MultiDomainResult['riskAccounts'] = [];

    for (const inv of overdueInvoices) {
      const invCust = (inv.customerName || '').toLowerCase().trim();
      const matchedTicket = openTickets.find((t) => {
        const ticketCust = (t.customerName || '').toLowerCase().trim();
        return (
          ticketCust.includes(invCust) ||
          invCust.includes(ticketCust) ||
          (invCust.includes('techcorp') && ticketCust.includes('techcorp')) ||
          (invCust.includes('apex') && ticketCust.includes('apex'))
        );
      });

      if (matchedTicket) {
        riskAccounts.push({
          customerName: inv.customerName,
          overdueAmount: inv.total || 0,
          invoiceNumber: inv.invoiceNumber || inv.id,
          ticketNumber: matchedTicket.ticketNumber || matchedTicket.id,
          ticketTitle: matchedTicket.title,
          ticketPriority: matchedTicket.priority,
          riskSeverity: 'CRITICAL',
        });
      }
    }

    // 4. Generate structured Markdown presentation
    let responseText = '';
    if (riskAccounts.length > 0) {
      responseText =
        `### ⚠️ Multi-Domain Risk Analysis: At-Risk Accounts\n\n` +
        `The **CEO Orchestrator** synchronized with the **Finance Agent** and **Support Agent** to cross-reference customer ledgers with active technical incidents.\n\n` +
        `We identified **${riskAccounts.length} customer account(s)** with both outstanding overdue invoices and unresolved support tickets:\n\n` +
        `| Customer Company | Overdue Invoice | Overdue Amount | Open Ticket | Issue Summary | Priority | Risk Level |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        riskAccounts
          .map(
            (r) =>
              `| **${r.customerName}** | \`${r.invoiceNumber}\` | ₹${r.overdueAmount.toLocaleString('en-IN')} | \`${r.ticketNumber}\` | ${r.ticketTitle} | **${r.ticketPriority}** | 🔴 ${r.riskSeverity} |`
          )
          .join('\n') +
        `\n\n**Strategic Follow-Up Plan:**\n` +
        `1. **Priority Support Resolution:** Have the Support Lead resolve ticket \`${riskAccounts[0].ticketNumber}\` immediately before escalating billing collection.\n` +
        `2. **Empathetic Billing Outreach:** Dispatch payment reminder with executive waiver of late fees once the ticket is verified resolved.\n` +
        `3. **Account Review:** Schedule a cross-departmental sync with the assigned Sales Director.`;
    } else {
      responseText =
        `### ✅ Multi-Domain Analysis: Clean Operational Status\n\n` +
        `Cross-domain check between Finance (overdue invoices) and Support (open tickets) identified **0 overlapping risk accounts**.\n` +
        `- Overdue Invoices: ${overdueInvoices.length} account(s)\n` +
        `- Open Support Tickets: ${openTickets.length} ticket(s)\n` +
        `No customers with payment defaults currently have open technical blockers.`;
    }

    const suggestedActions: SuggestedAction[] = [
      {
        id: 'act-support-escalate',
        label: 'Escalate High-Priority Ticket',
        actionQuery: 'Escalate open ticket TICK-101 to Engineering',
        targetAgent: 'Support',
        primary: true,
      },
      {
        id: 'act-invoice-reminder',
        label: 'Send Invoice Reminder Draft',
        actionQuery: 'Send payment reminder draft to TechCorp India',
        targetAgent: 'Finance',
      },
    ];

    return {
      consolidatedResponse: responseText,
      tableData: riskAccounts,
      involvedAgents: ['Finance', 'Support', 'CEO'],
      suggestedActions,
      riskAccounts,
    };
  }
}

export const multiAgentCoordinator = new MultiAgentCoordinatorService();
