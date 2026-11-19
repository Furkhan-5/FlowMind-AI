const fs = require('fs');

if (fs.existsSync('.env.local')) {
  try { process.loadEnvFile('.env.local'); } catch {}
}
if (fs.existsSync('.env')) {
  try { process.loadEnvFile('.env'); } catch {}
}

const { aiReasoningEngine } = require('../src/lib/ai/aiReasoningEngine');

const user = {
  id: 'USR-0001',
  name: 'FlowMind Admin',
  email: 'admin@flowmind.ai',
  role: 'ADMIN',
  organizationId: 'ORG-01',
  preferredLanguage: 'en'
};

async function testSingle() {
  console.log('--- Testing CEO Planning ---');
  const planCEO = await aiReasoningEngine.analyzeAndPlan(
    'Analyze our current business operations and identify three important risks.',
    {
      user,
      targetAgent: 'CEO',
      selectedAgentOverride: 'CEO'
    }
  );
  console.log('CEO Plan:', JSON.stringify(planCEO, null, 2));

  console.log('\n--- Testing Sales Planning ---');
  const planSales = await aiReasoningEngine.analyzeAndPlan(
    'Explain our current sales pipeline and identify the strongest opportunities.',
    {
      user,
      targetAgent: 'Sales',
      selectedAgentOverride: 'Sales'
    }
  );
  console.log('Sales Plan:', JSON.stringify(planSales, null, 2));
}

testSingle().catch(console.error);
