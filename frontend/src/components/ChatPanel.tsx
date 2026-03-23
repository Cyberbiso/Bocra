'use client'

import {
  COMPLAINT_FILE_INPUT_ACCEPT,
  COMPLAINT_FIELD_LABELS,
  EMPTY_COMPLAINT_DRAFT,
  formatComplaintFileSize,
  getComplaintAttachmentKey,
  hasComplaintDraftContent,
  isAllowedComplaintAttachment,
  listMissingComplaintFields,
  MAX_COMPLAINT_ATTACHMENTS,
  MAX_COMPLAINT_FILE_SIZE,
  normalizeComplaintDraft,
  type ComplaintAttachmentMeta,
  type ComplaintDraft,
  type ComplaintField,
} from '@/lib/complaints'
import { MessageLoading } from '@/components/ui/message-loading'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/stores/chat-store'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Fragment } from 'react'
import {
  Bot,
  Paperclip,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type Message = { id: string; role: 'user' | 'bot'; content: string }
type SubmittedComplaint = { id: string; status: string; attachmentCount: number }

const QUICK_PROMPTS = [
  'What services does BOCRA regulate?',
  'How do I contact BOCRA?',
  'How do I submit a complaint?',
]

const COMPLAINT_SUMMARY_FIELDS: ComplaintField[] = [
  'category',
  'operator',
  'subject',
  'name',
  'email',
  'phone',
  'consentGiven',
]

type MessageBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

function parseMessageBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = []
  const paragraphLines: string[] = []
  let listItems: string[] = []

  function flushParagraph() {
    if (!paragraphLines.length) return
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() })
    paragraphLines.length = 0
  }
  function flushList() {
    if (!listItems.length) return
    blocks.push({ type: 'list', items: [...listItems] })
    listItems = []
  }

  for (const rawLine of content.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim()
    if (!line) { flushParagraph(); flushList(); continue }
    if (/^[-*]\s+/.test(line)) { flushParagraph(); listItems.push(line.replace(/^[-*]\s+/, '').trim()); continue }
    flushList()
    paragraphLines.push(line)
  }
  flushParagraph(); flushList()
  return blocks.length > 0 ? blocks : [{ type: 'paragraph', text: content }]
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>
  )
}

function FormattedMsg({ content, role }: { content: string; role: Message['role'] }) {
  const blocks = parseMessageBlocks(content)
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === 'list' ? (
          <ul key={i} className={cn('space-y-1 pl-5 list-disc', role === 'user' ? 'marker:text-white/80' : 'marker:text-[#027ac6]')}>
            {b.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-wrap">{renderInline(b.text)}</p>
        )
      )}
    </div>
  )
}

function formatComplaintValue(field: ComplaintField, draft: ComplaintDraft) {
  if (field === 'consentGiven') return draft.consentGiven ? 'Given' : ''
  if (field === 'category') return draft.category ? draft.category.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') : ''
  return draft[field]
}

function isComplaintField(v: unknown): v is ComplaintField {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(COMPLAINT_FIELD_LABELS, v)
}

function getAttachmentMeta(files: File[]): ComplaintAttachmentMeta[] {
  return files.map(f => ({ name: f.name, size: f.size, type: f.type || 'application/octet-stream' }))
}

const PANEL_VARIANTS: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 280 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.22 } },
}

const MSG_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
}

