import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/ai/agentOrchestrator';
import { agentRegistry } from '@/lib/ai/agentRegistry';
import { getCurrentUserFromSession } from '@/lib/auth/session';
import { User, AgentType } from '@/types';
import { detectInputLanguage } from '@/lib/i18n/languageContextService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_AGENTS: AgentType[] = [
  'CEO', 'Sales', 'Finance', 'HR', 'Support', 'Marketing', 'Analytics',
  'Database', 'Workflow', 'Scheduler', 'Document', 'Email', 'Knowledge',
  'Reporting', 'Security'
];

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromSession();
    const body = await request.json();
    const query = body.query || body.message;
    let language = body.language;
    if (!language || language === 'en') {
      const cookieLang = request.cookies.get('flowmind_lang')?.value;
      if (cookieLang && ['hi', 'te', 'ta', 'kn', 'ml'].includes(cookieLang)) {
        language = cookieLang;
      } else if (query) {
        const detected = detectInputLanguage(query);
        if (detected) language = detected;
        else if (!language) language = 'en';
      } else {
        language = 'en';
      }
    }
    const selectedAgentOverride = body.selectedAgentOverride || body.selectedAgent;
    const messageHistory = body.messageHistory || body.conversationHistory || [];
    const memoryContext = body.memoryContext;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // Validate selected agent server-side
    let validatedAgent: AgentType | undefined = undefined;
    if (selectedAgentOverride && typeof selectedAgentOverride === 'string') {
      const match = VALID_AGENTS.find(
        (a) => a.toLowerCase() === selectedAgentOverride.trim().toLowerCase()
      );
      if (match && agentRegistry.getAgent(match)) {
        validatedAgent = match;
      }
    }

    const user: User = {
      id: session?.userId || 'USER-ADMIN-01',
      name: session?.name || 'Administrator',
      email: session?.email || 'admin@flowmind.ai',
      role: session?.role || 'ADMIN',
      avatar: '/avatars/admin.png',
      preferredLanguage: (language as any) || 'en',
      organizationId: session?.organizationId || 'ORG-01',
    };

    const result = await agentOrchestrator.processRequest(query, {
      user,
      language,
      selectedAgentOverride: validatedAgent,
      messageHistory,
      memoryContext,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    const errorTraceId = `ERR-TRACE-${Date.now()}`;
    console.error(`[API AGENT CHAT ERROR] [${errorTraceId}]`, err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Agent processing error',
        traceId: errorTraceId,
      },
      { status: 500 }
    );
  }
}
