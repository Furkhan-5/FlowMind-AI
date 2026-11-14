import { memoryService } from '@/lib/services/memoryService';
import { emailService, MeetingInviteData, InvoiceReminderData } from '@/lib/services/emailService';
import { universalAgentRuntime } from '@/lib/ai/universalAgentRuntime';
import { User } from '@/types';

describe('Universal Chatbot Intelligence — Persistent Memory & Email Suite', () => {
  const testUser: User = {
    id: 'USER-MEM-01',
    organizationId: 'ORG-01',
    name: 'Aarav Sharma',
    email: 'aarav@flowmind.ai',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    preferredLanguage: 'en',
  };

  const otherUser: User = {
    id: 'USER-OTHER-02',
    organizationId: 'ORG-01',
    name: 'Priya Patel',
    email: 'priya@flowmind.ai',
    role: 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    preferredLanguage: 'en',
  };

  // ================================================================
  // 1. THREE-TIER MEMORY PERSISTENCE TESTS
  // ================================================================
  describe('1. Memory Persistence & Grounded Retrieval', () => {
    test('extractAndSaveMemory detects enterprise fact and stores in memory', async () => {
      const extracted = await memoryService.extractAndSaveMemory(
        testUser.id,
        testUser.organizationId,
        'Remember that our sales team uses CRM for lead management.'
      );

      expect(extracted).toBe(true);

      const retrieved = await memoryService.retrieveRelevantMemories(
        testUser.id,
        testUser.organizationId,
        'Which module does our sales team use for lead management?'
      );

      expect(retrieved.length).toBeGreaterThan(0);
      expect(retrieved[0].content).toContain('CRM');
      expect(retrieved[0].scope).toBe('ORG_SHARED');
    });

    test('Chatbot MVP retrieves saved memory and answers accurately', async () => {
      // Step A: Save fact
      const saveRes = await universalAgentRuntime.executeUserRequest(
        'Remember that our sales team uses CRM for lead management.',
        { user: testUser, language: 'en' }
      );
      expect(saveRes.intent.name).toBe('REMEMBER_FACT');
      expect(saveRes.response.text).toContain('committed this fact to our persistent organizational memory');

      // Step B: Query fact in a new session
      const queryRes = await universalAgentRuntime.executeUserRequest(
        'Which module does our sales team use for lead management?',
        { user: testUser, language: 'en' }
      );

      expect(queryRes.intent.name).toBe('MEMORY_RETRIEVAL_QUERY');
      expect(queryRes.response.text).toContain('CRM');
    });

    test('Private memory of User A is NOT exposed to User B', async () => {
      // Save private memory for User A
      await memoryService.saveUserMemory(testUser.id, testUser.organizationId, {
        key: 'private_salary_note',
        content: 'My personal target bonus is 25 percent this quarter.',
        scope: 'PRIVATE',
      });

      // User B queries for User A's private memory
      const userBMemories = await memoryService.retrieveRelevantMemories(
        otherUser.id,
        otherUser.organizationId,
        'What is the personal target bonus?'
      );

      // Must NOT contain User A's private note
      const leakedNote = userBMemories.find((m) => m.content.includes('personal target bonus'));
      expect(leakedNote).toBeUndefined();
    });

    test('buildMemoryContext formats context cleanly for agent injection', () => {
      const sampleMemories = [
        {
          id: 'm1',
          key: 'crm',
          content: 'Our sales team uses CRM for lead management.',
          scope: 'ORG_SHARED',
          confidence: 0.9,
          relevanceScore: 0.85,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const contextString = memoryService.buildMemoryContext(sampleMemories);
      expect(contextString).toContain('[RELEVANT PERSISTENT CONTEXT FROM MEMORY]');
      expect(contextString).toContain('CRM');
    });
  });

  // ================================================================
  // 2. UNIFIED EMAIL & NOTIFICATION TESTS
  // ================================================================
  describe('2. Unified Email & Notification System', () => {
    test('generateMeetingInviteEmail builds complete HTML and plain text invites', () => {
      const inviteData: MeetingInviteData = {
        title: 'Q4 Enterprise Strategy Alignment',
        date: '2026-11-20',
        time: '14:30',
        timezone: 'IST (UTC+5:30)',
        duration: 45,
        attendees: [
          { name: 'Rohan Gupta', email: 'rohan@enterprise.com' },
          { name: 'Ananya Sen', email: 'ananya@enterprise.com' },
        ],
        organizer: 'Aarav Sharma',
        description: 'Review of annual ARR targets and multi-agent workflow adoption.',
        meetingLink: 'https://meet.flowmind.ai/q4-strategy',
      };

      const email = emailService.generateMeetingInviteEmail(inviteData);

      expect(email.subject).toContain('Q4 Enterprise Strategy Alignment');
      expect(email.htmlBody).toContain('FlowMind AI — Meeting Invitation');
      expect(email.htmlBody).toContain('Rohan Gupta');
      expect(email.htmlBody).toContain('45 Minutes');
      expect(email.htmlBody).toContain('https://meet.flowmind.ai/q4-strategy');
      expect(email.textBody).toContain('Review of annual ARR targets');
    });

    test('generateInvoiceReminderEmail incorporates 18% GST and overdue notice accurately', () => {
      const reminderData: InvoiceReminderData = {
        invoiceNumber: 'INV-2026-8831',
        customerName: 'TechCorp India Pvt Ltd',
        customerEmail: 'finance@techcorp.in',
        amount: 177000,
        taxAmount: 27000,
        dueDate: '2026-10-31',
        daysOverdue: 14,
        currency: '₹',
      };

      const email = emailService.generateInvoiceReminderEmail(reminderData);

      expect(email.subject).toContain('OVERDUE NOTICE');
      expect(email.subject).toContain('INV-2026-8831');
      expect(email.htmlBody).toContain('14 day(s)');
      expect(email.htmlBody).toContain('₹ 1,77,000');
      expect(email.htmlBody).toContain('27,000'); // GST component
      expect(email.textBody).toContain('TechCorp India');
    });

    test('sendEmail operates safely in PREVIEW_MODE without external network failure', async () => {
      const result = await emailService.sendEmail({
        to: 'client@company.com',
        subject: 'Test Notification',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.previewMode).toBe(true);
      expect(result.provider).toBe('PREVIEW_MODE');
      expect(result.messageId).toBeDefined();
    });
  });
});
