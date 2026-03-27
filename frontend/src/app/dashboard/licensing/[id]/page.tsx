'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useDemoAwareQuery } from '@/lib/demo/useDemoAwareQuery'
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  FilePen,
  Printer,
  User,
  Building2,
  MapPin,
  CalendarDays,
  ShieldCheck,
  CircleDot,
  Loader2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/lib/store/hooks'

// ─── Types ────────────────────────────────────────────────────────────────────

type LicenceStatus     = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'
type ApplicationStatus = 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED' | 'AWAITING_PAYMENT'
type RecordType        = 'licence' | 'application'

interface LicenceCondition {
  id: string
  clause: string
  description: string
  compliant: boolean | null   // null = not yet assessed
}

interface LicenceDocument {
  id: string
  name: string
  type: 'certificate' | 'attachment' | 'decision'
  issuedDate: string
  sizeMb: number
}

interface HistoryEvent {
  id: string
  date: string
  actor: string
  actorRole: 'system' | 'officer' | 'applicant'
  action: string
  note?: string
}

interface LicenceRecord {
  recordType: 'licence'
  id: string
  licenceNumber: string
  licenceType: string
  category: string
  subCategory: string
  status: LicenceStatus
  issueDate: string
  expiryDate: string
  holder: string
  holderAddress: string
  coverageArea: string
  frequencyBand?: string
  assignedOfficer: string
  assignedOfficerDept: string
  conditions: LicenceCondition[]
  documents: LicenceDocument[]
  history: HistoryEvent[]
}

interface ApplicationRecord {
  recordType: 'application'
  id: string
  applicationNumber: string
  type: string
  category: string
  status: ApplicationStatus
  submittedDate: string
  lastUpdated: string
  applicantName: string
  applicantEmail: string
  notes: string
  history: HistoryEvent[]
}

