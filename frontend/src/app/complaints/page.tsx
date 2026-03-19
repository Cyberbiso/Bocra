"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, FileText, Phone, Mail, ArrowRight } from "lucide-react";

const COMPLAINTS_LINKS = [
  { label: "Complaints Overview", href: "/complaints", active: true },
  { label: "File a Complaint", href: "/#complaints" },
  { label: "Consumer Education", href: "/complaints/education" },
];

const CATEGORIES = [
  "Billing disputes",
  "Failure to provide or repair telecommunications equipment",
  "Internet service disruptions",
  "Interconnection problems between operators",
  "Delays in repairing and connecting services",
  "Fault repairs",
  "Mobile phone issues",
  "Internet access contracts",
  "Consumer rights violations",
];

const STEPS = [
  { n: "1", title: "Try your service provider first", desc: "Contact the operator's customer service. Speak to a manager or senior representative. Keep notes of all conversations including time, date, and names. Written complaints are vital — keep copies." },
  { n: "2", title: "Gather your evidence", desc: "Collect relevant documents such as contracts, bills, and correspondence. Do not send original documents to BOCRA. Keep copies of everything that supports your case." },
  { n: "3", title: "Submit your complaint to BOCRA", desc: "If the provider fails to resolve your issue, submit a formal complaint to BOCRA online or in writing. Your complaint will be attended to within two days of receipt." },
  { n: "4", title: "BOCRA investigates", desc: "BOCRA will make an independent assessment based on facts provided by both parties. For complex cases, you will be kept informed of progress throughout the investigation." },
  { n: "5", title: "Resolution", desc: "BOCRA will reach a resolution based on the CRA Act and what is considered fair and reasonable. Outcomes may include formal apology, explanation, financial compensation, or operational changes." },
];

export default function ComplaintsPage() {
  return (
    <InnerPageLayout
      section="Complaints"
      title="Consumer Complaints"
      breadcrumbs={[{ label: "Complaints", href: "/complaints" }]}
      sidebarLinks={COMPLAINTS_LINKS}
    >
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed mb-4">
            BOCRA investigates consumer complaints against licensed telecommunications, broadcasting, and
            postal service providers. Complaints are assessed on the facts provided by both parties —
            the service provider and the complainant — and resolved based on the CRA Act and what is
            considered fair and reasonable under the circumstances.
          </p>
          <a href="/#complaints"
            className="inline-flex items-center gap-2 bg-[#c61e53] hover:bg-red-700 text-white px-7 py-3.5 rounded-xl font-black text-sm transition-colors shadow-lg">
            <FileText className="w-4 h-4" /> File a Complaint Now <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* What we handle */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-5">
            <AlertCircle className="w-6 h-6 text-[#c61e53]" />
            <h2 className="text-2xl font-black text-[#06193e]">Types of Complaints We Handle</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-[#027ac6] shrink-0" />
                <span className="text-sm font-medium text-gray-700">{cat}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-black text-[#06193e] mb-6">Complaint Process</h2>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-[#06193e] text-white font-black flex items-center justify-center text-sm shrink-0">{step.n}</div>
                <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                  <h3 className="font-black text-[#06193e] mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact block */}
        <div className="bg-[#06193e] rounded-2xl p-7 grid sm:grid-cols-2 gap-5">
          <div>
            <p className="text-[#75AADB] text-xs font-black uppercase tracking-widest mb-2">Contact Consumer Affairs</p>
            <h3 className="text-xl font-black text-white mb-4">Reach BOCRA Directly</h3>
            <div className="space-y-2">
              <a href="tel:+26739577755" className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors">
                <Phone className="w-4 h-4 text-[#75AADB]" /> +267 395 7755
              </a>
              <a href="mailto:info@bocra.org.bw" className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors">
                <Mail className="w-4 h-4 text-[#75AADB]" /> info@bocra.org.bw
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-gray-400 text-sm mb-3">Or write to:</p>
            <p className="text-white text-sm font-bold">The Chief Executive</p>
            <p className="text-gray-400 text-sm">Botswana Communications Regulatory Authority</p>
            <p className="text-gray-400 text-sm">Private Bag 00495, Gaborone</p>
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
}
