const { aiReasoningEngine } = require('./src/lib/ai/aiReasoningEngine');
const { intentEngine } = require('./src/lib/ai/intentEngine');

async function test() {
  const user = { id: 'USR-01', organizationId: 'ORG-01', role: 'ADMIN' };
  const query = 'Find customers with overdue invoices and calculate the total outstanding amount.';
  
  const plan = await aiReasoningEngine.analyzeAndPlan(query, {
    user,
    targetAgent: 'Finance',
    selectedAgentOverride: 'Finance',
    requestId: 'DEBUG-1',
  });

  console.log('Reasoning Plan:', JSON.stringify(plan, null, 2));
}

test().catch(console.error);
