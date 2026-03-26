'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  Lock, Users, AlertTriangle, Clock, TrendingUp,
  FileText, BarChart2, Database, Download, Plus, Edit2,
  RefreshCw, Loader2, CheckCircle2, Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRoleStore } from '@/lib/stores/role-store'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'HIGH' | 'NORMAL' | 'LOW'
type QueueModule = 'Licensing' | 'Type Approval' | 'Complaints'

interface QueueItem {
  id: string
  type: QueueModule
  applicant: string
  submitted: string
  days: number
  priority: Priority
  officer: string
}

interface SlaRow {
  module: string
  compliance: number
  open: number
}

interface UrgentCase {
  id: string
  type: QueueModule
  applicant: string
  deadline: string
  hoursLeft: number
  officer: string
}

interface GeneratedReport {
  id: string
  name: string
  module: string
  generatedAt: string
  size: string
  file: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const QUEUE: QueueItem[] = [
  { id: 'LCN-APP-2026-0041', type: 'Licensing',     applicant: 'TeleCo BW (Pty) Ltd',          submitted: '18 Mar 2026', days: 5,  priority: 'HIGH',   officer: 'J. Mphathi' },
  { id: 'TA-APP-2026-0098',  type: 'Type Approval', applicant: 'Xiaomi Inc',                    submitted: '20 Mar 2026', days: 3,  priority: 'NORMAL', officer: 'Unassigned' },
  { id: 'CMP-2026-1892',     type: 'Complaints',    applicant: 'Kelebogile Moyo',               submitted: '17 Mar 2026', days: 6,  priority: 'HIGH',   officer: 'T. Gaokgane' },
  { id: 'LCN-APP-2026-0039', type: 'Licensing',     applicant: 'Linkserve Botswana (Pty) Ltd',  submitted: '15 Mar 2026', days: 8,  priority: 'NORMAL', officer: 'J. Mphathi' },
  { id: 'TA-APP-2026-0097',  type: 'Type Approval', applicant: 'Samsung Electronics',           submitted: '19 Mar 2026', days: 4,  priority: 'NORMAL', officer: 'L. Seretse' },
  { id: 'CMP-2026-1876',     type: 'Complaints',    applicant: 'Tumelo Dikgang',                submitted: '10 Mar 2026', days: 13, priority: 'HIGH',   officer: 'Unassigned' },
  { id: 'LCN-APP-2026-0035', type: 'Licensing',     applicant: 'Satellite Comms BW Ltd',        submitted: '8 Mar 2026',  days: 15, priority: 'LOW',    officer: 'T. Gaokgane' },
  { id: 'TA-APP-2026-0094',  type: 'Type Approval', applicant: 'Apple Inc',                     submitted: '12 Mar 2026', days: 11, priority: 'NORMAL', officer: 'L. Seretse' },
  { id: 'CMP-2026-1901',     type: 'Complaints',    applicant: 'Mpho Ntsie',                    submitted: '21 Mar 2026', days: 2,  priority: 'LOW',    officer: 'Unassigned' },
  { id: 'LCN-APP-2026-0043', type: 'Licensing',     applicant: 'BotswanaTel Communications',   submitted: '22 Mar 2026', days: 1,  priority: 'NORMAL', officer: 'Unassigned' },
]

const SLA_DATA: SlaRow[] = [
  { module: 'Licensing',     compliance: 87, open: 14 },
  { module: 'Type Approval', compliance: 94, open: 8  },
  { module: 'Complaints',    compliance: 72, open: 23 },
  { module: 'Spectrum',      compliance: 91, open: 6  },
  { module: 'Domain',        compliance: 98, open: 2  },
]

const URGENT: UrgentCase[] = [
  { id: 'CMP-2026-1892',     type: 'Complaints',    applicant: 'Kelebogile Moyo',      deadline: 'Today 17:00',     hoursLeft: 5,  officer: 'T. Gaokgane' },
  { id: 'LCN-APP-2026-0039', type: 'Licensing',     applicant: 'Linkserve Botswana',   deadline: 'Tomorrow 09:00',  hoursLeft: 21, officer: 'J. Mphathi' },
  { id: 'CMP-2026-1876',     type: 'Complaints',    applicant: 'Tumelo Dikgang',       deadline: 'Tomorrow 14:00',  hoursLeft: 27, officer: 'Unassigned' },
  { id: 'TA-APP-2026-0097',  type: 'Type Approval', applicant: 'Samsung Electronics',  deadline: 'Tomorrow 16:00',  hoursLeft: 43, officer: 'L. Seretse' },
]

const SEED_REPORTS: GeneratedReport[] = [
  { id: 'RPT-2026-71042', name: 'Activity Summary — All Modules — Last 30 days',   module: 'All',          generatedAt: '20 Mar 2026', size: '847 KB', file: 'activity-summary-mar-2026.pdf' },
  { id: 'RPT-2026-65511', name: 'SLA Compliance Report — Complaints — Last 90 days', module: 'Complaints',  generatedAt: '15 Mar 2026', size: '412 KB', file: 'sla-complaints-q1-2026.pdf' },
  { id: 'RPT-2026-58830', name: 'Revenue Report — Licensing — Last 30 days',         module: 'Licensing',   generatedAt: '1 Mar 2026',  size: '231 KB', file: 'revenue-licensing-feb-2026.pdf' },
]

// ─── Master data ───────────────────────────────────────────────────────────────

const COMPLAINT_CATS = [
  { id: 1, name: 'Billing Dispute',   description: 'Overcharging, incorrect bills' },
  { id: 2, name: 'Network Coverage',  description: 'Poor signal, dead zones' },
  { id: 3, name: 'Service Quality',   description: 'Slow data, dropped calls' },
  { id: 4, name: 'Broadcasting',      description: 'Content violations, transmission issues' },
  { id: 5, name: 'Postal Services',   description: 'Lost mail, delivery failures' },
  { id: 6, name: 'Cybersecurity',     description: 'Data breaches, phishing' },
  { id: 7, name: 'Other',             description: 'Miscellaneous complaints' },
]
const LICENCE_TYPES_DATA = [
  { id: 1, code: 'NSL', name: 'Network Service Licence',     category: 'Electronic Comms', fee: 'P 50,000' },
  { id: 2, code: 'ASL', name: 'Application Service Licence', category: 'Electronic Comms', fee: 'P 25,000' },
  { id: 3, code: 'BSL', name: 'Broadcasting Service Licence',category: 'Broadcasting',     fee: 'P 30,000' },
  { id: 4, code: 'PSL', name: 'Postal Service Licence',      category: 'Postal',           fee: 'P 15,000' },
  { id: 5, code: 'SML', name: 'Spectrum Management Licence', category: 'Spectrum',         fee: 'Variable' },
]
const NOTIF_TEMPLATES = [
  { id: 1, name: 'Application Received',    trigger: 'On submission',       channels: 'Email, In-App' },
  { id: 2, name: 'Payment Due Reminder',    trigger: '7 days before due',   channels: 'Email, SMS, In-App' },
  { id: 3, name: 'Certificate Issued',      trigger: 'On approval',         channels: 'Email, In-App' },
  { id: 4, name: 'Complaint Update',        trigger: 'Status change',       channels: 'Email, In-App' },
  { id: 5, name: 'Licence Renewal Warning', trigger: '60 days before expiry',channels: 'Email, SMS, In-App' },
  { id: 6, name: 'SLA Breach Alert',        trigger: 'Internal trigger',    channels: 'In-App (officers only)' },
]
const OPERATORS_DATA = [
  { id: 1, name: 'Mascom Wireless Botswana', code: 'MASCOM', type: 'MNO',         status: 'Active' },
  { id: 2, name: 'Orange Botswana (Pty) Ltd',code: 'ORANGE', type: 'MNO',         status: 'Active' },
  { id: 3, name: 'BTC (Botswana Telecom)',    code: 'BTC',    type: 'MNO + ISP',   status: 'Active' },
  { id: 4, name: 'BoFiNet',                  code: 'BOFINET',type: 'ISP',          status: 'Active' },
]

const OFFICERS = ['All', 'J. Mphathi', 'T. Gaokgane', 'L. Seretse', 'Unassigned']
const QUEUE_MODULES: ('All' | QueueModule)[] = ['All', 'Licensing', 'Type Approval', 'Complaints']
const QUEUE_STATUSES = ['All', 'Pending', 'In Review', 'Awaiting Info']

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<Priority, { label: string; cls: string }> = {
  HIGH:   { label: 'High',   cls: 'bg-red-100 text-red-700' },
  NORMAL: { label: 'Normal', cls: 'bg-blue-100 text-blue-700' },
  LOW:    { label: 'Low',    cls: 'bg-gray-100 text-gray-600' },
}
const TYPE_CLS: Record<QueueModule, string> = {
  Licensing:     'bg-purple-100 text-purple-700',
  'Type Approval':'bg-blue-100 text-blue-700',
  Complaints:    'bg-orange-100 text-orange-700',
}

function slaColor(v: number) {
  return v >= 90 ? '#22c55e' : v >= 75 ? '#f59e0b' : '#ef4444'
}
function uid() {
  return `RPT-2026-${String(Math.floor(Math.random() * 90000 + 10000))}`
}
function mockDl(file: string, name: string) {
  const blob = new Blob([`BOCRA Report: ${name}\n\nMock content for ${file}`], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = file; a.click()
  URL.revokeObjectURL(url)
}

// ─── Shared components ────────────────────────────────────────────────────────

function Bdg({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', className)}>
      {children}
    </span>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{children}</th>
}

function ActionBtn({ children, onClick, variant = 'default' }: { children: React.ReactNode; onClick?: () => void; variant?: 'default' | 'ghost' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50 focus-visible:ring-offset-1',
        variant === 'ghost'
          ? 'text-gray-500 border-gray-200 hover:bg-gray-100'
          : 'text-[#003580] border-[#003580]/30 hover:bg-[#003580] hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: 'blue' | 'green' | 'red' | 'amber'
}) {
  const colors = {
    blue:  { bg: 'bg-blue-50',  icon: 'text-blue-600',  val: 'text-blue-700' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', val: 'text-green-700' },
    red:   { bg: 'bg-red-50',   icon: 'text-red-600',   val: 'text-red-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', val: 'text-amber-700' },
  }
  const c = accent ? colors[accent] : { bg: 'bg-gray-50', icon: 'text-gray-500', val: 'text-gray-900' }
  return (
    <div className={cn('rounded-xl border border-gray-200 p-4 shadow-sm', 'bg-white')}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('size-9 rounded-lg flex items-center justify-center flex-none', c.bg)}>
          <Icon className={cn('size-4', c.icon)} />
        </div>
        <span className="text-xs font-medium text-gray-500 leading-tight">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', c.val)}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Tab 1: Review Queue ──────────────────────────────────────────────────────

function QueueTab() {
  const [modFilter, setModFilter] = useState<'All' | QueueModule>('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [officerFilter, setOfficerFilter] = useState('All')

  const filtered = useMemo(() =>
    QUEUE.filter((r) => {
      if (modFilter !== 'All' && r.type !== modFilter) return false
      if (officerFilter !== 'All' && r.officer !== officerFilter) return false
      return true
    }),
    [modFilter, officerFilter],
  )

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-end">
        {[
          { label: 'Module', value: modFilter,    options: QUEUE_MODULES,   set: setModFilter as (v: string) => void },
          { label: 'Status', value: statusFilter, options: QUEUE_STATUSES,  set: setStatusFilter },
          { label: 'Officer',value: officerFilter,options: OFFICERS,        set: setOfficerFilter },
        ].map(({ label, value, options, set }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <select
              value={value}
              onChange={(e) => set(e.target.value)}
              className="h-8 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 transition-colors appearance-none"
            >
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div className="ml-auto self-end">
          <span className="text-xs text-gray-400">{filtered.length} cases</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/60">
              <tr>
                <Th>Case / Application</Th>
                <Th>Type</Th>
                <Th>Applicant</Th>
                <Th>Submitted</Th>
                <Th>Days in Queue</Th>
                <Th>Priority</Th>
                <Th>Assigned To</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row) => (
                <tr key={row.id} className={cn('hover:bg-gray-50 transition-colors', row.days > 10 && 'bg-red-50/30')}>
                  <td className="px-4 py-3 font-mono text-xs text-[#003580] font-medium">{row.id}</td>
                  <td className="px-4 py-3"><Bdg className={TYPE_CLS[row.type]}>{row.type}</Bdg></td>
                  <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{row.applicant}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.submitted}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-semibold text-sm', row.days > 10 ? 'text-red-600' : row.days > 5 ? 'text-amber-600' : 'text-gray-700')}>
                      {row.days}d
                    </span>
                  </td>
                  <td className="px-4 py-3"><Bdg className={PRIORITY_CFG[row.priority].cls}>{PRIORITY_CFG[row.priority].label}</Bdg></td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    <span className={cn(row.officer === 'Unassigned' && 'text-gray-400 italic text-xs')}>
                      {row.officer}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <ActionBtn>Assign</ActionBtn>
                      <ActionBtn>Review</ActionBtn>
                      <ActionBtn variant="ghost">Request Info</ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: SLA Dashboard ─────────────────────────────────────────────────────

function SlaTab() {
  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users}         label="Total Open Cases"       value={53}    sub="Across all modules"   accent="blue" />
        <KpiCard icon={TrendingUp}    label="Meeting SLA"            value="86%"   sub="Target: 90%"          accent="amber" />
        <KpiCard icon={AlertTriangle} label="SLA Breached Today"     value={2}     sub="Requires escalation"  accent="red" />
        <KpiCard icon={Clock}         label="Avg Resolution Days"    value={18.4}  sub="vs 15 day target"     accent="blue" />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-sm mb-0.5">SLA Compliance by Module — March 2026</h3>
        <p className="text-xs text-gray-500 mb-4">% of cases resolved within SLA target time</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={SLA_DATA} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="module" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Compliance']} />
            <ReferenceLine y={90} stroke="#94a3b8" strokeDasharray="4 4" label="90%" />
            <Bar dataKey="compliance" radius={[5, 5, 0, 0]} maxBarSize={52}>
              {SLA_DATA.map((entry) => (
                <Cell key={entry.module} fill={slaColor(entry.compliance)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Urgent cases */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-600" />
          <h3 className="font-semibold text-red-800 text-sm">Cases Approaching SLA Breach (&lt; 48 hours)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <Th>Case</Th><Th>Type</Th><Th>Applicant</Th>
                <Th>SLA Deadline</Th><Th>Hours Remaining</Th><Th>Assigned Officer</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {URGENT.map((c) => (
                <tr key={c.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#003580] font-medium">{c.id}</td>
                  <td className="px-4 py-3"><Bdg className={TYPE_CLS[c.type]}>{c.type}</Bdg></td>
                  <td className="px-4 py-3 text-gray-700">{c.applicant}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{c.deadline}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-bold text-sm', c.hoursLeft <= 8 ? 'text-red-600' : c.hoursLeft <= 24 ? 'text-amber-600' : 'text-gray-700')}>
                      {c.hoursLeft}h
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(c.officer === 'Unassigned' && 'text-gray-400 italic text-xs', 'text-gray-600')}>
                      {c.officer}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 3: Reports ────────────────────────────────────────────────────────────

const REPORT_MODULES = ['All Modules', 'Licensing', 'Type Approval', 'Complaints', 'Spectrum', 'Domain Services']
const REPORT_RANGES  = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Year to Date']
const REPORT_TYPES   = ['Activity Summary', 'SLA Compliance Report', 'Revenue Report', 'Case Volume Report']

function ReportsTab() {
  const [range, setRange]       = useState(REPORT_RANGES[1])
  const [module, setModule]     = useState(REPORT_MODULES[0])
  const [rType, setRType]       = useState(REPORT_TYPES[0])
  const [generating, setGen]    = useState(false)
  const [reports, setReports]   = useState<GeneratedReport[]>(SEED_REPORTS)

  function generate() {
    setGen(true)
    setTimeout(() => {
      const name = `${rType} — ${module} — ${range}`
      setReports((prev) => [{
        id: uid(),
        name,
        module,
        generatedAt: 'Just now',
        size: `${Math.floor(Math.random() * 900 + 100)} KB`,
        file: `report-${Date.now()}.pdf`,
      }, ...prev])
      setGen(false)
    }, 1500)
  }

  return (
    <div className="space-y-5">
      {/* Filter + generate */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Filter className="size-4 text-[#003580]" />
          Generate a New Report
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          {[
            { label: 'Date Range',   value: range,  options: REPORT_RANGES,  set: setRange },
            { label: 'Module',       value: module, options: REPORT_MODULES, set: setModule },
            { label: 'Report Type',  value: rType,  options: REPORT_TYPES,   set: setRType },
          ].map(({ label, value, options, set }) => (
            <div key={label} className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 transition-colors appearance-none"
              >
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button
            onClick={generate}
            disabled={generating}
            aria-busy={generating}
            className="flex items-center gap-2 px-5 h-9 text-sm font-medium bg-[#003580] text-white rounded-lg hover:bg-[#002a6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50 focus-visible:ring-offset-1"
          >
            {generating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BarChart2 className="size-4" aria-hidden />}
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Recently Generated Reports</h3>
          <span className="text-xs text-gray-400">{reports.length} reports</span>
        </div>
        <ul className="divide-y divide-gray-50">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="size-9 rounded-lg bg-[#003580]/10 flex items-center justify-center flex-none">
                <FileText className="size-4 text-[#003580]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  <span className="font-mono">{r.id}</span>
                  <span>·</span>
                  <span>{r.generatedAt}</span>
                  <span>·</span>
                  <span>{r.size}</span>
                </p>
              </div>
              <button
                onClick={() => mockDl(r.file, r.name)}
                aria-label={`Download report: ${r.name}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50"
              >
                <Download className="size-3" aria-hidden />
                Download
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Tab 4: Master Data ────────────────────────────────────────────────────────

function AddEditBtn({ label = 'Edit' }: { label?: string }) {
  return (
    <button className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-500 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/40">
      {label === 'Edit' ? <Edit2 className="size-3" aria-hidden /> : <Plus className="size-3" aria-hidden />}
      {label}
    </button>
  )
}

function MasterDataTab() {
  return (
    <Tabs defaultValue="categories">
      <TabsList className="mb-4">
        {[
          { value: 'categories',  label: 'Complaint Categories' },
          { value: 'licences',    label: 'Licence Types' },
          { value: 'templates',   label: 'Notification Templates' },
          { value: 'operators',   label: 'Operators' },
        ].map(({ value, label }) => (
          <TabsTrigger key={value} value={value} className="text-xs px-3">{label}</TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="categories">
        <MasterTable
          addLabel="Add Category"
          headers={['ID', 'Category Name', 'Description', 'Actions']}
          rows={COMPLAINT_CATS.map((r) => [r.id, r.name, r.description])}
        />
      </TabsContent>

      <TabsContent value="licences">
        <MasterTable
          addLabel="Add Licence Type"
          headers={['Code', 'Name', 'Category', 'Application Fee', 'Actions']}
          rows={LICENCE_TYPES_DATA.map((r) => [r.code, r.name, r.category, r.fee])}
        />
      </TabsContent>

      <TabsContent value="templates">
        <MasterTable
          addLabel="Add Template"
          headers={['ID', 'Template Name', 'Trigger', 'Channels', 'Actions']}
          rows={NOTIF_TEMPLATES.map((r) => [r.id, r.name, r.trigger, r.channels])}
        />
      </TabsContent>

      <TabsContent value="operators">
        <MasterTable
          addLabel="Add Operator"
          headers={['Code', 'Operator Name', 'Type', 'Status', 'Actions']}
          rows={OPERATORS_DATA.map((r) => [r.code, r.name, r.type, r.status])}
        />
      </TabsContent>
    </Tabs>
  )
}

function MasterTable({
  headers,
  rows,
  addLabel,
}: {
  headers: string[]
  rows: (string | number)[][]
  addLabel: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{rows.length} records</span>
        <AddEditBtn label={addLabel} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60">
            <tr>{headers.map((h) => <Th key={h}>{h}</Th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-gray-700">{cell}</td>
                ))}
                <td className="px-4 py-3"><AddEditBtn /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TAB_TRIGGER = 'rounded-none h-11 px-5 text-sm flex-none after:bg-[#003580] data-active:text-[#003580] data-active:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003580]/40'

export default function AdminPage() {
  const { role } = useRoleStore()
  const router   = useRouter()

  useEffect(() => {
    if (role === 'applicant') {
      router.replace('/dashboard/home')
    }
  }, [role, router])

  if (role === 'applicant') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <Lock className="size-10 text-gray-200" />
        <p className="text-sm font-medium text-gray-400">Checking authorisation…</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Workflow &amp; Reporting</h1>
          <p className="text-sm text-gray-500 mt-1">
            Case management, SLA monitoring, report generation, and master data configuration.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#003580]/10 text-[#003580] rounded-full">
          <CheckCircle2 className="size-3.5" />
          Officer Access
        </span>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="queue">
        <TabsList
          variant="line"
          className="w-full h-auto rounded-none p-0 bg-transparent border-b border-gray-200 gap-0"
        >
          <TabsTrigger value="queue"   className={cn(TAB_TRIGGER, 'flex items-center gap-2')}>
            <RefreshCw className="size-3.5" />
            Review Queue
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 ml-0.5">
              {QUEUE.filter((q) => q.officer === 'Unassigned').length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="sla"    className={cn(TAB_TRIGGER, 'flex items-center gap-2')}>
            <TrendingUp className="size-3.5" />
            SLA Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports" className={cn(TAB_TRIGGER, 'flex items-center gap-2')}>
            <BarChart2 className="size-3.5" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="master" className={cn(TAB_TRIGGER, 'flex items-center gap-2')}>
            <Database className="size-3.5" />
            Master Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue"   className="pt-5"><QueueTab /></TabsContent>
        <TabsContent value="sla"     className="pt-5"><SlaTab /></TabsContent>
        <TabsContent value="reports" className="pt-5"><ReportsTab /></TabsContent>
        <TabsContent value="master"  className="pt-5"><MasterDataTab /></TabsContent>
      </Tabs>
    </div>
  )
}
