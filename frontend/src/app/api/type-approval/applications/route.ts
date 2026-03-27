import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MOCK_APPLICATIONS = [
  { id: 'TA-APP-2026-0041', application_number: 'TA-APP-2026-0041', brand: 'Samsung', model: 'Galaxy A55 5G', accreditation_type: 'CUSTOMER', submitted_at: '2026-03-22T00:00:00Z', current_status_code: 'UNDER_REVIEW', applicant_org: { legal_name: 'TeleCo BW (Pty) Ltd' } },
  { id: 'TA-APP-2026-0038', application_number: 'TA-APP-2026-0038', brand: 'Xiaomi', model: 'Redmi Note 13', accreditation_type: 'CUSTOMER', submitted_at: '2026-03-14T00:00:00Z', current_status_code: 'APPROVED', applicant_org: { legal_name: 'TeleCo BW (Pty) Ltd' } },
  { id: 'TA-APP-2026-0031', application_number: 'TA-APP-2026-0031', brand: 'Huawei', model: 'MatePad Pro 12', accreditation_type: 'MANUFACTURER', submitted_at: '2026-03-03T00:00:00Z', current_status_code: 'MORE_INFO', applicant_org: { legal_name: 'TeleCo BW (Pty) Ltd' } },
  { id: 'TA-APP-2026-0022', application_number: 'TA-APP-2026-0022', brand: 'Apple', model: 'iPhone 16 Pro', accreditation_type: 'CUSTOMER', submitted_at: '2026-02-12T00:00:00Z', current_status_code: 'APPROVED', applicant_org: { legal_name: 'TeleCo BW (Pty) Ltd' } },
  { id: 'TA-APP-2026-0011', application_number: 'TA-APP-2026-0011', brand: 'Asus', model: 'ZenFone 10', accreditation_type: 'REPAIR_SERVICE_PROVIDER', submitted_at: '2026-01-05T00:00:00Z', current_status_code: 'REJECTED', applicant_org: { legal_name: 'TeleCo BW (Pty) Ltd' } },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = getSupabaseAdmin()
  if (supabase) {
    try {
      let q = supabase
        .schema('workflow')
        .from('applications')
        .select('id, application_number, current_status_code, current_stage_code, submitted_at, expected_decision_at, applicant_org_id', { count: 'exact' })
        .eq('service_module_code', 'TYPE_APPROVAL')
        .order('submitted_at', { ascending: false })
        .range(from, to)
      if (statusFilter && statusFilter !== 'ALL') q = q.eq('current_status_code', statusFilter)
      const { data, error, count } = await q
      if (!error && data) {
        return NextResponse.json({ data, meta: { total: count ?? 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) } })
      }
    } catch { /* fall through */ }
  }
  return NextResponse.json({ data: MOCK_APPLICATIONS, meta: { total: MOCK_APPLICATIONS.length, page: 1, pageSize: 20, totalPages: 1 } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const applicationNumber = `TA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`
  const mockId = `app-${Date.now()}`

  const supabase = getSupabaseAdmin()
  if (supabase && body) {
    try {
      const { data, error } = await supabase
        .schema('workflow')
        .from('applications')
        .insert({
          application_number: applicationNumber,
          application_type_code: 'TYPE_APPROVAL',
          service_module_code: 'TYPE_APPROVAL',
          current_status_code: 'PENDING',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (!error && data) return NextResponse.json({ success: true, applicationNumber, id: data.id })
    } catch { /* fall through */ }
  }
  return NextResponse.json({ success: true, applicationNumber, id: mockId })
}
