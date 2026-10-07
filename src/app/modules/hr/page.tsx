'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/useAppStore';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { businessService } from '@/lib/services/businessService';
import { Employee, LeaveRequest, LeaveStatus, PayrollRecord, Employee360 } from '@/types';
import {
  Users,
  Plus,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  DollarSign,
  UserCheck,
  FileSpreadsheet,
  Download,
  X,
} from 'lucide-react';

export default function HrModulePage() {
  const { user, addToast } = useAppStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [emp360, setEmp360] = useState<Employee360 | null>(null);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // New Employee State
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empRole, setEmpRole] = useState('Senior AI Engineer');
  const [empSalary, setEmpSalary] = useState(150000);

  // Leave Form State
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'SICK' | 'VACATION'>('CASUAL');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    loadHrData();
  }, [user.role]);

  const loadHrData = async () => {
    try {
      const emps = await businessService.getEmployees(user.organizationId || 'ORG-01', user.role);
      const lvs = await businessService.getLeaveRequests(user.organizationId || 'ORG-01');
      setEmployees(emps);
      setLeaves(lvs);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load HR dataset.' });
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role === 'EMPLOYEE') {
      addToast({ type: 'error', title: 'Access Denied', message: 'EMPLOYEE role cannot create staff records.' });
      return;
    }

    try {
      const created = await businessService.createEmployee(
        { name: empName, email: empEmail, department: empDept, designation: empRole, salary: Number(empSalary) },
        user
      );
      setEmployees((prev) => [created, ...prev]);
      setShowAddEmpModal(false);
      setEmpName('');
      setEmpEmail('');
      addToast({ type: 'success', title: 'Employee Added', message: `Added ${created.name} to HR records.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed', message: err?.message });
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const req = await businessService.createLeaveRequest({ leaveType, reason: leaveReason }, user);
      setLeaves((prev) => [req, ...prev]);
      setShowLeaveModal(false);
      setLeaveReason('');
      addToast({ type: 'success', title: 'Leave Requested', message: 'Submitted for manager approval.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err?.message });
    }
  };

  const handleApproveLeave = async (leaveId: string, status: LeaveStatus) => {
    try {
      const updated = await businessService.approveLeaveRequest(leaveId, user, status);
      if (updated) {
        setLeaves((prev) => prev.map((l) => (l.id === leaveId ? { ...l, status } : l)));
        addToast({ type: 'success', title: 'Leave Governance', message: `Leave status updated to ${status}` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Governance Blocked', message: err?.message });
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      const records = await businessService.calculatePayroll(user.organizationId || 'ORG-01', '2026-10', user);
      setPayrolls(records);
      addToast({ type: 'success', title: 'Payroll Processed', message: `Processed monthly payroll for ${records.length} employees.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payroll Error', message: err?.message });
    }
  };

  const handleViewEmp360 = async (emp: Employee) => {
    setSelectedEmp(emp);
    const data = await businessService.getEmployee360(emp.id, user.organizationId, user.role);
    setEmp360(data);
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await businessService.exportModuleData('hr', 'csv', user.organizationId, user.role);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HR_Staff_Export_${Date.now()}.csv`;
      a.click();
      addToast({ type: 'success', title: 'Export Complete', message: 'Exported HR records to CSV.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err?.message });
    }
  };

  return (
    <div className="min-h-screen bg-bloom-bg text-bloom-textDark font-sans selection:bg-purple-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-24">
        {/* Header Breadcrumb Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[28px] p-6 shadow-bloom">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/modules" className="text-xs font-bold text-slate-500 hover:text-purple-700 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Modules
              </Link>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs font-bold text-indigo-700">HR & Workforce</span>
            </div>
            <h1 className="text-2xl font-black text-bloom-dark tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              HR & People Operations Suite
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="border border-slate-200 text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
            <Button onClick={() => setShowLeaveModal(true)} variant="outline" size="sm" className="border border-slate-200 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 mr-1" /> Request Leave
            </Button>
            {user.role !== 'EMPLOYEE' && (
              <Button onClick={() => setShowAddEmpModal(true)} variant="dark" size="sm" className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs">
                <Plus className="w-4 h-4 mr-1" /> Add Employee
              </Button>
            )}
          </div>
        </div>

        {/* Security Alert Banner for Salary Masking */}
        {user.role === 'EMPLOYEE' && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-indigo-900">
            <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              <strong>RBAC Data Governance Enforced:</strong> You are logged in as an <strong>EMPLOYEE</strong>. Organization salary and payroll calculations are restricted to ADMIN and MANAGER roles.
            </span>
          </div>
        )}

        {/* Staff Directory Table */}
        <section className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-bloom space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-bloom-dark">Employee Directory ({employees.length})</h2>
            {user.role !== 'EMPLOYEE' && (
              <Button onClick={handleCalculatePayroll} variant="dark" size="sm" className="bg-slate-900 hover:bg-slate-800 text-xs font-bold">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Run 2026-10 Payroll Engine
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Base Salary</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-indigo-700">{emp.employeeCode}</td>
                    <td className="p-3 font-bold text-bloom-dark">{emp.name}</td>
                    <td className="p-3 text-slate-600">{emp.department}</td>
                    <td className="p-3 text-slate-600">{emp.designation}</td>
                    <td className="p-3"><Badge variant="success">{emp.employmentStatus}</Badge></td>
                    <td className="p-3 font-bold text-slate-700">
                      {user.role === 'EMPLOYEE' ? '🔒 Restricted' : `₹${emp.salary.toLocaleString()}/mo`}
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleViewEmp360(emp)} className="text-indigo-600 hover:underline font-bold">
                        Employee 360
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Leave Governance & Approvals Section */}
        <section className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-bloom space-y-4">
          <h2 className="text-base font-extrabold text-bloom-dark">Leave Governance Queue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Manager Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-bold text-bloom-dark">{l.employeeName || 'Staff Member'}</td>
                    <td className="p-3 font-semibold text-indigo-700">{l.leaveType}</td>
                    <td className="p-3 text-slate-600">{l.startDate} to {l.endDate}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{l.reason}</td>
                    <td className="p-3">
                      <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'warning' : 'purple'}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {l.status === 'PENDING' && user.role !== 'EMPLOYEE' ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApproveLeave(l.id, 'APPROVED')} className="text-emerald-600 hover:text-emerald-700 font-bold">
                            Approve
                          </button>
                          <button onClick={() => handleApproveLeave(l.id, 'REJECTED')} className="text-red-600 hover:text-red-700 font-bold">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-semibold">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Employee 360 Drawer Modal */}
        {selectedEmp && emp360 && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white text-bloom-textDark w-full max-w-3xl rounded-[28px] border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">Employee 360</Badge>
                  <h3 className="text-base font-extrabold text-bloom-dark">{emp360.employee.name}</h3>
                </div>
                <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><strong>Code:</strong> {emp360.employee.employeeCode}</div>
                <div><strong>Department:</strong> {emp360.employee.department}</div>
                <div><strong>Designation:</strong> {emp360.employee.designation}</div>
                <div><strong>Joining Date:</strong> {emp360.employee.joiningDate}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <strong>HR AI Agent Note:</strong> {emp360.performanceSummary}
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Form Modal */}
        {showAddEmpModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleCreateEmployee} className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-extrabold text-bloom-dark">Add New Staff Member</h3>
                <button type="button" onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="e.g. Kavya Nair"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="kavya@flowmind.ai"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddEmpModal(false)} variant="outline" size="sm">Cancel</Button>
                <Button type="submit" variant="dark" size="sm" className="bg-indigo-600 hover:bg-indigo-500 font-bold">Save Staff</Button>
              </div>
            </form>
          </div>
        )}

        {/* Request Leave Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleLeaveSubmit} className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-extrabold text-bloom-dark">Submit Leave Request</h3>
                <button type="button" onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-semibold mt-1"
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="VACATION">Vacation Leave</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Reason</label>
                  <textarea
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Reason for leave request..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-bloom-dark font-medium mt-1 h-20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowLeaveModal(false)} variant="outline" size="sm">Cancel</Button>
                <Button type="submit" variant="dark" size="sm" className="bg-indigo-600 hover:bg-indigo-500 font-bold">Submit Request</Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
