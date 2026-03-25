export type Role = 'applicant' | 'officer' | 'admin'

export const ROLE_LABELS: Record<Role, string> = {
  applicant: 'Applicant / Requestor',
  officer:   'BOCRA Officer',
  admin:     'Administrator',
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
  admin: [
    'home', 'search', 'complaints', 'licensing',
    'type-approval', 'device-verification', 'certificates',
    'payments', 'qos', 'domain-services', 'cybersecurity',
    'documents', 'notifications', 'agent', 'admin',
  ],
}
