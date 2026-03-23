import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CertStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED'

export interface VerifyResponse {
  token: string
  valid: boolean
  certificateNumber: string
  type: string
  issuedTo: string
  device?: string
  issueDate: string
  validUntil: string
  status: CertStatus
  issuedBy: string
  remarks?: string
  verifiedAt: string
}

// ─── Mock certificate store (keyed by QR token) ───────────────────────────────
// TODO: Replace with GET https://op-web.bocra.org.bw/api/certificates/verify/{token}

const TODAY = new Date()
function addDays(d: Date, n: number) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10)
}

const MOCK_STORE: Record<string, Omit<VerifyResponse, 'token' | 'verifiedAt'>> = {
  'qv-bottel-lcn': {
    valid: true,
    certificateNumber: 'LCN-2024-0031',
    type: 'Licence Certificate',
    issuedTo: 'BotswanaTel Communications (Pty) Ltd',
    issueDate: '2024-01-15',
    validUntil: addDays(TODAY, 365),
    status: 'VALID',
    issuedBy: 'BOCRA Licensing Department',
  },
  'qv-samsung-a55': {
    valid: true,
    certificateNumber: 'TA-2023-0142',
    type: 'Type Approval Certificate',
    issuedTo: 'Samsung Electronics',
    device: 'Samsung Galaxy A55 5G',
    issueDate: '2023-05-20',
    validUntil: addDays(TODAY, 180),
    status: 'VALID',
    issuedBy: 'BOCRA Type Approval Department',
  },
  'qv-huawei-p60': {
    valid: false,
    certificateNumber: 'TA-2022-0089',
    type: 'Type Approval Certificate',
    issuedTo: 'Huawei Technologies',
    device: 'Huawei P60 Pro',
    issueDate: '2022-03-10',
    validUntil: addDays(TODAY, -90),
    status: 'EXPIRED',
    issuedBy: 'BOCRA Type Approval Department',
    remarks: 'This certificate has expired and is no longer valid. A renewal application must be submitted.',
  },
  'qv-gcc-ex': {
    valid: true,
    certificateNumber: 'EX-2025-0023',
    type: 'Exemption Certificate',
    issuedTo: 'Gaborone City Council',
    issueDate: '2025-01-08',
    validUntil: addDays(TODAY, 730),
    status: 'VALID',
    issuedBy: 'BOCRA Spectrum Management Department',
  },
  'qv-iph15-dvc': {
    valid: true,
    certificateNumber: 'DVC-2024-0307',
    type: 'Device Verification Certificate',
    issuedTo: 'BotswanaTel Communications (Pty) Ltd',
    device: 'Apple iPhone 15 Pro',
    issueDate: '2024-11-05',
    validUntil: addDays(TODAY, 300),
    status: 'VALID',
    issuedBy: 'BOCRA Type Approval Department',
  },
  'qv-linkserve-lcn': {
    valid: false,
    certificateNumber: 'LCN-2021-0056',
    type: 'Licence Certificate',
    issuedTo: 'Linkserve Botswana (Pty) Ltd',
    issueDate: '2021-09-01',
    validUntil: addDays(TODAY, 60),
    status: 'SUSPENDED',
    issuedBy: 'BOCRA Licensing Department',
    remarks: 'Licence suspended pending investigation into service quality non-compliance. Contact BOCRA for details.',
  },
  'qv-redmi13-ta': {
    valid: true,
    certificateNumber: 'TA-2025-0098',
    type: 'Type Approval Certificate',
    issuedTo: 'Xiaomi Inc',
    device: 'Xiaomi Redmi Note 13 Pro',
    issueDate: '2025-02-14',
    validUntil: addDays(TODAY, 500),
    status: 'VALID',
    issuedBy: 'BOCRA Type Approval Department',
  },
  'qv-motorola-g85': {
    valid: false,
    certificateNumber: 'TA-2020-0014',
    type: 'Type Approval Certificate',
    issuedTo: 'Motorola Mobility LLC',
    device: 'Motorola Moto G85',
    issueDate: '2020-07-12',
    validUntil: addDays(TODAY, -400),
    status: 'REVOKED',
    issuedBy: 'BOCRA Type Approval Department',
    remarks: 'Certificate revoked following post-market surveillance findings. Device must not be imported or sold in Botswana.',
  },
}

// ─── GET /api/certificates/verify/[token] ─────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // Simulate network latency
  await new Promise((r) => setTimeout(r, 300))

  const record = MOCK_STORE[token]
  if (!record) {
    return NextResponse.json(
      {
        token,
        valid: false,
        status: 'NOT_FOUND',
        remarks: 'No certificate found for this QR token. It may be invalid, tampered with, or from a different issuer.',
        verifiedAt: new Date().toISOString(),
      },
      { status: 404 },
    )
  }

  return NextResponse.json({ token, ...record, verifiedAt: new Date().toISOString() })
}
