export const ROLES = ['applicant', 'officer', 'type_approver', 'admin'] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  applicant: 'Applicant / Requestor',
  officer: 'BOCRA Officer',
  type_approver: 'Type Approval Reviewer',
  admin: 'Administrator',
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  applicant: [
    'home', 'search', 'complaints', 'licensing',
    'type-approval', 'device-verification', 'certificates',
    'payments', 'qos', 'domain-services', 'cybersecurity',
    'documents', 'notifications', 'agent',
  ],
  officer: [
    'home', 'search', 'complaints', 'licensing',
    'type-approval', 'device-verification', 'certificates',
    'payments', 'qos', 'domain-services', 'cybersecurity',
    'documents', 'notifications', 'agent', 'admin',
  ],
  type_approver: [
    'home', 'search', 'type-approval', 'device-verification',
    'certificates', 'payments', 'qos', 'domain-services',
    'cybersecurity', 'documents', 'notifications', 'agent',
  ],
  admin: [
    'home', 'search', 'complaints', 'licensing',
    'type-approval', 'device-verification', 'certificates',
    'payments', 'qos', 'domain-services', 'cybersecurity',
    'documents', 'notifications', 'agent', 'admin', 'integrations',
  ],
}

export const OFFICER_REVIEW_ROLES = ['officer', 'admin'] as const
export const TYPE_APPROVAL_REVIEW_ROLES = ['type_approver', 'admin'] as const

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export function hasAnyRole(role: Role, allowedRoles: readonly Role[]): boolean {
  return allowedRoles.includes(role)
}

export function roleHasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function canReviewLicensing(role: Role): boolean {
  return hasAnyRole(role, OFFICER_REVIEW_ROLES)
}

export function canReviewTypeApproval(role: Role): boolean {
  return hasAnyRole(role, TYPE_APPROVAL_REVIEW_ROLES)
}

export function isBocraStaff(role: Role): boolean {
  return role !== 'applicant'
}
