'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, Paperclip, Trash2, Plus, Bot, Menu,
  BookOpen, MessageSquare, ExternalLink, X, Loader2,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/stores/chat-store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionCard {
  label: string
  href: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachmentName?: string
  citations?: string[]
  actionCard?: ActionCard | null
  actionDismissed?: boolean
  streaming?: boolean
}

interface Thread {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'What documents do I need for type approval?',
  'How do I file a complaint about my network?',
  'What is the difference between a licence and a type approval?',
  'How do I register a .bw domain?',
  'Which network has the best coverage in Gaborone?',
]

const INIT_ID = 'thread-0'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function extractCitations(text: string): string[] {
  const found: string[] = []
  const re =
    /(?:According to|As per|Under|Per) (?:the )?([^,.!?\n]+?(?:Guidelines|Act|Regulations|Policy|Framework|Directive|Standard|Manual|Section|\d{4})[^,.!?\n]*)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[1]) found.push(m[1].trim())
  }
  return [...new Set(found)].slice(0, 3)
}

function detectActionCard(text: string): ActionCard | null {
  if (/(file|submit|lodge|raise).{0,30}complaint|complaint.{0,30}(file|submit|lodge)/i.test(text)) {
    return { label: 'Would you like me to help you file a complaint?', href: '/dashboard/complaints' }
  }
  if (/type approval/i.test(text) && /apply|application|process/i.test(text)) {
    return { label: 'Would you like to start a Type Approval application?', href: '/dashboard/type-approval/apply' }
  }
  if (/licen[sc]e/i.test(text) && /apply|application|how to get/i.test(text)) {
    return { label: 'Would you like to apply for a licence?', href: '/dashboard/licensing/apply' }
  }
  return null
}

function relativeTime(ts: number): string {
  const d = Date.now() - ts
  if (d < 60_000) return 'just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

// ─── Inline markdown ──────────────────────────────────────────────────────────

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let listBuf: string[] = []
  let ordered = false

  function flushList() {
    if (!listBuf.length) return
    const Tag = ordered ? 'ol' : 'ul'
    nodes.push(
      <Tag key={nodes.length} className={cn('my-1.5 pl-5 space-y-0.5', ordered ? 'list-decimal' : 'list-disc')}>
        {listBuf.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed"><InlineText text={item} /></li>
        ))}
      </Tag>,
    )
    listBuf = []
  }

  for (const raw of lines) {
    const ulM = raw.match(/^[-•*] (.+)/)
    const olM = raw.match(/^\d+\. (.+)/)
    const hM = raw.match(/^#{1,3} (.+)/)
    if (ulM) { if (listBuf.length && ordered) flushList(); ordered = false; listBuf.push(ulM[1]) }
    else if (olM) { if (listBuf.length && !ordered) flushList(); ordered = true; listBuf.push(olM[1]) }
    else {
      flushList()
      if (hM) nodes.push(<p key={nodes.length} className="font-semibold text-gray-900 mt-3 mb-1 text-sm"><InlineText text={hM[1]} /></p>)
      else if (raw.trim() === '') { if (nodes.length > 0) nodes.push(<div key={nodes.length} className="h-1.5" />) }
      else nodes.push(<p key={nodes.length} className="text-sm leading-relaxed"><InlineText text={raw} /></p>)
    }
  }
  flushList()
  return <div className="space-y-0.5">{nodes}</div>
}

// ─── Thread list ──────────────────────────────────────────────────────────────

