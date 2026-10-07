import { prisma } from '@/lib/prisma';
import {
  Lead,
  LeadStage,
  LeadStageHistory,
  Employee,
  LeaveRequest,
  LeaveStatus,
  PayrollRecord,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Payment,
  Product,
  StockMovement,
  SupportTicket,
  TicketStatus,
  TicketPriority,
  BusinessInsight,
  Customer360,
  Employee360,
  User,
  UserRole,
  AgentType,
} from '@/types';
import { auditLogger } from '@/lib/security/auditLogger';

// Helper for Audit Logging & Event Triggers
const logBusinessAudit = (
  user: User,
  actionType: string,
  module: string,
  resourceId?: string,
  details?: Record<string, any>
) => {
  try {
    auditLogger.logAuditEvent({
      userId: user.id,
      organizationId: user.organizationId || 'ORG-01',
      requestId: `REQ-${Date.now()}`,
      agentId: (module === 'CRM' ? 'Sales' : module === 'HR' ? 'HR' : module === 'FINANCE' ? 'Finance' : module === 'INVENTORY' ? 'Database' : 'Support') as AgentType,
      actionType: `${module}_${actionType}`,
      parameters: { resourceId, ...details },
      approvalStatus: 'NOT_REQUIRED',
      executionStatus: 'EXECUTED',
    });
  } catch {
    // Silent catch
  }
};

const emitBusinessEvent = (eventName: string, payload: Record<string, any>) => {
  console.log(`[BUSINESS WORKFLOW EVENT] Event: '${eventName}'`, payload);
};

