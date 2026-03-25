'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDemoAwareQuery } from '@/lib/demo/useDemoAwareQuery'
import { DEMO_LICENSING_DATA } from '@/lib/demo/seed-data'
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
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type LicenceStatus      = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'
type ApplicationStatus  = 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED' | 'AWAITING_PAYMENT'

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

// ─── Mock data ────────────────────────────────────────────────────────────────

// TODO: Replace with GET https://op-web.bocra.org.bw/api/licences?userId={id}
// TODO: For officer role use GET https://op-web.bocra.org.bw/api/licences (no userId filter)
// Fields map: licenceNumber → LICENCE_NUMBER, licenceType → SERVICE_TYPE, expiryDate → EXPIRY_DATE

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const MOCK_DATA: LicensingData = {
  licences: [
    {
      id: 'l1',
      licenceNumber: 'ECN-2019-0031',
      licenceType: 'Electronic Communications Network',
      category: 'Telecommunications',
      status: 'ACTIVE',
      issueDate: '2019-07-01',
      expiryDate: addDays(TODAY, 8),   // ← expires in 8 days → RED alert
    },
    {
      id: 'l2',
      licenceNumber: 'ISP-2021-0012',
      licenceType: 'Internet Service Provider',
      category: 'Data Services',
      status: 'ACTIVE',
      issueDate: '2021-03-15',
      expiryDate: addDays(TODAY, 42),  // ← expires in 42 days → AMBER alert
    },
    {
      id: 'l3',
      licenceNumber: 'VSAT-2022-0007',
      licenceType: 'VSAT Terminal Licence',
      category: 'Satellite Services',
      status: 'SUSPENDED',
      issueDate: '2022-06-20',
      expiryDate: addDays(TODAY, 180),
    },
    {
      id: 'l4',
      licenceNumber: 'BRD-2018-0002',
      licenceType: 'Broadcasting Licence — FM Radio',
      category: 'Broadcasting',
      status: 'EXPIRED',
      issueDate: '2018-01-10',
      expiryDate: addDays(TODAY, -45), // ← already expired
    },
    {
      id: 'l5',
      licenceNumber: 'ECS-2020-0044',
      licenceType: 'Electronic Communications Service',
      category: 'Telecommunications',
      status: 'ACTIVE',
      issueDate: '2020-09-01',
      expiryDate: addDays(TODAY, 310),
    },
    {
      id: 'l6',
      licenceNumber: 'POS-2017-0003',
      licenceType: 'Postal Operator Licence',
      category: 'Postal Services',
      status: 'CANCELLED',
      issueDate: '2017-05-01',
      expiryDate: addDays(TODAY, -200),
    },
  ],
  applications: [
    {
      id: 'a1',
      applicationNumber: 'APP-2025-00412',
      type: 'Spectrum Authorisation',
      category: 'Telecommunications',
      status: 'UNDER_REVIEW',
      submittedDate: '2025-03-01',
      lastUpdated: '2025-03-19',
    },
    {
      id: 'a2',
      applicationNumber: 'APP-2025-00387',
      type: 'Type Approval — Wireless Router',
      category: 'Type Approval',
      status: 'AWAITING_PAYMENT',
      submittedDate: '2025-02-20',
      lastUpdated: '2025-03-15',
    },
    {
      id: 'a3',
      applicationNumber: 'APP-2025-00291',
      type: 'Electronic Communications Service — Amendment',
      category: 'Telecommunications',
      status: 'APPROVED',
      submittedDate: '2025-01-10',
      lastUpdated: '2025-03-10',
    },
    {
      id: 'a4',
      applicationNumber: 'APP-2024-01841',
      type: 'Broadcasting Licence — TV',
      category: 'Broadcasting',
      status: 'REJECTED',
      submittedDate: '2024-11-15',
      lastUpdated: '2025-02-28',
    },
  ],
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LicensingPage() {
  // TODO: Replace with useQuery → GET https://op-web.bocra.org.bw/api/licences?userId={id}
  // TODO: Applications → GET https://op-web.bocra.org.bw/api/licence-applications?userId={id}
  const { data, isLoading } = useDemoAwareQuery<LicensingData>({
    queryKey: ['licensing'],
    fetchFn: async () => {
      await new Promise((r) => setTimeout(r, 300))
      return MOCK_DATA
    },
    demoFallback: DEMO_LICENSING_DATA,
  })

  const licences     = data?.licences     ?? []
  const applications = data?.applications ?? []

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
            Manage your licences, track applications, and submit renewal requests.
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

      {/* ── Summary chips ────────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip
            label="Active licences"
            value={active}
            cls="border-emerald-200 bg-emerald-50 text-emerald-800"
          />
          <StatChip
            label="Expiring within 60 days"
            value={expiring}
            cls={expiring > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-gray-600'}
          />
          <StatChip
            label="Critical (≤ 14 days)"
            value={critical}
            cls={critical > 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-600'}
          />
          <StatChip
            label="Applications in review"
            value={pending}
            cls="border-blue-200 bg-blue-50 text-blue-800"
          />
        </div>
      )}

      {/* ── Renewal alert banner ─────────────────────────────────────────── */}
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

      {/* ── Licences table ───────────────────────────────────────────────── */}
      <LicencesTable licences={licences} loading={isLoading} />

      {/* ── Applications table ───────────────────────────────────────────── */}
      <ApplicationsTable applications={applications} loading={isLoading} />
    </div>
  )
}
