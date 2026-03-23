export type Role = 'public' | 'applicant' | 'officer' | 'admin'

export const ROLE_LABELS: Record<Role, string> = {
  public: 'Public User',
  applicant: 'Applicant / Requestor',
  officer: 'BOCRA Officer',
  admin: 'Administrator',
}

const PUBLIC_PERMISSIONS = [
  'home',
  'search',
  'complaints',
  'certificates',
  'qos',
  'domain-services',
  'documents',
  'agent',
] as const

const APPLICANT_PERMISSIONS = [
  ...PUBLIC_PERMISSIONS,
  'licensing',
  'type-approval',
  'device-verification',
  'payments',
  'notifications',
] as const

const OFFICER_PERMISSIONS = [
  ...APPLICANT_PERMISSIONS,
  'admin',
] as const

const ALL_PERMISSIONS = [
  ...OFFICER_PERMISSIONS,
  'cybersecurity',
] as const

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  public:     [...PUBLIC_PERMISSIONS],
  applicant:  [...APPLICANT_PERMISSIONS],
  officer:    [...OFFICER_PERMISSIONS],
  admin:      [...ALL_PERMISSIONS],
}