function ThreadList({
  threads, activeId, onSelect, onNew,
}: {
  threads: Thread[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 shrink-0">
        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-[#003580]" />
          Conversations
        </span>
        <button
          onClick={onNew}
          aria-label="New conversation"
          className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-[#003580] transition-colors"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            aria-current={t.id === activeId ? 'true' : undefined}
            className={cn(
              'w-full text-left px-3 py-2 border-l-2 transition-colors text-xs',
              t.id === activeId
                ? 'border-[#003580] bg-blue-50 text-gray-900'
                : 'border-transparent hover:bg-gray-100 text-gray-500',
            )}
          >
            <p className="font-medium truncate leading-tight">{t.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(t.createdAt)}</p>
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function DashboardChatPanel() {
  const { isOpen, close } = useChatStore()
  const router = useRouter()

  const [threads, setThreads] = useState<Thread[]>([
    { id: INIT_ID, title: 'New Conversation', messages: [], createdAt: Date.now() },
  ])
  const [activeId, setActiveId] = useState(INIT_ID)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<string | null>(null)
  const [showMobileThreads, setShowMobileThreads] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0]

  function updateThread(id: string, updater: (t: Thread) => Thread) {
    setThreads((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread.messages, isOpen])

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus()
  }, [activeId, isOpen])

  function handleNewThread() {
    const t: Thread = { id: uid(), title: 'New Conversation', messages: [], createdAt: Date.now() }
    setThreads((prev) => [t, ...prev])
    setActiveId(t.id)
    setInput('')
    setError(null)
    setPendingFile(null)
  }

  function handleClear() {
    updateThread(activeId, (t) => ({ ...t, title: 'New Conversation', messages: [] }))
    setInput('')
    setError(null)
    setPendingFile(null)
  }

  function dismissActionCard(msgId: string) {
    updateThread(activeId, (t) => ({
      ...t,
      messages: t.messages.map((m) => m.id === msgId ? { ...m, actionDismissed: true } : m),
    }))
  }

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const attach = pendingFile
    setInput('')
    setError(null)
    setPendingFile(null)
    setTimeout(() => { if (textareaRef.current) textareaRef.current.style.height = 'auto' }, 0)

    const userMsgId = uid()
    const asstMsgId = uid()
    const capturedId = activeId
    const currentMessages = activeThread.messages

    const userMsg: Message = {
      id: userMsgId, role: 'user', content: trimmed,
      ...(attach ? { attachmentName: attach } : {}),
    }
    const asstMsg: Message = { id: asstMsgId, role: 'assistant', content: '', streaming: true }

    const apiMessages = [...currentMessages, userMsg].map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== capturedId) return t
        return {
          ...t,
          title: t.messages.length === 0 ? trimmed.slice(0, 50) + (trimmed.length > 50 ? '…' : '') : t.title,
          messages: [...t.messages, userMsg, asstMsg],
        }
      }),
    )

    setLoading(true)
    try {
      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, threadId: capturedId }),
      })

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Request failed' })) as { error?: string }
        throw new Error(errData.error ?? `Request failed (${resp.status})`)
      }

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snap = accumulated
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== capturedId) return t
            return { ...t, messages: t.messages.map((m) => m.id === asstMsgId ? { ...m, content: snap } : m) }
          }),
        )
      }

      const citations = extractCitations(accumulated)
      const actionCard = detectActionCard(accumulated)
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== capturedId) return t
          return { ...t, messages: t.messages.map((m) => m.id === asstMsgId ? { ...m, streaming: false, citations, actionCard } : m) }
        }),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== capturedId) return t
          return { ...t, messages: t.messages.filter((m) => m.id !== asstMsgId) }
        }),
      )
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="dash-chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.aside
            key="dash-chat-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[700px] flex flex-col bg-white shadow-2xl border-l border-gray-200 overflow-hidden"
          >
            {/* Panel header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 shrink-0 bg-[#003580]">
              <div className="flex items-center gap-2.5">
                {/* Mobile: show thread list toggle */}
                <button
                  onClick={() => setShowMobileThreads(true)}
                  aria-label="Show conversations"
                  className="sm:hidden p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <Menu className="size-4" />
                </button>
                <div className="size-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                  <Bot className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">BOCRA AI Copilot</p>
                  <p className="text-[10px] text-white/50 leading-tight">{activeThread.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  aria-label="Clear conversation"
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button
                  onClick={close}
                  aria-label="Close assistant"
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Body: thread list + chat */}
            <div className="flex flex-1 overflow-hidden">
              {/* Desktop thread list */}
              <aside className="hidden sm:flex flex-col w-[220px] shrink-0 border-r border-gray-200 bg-gray-50 overflow-hidden">
                <ThreadList
                  threads={threads}
                  activeId={activeId}
                  onSelect={(id) => { setActiveId(id); setError(null) }}
                  onNew={handleNewThread}
                />
              </aside>

              {/* Mobile thread drawer */}
              {showMobileThreads && (
                <div className="sm:hidden fixed inset-0 z-50 flex">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileThreads(false)} />
                  <aside className="relative w-64 flex flex-col bg-gray-50 border-r border-gray-200 shadow-2xl">
                    <ThreadList
                      threads={threads}
                      activeId={activeId}
                      onSelect={(id) => { setActiveId(id); setError(null); setShowMobileThreads(false) }}
                      onNew={() => { handleNewThread(); setShowMobileThreads(false) }}
                    />
                  </aside>
                </div>
              )}

              {/* Chat area */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {activeThread.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                      <div>
                        <div className="size-12 rounded-full bg-[#003580]/10 flex items-center justify-center mx-auto mb-3">
                          <Bot className="size-6 text-[#003580]" />
                        </div>
                        <h2 className="font-semibold text-gray-900 text-sm">BOCRA AI Copilot</h2>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs">
                          Ask me anything about BOCRA&apos;s regulatory services, licensing, type approvals, or complaints.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 max-w-md">
                        {SUGGESTED_PROMPTS.map((p) => (
                          <button
                            key={p}
                            onClick={() => void sendMessage(p)}
                            className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600 hover:border-[#003580] hover:text-[#003580] hover:bg-blue-50 transition-colors shadow-sm"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    activeThread.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                      >
                        {msg.role === 'assistant' && (
                          <div className="size-6 rounded-full bg-[#003580] flex items-center justify-center flex-none mt-0.5">
                            <Bot className="size-3 text-white" />
                          </div>
                        )}

                        <div className={cn('flex flex-col gap-2 max-w-[78%]', msg.role === 'user' ? 'items-end' : 'items-start')}>
                          {msg.role === 'user' ? (
                            <div className="bg-[#003580] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                              {msg.content}
                              {msg.attachmentName && (
                                <p className="mt-1.5 text-xs text-blue-200 flex items-center gap-1">
                                  <Paperclip className="size-3" />{msg.attachmentName}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                              {msg.streaming && msg.content === '' ? (
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm py-0.5">
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Thinking…
                                </div>
                              ) : (
                                <MarkdownContent content={msg.content} />
                              )}
                              {msg.streaming && msg.content !== '' && (
                                <span className="inline-block w-1 h-3.5 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                              )}
                            </div>
                          )}

                          {!msg.streaming && msg.citations && msg.citations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map((c) => (
                                <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-blue-50 text-[#003580] rounded-full border border-blue-200">
                                  <BookOpen className="size-2.5" />{c}
                                </span>
                              ))}
                            </div>
                          )}

                          {!msg.streaming && msg.actionCard && !msg.actionDismissed && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 w-full">
                              <p className="text-sm font-medium text-gray-800 mb-2.5">{msg.actionCard.label}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => router.push(msg.actionCard!.href)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#003580] text-white rounded-lg hover:bg-[#002a6e] transition-colors font-medium"
                                >
                                  <ExternalLink className="size-3" />
                                  Yes, take me there
                                </button>
                                <button
                                  onClick={() => dismissActionCard(msg.id)}
                                  className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  No thanks
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {msg.role === 'user' && (
                          <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center flex-none mt-0.5 text-[10px] font-semibold text-gray-600">
                            U
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {error && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                      <X className="size-4 flex-none mt-0.5 text-red-500" /><span>{error}</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="border-t border-gray-200 bg-white px-4 py-3 shrink-0">
                  {pendingFile && (
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-600 bg-gray-100 rounded-md px-2.5 py-1.5 w-fit">
                      <Paperclip className="size-3 text-gray-500" />
                      <span className="max-w-[180px] truncate">{pendingFile}</span>
                      <button onClick={() => setPendingFile(null)} aria-label="Remove attachment" className="text-gray-400 hover:text-red-500 ml-1">
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Attach file"
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-[#003580] rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex-none"
                    >
                      <Paperclip className="size-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) setPendingFile(f.name)
                        e.target.value = ''
                      }}
                    />
                    <label htmlFor="dash-agent-input" className="sr-only">Message to BOCRA AI Copilot</label>
                    <textarea
                      id="dash-agent-input"
                      ref={textareaRef}
                      value={input}
                      rows={1}
                      disabled={loading}
                      placeholder="Ask BOCRA AI Copilot… (Shift+Enter for new line)"
                      className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 disabled:opacity-60 transition-colors leading-relaxed"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                      onChange={(e) => { setInput(e.target.value); resizeTextarea() }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void sendMessage(input)
                        }
                      }}
                    />
                    <button
                      onClick={() => void sendMessage(input)}
                      aria-label={loading ? 'Sending' : 'Send'}
                      disabled={loading || !input.trim()}
                      className="p-2.5 bg-[#003580] text-white rounded-xl hover:bg-[#002a6e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-none"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