type DetailRecord = LicenceRecord | ApplicationRecord

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const MOCK_RECORDS: Record<string, DetailRecord> = {
  l1: {
    recordType: 'licence',
    id: 'l1',
    licenceNumber: 'ECN-2019-0031',
    licenceType: 'Electronic Communications Network',
    category: 'Telecommunications',
    subCategory: 'Fixed-line',
    status: 'ACTIVE',
    issueDate: '2019-07-01',
    expiryDate: addDays(TODAY, 8),
    holder: 'BotswanaTel Communications (Pty) Ltd',
    holderAddress: 'Plot 50671, Fairgrounds, Gaborone, Botswana',
    coverageArea: 'Nationwide',
    frequencyBand: undefined,
    assignedOfficer: 'K. Mosweu',
    assignedOfficerDept: 'Licensing & Compliance',
    conditions: [
      {
        id: 'c1',
        clause: '6.1',
        description: 'Licensee shall submit annual compliance reports no later than 31 March each year.',
        compliant: true,
      },
      {
        id: 'c2',
        clause: '6.2',
        description: 'Licensee shall ensure network quality of service meets BOCRA minimum thresholds (Annex B).',
        compliant: true,
      },
      {
        id: 'c3',
        clause: '7.4',
        description: 'Licensee shall maintain lawful interception capability as required by the Communications Regulatory Authority Act.',
        compliant: null,
      },
      {
        id: 'c4',
        clause: '9.1',
        description: 'Licensee shall pay the annual spectrum fee by 1 April each year.',
        compliant: false,
      },
    ],
    documents: [
      {
        id: 'd1',
        name: 'ECN-2019-0031 — Licence Certificate',
        type: 'certificate',
        issuedDate: '2019-07-01',
        sizeMb: 0.4,
      },
      {
        id: 'd2',
        name: 'Renewal Decision Letter — 2022',
        type: 'decision',
        issuedDate: '2022-06-28',
        sizeMb: 0.2,
      },
      {
        id: 'd3',
        name: 'Compliance Report — 2024',
        type: 'attachment',
        issuedDate: '2024-03-28',
        sizeMb: 1.8,
      },
    ],
    history: [
      {
        id: 'h1',
        date: '2019-07-01',
        actor: 'BOCRA Licensing',
        actorRole: 'system',
        action: 'Licence issued',
        note: 'Initial 5-year ECN licence granted following assessment.',
      },
      {
        id: 'h2',
        date: '2022-06-28',
        actor: 'K. Mosweu',
        actorRole: 'officer',
        action: 'Licence renewed',
        note: 'Renewed for a further 2-year term. Conditions updated per 2022 regulatory framework.',
      },
      {
        id: 'h3',
        date: '2024-03-28',
        actor: 'BotswanaTel Communications',
        actorRole: 'applicant',
        action: 'Annual compliance report submitted',
      },
      {
        id: 'h4',
        date: addDays(TODAY, -5),
        actor: 'BOCRA System',
        actorRole: 'system',
        action: 'Renewal reminder dispatched',
        note: 'Automatic 14-day renewal reminder sent to registered email.',
      },
    ],
  },
  l2: {
    recordType: 'licence',
    id: 'l2',
    licenceNumber: 'ISP-2021-0012',
    licenceType: 'Internet Service Provider',
    category: 'Data Services',
    subCategory: 'Broadband Internet',
    status: 'ACTIVE',
    issueDate: '2021-03-15',
    expiryDate: addDays(TODAY, 42),
    holder: 'Linkserve Botswana (Pty) Ltd',
    holderAddress: 'Plot 14399, Industrial Site, Francistown, Botswana',
    coverageArea: 'Northern Botswana',
    assignedOfficer: 'T. Sechele',
    assignedOfficerDept: 'Licensing & Compliance',
    conditions: [
      {
        id: 'c1',
        clause: '5.1',
        description: 'Licensee shall provide service to at least 85% of the coverage area within 24 months of licence grant.',
        compliant: true,
      },
      {
        id: 'c2',
        clause: '5.3',
        description: 'Licensee shall offer a consumer broadband package at or below the regulated retail price cap.',
        compliant: true,
      },
    ],
    documents: [
      {
        id: 'd1',
        name: 'ISP-2021-0012 — Licence Certificate',
        type: 'certificate',
        issuedDate: '2021-03-15',
        sizeMb: 0.3,
      },
    ],
    history: [
      {
        id: 'h1',
        date: '2021-03-15',
        actor: 'BOCRA Licensing',
        actorRole: 'system',
        action: 'Licence issued',
        note: 'New ISP licence granted for Northern Botswana coverage area.',
      },
      {
        id: 'h2',
        date: addDays(TODAY, -3),
        actor: 'BOCRA System',
        actorRole: 'system',
        action: 'Renewal reminder dispatched',
        note: '60-day renewal notice sent.',
      },
    ],
  },
  a1: {
    recordType: 'application',
    id: 'a1',
    applicationNumber: 'APP-2025-00412',
    type: 'Spectrum Authorisation',
    category: 'Telecommunications',
    status: 'UNDER_REVIEW',
    submittedDate: '2025-03-01',
    lastUpdated: '2025-03-19',
    applicantName: 'BotswanaTel Communications (Pty) Ltd',
    applicantEmail: 'licensing@botswanatel.co.bw',
    notes: 'Application for 3.5 GHz spectrum authorisation to support 5G rollout in Greater Gaborone.',
    history: [
      {
        id: 'h1',
        date: '2025-03-01',
        actor: 'BotswanaTel Communications',
        actorRole: 'applicant',
        action: 'Application submitted',
        note: 'Spectrum Authorisation application submitted with supporting technical documentation.',
      },
      {
        id: 'h2',
        date: '2025-03-05',
        actor: 'BOCRA System',
        actorRole: 'system',
        action: 'Application acknowledged',
        note: 'Application reference number APP-2025-00412 assigned. Processing target: 30 business days.',
      },
      {
        id: 'h3',
        date: '2025-03-19',
        actor: 'K. Mosweu',
        actorRole: 'officer',
        action: 'Technical assessment commenced',
        note: 'Assigned to Spectrum Management team for interference analysis.',
      },
    ],
  },
  a2: {
    recordType: 'application',
    id: 'a2',
    applicationNumber: 'APP-2025-00387',
    type: 'Type Approval — Wireless Router',
    category: 'Type Approval',
    status: 'AWAITING_PAYMENT',
    submittedDate: '2025-02-20',
    lastUpdated: '2025-03-15',
    applicantName: 'TechImport Botswana',
    applicantEmail: 'admin@techimport.co.bw',
    notes: 'Type approval application for TP-Link Archer AX3000 Wi-Fi 6 Router (Model: TX50).',
    history: [
      {
        id: 'h1',
        date: '2025-02-20',
        actor: 'TechImport Botswana',
        actorRole: 'applicant',
        action: 'Application submitted',
      },
      {
        id: 'h2',
        date: '2025-03-15',
        actor: 'BOCRA Type Approval',
        actorRole: 'officer',
        action: 'Technical review completed — fee invoice issued',
        note: 'Device passed EMC and radio conformance tests. Invoice #INV-2025-00387 issued for BWP 1,500.',
      },
    ],
  },
}

