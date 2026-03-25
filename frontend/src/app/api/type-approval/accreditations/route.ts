import { NextResponse } from 'next/server'

// TODO: Replace with real query:
// SELECT a.id, a.accreditation_type, a.accreditation_ref,
//        o.legal_name AS org_name, a.status_code, a.issued_at
// FROM   iam.accreditations a
// JOIN   iam.organizations   o ON o.id = a.organisation_id
// WHERE  a.organisation_id = :current_org_id

const MOCK_ACCREDITATIONS = [
  {
    id: 'acc-001',
    accreditation_type: 'CUSTOMER',
    accreditation_ref: 'ACC/CUST/2025/00123',
    org_name: 'TechImport Botswana (Pty) Ltd',
    status_code: 'APPROVED',
    issued_at: '2025-03-15T00:00:00Z',
  },
  {
    id: 'acc-002',
    accreditation_type: 'MANUFACTURER',
    accreditation_ref: 'ACC/MFR/2025/00045',
    org_name: 'TechImport Botswana (Pty) Ltd',
    status_code: 'APPROVED',
    issued_at: '2025-06-20T00:00:00Z',
  },
  {
    id: 'acc-003',
    accreditation_type: 'REPAIR_SERVICE_PROVIDER',
    accreditation_ref: 'ACC/RSP/2025/00078',
    org_name: 'TechImport Botswana (Pty) Ltd',
    status_code: 'PENDING',
    issued_at: null,
  },
]

export async function GET() {
  return NextResponse.json(MOCK_ACCREDITATIONS)
}
