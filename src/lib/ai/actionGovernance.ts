import { AgentType } from '@/types';
import { RiskLevel, ValidationStatus, ActionSimulationResult } from '@/types/universalAgent';

export interface ActionGovernanceEvaluation {
  riskLevel: RiskLevel;
  riskReason: string;
  approvalRequired: boolean;
  approvalReason: string;
  validationStatus: ValidationStatus;
  missingFields: string[];
  validationErrors: string[];
  simulation?: ActionSimulationResult;
}

export class ActionGovernanceEngine {
  public evaluateAction(
    agentId: AgentType,
    actionType: string,
    parameters: Record<string, any>,
    userRole: string = 'USER'
  ): ActionGovernanceEvaluation {
    const missingFields: string[] = [];
    const validationErrors: string[] = [];

    // 1. Schema & Required Field Validation
    const actionUpper = actionType.toUpperCase();

    if (actionUpper.includes('INVOICE') || actionUpper.includes('BILLING')) {
      if (!parameters.client && !parameters.clientName) {
        missingFields.push('client');
      }
      if (!parameters.amount) {
        missingFields.push('amount');
      }
    } else if (actionUpper.includes('LEAD') || actionUpper.includes('PROSPECT')) {
      if (!parameters.client && !parameters.name && !parameters.company) {
        missingFields.push('client');
      }
    } else if (actionUpper.includes('LEAVE') || actionUpper.includes('HR')) {
      if (!parameters.employee && !parameters.employeeName) {
        missingFields.push('employee');
      }
      if (!parameters.leaveDays && !parameters.days) {
        missingFields.push('leaveDays');
      }
    }

    let validationStatus: ValidationStatus = 'VALID';
    if (missingFields.length > 0) {
      validationStatus = 'NEEDS_INPUT';
      missingFields.forEach((f) => validationErrors.push(`Required field '${f}' is missing.`));
    }

    // 2. Deterministic Risk Classification
    let riskLevel: RiskLevel = 'LOW';
    let riskReason = 'Read-only operational query with no enterprise state mutation.';

    if (actionUpper.includes('DELETE_ALL') || actionUpper.includes('RESET_SYSTEM') || actionUpper.includes('BULK_DELETE')) {
      riskLevel = 'CRITICAL';
      riskReason = 'Critical operational action that deletes or resets enterprise system state.';
    } else if (
      actionUpper.includes('INVOICE') ||
      actionUpper.includes('FINANCE') ||
      actionUpper.includes('PAYROLL') ||
      actionUpper.includes('ONBOARD') ||
      actionUpper.includes('DELETE')
    ) {
      riskLevel = 'HIGH';
      riskReason = 'High-impact financial or administrative operation requiring explicit authorization.';
    } else if (actionUpper.includes('UPDATE') || actionUpper.includes('LEAD') || actionUpper.includes('TICKET') || actionUpper.includes('EMAIL')) {
      riskLevel = 'MEDIUM';
      riskReason = 'Medium-impact CRM or communication state update.';
    } else if (actionUpper.includes('CREATE') || actionUpper.includes('SCHEDULE')) {
      riskLevel = 'LOW';
      riskReason = 'Standard creation operation subject to routine approval.';
    }

    // 3. Dynamic Approval Policy Determination
    let approvalRequired = false;
    let approvalReason = 'Operational approval not required for read-only queries.';

    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      approvalRequired = true;
      approvalReason = `Explicit user approval is required because this operation has a ${riskLevel} risk level (${riskReason}).`;
    } else if (riskLevel === 'MEDIUM') {
      approvalRequired = true;
      approvalReason = 'User confirmation required prior to executing CRM state updates.';
    } else if (['Sales', 'Finance', 'HR', 'Workflow', 'Document'].includes(agentId)) {
      approvalRequired = true;
      approvalReason = `Action proposed by ${agentId} Agent requires confirmation.`;
    }

    // 4. Action Simulation / Dry Run
    const simulation: ActionSimulationResult = {
      simulated: true,
      impactLevel: riskLevel,
      expectedChanges: {
        entity: parameters.client || parameters.clientName || parameters.employee || 'Enterprise System State',
        before: this.getBeforeState(actionType, parameters),
        after: this.getAfterState(actionType, parameters),
        summary: `Dry run simulation complete: 1 record targeted for ${actionType}. No database changes made until approval.`,
      },
    };

    return {
      riskLevel,
      riskReason,
      approvalRequired,
      approvalReason,
      validationStatus,
      missingFields,
      validationErrors,
      simulation,
    };
  }

  private getBeforeState(actionType: string, params: Record<string, any>): Record<string, any> | undefined {
    const actUpper = actionType.toUpperCase();
    if (actUpper.includes('LEAD')) {
      return { status: 'NEW', assignedAgent: 'Unassigned', leadScore: 'Unqualified' };
    }
    if (actUpper.includes('INVOICE')) {
      return { status: 'DRAFT_UNISSUED', totalPaid: '₹0', taxCalculated: 'Pending' };
    }
    if (actUpper.includes('LEAVE')) {
      return { leaveBalance: '14 Days Available', requestStatus: 'UNSUBMITTED' };
    }
    return undefined;
  }

  private getAfterState(actionType: string, params: Record<string, any>): Record<string, any> | undefined {
    const actUpper = actionType.toUpperCase();
    if (actUpper.includes('LEAD')) {
      return {
        status: 'QUALIFIED',
        assignedAgent: 'Sales Agent',
        clientName: params.client || params.clientName || 'Acme Corp',
        dealValue: params.value || params.dealValue || '₹1,25,000',
      };
    }
    if (actUpper.includes('INVOICE')) {
      return {
        status: 'ISSUED & DISPATCHED',
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: params.client || params.clientName || 'Acme Corp',
        totalPayable: params.amount || '₹50,000',
        taxDetails: '18% GST Applied',
      };
    }
    if (actUpper.includes('LEAVE')) {
      return {
        leaveBalance: '12 Days Available (-2 Days)',
        requestStatus: 'APPROVED BY HR AGENT',
        employee: params.employee || params.employeeName || 'Rajesh Kumar',
      };
    }
    return params;
  }
}

export const actionGovernance = new ActionGovernanceEngine();
