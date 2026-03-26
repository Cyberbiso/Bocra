import { NextResponse } from 'next/server'

// TODO: Replace with real query:
// SELECT c.id, c.certificate_number, c.certificate_type_code,
//        c.issued_at, c.status_code, c.qr_token, c.file_id,
//        dc.brand_name, dc.marketing_name, dc.model_name, dc.is_sim_enabled,
//        a.application_number,
//        o.legal_name AS issued_to
// FROM   docs.certificates c
// JOIN   docs.certificate_links cl  ON cl.certificate_id = c.id
// JOIN   device.type_approval_records tar ON tar.id = cl.record_id
// JOIN   device.device_catalog dc   ON dc.id = tar.device_model_id
// JOIN   workflow.applications a    ON a.id = cl.application_id
// JOIN   iam.organizations o        ON o.id = :current_org_id
// WHERE  cl.organisation_id = :current_org_id
//   AND  c.certificate_type_code = 'TYPE_APPROVAL'
// ORDER  BY c.issued_at DESC

const MOCK_CERTIFICATES = [
  {
    id: 'cert-001',
    certificate_number: 'TA/BW/2026/00123',
    certificate_type_code: 'TYPE_APPROVAL',
    issued_at: '2026-01-15T00:00:00Z',
    status_code: 'ACTIVE',
    qr_token: 'BOCRA-TA-2026-00123-QR',
    file_id: 'file-001',
    device_catalog: {
      brand_name: 'Samsung',
      marketing_name: 'Galaxy A55',
      model_name: 'SM-A556B',
      is_sim_enabled: true,
    },
    application: {
      application_number: 'TA-2026-00089',
    },
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
    device_catalog: {
      brand_name: 'Huawei',
      marketing_name: 'Nova 12',
      model_name: 'HWI-AL00',
      is_sim_enabled: true,
    },
    application: {
      application_number: 'TA-2025-00312',
    },
    issued_to: 'TechImport Botswana (Pty) Ltd',
  },
]

export async function GET() {
  return NextResponse.json(MOCK_CERTIFICATES)
}
