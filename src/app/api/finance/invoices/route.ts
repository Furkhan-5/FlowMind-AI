import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue') === 'true';

    const where: any = { organizationId: session.organizationId };
    if (status) where.status = status;
    if (overdue) {
      where.status = { in: ['PENDING', 'SENT'] };
      where.dueDate = { lt: new Date() };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { items: true, payments: true },
    });

    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error('[FINANCE GET]', err);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session || session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { customerName, customerEmail, items, dueDate, discount } = body;

    if (!customerName || !items || items.length === 0) {
      return NextResponse.json({ error: 'customerName and items are required' }, { status: 400 });
    }

    const GST_RATE = 0.18;
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const discountAmt = discount || 0;
    const tax = (subtotal - discountAmt) * GST_RATE;
    const total = subtotal - discountAmt + tax;

    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: session.organizationId,
        invoiceNumber,
        customerName,
        customerEmail,
        createdById: session.userId,
        status: 'PENDING',
        subtotal,
        tax,
        discount: discountAmt,
        total,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 86400000),
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: any) {
    console.error('[FINANCE POST]', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
