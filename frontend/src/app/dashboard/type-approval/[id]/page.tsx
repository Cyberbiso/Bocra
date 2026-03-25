'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList,
  Building2,
  User,
  Smartphone,
  Cpu,
  FileText,
  Download,
  CheckCheck,
  AlertTriangle,
  Ban,
  Minus,
  Globe,
  Wifi,
  Loader2,
  CalendarDays,
  Flag,
  UserCheck,
  History,
  ChevronRight,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRoleStore } from '@/lib/stores/role-store'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'MORE_INFO'
type DocStatus  = 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'MISSING'

interface Applicant {
  org_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  physical_address: string
  accreditation_type: string
  accreditation_ref: string
}

interface Device {
  brand_name: string
  marketing_name: string
  model_name: string
  is_sim_enabled: boolean
  sample_imei: string
  country_of_manufacture: string
  frequency_bands: string
  transmission_power: string
  network_technology: string[]
  dimensions: string
  weight: string
  battery_capacity: string
}

interface Standards {
  compliance: string[]
  test_laboratory: string
  test_report_ref: string
  test_date: string
  declaration: string
  previously_approved: boolean
  previous_country?: string
  previous_reference?: string
}

interface AppDocument {
  id: string
  type_code: string
  label: string
  status: DocStatus
  file_name: string | null
  note?: string
}

interface TimelineEvent {
  date: string
  event: string
  actor: string
  note?: string | null
}

interface Certificate {
  certificate_number: string
  issued_at: string
  qr_token: string
}

