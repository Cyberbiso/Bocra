'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Bot,
  Sparkles,
  ShieldCheck,
  MessageSquareWarning,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { useChatStore } from '@/lib/stores/chat-store'

const WORKFLOWS = [
  {
    title: 'Type Approval',
    description: 'Ask for application details, review steps, accreditation checks, and certificate guidance.',
    href: '/dashboard/type-approval',
    icon: ShieldCheck,
  },
  {
    title: 'Complaints',
    description: 'Get help with complaint status, next actions, and supporting information for investigations.',
    href: '/dashboard/complaints',
    icon: MessageSquareWarning,
  },
  {
    title: 'Licensing and Documents',
    description: 'Use the assistant to locate forms, requirements, invoices, and related portal records faster.',
    href: '/dashboard/documents',
    icon: FileText,
  },
]

const STARTERS = [
  'Show my type approval queue and open the first pending application.',
  'List unpaid invoices linked to my applications.',
  'Help me review a complaint that needs officer attention.',
]

export default function DashboardAgentPage() {
  const open = useChatStore((state) => state.open)

  useEffect(() => {
    open()
  }, [open])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-[#d9e6ff] bg-linear-to-br from-[#0b2f6d] via-[#003580] to-[#0b63ce] text-white shadow-sm">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.5fr_1fr] md:px-8 md:py-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <Bot className="h-3.5 w-3.5" />
              BOCRA Copilot
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                Conversational help for BOCRA portal workflows
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
                The assistant panel opens automatically on this page. You can ask it to guide you through
                applications, look up records, summarize workflow status, and help you move to the next step.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={open}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#003580] transition-colors hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4" />
                Open chat panel
              </button>
              <Link
                href="/dashboard/home"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Return to dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Try asking</p>
            <div className="mt-4 space-y-3">
              {STARTERS.map((prompt) => (
                <div key={prompt} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-white/90">
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {WORKFLOWS.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#b7cff7] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#003580]">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[#003580]" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
