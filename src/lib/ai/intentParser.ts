import { AgentType, LanguageCode } from '@/types';

export interface CanonicalIntent {
  action: string;
  targetAgent: AgentType;
  confidence: number;
  parameters: Record<string, any>;
  summaryText: string;
}

export function parseCanonicalBusinessIntent(text: string, detectedLang: LanguageCode): CanonicalIntent {
  const lower = text.toLowerCase();

  // 1. Sales & Scheduling Intent (Telugu: మీటింగ్ / రేపు, Hindi: मीटिंग, English: meeting / lead)
  if (
    lower.includes('meeting') ||
    lower.includes('मीटिंग') ||
    lower.includes('మీటింగ్') ||
    lower.includes('கூட்டம்') ||
    lower.includes('ಸಭೆ') ||
    lower.includes('മീറ്റിംഗ്') ||
    lower.includes('lead')
  ) {
    return {
      action: 'SCHEDULE_SALES_MEETING',
      targetAgent: 'Sales',
      confidence: 0.96,
      parameters: { time: 'Tomorrow 10:00 AM IST', type: 'Sales Review', attendees: 4 },
      summaryText: 'Scheduled sales meeting and updated CRM lead pipeline.',
    };
  }

  // 2. Invoicing & Finance Intent (Telugu: ఇన్వాయిస్, Hindi: इनवॉइस, English: invoice / payment)
  if (
    lower.includes('invoice') ||
    lower.includes('इनवॉइस') ||
    lower.includes('ఇన్వాయిస్') ||
    lower.includes('இன்வாய்ஸ்') ||
    lower.includes('ಇನ್‌ವಾಯ್ಸ್') ||
    lower.includes('ഇൻവോയ്സ്') ||
    lower.includes('payroll') ||
    lower.includes('tax')
  ) {
    return {
      action: 'GENERATE_CLIENT_INVOICE',
      targetAgent: 'Finance',
      confidence: 0.98,
      parameters: { client: 'Apex Tech Solutions', amount: 125000, taxRate: '18% GST' },
      summaryText: 'Calculated tax breakdown and generated invoice PDF draft.',
    };
  }

  // 3. HR & Leave Approval Intent
  if (lower.includes('leave') || lower.includes('employee') || lower.includes('छुट्टी') || lower.includes('సెలవు')) {
    return {
      action: 'APPROVE_EMPLOYEE_LEAVE',
      targetAgent: 'HR',
      confidence: 0.92,
      parameters: { employee: 'Rajesh Kumar', leaveDays: 2, status: 'APPROVED' },
      summaryText: 'Verified leave balance and processed HR approval.',
    };
  }

  // 4. Inventory & Stock Alert Intent
  if (lower.includes('stock') || lower.includes('inventory') || lower.includes('ബാക്കി')) {
    return {
      action: 'ANALYZE_INVENTORY_STOCK',
      targetAgent: 'Document',
      confidence: 0.90,
      parameters: { sku: 'SKU-8802', reorderThreshold: 15, currentQty: 4 },
      summaryText: 'Detected low stock levels and generated purchase order draft.',
    };
  }

  // Default Executive Intent
  return {
    action: 'EXECUTIVE_QUERY',
    targetAgent: 'CEO',
    confidence: 0.88,
    parameters: { query: text },
    summaryText: 'Processed request across Analytics and Knowledge RAG agents.',
  };
}
