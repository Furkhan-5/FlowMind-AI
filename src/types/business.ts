export type LeadStage =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  source: string;
  ownerId?: string;
  stage: LeadStage;
  status: string;
  score: number;
  value: number;
  tags: string[];
  notes?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStageHistory {
  id: string;
  leadId: string;
  previousStage: LeadStage | string;
  newStage: LeadStage;
  changedBy: string;
  reason?: string;
  timestamp: string;
}

export interface Employee {
  id: string;
  organizationId: string;
  userId?: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  managerId?: string;
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  salary: number;
  createdAt: string;
  updatedAt: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  leaveType: 'SICK' | 'CASUAL' | 'VACATION' | 'MATERNITY' | 'OTHER';
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  bonuses: number;
  grossSalary: number;
  netSalary: number;
  status: 'PROCESSED' | 'PENDING' | 'PAID';
  createdAt: string;
}

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'SENT'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  createdById?: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

export interface Payment {
  id: string;
  organizationId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  organizationId: string;
  productId: string;
  productName?: string;
  quantity: number;
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'TRANSFER';
  reference?: string;
  createdById?: string;
  createdAt: string;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  organizationId: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  assignedToId?: string;
  createdById?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: TicketNote[];
}

export interface TicketNote {
  id: string;
  ticketId: string;
  author: string;
  note: string;
  isInternal: boolean;
  createdAt: string;
}

export interface BusinessInsight {
  id: string;
  module: 'CRM' | 'HR' | 'FINANCE' | 'INVENTORY' | 'SUPPORT' | 'CROSS';
  title: string;
  description: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'ALERT' | 'INFO';
  actionLabel?: string;
  actionModule?: string;
}

export interface Customer360 {
  customerName: string;
  leads: Lead[];
  invoices: Invoice[];
  tickets: SupportTicket[];
  totalRevenue: number;
  activeStatus: string;
  aiRiskSummary: string;
}

export interface Employee360 {
  employee: Employee;
  leaveRequests: LeaveRequest[];
  payrollRecords: PayrollRecord[];
  performanceSummary: string;
}
