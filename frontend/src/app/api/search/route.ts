import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export type SearchCategory = 'all' | 'licence' | 'certificate' | 'type-approval' | 'imei' | 'organization'

export interface LicenceResult {
  id: string
  clientName: string
  licenceNumber: string
  licenceType: string
  status: 'Active' | 'Expired' | 'Suspended' | 'Pending'
  expiryDate: string
}

export interface CertificateResult {
  id: string
  certificateNumber: string
  type: string
  issuedDate: string
  status: 'Valid' | 'Expired' | 'Revoked'
}

export interface TypeApprovalResult {
  id: string
  device: string
  brand: string
  model: string
  approvalDate: string
  status: 'Approved' | 'Rejected' | 'Pending'
}

export interface ImeiResult {
  id: string
  imei: string
  brand: string
  model: string
  verificationStatus: 'Registered' | 'Unregistered' | 'Blacklisted' | 'Reported Stolen'
}

export interface OrganizationResult {
  id: string
  name: string
  registrationNumber: string
  type: string
  status: 'Active' | 'Inactive' | 'Suspended'
}

export interface SearchResponse {
  licences: LicenceResult[]
  certificates: CertificateResult[]
  typeApprovals: TypeApprovalResult[]
  devices: ImeiResult[]
  organizations: OrganizationResult[]
  meta: { query: string; category: SearchCategory; totalResults: number }
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LICENCES: LicenceResult[] = [
  { id: 'l1', clientName: 'Mascom Wireless (Pty) Ltd', licenceNumber: 'ECN-2019-0031', licenceType: 'Electronic Communications Network', status: 'Active', expiryDate: '2027-06-30' },
  { id: 'l2', clientName: 'Orange Botswana (Pty) Ltd', licenceNumber: 'ECS-2019-0044', licenceType: 'Electronic Communications Service', status: 'Active', expiryDate: '2026-12-31' },
  { id: 'l3', clientName: 'BTC Broadband', licenceNumber: 'ISP-2021-0012', licenceType: 'Internet Service Provider', status: 'Active', expiryDate: '2025-09-15' },
  { id: 'l4', clientName: 'Botswana Postal Services', licenceNumber: 'POS-2018-0003', licenceType: 'Postal Licence', status: 'Active', expiryDate: '2028-03-31' },
  { id: 'l5', clientName: 'Techbridge Solutions', licenceNumber: 'VSAT-2022-0007', licenceType: 'VSAT Licence', status: 'Suspended', expiryDate: '2024-12-01' },
  { id: 'l6', clientName: 'Kalahari Cable TV', licenceNumber: 'BRD-2020-0002', licenceType: 'Broadcasting Licence', status: 'Expired', expiryDate: '2024-01-15' },
]

const MOCK_CERTIFICATES: CertificateResult[] = [
  { id: 'c1', certificateNumber: 'TA-CERT-2024-00217', type: 'Type Approval Certificate', issuedDate: '2024-03-10', status: 'Valid' },
  { id: 'c2', certificateNumber: 'REG-CERT-2023-00841', type: 'Registration Certificate', issuedDate: '2023-11-22', status: 'Valid' },
  { id: 'c3', certificateNumber: 'SPEC-CERT-2022-00059', type: 'Spectrum Authorisation', issuedDate: '2022-07-01', status: 'Expired' },
  { id: 'c4', certificateNumber: 'ISP-CERT-2024-00118', type: 'ISP Compliance Certificate', issuedDate: '2024-01-15', status: 'Valid' },
]

const MOCK_TYPE_APPROVALS: TypeApprovalResult[] = [
  { id: 'ta1', device: 'Smartphone', brand: 'Samsung', model: 'Galaxy A55 5G', approvalDate: '2024-02-14', status: 'Approved' },
  { id: 'ta2', device: 'Smartphone', brand: 'Apple', model: 'iPhone 15 Pro', approvalDate: '2023-10-05', status: 'Approved' },
  { id: 'ta3', device: 'Router', brand: 'Huawei', model: 'AX3 Pro Wi-Fi 6', approvalDate: '2024-01-20', status: 'Approved' },
  { id: 'ta4', device: 'Feature Phone', brand: 'Nokia', model: '105 4G', approvalDate: '2023-08-30', status: 'Approved' },
  { id: 'ta5', device: 'Tablet', brand: 'Xiaomi', model: 'Redmi Pad SE', approvalDate: '2024-03-18', status: 'Pending' },
  { id: 'ta6', device: 'Modem', brand: 'ZTE', model: 'MF286D', approvalDate: '2022-11-01', status: 'Rejected' },
]

const MOCK_DEVICES: ImeiResult[] = [
  { id: 'd1', imei: '354789100234561', brand: 'Samsung', model: 'Galaxy A55 5G', verificationStatus: 'Registered' },
  { id: 'd2', imei: '356123400891234', brand: 'Apple', model: 'iPhone 14', verificationStatus: 'Registered' },
  { id: 'd3', imei: '350112233445566', brand: 'Tecno', model: 'Camon 20', verificationStatus: 'Blacklisted' },
  { id: 'd4', imei: '352987600112233', brand: 'Samsung', model: 'Galaxy S22', verificationStatus: 'Reported Stolen' },
  { id: 'd5', imei: '490154203237518', brand: 'Huawei', model: 'Nova 11', verificationStatus: 'Unregistered' },
]

const MOCK_ORGANIZATIONS: OrganizationResult[] = [
  { id: 'o1', name: 'Mascom Wireless (Pty) Ltd', registrationNumber: 'BW-REG-2000-000041', type: 'Mobile Network Operator', status: 'Active' },
  { id: 'o2', name: 'Orange Botswana (Pty) Ltd', registrationNumber: 'BW-REG-1999-000017', type: 'Mobile Network Operator', status: 'Active' },
  { id: 'o3', name: 'Botswana Telecommunications Corporation', registrationNumber: 'BW-REG-1996-000003', type: 'Fixed Network Operator', status: 'Active' },
  { id: 'o4', name: 'Kalahari Cable TV', registrationNumber: 'BW-REG-2010-000089', type: 'Broadcasting Company', status: 'Inactive' },
]

function matchesQuery(fields: string[], q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  return fields.some((f) => String(f).toLowerCase().includes(lower))
}

function mapLicenceStatus(code: string): LicenceResult['status'] {
  const map: Record<string, LicenceResult['status']> = {
    ACTIVE: 'Active', EXPIRED: 'Expired', SUSPENDED: 'Suspended',
    CANCELLED: 'Expired', PENDING: 'Pending',
  }
  return map[code?.toUpperCase()] ?? 'Active'
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = (searchParams.get('q') ?? '').trim()
  const category = (searchParams.get('category') ?? 'all') as SearchCategory

  const supabase = getSupabaseAdmin()

  // ── Licences (Supabase licensing schema) ────────────────────────────────────
  let licences: LicenceResult[] = []
  if (category === 'all' || category === 'licence') {
    if (supabase) {
      try {
        let query = supabase
          .schema('licensing')
          .from('licenses')
          .select('id, license_number, license_type, holder_name, status_code, expiry_date')
          .limit(50)
        if (q) query = query.or(
          `license_number.ilike.%${q}%,license_type.ilike.%${q}%,holder_name.ilike.%${q}%`
        )
        const { data, error } = await query
        if (!error && data?.length) {
          licences = data.map((r) => ({
            id:            r.id,
            clientName:    r.holder_name ?? '—',
            licenceNumber: r.license_number,
            licenceType:   r.license_type ?? '—',
            status:        mapLicenceStatus(r.status_code),
            expiryDate:    r.expiry_date?.slice(0, 10) ?? '',
          }))
        } else {
          licences = MOCK_LICENCES.filter((r) => matchesQuery([r.clientName, r.licenceNumber, r.licenceType], q))
        }
      } catch {
        licences = MOCK_LICENCES.filter((r) => matchesQuery([r.clientName, r.licenceNumber, r.licenceType], q))
      }
    } else {
      licences = MOCK_LICENCES.filter((r) => matchesQuery([r.clientName, r.licenceNumber, r.licenceType], q))
    }
  }

  const certificates: CertificateResult[] = []

  // ── Type approvals (docs.certificates + device.catalog) ─────────────────────
  let typeApprovals: TypeApprovalResult[] = []
  if (category === 'all' || category === 'type-approval') {
    if (supabase) {
      try {
        let certQ = supabase
          .schema('docs')
          .from('certificates')
          .select('id, certificate_number, holder_name, device_name, issue_date, status_code')
          .eq('certificate_type', 'TYPE_APPROVAL')
          .limit(50)
        if (q) certQ = certQ.or(
          `certificate_number.ilike.%${q}%,holder_name.ilike.%${q}%,device_name.ilike.%${q}%`
        )
        const { data: certs, error } = await certQ
        if (!error && certs?.length) {
          // Enrich with device catalog
          const { data: records } = await supabase
            .schema('device')
            .from('type_approval_records')
            .select('certificate_id, device_model_id')
            .in('certificate_id', certs.map((c: { id: string }) => c.id))
          const modelIds = [...new Set((records ?? []).map((r: { device_model_id: string }) => r.device_model_id).filter(Boolean))]
          let devMap: Record<string, { brand_name: string; marketing_name: string; model_name: string }> = {}
          if (modelIds.length) {
            const { data: devices } = await supabase
              .schema('device')
              .from('catalog')
              .select('id, brand_name, marketing_name, model_name')
              .in('id', modelIds)
            devMap = Object.fromEntries((devices ?? []).map((d: { id: string; brand_name: string; marketing_name: string; model_name: string }) => [d.id, d]))
          }
          const recByCert = Object.fromEntries(
            (records ?? []).map((r: { certificate_id: string; device_model_id: string }) => [r.certificate_id, r.device_model_id])
          )
          typeApprovals = certs.map((c: { id: string; certificate_number: string; device_name: string; issue_date: string; status_code: string }) => {
            const dev = devMap[recByCert[c.id]]
            const nameParts = (c.device_name ?? '').split(' ')
            return {
              id:           c.id,
              device:       dev?.marketing_name ?? c.device_name ?? '—',
              brand:        dev?.brand_name     ?? nameParts[0] ?? '—',
              model:        dev?.model_name     ?? (nameParts.slice(1).join(' ') || '—'),
              approvalDate: c.issue_date?.slice(0, 10) ?? '',
              status:       mapTAStatus(c.status_code),
            }
          })
        } else {
          typeApprovals = MOCK_TYPE_APPROVALS.filter((r) => matchesQuery([r.brand, r.model, r.device], q))
        }
      } catch {
        typeApprovals = MOCK_TYPE_APPROVALS.filter((r) => matchesQuery([r.brand, r.model, r.device], q))
      }
    } else {
      typeApprovals = MOCK_TYPE_APPROVALS.filter((r) => matchesQuery([r.brand, r.model, r.device], q))
    }
  }

  // ── IMEI / devices (mock only — no dedicated schema yet) ────────────────────
  const devices =
    category === 'all' || category === 'imei'
      ? MOCK_DEVICES.filter((r) => matchesQuery([r.imei, r.brand, r.model], q))
      : []

  // ── Organisations (iam.organizations) ───────────────────────────────────────
  let organizations: OrganizationResult[] = []
  if (category === 'all' || category === 'organization') {
    if (supabase) {
      try {
        let orgQ = supabase
          .schema('iam')
          .from('organizations')
          .select('id, legal_name, trading_name, org_type_code, registration_number, status_code')
          .limit(50)
        if (q) orgQ = orgQ.or(
          `legal_name.ilike.%${q}%,trading_name.ilike.%${q}%,registration_number.ilike.%${q}%`
        )
        const { data: orgs, error } = await orgQ
        if (!error && orgs?.length) {
          organizations = orgs.map((o: { id: string; legal_name: string; trading_name: string | null; org_type_code: string | null; registration_number: string | null; status_code: string }) => ({
            id:                 o.id,
            name:               o.legal_name,
            registrationNumber: o.registration_number ?? '—',
            type:               o.org_type_code ?? '—',
            status:             mapOrgStatus(o.status_code),
          }))
        } else {
          organizations = MOCK_ORGANIZATIONS.filter((r) => matchesQuery([r.name, r.registrationNumber, r.type], q))
        }
      } catch {
        organizations = MOCK_ORGANIZATIONS.filter((r) => matchesQuery([r.name, r.registrationNumber, r.type], q))
      }
    } else {
      organizations = MOCK_ORGANIZATIONS.filter((r) => matchesQuery([r.name, r.registrationNumber, r.type], q))
    }
  }

  const totalResults =
    licences.length + certificates.length + typeApprovals.length + devices.length + organizations.length

  const response: SearchResponse = {
    licences,
    certificates,
    typeApprovals,
    devices,
    organizations,
    meta: { query: q, category, totalResults },
  }

  return NextResponse.json(response)
}
