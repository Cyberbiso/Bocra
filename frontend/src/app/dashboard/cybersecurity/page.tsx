'use client'

import { useState, useRef } from 'react'
import {
  Shield, AlertTriangle, AlertCircle, CheckCircle2,
  FileText, Phone, Mail, Upload, ExternalLink, Info,
  Paperclip, X, Lock, Clock, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/lib/store/hooks'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL'
type IncidentStatus = 'RECEIVED' | 'TRIAGED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'

// ─── Config ───────────────────────────────────────────────────────────────────

const SEV_CONFIG: Record<Severity, { label: string; textCls: string; bgCls: string; borderCls: string; Icon: React.ElementType }> = {
  CRITICAL:      { label: 'Critical',      textCls: 'text-red-700',    bgCls: 'bg-red-100',    borderCls: 'border-red-300',    Icon: AlertCircle },
  HIGH:          { label: 'High',          textCls: 'text-orange-700', bgCls: 'bg-orange-100', borderCls: 'border-orange-300', Icon: AlertTriangle },
  MEDIUM:        { label: 'Medium',        textCls: 'text-amber-700',  bgCls: 'bg-amber-100',  borderCls: 'border-amber-300',  Icon: AlertTriangle },
  LOW:           { label: 'Low',           textCls: 'text-blue-700',   bgCls: 'bg-blue-100',   borderCls: 'border-blue-300',   Icon: Info },
  INFORMATIONAL: { label: 'Informational', textCls: 'text-gray-600',   bgCls: 'bg-gray-100',   borderCls: 'border-gray-300',   Icon: Info },
}

const STATUS_CONFIG: Record<IncidentStatus, { label: string; textCls: string; bgCls: string }> = {
  RECEIVED:      { label: 'Received',      textCls: 'text-blue-700',   bgCls: 'bg-blue-100' },
  TRIAGED:       { label: 'Triaged',       textCls: 'text-amber-700',  bgCls: 'bg-amber-100' },
  INVESTIGATING: { label: 'Investigating', textCls: 'text-orange-700', bgCls: 'bg-orange-100' },
  RESOLVED:      { label: 'Resolved',      textCls: 'text-green-700',  bgCls: 'bg-green-100' },
  CLOSED:        { label: 'Closed',        textCls: 'text-gray-600',   bgCls: 'bg-gray-100' },
}

const INCIDENT_TYPE_OPTIONS = [
  'Data Breach',
  'Ransomware',
  'Phishing',
  'DDoS',
  'Unauthorized Access',
  'Other',
]

const SEVERITY_OPTIONS: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ADVISORIES = [
  {
    id: 'ADV-2026-003',
    title: 'Active Ransomware Campaign Targeting Botswana Financial Sector',
    severity: 'CRITICAL' as Severity,
    published: '20 Mar 2026',
    sectors: ['Financial Services', 'Banking', 'Insurance'],
    summary:
      'bwCIRT has identified an active ransomware campaign using LockBit 3.0 variants targeting financial institutions in Botswana. Threat actors are exploiting unpatched vulnerabilities in VPN appliances for initial access.',
    href: 'https://bocra.org.bw/cybersecurity/advisories/2026-003',
  },
  {
    id: 'ADV-2026-002',
    title: 'Phishing Campaign Impersonating BOCRA Official Communications',
    severity: 'HIGH' as Severity,
    published: '15 Mar 2026',
    sectors: ['All Sectors', 'Government', 'Telecoms'],
    summary:
      'A widespread phishing campaign is distributing emails falsely claiming to be from BOCRA requesting licence renewal payments. Victims are directed to convincing spoofed payment portals collecting banking credentials.',
    href: 'https://bocra.org.bw/cybersecurity/advisories/2026-002',
  },
  {
    id: 'ADV-2026-001',
    title: 'BGP Route Hijacking Vulnerability Affecting ISPs and Network Operators',
    severity: 'MEDIUM' as Severity,
    published: '8 Mar 2026',
    sectors: ['Telecommunications', 'ISPs', 'Critical Infrastructure'],
    summary:
      'A vulnerability in BGP route filtering implementations allows malicious actors to inject illegitimate routes. Botswana ISPs are urged to review BGP configurations and apply RPKI route origin validation.',
    href: 'https://bocra.org.bw/cybersecurity/advisories/2026-001',
  },
]

const MOCK_INCIDENTS: {
  ref: string
  type: string
  severity: Severity
  submitted: string
  status: IncidentStatus
}[] = [
  { ref: 'CIRT-2026-47832', type: 'Phishing',            severity: 'HIGH',     submitted: '18 Mar 2026', status: 'INVESTIGATING' },
  { ref: 'CIRT-2026-33219', type: 'Unauthorized Access', severity: 'CRITICAL', submitted: '5 Mar 2026',  status: 'RESOLVED' },
  { ref: 'CIRT-2026-21104', type: 'DDoS',                severity: 'HIGH',     submitted: '20 Feb 2026', status: 'CLOSED' },
]

// ─── Shared components ────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const c = SEV_CONFIG[severity]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', c.bgCls, c.textCls)}>
      <c.Icon className="size-3" />
      {c.label}
    </span>
  )
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', c.bgCls, c.textCls)}>
      {c.label}
    </span>
  )
}

