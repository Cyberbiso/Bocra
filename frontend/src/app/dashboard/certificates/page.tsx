'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  QrCode,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Plus,
  AlertTriangle,
  UserCheck,
  ChevronRight,
  Flag,
  Users,
  BarChart3,
  Timer,
  ClipboardCheck,
  ThumbsUp,
  RotateCcw,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useRoleStore } from '@/lib/stores/role-store'

// ─── Types ────────────────────────────────────────────────────────────────────

type TAStatus      = 'ACTIVE' | 'EXPIRED' | 'REVOKED'
type ReviewStatus  = 'PENDING' | 'VALIDATED' | 'REMANDED' | 'APPROVED'
type PriorityCode  = 'HIGH' | 'NORMAL' | 'LOW'

interface TACertificate {
  id: string
  certificate_number: string
  certificate_type_code: string
  issued_at: string
  status_code: TAStatus
  qr_token: string
  file_id: string | null
  device_catalog: {
    brand_name: string
    marketing_name: string
    model_name: string
    is_sim_enabled: boolean
  }
  application: { application_number: string } | null
  issued_to: string
}

interface ReviewApplication {
  id: string
  application_number: string
  submitted_at: string
  current_status_code: ReviewStatus
  current_stage_code: string
  priority_code: PriorityCode
  expected_decision_at: string
  applicant_org: { legal_name: string }
  device_catalog: { brand_name: string; model_name: string }
  assigned_to: { id: string; name: string } | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CERT_STATUS_CONFIG: Record<TAStatus, {
  label: string; icon: React.ElementType; badge: string
}> = {
  ACTIVE:  { label: 'Active',  icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  EXPIRED: { label: 'Expired', icon: Clock,        badge: 'bg-gray-100 text-gray-500 border-gray-200'         },
  REVOKED: { label: 'Revoked', icon: XCircle,      badge: 'bg-red-100 text-red-700 border-red-200'            },
}

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; badge: string }> = {
  PENDING:   { label: 'Pending',             badge: 'bg-amber-100 text-amber-700 border-amber-200'       },
  VALIDATED: { label: 'Awaiting Validation', badge: 'bg-blue-100 text-blue-700 border-blue-200'          },
  REMANDED:  { label: 'Remanded',            badge: 'bg-orange-100 text-orange-700 border-orange-200'    },
  APPROVED:  { label: 'Approved',            badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

const PRIORITY_CONFIG: Record<PriorityCode, { label: string; badge: string }> = {
  HIGH:   { label: 'High',   badge: 'bg-red-100 text-red-700 border-red-200'    },
  NORMAL: { label: 'Normal', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  LOW:    { label: 'Low',    badge: 'bg-blue-100 text-blue-700 border-blue-200' },
}

const MOCK_OFFICERS = [
  { id: 'off-001', name: 'Lesedi Modise'   },
  { id: 'off-002', name: 'Boipelo Kgosi'   },
  { id: 'off-003', name: 'Thato Sebele'    },
  { id: 'off-004', name: 'Naledi Moagi'    },
  { id: 'off-005', name: 'Kefilwe Sithole' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string)     { return format(new Date(iso), 'dd MMM yyyy') }
function fmtDateLong(iso: string) { return format(new Date(iso), 'dd MMMM yyyy') }

function daysFromNow(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function queueDayCls(days: number) {
  if (days < 7)  return 'text-emerald-600 font-semibold'
  if (days <= 14) return 'text-amber-600 font-semibold'
  return 'text-red-600 font-semibold'
}

function fmtStage(code: string) {
  return code.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function downloadMockCert(cert: TACertificate) {
  const dc = cert.device_catalog
  const content = [
    '=============================================================',
    '  BOTSWANA COMMUNICATIONS REGULATORY AUTHORITY',
    '  TYPE APPROVAL CERTIFICATE',
    '=============================================================',
    `  Certificate No: ${cert.certificate_number}`,
    `  Issued To:      ${cert.issued_to}`,
    `  Brand:          ${dc.brand_name}`,
    `  Equipment:      ${dc.marketing_name} (${dc.model_name})`,
    `  SIM Enabled:    ${dc.is_sim_enabled ? 'Yes' : 'No'}`,
    `  Issue Date:     ${fmtDate(cert.issued_at)}`,
    `  Status:         ${cert.status_code}`,
    '-------------------------------------------------------------',
    '  Verify online: bocra.org.bw/verify',
    `  QR Token:      ${cert.qr_token}`,
    '=============================================================',
  ].join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `BOCRA_${cert.certificate_number.replace(/\//g, '-')}.txt` })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap border-b border-gray-100 bg-gray-50', className)}>
      {children}
    </th>
  )
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3.5 text-sm border-b border-gray-50 align-top', className)}>
      {children}
    </td>
  )
}

function CertStatusBadge({ status }: { status: TAStatus }) {
  const { label, icon: Icon, badge } = CERT_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', badge)}>
      <Icon className="w-3 h-3" />{label}
    </span>
  )
}

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { label, badge } = REVIEW_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', badge)}>
      {label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: PriorityCode }) {
  const { label, badge } = PRIORITY_CONFIG[priority]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', badge)}>
      <Flag className="w-2.5 h-2.5" />{label}
    </span>
  )
}