interface ApplicationDetail {
  id: string
  application_number: string
  submitted_at: string
  current_status_code: AppStatus
  current_stage_code: string
  priority_code: string
  expected_decision_at: string
  applicant: Applicant
  device: Device
  standards: Standards
  documents: AppDocument[]
  assigned_to: { id: string; name: string } | null
  certificate?: Certificate
  timeline: TimelineEvent[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppStatus, {
  label: string; icon: React.ElementType; badge: string; bg: string; line: string
}> = {
  PENDING:      { label: 'Pending',           icon: Clock,         badge: 'bg-slate-100 text-slate-700 border-slate-200',       bg: 'bg-slate-100',   line: 'bg-slate-300'   },
  UNDER_REVIEW: { label: 'Under Review',      icon: ClipboardList, badge: 'bg-amber-100 text-amber-700 border-amber-200',       bg: 'bg-amber-100',   line: 'bg-amber-300'   },
  APPROVED:     { label: 'Approved',          icon: CheckCircle2,  badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bg: 'bg-emerald-100', line: 'bg-emerald-400' },
  REJECTED:     { label: 'Rejected',          icon: XCircle,       badge: 'bg-red-100 text-red-700 border-red-200',             bg: 'bg-red-100',     line: 'bg-red-400'     },
  MORE_INFO:    { label: 'More Info Req.',    icon: AlertCircle,   badge: 'bg-blue-100 text-blue-700 border-blue-200',          bg: 'bg-blue-100',    line: 'bg-blue-400'    },
}

const DOC_STATUS_CONFIG: Record<DocStatus, {
  label: string; icon: React.ElementType; cls: string
}> = {
  SUBMITTED: { label: 'Submitted',  icon: FileText,      cls: 'text-gray-500 bg-gray-50 border-gray-200'        },
  VERIFIED:  { label: 'Verified',   icon: CheckCheck,    cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED:  { label: 'Rejected',   icon: Ban,           cls: 'text-red-700 bg-red-50 border-red-200'            },
  MISSING:   { label: 'Missing',    icon: Minus,         cls: 'text-orange-700 bg-orange-50 border-orange-200'   },
}

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  HIGH:   { label: 'High',   cls: 'bg-red-100 text-red-700 border-red-200'    },
  NORMAL: { label: 'Normal', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  LOW:    { label: 'Low',    cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}

const STAGES = [
  { code: 'INITIAL_REVIEW',        label: 'Initial Review'   },
  { code: 'DOCUMENT_VERIFICATION', label: 'Document Check'   },
  { code: 'TECHNICAL_VALIDATION',  label: 'Tech Validation'  },
  { code: 'DECISION_PENDING',      label: 'Decision'         },
  { code: 'COMPLETED',             label: 'Completed'        },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try { return format(new Date(iso), 'dd MMM yyyy') } catch { return iso }
}
function fmtDateTime(iso: string) {
  try { return format(new Date(iso), 'dd MMM yyyy, HH:mm') } catch { return iso }
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-[#003580]/8 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#003580]" />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={cn('text-sm text-gray-800', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: AppStatus }) {
  const { label, badge, icon: Icon } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', badge)}>
      <Icon className="w-3.5 h-3.5" />{label}
    </span>
  )
}

// ─── Stage progress bar ───────────────────────────────────────────────────────

function StageProgress({
  currentStage,
  status,
}: {
  currentStage: string
  status: AppStatus
}) {
  const isTerminal = status === 'REJECTED'
  const currentIdx = STAGES.findIndex(s => s.code === currentStage)

  return (
    <div className="flex items-center gap-0">
      {STAGES.map((stage, i) => {
        const done    = isTerminal ? false : i < currentIdx
        const active  = !isTerminal && i === currentIdx
        const future  = !done && !active

        return (
          <div key={stage.code} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                done   ? 'bg-emerald-500 text-white'
                       : active && isTerminal ? 'bg-red-500 text-white'
                       : active ? 'bg-[#003580] text-white ring-4 ring-[#003580]/15'
                       : 'bg-gray-100 text-gray-400',
              )}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
              </div>
              <span className={cn(
                'text-[10px] font-medium whitespace-nowrap hidden sm:block',
                done ? 'text-emerald-600' : active ? 'text-[#003580] font-semibold' : 'text-gray-400',
              )}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-1 mb-4',
                done ? 'bg-emerald-400' : 'bg-gray-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      <div className="h-24 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="space-y-5">
          {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

// ─── Not found ────────────────────────────────────────────────────────────────

function NotFound({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-gray-400" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Application Not Found</h2>
        <p className="text-sm text-gray-500">No application found with ID <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{id}</code></p>
      </div>
      <Link
        href="/dashboard/type-approval"
        className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />Back to Applications
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TypeApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { role } = useRoleStore()
  const isStaff = role === 'officer' || role === 'admin'
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const { data: app, isLoading, isError } = useQuery<ApplicationDetail>({
    queryKey: ['ta-application', id],
    queryFn: () =>
      fetch(`/api/type-approval/applications/${id}`).then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      }),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading application…</span>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (isError || !app) return <NotFound id={id} />

  const statusCfg  = STATUS_CONFIG[app.current_status_code]
  const priorityCfg = PRIORITY_CONFIG[app.priority_code] ?? PRIORITY_CONFIG.NORMAL
  const isApproved = app.current_status_code === 'APPROVED'
  const isRejected = app.current_status_code === 'REJECTED'
  const isMoreInfo = app.current_status_code === 'MORE_INFO'

  const verifiedDocs  = app.documents.filter(d => d.status === 'VERIFIED').length
  const rejectedDocs  = app.documents.filter(d => d.status === 'REJECTED').length
  const missingDocs   = app.documents.filter(d => d.status === 'MISSING').length
  const docTotal      = app.documents.length

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Breadcrumb / back ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/type-approval" className="flex items-center gap-1.5 hover:text-[#003580] transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />Type Approval
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-gray-800 font-semibold font-mono">{app.application_number}</span>
      </div>

      {/* ── Header card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Status colour bar */}
        <div className={cn('h-1', statusCfg.line)} />
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', statusCfg.bg)}>
                <statusCfg.icon className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900 font-mono">{app.application_number}</h1>
                  <StatusBadge status={app.current_status_code} />
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', priorityCfg.cls)}>
                    <Flag className="w-2.5 h-2.5" />{priorityCfg.label} Priority
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {app.device.brand_name} {app.device.marketing_name}
                  <span className="text-gray-400 font-mono ml-2 text-xs">({app.device.model_name})</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{app.applicant.org_name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 shrink-0">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Submitted {fmtDate(app.submitted_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Decision by {fmtDate(app.expected_decision_at)}</span>
              </div>
              {app.assigned_to && (
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{app.assigned_to.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stage progress */}
          {!isRejected && (
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Application Progress</p>
              <StageProgress currentStage={app.current_stage_code} status={app.current_status_code} />
            </div>
          )}

          {/* Rejection / more-info banners */}
          {isRejected && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Application Rejected</p>
                <p className="text-xs text-red-600 mt-0.5">
                  This application was rejected. Review the document feedback below and{' '}
                  <Link href="/dashboard/type-approval/apply" className="underline font-medium">submit a new application</Link>
                  {' '}with corrected documentation.
                </p>
              </div>
            </div>
          )}
          {isMoreInfo && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Additional Information Required</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  BOCRA has requested additional information or corrected documents. Review the feedback below and resubmit.
                </p>
              </div>
            </div>
          )}
          {isApproved && app.certificate && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Certificate Issued</p>
                  <p className="text-xs text-emerald-700 font-mono mt-0.5">{app.certificate.certificate_number}</p>
                </div>
              </div>
              <Link
                href="/dashboard/certificates"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors whitespace-nowrap"
              >
                View Certificate <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT — main details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Applicant */}
          <SectionCard title="Applicant & Accreditation" icon={Building2}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Organisation"        value={app.applicant.org_name} />
              <Field label="Contact Person"      value={app.applicant.contact_name} />
              <Field label="Email"               value={<a href={`mailto:${app.applicant.contact_email}`} className="text-[#003580] hover:underline">{app.applicant.contact_email}</a>} />
              <Field label="Phone"               value={app.applicant.contact_phone} />
              <Field label="Physical Address"    value={app.applicant.physical_address} />
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Accreditation</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                    <User className="w-3 h-3" />{app.applicant.accreditation_type}
                  </span>
                  <code className="text-[10px] font-mono text-gray-400">{app.applicant.accreditation_ref}</code>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Equipment */}
          <SectionCard title="Equipment Information" icon={Smartphone}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Brand"                   value={app.device.brand_name} />
              <Field label="Marketing Name"          value={app.device.marketing_name} />
              <Field label="Model Number"            value={app.device.model_name} mono />
              <Field label="Sample IMEI"             value={app.device.sample_imei} mono />
              <Field label="Country of Manufacture"  value={<span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-gray-400" />{app.device.country_of_manufacture}</span>} />
              <Field label="SIM Enabled"             value={
                app.device.is_sim_enabled
                  ? <span className="inline-flex items-center gap-1 text-emerald-700 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Yes</span>
                  : <span className="inline-flex items-center gap-1 text-gray-500"><Wifi className="w-3.5 h-3.5" />No (Wi-Fi/BT only)</span>
              } />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Dimensions"         value={app.device.dimensions} />
              <Field label="Weight"             value={app.device.weight} />
              <Field label="Battery Capacity"   value={app.device.battery_capacity} />
            </div>
          </SectionCard>

          {/* Technical specs */}
          <SectionCard title="Technical Specifications" icon={Cpu}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Network Technologies</p>
                <div className="flex flex-wrap gap-1.5">
                  {app.device.network_technology.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Frequency Bands"     value={app.device.frequency_bands} mono />
                <Field label="Transmission Power"  value={app.device.transmission_power} />
              </div>
            </div>
          </SectionCard>

          {/* Standards & compliance */}
          <SectionCard title="Standards & Compliance" icon={ShieldCheck}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Applicable Standards</p>
                <div className="flex flex-wrap gap-1.5">
                  {app.standards.compliance.map(s => (
                    <span key={s} className="inline-flex items-center rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-mono font-medium text-indigo-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 pt-2">
                <Field label="Test Laboratory"   value={app.standards.test_laboratory} />
                <Field label="Test Report Ref."  value={app.standards.test_report_ref} mono />
                <Field label="Test Date"         value={fmtDate(app.standards.test_date)} />
              </div>

              {app.standards.previously_approved && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 grid grid-cols-2 gap-4">
                  <Field label="Previously Approved In" value={app.standards.previous_country} />
                  <Field label="Previous Reference"     value={app.standards.previous_reference} mono />
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Applicant Declaration</p>
                <p className="text-xs text-gray-600 leading-relaxed italic bg-gray-50 rounded-lg border border-gray-100 px-4 py-3">
                  "{app.standards.declaration}"
                </p>
              </div>
            </div>
          </SectionCard>

        </div>

        {/* RIGHT — sidebar */}
        <div className="space-y-5">

          {/* Documents */}
          <SectionCard title="Submitted Documents" icon={FileText}>
            {/* Summary strip */}
            <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
              <span className="text-emerald-600 font-semibold">{verifiedDocs}/{docTotal} verified</span>
              {rejectedDocs > 0 && <span className="text-red-600 font-semibold">{rejectedDocs} rejected</span>}
              {missingDocs  > 0 && <span className="text-orange-600 font-semibold">{missingDocs} missing</span>}
            </div>

            <div className="space-y-2">
              {app.documents.map(doc => {
                const { label: dLabel, icon: DIcon, cls } = DOC_STATUS_CONFIG[doc.status]
                const isExpanded = expandedDoc === doc.id
                return (
                  <div
                    key={doc.id}
                    className={cn(
                      'rounded-lg border transition-all',
                      doc.status === 'REJECTED' ? 'border-red-200 bg-red-50/40'
                      : doc.status === 'MISSING' ? 'border-orange-200 bg-orange-50/30'
                      : 'border-gray-100 bg-gray-50/50',
                    )}
                  >
                    <button
                      onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold shrink-0', cls)}>
                          <DIcon className="w-2.5 h-2.5" />{dLabel}
                        </span>
                        <span className="text-xs text-gray-700 font-medium truncate">{doc.label}</span>
                      </div>
                      {(doc.file_name || doc.note) && (
                        <ChevronRight className={cn('w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform', isExpanded && 'rotate-90')} />
                      )}
                    </button>
                    {isExpanded && (doc.file_name || doc.note) && (
                      <div className="px-3 pb-2.5 space-y-1.5 border-t border-gray-100 pt-2">
                        {doc.file_name && (
                          <div className="flex items-center gap-1.5">
                            <Download className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-[10px] font-mono text-gray-500 truncate">{doc.file_name}</span>
                          </div>
                        )}
                        {doc.note && (
                          <p className="text-[11px] text-red-700 leading-snug bg-red-50 rounded px-2 py-1 border border-red-100">
                            {doc.note}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </SectionCard>

          {/* Assignment (staff only) */}
          {isStaff && (
            <SectionCard title="Assignment" icon={UserCheck}>
              <div className="space-y-3">
                {app.assigned_to ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#003580]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#003580]">{app.assigned_to.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{app.assigned_to.name}</p>
                      <p className="text-xs text-gray-400">Assigned Officer</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Not yet assigned</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Priority"     value={
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', priorityCfg.cls)}>
                      <Flag className="w-2.5 h-2.5" />{priorityCfg.label}
                    </span>
                  } />
                  <Field label="Expected By"  value={fmtDate(app.expected_decision_at)} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Timeline */}
          <SectionCard title="Activity Timeline" icon={History}>
            <div className="space-y-0">
              {[...app.timeline].reverse().map((event, i) => (
                <div key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                  {/* Connector */}
                  {i < app.timeline.length - 1 && (
                    <div className="absolute left-[13px] top-6 bottom-0 w-px bg-gray-100" />
                  )}
                  <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-[#003580]/60" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{event.event}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{fmtDateTime(event.date)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{event.actor}</p>
                    {event.note && (
                      <p className="text-[11px] text-gray-600 mt-1 leading-snug bg-gray-50 rounded px-2 py-1 border border-gray-100">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
