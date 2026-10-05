import { prisma } from '@/lib/prisma';
import { canUserApproveAction } from './rbacService';
import { UserRole } from '@prisma/client';

export interface CreateApprovalInput {
  organizationId?: string;
  executionId?: string;
  nodeId?: string;
  actionType: string;
  actionPayload: Record<string, any>;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requestedById?: string;
}

export const approvalService = {
  async createApprovalRequest(input: CreateApprovalInput) {
    const orgId = input.organizationId || 'ORG-01';
    try {
      return await prisma.approvalRequest.create({
        data: {
          organizationId: orgId,
          executionId: input.executionId,
          nodeId: input.nodeId,
          actionType: input.actionType,
          actionPayload: input.actionPayload as any,
          riskLevel: input.riskLevel || 'MEDIUM',
          status: 'PENDING',
          requestedById: input.requestedById,
        },
      });
    } catch (err) {
      console.warn('[approvalService] Prisma create approval error:', err);
      return null;
    }
  },

  async resolveApprovalRequest(params: {
    requestId: string;
    approverId: string;
    approverRole: UserRole;
    approved: boolean;
    rejectReason?: string;
  }) {
    try {
      const existing = await prisma.approvalRequest.findUnique({
        where: { id: params.requestId },
      });

      if (!existing) {
        return { success: false, error: 'Approval request not found.' };
      }

      if (existing.status !== 'PENDING') {
        return { success: false, error: `Request is already ${existing.status}.` };
      }

      // RBAC and Self-Approval Validation
      const rbacCheck = canUserApproveAction(params.approverRole, existing.requestedById, params.approverId);
      if (!rbacCheck.allowed) {
        return { success: false, error: rbacCheck.reason || 'Permission denied.' };
      }

      const updatedStatus = params.approved ? 'APPROVED' : 'REJECTED';

      const updated = await prisma.approvalRequest.update({
        where: { id: params.requestId },
        data: {
          status: updatedStatus as any,
          approvedById: params.approverId,
          rejectReason: params.rejectReason || null,
          resolvedAt: new Date(),
        },
      });

      return { success: true, request: updated };
    } catch (err: any) {
      console.warn('[approvalService] Resolve approval error:', err);
      return { success: false, error: err.message };
    }
  },

  async getPendingApprovals(organizationId: string = 'ORG-01') {
    try {
      return await prisma.approvalRequest.findMany({
        where: {
          organizationId,
          status: 'PENDING',
        },
        include: {
          requestedBy: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[approvalService] Get pending approvals error:', err);
      return [];
    }
  },
};