function FieldLabel({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      {required && <span className="sr-only">(required)</span>}
    </label>
  )
}

function inputCls(extra?: string) {
  return cn(
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 transition-colors',
    extra,
  )
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-lg border transition-colors',
            value === v
              ? 'bg-[#003580] text-white border-[#003580]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
          )}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Classification', 'Details', 'Reporter', 'Submit']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, idx) => {
        const num = idx + 1
        const done = num < current
        const active = num === current
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'size-7 rounded-full flex items-center justify-center text-xs font-bold flex-none transition-colors',
                  done    ? 'bg-[#003580] text-white'
                  : active ? 'bg-[#003580] text-white ring-4 ring-[#003580]/20'
                  :          'bg-gray-100 text-gray-400',
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : num}
              </div>
              <span className={cn('text-[10px] mt-1 whitespace-nowrap', active ? 'text-[#003580] font-semibold' : 'text-gray-400')}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-1 mb-4 transition-colors', done ? 'bg-[#003580]' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CybersecurityPage() {
  const role = useAppSelector((s) => s.role.role)

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [refNumber, setRefNumber] = useState('')

  // Step 1
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [incidentType, setIncidentType] = useState('')
  const [affectedSystems, setAffectedSystems] = useState('')

  // Step 2
  const [startTime, setStartTime] = useState('')
  const [stillAffected, setStillAffected] = useState<boolean | null>(null)
  const [description, setDescription] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 3
  const [orgName, setOrgName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isCriticalInfra, setIsCriticalInfra] = useState<boolean | null>(null)

  // Validation
  const step1Valid = !!severity && !!incidentType && affectedSystems.trim().length > 0
  const step2Valid = !!startTime && stillAffected !== null && description.trim().length >= 100
  const step3Valid = orgName.trim().length > 0 && contactName.trim().length > 0 && email.trim().length > 0 && isCriticalInfra !== null

  function handleClose() {
    setDialogOpen(false)
    setTimeout(() => {
      setStep(1)
      setRefNumber('')
      setSeverity('')
      setIncidentType('')
      setAffectedSystems('')
      setStartTime('')
      setStillAffected(null)
      setDescription('')
      setEvidenceFile(null)
      setOrgName('')
      setContactName('')
      setEmail('')
      setPhone('')
      setIsCriticalInfra(null)
    }, 300)
  }

  function handleSubmit() {
    const ref = `CIRT-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`
    setRefNumber(ref)
    setStep(4)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cybersecurity Incident Reporting &amp; Advisories</h1>
        <p className="text-sm text-gray-500 mt-1">
          Report cyber incidents to bwCIRT, track active threat advisories, and access response resources.
        </p>
      </div>

      {/* ── Section 1: Report card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-400" />
        <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="size-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center flex-none">
            <Shield className="size-7 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg">Cyber Incident Reporting</h2>
            <p className="text-sm text-gray-500 mt-1">
              If your organisation has experienced a cyber incident, report it to bwCIRT immediately.
              Critical incidents should be reported within <span className="font-semibold text-red-600">72 hours</span>.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 focus-visible:ring-offset-2"
          >
            <Shield className="size-4" />
            Report an Incident
          </button>
        </div>
      </div>

      {/* ── Section 2: Active advisories ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Active Advisories</h2>
            <p className="text-xs text-gray-500 mt-0.5">Latest threat intelligence from bwCIRT</p>
          </div>
          <span className="text-xs text-gray-400">{MOCK_ADVISORIES.length} active</span>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_ADVISORIES.map((adv) => {
            const c = SEV_CONFIG[adv.severity]
            return (
              <div key={adv.id} className={cn('px-6 py-4 hover:bg-gray-50/60 transition-colors border-l-4', c.borderCls)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <SeverityBadge severity={adv.severity} />
                      <span className="text-xs text-gray-400 font-mono">{adv.id}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="size-3" />
                        {adv.published}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{adv.title}</h3>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{adv.summary}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {adv.sectors.map((s) => (
                        <span key={s} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={adv.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="size-3" />
                    Read Full Advisory
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 3: Incident tracker ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">My Incident Reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track the status of incidents you have reported</p>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Reference', 'Type', 'Severity', 'Submitted', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_INCIDENTS.map((inc) => (
                  <tr key={inc.ref} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-[#003580] font-medium">{inc.ref}</td>
                    <td className="px-6 py-3.5 text-gray-700">{inc.type}</td>
                    <td className="px-6 py-3.5"><SeverityBadge severity={inc.severity} /></td>
                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">{inc.submitted}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={inc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* ── Section 4: Response resources ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Response Resources</h2>
          <p className="text-xs text-gray-500 mt-0.5">Guides, obligations, and direct contact for bwCIRT</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Incident Response Guide */}
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#003580]/40 hover:bg-blue-50/30 transition-colors">
            <div className="size-10 rounded-lg bg-[#003580]/10 flex items-center justify-center">
              <FileText className="size-5 text-[#003580]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Incident Response Guide</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Step-by-step guide for organisations to contain, eradicate, and recover from cyber incidents.
              </p>
            </div>
            <button
              onClick={() => {
                const blob = new Blob(['BOCRA Incident Response Guide\n\nMock PDF content.'], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'bocra-incident-response-guide.pdf'; a.click()
                URL.revokeObjectURL(url)
              }}
              className="mt-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors w-fit"
            >
              <ExternalLink className="size-3" />
              Download Guide
            </button>
          </div>

          {/* Reporting Obligations */}
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#003580]/40 hover:bg-blue-50/30 transition-colors">
            <div className="size-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <AlertTriangle className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Reporting Obligations</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Legal reporting requirements for critical infrastructure operators under the Cybercrime and Cybersecurity Act.
              </p>
            </div>
            <button
              onClick={() => {
                const blob = new Blob(['BOCRA Reporting Obligations for Critical Infrastructure\n\nMock PDF content.'], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'critical-infra-reporting-obligations.pdf'; a.click()
                URL.revokeObjectURL(url)
              }}
              className="mt-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors w-fit"
            >
              <ExternalLink className="size-3" />
              Download PDF
            </button>
          </div>

          {/* Contact bwCIRT */}
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-200 bg-red-50/40">
            <div className="size-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Contact bwCIRT</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Botswana Computer Incident Response Team — available 24/7 for critical incident escalation.
              </p>
            </div>
            <div className="mt-auto space-y-2">
              <a href="mailto:cirt@bocra.org.bw" className="flex items-center gap-2 text-xs text-gray-700 hover:text-[#003580] transition-colors">
                <Mail className="size-3.5 text-gray-400" />
                cirt@bocra.org.bw
              </a>
              <a href="tel:+26736900999" className="flex items-center gap-2 text-xs text-gray-700 hover:text-[#003580] transition-colors">
                <Phone className="size-3.5 text-gray-400" />
                +267 3690 0999
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reporting Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent
          className="sm:max-w-2xl flex flex-col max-h-[90vh] overflow-hidden p-0 gap-0"
          showCloseButton
        >
          {/* Dialog header */}
          <div className="px-6 pt-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900 mb-1">
              <Shield className="size-4 text-red-600" />
              Report a Cyber Incident
            </DialogTitle>
            {step < 4 && <StepIndicator current={step} />}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-2 min-h-0">

            {/* ── Step 1: Classification ── */}
            {step === 1 && (
              <div className="space-y-5 pb-2">
                {/* Severity */}
                <div>
                  <FieldLabel required>Severity</FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SEVERITY_OPTIONS.map((s) => {
                      const c = SEV_CONFIG[s]
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSeverity(s)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                            severity === s
                              ? `${c.bgCls} ${c.textCls} ${c.borderCls}`
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                          )}
                        >
                          <c.Icon className="size-3.5 flex-none" />
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Incident type */}
                <div>
                  <FieldLabel required>Incident Type</FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INCIDENT_TYPE_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setIncidentType(t)}
                        className={cn(
                          'px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left',
                          incidentType === t
                            ? 'bg-[#003580] text-white border-[#003580]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Affected systems */}
                <div>
                  <FieldLabel required htmlFor="cirt-affected-systems">Affected Systems</FieldLabel>
                  <textarea
                    id="cirt-affected-systems"
                    value={affectedSystems}
                    onChange={(e) => setAffectedSystems(e.target.value)}
                    placeholder="e.g. Core banking system, customer-facing web portal, internal email servers…"
                    rows={3}
                    className={inputCls('resize-none')}
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Details ── */}
            {step === 2 && (
              <div className="space-y-5 pb-2">
                <div>
                  <FieldLabel required htmlFor="cirt-start-time">When did the incident start?</FieldLabel>
                  <input
                    id="cirt-start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputCls()}
                  />
                </div>

                <div>
                  <FieldLabel required>Are systems still currently affected?</FieldLabel>
                  <YesNoToggle value={stillAffected} onChange={setStillAffected} />
                </div>

                <div>
                  <FieldLabel required htmlFor="cirt-description">Incident Description</FieldLabel>
                  <textarea
                    id="cirt-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what happened, how it was discovered, what data or systems are impacted, and any steps already taken…"
                    rows={5}
                    className={inputCls('resize-none')}
                  />
                  <p className={cn('text-xs mt-1 text-right', description.length >= 100 ? 'text-green-600' : 'text-gray-400')}>
                    {description.length} / 100 minimum characters
                  </p>
                </div>

                <div>
                  <FieldLabel>Evidence File (optional)</FieldLabel>
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} />
                  {evidenceFile ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700">
                      <Paperclip className="size-4 text-gray-400 flex-none" />
                      <span className="flex-1 truncate">{evidenceFile.name}</span>
                      <button
                        onClick={() => setEvidenceFile(null)}
                        aria-label="Remove attached file"
                        className="text-gray-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 rounded"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#003580] hover:text-[#003580] transition-colors w-full justify-center"
                    >
                      <Upload className="size-4" />
                      Upload screenshot, log file, or other evidence
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 3: Reporter ── */}
            {step === 3 && (
              <div className="space-y-4 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required htmlFor="cirt-org-name">Organisation Name</FieldLabel>
                    <input
                      id="cirt-org-name"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Botswana (Pty) Ltd"
                      className={inputCls()}
                    />
                  </div>
                  <div>
                    <FieldLabel required htmlFor="cirt-contact-name">Contact Name</FieldLabel>
                    <input
                      id="cirt-contact-name"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full name"
                      className={inputCls()}
                    />
                  </div>
                  <div>
                    <FieldLabel required htmlFor="cirt-email">Email Address</FieldLabel>
                    <input
                      id="cirt-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@organisation.co.bw"
                      className={inputCls()}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="cirt-phone">Phone Number</FieldLabel>
                    <input
                      id="cirt-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+267 7X XXX XXX"
                      className={inputCls()}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel required>Is your organisation a Critical Infrastructure operator?</FieldLabel>
                  <YesNoToggle value={isCriticalInfra} onChange={setIsCriticalInfra} />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Critical infrastructure includes telecommunications, energy, finance, water, health, and government sectors.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5 mt-2">
                  <AlertTriangle className="size-4 text-amber-600 flex-none mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    By submitting this report you confirm the information is accurate to the best of your knowledge. False or misleading incident reports may be subject to legal consequences.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 4: Success ── */}
            {step === 4 && (
              <div className="py-6 flex flex-col items-center text-center gap-4">
                <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Incident Reported Successfully</h3>
                  <p className="text-sm text-gray-500 mt-1.5 max-w-sm">
                    Your report has been received by bwCIRT. You will be contacted within 24 hours. Keep your reference number for follow-up.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 w-full max-w-xs">
                  <p className="text-xs text-gray-500 mb-1">Incident Reference Number</p>
                  <p className="font-mono font-bold text-[#003580] text-xl tracking-wider">{refNumber}</p>
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <p className="flex items-center gap-1.5"><Mail className="size-3.5 text-gray-400" /> Confirmation sent to {email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="size-3.5 text-gray-400" /> bwCIRT: +267 3690 0999</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
            {step < 4 ? (
              <>
                <button
                  onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Step {step} of 3</span>
                  {step < 3 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 ? !step1Valid : !step2Valid}
                      className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-[#003580] text-white rounded-lg hover:bg-[#002a6e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!step3Valid}
                      className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Shield className="size-4" />
                      Submit Report
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="ml-auto px-5 py-2 text-sm font-medium bg-[#003580] text-white rounded-lg hover:bg-[#002a6e] transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
