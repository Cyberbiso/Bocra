import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MOCK_CERTIFICATES = [
  {
    id: 'cert-001',
    certificate_number: 'TA/BW/2026/00123',
    certificate_type_code: 'TYPE_APPROVAL',
    issued_at: '2026-01-15T00:00:00Z',
    status_code: 'ACTIVE',
    qr_token: 'BOCRA-TA-2026-00123-QR',
    file_id: 'file-001',
    device_catalog: { brand_name: 'Samsung', marketing_name: 'Galaxy A55', model_name: 'SM-A556B', is_sim_enabled: true },
    application: { application_number: 'TA-2026-00089' },
    issued_to: 'TechImport Botswana (Pty) Ltd',
  },
  {
    id: 'cert-002',
    certificate_number: 'TA/BW/2025/00387',
    certificate_type_code: 'TYPE_APPROVAL',
    issued_at: '2025-03-20T00:00:00Z',
    status_code: 'EXPIRED',
    qr_token: 'BOCRA-TA-2025-00387-QR',
    file_id: null,
    device_catalog: { brand_name: 'Huawei', marketing_name: 'Nova 12', model_name: 'HWI-AL00', is_sim_enabled: true },
    application: { application_number: 'TA-2025-00312' },
    issued_to: 'TechImport Botswana (Pty) Ltd',
  },
]

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (supabase) {
    try {
      // docs.certificates has device_name, holder_name, application_id directly
      const { data: certs, error } = await supabase
        .schema('docs')
        .from('certificates')
        .select('id, certificate_number, certificate_type, holder_name, device_name, issue_date, expiry_date, status_code, qr_token, application_id, issued_by')
        .eq('certificate_type', 'TYPE_APPROVAL')
        .order('issue_date', { ascending: false })
      if (!error && certs?.length) {
        // Try to enrich with device catalog info via type_approval_records
        const { data: records } = await supabase
          .schema('device')
          .from('type_approval_records')
          .select('id, device_model_id, certificate_id')
          .in('certificate_id', certs.map((c: { id: string }) => c.id))
        const modelIds = [...new Set((records ?? []).map((r: { device_model_id: string }) => r.device_model_id).filter(Boolean))]
        let devMap: Record<string, unknown> = {}
        if (modelIds.length) {
          const { data: devices } = await supabase
            .schema('device')
            .from('catalog')
            .select('id, brand_name, marketing_name, model_name, is_sim_enabled')
            .in('id', modelIds)
          devMap = Object.fromEntries((devices ?? []).map((d: { id: string }) => [d.id, d]))
        }
        const recByCert = Object.fromEntries(
          (records ?? []).map((r: { certificate_id: string; device_model_id: string }) => [r.certificate_id, r.device_model_id])
        )

        const result = certs.map((c: { id: string; certificate_number: string; certificate_type: string; holder_name: string; device_name: string; issue_date: string; expiry_date: string; status_code: string; qr_token: string; application_id: string | null; issued_by: string | null }) => ({
          id: c.id,
          certificate_number: c.certificate_number,
          certificate_type_code: c.certificate_type,
          issued_at: c.issue_date,
          expiry_date: c.expiry_date,
          status_code: c.status_code,
          qr_token: c.qr_token,
          file_id: null,
          holder_name: c.holder_name,
          device_catalog: devMap[recByCert[c.id]] ?? {
            brand_name: c.device_name?.split(' ')[0] ?? 'Unknown',
            marketing_name: c.device_name ?? 'Unknown',
            model_name: '',
            is_sim_enabled: false,
          },
          application: c.application_id ? { application_number: c.application_id } : null,
          issued_to: c.holder_name ?? c.issued_by ?? 'BOCRA',
        }))
        return NextResponse.json(result)
      }
    } catch { /* fall through */ }
  }
  return NextResponse.json(MOCK_CERTIFICATES)
}
