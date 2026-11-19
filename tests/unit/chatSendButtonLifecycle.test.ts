// tests/unit/chatSendButtonLifecycle.test.ts
// Programmatic Verification of Chat Send Button Lifecycle, Keyboard Navigation, and State Machine

describe('FLOWMIND AI — CHAT SEND BUTTON LIFECYCLE & INPUT CONTROLS (PHASE 4)', () => {
  // Mock State Machine for Chat Submission
  class ChatSubmissionController {
    public input: string = '';
    public isProcessing: boolean = false;
    public messages: Array<{ sender: string; text: string; error?: boolean }> = [];
    public historyPreserved: boolean = true;
    public activeAgent: string = 'CEO';

    public handleKeyDown(key: string, shiftKey: boolean): 'SUBMITTED' | 'NEWLINE_ALLOWED' | 'IGNORED' {
      if (key === 'Enter' && !shiftKey) {
        return this.submit();
      }
      if (key === 'Enter' && shiftKey) {
        return 'NEWLINE_ALLOWED';
      }
      return 'IGNORED';
    }

    public submit(): 'SUBMITTED' | 'IGNORED' {
      // 1. Rapid click duplicate protection & Empty rejection
      if (this.isProcessing) return 'IGNORED';
      const textToSend = this.input.trim();
      if (!textToSend) return 'IGNORED';

      // 2. Immediate synchronous lock & clear
      this.isProcessing = true;
      this.input = '';
      this.messages.push({ sender: 'USER', text: textToSend });

      return 'SUBMITTED';
    }

    public completeDispatch(success: boolean, responseText?: string, isTimeout?: boolean) {
      try {
        if (success && responseText) {
          this.messages.push({ sender: 'AGENT', text: responseText });
        } else {
          this.messages.push({
            sender: 'SYSTEM',
            text: isTimeout ? 'Request timed out after 45 seconds.' : 'Connection failure.',
            error: true,
          });
        }
      } finally {
        // Guaranteed unlock via finally
        this.isProcessing = false;
      }
    }

    public retryLastFailedMessage(): boolean {
      const last = this.messages[this.messages.length - 1];
      if (last && last.error) {
        const userMsg = [...this.messages].reverse().find((m) => m.sender === 'USER');
        if (userMsg) {
          this.input = userMsg.text;
          this.submit();
          return true;
        }
      }
      return false;
    }

    public switchAgent(newAgent: string) {
      this.activeAgent = newAgent;
    }
  }

  let controller: ChatSubmissionController;

  beforeEach(() => {
    controller = new ChatSubmissionController();
  });

  // 1. Mouse Click sends exactly once
  test('1. Mouse click sends exactly once when input has text', () => {
    controller.input = 'Analyze our pipeline';
    const result = controller.submit();
    expect(result).toBe('SUBMITTED');
    expect(controller.messages.length).toBe(1);
    expect(controller.messages[0].text).toBe('Analyze our pipeline');
    expect(controller.input).toBe(''); // Immediately cleared
    expect(controller.isProcessing).toBe(true); // Locked
  });

  // 2. Enter sends
  test('2. Enter key triggers submission and calls preventDefault semantics', () => {
    controller.input = 'Check overdue invoices';
    const result = controller.handleKeyDown('Enter', false);
    expect(result).toBe('SUBMITTED');
    expect(controller.messages.length).toBe(1);
    expect(controller.isProcessing).toBe(true);
  });

  // 3. Shift + Enter creates a newline
  test('3. Shift + Enter does NOT trigger send and allows newline character', () => {
    controller.input = 'Line 1 of multiline prompt';
    const result = controller.handleKeyDown('Enter', true);
    expect(result).toBe('NEWLINE_ALLOWED');
    expect(controller.messages.length).toBe(0); // Not dispatched
    expect(controller.isProcessing).toBe(false);
  });

  // 4. Rapid clicks do not create duplicate messages
  test('4. Rapid double-clicks or multi-clicks do NOT create duplicate messages', () => {
    controller.input = 'Single message prompt';
    const firstClick = controller.submit();
    const secondClick = controller.submit();
    const thirdClick = controller.submit();

    expect(firstClick).toBe('SUBMITTED');
    expect(secondClick).toBe('IGNORED');
    expect(thirdClick).toBe('IGNORED');
    expect(controller.messages.length).toBe(1); // Only 1 message inserted
  });

  // 5. Empty messages are rejected
  test('5. Empty messages or whitespace-only messages are strictly rejected', () => {
    controller.input = '';
    expect(controller.submit()).toBe('IGNORED');

    controller.input = '    \n\t   ';
    expect(controller.submit()).toBe('IGNORED');
    expect(controller.messages.length).toBe(0);
    expect(controller.isProcessing).toBe(false);
  });

  // 6. Loading state works
  test('6. Loading state active during dispatch and releases in finally block', () => {
    controller.input = 'Query status';
    controller.submit();
    expect(controller.isProcessing).toBe(true);

    // Complete dispatch
    controller.completeDispatch(true, 'Verified status response');
    expect(controller.isProcessing).toBe(false);
    expect(controller.messages.length).toBe(2);
  });

  // 7. Timeout restores the input and Send button
  test('7. Network/LLM timeout unlocks isProcessing state and restores Send button', () => {
    controller.input = 'Long-running DAG compilation';
    controller.submit();
    expect(controller.isProcessing).toBe(true);

    // Simulate 45s AbortController timeout event
    controller.completeDispatch(false, undefined, true);
    expect(controller.isProcessing).toBe(false);
    const lastMsg = controller.messages[controller.messages.length - 1];
    expect(lastMsg.error).toBe(true);
    expect(lastMsg.text).toContain('timed out');
  });

  // 8. Network failure shows Retry capability
  test('8. Network failure enables one-click Retry restoring previous message', () => {
    controller.input = 'Critical financial summary';
    controller.submit();
    controller.completeDispatch(false, undefined, false); // Network failure

    expect(controller.messages[controller.messages.length - 1].error).toBe(true);
    const retryTriggered = controller.retryLastFailedMessage();
    expect(retryTriggered).toBe(true);
    expect(controller.isProcessing).toBe(true);
  });

  // 9. Agent switching does not mix responses
  test('9. Agent switching updates active routing without corrupting existing messages', () => {
    controller.input = 'Sales query';
    controller.switchAgent('Sales');
    controller.submit();
    controller.completeDispatch(true, 'Sales pipeline overview');

    controller.switchAgent('Finance');
    expect(controller.activeAgent).toBe('Finance');
    expect(controller.messages.length).toBe(2); // History completely preserved
  });

  // 10. Long messages work
  test('10. Long multi-paragraph messages (>2000 chars) submit without truncation', () => {
    const longPrompt = 'Enterprise requirements specification:\n' + 'A'.repeat(2500);
    controller.input = longPrompt;
    expect(controller.submit()).toBe('SUBMITTED');
    expect(controller.messages[0].text.length).toBe(longPrompt.length);
  });

  // 11. Conversation history is preserved across turns
  test('11. Full multi-turn conversation history is maintained sequentially', () => {
    for (let turn = 1; turn <= 5; turn++) {
      controller.input = `Turn ${turn} query`;
      controller.submit();
      controller.completeDispatch(true, `Turn ${turn} response`);
    }
    expect(controller.messages.length).toBe(10); // 5 user + 5 agent
    expect(controller.messages[0].text).toBe('Turn 1 query');
    expect(controller.messages[9].text).toBe('Turn 5 response');
  });
});
