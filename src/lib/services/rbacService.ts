import { UserRole } from '@prisma/client';

export type PermissionCode =
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'ROLE_CHANGE'
  | 'WORKFLOW_VIEW'
  | 'WORKFLOW_CREATE'
  | 'WORKFLOW_EDIT'
  | 'WORKFLOW_EXECUTE'
  | 'WORKFLOW_ACTIVATE'
  | 'WORKFLOW_DISABLE'
  | 'AGENT_VIEW'
  | 'AGENT_USE'
  | 'AGENT_MANAGE'
  | 'APPROVAL_SUBMIT'
  | 'APPROVAL_APPROVE'
  | 'APPROVAL_REJECT'
  | 'AUDIT_VIEW'
  | 'SECURITY_SETTINGS_MANAGE'
  | 'ORGANIZATION_SETTINGS_MANAGE';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  ADMIN: [
    'USER_VIEW',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'ROLE_CHANGE',
    'WORKFLOW_VIEW',
    'WORKFLOW_CREATE',
    'WORKFLOW_EDIT',
    'WORKFLOW_EXECUTE',
    'WORKFLOW_ACTIVATE',
    'WORKFLOW_DISABLE',
    'AGENT_VIEW',
    'AGENT_USE',
    'AGENT_MANAGE',
    'APPROVAL_SUBMIT',
    'APPROVAL_APPROVE',
    'APPROVAL_REJECT',
    'AUDIT_VIEW',
    'SECURITY_SETTINGS_MANAGE',
    'ORGANIZATION_SETTINGS_MANAGE',
  ],

  MANAGER: [
    'USER_VIEW',
    'WORKFLOW_VIEW',
    'WORKFLOW_CREATE',
    'WORKFLOW_EDIT',
    'WORKFLOW_EXECUTE',
    'AGENT_VIEW',
    'AGENT_USE',
    'APPROVAL_SUBMIT',
    'APPROVAL_APPROVE',
    'APPROVAL_REJECT',
  ],

  EMPLOYEE: [
    'WORKFLOW_VIEW',
    'WORKFLOW_CREATE',
    'WORKFLOW_EXECUTE',
    'AGENT_VIEW',
    'AGENT_USE',
    'APPROVAL_SUBMIT',
  ],
};

export function hasPermission(role: UserRole, permission: PermissionCode): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Checks if a user can approve a given action request.
 * Enforces:
 * 1. Self-approval prevention (requester cannot approve their own high-risk request).
 * 2. Role permission (must have APPROVAL_APPROVE permission).
 */
export function canUserApproveAction(
  userRole: UserRole,
  requesterId?: string | null,
  currentUserId?: string | null
): { allowed: boolean; reason?: string } {
  if (!hasPermission(userRole, 'APPROVAL_APPROVE')) {
    return { allowed: false, reason: 'Role does not possess approval authority.' };
  }

  // Self approval check
  if (requesterId && currentUserId && requesterId === currentUserId) {
    return { allowed: false, reason: 'Self-approval is forbidden. An independent reviewer must approve this request.' };
  }

  return { allowed: true };
}
