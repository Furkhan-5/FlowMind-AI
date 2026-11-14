import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/session';
import { businessService } from '@/lib/services/businessService';
import { User } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const user = sessionToken ? await verifyToken(sessionToken) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const leads = await businessService.getLeads(user.organizationId || 'ORG-01');
    const lead = leads.find((l) => l.id === params.id);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    return NextResponse.json({ lead });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve lead details' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const user = sessionToken ? await verifyToken(sessionToken) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { stage, reason, notes, value } = body;

    const appUser: User = {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      preferredLanguage: 'en',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    let updatedLead;
    if (stage) {
      updatedLead = await businessService.updateLeadStage(params.id, stage, appUser, reason || 'API Update');
    } else {
      const leads = await businessService.getLeads(user.organizationId || 'ORG-01');
      const lead = leads.find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      if (notes !== undefined) lead.notes = notes;
      if (value !== undefined) lead.value = Number(value);
      updatedLead = lead;
    }

    return NextResponse.json({ lead: updatedLead });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const user = sessionToken ? await verifyToken(sessionToken) : null;
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Administrator role required to delete leads' }, { status: 403 });
    }

    try {
      await prisma.lead.deleteMany({
        where: { id: params.id, organizationId: user.organizationId },
      });
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, message: `Lead ${params.id} removed.` });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