// ─── Certificate Detail Dialog ────────────────────────────────────────────────

function CertDetailDialog({ cert, onClose }: { cert: TACertificate | null; onClose: () => void }) {
  if (!cert) return null
  const dc = cert.device_catalog
  const { badge } = CERT_STATUS_CONFIG[cert.status_code]

  return (
    <Dialog open={!!cert} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Type Approval Certificate — {cert.certificate_number}</DialogTitle>
          <DialogDescription>Official BOCRA Type Approval Certificate for {dc.brand_name} {dc.marketing_name}</DialogDescription>
        </DialogHeader>

        <div className="bg-[#003580] px-6 py-5 text-white text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">
            Botswana Communications Regulatory Authority
          </p>
          <p className="text-base font-bold tracking-wide uppercase">Type Approval Certificate</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-sm">
            {([
              ['Certificate Number', <span key="cn" className="font-mono font-bold text-gray-900">{cert.certificate_number}</span>],
              ['Issued To',          cert.issued_to],
              ['Equipment',          `${dc.brand_name} ${dc.marketing_name}`],
              ['Model',              <span key="m" className="font-mono text-gray-700">{dc.model_name}</span>],
              ['SIM Enabled',        dc.is_sim_enabled ? 'Yes' : 'No'],
              ['Issue Date',         fmtDateLong(cert.issued_at)],
              ['Status',             <span key="s" className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border', badge)}>{cert.status_code}</span>],
            ] as [string, React.ReactNode][]).map(([label, value]) => (
              <>
                <span key={`l-${label}`} className="text-gray-500 whitespace-nowrap">{label}</span>
                <span key={`v-${label}`} className="text-gray-900">{value}</span>
              </>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Scan to Verify</p>
            <div className="p-3 border border-gray-200 rounded-xl bg-white">
              <QRCodeSVG value={cert.qr_token} size={160} level="M" />
            </div>
            <p className="text-[10px] text-gray-400">{cert.qr_token}</p>
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            Verify this certificate at{' '}
            <span className="font-medium text-[#003580]">bocra.org.bw/verify</span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            Close
          </button>
          <button onClick={() => downloadMockCert(cert)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#003580] rounded-lg hover:bg-[#002a6e] transition-colors">
            <Download className="w-3.5 h-3.5" />Download Certificate
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Award className="w-7 h-7 text-gray-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">No Certificates Yet</h3>
        <p className="text-sm text-gray-500 max-w-md leading-relaxed">
          Your Type Approval certificates will appear here once your applications have been
          processed and payment confirmed.
        </p>
      </div>
      <Link
        href="/dashboard/type-approval/search"
        className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors shadow-sm mt-2"
      >
        <Plus className="w-4 h-4" />Start New Application
      </Link>
    </div>
  )
}

// ─── My Certificates Panel ────────────────────────────────────────────────────

function MyCertificatesPanel() {
  const [statusFilter, setStatusFilter] = useState<TAStatus | 'ALL'>('ALL')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [query,        setQuery]        = useState('')
  const [selectedCert, setSelectedCert] = useState<TACertificate | null>(null)

  const { data: certificates = [], isLoading } = useQuery<TACertificate[]>({
    queryKey: ['ta-certificates'],
    queryFn: () => fetch('/api/type-approval/certificates').then(r => r.json()),
    staleTime: 5 * 60_000,
  })

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return certificates.filter(c => {
      if (statusFilter !== 'ALL' && c.status_code !== statusFilter) return false
      if (dateFrom && c.issued_at.slice(0, 10) < dateFrom) return false
      if (dateTo   && c.issued_at.slice(0, 10) > dateTo)   return false
      if (q && ![c.certificate_number, c.device_catalog.brand_name,
                 c.device_catalog.marketing_name, c.device_catalog.model_name]
               .some(s => s.toLowerCase().includes(q))) return false
      return true
    })
  }, [certificates, statusFilter, dateFrom, dateTo, query])

  const activeCount  = certificates.filter(c => c.status_code === 'ACTIVE').length
  const expiredCount = certificates.filter(c => c.status_code === 'EXPIRED').length
  const revokedCount = certificates.filter(c => c.status_code === 'REVOKED').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ShieldCheck className="w-6 h-6 text-[#003580]" />
            <h1 className="text-2xl font-bold text-gray-900">Type Approval Certificates</h1>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            View and download your issued Type Approval Certificates. Each certificate includes a QR code for instant verification.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium shrink-0">
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />{activeCount} active
            </span>
          )}
          {expiredCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-600">
              <Clock className="w-3.5 h-3.5" />{expiredCount} expired
            </span>
          )}
          {revokedCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-700">
              <XCircle className="w-3.5 h-3.5" />{revokedCount} revoked
            </span>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Filter bar */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors shrink-0',
                  statusFilter === s ? 'border-[#003580] bg-[#003580] text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300')}>
                {s === 'ALL' ? 'All Certificates' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search by certificate number or device model…"
                className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#003580] transition-colors" />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">Clear</button>}
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#003580] transition-colors" />
              <label className="text-xs text-gray-500">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#003580] transition-colors" />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-400 hover:text-gray-600">Clear dates</button>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />Loading certificates…
          </div>
        )}
        {!isLoading && certificates.length === 0 && <EmptyState />}
        {!isLoading && certificates.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-center px-6">
            <ShieldCheck className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">No certificates match your current filters.</p>
            <button onClick={() => { setQuery(''); setStatusFilter('ALL'); setDateFrom(''); setDateTo('') }}
              className="text-xs text-[#003580] hover:underline mt-1">Clear all filters</button>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr>
                  <Th>Certificate No.</Th>
                  <Th>Type</Th>
                  <Th className="min-w-[200px]">Device</Th>
                  <Th>Issued Date</Th>
                  <Th>Status</Th>
                  <Th className="text-right pr-5">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cert => (
                  <tr key={cert.id} className="hover:bg-gray-50/60 transition-colors group">
                    <Td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700 whitespace-nowrap">{cert.certificate_number}</code></Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 whitespace-nowrap">
                        <ShieldCheck className="w-3 h-3" />Type Approval
                      </span>
                    </Td>
                    <Td>
                      <p className="font-medium text-gray-800">{cert.device_catalog.brand_name} {cert.device_catalog.marketing_name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-1"><Smartphone className="w-3 h-3 shrink-0" />{cert.device_catalog.model_name}</p>
                    </Td>
                    <Td className="text-gray-500 whitespace-nowrap">{fmtDate(cert.issued_at)}</Td>
                    <Td><CertStatusBadge status={cert.status_code} /></Td>
                    <Td className="pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelectedCert(cert)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#003580]/25 text-[#003580] hover:bg-[#003580]/5 transition-colors whitespace-nowrap">
                          <QrCode className="w-3.5 h-3.5" />QR Verify
                        </button>
                        <button onClick={() => downloadMockCert(cert)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                          <Download className="w-3.5 h-3.5" />Download PDF
                        </button>
                        {cert.application && (
                          <Link href="/dashboard/type-approval"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100"
                            title={cert.application.application_number}>
                            <ExternalLink className="w-3.5 h-3.5" />View Application
                          </Link>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{' '}
              <span className="font-semibold text-gray-600">{certificates.length}</span> certificate{certificates.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <CertDetailDialog cert={selectedCert} onClose={() => setSelectedCert(null)} />
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, accent,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: 'amber' | 'red' | 'green' | 'blue' | 'gray'
}) {
  const accentCls = {
    amber: 'text-amber-600 bg-amber-50',
    red:   'text-red-600 bg-red-50',
    green: 'text-emerald-600 bg-emerald-50',
    blue:  'text-[#003580] bg-blue-50',
    gray:  'text-gray-600 bg-gray-100',
  }[accent ?? 'gray']

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', accentCls)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</p>
        <p className="text-xs text-gray-500 leading-snug">{label}</p>
      </div>
    </div>
  )
}

// ─── Assign Dialog ────────────────────────────────────────────────────────────

function AssignDialog({
  application,
  onClose,
  onAssigned,
}: {
  application: ReviewApplication | null
  onClose: () => void
  onAssigned: (id: string, officerId: string, priority: PriorityCode) => void
}) {
  const [form, setForm]       = useState({ assignedTo: '', dueAt: '', priority: 'NORMAL' as PriorityCode, note: '' })
  const [submitting, setSub]  = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (application) {
      setForm({
        assignedTo: application.assigned_to?.id ?? '',
        dueAt: '',
        priority: application.priority_code,
        note: '',
      })
      setError('')
    }
  }, [application])

  async function handleAssign() {
    if (!form.assignedTo) { setError('Please select an officer.'); return }
    setSub(true)
    try {
      await fetch(`/api/type-approval/applications/${application!.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      onAssigned(application!.id, form.assignedTo, form.priority)
      onClose()
    } finally {
      setSub(false)
    }
  }

  const selectCls = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors bg-white'
  const inputCls  = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors'

  return (
    <Dialog open={!!application} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Assign Application
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {application?.application_number} — {application?.applicant_org.legal_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign to Officer <span className="text-red-500">*</span>
            </label>
            <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className={selectCls}>
              <option value="">— Select officer —</option>
              {MOCK_OFFICERS.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
            <input type="date" value={form.dueAt} onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['HIGH', 'NORMAL', 'LOW'] as PriorityCode[]).map(p => (
                <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={cn('flex-1 py-2 text-xs font-semibold transition-colors focus:outline-none capitalize not-first:border-l not-first:border-gray-200',
                    form.priority === p ? 'bg-[#003580] text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={3} placeholder="Add any assignment instructions or context…"
              className={cn(inputCls, 'resize-none')} />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleAssign} disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#003580] rounded-lg hover:bg-[#002a6e] transition-colors disabled:opacity-60">
              {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Assigning…</> : <><UserCheck className="w-3.5 h-3.5" />Assign</>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stage progression map ────────────────────────────────────────────────────

// Each stage has: a display label and what the next stage is on validation
const STAGE_PROGRESSION: Record<string, { label: string; nextOnValidate: string }> = {
  INITIAL_REVIEW:        { label: 'Initial Review',        nextOnValidate: 'DOCUMENT_VERIFICATION' },
  DOCUMENT_VERIFICATION: { label: 'Document Verification', nextOnValidate: 'TECHNICAL_VALIDATION'  },
  TECHNICAL_VALIDATION:  { label: 'Technical Validation',  nextOnValidate: 'DECISION_PENDING'       },
  DECISION_PENDING:      { label: 'Decision Pending',       nextOnValidate: 'COMPLETED'             },
  COMPLETED:             { label: 'Completed',             nextOnValidate: 'COMPLETED'              },
}

// What actions are available based on current status
type ReviewAction = 'validate' | 'approve' | 'remand' | 'reopen'

function availableActions(status: ReviewStatus, stage: string): ReviewAction[] {
  if (status === 'APPROVED') return []
  if (status === 'REMANDED') return ['reopen']
  if (status === 'VALIDATED' && stage === 'DECISION_PENDING') return ['approve', 'remand']
  if (status === 'VALIDATED') return ['approve', 'remand']
  // PENDING
  if (stage === 'DECISION_PENDING') return ['approve', 'remand']
  return ['validate', 'remand']
}

const ACTION_CONFIG: Record<ReviewAction, {
  label: string
  shortLabel: string
  icon: React.ElementType
  cls: string
  resultStatus: ReviewStatus
}> = {
  validate: {
    label: 'Mark as Validated',
    shortLabel: 'Validate',
    icon: ClipboardCheck,
    cls: 'bg-blue-600 hover:bg-blue-700 text-white',
    resultStatus: 'VALIDATED',
  },
  approve: {
    label: 'Approve Application',
    shortLabel: 'Approve',
    icon: ThumbsUp,
    cls: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    resultStatus: 'APPROVED',
  },
  remand: {
    label: 'Remand — Request More Info',
    shortLabel: 'Remand',
    icon: RotateCcw,
    cls: 'bg-orange-500 hover:bg-orange-600 text-white',
    resultStatus: 'REMANDED',
  },
  reopen: {
    label: 'Reopen as Pending',
    shortLabel: 'Reopen',
    icon: RotateCcw,
    cls: 'bg-[#003580] hover:bg-[#002a6e] text-white',
    resultStatus: 'PENDING',
  },
}

// ─── Review Decision Dialog ───────────────────────────────────────────────────

interface ReviewDecisionDialogProps {
  application: ReviewApplication | null
  onClose: () => void
  onDecision: (id: string, status: ReviewStatus, stage: string) => void
}

function ReviewDecisionDialog({ application, onClose, onDecision }: ReviewDecisionDialogProps) {
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null)
  const [done, setDone] = useState<ReviewAction | null>(null)

  useEffect(() => {
    if (application) {
      setRemarks('')
      setPendingAction(null)
      setDone(null)
    }
  }, [application])

  if (!application) return null

  const app = application
  const actions = availableActions(app.current_status_code, app.current_stage_code)
  const stageInfo = STAGE_PROGRESSION[app.current_stage_code] ?? { label: fmtStage(app.current_stage_code), nextOnValidate: app.current_stage_code }

  async function handleAction(action: ReviewAction) {
    const cfg = ACTION_CONFIG[action]
    const newStatus = cfg.resultStatus

    // Determine next stage
    let newStage = app.current_stage_code
    if (action === 'validate') newStage = stageInfo.nextOnValidate
    if (action === 'approve') newStage = 'COMPLETED'
    if (action === 'reopen') newStage = app.current_stage_code

    setPendingAction(action)
    setSubmitting(true)
    try {
      await fetch(`/api/type-approval/applications/${app.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, stage: newStage, remarks }),
      })
      onDecision(app.id, newStatus, newStage)
      setDone(action)
      setTimeout(() => { onClose(); setDone(null) }, 900)
    } finally {
      setSubmitting(false)
      setPendingAction(null)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors resize-none'

  const doneAction = done ? ACTION_CONFIG[done] : null

  return (
    <Dialog open={!!application} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#003580]" />
            Review Application
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{app.application_number}</code>
            {' '}— {app.applicant_org.legal_name}
          </DialogDescription>
        </DialogHeader>

        {doneAction ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', doneAction.cls)}>
              <doneAction.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800">{doneAction.label} recorded</p>
            <p className="text-xs text-gray-400">The application status has been updated.</p>
          </div>
        ) : (
          <div className="space-y-5 mt-1">

            {/* Application snapshot */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
              {([
                ['Equipment',     `${app.device_catalog.brand_name} — ${app.device_catalog.model_name}`],
                ['Current Status', <ReviewStatusBadge key="s" status={app.current_status_code} />],
                ['Current Stage',  <span key="st" className="text-xs font-medium text-gray-700">{stageInfo.label}</span>],
                ['Priority',       <PriorityBadge key="p" priority={app.priority_code} />],
                ['Expected Decision', fmtDate(app.expected_decision_at)],
              ] as [string, React.ReactNode][]).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500 text-xs">{label}</span>
                  <span className="text-gray-800">{value}</span>
                </div>
              ))}
            </div>

            {/* Remarks */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Decision Remarks <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={3}
                placeholder="Add your review notes, findings, or reason for decision…"
                className={inputCls}
              />
            </div>

            {/* Action buttons */}
            {actions.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 text-center font-medium">
                This application has been approved — no further actions available.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Record Decision</p>
                <div className="flex flex-wrap gap-2">
                  {actions.map(action => {
                    const cfg = ACTION_CONFIG[action]
                    const isLoading = submitting && pendingAction === action
                    return (
                      <button
                        key={action}
                        onClick={() => handleAction(action)}
                        disabled={submitting}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50',
                          cfg.cls,
                        )}
                      >
                        {isLoading
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <cfg.icon className="w-3.5 h-3.5" />
                        }
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
                {actions.includes('validate') && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Validating will advance the stage to{' '}
                    <span className="font-medium text-gray-600">
                      {STAGE_PROGRESSION[stageInfo.nextOnValidate]?.label ?? stageInfo.nextOnValidate}
                    </span>.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Review Queue Panel ───────────────────────────────────────────────────────

function ReviewQueuePanel() {
  const [apps, setApps]             = useState<ReviewApplication[]>([])
  const [hasInit, setHasInit]       = useState(false)
  const [statusFilter, setStatus]   = useState<ReviewStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriority] = useState<PriorityCode | 'ALL'>('ALL')
  const [officerFilter, setOfficer] = useState('ALL')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [query, setQuery]           = useState('')
  const [assignTarget, setAssignTarget]   = useState<ReviewApplication | null>(null)
  const [reviewTarget, setReviewTarget]   = useState<ReviewApplication | null>(null)

  const { data, isLoading } = useQuery<ReviewApplication[]>({
    queryKey: ['ta-review-queue'],
    queryFn: () => fetch('/api/type-approval/review').then(r => r.json()),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (data && !hasInit) { setApps(data); setHasInit(true) }
  }, [data, hasInit])

  function handleAssigned(id: string, officerId: string, priority: PriorityCode) {
    const officer = MOCK_OFFICERS.find(o => o.id === officerId) ?? null
    setApps(prev => prev.map(a =>
      a.id === id ? { ...a, assigned_to: officer, priority_code: priority } : a
    ))
  }

  function handleDecision(id: string, status: ReviewStatus, stage: string) {
    setApps(prev => prev.map(a =>
      a.id === id ? { ...a, current_status_code: status, current_stage_code: stage } : a
    ))
    setReviewTarget(null)
  }

  const stats = useMemo(() => {
    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear()
    const pending   = apps.filter(a => a.current_status_code === 'PENDING').length
    const validated = apps.filter(a => a.current_status_code === 'VALIDATED').length
    const remanded  = apps.filter(a => a.current_status_code === 'REMANDED').length
    const approvedThisMonth = apps.filter(a => {
      if (a.current_status_code !== 'APPROVED') return false
      const d = new Date(a.submitted_at)
      return d.getMonth() === m && d.getFullYear() === y
    }).length
    const avgDays = apps.length
      ? Math.round(apps.reduce((s, a) => s + daysFromNow(a.submitted_at), 0) / apps.length)
      : 0
    return { pending, validated, remanded, approvedThisMonth, avgDays }
  }, [apps])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return apps.filter(a => {
      if (statusFilter !== 'ALL'  && a.current_status_code !== statusFilter) return false
      if (priorityFilter !== 'ALL' && a.priority_code !== priorityFilter) return false
      if (officerFilter !== 'ALL'  && a.assigned_to?.id !== officerFilter) return false
      if (dateFrom && a.submitted_at.slice(0, 10) < dateFrom) return false
      if (dateTo   && a.submitted_at.slice(0, 10) > dateTo)   return false
      if (q && ![a.application_number, a.applicant_org.legal_name]
               .some(s => s.toLowerCase().includes(q))) return false
      return true
    })
  }, [apps, statusFilter, priorityFilter, officerFilter, dateFrom, dateTo, query])

  function clearFilters() {
    setStatus('ALL'); setPriority('ALL'); setOfficer('ALL')
    setDateFrom(''); setDateTo(''); setQuery('')
  }

  const hasFilters = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || officerFilter !== 'ALL' || dateFrom || dateTo || query

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <BarChart3 className="w-6 h-6 text-[#003580]" />
          <h1 className="text-2xl font-bold text-gray-900">Type Approval Review Queue</h1>
        </div>
        <p className="text-sm text-gray-500">
          Active type approval applications awaiting review, validation, and decision.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Pending"                       value={stats.pending}          icon={Clock}       accent="amber" />
        <KpiCard label="Awaiting Validation"                 value={stats.validated}        icon={ShieldCheck} accent="blue"  />
        <KpiCard label="Remanded — Awaiting Resubmission"   value={stats.remanded}         icon={AlertTriangle} accent="red" />
        <KpiCard label="Approved This Month"                 value={stats.approvedThisMonth} icon={CheckCircle2} accent="green" />
        <KpiCard label="Avg. Processing Days"                value={`${stats.avgDays}d`}    icon={Timer}       accent="gray" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Filter bar */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">

          {/* Status + priority chips */}
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'PENDING', 'VALIDATED', 'REMANDED', 'APPROVED'] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  statusFilter === s ? 'border-[#003580] bg-[#003580] text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300')}>
                {s === 'ALL' ? 'All Statuses' : (REVIEW_STATUS_CONFIG[s]?.label ?? s)}
              </button>
            ))}
            <div className="w-px bg-gray-200 mx-1 self-stretch" />
            {(['ALL', 'HIGH', 'NORMAL', 'LOW'] as const).map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  priorityFilter === p ? 'border-[#003580] bg-[#003580] text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300')}>
                {p === 'ALL' ? 'All Priorities' : (p.charAt(0) + p.slice(1).toLowerCase())}
              </button>
            ))}
          </div>

          {/* Search + officer + date range */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search by application number or organisation…"
                className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#003580] transition-colors" />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">Clear</button>}
            </div>

            <select value={officerFilter} onChange={e => setOfficer(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#003580] transition-colors bg-white shrink-0">
              <option value="ALL">All Officers</option>
              {MOCK_OFFICERS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              <option value="">Unassigned</option>
            </select>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs text-gray-500">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#003580] transition-colors" />
              <label className="text-xs text-gray-500">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#003580] transition-colors" />
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />Loading review queue…
          </div>
        )}

        {/* No results */}
        {!isLoading && apps.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-center px-6">
            <BarChart3 className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">No applications match your current filters.</p>
            {hasFilters && <button onClick={clearFilters} className="text-xs text-[#003580] hover:underline mt-1">Clear all filters</button>}
          </div>
        )}

        {/* Table */}
        {!isLoading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead>
                <tr>
                  <Th>Application No.</Th>
                  <Th className="min-w-[180px]">Applicant</Th>
                  <Th>Equipment</Th>
                  <Th>Status</Th>
                  <Th>Stage</Th>
                  <Th>Submitted</Th>
                  <Th>Days in Queue</Th>
                  <Th>Expected Decision</Th>
                  <Th>Priority</Th>
                  <Th>Assigned To</Th>
                  <Th className="text-right pr-5">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const days = daysFromNow(app.submitted_at)
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/60 transition-colors group">
                      <Td>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700 whitespace-nowrap">
                          {app.application_number}
                        </code>
                      </Td>
                      <Td>
                        <p className="font-medium text-gray-800 leading-snug text-xs">{app.applicant_org.legal_name}</p>
                      </Td>
                      <Td>
                        <p className="text-gray-800 font-medium">{app.device_catalog.brand_name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{app.device_catalog.model_name}</p>
                      </Td>
                      <Td><ReviewStatusBadge status={app.current_status_code} /></Td>
                      <Td>
                        <span className="text-xs text-gray-600">{fmtStage(app.current_stage_code)}</span>
                      </Td>
                      <Td className="text-gray-500 whitespace-nowrap text-xs">{fmtDate(app.submitted_at)}</Td>
                      <Td>
                        <span className={cn('text-sm', queueDayCls(days))}>{days}d</span>
                      </Td>
                      <Td className="text-gray-500 whitespace-nowrap text-xs">
                        {fmtDate(app.expected_decision_at)}
                      </Td>
                      <Td><PriorityBadge priority={app.priority_code} /></Td>
                      <Td>
                        {app.assigned_to ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#003580]/10 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-[#003580]">{app.assigned_to.name.charAt(0)}</span>
                            </div>
                            <span className="text-xs text-gray-700 whitespace-nowrap">{app.assigned_to.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </Td>
                      <Td className="pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setReviewTarget(app)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#003580]/25 text-[#003580] hover:bg-[#003580]/5 transition-colors whitespace-nowrap"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />Review
                          </button>
                          <button
                            onClick={() => setAssignTarget(app)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                          >
                            <Users className="w-3.5 h-3.5" />Assign
                          </button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{' '}
              <span className="font-semibold text-gray-600">{apps.length}</span> applications
              {hasFilters && (
                <button onClick={clearFilters} className="ml-3 text-[#003580] hover:underline">Clear filters</button>
              )}
            </p>
          </div>
        )}
      </div>

      <AssignDialog application={assignTarget} onClose={() => setAssignTarget(null)} onAssigned={handleAssigned} />
      <ReviewDecisionDialog application={reviewTarget} onClose={() => setReviewTarget(null)} onDecision={handleDecision} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const { role }  = useRoleStore()
  const isStaff   = role === 'officer' || role === 'admin'
  const [activeTab, setActiveTab] = useState<'certificates' | 'review'>('certificates')

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Tab strip — only for officer / admin */}
      {isStaff && (
        <div className="flex gap-1 border-b border-gray-200">
          {([
            { id: 'certificates', label: 'My Certificates' },
            { id: 'review',       label: 'Review Queue'    },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
                activeTab === tab.id
                  ? 'border-[#003580] text-[#003580]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {(!isStaff || activeTab === 'certificates') && <MyCertificatesPanel />}
      {isStaff && activeTab === 'review'          && <ReviewQueuePanel />}
    </div>
  )
}
