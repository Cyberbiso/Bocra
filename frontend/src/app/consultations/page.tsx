"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { MessageSquare, Clock, CheckCircle2, FileText, ExternalLink, ChevronRight } from "lucide-react";

const CONSULTATIONS_LINKS = [
  { label: "All Consultations", href: "/consultations", active: true },
  { label: "Open for Comment", href: "/consultations#open" },
  { label: "Closed", href: "/consultations#closed" },
  { label: "Documents", href: "/documents" },
];

const OPEN_CONSULTATIONS = [
  {
    id: "qos-2026",
    title: "Draft QoS Monitoring Regulations 2026",
    category: "Technical Regulation",
    categoryColor: "bg-[#1B75BB]/10 text-[#1B75BB]",
    opened: "1 March 2026",
    closes: "15 April 2026",
    desc: "BOCRA invites public comment on proposed Quality of Service monitoring regulations for licensed telecommunications operators, covering minimum performance thresholds and reporting obligations.",
    href: "https://www.bocra.org.bw",
  },
  {
    id: "spectrum-2026",
    title: "National Radio Frequency Plan — Proposed Revisions",
    category: "Spectrum Management",
    categoryColor: "bg-[#1C6B3C]/10 text-[#1C6B3C]",
    opened: "20 February 2026",
    closes: "31 March 2026",
    desc: "Proposed amendments to the National Radio Frequency Plan to accommodate emerging technologies including 5G NR, satellite broadband (LEO), and IoT frequency allocations.",
    href: "https://www.bocra.org.bw",
  },
  {
    id: "ita-radio-2026",
    title: "ITA Commercial Broadcasting Radio Licence — Invitation to Apply",
    category: "Licensing",
    categoryColor: "bg-violet-100 text-violet-700",
    opened: "January 2026",
    closes: "28 March 2026",
    desc: "BOCRA invites suitably qualified entities to apply for an Individual Tradable Assignment (ITA) commercial broadcasting radio station licence in accordance with the Broadcasting Act.",
    href: "https://www.bocra.org.bw",
  },
];

const CLOSED_CONSULTATIONS = [
  {
    title: "Draft Infrastructure Sharing Guidelines (Amendment)",
    category: "Regulatory Guidelines",
    closed: "December 2025",
    outcome: "Guidelines finalised and published",
  },
  {
    title: "Proposed Interconnection Rate Review",
    category: "Tariff Regulation",
    closed: "October 2025",
    outcome: "Revised rates gazetted — effective 1 January 2026",
  },
  {
    title: "ICT Licensing Framework Review 2025",
    category: "Licensing Policy",
    closed: "August 2025",
    outcome: "Framework under final review — publication expected Q2 2026",
  },
  {
    title: "Draft Postal Sector Regulations",
    category: "Postal Services",
    closed: "June 2025",
    outcome: "Submissions reviewed — report to Board pending",
  },
  {
    title: "Consumer Protection Guidelines — Digital Services",
    category: "Consumer Affairs",
    closed: "March 2025",
    outcome: "Guidelines approved and in effect from July 2025",
  },
];

export default function ConsultationsPage() {
  return (
    <InnerPageLayout
      section="Consultations"
      title="Public Consultations"
      breadcrumbs={[{ label: "Consultations", href: "/consultations" }]}
      sidebarLinks={CONSULTATIONS_LINKS}
    >
      <div className="space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA conducts public consultations on draft regulations, policies, and significant regulatory
            decisions to ensure that all stakeholders — operators, consumers, and the public — have an
            opportunity to contribute to the development of Botswana&apos;s communications regulatory framework.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {OPEN_CONSULTATIONS.length} consultation{OPEN_CONSULTATIONS.length !== 1 ? "s" : ""} currently open
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Submissions accepted via email or written correspondence
            </div>
          </div>
        </div>

        {/* How to submit */}
        <div className="bg-[#06193e] rounded-2xl p-6 text-white">
          <h2 className="font-black text-base mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#75AADB]" />
            How to Submit Comments
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { step: "1", label: "Download", desc: "Download the consultation document below." },
              { step: "2", label: "Prepare", desc: "Prepare your written submissions with your name, organisation, and contact details." },
              { step: "3", label: "Submit", desc: "Email to consultations@bocra.org.bw before the closing date." },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#D4921A] flex items-center justify-center shrink-0 text-xs font-black">
                  {s.step}
                </div>
                <div>
                  <p className="font-black text-white">{s.label}</p>
                  <p className="text-gray-300 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open consultations */}
        <div id="open">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-xl font-black text-[#06193e]">Open for Public Comment</h2>
          </div>
          <div className="space-y-4">
            {OPEN_CONSULTATIONS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-green-200 transition-all"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.categoryColor}`}>{item.category}</span>
                  <span className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Closes {item.closes}
                  </span>
                </div>
                <h3 className="font-black text-[#06193e] mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Opened {item.opened}</span>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#027ac6] hover:text-[#005ea6] transition-colors"
                  >
                    View document <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Closed consultations */}
        <div id="closed">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle2 className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-black text-[#06193e]">Closed Consultations</h2>
          </div>
          <div className="space-y-3">
            {CLOSED_CONSULTATIONS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.category}</span>
                    <span className="text-[10px] text-gray-400">Closed {item.closed}</span>
                  </div>
                  <h3 className="font-bold text-[#06193e] text-sm leading-snug">{item.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-green-500 shrink-0" />
                    {item.outcome}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </InnerPageLayout>
  );
}
