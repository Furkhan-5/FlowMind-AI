import { businessService } from '@/lib/services/businessService';
import { canUserApproveAction, hasPermission } from '@/lib/services/rbacService';

describe('RBAC Security & Anti-Tampering Engine', () => {
  describe('Column-Level Data Masking (Salary Protection)', () => {
    test('EMPLOYEE role cannot view real salaries; values are masked to 0', async () => {
      const emps = await businessService.getEmployees('ORG-01', 'EMPLOYEE');
      expect(emps.length).toBeGreaterThan(0);
      emps.forEach((emp) => {
        expect(emp.salary).toBe(0);
      });
    });

    test('ADMIN role receives full unmasked compensation data for auditing', async () => {
      const emps = await businessService.getEmployees('ORG-01', 'ADMIN');
      expect(emps.length).toBeGreaterThan(0);
      const hasNonZeroSalary = emps.some((emp) => emp.salary > 0);
      expect(hasNonZeroSalary).toBe(true);
    });

    test('MANAGER role receives unmasked salary for team management', async () => {
      const emps = await businessService.getEmployees('ORG-01', 'MANAGER');
      expect(emps.length).toBeGreaterThan(0);
      const hasNonZeroSalary = emps.some((emp) => emp.salary > 0);
      expect(hasNonZeroSalary).toBe(true);
    });
  });

  describe('Anti-Self-Approval Enforcement', () => {
    test('Requester cannot approve their own high-risk request even if they hold ADMIN role', () => {
      const check = canUserApproveAction('ADMIN', 'USER-ADMIN-01', 'USER-ADMIN-01');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Self-approval is forbidden');
    });

    test('Requester cannot approve their own request if they hold MANAGER role', () => {
      const check = canUserApproveAction('MANAGER', 'USER-MGR-01', 'USER-MGR-01');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Self-approval is forbidden');
    });

    test('EMPLOYEE role cannot approve any request regardless of requester', () => {
      const check = canUserApproveAction('EMPLOYEE', 'USER-OTHER-01', 'USER-EMP-01');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Role does not possess approval authority');
    });

    test('Independent MANAGER or ADMIN can approve a request initiated by another user', () => {
      const checkMgr = canUserApproveAction('MANAGER', 'USER-EMP-01', 'USER-MGR-02');
      expect(checkMgr.allowed).toBe(true);

      const checkAdmin = canUserApproveAction('ADMIN', 'USER-MGR-01', 'USER-ADMIN-99');
      expect(checkAdmin.allowed).toBe(true);
    });
  });

  describe('Permission Matrix Integrity', () => {
    test('ADMIN has security and organization management privileges', () => {
      expect(hasPermission('ADMIN', 'SECURITY_SETTINGS_MANAGE')).toBe(true);
      expect(hasPermission('ADMIN', 'ORGANIZATION_SETTINGS_MANAGE')).toBe(true);
    });

    test('EMPLOYEE does not have security management or approval authority', () => {
      expect(hasPermission('EMPLOYEE', 'SECURITY_SETTINGS_MANAGE')).toBe(false);
      expect(hasPermission('EMPLOYEE', 'APPROVAL_APPROVE')).toBe(false);
      expect(hasPermission('EMPLOYEE', 'ROLE_CHANGE')).toBe(false);
    });
  });
});
