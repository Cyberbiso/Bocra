import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MOCK_QUEUE = [
  {
    id: 'rapp-001',
    application_number: 'TA-2026-00891',
    submitted_at: '2026-03-24T09:15:00Z',
    current_status_code: 'PENDING',
    current_stage_code: 'INITIAL_REVIEW',
    priority_code: 'HIGH',
    expected_decision_at: '2026-04-07T00:00:00Z',
    applicant_org: { legal_name: 'TechImport Botswana (Pty) Ltd' },
    device_catalog: { brand_name: 'Samsung', model_name: 'SM-A556B' },
    assigned_to: { id: 'off-001', name: 'Lesedi Modise' },
  },
  {
    id: 'rapp-002',
    application_number: 'TA-2026-00887',
    submitted_at: '2026-03-17T14:30:00Z',
    current_status_code: 'PENDING',
    current_stage_code: 'DOCUMENT_VERIFICATION',
    priority_code: 'NORMAL',
    expected_decision_at: '2026-04-01T00:00:00Z',
    applicant_org: { legal_name: 'Mascom Wireless (Pty) Ltd' },
    device_catalog: { brand_name: 'Apple', model_name: 'A3293' },
    assigned_to: { id: 'off-002', name: 'Boipelo Kgosi' },
  },
  {
    id: 'rapp-003',
    application_number: 'TA-2026-00874',
    submitted_at: '2026-03-05T11:00:00Z',
    current_status_code: 'PENDING',
    current_stage_code: 'INITIAL_REVIEW',
    priority_code: 'LOW',
    expected_decision_at: '2026-03-28T00:00:00Z',
    applicant_org: { legal_name: 'Orange Botswana (Pty) Ltd' },
    device_catalog: { brand_name: 'Xiaomi', model_name: 'Redmi Note 13' },
    assigned_to: null,
  },
  {
    id: 'rapp-004',
    application_number: 'TA-2026-00865',
    submitted_at: '2026-03-18T10:00:00Z',
    current_status_code: 'VALIDATED',
    current_stage_code: 'TECHNICAL_VALIDATION',
    priority_code: 'HIGH',
    expected_decision_at: '2026-03-30T00:00:00Z',
    applicant_org: { legal_name: 'Botswana Telecom Corporation' },
    device_catalog: { brand_name: 'Huawei', model_name: 'HWI-AL00' },
    assigned_to: { id: 'off-003', name: 'Thato Sebele' },
  },
  {
    id: 'rapp-005',
    application_number: 'TA-2026-00859',
    submitted_at: '2026-03-20T08:45:00Z',
    current_status_code: 'VALIDATED',
    current_stage_code: 'DECISION_PENDING',
    priority_code: 'NORMAL',
    expected_decision_at: '2026-04-03T00:00:00Z',
    applicant_org: { legal_name: 'NetOne Africa Ltd' },
    device_catalog: { brand_name: 'Nokia', model_name: 'TA-1416' },
    assigned_to: { id: 'off-004', name: 'Naledi Moagi' },
  },
  {
    id: 'rapp-006',
    application_number: 'TA-2026-00841',
    submitted_at: '2026-03-01T09:30:00Z',
    current_status_code: 'REMANDED',
    current_stage_code: 'DOCUMENT_VERIFICATION',
    priority_code: 'HIGH',
    expected_decision_at: '2026-04-05T00:00:00Z',
    applicant_org: { legal_name: 'TechImport Botswana (Pty) Ltd' },
    device_catalog: { brand_name: 'OnePlus', model_name: 'CPH2573' },
    assigned_to: { id: 'off-001', name: 'Lesedi Modise' },
  },
  {
    id: 'rapp-007',
    application_number: 'TA-2026-00830',
    submitted_at: '2026-03-10T13:00:00Z',
    current_status_code: 'REMANDED',
    current_stage_code: 'TECHNICAL_VALIDATION',
    priority_code: 'NORMAL',
    expected_decision_at: '2026-03-31T00:00:00Z',
    applicant_org: { legal_name: 'Gaborone Electronics Ltd' },
    device_catalog: { brand_name: 'Oppo', model_name: 'CPH2557' },
    assigned_to: null,
  },
  {
    id: 'rapp-008',
    application_number: 'TA-2026-00812',
    submitted_at: '2026-03-04T10:00:00Z',
    current_status_code: 'APPROVED',
    current_stage_code: 'COMPLETED',
    priority_code: 'NORMAL',
    expected_decision_at: '2026-03-25T00:00:00Z',
    applicant_org: { legal_name: 'Mascom Wireless (Pty) Ltd' },
    device_catalog: { brand_name: 'Samsung', model_name: 'SM-G991B' },
    assigned_to: { id: 'off-005', name: 'Kefilwe Sithole' },
  },
]

