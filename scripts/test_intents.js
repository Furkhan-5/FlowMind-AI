const { intentEngine } = require('../src/lib/ai/intentEngine');

const queries = [
  { agent: 'CEO', text: 'Analyze our current business operations and identify three important risks.' },
  { agent: 'Finance', text: 'Retrieve overdue invoices and calculate the total outstanding balance.' },
  { agent: 'Sales', text: 'Explain our current sales pipeline and identify the strongest opportunities.' },
  { agent: 'Marketing', text: 'Create a marketing strategy for FlowMind AI targeting SMEs.' },
];

for (const q of queries) {
  const res = intentEngine.analyzeIntent(q.text, { selectedAgentOverride: q.agent });
  console.log(`[${q.agent}] Intent: ${res.primaryIntent}, TargetAgent: ${res.targetAgent}, Tools: [${res.requiredTools.join(', ')}]`);
}
