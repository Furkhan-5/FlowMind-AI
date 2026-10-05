import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/security/auditLogger';

export interface CreateAuditInput {
  organizationId?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  async logAuditEvent(data: CreateAuditInput) {
    const orgId = data.organizationId || 'ORG-01';

    // 1. Log to memory auditLogger
    auditLogger.logAuditEvent({
      userId: data.userId || 'SYSTEM',
      organizationId: orgId,
      requestId: `REQ-AUD-${Date.now()}`,
      agentId: (data.resourceType as any) || 'CEO',
      actionType: data.action,
      parameters: data.details || {},
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    // 2. Persist to PostgreSQL via Prisma
    try {
      return await prisma.auditLog.create({
        data: {
          organizationId: orgId,
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          details: data.details as any,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (err) {
      console.warn('[auditService] Prisma audit log write failed:', err);
      return null;
    }
  },

  async getAuditLogs(organizationId: string = 'ORG-01', limit: number = 100) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { organizationId },
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      if (logs && logs.length > 0) return logs;
    } catch (err) {
      console.warn('[auditService] Prisma get audit logs failed:', err);
    }

    return auditLogger.getAuditLogs();
  },
};
