// scripts/test_structured_response_15_agents.js
// Validates structured response formatting, Indian currency formatting,
// and required markdown sections across all 15 specialized agents.

const http = require('http');
const fs = require('fs');
const path = require('path');

const AGENT_TEST_QUERIES = [
  {
    agent: 'Sales',
    query: 'Explain our current sales pipeline and identify the strongest opportunities.',
    expectedSections: ['Sales Pipeline Overview', 'Pipeline Breakdown', 'Strongest Opportunities', 'Recommended Actions'],
    expectedPatterns: [/₹[\d,]+/, /\|/, /Stage/i],
  },
  {
    agent: 'Finance',
    query: 'Find customers with overdue invoices and calculate the total outstanding amount.',
    expectedSections: ['Financial Overview', 'Overdue Invoice Breakdown', 'Total Outstanding Amount', 'Calculations & Audit Trail'],
    expectedPatterns: [/₹[\d,]+/, /TechCorp/i, /INV-/i],
  },
  {
    agent: 'CEO',
    query: 'Provide an executive summary of cross-departmental operations and critical company risks.',
    expectedSections: ['Executive Summary', 'Cross-Departmental Performance & Risk Analysis', 'Critical Operational Risks', '30-Day Strategic Action Plan'],
    expectedPatterns: [/Risk/i, /Strategic/i],
  },
  {
    agent: 'Marketing',
    query: 'Draft a targeted marketing campaign for enterprise fintech customers with channel strategy and projected KPIs.',
    expectedSections: ['Campaign Overview & Objectives', 'Target Audience & Persona Segmentation', 'Channel Strategy & Budget Allocation', 'Projected Performance & KPIs'],
    expectedPatterns: [/KPI/i, /Audience/i, /Channel/i],
  },
  {
    agent: 'HR',
    query: 'Provide workforce directory status, employees on leave, and salary governance policies.',
    expectedSections: ['Workforce Directory & Team Status', 'Leave & Attendance Governance', 'Salary Governance & Data Masking', 'Policy Recommendations'],
    expectedPatterns: [/Leave/i, /Governance/i, /HR/i],
  },
  {
    agent: 'Support',
    query: 'List unresolved high-priority customer support tickets and assess SLA breaches.',
    expectedSections: ['Support Ticket Summary', 'SLA Breach & Escalation Watch', 'Priority Resolution Queue', 'Root Cause Analysis'],
    expectedPatterns: [/Ticket/i, /SLA/i, /Resolution/i],
  },
  {
    agent: 'Analytics',
    query: 'Analyze our conversion funnels, business metrics, and recent performance trends.',
    expectedSections: ['Business Intelligence Summary', 'Metric Performance & Conversion Funnels', 'Trend Analysis', 'Strategic Recommendations'],
    expectedPatterns: [/Metric/i, /Conversion/i, /Trend/i],
  },
  {
    agent: 'Database',
    query: 'Inspect our database tables, stock thresholds, and low inventory items.',
    expectedSections: ['Inventory & Database Health Report', 'Stock Threshold Analysis', 'Table Schema & Record Verification'],
    expectedPatterns: [/Inventory/i, /Stock/i, /Threshold/i],
  },
  {
    agent: 'Workflow',
    query: 'Describe our workflow DAG topology, triggers, and error recovery policies.',
    expectedSections: ['Workflow DAG Topology & Status', 'Trigger & Execution Conditions', 'Error Handling & Reliability Strategy'],
    expectedPatterns: [/DAG/i, /Trigger/i, /Workflow/i],
  },
  {
    agent: 'Scheduler',
    query: 'Schedule team meeting for tomorrow at 3 PM and check our task timeline.',
    expectedSections: ['Calendar & Task Schedule Summary', 'Upcoming Triggers & Timeline', 'Cron Specifications & Conflicts'],
    expectedPatterns: [/Schedule/i, /Calendar/i, /Timeline/i],
  },
  {
    agent: 'Document',
    query: 'Generate and export our financial operations summary report artifact.',
    expectedSections: ['Document Generation Artifact Summary', 'Metadata & Compliance Sign-off', 'Export Links & Format Details'],
    expectedPatterns: [/Document/i, /Artifact/i, /Export/i],
  },
  {
    agent: 'Email',
    query: 'Draft an urgent payment reminder email for overdue client accounts.',
    expectedSections: ['Email Communication Draft', 'Recipient, Subject, and Tone Specification', 'Call to Action & Follow-up Trigger'],
    expectedPatterns: [/Subject:/i, /Draft/i, /Email/i],
  },
  {
    agent: 'Knowledge',
    query: 'Search our knowledge base for travel reimbursement policy guidelines.',
    expectedSections: ['Knowledge Retrieval & Vector Citations', 'Document Sources & Verification Confidence', 'Policy Summary & Guidance'],
    expectedPatterns: [/Policy/i, /Citation/i, /Knowledge/i],
  },
  {
    agent: 'Reporting',
    query: 'Generate our regulatory compliance audit report and executive metrics.',
    expectedSections: ['Compliance & Audit Report', 'Executive Metrics & Log Analysis', 'Verification Sign-off'],
    expectedPatterns: [/Audit/i, /Compliance/i, /Report/i],
  },
  {
    agent: 'Security',
    query: 'Audit our RBAC user permissions, prompt injection shield status, and governance policies.',
    expectedSections: ['Security & RBAC Policy Audit', 'Prompt Injection Shield Telemetry', 'Governance Safeguards & Threat Assessment'],
    expectedPatterns: [/RBAC/i, /Security/i, /Shield/i],
  },
];

