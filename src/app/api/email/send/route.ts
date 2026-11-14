import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';
import { emailService } from '@/lib/services/emailService';
import { businessService } from '@/lib/services/businessService';
import { auditLogger } from '@/lib/security/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const user = sessionToken ? await verifyToken(sessionToken) : null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Sign in required.' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data, confirmed } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing email type or payload data.' }, { status: 400 });
    }

    // 1. MEETING INVITATION PREVIEW / SEND
    if (type === 'MEETING_INVITE') {
      const { title, date, time, duration, attendees, organizer } = data;
      if (!title || !date || !attendees || attendees.length === 0) {
        return NextResponse.json({ error: 'Meeting requires title, date, and at least one attendee.' }, { status: 400 });
      }

      const generated = emailService.generateMeetingInviteEmail({
        title,
        date,
        time: time || '10:00 AM',
        timezone: data.timezone || 'IST (UTC+5:30)',
        duration: duration || 30,
        attendees,
        organizer: organizer || user.name || 'Executive',
        description: data.description,
        meetingLink: data.meetingLink,
      });

      if (!confirmed) {
        // Return preview without dispatching
        return NextResponse.json({
          preview: true,
          subject: generated.subject,
          htmlPreview: generated.htmlBody,
          textPreview: generated.textBody,
          recipients: attendees.map((a: any) => a.email),
          requiresConfirmation: true,
          message: 'Meeting invitation draft generated. Confirm to send.',
        });
      }

      const recipients = attendees.map((a: any) => a.email);
      const sendResult = await emailService.sendEmail({
        to: recipients,
        subject: generated.subject,
        htmlBody: generated.htmlBody,
        textBody: generated.textBody,
      });

      auditLogger.logAuditEvent({
        userId: user.userId,
        organizationId: user.organizationId || 'ORG-01',
        requestId: `REQ-MAIL-${Date.now()}`,
        agentId: 'CEO',
        actionType: 'EMAIL_SEND_MEETING_INVITE',
        parameters: { title, recipientCount: recipients.length },
        approvalStatus: 'APPROVED',
        executionStatus: 'EXECUTED',
      });

      return NextResponse.json({
        success: true,
        preview: false,
        result: sendResult,
        message: `Meeting invitation transmitted to ${recipients.length} participant(s).`,
      });
    }

    // 2. INVOICE OVERDUE / PAYMENT REMINDER PREVIEW / SEND
    if (type === 'INVOICE_REMINDER') {
      const { invoiceNumber } = data;
      if (!invoiceNumber) {
        return NextResponse.json({ error: 'Invoice reference number is required.' }, { status: 400 });
      }

      // Verify invoice exists in genuine database/service to avoid fabrication
      const orgInvoices = await businessService.getInvoices(user.organizationId || 'ORG-01');
      const targetInvoice = orgInvoices.find((i) => i.invoiceNumber === invoiceNumber);

      if (!targetInvoice) {
        return NextResponse.json(
          { error: `Invoice '${invoiceNumber}' not found in registered accounts receivable ledger.` },
          { status: 404 }
        );
      }

      const dueDate = new Date(targetInvoice.dueDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      const daysOverdue = Math.max(0, diffDays);

      const generated = emailService.generateInvoiceReminderEmail({
        invoiceNumber: targetInvoice.invoiceNumber,
        customerName: targetInvoice.customerName,
        customerEmail: targetInvoice.customerEmail || data.customerEmail || 'billing@client.com',
        amount: targetInvoice.total,
        dueDate: targetInvoice.dueDate,
        daysOverdue,
        currency: '₹',
        taxAmount: targetInvoice.tax,
      });

      if (!confirmed) {
        return NextResponse.json({
          preview: true,
          subject: generated.subject,
          htmlPreview: generated.htmlBody,
          textPreview: generated.textBody,
          recipients: [targetInvoice.customerEmail || data.customerEmail || 'billing@client.com'],
          invoiceDetails: {
            invoiceNumber: targetInvoice.invoiceNumber,
            total: targetInvoice.total,
            status: targetInvoice.status,
            daysOverdue,
          },
          requiresConfirmation: true,
          message: 'Invoice reminder verified against finance ledger. Confirm to send.',
        });
      }

      const recipient = targetInvoice.customerEmail || data.customerEmail || 'billing@client.com';
      const sendResult = await emailService.sendEmail({
        to: recipient,
        subject: generated.subject,
        htmlBody: generated.htmlBody,
        textBody: generated.textBody,
      });

      auditLogger.logAuditEvent({
        userId: user.userId,
        organizationId: user.organizationId || 'ORG-01',
        requestId: `REQ-MAIL-${Date.now()}`,
        agentId: 'Finance',
        actionType: 'EMAIL_SEND_INVOICE_REMINDER',
        parameters: { invoiceNumber: targetInvoice.invoiceNumber, amount: targetInvoice.total, recipient },
        approvalStatus: 'APPROVED',
        executionStatus: 'EXECUTED',
      });

      return NextResponse.json({
        success: true,
        preview: false,
        result: sendResult,
        message: `Payment reminder for Invoice ${targetInvoice.invoiceNumber} delivered to ${recipient}.`,
      });
    }

    return NextResponse.json({ error: `Unsupported email workflow type: ${type}` }, { status: 400 });
  } catch (err: any) {
    console.error('[EMAIL API ROUTE ERROR]', err);
    return NextResponse.json({ error: 'Internal error processing outbound email.' }, { status: 500 });
  }
}
