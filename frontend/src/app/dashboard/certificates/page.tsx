'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldOff,
  Download,
  QrCode,
  FileText,
  Globe,
  Smartphone,
  ShieldCheck,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useRoleStore } from '@/lib/stores/role-store'
import type { CertStatus, VerifyResponse } from '@/app/api/certificates/verify/[token]/route'

// ─── Types ────────────────────────────────────────────────────────────────────

type CertType = 'LICENCE' | 'TYPE_APPROVAL' | 'EXEMPTION' | 'DEVICE_VERIFICATION'

interface Certificate {
  id: string
  certificateNumber: string
  type: CertType
  holder: string
  device?: string
  issueDate: string
  expiryDate: string
  status: CertStatus
  qrToken: string
  applicationId?: string
  ownerId?: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// TODO: Replace with GET https://op-web.bocra.org.bw/api/certificates?type={t}&q={q}&page={n}

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)
function addDays(d: Date, n: number) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10)
}

const MOCK_CERTS: Certificate[] = [
  {
    id: 'c1',
    certificateNumber: 'LCN-2024-0031',
    type: 'LICENCE',
    holder: 'BotswanaTel Communications (Pty) Ltd',
    issueDate: '2024-01-15',
    expiryDate: addDays(TODAY, 365),
    status: 'VALID',
    qrToken: 'qv-bottel-lcn',
    ownerId: 'user1',
  },
  {
    id: 'c2',
    certificateNumber: 'TA-2023-0142',
    type: 'TYPE_APPROVAL',
    holder: 'Samsung Electronics',
    device: 'Samsung Galaxy A55 5G',
    issueDate: '2023-05-20',
    expiryDate: addDays(TODAY, 180),
    status: 'VALID',
    qrToken: 'qv-samsung-a55',
    applicationId: 'APP-2023-00412',
    ownerId: 'user1',
  },
  {
    id: 'c3',
    certificateNumber: 'TA-2022-0089',
    type: 'TYPE_APPROVAL',
    holder: 'Huawei Technologies',
    device: 'Huawei P60 Pro',
    issueDate: '2022-03-10',
    expiryDate: addDays(TODAY, -90),
    status: 'EXPIRED',
    qrToken: 'qv-huawei-p60',
  },
  {
    id: 'c4',
    certificateNumber: 'EX-2025-0023',
    type: 'EXEMPTION',
    holder: 'Gaborone City Council',
    issueDate: '2025-01-08',
    expiryDate: addDays(TODAY, 730),
    status: 'VALID',
    qrToken: 'qv-gcc-ex',
  },
  {
    id: 'c5',
    certificateNumber: 'DVC-2024-0307',
    type: 'DEVICE_VERIFICATION',
    holder: 'BotswanaTel Communications (Pty) Ltd',
    device: 'Apple iPhone 15 Pro',
    issueDate: '2024-11-05',
    expiryDate: addDays(TODAY, 300),
    status: 'VALID',
    qrToken: 'qv-iph15-dvc',
    ownerId: 'user1',
  },
  {
    id: 'c6',
    certificateNumber: 'LCN-2021-0056',
    type: 'LICENCE',
    holder: 'Linkserve Botswana (Pty) Ltd',
    issueDate: '2021-09-01',
    expiryDate: addDays(TODAY, 60),
    status: 'SUSPENDED',
    qrToken: 'qv-linkserve-lcn',
  },
  {
    id: 'c7',
    certificateNumber: 'TA-2025-0098',
    type: 'TYPE_APPROVAL',
    holder: 'Xiaomi Inc',
    device: 'Xiaomi Redmi Note 13 Pro',
    issueDate: '2025-02-14',
    expiryDate: addDays(TODAY, 500),
    status: 'VALID',
    qrToken: 'qv-redmi13-ta',
    applicationId: 'APP-2025-00098',
    ownerId: 'user1',
  },
  {
    id: 'c8',
    certificateNumber: 'TA-2020-0014',
    type: 'TYPE_APPROVAL',
    holder: 'Motorola Mobility LLC',
    device: 'Motorola Moto G85',
    issueDate: '2020-07-12',
    expiryDate: addDays(TODAY, -400),
    status: 'REVOKED',
    qrToken: 'qv-motorola-g85',
  },
]

