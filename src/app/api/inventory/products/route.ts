import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = { organizationId: session.organizationId };
    if (lowStock) {
      // Products where quantity <= reorderLevel (default 10)
      where.quantity = { lte: 10 };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 200,
    });

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error('[INVENTORY GET]', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    const { name, sku, category, quantity, reorderLevel, unitPrice, description } = body;

    if (!name || !sku || !category) {
      return NextResponse.json({ error: 'name, sku, and category are required' }, { status: 400 });
    }

    const qty = quantity || 0;
    const product = await prisma.product.create({
      data: {
        organizationId: session.organizationId,
        name,
        sku,
        category,
        quantity: qty,
        reorderLevel: reorderLevel || 10,
        unitPrice: unitPrice || 0,
        description,
        status: qty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    console.error('[INVENTORY POST]', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
