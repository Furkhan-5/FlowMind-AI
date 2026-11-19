const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runLiveValidation() {
  console.log('===============================================================');
  console.log('FLOWMIND AI — LIVE REGRESSION TEST (SALES & DOCUMENT AGENTS)');
  console.log('===============================================================\n');

  // Step 1: Login as Admin
  console.log('1. Authenticating as admin@flowmind.ai ...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@flowmind.ai', password: 'flowmind2026!' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with HTTP status ${loginRes.status}`);
  }

  const cookieHeader = loginRes.headers.get('set-cookie');
  const cookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  console.log('✅ Authenticated successfully.\n');

  // ---------------------------------------------------------------------------
  // TEST 1: Sales Agent Lead Creation with Deal Value 450,000
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: Sales Agent Deal Value Preservation ---');
  const salesQuery = 'Create a new lead for Tata Motors with deal value of 450000';
  console.log(`User Request: "${salesQuery}"`);

  const salesRes = await fetch('http://localhost:3000/api/agent/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({
      query: salesQuery,
      language: 'en',
      selectedAgentOverride: 'Sales',
    }),
  });

  if (!salesRes.ok) {
    throw new Error(`Sales agent request failed with HTTP ${salesRes.status}`);
  }

  const salesData = await salesRes.json();
  const salesText = salesData.result?.responseText || salesData.data?.response?.text || '';
  console.log('Sales Agent Response:');
  console.log(salesText);

  // Extract Lead ID
  const leadIdMatch = salesText.match(/`LEAD-\d+`/);
  if (!leadIdMatch) {
    throw new Error('FAILED: Lead ID not found in response!');
  }
  const leadId = leadIdMatch[0].replace(/`/g, '');
  console.log(`Extracted Lead ID: ${leadId}`);

  // Direct PostgreSQL check
  const dbLead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!dbLead) {
    throw new Error(`FAILED: Lead ID ${leadId} does NOT exist in PostgreSQL!`);
  }

  console.log('\nDirect PostgreSQL Record Verification:');
  console.log(`  Lead ID: ${dbLead.id}`);
  console.log(`  Company: ${dbLead.company}`);
  console.log(`  Value: ${dbLead.value} (Expected: 450000)`);
  console.log(`  Stage: ${dbLead.stage}`);

  if (dbLead.value !== 450000) {
    throw new Error(`FAILED: PostgreSQL lead value is ${dbLead.value}, expected 450000!`);
  }
  console.log('>>> TEST 1 PASS: Actual PostgreSQL record deal value is EXACTLY ₹4,50,000!\n');

  // Verify retrieval via API
  const apiLeadRes = await fetch(`http://localhost:3000/api/crm/leads/${leadId}`, {
    headers: { 'Cookie': cookie },
  });
  if (apiLeadRes.ok) {
    const apiLeadData = await apiLeadRes.json();
    console.log(`API Lead Retrieval: Company: ${apiLeadData.lead?.company}, Value: ₹${apiLeadData.lead?.value}`);
    if (apiLeadData.lead?.value !== 450000) {
      throw new Error(`FAILED: API retrieved value is ${apiLeadData.lead?.value}, expected 450000!`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Document Agent Intent Mismatch Correction
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: Document Agent Intent & Generation ---');
  const docQuery = 'Generate and export a financial operations summary document';
  console.log(`User Request: "${docQuery}"`);

  // Test 2A: With Document override
  const docRes = await fetch('http://localhost:3000/api/agent/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({
      query: docQuery,
      language: 'en',
      selectedAgentOverride: 'Document',
    }),
  });

  if (!docRes.ok) {
    throw new Error(`Document agent request failed with HTTP ${docRes.status}`);
  }

  const docData = await docRes.json();
  const docIntent = docData.result?.intentAction || docData.result?.universalResponse?.intent?.name;
  const docAgent = docData.result?.targetAgent || docData.result?.universalResponse?.agent?.id;
  console.log(`Document Test 2A Results:`);
  console.log(`  Routed Agent: ${docAgent}`);
  console.log(`  Interpreted Intent: ${docIntent}`);
  console.log(`  Artifacts Generated: ${docData.result?.artifacts?.length || 0}`);

  if (docIntent !== 'DOCUMENT_GENERATE_REPORT') {
    throw new Error(`FAILED: Expected DOCUMENT_GENERATE_REPORT, got ${docIntent}!`);
  }
  if (docAgent !== 'Document') {
    throw new Error(`FAILED: Expected Document agent, got ${docAgent}!`);
  }

  // Test 2B: Pure Natural-Language Routing (no agent override)
  console.log('\nDocument Test 2B: Pure Natural-Language Routing (No Override)...');
  const pureDocRes = await fetch('http://localhost:3000/api/agent/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({
      query: docQuery,
      language: 'en',
    }),
  });

  const pureDocData = await pureDocRes.json();
  const pureDocIntent = pureDocData.result?.intentAction || pureDocData.result?.universalResponse?.intent?.name;
  const pureDocAgent = pureDocData.result?.targetAgent || pureDocData.result?.universalResponse?.agent?.id;
  console.log(`  Pure Router Agent: ${pureDocAgent}`);
  console.log(`  Pure Router Intent: ${pureDocIntent}`);

  if (pureDocIntent !== 'DOCUMENT_GENERATE_REPORT') {
    throw new Error(`FAILED: Pure router classified as ${pureDocIntent} instead of DOCUMENT_GENERATE_REPORT!`);
  }
  if (pureDocAgent !== 'Document') {
    throw new Error(`FAILED: Pure router routed to ${pureDocAgent} instead of Document agent!`);
  }
  console.log('>>> TEST 2 PASS: Document Agent intent and generation verified completely!\n');

  console.log('===============================================================');
  console.log('ALL REGRESSION TESTS PASSED (100% VERIFIED)');
  console.log('===============================================================');

  await prisma.$disconnect();
}

runLiveValidation().catch(async (err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  await prisma.$disconnect();
  process.exit(1);
});
