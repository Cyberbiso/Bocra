import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MOCK_ACCREDITATIONS = [
  { id: 'acc-001', accreditation_type: 'CUSTOMER', accreditation_ref: 'ACC/CUST/2025/00123', org_name: 'TechImport Botswana (Pty) Ltd', status_code: 'APPROVED', issued_at: '2025-03-15T00:00:00Z' },
  { id: 'acc-002', accreditation_type: 'MANUFACTURER', accreditation_ref: 'ACC/MFR/2025/00045', org_name: 'TechImport Botswana (Pty) Ltd', status_code: 'APPROVED', issued_at: '2025-06-20T00:00:00Z' },
  { id: 'acc-003', accreditation_type: 'REPAIR_SERVICE_PROVIDER', accreditation_ref: 'ACC/RSP/2025/00078', org_name: 'TechImport Botswana (Pty) Ltd', status_code: 'PENDING', issued_at: null },
]

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (supabase) {
    const { data, error } = await supabase
      .schema('iam')
      .from('accreditations')
      .select('id, accreditation_type, accreditation_ref, organisation_id, status_code, issued_at')
      .order('issued_at', { ascending: false })
    if (!error && data?.length) return NextResponse.json(data)
  }
  return NextResponse.json(MOCK_ACCREDITATIONS)
}