export function ChatPanel() {
  const pathname = usePathname()
  const { isOpen, close } = useChatStore()

  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', content: 'Dumela. I am the BOCRA smart assistant. Ask me about licensing, complaints, tariffs, or BOCRA services and I will guide you.' },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [complaintDraft, setComplaintDraft] = useState<ComplaintDraft>(EMPTY_COMPLAINT_DRAFT)
  const [complaintFlowActive, setComplaintFlowActive] = useState(false)
  const [complaintMissingFields, setComplaintMissingFields] = useState<ComplaintField[]>([])
  const [complaintReadyToSubmit, setComplaintReadyToSubmit] = useState(false)
  const [submittedComplaint, setSubmittedComplaint] = useState<SubmittedComplaint | null>(null)
  const [chatAttachments, setChatAttachments] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasUserMessages = messages.some(m => m.role === 'user')
  const effectiveFlowActive = complaintFlowActive || chatAttachments.length > 0
  const effectiveMissingFields = effectiveFlowActive
    ? complaintMissingFields.length > 0 ? complaintMissingFields : listMissingComplaintFields(complaintDraft)
    : []
  const readyForSubmit =
    (complaintReadyToSubmit || effectiveMissingFields.length === 0) &&
    (effectiveFlowActive || hasComplaintDraftContent(complaintDraft))
  const progress = Math.round(
    ((COMPLAINT_SUMMARY_FIELDS.length - effectiveMissingFields.length) / COMPLAINT_SUMMARY_FIELDS.length) * 100
  )
  const capturedItems = COMPLAINT_SUMMARY_FIELDS.map(f => ({
    label: COMPLAINT_FIELD_LABELS[f],
    value: formatComplaintValue(f, complaintDraft),
  })).filter(i => Boolean(i.value))
  const missingPreview = effectiveMissingFields.slice(0, 3)
  const showQuickPrompts = !hasUserMessages && input.trim().length === 0 && chatAttachments.length === 0
  const showComplaintCard =
    effectiveFlowActive || hasComplaintDraftContent(complaintDraft) || submittedComplaint !== null || chatAttachments.length > 0

  useEffect(() => {
    if (!scrollRef.current || !isOpen) return
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading, isOpen])

  if (pathname.startsWith('/dashboard')) return null

  function handleAttachmentChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    const next = [...chatAttachments]
    const errors: string[] = []
    for (const file of selected) {
      if (!isAllowedComplaintAttachment(file)) { errors.push(`${file.name} is not a supported type.`); continue }
      if (file.size > MAX_COMPLAINT_FILE_SIZE) { errors.push(`${file.name} exceeds 10 MB.`); continue }
      if (next.some(f => getComplaintAttachmentKey(f) === getComplaintAttachmentKey(file))) continue
      if (next.length >= MAX_COMPLAINT_ATTACHMENTS) { errors.push(`Max ${MAX_COMPLAINT_ATTACHMENTS} files.`); break }
      next.push(file)
    }
    setChatAttachments(next)
    setAttachmentError(errors.join(' '))
    setComplaintFlowActive(true)
    setComplaintMissingFields(listMissingComplaintFields(complaintDraft))
    setSubmittedComplaint(null)
    e.target.value = ''
  }

  function removeAttachment(file: File) {
    const next = chatAttachments.filter(f => getComplaintAttachmentKey(f) !== getComplaintAttachmentKey(file))
    setChatAttachments(next)
    if (!next.length && !hasComplaintDraftContent(complaintDraft)) {
      setComplaintFlowActive(false); setComplaintMissingFields([]); setComplaintReadyToSubmit(false)
    }
    setAttachmentError('')
  }

  async function submitComplaint(draft: ComplaintDraft) {
    const fd = new FormData()
    fd.append('category', draft.category); fd.append('operator', draft.operator)
    fd.append('subject', draft.subject); fd.append('description', draft.description)
    fd.append('incidentDate', draft.incidentDate); fd.append('name', draft.name)
    fd.append('email', draft.email); fd.append('phone', draft.phone)
    fd.append('consentGiven', String(draft.consentGiven))
    chatAttachments.forEach(f => fd.append('attachments', f))

    const res = await fetch('/api/complaints', { method: 'POST', body: fd })
    const payload = await res.json().catch(() => null) as { error?: string; id?: string; status?: string; attachments?: ComplaintAttachmentMeta[] } | null
    if (!res.ok) throw new Error(payload?.error || 'Could not submit complaint. Please try again.')
    const submitted = { id: payload?.id || 'BCR-PENDING', status: payload?.status || 'Received', attachmentCount: Array.isArray(payload?.attachments) ? payload.attachments.length : chatAttachments.length }
    setSubmittedComplaint(submitted)
    setComplaintDraft(EMPTY_COMPLAINT_DRAFT); setComplaintFlowActive(false)
    setComplaintMissingFields([]); setComplaintReadyToSubmit(false)
    setChatAttachments([]); setAttachmentError('')
    setMessages(p => [...p, { id: `${Date.now()}-submitted`, role: 'bot', content: [`Your complaint has been submitted.`, ``, `- **Reference Number:** ${submitted.id}`, `- **Status:** ${submitted.status}`, `- **Supporting Files:** ${submitted.attachmentCount}`].join('\n') }])
  }

  async function sendMessage(raw?: string) {
    const typed = (raw ?? input).trim()
    const attachMsg = chatAttachments.length ? ['I have attached supporting evidence for my complaint.', '', ...chatAttachments.map(f => `- ${f.name}`)].join('\n') : ''
    const content = typed || attachMsg
    const reqMsg = typed || 'I have attached supporting evidence for my complaint.'
    if (!content || isLoading) return

    const userMsg: Message = { id: `${Date.now()}-user`, role: 'user', content }
    setSubmittedComplaint(null)
    setMessages(p => [...p, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const history = [...messages, userMsg].map(({ role, content: c }) => ({ role, content: c }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reqMsg, history, complaintDraft, attachments: getAttachmentMeta(chatAttachments) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(err?.error || 'Failed to fetch response')
      }
      const data = await res.json()
      const reply = typeof data?.reply === 'string' && data.reply.trim() ? data.reply : 'I could not generate a response. Please try again.'
      const nextDraft = normalizeComplaintDraft(data?.complaintDraft ?? EMPTY_COMPLAINT_DRAFT)
      const nextFlow = Boolean(data?.complaintFlowActive)
      const nextMissing = Array.isArray(data?.missingFields) ? data.missingFields.filter(isComplaintField) : []
      setMessages(p => [...p, { id: `${Date.now()}-bot`, role: 'bot', content: reply }])
      setComplaintDraft(nextDraft); setComplaintFlowActive(nextFlow)
      setComplaintMissingFields(nextMissing); setComplaintReadyToSubmit(Boolean(data?.readyToSubmit))
      if (data?.shouldSubmitComplaint) await submitComplaint(nextDraft)
    } catch (err) {
      setMessages(p => [...p, { id: `${Date.now()}-err`, role: 'bot', content: err instanceof Error ? err.message : 'Network error. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); void sendMessage() }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.aside
            key="chat-panel"
            variants={PANEL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[26rem] flex flex-col bg-white shadow-2xl shadow-gray-900/20 border-l border-gray-200"
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(117,170,219,0.45),transparent_42%),linear-gradient(135deg,rgba(6,25,62,0.98),rgba(2,122,198,0.95))] p-5 text-white shrink-0">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#D4921A]/15 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-white/15 bg-white/12 shadow-lg backdrop-blur-md">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold tracking-tight">BOCRA Assistant</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/16 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200/70 mt-0.5">Regulatory guidance & complaints</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/90 transition-colors hover:bg-white/20"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-[11px] text-blue-50/90 w-fit">
                <ShieldCheck className="h-3.5 w-3.5" />
                BOCRA guidance
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto flex flex-col gap-4 bg-[linear-gradient(180deg,rgba(250,252,255,0.98),rgba(237,245,255,0.80))] px-4 py-5"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                const isWelcome = msg.id === 'welcome' && !isUser
                return (
                  <motion.div
                    key={msg.id}
                    variants={MSG_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    className={cn('flex gap-3', isUser ? 'flex-row-reverse items-end' : 'flex-col items-start')}
                  >
                    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse items-end' : 'items-end')}>
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm',
                        isUser ? 'border-slate-200 bg-white' : 'border-[#75AADB]/20 bg-white'
                      )}>
                        {isUser ? <User className="h-4 w-4 text-[#027ac6]" /> : <Bot className="h-4 w-4 text-[#06193e]" />}
                      </div>
                      <div className={cn(
                        'max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                        isUser
                          ? 'bg-[#027ac6] text-white rounded-br-md'
                          : 'border border-slate-200/80 bg-white/92 text-slate-700 rounded-bl-md'
                      )}>
                        <FormattedMsg content={msg.content} role={msg.role} />
                      </div>
                    </div>
                    {isWelcome && showQuickPrompts && (
                      <div className="ml-12 flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => void sendMessage(p)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#75AADB] hover:bg-[#75AADB]/10 hover:text-[#06193e]"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#75AADB]/20 bg-white shadow-sm">
                    <Bot className="h-4 w-4 text-[#06193e]" />
                  </div>
                  <div className="rounded-3xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-[#027ac6] shadow-sm">
                    <MessageLoading />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200/70 bg-white/95 p-4 shrink-0 backdrop-blur-xl">
              {showComplaintCard && (
                <div className={cn(
                  'mb-4 rounded-[1.2rem] border px-4 py-3 shadow-sm',
                  submittedComplaint ? 'border-emerald-200 bg-emerald-50/80' : 'border-[#75AADB]/20 bg-white/92'
                )}>
                  {submittedComplaint ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Complaint Submitted</p>
                      <p className="text-lg font-black tracking-wide text-[#06193e]">{submittedComplaint.id}</p>
                      <p className="text-xs text-emerald-700">Status: {submittedComplaint.status}</p>
                      {submittedComplaint.attachmentCount > 0 && (
                        <p className="text-xs text-emerald-700">Supporting files: {submittedComplaint.attachmentCount}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#027ac6]">Complaint Intake</p>
                          <p className="mt-1 text-sm font-semibold text-[#06193e]">
                            {readyForSubmit ? 'Everything needed is ready' : `${COMPLAINT_SUMMARY_FIELDS.length - effectiveMissingFields.length}/${COMPLAINT_SUMMARY_FIELDS.length} details captured`}
                          </p>
                        </div>
                        {readyForSubmit && (
                          <button
                            type="button"
                            onClick={() => void sendMessage('Please submit my complaint now.')}
                            disabled={isLoading}
                            className="shrink-0 rounded-full bg-[#06193e] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#027ac6] disabled:opacity-50"
                          >
                            Submit
                          </button>
                        )}
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-linear-to-r from-[#06193e] to-[#027ac6] transition-all" style={{ width: `${Math.max(10, progress)}%` }} />
                      </div>
                      {capturedItems.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {capturedItems.map(item => (
                            <div key={item.label} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                              <span className="text-slate-400">{item.label}:</span>
                              <span className="max-w-[8rem] truncate font-semibold text-[#06193e]">{item.value}</span>
                            </div>
                          ))}
                          {chatAttachments.length > 0 && (
                            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                              <span className="text-slate-400">Files:</span>
                              <span className="font-semibold text-[#06193e]">{chatAttachments.length} attached</span>
                            </div>
                          )}
                        </div>
                      )}
                      {!readyForSubmit && effectiveMissingFields.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {missingPreview.map(f => (
                            <span key={f} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">{COMPLAINT_FIELD_LABELS[f]}</span>
                          ))}
                          {effectiveMissingFields.length > missingPreview.length && (
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">+{effectiveMissingFields.length - missingPreview.length} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {chatAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {chatAttachments.map(f => (
                    <div key={getComplaintAttachmentKey(f)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <span className="max-w-[9rem] truncate text-[11px] font-medium text-slate-600">{f.name}</span>
                      <span className="text-[10px] text-slate-400">{formatComplaintFileSize(f.size)}</span>
                      <button type="button" onClick={() => removeAttachment(f)} className="text-slate-400 hover:text-red-500" aria-label={`Remove ${f.name}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {attachmentError && <p className="mb-3 text-xs font-medium text-red-600">{attachmentError}</p>}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" className="hidden" accept={COMPLAINT_FILE_INPUT_ACCEPT} multiple onChange={handleAttachmentChange} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || chatAttachments.length >= MAX_COMPLAINT_ATTACHMENTS}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors',
                    isLoading || chatAttachments.length >= MAX_COMPLAINT_ATTACHMENTS ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#027ac6]/40 hover:text-[#027ac6]'
                  )}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={effectiveFlowActive ? 'Next complaint detail…' : 'Ask BOCRA anything…'}
                  className="h-11 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#027ac6]/40 focus:bg-white focus:ring-4 focus:ring-[#027ac6]/10"
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && !chatAttachments.length) || isLoading}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition-all',
                    (!input.trim() && !chatAttachments.length) || isLoading ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed' : 'bg-[#06193e] hover:-translate-y-0.5 hover:bg-[#027ac6]'
                  )}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <p className="mt-3 text-center text-[11px] text-slate-400">Powered by AfroNative Solutions</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
