import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/security/auditLogger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // 1. Vercel Cron Authentication Verification
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, enforce CRON_SECRET verification
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED_CRON_TRIGGER: Invalid cron authorization token' },
          { status: 401 }
        );
      }
    }

    // 2. Idempotency Check: Prevent duplicate execution within the same hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingRun = await prisma.auditLog.findFirst({
      where: {
        action: 'CRON_OVERDUE_INVOICE_SWEEP',
        createdAt: { gte: oneHourAgo },
      },
    });

    if (existingRun) {
      return NextResponse.json({
        success: true,
        status: 'SKIPPED_DUPLICATE',
        message: 'Cron job already executed within the past hour.',
        lastExecutionId: existingRun.id,
      });
    }

    // 3. Scan for Overdue Invoices
    const now = new Date();
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'OVERDUE',
      },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        total: true,
        dueDate: true,
      },
    });

    // 4. Log Audit Trail
    const logEntry = await auditLogger.logAuditEvent({
      userId: 'SYSTEM-CRON',
      requestId: `REQ-CRON-${Date.now()}`,
      organizationId: 'ORG-01',
      agentId: 'Finance',
      actionType: 'CRON_OVERDUE_INVOICE_SWEEP',
      parameters: {
        totalScanned: overdueInvoices.length,
        timestamp: now.toISOString(),
      },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
      securityEvents: [],
    });

    return NextResponse.json({
      success: true,
      status: 'EXECUTED',
      overdueInvoicesCount: overdueInvoices.length,
      auditLogId: logEntry.id,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error('[CRON ERROR] Overdue sweep failed:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during cron job execution' },
      { status: 500 }
    );
  }
}
