'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Clock,
  Download,
  FileText,
  Send,
  User,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Paperclip,
  Building2,
  MapPin,
  Tag,
  PhoneCall,
} from 'lucide-react'
import { useAppSelector } from '@/lib/store/hooks'
import { cn } from '@/lib/utils'
import type { ComplaintStatus } from '@/app/api/complaints/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string
  status: string
  date: string
  actor: string
  isSystem: boolean
  comment: string
}

interface CaseMessage {
  id: string
  author: string
  authorRole: 'complainant' | 'officer' | 'system'
  content: string
  timestamp: string
}

interface Attachment {
  id: string
  name: string
  size: string
  type: 'pdf' | 'image'
  uploadedAt: string
}

interface CaseDetail {
  id: string
  caseNumber: string
  subject: string
  description: string
  operator: string
  category: string
  status: ComplaintStatus
  submittedDate: string
  expectedResolution: string
  location: string
  reportedToProvider: boolean
  timeline: TimelineEvent[]
  messages: CaseMessage[]
  attachments: Attachment[]
  assignedOfficer: {
    name: string
    email: string
    department: string
    assignedDate: string
  } | null
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// TODO: Replace with GET /api/complaints/{id} → customerportal.bocra.org.bw/api/complaints/{caseNumber}
// TODO: Messages: GET /api/complaints/{id}/messages
// TODO: Send message: POST /api/complaints/{id}/messages

const MOCK_CASES: Record<string, CaseDetail> = {
  c01: {
    id: 'c01',
    caseNumber: 'CMP-2025-00841',
    subject: 'No network signal for 3 days in Gaborone West',
    description:
      'Since 18 March 2025, I have had no network signal at my home in Gaborone West, Plot 4312. The issue affects both voice calls and mobile data. I contacted Mascom on 18 March via their customer care line (111) and was given reference number MAS-2025-83941, but the issue remains unresolved after 3 days. My neighbours on the same street are experiencing the same problem. This is affecting my ability to work from home and receive emergency calls.',
    operator: 'Mascom Wireless',
    category: 'Network Coverage',
    status: 'ASSIGNED',
    submittedDate: '2025-03-18',
    expectedResolution: '2025-03-25',
    location: 'Gaborone West, Plot 4312',
    reportedToProvider: true,
    attachments: [
      { id: 'a1', name: 'mascom_reference_screenshot.pdf', size: '218 KB', type: 'pdf', uploadedAt: '2025-03-18' },
      { id: 'a2', name: 'no_signal_photo.jpg', size: '1.4 MB', type: 'image', uploadedAt: '2025-03-18' },
    ],
    timeline: [
      { id: 't1', status: 'Submitted', date: '2025-03-18 09:14', actor: 'System', isSystem: true, comment: 'Complaint received and assigned case number CMP-2025-00841.' },
      { id: 't2', status: 'Acknowledged', date: '2025-03-18 11:02', actor: 'System', isSystem: true, comment: 'Acknowledgement email sent to complainant.' },
      { id: 't3', status: 'Assigned', date: '2025-03-19 08:45', actor: 'Officer T. Kgosi', isSystem: false, comment: 'Case assigned to Officer Kgosi in the Network Quality team for investigation.' },
      { id: 't4', status: 'Under Review', date: '2025-03-20 14:30', actor: 'Officer T. Kgosi', isSystem: false, comment: 'Technical team contacted Mascom for infrastructure report on Gaborone West sector. Awaiting response.' },
    ],
    messages: [
      { id: 'm1', author: 'Portal User', authorRole: 'complainant', content: 'I submitted this complaint on 18 March. It has now been 3 days and I still have no signal. When can I expect a resolution?', timestamp: '2025-03-20 10:22' },
      { id: 'm2', author: 'Officer T. Kgosi', authorRole: 'officer', content: 'Thank you for your complaint. We have contacted Mascom\'s technical team and are awaiting a formal response on the infrastructure status in your area. We expect to receive their report by 22 March 2025. We will update you promptly once we have more information.', timestamp: '2025-03-20 15:10' },
      { id: 'm3', author: 'Portal User', authorRole: 'complainant', content: 'Thank you for the update. I will wait to hear from you by 22 March.', timestamp: '2025-03-20 15:45' },
    ],
    assignedOfficer: {
      name: 'Officer T. Kgosi',
      email: 't.kgosi@bocra.org.bw',
      department: 'Network Quality & Spectrum',
      assignedDate: '2025-03-19',
    },
  },
  c02: {
    id: 'c02',
    caseNumber: 'CMP-2025-00839',
    subject: 'Overcharged on data bundle — BWP 120 deducted incorrectly',
    description:
      'On 16 March 2025, BWP 120 was deducted from my account without authorisation. I had not subscribed to any new data bundle. My account balance dropped from BWP 185 to BWP 65. Orange customer care (121) told me it was for a "Monthly Premium Bundle" I never activated. I requested a reversal but was refused.',
    operator: 'Orange Botswana',
    category: 'Billing Dispute',
    status: 'PENDING',
    submittedDate: '2025-03-17',
    expectedResolution: '2025-03-24',
    location: 'Francistown',
    reportedToProvider: true,
    attachments: [
      { id: 'a1', name: 'account_statement_march.pdf', size: '156 KB', type: 'pdf', uploadedAt: '2025-03-17' },
    ],
    timeline: [
      { id: 't1', status: 'Submitted', date: '2025-03-17 13:05', actor: 'System', isSystem: true, comment: 'Complaint received and assigned case number CMP-2025-00839.' },
      { id: 't2', status: 'Acknowledged', date: '2025-03-17 13:06', actor: 'System', isSystem: true, comment: 'Acknowledgement email sent to complainant.' },
      { id: 't3', status: 'Assigned', date: '2025-03-18 09:00', actor: 'Officer B. Seretse', isSystem: false, comment: 'Case assigned to Consumer Protection team.' },
      { id: 't4', status: 'Pending', date: '2025-03-19 11:15', actor: 'Officer B. Seretse', isSystem: false, comment: 'Awaiting billing records from Orange Botswana. Formal request sent on 19 March.' },
    ],
    messages: [
      { id: 'm1', author: 'Portal User', authorRole: 'complainant', content: 'I have been waiting for an update. Has Orange responded yet?', timestamp: '2025-03-21 09:30' },
      { id: 'm2', author: 'Officer B. Seretse', authorRole: 'officer', content: 'We have sent a formal request to Orange Botswana for your billing records. They have 5 business days to respond under our regulations. We expect their response by 26 March. We will notify you immediately once we receive it.', timestamp: '2025-03-21 10:45' },
    ],
    assignedOfficer: {
      name: 'Officer B. Seretse',
      email: 'b.seretse@bocra.org.bw',
      department: 'Consumer Protection',
      assignedDate: '2025-03-18',
    },
  },
}

// Fallback for any other ID
const FALLBACK_CASE: CaseDetail = {
  id: 'c00',
  caseNumber: 'CMP-2025-00774',
  subject: 'Postal parcel lost in transit — tracking shows delivered',
  description: 'I sent a parcel from Gaborone to Maun on 25 February 2025. The tracking shows it was delivered on 2 March but the recipient never received it.',
  operator: 'Botswana Postal Services',
  category: 'Postal Services',
  status: 'NEW',
  submittedDate: '2025-03-05',
  expectedResolution: '2025-03-19',
  location: 'Maun',
  reportedToProvider: false,
  attachments: [],
  timeline: [
    { id: 't1', status: 'Submitted', date: '2025-03-05 11:22', actor: 'System', isSystem: true, comment: 'Complaint received and assigned case number CMP-2025-00774.' },
    { id: 't2', status: 'Acknowledged', date: '2025-03-05 11:23', actor: 'System', isSystem: true, comment: 'Acknowledgement email sent to complainant.' },
  ],
  messages: [],
  assignedOfficer: null,
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  NEW:       'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED:  'bg-amber-50 text-amber-700 border-amber-200',
  PENDING:   'bg-orange-50 text-orange-700 border-orange-200',
  RESOLVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  ESCALATED: 'bg-red-50 text-red-700 border-red-200',
  CLOSED:    'bg-gray-100 text-gray-500 border-gray-200',
}

function StatusBadge({ status, large }: { status: ComplaintStatus; large?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold tracking-wide',
        large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
        STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  )
}

// ─── SLA countdown ────────────────────────────────────────────────────────────

function SLAChip({ expectedDate, status }: { expectedDate: string; status: ComplaintStatus }) {
  if (status === 'RESOLVED' || status === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        Resolved
      </span>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expected = new Date(expectedDate)
  const diffDays = Math.ceil((expected.getTime() - today.getTime()) / 86_400_000)
  const overdue  = diffDays < 0
  const absDays  = Math.abs(diffDays)

  const style =
    overdue || diffDays <= 2
      ? 'bg-red-50 border-red-200 text-red-700'
      : diffDays <= 5
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700'

  const label = overdue
    ? `${absDays} day${absDays !== 1 ? 's' : ''} overdue`
    : diffDays === 0
    ? 'Due today'
    : `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium', style)}>
      <Clock className="w-4 h-4 shrink-0" />
      {label}
    </span>
  )
}

// ─── Case header card ─────────────────────────────────────────────────────────

function CaseHeader({ c }: { c: CaseDetail }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
              {c.caseNumber}
            </code>
            <StatusBadge status={c.status} large />
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{c.subject}</h1>
        </div>
        <SLAChip expectedDate={c.expectedResolution} status={c.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
        <span>
          <span className="font-medium text-gray-700">Submitted:</span>{' '}
          {c.submittedDate}
        </span>
        <span>
          <span className="font-medium text-gray-700">Expected resolution:</span>{' '}
          {c.expectedResolution}
        </span>
        <span>
          <span className="font-medium text-gray-700">Operator:</span>{' '}
          {c.operator}
        </span>
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const TIMELINE_STATUS_STYLES: Record<string, string> = {
  Submitted:   'bg-blue-100 text-blue-700',
  Acknowledged:'bg-sky-100 text-sky-700',
  Assigned:    'bg-amber-100 text-amber-700',
  'Under Review': 'bg-orange-100 text-orange-700',
  Pending:     'bg-orange-100 text-orange-700',
  Escalated:   'bg-red-100 text-red-700',
  Resolved:    'bg-emerald-100 text-emerald-700',
  Closed:      'bg-gray-100 text-gray-500',
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Case Timeline</h2>
      </div>

      <ol className="px-5 py-4 space-y-0">
        {events.map((event, idx) => (
          <li key={event.id} className="flex gap-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                  event.isSystem
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-[#003580]/10 border-[#003580]/30'
                )}
              >
                {event.isSystem
                  ? <Circle className="w-3.5 h-3.5 text-gray-400" />
                  : <User className="w-3.5 h-3.5 text-[#003580]" />
                }
              </div>
              {idx < events.length - 1 && (
                <div className="w-0.5 flex-1 min-h-[24px] bg-gray-100 my-1" />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6 flex-1 min-w-0', idx === events.length - 1 && 'pb-2')}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    TIMELINE_STATUS_STYLES[event.status] ?? 'bg-gray-100 text-gray-600'
                  )}
                >
                  {event.status}
                </span>
                <span className="text-xs text-gray-400">{event.date}</span>
                {!event.isSystem && (
                  <span className="text-xs font-medium text-gray-600">{event.actor}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{event.comment}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─── Messages ─────────────────────────────────────────────────────────────────

const AUTHOR_ROLE_STYLES = {
  complainant: { badge: 'bg-sky-50 text-sky-700',   dot: 'bg-sky-400',      label: 'Complainant' },
  officer:     { badge: 'bg-[#003580]/10 text-[#003580]', dot: 'bg-[#003580]', label: 'BOCRA Officer' },
  system:      { badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300',     label: 'System' },
}

function Messages({ initial }: { initial: CaseMessage[] }) {
  const [messages, setMessages]   = useState<CaseMessage[]>(initial)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]     = useState(false)

  const handleSend = async () => {
    const content = replyText.trim()
    if (!content) return
    setSending(true)

    // TODO: POST /api/complaints/{id}/messages → { content, authorId }
    await new Promise((r) => setTimeout(r, 400))

    const newMsg: CaseMessage = {
      id: `m${Date.now()}`,
      author: 'Portal User',
      authorRole: 'complainant',
      content,
      timestamp: new Date().toLocaleString('en-BW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }),
    }
    setMessages((prev) => [...prev, newMsg])
    setReplyText('')
    setSending(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Messages</h2>
      </div>

      {/* Message thread */}
      {messages.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No messages yet. Send a message below to communicate with the assigned officer.
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {messages.map((msg) => {
            const style = AUTHOR_ROLE_STYLES[msg.authorRole]
            return (
              <li key={msg.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-2 h-2 rounded-full', style.dot)} />
                  <span className="text-sm font-semibold text-gray-800">{msg.author}</span>
                  <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded', style.badge)}>
                    {style.label}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 shrink-0">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pl-4 border-l-2 border-gray-100">
                  {msg.content}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      {/* Reply box */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <textarea
          rows={3}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type a message to the assigned officer…"
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580]/40 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
          <button
            type="button"
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="flex items-center gap-2 px-4 py-2 bg-[#003580] text-white text-xs font-semibold rounded-lg hover:bg-[#002a6b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Case details card ────────────────────────────────────────────────────────

function DetailRow({ icon: Icon, label, children }: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <Icon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="text-sm text-gray-800 mt-0.5">{children}</div>
      </div>
    </div>
  )
}

function CaseDetailsCard({ c }: { c: CaseDetail }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Case Details</h2>
      </div>
      <div className="px-4 py-1">
        <DetailRow icon={Building2} label="Operator">{c.operator}</DetailRow>
        <DetailRow icon={Tag}       label="Category">{c.category}</DetailRow>
        <DetailRow icon={MapPin}    label="Location">{c.location}</DetailRow>
        <DetailRow icon={PhoneCall} label="Reported to provider first">
          {c.reportedToProvider ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              No
            </span>
          )}
        </DetailRow>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
        <p className="text-sm text-gray-700 leading-relaxed">{c.description}</p>
      </div>
    </div>
  )
}

// ─── Attachments card ─────────────────────────────────────────────────────────

// TODO: Attachment downloads → GET /api/complaints/{id}/attachments/{attachmentId}
function AttachmentsCard({ attachments }: { attachments: Attachment[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700">
          Attachments
          {attachments.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-gray-400">({attachments.length})</span>
          )}
        </h2>
      </div>

      {attachments.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-gray-400">No attachments submitted.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className={cn('w-4 h-4 shrink-0', att.type === 'pdf' ? 'text-red-400' : 'text-sky-400')} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{att.name}</p>
                <p className="text-[11px] text-gray-400">{att.size} · {att.uploadedAt}</p>
              </div>
              <button
                className="flex items-center gap-1 text-[11px] text-[#003580] font-medium hover:underline shrink-0"
                title="Download — TODO: wire to /api/complaints/{id}/attachments/{attachmentId}"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Officer info card ────────────────────────────────────────────────────────

function OfficerCard({ officer, assignedDate }: {
  officer: NonNullable<CaseDetail['assignedOfficer']>
  assignedDate: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Assigned Officer</h2>
      </div>
      <div className="px-4 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#003580]/10 border border-[#003580]/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-[#003580]">
            {officer.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{officer.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{officer.department}</p>
          <p className="text-xs text-gray-400 mt-0.5">{officer.email}</p>
          <p className="text-xs text-gray-400 mt-2">
            Assigned <span className="font-medium text-gray-600">{assignedDate}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const role = useAppSelector((s) => s.role.role)
  const isOfficer = role === 'officer' || role === 'admin'

  // TODO: Replace with useQuery → GET /api/complaints/${id}
  const caseData = MOCK_CASES[id] ?? FALLBACK_CASE

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Back button */}
      <Link
        href="/dashboard/complaints"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Complaints
      </Link>

      {/* Case header */}
      <CaseHeader c={caseData} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — timeline + messages */}
        <div className="lg:col-span-2 space-y-5">
          <Timeline events={caseData.timeline} />
          <Messages initial={caseData.messages} />
        </div>

        {/* Right — details, attachments, officer */}
        <div className="space-y-4">
          <CaseDetailsCard c={caseData} />
          <AttachmentsCard attachments={caseData.attachments} />
          {/* Officer card: always show to officer; show to complainant only if assigned */}
          {(isOfficer && caseData.assignedOfficer) && (
            <OfficerCard
              officer={caseData.assignedOfficer}
              assignedDate={caseData.assignedOfficer.assignedDate}
            />
          )}
          {(!isOfficer && caseData.assignedOfficer) && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Assigned Officer</p>
              <p className="text-sm font-semibold text-gray-700">{caseData.assignedOfficer.name}</p>
              <p className="text-xs text-gray-400">{caseData.assignedOfficer.department}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
