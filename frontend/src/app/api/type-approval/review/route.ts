import { NextResponse } from 'next/server'

// TODO: Replace with real query:
// SELECT a.id, a.application_number, a.submitted_at,
//        a.current_status_code, a.current_stage_code,
//        a.priority_code, a.expected_decision_at,
//        o.legal_name AS org_name,
//        dc.brand_name, dc.model_name,
//        u.full_name AS assigned_to_name,
//        t.assigned_to_user_id
// FROM   workflow.applications a
// JOIN   iam.organizations o       ON o.id = a.applicant_org_id
// JOIN   device.type_approval_applications ta ON ta.application_id = a.id
// JOIN   device.device_catalog dc  ON dc.id = ta.device_model_id
// LEFT JOIN workflow.application_tasks t
//        ON t.application_id = a.id AND t.task_type_code = 'REVIEW'
// LEFT JOIN iam.users u ON u.id = t.assigned_to_user_id
// WHERE  a.service_module_code = 'TYPE_APPROVAL'
// ORDER  BY a.submitted_at DESC

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
  return NextResponse.json(MOCK_QUEUE)
}
