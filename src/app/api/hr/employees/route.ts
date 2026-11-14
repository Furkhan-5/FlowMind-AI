import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    const where: any = { organizationId: session.organizationId };
    if (department) where.department = department;

    const isAdmin = session.role === 'ADMIN' || session.role === 'MANAGER';

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        designation: true,
        employeeCode: true,
        employmentStatus: true,
        joiningDate: true,
        createdAt: true,
        // Only expose salary to ADMIN/MANAGER
        salary: isAdmin,
      },
    });

    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error('[HR GET]', err);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, department, designation, salary } = body;

    if (!name || !email || !department || !designation) {
      return NextResponse.json({ error: 'name, email, department, and designation are required' }, { status: 400 });
    }

    const employeeCode = `EMP-${Date.now()}`;
    const employee = await prisma.employee.create({
      data: {
        organizationId: session.organizationId,
        employeeCode,
        name,
        email,
        department,
        designation,
        salary: salary || 0,
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (err: any) {
    console.error('[HR POST]', err);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