const FALLBACK_RECORD: LicenceRecord = {
  recordType: 'licence',
  id: 'unknown',
  licenceNumber: 'N/A',
  licenceType: 'Unknown Licence',
  category: '—',
  subCategory: '—',
  status: 'CANCELLED',
  issueDate: '—',
  expiryDate: '—',
  holder: '—',
  holderAddress: '—',
  coverageArea: '—',
  assignedOfficer: '—',
  assignedOfficerDept: '—',
  conditions: [],
  documents: [],
  history: [],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - TODAY.getTime()) / 86_400_000)
}

// ─── Status badges ────────────────────────────────────────────────────────────

const LICENCE_STATUS: Record<LicenceStatus, { cls: string; label: string; icon: React.ElementType }> = {
  ACTIVE:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active',    icon: CheckCircle2  },
  EXPIRED:   { cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Expired',   icon: XCircle       },
  CANCELLED: { cls: 'bg-gray-100 text-gray-500 border-gray-200',         label: 'Cancelled', icon: XCircle       },
  SUSPENDED: { cls: 'bg-orange-50 text-orange-700 border-orange-200',    label: 'Suspended', icon: AlertTriangle },
}

const APP_STATUS: Record<ApplicationStatus, { cls: string; label: string; icon: React.ElementType }> = {
  PENDING:          { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Pending',          icon: Clock        },
  APPROVED:         { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved',         icon: CheckCircle2 },
  UNDER_REVIEW:     { cls: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'Under Review',     icon: FileText     },
  REJECTED:         { cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Rejected',         icon: XCircle      },
  AWAITING_PAYMENT: { cls: 'bg-purple-50 text-purple-700 border-purple-200',    label: 'Awaiting Payment', icon: Clock        },
}

function LicenceStatusBadge({ status }: { status: LicenceStatus }) {
  const { cls, label, icon: Icon } = LICENCE_STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold', cls)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  const { cls, label, icon: Icon } = APP_STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold', cls)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

// ─── Expiry chip ──────────────────────────────────────────────────────────────

function ExpiryChip({ expiryDate, status }: { expiryDate: string; status: LicenceStatus }) {
  if (status !== 'ACTIVE') return null
  const days = daysUntil(expiryDate)

  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold bg-red-50 text-red-700 border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        Expired
      </span>
    )
  }
  if (days <= 14) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold bg-red-50 text-red-700 border-red-200 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5" />
        Expires in {days} day{days !== 1 ? 's' : ''}
      </span>
    )
  }
  if (days <= 60) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold bg-amber-50 text-amber-700 border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        Expires in {days} days
      </span>
    )
  }
  return null
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </dt>
      <dd className="text-sm text-gray-800">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  )
}

// ─── Conditions tab ───────────────────────────────────────────────────────────