export async function GET() {
  const supabase = getSupabaseAdmin()
  if (supabase) {
    try {
      const { data: apps, error } = await supabase
        .schema('workflow')
        .from('applications')
        .select('id, application_number, current_status_code, current_stage_code, priority_code, submitted_at, expected_decision_at, applicant_org_id')
        .eq('service_module_code', 'TYPE_APPROVAL')
        .not('current_status_code', 'eq', 'CANCELLED')
        .order('submitted_at', { ascending: false })
        .limit(50)
      if (!error && apps?.length) {
        // Try to get org names
        const orgIds = [...new Set(apps.map((a: { applicant_org_id: string }) => a.applicant_org_id).filter(Boolean))]
        let orgMap: Record<string, string> = {}
        if (orgIds.length) {
          const { data: orgs } = await supabase
            .schema('iam')
            .from('organizations')
            .select('id, legal_name')
            .in('id', orgIds)
          orgMap = Object.fromEntries((orgs ?? []).map((o: { id: string; legal_name: string }) => [o.id, o.legal_name]))
        }
        // Try to get TA app + device info
        const appIds = apps.map((a: { id: string }) => a.id)
        const { data: taApps } = await supabase
          .schema('device')
          .from('type_approval_applications')
          .select('workflow_application_id, device_model_id')
          .in('workflow_application_id', appIds)
        const modelIds = [...new Set((taApps ?? []).map((t: { device_model_id: string }) => t.device_model_id).filter(Boolean))]
        let devMap: Record<string, { brand_name: string; model_name: string }> = {}
        if (modelIds.length) {
          const { data: devices } = await supabase
            .schema('device')
            .from('catalog')
            .select('id, brand_name, model_name')
            .in('id', modelIds)
          devMap = Object.fromEntries(
            (devices ?? []).map((d: { id: string; brand_name: string; model_name: string }) => [d.id, d])
          )
        }
        const taMap: Record<string, string> = Object.fromEntries(
          (taApps ?? []).map((t: { workflow_application_id: string; device_model_id: string }) => [t.workflow_application_id, t.device_model_id])
        )

        return NextResponse.json(
          apps.map((a: { id: string; application_number: string; current_status_code: string; current_stage_code: string; priority_code: string; submitted_at: string; expected_decision_at: string; applicant_org_id: string }) => ({
            id: a.id,
            application_number: a.application_number,
            submitted_at: a.submitted_at,
            current_status_code: a.current_status_code,
            current_stage_code: a.current_stage_code,
            priority_code: a.priority_code ?? 'NORMAL',
            expected_decision_at: a.expected_decision_at,
            applicant_org: { legal_name: orgMap[a.applicant_org_id] ?? 'Unknown Organisation' },
            device_catalog: devMap[taMap[a.id]] ?? { brand_name: 'Unknown', model_name: 'Unknown' },
            assigned_to: null,
          }))
        )
      }
    } catch { /* fall through */ }
  }
  return NextResponse.json(MOCK_QUEUE)
}
