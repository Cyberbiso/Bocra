"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { FileText, Calendar, Clock, Download } from "lucide-react";

const TENDERS_LINKS = [
  { label: "Current Tenders", href: "/tenders", active: true },
  { label: "Tender Results", href: "/tenders/results" },
];

const TENDERS = [
  {
    ref: "BOCRA/TEN/2026/001",
    title: "Request for Proposals: QoS Monitoring Infrastructure Upgrade",
    category: "ICT Infrastructure",
    published: "20 February 2026",
    closing: "15 April 2026",
    status: "Open",
    desc: "BOCRA invites proposals from qualified vendors for the upgrade of the national Quality of Service (QoS) monitoring infrastructure, including hardware, software, and implementation services.",
  },
  {
    ref: "BOCRA/TEN/2026/002",
    title: "Consultancy: National Broadband Strategy Review",
    category: "Consultancy",
    published: "1 March 2026",
    closing: "30 April 2026",
    status: "Open",
    desc: "BOCRA seeks a qualified consultancy firm to undertake a comprehensive review of the National Broadband Strategy and develop recommendations for the 2026–2031 period.",
  },
];

export default function TendersPage() {
  return (
    <InnerPageLayout
      section="Procurement"
      title="Tenders & Procurement"
      breadcrumbs={[{ label: "Tenders", href: "/tenders" }]}
      sidebarLinks={TENDERS_LINKS}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA is committed to fair, transparent, and competitive procurement. All tender opportunities
            are published here and in the Botswana Daily News and Government Gazette. Submissions must comply
            with the Public Procurement and Asset Disposal Act of Botswana.
          </p>
        </div>

        {/* Active tenders */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-xl font-black text-[#06193e]">Open Tenders ({TENDERS.length})</h2>
          </div>
          {TENDERS.map((tender, i) => (
            <motion.div key={tender.ref} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full">{tender.status}</span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full ml-2">{tender.category}</span>
                </div>
                <p className="text-xs text-gray-400 font-mono">{tender.ref}</p>
              </div>
              <h3 className="font-black text-[#06193e] text-lg mb-2">{tender.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{tender.desc}</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Published: {tender.published}</span>
                <span className="flex items-center gap-1.5 text-red-600 font-bold"><Clock className="w-3.5 h-3.5" /> Closing: {tender.closing}</span>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 bg-[#06193e] hover:bg-[#027ac6] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  <Download className="w-4 h-4" /> Download RFP
                </button>
                <button className="flex items-center gap-2 border border-gray-200 hover:border-[#027ac6] text-gray-600 hover:text-[#027ac6] px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  <FileText className="w-4 h-4" /> View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact box */}
        <div className="bg-[#FAFCFF] border border-gray-200 rounded-2xl p-6">
          <h3 className="font-black text-[#06193e] mb-2">Procurement Enquiries</h3>
          <p className="text-sm text-gray-500 mb-3">For clarifications on any tender, contact the Procurement Unit:</p>
          <p className="text-sm font-semibold text-gray-700">📞 +267 395 7755 · ✉️ procurement@bocra.org.bw</p>
        </div>
      </div>
    </InnerPageLayout>
  );
}
