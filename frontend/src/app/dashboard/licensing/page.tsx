'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  PlusCircle,
  Eye,
  RefreshCw,
  FilePen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  Loader2,
  ClipboardList,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/lib/store/hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// ─── Types ────────────────────────────────────────────────────────────────────

type LicenceStatus      = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'
type ApplicationStatus  = 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED' | 'AWAITING_PAYMENT'

interface ReviewApplication {
  id: string
  applicationNumber: string
  licenceType: string
  category: string
  orgName: string
  contactEmail: string
  status: ApplicationStatus
  submittedDate: string
  lastUpdated: string
  coverageArea?: string
  technicalDetails?: string
}

interface Licence {
  id: string
  licenceNumber: string
  licenceType: string
  category: string
  status: LicenceStatus
  issueDate: string
  expiryDate: string
}

interface LicenceApplication {
  id: string
  applicationNumber: string
  type: string
  category: string
  status: ApplicationStatus
  submittedDate: string
  lastUpdated: string
}

interface LicensingData {
  licences: Licence[]
  applications: LicenceApplication[]
}

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - TODAY.getTime()) / 86_400_000)
}

// ─── Status badges ────────────────────────────────────────────────────────────

const LICENCE_STATUS_STYLES: Record<LicenceStatus, { cls: string; icon: React.ElementType }> = {
  ACTIVE:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  EXPIRED:   { cls: 'bg-red-50 text-red-700 border-red-200',             icon: XCircle       },
  CANCELLED: { cls: 'bg-gray-100 text-gray-500 border-gray-200',         icon: XCircle       },
  SUSPENDED: { cls: 'bg-orange-50 text-orange-700 border-orange-200',    icon: AlertTriangle },
}

const APP_STATUS_STYLES: Record<ApplicationStatus, { cls: string; icon: React.ElementType }> = {
  PENDING:          { cls: 'bg-amber-50 text-amber-700 border-amber-200',     icon: Clock         },
  APPROVED:         { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  UNDER_REVIEW:     { cls: 'bg-blue-50 text-blue-700 border-blue-200',        icon: FileText      },
  REJECTED:         { cls: 'bg-red-50 text-red-700 border-red-200',           icon: XCircle       },
  AWAITING_PAYMENT: { cls: 'bg-purple-50 text-purple-700 border-purple-200',  icon: Clock         },
}

function LicenceStatusBadge({ status }: { status: LicenceStatus }) {
  const { cls, icon: Icon } = LICENCE_STATUS_STYLES[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', cls)}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  )
}

function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  const { cls, icon: Icon } = APP_STATUS_STYLES[status]
  const label = status.replace(/_/g, ' ')
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', cls)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// ─── Renewal alert badge ──────────────────────────────────────────────────────

function RenewalAlert({ expiryDate, status }: { expiryDate: string; status: LicenceStatus }) {
  if (status !== 'ACTIVE') return <span className="text-xs text-gray-300">—</span>

  const days = daysUntil(expiryDate)

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border-red-200">
        <XCircle className="w-3 h-3" />
        Expired {Math.abs(days)}d ago
      </span>
    )
  }
  if (days <= 14) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border-red-200 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Expires in {days}d
      </span>
    )
  }
  if (days <= 60) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200">
        <Clock className="w-3 h-3" />
        Expires in {days}d
      </span>
    )
  }
  return <span className="text-xs text-gray-300">—</span>
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200 whitespace-nowrap',
      className,
    )}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3.5 text-sm border-b border-gray-100', className)}>
      {children}
    </td>
  )
}

function SkeletonRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5 border-b border-gray-100">
              <Skeleton className={cn('h-4', j === 0 ? 'w-28' : j === 1 ? 'w-40' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-sm text-gray-400">
        {message}
      </td>
    </tr>
  )
}

// ─── Action button row ────────────────────────────────────────────────────────