function ConditionsTab({ conditions }: { conditions: LicenceCondition[] }) {
  if (conditions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShieldCheck className="w-8 h-8 mb-2" />
        <p className="text-sm">No conditions recorded for this licence.</p>
      </div>
    )
  }

  const compliantCount  = conditions.filter((c) => c.compliant === true).length
  const breachCount     = conditions.filter((c) => c.compliant === false).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-emerald-700">
          <CheckCircle2 className="w-4 h-4" /> {compliantCount} compliant
        </span>
        {breachCount > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" /> {breachCount} breach{breachCount !== 1 ? 'es' : ''}
          </span>
        )}
        <span className="text-gray-400">
          {conditions.filter((c) => c.compliant === null).length} not assessed
        </span>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
        {conditions.map((cond) => {
          const compIcon =
            cond.compliant === true  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> :
            cond.compliant === false ? <XCircle      className="w-4 h-4 text-red-500 shrink-0 mt-0.5"     /> :
                                       <Clock        className="w-4 h-4 text-gray-300 shrink-0 mt-0.5"    />
          return (
            <div
              key={cond.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3.5 bg-white',
                cond.compliant === false && 'bg-red-50/40',
              )}
            >
              {compIcon}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 mb-0.5">Clause {cond.clause}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{cond.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Documents tab ────────────────────────────────────────────────────────────

const DOC_TYPE_STYLES: Record<LicenceDocument['type'], { cls: string; label: string }> = {
  certificate: { cls: 'bg-[#003580]/8 text-[#003580]',   label: 'Certificate' },
  decision:    { cls: 'bg-amber-50 text-amber-700',        label: 'Decision'    },
  attachment:  { cls: 'bg-gray-100 text-gray-600',         label: 'Attachment'  },
}

function DocumentsTab({ documents }: { documents: LicenceDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText className="w-8 h-8 mb-2" />
        <p className="text-sm">No documents attached.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {documents.map((doc) => {
        const { cls, label } = DOC_TYPE_STYLES[doc.type]
        return (
          <div key={doc.id} className="flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50/60 transition-colors">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
              <p className="text-xs text-gray-400">{doc.issuedDate} &middot; {doc.sizeMb} MB</p>
            </div>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cls)}>
              {label}
            </span>
            <button
              className="flex items-center gap-1 text-xs font-medium text-[#003580] hover:text-[#002a6b] ml-2"
              title="Download document"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── History timeline ─────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: HistoryEvent[] }) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Clock className="w-8 h-8 mb-2" />
        <p className="text-sm">No history recorded.</p>
      </div>
    )
  }

  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <ol className="relative space-y-0">
      {sorted.map((event, idx) => {
        const isLast = idx === sorted.length - 1
        const iconCls =
          event.actorRole === 'officer'   ? 'bg-[#003580] text-white' :
          event.actorRole === 'applicant' ? 'bg-emerald-500 text-white' :
                                            'bg-gray-200 text-gray-500'
        const EventIcon =
          event.actorRole === 'officer'   ? User        :
          event.actorRole === 'applicant' ? Building2   :
                                            CircleDot

        return (
          <li key={event.id} className="flex gap-4">
            {/* connector column */}
            <div className="flex flex-col items-center">
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', iconCls)}>
                <EventIcon className="w-3.5 h-3.5" />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-gray-100 mt-1 mb-1 min-h-[24px]" />}
            </div>

            {/* content */}
            <div className={cn('pb-5 min-w-0 flex-1', isLast && 'pb-0')}>
              <p className="text-xs text-gray-400 mb-0.5">{event.date}</p>
              <p className="text-sm font-semibold text-gray-800">{event.action}</p>
              <p className="text-xs text-gray-500">{event.actor}</p>
              {event.note && (
                <p className="mt-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  {event.note}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ─── Tab system ───────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'conditions' | 'documents' | 'history'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',   label: 'Overview'    },
  { key: 'conditions', label: 'Conditions'  },
  { key: 'documents',  label: 'Documents'   },
  { key: 'history',    label: 'History'     },
]

// ─── Overview tab (licence) ───────────────────────────────────────────────────

function LicenceOverview({ rec }: { rec: LicenceRecord }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
      <DetailRow label="Licence Number"  value={<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{rec.licenceNumber}</code>} />
      <DetailRow label="Licence Type"    value={rec.licenceType} />
      <DetailRow label="Category"        value={rec.category} />
      <DetailRow label="Sub-category"    value={rec.subCategory} />
      <DetailRow label="Holder"          value={rec.holder}          icon={Building2}  />
      <DetailRow label="Holder Address"  value={rec.holderAddress}   icon={MapPin}     />
      <DetailRow label="Coverage Area"   value={rec.coverageArea}    icon={MapPin}     />
      {rec.frequencyBand && (
        <DetailRow label="Frequency Band" value={rec.frequencyBand} />
      )}
      <DetailRow label="Issue Date"      value={rec.issueDate}       icon={CalendarDays} />
      <DetailRow label="Expiry Date"     value={
        <span className={cn(
          rec.status === 'ACTIVE' && daysUntil(rec.expiryDate) <= 14 ? 'text-red-600 font-semibold' :
          rec.status === 'ACTIVE' && daysUntil(rec.expiryDate) <= 60 ? 'text-amber-600 font-medium' : '',
        )}>
          {rec.expiryDate}
        </span>
      } icon={CalendarDays} />
    </div>
  )
}

// ─── Overview tab (application) ───────────────────────────────────────────────

function ApplicationOverview({ rec }: { rec: ApplicationRecord }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <DetailRow label="Application Number" value={<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{rec.applicationNumber}</code>} />
        <DetailRow label="Application Type"   value={rec.type} />
        <DetailRow label="Category"           value={rec.category} />
        <DetailRow label="Applicant"          value={rec.applicantName}  icon={Building2} />
        <DetailRow label="Email"              value={rec.applicantEmail} icon={User}      />
        <DetailRow label="Submitted"          value={rec.submittedDate}  icon={CalendarDays} />
        <DetailRow label="Last Updated"       value={rec.lastUpdated}    icon={CalendarDays} />
      </div>
      {rec.notes && (
        <div>
          <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Description</dt>
          <dd className="text-sm text-gray-700 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 leading-relaxed">
            {rec.notes}
          </dd>
        </div>
      )}
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LicensingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const role = useAppSelector((s) => s.role.role)
  const [tab, setTab] = useState<TabKey>('overview')

  // TODO: Replace with GET https://op-web.bocra.org.bw/api/licences/{id} or /api/applications/{id}
  const { data: record, isLoading } = useDemoAwareQuery<DetailRecord>({
    queryKey: ['licensing-detail', id],
    fetchFn: async () => {
      await new Promise((r) => setTimeout(r, 350))
      return MOCK_RECORDS[id] ?? FALLBACK_RECORD
    },
    demoFallback: MOCK_RECORDS[id] ?? FALLBACK_RECORD,
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/dashboard/licensing"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Licensing
        </Link>
        <PageSkeleton />
      </div>
    )
  }

  if (!record) return null

  const isLicence = record.recordType === 'licence'
  const lic = isLicence ? (record as LicenceRecord) : null
  const app = !isLicence ? (record as ApplicationRecord) : null

  // For applications: conditions & documents tabs are not applicable
  const visibleTabs = isLicence
    ? TABS
    : TABS.filter((t) => t.key === 'overview' || t.key === 'history')

  const title = isLicence
    ? (record as LicenceRecord).licenceNumber
    : (record as ApplicationRecord).applicationNumber

  const subtitle = isLicence
    ? (record as LicenceRecord).licenceType
    : (record as ApplicationRecord).type

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Back link ─────────────────────────────────────────────────── */}
      <Link
        href="/dashboard/licensing"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Licensing
      </Link>

      {/* ── Header card ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Blue stripe */}
        <div className="h-1.5 w-full bg-[#003580]" />

        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left: title + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                {title}
              </code>
              {lic && <LicenceStatusBadge status={lic.status} />}
              {app && <AppStatusBadge status={app.status} />}
              {lic && <ExpiryChip expiryDate={lic.expiryDate} status={lic.status} />}
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{subtitle}</h1>
            {lic && (
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                {lic.holder}
              </p>
            )}
            {app && (
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                {app.applicantName}
              </p>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {lic && (
              <>
                {(lic.status === 'ACTIVE' || lic.status === 'EXPIRED') && (
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003580] text-white text-sm font-semibold hover:bg-[#002a6b] transition-colors shadow-sm">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Renew
                  </button>
                )}
                {lic.status === 'ACTIVE' && (
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                    <FilePen className="w-3.5 h-3.5" />
                    Amend
                  </button>
                )}
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  title="Download certificate"
                >
                  <Download className="w-3.5 h-3.5" />
                  Certificate
                </button>
                {role === 'officer' || role === 'admin' && (
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                    title="Print record"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                )}
              </>
            )}
            {app && app.status === 'AWAITING_PAYMENT' && (
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003580] text-white text-sm font-semibold hover:bg-[#002a6b] transition-colors shadow-sm">
                Pay Fee
              </button>
            )}
          </div>
        </div>

        {/* ── Officer info strip (officer role only, licences only) ───── */}
        {role === 'officer' || role === 'admin' && lic && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Assigned to</span>
            <span className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {lic.assignedOfficer}
            </span>
            <span className="text-xs text-gray-400">{lic.assignedOfficerDept}</span>
          </div>
        )}
      </div>

      {/* ── Critical expiry banner ────────────────────────────────────── */}
      {lic && lic.status === 'ACTIVE' && daysUntil(lic.expiryDate) <= 14 && daysUntil(lic.expiryDate) > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              This licence expires in {daysUntil(lic.expiryDate)} day{daysUntil(lic.expiryDate) !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Submit a renewal application immediately to avoid regulatory non-compliance.
              Contact BOCRA on <strong>+267 395 7755</strong> for assistance.
            </p>
          </div>
        </div>
      )}

      {/* ── Tabbed content ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 px-2 overflow-x-auto">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab === t.key
                  ? 'border-[#003580] text-[#003580]'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
          {/* Loading indicator for background refetch */}
          <div className="ml-auto flex items-center pr-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300 opacity-0" aria-hidden />
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 py-5">
          {tab === 'overview'   && lic  && <LicenceOverview rec={lic} />}
          {tab === 'overview'   && app  && <ApplicationOverview rec={app} />}
          {tab === 'conditions' && lic  && <ConditionsTab conditions={lic.conditions} />}
          {tab === 'documents'  && lic  && <DocumentsTab documents={lic.documents} />}
          {tab === 'history'    && record && <HistoryTab history={record.history} />}
        </div>
      </div>
    </div>
  )
}