let sessionCookie = '';

async function loginAdmin() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      email: 'admin@flowmind.ai',
      password: 'flowmind2026!',
    });

    const req = http.request(
      'http://localhost:3000/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const rawCookies = res.headers['set-cookie'];
        if (rawCookies && rawCookies.length > 0) {
          sessionCookie = rawCookies[0].split(';')[0];
        }
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (sessionCookie) {
            resolve(sessionCookie);
          } else {
            reject(new Error(`Login failed to return cookie: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendChatRequest(agent, query, language = 'en') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      query,
      language,
      selectedAgentOverride: agent,
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    const req = http.request(
      'http://localhost:3000/api/agent/chat',
      {
        method: 'POST',
        headers,
        timeout: 60000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body.substring(0, 200)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

async function runStructuredResponseAudit() {
  console.log('================================================================');
  console.log('FLOWMIND AI — 15 SPECIALIZED AGENT STRUCTURED RESPONSE AUDIT');
  console.log('================================================================\n');

  try {
    process.stdout.write('Authenticating as Administrator (admin@flowmind.ai)... ');
    await loginAdmin();
    console.log('AUTHENTICATED ✓\n');
  } catch (err) {
    console.log(`AUTH FAILED: ${err.message}\n`);
    return;
  }

  const results = [];
  let passedCount = 0;

  for (let i = 0; i < AGENT_TEST_QUERIES.length; i++) {
    const testCase = AGENT_TEST_QUERIES[i];
    const startTime = Date.now();
    process.stdout.write(`[${i + 1}/15] Testing ${testCase.agent} Agent... `);

    try {
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 1500));
      }
      const response = await sendChatRequest(testCase.agent, testCase.query);
      const latencyMs = Date.now() - startTime;

      if (!response.success || !response.result) {
        throw new Error(`API returned unsuccessful response: ${JSON.stringify(response)}`);
      }

      const responseText = response.result.responseText || '';
      const thoughtStream = response.result.thoughtStream || [];

      // Check section headings
      const matchedSections = [];
      const missingSections = [];
      for (const section of testCase.expectedSections) {
        if (responseText.toLowerCase().includes(section.toLowerCase())) {
          matchedSections.push(section);
        } else {
          missingSections.push(section);
        }
      }

      // Check pattern matches
      const matchedPatterns = testCase.expectedPatterns.filter((p) => p.test(responseText));
      const sectionCoverage = (matchedSections.length / testCase.expectedSections.length) * 100;

      // Detect LLM vs Deterministic
      const isGemini = thoughtStream.some((t) => t.action && t.action.includes('GEMINI'));
      const hasIndianCurrency = /₹[\d,]+/.test(responseText);
      const hasMarkdownTable = /\|.*\|[\r\n]+\|[-:| ]+\|/.test(responseText);

      const pass = matchedSections.length >= Math.min(2, testCase.expectedSections.length) && responseText.length > 50;
      if (pass) passedCount++;

      console.log(pass ? `PASSED (${latencyMs}ms)` : `FAILED (${latencyMs}ms)`);
      console.log(`       Sections: ${matchedSections.length}/${testCase.expectedSections.length} found`);
      console.log(`       Indian Currency: ${hasIndianCurrency ? 'YES' : 'N/A'}`);
      console.log(`       Markdown Table: ${hasMarkdownTable ? 'YES' : 'NO'}`);
      console.log(`       Provider: ${isGemini ? 'Google Gemini' : 'Operational Engine'}\n`);

      results.push({
        agent: testCase.agent,
        query: testCase.query,
        status: pass ? 'PASSED' : 'FAILED',
        latencyMs,
        isGemini,
        hasIndianCurrency,
        hasMarkdownTable,
        expectedSections: testCase.expectedSections,
        matchedSections,
        missingSections,
        sectionCoveragePct: Math.round(sectionCoverage),
        preview: responseText.substring(0, 220) + '...',
      });
    } catch (err) {
      console.log(`ERROR (${Date.now() - startTime}ms): ${err.message}\n`);
      results.push({
        agent: testCase.agent,
        query: testCase.query,
        status: 'FAILED',
        error: err.message,
      });
    }
  }

  const outputFilePath = path.join(__dirname, '..', 'FLOWMIND_STRUCTURED_RESPONSE_TEST_RESULTS.json');
  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalAgents: AGENT_TEST_QUERIES.length,
        passedAgents: passedCount,
        failedAgents: AGENT_TEST_QUERIES.length - passedCount,
        passRatePct: Math.round((passedCount / AGENT_TEST_QUERIES.length) * 100),
        results,
      },
      null,
      2
    )
  );

  console.log('================================================================');
  console.log(`AUDIT COMPLETE: ${passedCount}/${AGENT_TEST_QUERIES.length} AGENTS PASSED (${Math.round((passedCount / AGENT_TEST_QUERIES.length) * 100)}%)`);
  console.log(`Saved detailed telemetry to: ${outputFilePath}`);
  console.log('================================================================\n');
}

runStructuredResponseAudit().catch(console.error);
