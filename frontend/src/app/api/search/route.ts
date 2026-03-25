import { NextRequest, NextResponse } from 'next/server'

// TODO: Replace mock responses with real BOCRA portal API calls:
//  - SearchCustomer  → GET https://customerportal.bocra.org.bw/api/customers/search?q={query}
//  - GetLicenseDetails → GET https://customerportal.bocra.org.bw/api/licences/{licenceNumber}
//  Authentication: Bearer token from session; pass as Authorization header.
//  Map the portal's response shape to the types below before returning.

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
  return fields.some((f) => f.toLowerCase().includes(lower))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = (searchParams.get('q') ?? '').trim()
  const category = (searchParams.get('category') ?? 'all') as SearchCategory

  // Simulate slight network latency in development
  await new Promise((r) => setTimeout(r, 250))

  const licences =
    category === 'all' || category === 'licence'
      ? MOCK_LICENCES.filter((r) => matchesQuery([r.clientName, r.licenceNumber, r.licenceType], q))
      : []

  const certificates =
    category === 'all' || category === 'certificate'
      ? MOCK_CERTIFICATES.filter((r) => matchesQuery([r.certificateNumber, r.type], q))
      : []

  const typeApprovals =
    category === 'all' || category === 'type-approval'
      ? MOCK_TYPE_APPROVALS.filter((r) => matchesQuery([r.brand, r.model, r.device], q))
      : []

  const devices =
    category === 'all' || category === 'imei'
      ? MOCK_DEVICES.filter((r) => matchesQuery([r.imei, r.brand, r.model], q))
      : []

  const organizations =
    category === 'all' || category === 'organization'
      ? MOCK_ORGANIZATIONS.filter((r) => matchesQuery([r.name, r.registrationNumber, r.type], q))
      : []

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
