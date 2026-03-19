"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { FileText, Download, ExternalLink, BookOpen, Scale, Radio, Globe, Shield } from "lucide-react";

const DOCS_LINKS = [
  { label: "All Documents", href: "/documents", active: true },
  { label: "Legislation", href: "/mandate/legislation" },
  { label: "Licensing Framework", href: "/mandate/licensing" },
  { label: "Annual Reports", href: "/documents#annual-reports" },
  { label: "Consultations", href: "/consultations" },
];

const LEGISLATION = [
  {
    title: "Communications Regulatory Authority Act, 2012",
    type: "Primary Legislation",
    year: "2012",
    desc: "The founding Act establishing BOCRA as an independent statutory body to regulate telecommunications, ICTs, radio communications, broadcasting, and postal services.",
    icon: Scale,
    color: "bg-[#06193e]",
    href: "https://www.bocra.org.bw/mandate/legislation",
  },
  {
    title: "Electronic Records (Evidence) Act, No. 13 of 2014",
    type: "Legislation",
    year: "2014",
    desc: "Grants BOCRA authority over the admissibility of electronic evidence in courts of law in Botswana.",
    icon: FileText,
    color: "bg-[#1B75BB]",
    href: "https://www.bocra.org.bw/mandate/legislation",
  },
  {
    title: "Electronic Communications and Transactions Act, 2014",
    type: "Legislation",
    year: "2014",
    desc: "Mandates BOCRA to accredit digital signature service providers and administer take-down notices for unlawful online content.",
    icon: Globe,
    color: "bg-[#1C6B3C]",
    href: "https://www.bocra.org.bw/mandate/legislation",
  },
  {
    title: "BTC (Transition) Act, 2008",
    type: "Legislation",
    year: "2008",
    desc: "Facilitated the privatisation of Botswana Telecommunications Corporation, paving the way for a competitive telecoms market.",
    icon: Radio,
    color: "bg-[#872030]",
    href: "https://www.bocra.org.bw/mandate/legislation",
  },
];

const POLICY_DOCS = [
  {
    title: "ICT Licensing Framework (Revised 2015)",
    category: "Licensing Policy",
    date: "September 2015",
    size: "PDF",
    desc: "Establishes two major licence categories — Network Facilities Provider (NFP) and Services & Applications Provider (SAP) — creating a more conducive environment for ICT development.",
  },
  {
    title: "National Radio Frequency Plan",
    category: "Spectrum Management",
    date: "Current",
    size: "PDF",
    desc: "Governs frequency spectrum allocation from 9 kHz to 105 GHz. Published under Section 47 of the CRA Act.",
  },
  {
    title: "Postal Sector Licensing Framework",
    category: "Postal Services",
    date: "Current",
    size: "PDF",
    desc: "Guidelines for postal service provision and licensing in Botswana, covering both domestic and courier operators.",
  },
  {
    title: "Enforcement Guidelines (2nd Draft, Amended)",
    category: "Regulatory Guidelines",
    date: "2023",
    size: "277 KB · PDF",
    desc: "BOCRA's procedures and guidelines for enforcement of regulatory obligations by licensed operators.",
  },
  {
    title: "Cost Modelling Project — Interim Report",
    category: "Technical Report",
    date: "2023",
    size: "258 KB · PDF",
    desc: "Interim findings on the national cost modelling project for telecommunications services.",
  },
  {
    title: "Guidelines on Minimum Internet Connectivity Requirements for Hospitality Facilities",
    category: "Technical Guidelines",
    date: "2022",
    size: "PDF",
    desc: "Minimum standards for internet connectivity that hotels, lodges, and guesthouses must provide to guests.",
  },
  {
    title: "Understanding Broadband Connectivity — Consumer Guide",
    category: "Consumer Education",
    date: "2022",
    size: "181 KB · PDF",
    desc: "Educational guide for consumers explaining broadband types, speeds, and what to expect from service providers.",
  },
  {
    title: "Infrastructure Sharing Guidelines",
    category: "Regulatory Guidelines",
    date: "2021",
    size: "PDF",
    desc: "Framework enabling telecommunications operators to negotiate shared passive infrastructure (towers, ducts, cables) to reduce duplication and environmental impact.",
  },
];

const ANNUAL_REPORTS = [
  { year: "2024", desc: "Annual Report covering regulatory achievements, market statistics, and financial statements.", badge: "Latest" },
  { year: "2023", desc: "Annual Report covering regulatory activities, spectrum management, and consumer affairs." },
  { year: "2022", desc: "Annual Report including QoS monitoring results, licensing outcomes, and UASF disbursements." },
  { year: "2021", desc: "Annual Report covering the pandemic period, digital resilience, and broadband expansion." },
  { year: "2020", desc: "Annual Report including the national response to COVID-19 and emergency spectrum allocations." },
];

export default function DocumentsPage() {
  return (
    <InnerPageLayout
      section="Documents"
      title="Documents & Publications"
      breadcrumbs={[{ label: "Documents", href: "/documents" }]}
      sidebarLinks={DOCS_LINKS}
    >
      <div className="space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA publishes regulatory documents, policy frameworks, legislation, annual reports, and consumer
            guides in the interest of transparency and public accountability. All documents are freely available
            for download.
          </p>
        </div>

        {/* Legislation */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <Scale className="w-5 h-5 text-[#06193e]" />
            <h2 className="text-xl font-black text-[#06193e]">Legislation</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {LEGISLATION.map((doc, i) => (
              <motion.a
                key={doc.title}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#027ac6]/20 transition-all flex gap-4"
              >
                <div className={`${doc.color} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
                  <doc.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{doc.type} · {doc.year}</span>
                      <h3 className="font-black text-[#06193e] text-sm leading-snug mt-0.5 group-hover:text-[#027ac6] transition-colors">{doc.title}</h3>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#027ac6] shrink-0 mt-1 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2">{doc.desc}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Policy & Regulatory Documents */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <BookOpen className="w-5 h-5 text-[#06193e]" />
            <h2 className="text-xl font-black text-[#06193e]">Policy & Regulatory Documents</h2>
          </div>
          <div className="space-y-3">
            {POLICY_DOCS.map((doc, i) => (
              <motion.div
                key={doc.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-[#027ac6]/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAFCFF] border border-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#027ac6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{doc.category}</span>
                    <span className="text-[10px] text-gray-400">{doc.date} · {doc.size}</span>
                  </div>
                  <h3 className="font-bold text-[#06193e] text-sm group-hover:text-[#027ac6] transition-colors">{doc.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{doc.desc}</p>
                </div>
                <a
                  href="https://www.bocra.org.bw/documents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#027ac6] hover:bg-[#027ac6]/10 px-3 py-1.5 rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Annual Reports */}
        <div id="annual-reports">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-[#06193e]" />
            <h2 className="text-xl font-black text-[#06193e]">Annual Reports</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ANNUAL_REPORTS.map((report, i) => (
              <motion.div
                key={report.year}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-[#06193e] rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-sm">{report.year}</span>
                  </div>
                  {report.badge && (
                    <span className="text-[10px] font-bold bg-[#D4921A] text-white px-2.5 py-1 rounded-full">{report.badge}</span>
                  )}
                </div>
                <h3 className="font-black text-[#06193e] mb-1">BOCRA Annual Report {report.year}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{report.desc}</p>
                <a
                  href="https://www.bocra.org.bw/bocra-2024-annual-report"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-[#027ac6] hover:text-[#005ea6] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </a>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </InnerPageLayout>
  );
}