// ─── Config maps ──────────────────────────────────────────────────────────────

const CERT_TYPE_CONFIG: Record<CertType, {
  label: string
  shortLabel: string
  icon: React.ElementType
  cls: string
}> = {
  LICENCE:             { label: 'Licence Certificate',             shortLabel: 'Licence',       icon: FileText,   cls: 'bg-blue-50 text-blue-700 border-blue-200'        },
  TYPE_APPROVAL:       { label: 'Type Approval Certificate',       shortLabel: 'Type Approval', icon: ShieldCheck,cls: 'bg-teal-50 text-teal-700 border-teal-200'        },
  EXEMPTION:           { label: 'Exemption Certificate',           shortLabel: 'Exemption',     icon: Globe,      cls: 'bg-purple-50 text-purple-700 border-purple-200'  },
  DEVICE_VERIFICATION: { label: 'Device Verification Certificate', shortLabel: 'Device',        icon: Smartphone, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
}

const STATUS_CONFIG: Record<CertStatus | 'NOT_FOUND', {
  label: string
  icon: React.ElementType
  badge: string
}> = {
  VALID:      { label: 'Valid',     icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPIRED:    { label: 'Expired',   icon: Clock,        badge: 'bg-gray-100 text-gray-500 border-gray-200'         },
  REVOKED:    { label: 'Revoked',   icon: XCircle,      badge: 'bg-red-100 text-red-800 border-red-300'            },
  SUSPENDED:  { label: 'Suspended', icon: AlertTriangle,badge: 'bg-orange-50 text-orange-700 border-orange-200'    },
  NOT_FOUND:  { label: 'Not Found', icon: ShieldOff,    badge: 'bg-gray-100 text-gray-500 border-gray-200'         },
}

const FILTER_OPTIONS: { value: CertType | 'ALL'; label: string }[] = [
  { value: 'ALL',                label: 'All Certificates'                },
  { value: 'LICENCE',            label: 'Licence Certificates'            },
  { value: 'TYPE_APPROVAL',      label: 'Type Approval Certificates'      },
  { value: 'EXEMPTION',          label: 'Exemption Certificates'          },
  { value: 'DEVICE_VERIFICATION',label: 'Device Verification Certificates'},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const t = new Date(dateStr); t.setHours(0, 0, 0, 0)
  return Math.ceil((t.getTime() - TODAY.getTime()) / 86_400_000)
}

function downloadCertText(cert: Certificate) {
  const date = new Date().toLocaleDateString('en-BW', { day: '2-digit', month: 'long', year: 'numeric' })
  const content = [
    '======================================================',
    '  BOTSWANA COMMUNICATIONS REGULATORY AUTHORITY',
    `  ${CERT_TYPE_CONFIG[cert.type].label.toUpperCase()}`,
    '======================================================',
    `  Certificate No: ${cert.certificateNumber}`,
    `  Holder:         ${cert.holder}`,
    cert.device ? `  Device:         ${cert.device}` : null,
    `  Issue Date:     ${cert.issueDate}`,
    `  Expiry Date:    ${cert.expiryDate}`,
    `  Status:         ${cert.status}`,
    `  Downloaded:     ${date}`,
    '------------------------------------------------------',
    '  Verify online: www.bocra.org.bw/verify',
    `  QR Token:      ${cert.qrToken}`,
    '======================================================',
  ].filter(Boolean).join('\n')

  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `BOCRA_${cert.certificateNumber.replace(/\//g, '-')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Shared badge components ──────────────────────────────────────────────────

function CertTypeBadge({ type }: { type: CertType }) {
  const { shortLabel, icon: Icon, cls } = CERT_TYPE_CONFIG[type]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', cls)}>
      <Icon className="w-3 h-3" />
      {shortLabel}
    </span>
  )
}

function StatusBadge({ status }: { status: CertStatus }) {
  const { label, icon: Icon, badge } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', badge)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// ─── QR Verify Dialog ─────────────────────────────────────────────────────────

function QrVerifyDialog({
  cert,
  open,
  onClose,
}: {
  cert: Certificate | null
  open: boolean
  onClose: () => void
}) {
  const [result,  setResult]  = useState<VerifyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (!cert) { setResult(null); return }
    let cancelled = false
    setLoading(true)
    setFetchError(false)
    setResult(null)

    fetch(`/api/certificates/verify/${cert.qrToken}`)
      .then((r) => r.json())
      .then((data: VerifyResponse) => { if (!cancelled) { setResult(data); setLoading(false) } })
      .catch(() => { if (!cancelled) { setFetchError(true); setLoading(false) } })

    return () => { cancelled = true }
  }, [cert])

  const isValid = result?.valid === true
  const statusCfg = result
    ? (STATUS_CONFIG[(result.status as CertStatus)] ?? STATUS_CONFIG['NOT_FOUND'])
    : null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogTitle className="sr-only">
          Certificate Verification — {cert?.certificateNumber}
        </DialogTitle>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#003580]" />
            <p className="text-sm text-gray-500">Verifying certificate…</p>
          </div>
        )}

        {/* Network error */}
        {fetchError && !loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <ShieldOff className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Verification unavailable</p>
            <p className="text-xs text-gray-500">Could not reach the BOCRA verification service. Please try again.</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Icon + headline */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full',
                isValid ? 'bg-emerald-100' : 'bg-red-100',
              )}>
                {isValid
                  ? <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                  : <XCircle      className="w-9 h-9 text-red-500"     />
                }
              </div>
              <div className="text-center">
                <p className={cn('text-base font-bold', isValid ? 'text-emerald-700' : 'text-red-700')}>
                  {isValid ? 'Certificate Verified' : 'Verification Failed'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Checked at {new Date(result.verifiedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Certificate number banner */}
            <div className="rounded-xl border-2 border-[#003580]/15 bg-[#003580]/4 px-4 py-3 text-center">
              <p className="text-xs text-[#003580]/60 font-medium uppercase tracking-wide mb-0.5">
                {result.type}
              </p>
              <p className="font-mono text-lg font-bold text-[#003580]">
                {result.certificateNumber}
              </p>
            </div>

            {/* Detail grid */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-gray-400">Issued To</dt>
                <dd className="text-sm font-medium text-gray-800 mt-0.5 leading-snug">{result.issuedTo}</dd>
              </div>
              {result.device && (
                <div>
                  <dt className="text-xs text-gray-400">Device</dt>
                  <dd className="text-sm font-medium text-gray-800 mt-0.5">{result.device}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400">Issue Date</dt>
                <dd className="text-sm font-medium text-gray-800 mt-0.5">{result.issueDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Valid Until</dt>
                <dd className={cn(
                  'text-sm font-medium mt-0.5',
                  isValid && daysUntil(result.validUntil) <= 60 ? 'text-amber-600' : 'text-gray-800',
                )}>
                  {result.validUntil}
                  {isValid && daysUntil(result.validUntil) > 0 && daysUntil(result.validUntil) <= 60 && (
                    <span className="block text-xs text-amber-500 font-normal">
                      {daysUntil(result.validUntil)} days remaining
                    </span>
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-gray-400 mb-1.5">Status</dt>
                <dd>
                  {statusCfg && (
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold',
                      statusCfg.badge,
                    )}>
                      <statusCfg.icon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-gray-400">Issued By</dt>
                <dd className="text-sm text-gray-700 mt-0.5">{result.issuedBy}</dd>
              </div>
            </dl>

            {/* Remarks */}
            {result.remarks && (
              <div className="flex items-start gap-2 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800 leading-relaxed">{result.remarks}</p>
              </div>
            )}

            {/* BOCRA branding footer */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-center">
              <p className="text-xs text-gray-500">
                Verified by{' '}
                <span className="font-semibold text-[#003580]">BOCRA</span>
                {' '}— Botswana Communications Regulatory Authority
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                www.bocra.org.bw &nbsp;·&nbsp; +267 395 7755
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500',
      'border-b border-gray-200 whitespace-nowrap',
      className,
    )}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-3 text-sm border-b border-gray-100 align-top', className)}>
      {children}
    </td>
  )
}

// ─── Certificate table ────────────────────────────────────────────────────────

function CertTable({
  certs,
  showApplicationLink,
  onVerify,
}: {
  certs: Certificate[]
  showApplicationLink?: boolean
  onVerify: (cert: Certificate) => void
}) {
  if (certs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-gray-400">
        <ShieldCheck className="w-8 h-8 mb-2" />
        <p className="text-sm">No certificates match your search.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr>
            <Th>Certificate No.</Th>
            <Th>Type</Th>
            <Th className="min-w-[200px]">Holder / Device</Th>
            <Th>Issue Date</Th>
            <Th>Expiry Date</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {certs.map((cert) => {
            const days = daysUntil(cert.expiryDate)
            return (
              <tr key={cert.id} className="hover:bg-gray-50/60 transition-colors">
                <Td>
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
                    {cert.certificateNumber}
                  </code>
                </Td>
                <Td><CertTypeBadge type={cert.type} /></Td>
                <Td>
                  <p className="font-medium text-gray-800 leading-snug">{cert.holder}</p>
                  {cert.device && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 shrink-0" />
                      {cert.device}
                    </p>
                  )}
                </Td>
                <Td className="text-gray-500 whitespace-nowrap">{cert.issueDate}</Td>
                <Td className="whitespace-nowrap">
                  <span className={cn(
                    'text-sm',
                    cert.status === 'VALID' && days <= 14 ? 'text-red-600 font-semibold' :
                    cert.status === 'VALID' && days <= 60 ? 'text-amber-600 font-medium' :
                    cert.status !== 'VALID'               ? 'text-gray-400 line-through'  :
                                                            'text-gray-500',
                  )}>
                    {cert.expiryDate}
                  </span>
                  {cert.status === 'VALID' && days > 0 && days <= 60 && (
                    <p className={cn('text-xs mt-0.5', days <= 14 ? 'text-red-500' : 'text-amber-500')}>
                      {days}d remaining
                    </p>
                  )}
                </Td>
                <Td><StatusBadge status={cert.status} /></Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onVerify(cert)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-md border border-[#003580]/25 text-[#003580] hover:bg-[#003580]/5 transition-colors"
                      title="Verify via QR"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      QR Verify
                    </button>
                    <button
                      onClick={() => downloadCertText(cert)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      title="Download certificate"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {showApplicationLink && cert.applicationId && (
                      <Link
                        href={`/dashboard/licensing/${cert.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        title="View application"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({
  query,
  onQuery,
  filter,
  onFilter,
}: {
  query: string
  onQuery: (v: string) => void
  filter: CertType | 'ALL'
  onFilter: (v: CertType | 'ALL') => void
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by certificate number, holder, or device…"
          className={cn(
            'w-full rounded-xl border-2 border-gray-200 bg-white pl-9 pr-10 py-3 text-sm text-gray-800',
            'placeholder:text-gray-400 focus:outline-none focus:border-[#003580] transition-colors',
          )}
        />
        {query && (
          <button
            onClick={() => onQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilter(opt.value)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors shrink-0',
              filter === opt.value
                ? 'border-[#003580] bg-[#003580] text-white'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const role = useRoleStore((s) => s.role)

  const [query,  setQuery]  = useState('')
  const [filter, setFilter] = useState<CertType | 'ALL'>('ALL')
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [dialogOpen,   setDialogOpen]   = useState(false)

  const handleVerify = (cert: Certificate) => {
    setSelectedCert(cert)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setTimeout(() => setSelectedCert(null), 200)
  }

  const filteredCerts = useMemo(() => {
    const q = query.toLowerCase().trim()
    return MOCK_CERTS.filter((c) => {
      const matchesType  = filter === 'ALL' || c.type === filter
      const matchesQuery = !q || [c.certificateNumber, c.holder, c.device ?? '']
        .some((s) => s.toLowerCase().includes(q))
      return matchesType && matchesQuery
    })
  }, [query, filter])

  const myCerts = useMemo(
    () => filteredCerts.filter((c) => !!c.ownerId),
    [filteredCerts],
  )

  const isLoggedIn = role !== 'public'

  const validCount    = MOCK_CERTS.filter((c) => c.status === 'VALID').length
  const expiringCount = MOCK_CERTS.filter((c) => c.status === 'VALID' && daysUntil(c.expiryDate) <= 60).length
  const issueCount    = MOCK_CERTS.filter((c) => c.status !== 'VALID').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates & Registers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search and verify BOCRA-issued certificates. The public register is accessible to everyone.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} valid
          </span>
          {expiringCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">
              <Clock className="w-3.5 h-3.5" /> {expiringCount} expiring
            </span>
          )}
          {issueCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" /> {issueCount} issues
            </span>
          )}
        </div>
      </div>

      {/* ── Public Register ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[#003580]" />
            <h2 className="text-sm font-semibold text-gray-700">Public Certificate Register</h2>
            <span className="text-xs text-gray-400">— accessible to everyone</span>
          </div>
          <SearchBar
            query={query}
            onQuery={setQuery}
            filter={filter}
            onFilter={setFilter}
          />
        </div>

        <CertTable certs={filteredCerts} onVerify={handleVerify} />

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">
            Showing {filteredCerts.length} of {MOCK_CERTS.length} certificate{MOCK_CERTS.length !== 1 ? 's' : ''}
            {query && <> matching &ldquo;{query}&rdquo;</>}
          </p>
        </div>
      </div>

      {/* ── My Certificates ──────────────────────────────────────────────── */}
      {isLoggedIn ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#003580]" />
              <h2 className="text-sm font-semibold text-gray-700">My Certificates</h2>
              <span className="text-xs text-gray-400">— your organisation's issued certificates</span>
            </div>
            {myCerts.length > 0 && (
              <span className="text-xs text-gray-400">{myCerts.length} certificate{myCerts.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {myCerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <FileText className="w-8 h-8 mb-2" />
              <p className="text-sm">No certificates found for your organisation{query ? ' matching your search' : ''}.</p>
              {query && (
                <button onClick={() => setQuery('')} className="mt-2 text-xs text-[#003580] hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <CertTable certs={myCerts} showApplicationLink onVerify={handleVerify} />
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {myCerts.length} certificate{myCerts.length !== 1 ? 's' : ''} in your account
                </p>
                <Link
                  href="/dashboard/licensing"
                  className="flex items-center gap-1 text-xs font-medium text-[#003580] hover:text-[#002a6b]"
                >
                  View all applications <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-[#003580]/15 bg-[#003580]/4 px-4 py-3.5">
          <AlertCircle className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            Switch to <strong>Applicant</strong> or <strong>Officer</strong> in the sidebar to see{' '}
            <strong>My Certificates</strong> — your organisation's certificates and application history.
          </p>
        </div>
      )}

      {/* QR Verify Dialog — single shared instance */}
      <QrVerifyDialog
        cert={selectedCert}
        open={dialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  )
}