function ActionBtn({
  icon: Icon,
  label,
  href,
  variant = 'default',
  disabled,
}: {
  icon: React.ElementType
  label: string
  href?: string
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}) {
  const cls = cn(
    'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors',
    variant === 'primary' && 'border-[#003580]/25 text-[#003580] hover:bg-[#003580]/5',
    variant === 'danger'  && 'border-red-200 text-red-600 hover:bg-red-50',
    variant === 'default' && 'border-gray-200 text-gray-600 hover:bg-gray-50',
    disabled && 'opacity-40 pointer-events-none',
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Link>
    )
  }
  return (
    <button className={cls} disabled={disabled}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

// ─── Licences table ───────────────────────────────────────────────────────────

function LicencesTable({ licences, loading }: { licences: Licence[]; loading: boolean }) {
  const cols = 8
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">My Licences</h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">{licences.length} licence{licences.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Licence Number</Th>
              <Th className="min-w-[220px]">Licence Type</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Issue Date</Th>
              <Th>Expiry Date</Th>
              <Th>Renewal Alert</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={cols} />
            ) : licences.length === 0 ? (
              <EmptyRow cols={cols} message="No licences found. Apply for your first licence above." />
            ) : (
              licences.map((lic) => (
                <tr key={lic.id} className="hover:bg-gray-50/60 transition-colors group">
                  <Td>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
                      {lic.licenceNumber}
                    </code>
                  </Td>
                  <Td className="text-gray-800 font-medium">
                    <span className="line-clamp-2 leading-snug">{lic.licenceType}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {lic.category}
                    </span>
                  </Td>
                  <Td><LicenceStatusBadge status={lic.status} /></Td>
                  <Td className="text-gray-500 whitespace-nowrap">{lic.issueDate}</Td>
                  <Td className="whitespace-nowrap">
                    <span className={cn(
                      'text-sm',
                      daysUntil(lic.expiryDate) <= 14 && lic.status === 'ACTIVE'
                        ? 'text-red-600 font-semibold'
                        : daysUntil(lic.expiryDate) <= 60 && lic.status === 'ACTIVE'
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-500',
                    )}>
                      {lic.expiryDate}
                    </span>
                  </Td>
                  <Td>
                    <RenewalAlert expiryDate={lic.expiryDate} status={lic.status} />
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionBtn
                        icon={Eye}
                        label="View"
                        href={`/dashboard/licensing/${lic.id}`}
                        variant="primary"
                      />
                      <ActionBtn
                        icon={RefreshCw}
                        label="Renew"
                        variant="default"
                        disabled={lic.status !== 'ACTIVE' && lic.status !== 'EXPIRED'}
                      />
                      <ActionBtn
                        icon={FilePen}
                        label="Amend"
                        variant="default"
                        disabled={lic.status !== 'ACTIVE'}
                      />
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Applications table ───────────────────────────────────────────────────────

function ApplicationsTable({
  applications,
  loading,
}: {
  applications: LicenceApplication[]
  loading: boolean
}) {
  const cols = 7
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">My Applications</h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">{applications.length} in progress</p>
          )}
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Application Number</Th>
              <Th className="min-w-[240px]">Type</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th>Last Updated</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={cols} />
            ) : applications.length === 0 ? (
              <EmptyRow cols={cols} message="No applications in progress." />
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/60 transition-colors group">
                  <Td>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
                      {app.applicationNumber}
                    </code>
                  </Td>
                  <Td className="text-gray-800 font-medium">
                    <span className="line-clamp-2 leading-snug">{app.type}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {app.category}
                    </span>
                  </Td>
                  <Td><AppStatusBadge status={app.status} /></Td>
                  <Td className="text-gray-500 whitespace-nowrap">{app.submittedDate}</Td>
                  <Td className="text-gray-500 whitespace-nowrap">{app.lastUpdated}</Td>
                  <Td className="text-right">
                    <ActionBtn
                      icon={Eye}
                      label="View"
                      href={`/dashboard/licensing/${app.id}`}
                      variant="primary"
                    />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Stat chips (summary row) ─────────────────────────────────────────────────

function StatChip({
  label,
  value,
  cls,
}: {
  label: string
  value: number | string
  cls: string
}) {
  return (
    <div className={cn('rounded-xl border px-4 py-3 flex items-center gap-3', cls)}>
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-xs font-medium leading-tight opacity-80">{label}</span>
    </div>
  )
}

// ─── Approval Queue (officer / admin) ─────────────────────────────────────────

const REVIEW_STATUS_STYLES: Record<string, { cls: string; icon: React.ElementType }> = {
  PENDING:          { cls: 'bg-amber-50 text-amber-700 border-amber-200',     icon: Clock         },
  UNDER_REVIEW:     { cls: 'bg-blue-50 text-blue-700 border-blue-200',        icon: FileText      },
  AWAITING_PAYMENT: { cls: 'bg-purple-50 text-purple-700 border-purple-200',  icon: Clock         },
  APPROVED:         { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  REJECTED:         { cls: 'bg-red-50 text-red-700 border-red-200',           icon: XCircle       },
}

function ReviewStatusBadge({ status }: { status: string }) {
  const cfg = REVIEW_STATUS_STYLES[status] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock }
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', cfg.cls)}>
      <Icon className="w-3 h-3" />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function ApprovalQueue() {
  const [items,      setItems]      = useState<ReviewApplication[]>([])
  const [loading,    setLoading]    = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [actioning,  setActioning]  = useState<string | null>(null)
  const [noteModal,  setNoteModal]  = useState<{ id: string; action: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' } | null>(null)
  const [noteText,   setNoteText]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = statusFilter ? `&status=${statusFilter}` : ''
      const res  = await fetch(`/api/licensing?action=review${qs}`)
      const json = await res.json()
      setItems((json.data ?? []).map((r: Record<string, string>) => ({
        id:               r.id,
        applicationNumber: r.application_number,
        licenceType:      r.license_type ?? '—',
        category:         r.category ?? '—',
        orgName:          r.org_name ?? '—',
        contactEmail:     r.contact_email ?? '',
        status:           (r.status_code ?? 'PENDING') as ApplicationStatus,
        submittedDate:    r.submitted_date?.slice(0, 10) ?? '',
        lastUpdated:      (r.updated_at ?? '')?.slice(0, 10),
        coverageArea:     r.coverage_area ?? '',
        technicalDetails: r.technical_details ?? '',
      })))
    } catch { /* keep empty */ }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function applyAction(id: string, status_code: string, notes?: string) {
    setActioning(id)
    try {
      await fetch('/api/licensing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', id, status_code, notes }),
      })
      await load()
    } finally {
      setActioning(null)
      setNoteModal(null)
      setNoteText('')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
        >
          <option value="">All pending</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="AWAITING_PAYMENT">Awaiting Payment</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
        {!loading && (
          <span className="text-xs text-gray-400 ml-auto">{items.length} application{items.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Note / decision modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {noteModal.action === 'APPROVED' ? 'Approve Application' :
               noteModal.action === 'REJECTED' ? 'Reject Application' : 'Request More Information'}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note or reason (optional)…"
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setNoteModal(null); setNoteText('') }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => applyAction(noteModal.id, noteModal.action, noteText || undefined)}
                disabled={!!actioning}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors disabled:opacity-60',
                  noteModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  noteModal.action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-[#003580] hover:bg-[#002a6b]',
                )}
              >
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Application No.</Th>
                <Th className="min-w-[200px]">Licence Type</Th>
                <Th>Organisation</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} />
              ) : items.length === 0 ? (
                <EmptyRow cols={7} message="No applications to review." />
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <Td>
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
                        {item.applicationNumber}
                      </code>
                    </Td>
                    <Td className="text-gray-800 font-medium">
                      <span className="line-clamp-2 leading-snug">{item.licenceType}</span>
                    </Td>
                    <Td>
                      <div className="text-gray-800 text-xs font-medium leading-snug">{item.orgName}</div>
                      {item.contactEmail && (
                        <div className="text-gray-400 text-xs truncate max-w-[160px]">{item.contactEmail}</div>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                    </Td>
                    <Td><ReviewStatusBadge status={item.status} /></Td>
                    <Td className="text-gray-500 whitespace-nowrap">{item.submittedDate}</Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                        {(item.status === 'PENDING' || item.status === 'UNDER_REVIEW') && (
                          <>
                            <button
                              onClick={() => setNoteModal({ id: item.id, action: 'APPROVED' })}
                              disabled={!!actioning}
                              title="Approve"
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => setNoteModal({ id: item.id, action: 'UNDER_REVIEW' })}
                              disabled={!!actioning}
                              title="Request more info"
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-40"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Query
                            </button>
                            <button
                              onClick={() => setNoteModal({ id: item.id, action: 'REJECTED' })}
                              disabled={!!actioning}
                              title="Reject"
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}
                        <ActionBtn icon={Eye} label="View" href={`/dashboard/licensing/${item.id}`} variant="default" />
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LicensingPage() {
  const role = useAppSelector((s) => s.role.role)
  const isStaff = role === 'officer' || role === 'admin'

  const [licences,     setLicences]     = useState<Licence[]>([])
  const [applications, setApplications] = useState<LicenceApplication[]>([])
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [licRes, appRes] = await Promise.all([
          fetch('/api/licensing?action=list'),
          fetch('/api/licensing?action=applications'),
        ])
        const [licJson, appJson] = await Promise.all([licRes.json(), appRes.json()])
        if (cancelled) return

        setLicences((licJson.data ?? []).map((r: Record<string, string>) => ({
          id:            r.id,
          licenceNumber: r.license_number,
          licenceType:   r.license_type,
          category:      r.category ?? '—',
          status:        (r.status_code ?? 'ACTIVE') as LicenceStatus,
          issueDate:     r.issue_date?.slice(0, 10) ?? '',
          expiryDate:    r.expiry_date?.slice(0, 10) ?? '',
        })))

        setApplications((appJson.data ?? []).map((r: Record<string, string>) => ({
          id:                r.id,
          applicationNumber: r.application_number,
          type:              r.license_type ?? r.type ?? '—',
          category:          r.category ?? '—',
          status:            (r.status_code ?? 'PENDING') as ApplicationStatus,
          submittedDate:     r.submitted_date?.slice(0, 10) ?? '',
          lastUpdated:       (r.updated_at ?? r.last_updated ?? '')?.slice(0, 10),
        })))
      } catch (err) {
        console.error('[licensing] load error:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Derive summary counts
  const active    = licences.filter((l) => l.status === 'ACTIVE').length
  const expiring  = licences.filter((l) => l.status === 'ACTIVE' && daysUntil(l.expiryDate) <= 60).length
  const critical  = licences.filter((l) => l.status === 'ACTIVE' && daysUntil(l.expiryDate) <= 14).length
  const pending   = applications.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licensing & Spectrum</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage licences, track applications, and submit renewal requests.
          </p>
        </div>
        <Link
          href="/dashboard/licensing/apply"
          className="flex items-center gap-2 px-4 py-2 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6b] transition-colors shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for New Licence
        </Link>
      </div>

      <Tabs defaultValue="licences">
        <TabsList className="border-b border-gray-200 bg-transparent p-0 gap-0 h-auto rounded-none w-full justify-start">
          <TabsTrigger
            value="licences"
            className="rounded-none h-10 px-5 text-sm border-b-2 border-transparent data-[state=active]:border-[#003580] data-[state=active]:text-[#003580] data-[state=active]:font-semibold bg-transparent focus-visible:outline-none"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            My Licences
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="rounded-none h-10 px-5 text-sm border-b-2 border-transparent data-[state=active]:border-[#003580] data-[state=active]:text-[#003580] data-[state=active]:font-semibold bg-transparent focus-visible:outline-none"
          >
            <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
            My Applications
          </TabsTrigger>
          {isStaff && (
            <TabsTrigger
              value="approval"
              className="rounded-none h-10 px-5 text-sm border-b-2 border-transparent data-[state=active]:border-[#003580] data-[state=active]:text-[#003580] data-[state=active]:font-semibold bg-transparent focus-visible:outline-none"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Licence Approvals
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── My Licences ──────────────────────────────────────────────── */}
        <TabsContent value="licences" className="pt-5 space-y-5">
          {/* Summary chips */}
          {!isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatChip label="Active licences"        value={active}   cls="border-emerald-200 bg-emerald-50 text-emerald-800" />
              <StatChip label="Expiring within 60 days" value={expiring} cls={expiring > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-gray-600'} />
              <StatChip label="Critical (≤ 14 days)"   value={critical} cls={critical > 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-600'} />
              <StatChip label="Applications in review" value={pending}  cls="border-blue-200 bg-blue-50 text-blue-800" />
            </div>
          )}

          {/* Renewal alert */}
          {!isLoading && critical > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {critical} licence{critical !== 1 ? 's' : ''} expiring within 14 days
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Renew immediately to avoid service interruption and regulatory non-compliance.
                  Contact BOCRA on <strong>+267 395 7755</strong> if you need assistance.
                </p>
              </div>
              <button className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 shrink-0">
                Renew now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <LicencesTable licences={licences} loading={isLoading} />
        </TabsContent>

        {/* ── My Applications ───────────────────────────────────────────── */}
        <TabsContent value="applications" className="pt-5">
          <ApplicationsTable applications={applications} loading={isLoading} />
        </TabsContent>

        {/* ── Licence Approvals (officer / admin) ───────────────────────── */}
        {isStaff && (
          <TabsContent value="approval" className="pt-5">
            <ApprovalQueue />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