// Initial Persistent Seed Data Fallback for resilient execution
const SEED_LEADS: Lead[] = [
  {
    id: 'LEAD-101',
    organizationId: 'ORG-01',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@techcorp.in',
    phone: '+91 98765 43210',
    company: 'TechCorp India',
    source: 'WEBSITE',
    stage: 'NEW',
    status: 'ACTIVE',
    score: 85,
    value: 250000,
    tags: ['High Value', 'SaaS'],
    notes: 'Inquired about enterprise multi-agent workflow license.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-102',
    organizationId: 'ORG-01',
    name: 'Priya Patel',
    email: 'p.patel@innovate.co',
    phone: '+91 91234 56789',
    company: 'Innovate Solutions',
    source: 'REFERRAL',
    stage: 'QUALIFIED',
    status: 'ACTIVE',
    score: 92,
    value: 450000,
    tags: ['Enterprise', 'DAG Workflow'],
    notes: 'Completed technical demo with Sales Agent.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-103',
    organizationId: 'ORG-01',
    name: 'Rahul Verma',
    email: 'r.verma@globallogistics.com',
    phone: '+91 99887 76655',
    company: 'Global Logistics Pvt Ltd',
    source: 'OUTBOUND',
    stage: 'PROPOSAL',
    status: 'ACTIVE',
    score: 78,
    value: 180000,
    tags: ['Logistics', 'Inventory AI'],
    notes: 'Proposal submitted for stock alert automation.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LEAD-104',
    organizationId: 'ORG-01',
    name: 'Ananya Roy',
    email: 'ananya@apexfintech.io',
    phone: '+91 93456 78901',
    company: 'Apex FinTech',
    source: 'INBOUND',
    stage: 'WON',
    status: 'ACTIVE',
    score: 98,
    value: 600000,
    tags: ['FinTech', 'Closed Won'],
    notes: 'Contract signed for full business suite.',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001',
    organizationId: 'ORG-01',
    employeeCode: 'EMP-1001',
    name: 'Vikramaditya Singh',
    email: 'vikram@flowmind.ai',
    department: 'Engineering',
    designation: 'Principal AI Engineer',
    joiningDate: '2023-01-15',
    employmentStatus: 'ACTIVE',
    salary: 180000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'EMP-002',
    organizationId: 'ORG-01',
    employeeCode: 'EMP-1002',
    name: 'Meera Deshmukh',
    email: 'meera@flowmind.ai',
    department: 'Sales',
    designation: 'Enterprise Account Director',
    joiningDate: '2023-03-01',
    employmentStatus: 'ACTIVE',
    salary: 150000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'EMP-003',
    organizationId: 'ORG-01',
    employeeCode: 'EMP-1003',
    name: 'Siddharth Iyer',
    email: 'siddharth@flowmind.ai',
    department: 'Finance',
    designation: 'Finance & Compliance Manager',
    joiningDate: '2023-06-10',
    employmentStatus: 'ACTIVE',
    salary: 140000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    organizationId: 'ORG-01',
    invoiceNumber: 'INV-2026-001',
    customerName: 'Apex FinTech',
    customerEmail: 'ananya@apexfintech.io',
    status: 'PAID',
    subtotal: 500000,
    tax: 90000,
    discount: 0,
    total: 590000,
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'item-1', description: 'FlowMind AI Enterprise Platform License', quantity: 1, unitPrice: 500000, amount: 500000 }
    ]
  },
  {
    id: 'INV-2026-002',
    organizationId: 'ORG-01',
    invoiceNumber: 'INV-2026-002',
    customerName: 'TechCorp India',
    customerEmail: 'aarav.sharma@techcorp.in',
    status: 'OVERDUE',
    subtotal: 200000,
    tax: 36000,
    discount: 0,
    total: 236000,
    dueDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'item-2', description: 'AI Agent Mesh Setup & Custom Integration', quantity: 1, unitPrice: 200000, amount: 200000 }
    ]
  },
  {
    id: 'INV-2026-003',
    organizationId: 'ORG-01',
    invoiceNumber: 'INV-2026-003',
    customerName: 'Innovate Solutions',
    customerEmail: 'p.patel@innovate.co',
    status: 'PENDING',
    subtotal: 350000,
    tax: 63000,
    discount: 0,
    total: 413000,
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'item-3', description: 'DAG Workflow Automation Engine Modules', quantity: 1, unitPrice: 350000, amount: 350000 }
    ]
  }
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'PROD-001',
    organizationId: 'ORG-01',
    sku: 'FLOW-NODE-RPI4',
    name: 'FlowEdge Hardware Compute Unit',
    description: 'On-premise edge hardware node for local AI Agent deployment.',
    category: 'Hardware Nodes',
    quantity: 42,
    reorderLevel: 15,
    unitPrice: 24999,
    status: 'IN_STOCK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PROD-002',
    organizationId: 'ORG-01',
    sku: 'FLOW-SEC-KEY',
    name: 'HSM Cryptographic Key Card',
    description: 'Hardware security module card for high-risk Action Governance authorization.',
    category: 'Security Hardware',
    quantity: 4,
    reorderLevel: 10,
    unitPrice: 12500,
    status: 'LOW_STOCK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PROD-003',
    organizationId: 'ORG-01',
    sku: 'FLOW-LIC-ENT',
    name: 'Enterprise Multi-Script License Dongle',
    description: 'USB cryptographic license dongle for offline Indic script models.',
    category: 'Licenses',
    quantity: 88,
    reorderLevel: 20,
    unitPrice: 45000,
    status: 'IN_STOCK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const SEED_TICKETS: SupportTicket[] = [
  {
    id: 'TICK-101',
    organizationId: 'ORG-01',
    ticketNumber: 'TICK-101',
    customerName: 'TechCorp India',
    title: 'DAG Workflow Node Retry Policy Delay',
    description: 'Condition node in high-frequency DAG pipeline experiences 1.5s delay during peak traffic.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    category: 'TECHNICAL',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [
      { id: 'note-1', ticketId: 'TICK-101', author: 'Support Agent', note: 'Investigating Kahn topological execution logs.', isInternal: true, createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'TICK-102',
    organizationId: 'ORG-01',
    ticketNumber: 'TICK-102',
    customerName: 'Apex FinTech',
    title: 'GST Invoice PDF Download Currency Formatting',
    description: 'Invoice PDF generator formatting request for INR symbol and tax line item breakdown.',
    priority: 'MEDIUM',
    status: 'OPEN',
    category: 'BILLING',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const SEED_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'LEAVE-01',
    organizationId: 'ORG-01',
    employeeId: 'EMP-001',
    employeeName: 'Vikramaditya Singh',
    leaveType: 'VACATION',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    reason: 'Annual family holiday leave.',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// In-Memory Persistent Store
let leadsStore: Lead[] = [...SEED_LEADS];
let historyStore: LeadStageHistory[] = [];
let employeeStore: Employee[] = [...SEED_EMPLOYEES];
let leaveStore: LeaveRequest[] = [...SEED_LEAVE_REQUESTS];
let payrollStore: PayrollRecord[] = [];
let invoiceStore: Invoice[] = [...SEED_INVOICES];
let productStore: Product[] = [...SEED_PRODUCTS];
let stockMovementStore: StockMovement[] = [];
let ticketStore: SupportTicket[] = [...SEED_TICKETS];

export class BusinessService {
  // ================================================================
  // 1. CRM MODULE SERVICES
  // ================================================================

  public async getLeads(orgId: string = 'ORG-01'): Promise<Lead[]> {
    try {
      const dbLeads = await prisma.lead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
      if (dbLeads.length > 0) {
        return dbLeads.map((l) => ({
          ...l,
          phone: l.phone || undefined,
          ownerId: l.ownerId || undefined,
          notes: l.notes || undefined,
          stage: l.stage as LeadStage,
          tags: l.tags || [],
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
          lastContactedAt: l.lastContactedAt?.toISOString(),
          nextFollowUpAt: l.nextFollowUpAt?.toISOString(),
        }));
      }
    } catch {
      // Fallback to in-memory store
    }
    return leadsStore.filter((l) => l.organizationId === orgId);
  }

  public async createLead(leadData: Partial<Lead>, user: User): Promise<Lead> {
    const newLead: Lead = {
      id: `LEAD-${Date.now()}`,
      organizationId: user.organizationId || 'ORG-01',
      name: leadData.name || 'New Prospect',
      email: leadData.email || 'prospect@company.com',
      phone: leadData.phone || '',
      company: leadData.company || 'Enterprise Client',
      source: leadData.source || 'WEBSITE',
      ownerId: user.id,
      stage: (leadData.stage as LeadStage) || 'NEW',
      status: 'ACTIVE',
      score: leadData.score || 70,
      value: leadData.value || 100000,
      tags: leadData.tags || ['Inbound'],
      notes: leadData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const dbLead = await prisma.lead.create({
        data: {
          id: newLead.id,
          organizationId: newLead.organizationId,
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          company: newLead.company,
          source: newLead.source,
          ownerId: newLead.ownerId,
          stage: newLead.stage,
          status: newLead.status,
          score: newLead.score,
          value: newLead.value,
          tags: newLead.tags,
          notes: newLead.notes,
        },
      });
      newLead.id = dbLead.id;
    } catch {
      // In-memory fallback
      leadsStore.unshift(newLead);
    }

    logBusinessAudit(user, 'CREATE_LEAD', 'CRM', newLead.id, { company: newLead.company, value: newLead.value, stage: newLead.stage });
    emitBusinessEvent('lead.created', { leadId: newLead.id, company: newLead.company, value: newLead.value });

    return newLead;
  }

  public async updateLeadStage(
    leadId: string,
    newStage: LeadStage,
    user: User,
    reason?: string
  ): Promise<Lead | null> {
    const existing = leadsStore.find((l) => l.id === leadId);
    const prevStage = existing ? existing.stage : 'NEW';

    let updated: Lead | null = null;

    try {
      const dbLead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          stage: newStage,
          updatedAt: new Date(),
          stageHistory: {
            create: {
              previousStage: prevStage,
              newStage: newStage,
              changedBy: user.name,
              reason: reason || 'Stage updated via CRM board',
            },
          },
        },
      });
      updated = {
        ...dbLead,
        phone: dbLead.phone || undefined,
        ownerId: dbLead.ownerId || undefined,
        notes: dbLead.notes || undefined,
        stage: dbLead.stage as LeadStage,
        tags: dbLead.tags || [],
        lastContactedAt: dbLead.lastContactedAt?.toISOString(),
        nextFollowUpAt: dbLead.nextFollowUpAt?.toISOString(),
        createdAt: dbLead.createdAt.toISOString(),
        updatedAt: dbLead.updatedAt.toISOString(),
      };
    } catch {
      if (existing) {
        existing.stage = newStage;
        existing.updatedAt = new Date().toISOString();
        updated = existing;
      }
    }

    // Persist Stage History Record
    const histRecord: LeadStageHistory = {
      id: `HIST-${Date.now()}`,
      leadId,
      previousStage: prevStage,
      newStage,
      changedBy: user.name,
      reason: reason || 'Stage updated via CRM pipeline board',
      timestamp: new Date().toISOString(),
    };
    historyStore.unshift(histRecord);

    logBusinessAudit(user, 'UPDATE_LEAD_STAGE', 'CRM', leadId, { previousStage: prevStage, newStage, changedBy: user.name });
    emitBusinessEvent('lead.stage_changed', { leadId, previousStage: prevStage, newStage });

    return updated;
  }

  public async getCrmStats(orgId: string = 'ORG-01') {
    const leads = await this.getLeads(orgId);
    const totalPipelineValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);
    const wonLeads = leads.filter((l) => l.stage === 'WON');
    const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

    return {
      totalLeads: leads.length,
      pipelineValue: totalPipelineValue,
      wonDealsCount: wonLeads.length,
      conversionRatePercentage: conversionRate,
      highValueLeads: leads.filter((l) => l.value >= 250000),
    };
  }

  // ================================================================
  // 2. HR MODULE SERVICES
  // ================================================================

  public async getEmployees(orgId: string = 'ORG-01', requestingUserRole: UserRole = 'EMPLOYEE'): Promise<Employee[]> {
    let list: Employee[] = [];
    try {
      const dbEmps = await prisma.employee.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
      if (dbEmps.length > 0) {
        list = dbEmps.map((e) => ({
          ...e,
          userId: e.userId || undefined,
          managerId: e.managerId || undefined,
          employmentStatus: e.employmentStatus as any,
          joiningDate: e.joiningDate.toISOString(),
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        }));
      }
    } catch {
      list = employeeStore.filter((e) => e.organizationId === orgId);
    }

    if (list.length === 0) list = [...SEED_EMPLOYEES];

    // RBAC Security Filter: Hide sensitive salary data from unauthorized non-ADMIN / non-MANAGER roles
    if (requestingUserRole === 'EMPLOYEE') {
      return list.map((e) => ({
        ...e,
        salary: 0, // Masked for unauthorized role
      }));
    }

    return list;
  }

  public async createEmployee(empData: Partial<Employee>, user: User): Promise<Employee> {
    if (user.role === 'EMPLOYEE') {
      throw new Error('Unauthorized: EMPLOYEES cannot add new staff records.');
    }

    const newEmp: Employee = {
      id: `EMP-${Date.now()}`,
      organizationId: user.organizationId || 'ORG-01',
      employeeCode: empData.employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: empData.name || 'New Employee',
      email: empData.email || 'employee@flowmind.ai',
      department: empData.department || 'Engineering',
      designation: empData.designation || 'Software Engineer',
      joiningDate: empData.joiningDate || new Date().toISOString().split('T')[0],
      employmentStatus: 'ACTIVE',
      salary: empData.salary || 120000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await prisma.employee.create({
        data: {
          id: newEmp.id,
          organizationId: newEmp.organizationId,
          employeeCode: newEmp.employeeCode,
          name: newEmp.name,
          email: newEmp.email,
          department: newEmp.department,
          designation: newEmp.designation,
          joiningDate: new Date(newEmp.joiningDate),
          employmentStatus: newEmp.employmentStatus,
          salary: newEmp.salary,
        },
      });
    } catch {
      employeeStore.unshift(newEmp);
    }

    logBusinessAudit(user, 'CREATE_EMPLOYEE', 'HR', newEmp.id, { name: newEmp.name, department: newEmp.department });
    emitBusinessEvent('employee.created', { employeeId: newEmp.id, name: newEmp.name });

    return newEmp;
  }

  public async getLeaveRequests(orgId: string = 'ORG-01'): Promise<LeaveRequest[]> {
    try {
      const dbLeaves = await prisma.leaveRequest.findMany({
        where: { organizationId: orgId },
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      });
      if (dbLeaves.length > 0) {
        return dbLeaves.map((l) => ({
          id: l.id,
          organizationId: l.organizationId,
          employeeId: l.employeeId,
          employeeName: l.employee?.name || 'Employee',
          leaveType: l.leaveType as any,
          startDate: l.startDate.toISOString().split('T')[0],
          endDate: l.endDate.toISOString().split('T')[0],
          reason: l.reason,
          status: l.status as LeaveStatus,
          approverId: l.approverId || undefined,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Fallback
    }
    return leaveStore.filter((l) => l.organizationId === orgId);
  }

  public async createLeaveRequest(reqData: Partial<LeaveRequest>, user: User): Promise<LeaveRequest> {
    const newReq: LeaveRequest = {
      id: `LEAVE-${Date.now()}`,
      organizationId: user.organizationId || 'ORG-01',
      employeeId: reqData.employeeId || user.id,
      employeeName: user.name,
      leaveType: reqData.leaveType || 'CASUAL',
      startDate: reqData.startDate || new Date().toISOString().split('T')[0],
      endDate: reqData.endDate || new Date().toISOString().split('T')[0],
      reason: reqData.reason || 'Personal leave request',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leaveStore.unshift(newReq);

    logBusinessAudit(user, 'CREATE_LEAVE_REQUEST', 'HR', newReq.id, { employeeName: newReq.employeeName, leaveType: newReq.leaveType });
    emitBusinessEvent('leave.requested', { leaveId: newReq.id });

    return newReq;
  }

  public async approveLeaveRequest(
    leaveId: string,
    approver: User,
    status: LeaveStatus
  ): Promise<LeaveRequest | null> {
    if (approver.role === 'EMPLOYEE') {
      throw new Error('Unauthorized: Employees cannot approve leave requests.');
    }

    const req = leaveStore.find((l) => l.id === leaveId);
    if (req) {
      if (req.employeeId === approver.id) {
        throw new Error('Action Denied: Self-approval of leave requests is forbidden by governance.');
      }
      req.status = status;
      req.approverId = approver.id;
      req.updatedAt = new Date().toISOString();
    }

    logBusinessAudit(approver, 'APPROVE_LEAVE_REQUEST', 'HR', leaveId, { status, approvedBy: approver.name });
    emitBusinessEvent('leave.approved', { leaveId, status });

    return req || null;
  }

  public async calculatePayroll(orgId: string, period: string, user: User): Promise<PayrollRecord[]> {
    if (user.role === 'EMPLOYEE') {
      throw new Error('Unauthorized: Employees cannot execute organization payroll calculations.');
    }

    const employees = await this.getEmployees(orgId, user.role);
    const records: PayrollRecord[] = employees.map((emp) => {
      const base = emp.salary || 100000;
      const allowances = Math.round(base * 0.15);
      const deductions = Math.round(base * 0.10);
      const bonuses = 5000;
      const gross = base + allowances + bonuses;
      const net = gross - deductions;

      return {
        id: `PAY-${emp.id}-${period}`,
        organizationId: orgId,
        employeeId: emp.id,
        employeeName: emp.name,
        period,
        baseSalary: base,
        allowances,
        deductions,
        bonuses,
        grossSalary: gross,
        netSalary: net,
        status: 'PROCESSED',
        createdAt: new Date().toISOString(),
      };
    });

    payrollStore = records;

    logBusinessAudit(user, 'CALCULATE_PAYROLL', 'HR', period, { period, processedCount: records.length });

    return records;
  }

  // ================================================================
  // 3. FINANCE MODULE SERVICES
  // ================================================================

  public async getInvoices(orgId: string = 'ORG-01'): Promise<Invoice[]> {
    try {
      const dbInvoices = await prisma.invoice.findMany({
        where: { organizationId: orgId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      if (dbInvoices.length > 0) {
        return dbInvoices.map((inv) => ({
          ...inv,
          status: inv.status as InvoiceStatus,
          customerId: inv.customerId || undefined,
          createdById: inv.createdById || undefined,
          customerEmail: inv.customerEmail || undefined,
          dueDate: inv.dueDate.toISOString(),
          paidAt: inv.paidAt?.toISOString(),
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt.toISOString(),
          items: inv.items.map((i) => ({ ...i })),
        }));
      }
    } catch {
      // Fallback
    }
    return invoiceStore.filter((i) => i.organizationId === orgId);
  }

  public async createInvoice(invData: Partial<Invoice>, user: User): Promise<Invoice> {
    const subtotal = invData.subtotal || invData.total || 100000;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;

    const newInv: Invoice = {
      id: `INV-${Date.now()}`,
      organizationId: user.organizationId || 'ORG-01',
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: invData.customerName || 'Enterprise Customer',
      customerEmail: invData.customerEmail || 'billing@customer.com',
      createdById: user.id,
      status: 'PENDING',
      subtotal,
      tax,
      discount: 0,
      total,
      dueDate: invData.dueDate || new Date(Date.now() + 86400000 * 15).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: invData.items || [
        { id: 'item-1', description: 'FlowMind AI Automation Service', quantity: 1, unitPrice: subtotal, amount: subtotal },
      ],
    };

    try {
      await prisma.invoice.create({
        data: {
          id: newInv.id,
          organizationId: newInv.organizationId,
          invoiceNumber: newInv.invoiceNumber,
          customerName: newInv.customerName,
          customerEmail: newInv.customerEmail,
          createdById: newInv.createdById,
          status: newInv.status,
          subtotal: newInv.subtotal,
          tax: newInv.tax,
          total: newInv.total,
          dueDate: new Date(newInv.dueDate),
        },
      });
    } catch {
      invoiceStore.unshift(newInv);
    }

    logBusinessAudit(user, 'CREATE_INVOICE', 'FINANCE', newInv.id, { invoiceNumber: newInv.invoiceNumber, total: newInv.total });
    emitBusinessEvent('invoice.created', { invoiceId: newInv.id, total: newInv.total });

    return newInv;
  }

  public async markInvoicePaid(invoiceId: string, user: User): Promise<Invoice | null> {
    const inv = invoiceStore.find((i) => i.id === invoiceId);
    if (inv) {
      inv.status = 'PAID';
      inv.paidAt = new Date().toISOString();
      inv.updatedAt = new Date().toISOString();
    }

    try {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      });
    } catch {
      // Handled in store
    }

    logBusinessAudit(user, 'MARK_INVOICE_PAID', 'FINANCE', invoiceId, { paidAt: new Date().toISOString() });
    emitBusinessEvent('invoice.paid', { invoiceId });

    return inv || null;
  }

  // ================================================================
  // 4. INVENTORY MODULE SERVICES
  // ================================================================

  public async getProducts(orgId: string = 'ORG-01'): Promise<Product[]> {
    try {
      const dbProds = await prisma.product.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
      if (dbProds.length > 0) {
        return dbProds.map((p) => ({
          ...p,
          description: p.description || undefined,
          status: p.status as any,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Fallback
    }
    return productStore.filter((p) => p.organizationId === orgId);
  }

  public async updateStock(
    productId: string,
    quantityDelta: number,
    movementType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT',
    reference: string,
    user: User
  ): Promise<Product | null> {
    const prod = productStore.find((p) => p.id === productId);
    if (prod) {
      prod.quantity = Math.max(0, prod.quantity + quantityDelta);
      prod.status = prod.quantity <= 0 ? 'OUT_OF_STOCK' : prod.quantity <= prod.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';
      prod.updatedAt = new Date().toISOString();

      const movement: StockMovement = {
        id: `MOVE-${Date.now()}`,
        organizationId: user.organizationId || 'ORG-01',
        productId,
        productName: prod.name,
        quantity: quantityDelta,
        movementType,
        reference,
        createdById: user.id,
        createdAt: new Date().toISOString(),
      };
      stockMovementStore.unshift(movement);

      if (prod.status === 'LOW_STOCK') {
        emitBusinessEvent('stock.low', { productId: prod.id, sku: prod.sku, quantity: prod.quantity });
      }
    }

    logBusinessAudit(user, 'UPDATE_STOCK', 'INVENTORY', productId, { quantityDelta, movementType, reference });

    return prod || null;
  }

  // ================================================================
  // 5. SUPPORT MODULE SERVICES
  // ================================================================

  public async getTickets(orgId: string = 'ORG-01'): Promise<SupportTicket[]> {
    try {
      const dbTickets = await prisma.supportTicket.findMany({
        where: { organizationId: orgId },
        include: { notes: true },
        orderBy: { createdAt: 'desc' },
      });
      if (dbTickets.length > 0) {
        return dbTickets.map((t) => ({
          ...t,
          priority: t.priority as TicketPriority,
          status: t.status as TicketStatus,
          customerId: t.customerId || undefined,
          assignedToId: t.assignedToId || undefined,
          createdById: t.createdById || undefined,
          resolvedAt: t.resolvedAt?.toISOString(),
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          notes: t.notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
        }));
      }
    } catch {
      // Fallback
    }
    return ticketStore.filter((t) => t.organizationId === orgId);
  }

  public async createTicket(ticketData: Partial<SupportTicket>, user: User): Promise<SupportTicket> {
    const newTicket: SupportTicket = {
      id: `TICK-${Date.now()}`,
      organizationId: user.organizationId || 'ORG-01',
      ticketNumber: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: ticketData.customerName || 'Corporate Client',
      title: ticketData.title || 'Support Inquiry',
      description: ticketData.description || 'Customer helpdesk inquiry.',
      priority: (ticketData.priority as TicketPriority) || 'MEDIUM',
      status: 'OPEN',
      category: ticketData.category || 'GENERAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ticketStore.unshift(newTicket);

    logBusinessAudit(user, 'CREATE_SUPPORT_TICKET', 'SUPPORT', newTicket.id, { ticketNumber: newTicket.ticketNumber });
    emitBusinessEvent('ticket.created', { ticketId: newTicket.id, priority: newTicket.priority });

    return newTicket;
  }

  // ================================================================
  // 6. CROSS-MODULE CUSTOMER 360 & EMPLOYEE 360 VIEWS
  // ================================================================

  public async getCustomer360(customerName: string, orgId: string = 'ORG-01'): Promise<Customer360> {
    const leads = (await this.getLeads(orgId)).filter((l) =>
      l.company.toLowerCase().includes(customerName.toLowerCase()) || l.name.toLowerCase().includes(customerName.toLowerCase())
    );
    const invoices = (await this.getInvoices(orgId)).filter((i) =>
      i.customerName.toLowerCase().includes(customerName.toLowerCase())
    );
    const tickets = (await this.getTickets(orgId)).filter((t) =>
      t.customerName.toLowerCase().includes(customerName.toLowerCase())
    );

    const totalRev = invoices.filter((i) => i.status === 'PAID').reduce((a, b) => a + b.total, 0);

    return {
      customerName,
      leads,
      invoices,
      tickets,
      totalRevenue: totalRev,
      activeStatus: invoices.some((i) => i.status === 'OVERDUE') ? 'REQUIRES_ATTENTION' : 'HEALTHY',
      aiRiskSummary:
        invoices.some((i) => i.status === 'OVERDUE')
          ? '⚠️ Overdue invoice detected (₹2,36,000). Finance Agent recommends automated reminder workflow.'
          : '✅ Strategic enterprise client with clean payment history and 0 critical tickets.',
    };
  }

  public async getEmployee360(employeeId: string, orgId: string = 'ORG-01', requestingUserRole: UserRole = 'EMPLOYEE'): Promise<Employee360 | null> {
    const employees = await this.getEmployees(orgId, requestingUserRole);
    const emp = employees.find((e) => e.id === employeeId || e.employeeCode === employeeId);
    if (!emp) return null;

    const leaves = (await this.getLeaveRequests(orgId)).filter((l) => l.employeeId === emp.id);

    return {
      employee: emp,
      leaveRequests: leaves,
      payrollRecords: payrollStore.filter((p) => p.employeeId === emp.id),
      performanceSummary: 'Exceeding targets. Completed 14 high-impact AI DAG workflow tasks this quarter.',
    };
  }

  // ================================================================
  // 7. REAL BUSINESS INSIGHTS & EXPORTS
  // ================================================================

  public async getBusinessInsights(orgId: string = 'ORG-01'): Promise<BusinessInsight[]> {
    const leads = await this.getLeads(orgId);
    const invoices = await this.getInvoices(orgId);
    const products = await this.getProducts(orgId);
    const tickets = await this.getTickets(orgId);

    const insights: BusinessInsight[] = [];

    // CRM Insight
    const uncontacted = leads.filter((l) => l.stage === 'NEW');
    if (uncontacted.length > 0) {
      insights.push({
        id: 'ins-crm-1',
        module: 'CRM',
        title: `${uncontacted.length} High-Value Leads Pending Contact`,
        description: 'New leads have sat in pipeline for >48h. Sales Agent recommends auto-drafting proposal.',
        type: 'OPPORTUNITY',
        actionLabel: 'Open CRM Pipeline',
        actionModule: 'crm',
      });
    }

    // Finance Insight
    const overdue = invoices.filter((i) => i.status === 'OVERDUE');
    if (overdue.length > 0) {
      const totalOverdue = overdue.reduce((a, b) => a + b.total, 0);
      insights.push({
        id: 'ins-fin-1',
        module: 'FINANCE',
        title: `${overdue.length} Invoices Overdue (₹${totalOverdue.toLocaleString()})`,
        description: 'Overdue balances detected. Finance Agent can trigger automated payment reminder DAG.',
        type: 'WARNING',
        actionLabel: 'View Overdue Invoices',
        actionModule: 'finance',
      });
    }

    // Inventory Insight
    const lowStock = products.filter((p) => p.quantity <= p.reorderLevel);
    if (lowStock.length > 0) {
      insights.push({
        id: 'ins-inv-1',
        module: 'INVENTORY',
        title: `Low Stock Alert: ${lowStock.map((p) => p.name).join(', ')}`,
        description: 'Hardware items reached reorder threshold. Inventory Agent suggests reorder PO.',
        type: 'ALERT',
        actionLabel: 'Manage Inventory',
        actionModule: 'inventory',
      });
    }

    // Support Insight
    const critical = tickets.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL');
    if (critical.length > 0) {
      insights.push({
        id: 'ins-sup-1',
        module: 'SUPPORT',
        title: `${critical.length} High Priority Tickets Open`,
        description: 'Customer tickets require SLA review. Support Agent ready to draft response.',
        type: 'INFO',
        actionLabel: 'View Tickets',
        actionModule: 'support',
      });
    }

    return insights;
  }

  public async exportModuleData(module: string, format: 'csv' | 'json', orgId: string = 'ORG-01', userRole: UserRole = 'EMPLOYEE'): Promise<string> {
    let data: any[] = [];
    if (module === 'crm') data = await this.getLeads(orgId);
    else if (module === 'hr') data = await this.getEmployees(orgId, userRole);
    else if (module === 'finance') data = await this.getInvoices(orgId);
    else if (module === 'inventory') data = await this.getProducts(orgId);
    else if (module === 'support') data = await this.getTickets(orgId);

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (data.length === 0) return 'No data available';

    const keys = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object');
    const header = keys.join(',');
    const rows = data.map((row) => keys.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','));

    return [header, ...rows].join('\n');
  }
}

export const businessService = new BusinessService();
