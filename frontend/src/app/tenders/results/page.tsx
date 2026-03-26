'use client'

import InnerPageLayout from '@/components/InnerPageLayout'
import { motion } from 'framer-motion'
import { Award, CalendarDays, FileCheck2, Scale, XCircle } from 'lucide-react'

const TENDERS_LINKS = [
  { label: 'Current Tenders', href: '/tenders' },
  { label: 'Tender Results', href: '/tenders/results', active: true },
]

const RESULTS = [
  {
    ref: 'BOCRA/TEN/2025/014',
    title: 'Procurement of Regional QoS Probe Equipment',
    outcome: 'Awarded',
    awardedTo: 'NetSight Africa Consortium',
    decisionDate: '18 February 2026',
    summary: 'Awarded following technical and financial evaluation for the supply, commissioning, and support of network quality probes across Botswana.',
  },
  {
    ref: 'BOCRA/TEN/2025/011',
    title: 'Consultancy for ICT Market Competition Study',
    outcome: 'Awarded',
    awardedTo: 'Kalahari Advisory Services',
    decisionDate: '29 January 2026',
    summary: 'Successful bidder appointed to conduct the sector competition analysis and provide regulatory recommendations.',
  },
  {
    ref: 'BOCRA/TEN/2025/009',
    title: 'Upgrade of Postal Licensing Records Digitization',
    outcome: 'Cancelled',
    awardedTo: 'No award made',
    decisionDate: '12 December 2025',
    summary: 'Procurement was cancelled after bids received did not meet the mandatory technical compliance requirements.',
  },
]

export default function TenderResultsPage() {
  return (
    <InnerPageLayout
      section="Procurement"
      title="Tender Results"
      breadcrumbs={[
        { label: 'Tenders', href: '/tenders' },
        { label: 'Tender Results', href: '/tenders/results' },
      ]}
      sidebarLinks={TENDERS_LINKS}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="text-gray-600 leading-relaxed">
            BOCRA publishes procurement outcomes to support transparency and public accountability. Award decisions
            are communicated after evaluation and internal approvals are complete, in line with applicable procurement
            rules and governance requirements.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">Awarded</p>
            <p className="mt-3 text-3xl font-black text-gray-900">2</p>
            <p className="mt-1 text-sm text-gray-500">Completed tenders with successful awards.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">Cancelled</p>
            <p className="mt-3 text-3xl font-black text-gray-900">1</p>
            <p className="mt-1 text-sm text-gray-500">Processes stopped or closed without award.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">Publication basis</p>
            <p className="mt-3 text-lg font-black text-gray-900">Evaluation complete</p>
            <p className="mt-1 text-sm text-gray-500">Results appear here after formal adjudication and approval.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#027ac6]" />
            <h2 className="text-xl font-black text-[#06193e]">Published Results ({RESULTS.length})</h2>
          </div>

          {RESULTS.map((result, index) => {
            const awarded = result.outcome === 'Awarded'

            return (
              <motion.div
                key={result.ref}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                          awarded
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        {awarded ? <Award className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {result.outcome}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                        <Scale className="h-3.5 w-3.5" />
                        Procurement Decision
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-[#06193e]">{result.title}</h3>
                  </div>
                  <p className="text-xs font-mono text-gray-400">{result.ref}</p>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-gray-500">{result.summary}</p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-[#f7fbff] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Outcome</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <FileCheck2 className="h-4 w-4 text-[#027ac6]" />
                      {result.awardedTo}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f7fbff] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Decision Date</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <CalendarDays className="h-4 w-4 text-[#027ac6]" />
                      {result.decisionDate}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </InnerPageLayout>
  )
}
