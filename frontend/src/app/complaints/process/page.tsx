"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { ClipboardList, Search, Phone, Mail, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const COMPLAINTS_LINKS = [
  { label: "File a Complaint", href: "/complaints" },
  { label: "Complaint Process", href: "/complaints/process", active: true },
  { label: "Consumer Education", href: "/complaints/education" },
  { label: "Track Your Complaint", href: "/complaints/track" },
];

const STEPS = [
  {
    number: "01",
    title: "Contact Your Service Provider First",
    color: "bg-[#1B75BB]",
    icon: Phone,
    desc: "Before escalating to BOCRA, you must first attempt to resolve the issue directly with your service provider (e.g. Mascom, Orange, BTC, Botswana Post). Most operators have dedicated customer care lines and complaints departments. Keep a record of your complaint reference number and dates of contact.",
    tips: [
      "Call the operator's customer care line",
      "Request a formal complaint reference number",
      "Allow a reasonable timeframe for resolution (typically 5–10 business days)",
    ],
  },
  {
    number: "02",
    title: "Escalate to BOCRA",
    color: "bg-[#1C6B3C]",
    icon: ClipboardList,
    desc: "If your service provider fails to resolve your complaint within a reasonable timeframe, or if you are dissatisfied with their response, you may escalate to BOCRA. You can file your complaint online, by telephone, by email, or in person at our offices.",
    tips: [
      "File online via this website (fastest option)",
      "Call our Consumer Affairs helpline: 0800 600 601 (toll-free)",
      "Email: consumeraffairs@bocra.org.bw",
      "Walk in: Plot 50671, Fairgrounds Office Park, Gaborone",
    ],
  },
  {
    number: "03",
    title: "Acknowledgement",
    color: "bg-[#D4921A]",
    icon: CheckCircle2,
    desc: "BOCRA will acknowledge receipt of your complaint within 2 business days and assign a unique reference number (format: BCR-YYYY-XXXXXX). You will receive this via email or SMS. Keep your reference number — you will need it to track your complaint.",
    tips: [
      "Check your spam/junk folder for the acknowledgement email",
      "SMS confirmation is sent to the number you provided",
    ],
  },
  {
    number: "04",
    title: "Investigation",
    color: "bg-[#872030]",
    icon: Search,
    desc: "BOCRA investigates your complaint by engaging with the relevant licensed operator and reviewing relevant records. This may involve requesting call records, network data, correspondence, or billing information. BOCRA targets resolution within 15 business days for standard complaints.",
    tips: [
      "BOCRA may contact you for additional information",
      "Complex complaints (e.g. spectrum interference) may take longer",
      "You will receive regular status updates via email",
    ],
  },
  {
    number: "05",
    title: "Resolution & Outcome",
    color: "bg-[#06193e]",
    icon: Mail,
    desc: "BOCRA will notify you of the outcome in writing. Possible outcomes include: the operator is directed to resolve your issue, a regulatory sanction is imposed, the complaint is dismissed (with reasons), or the matter is referred to another competent authority. You may appeal BOCRA's decision by written request within 30 days.",
    tips: [
      "Operators found in breach may be fined under the CRA Act",
      "You retain the right to pursue civil remedies through the courts",
      "Appeals are reviewed by a separate panel within BOCRA",
    ],
  },
];

export default function ComplaintProcessPage() {
  return (
    <InnerPageLayout
      section="Complaints"
      title="How We Handle Complaints"
      breadcrumbs={[{ label: "Complaints", href: "/complaints" }, { label: "Process", href: "/complaints/process" }]}
      sidebarLinks={COMPLAINTS_LINKS}
    >
      <div className="space-y-8">

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA is committed to resolving consumer complaints fairly, efficiently, and transparently.
            Our complaints process is designed to protect your rights as a user of communications services
            in Botswana, while ensuring that licensed operators meet their regulatory obligations.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-4 py-2 rounded-xl">
              <Clock className="w-4 h-4" /> Standard resolution: 15 business days
            </div>
            <div className="flex items-center gap-2 bg-[#06193e]/5 text-[#06193e] text-xs font-bold px-4 py-2 rounded-xl">
              <Phone className="w-4 h-4" /> Toll-free: 0800 600 601
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className={`${step.color} px-6 py-4 flex items-center gap-4`}>
                  <span className="text-white/30 font-black text-3xl leading-none">{step.number}</span>
                  <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-black text-base">{step.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.desc}</p>
                  <div className="space-y-2">
                    {step.tips.map((tip) => (
                      <div key={tip} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1C6B3C] shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="bg-[#FAFCFF] border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-black text-[#06193e]">Ready to file your complaint?</p>
            <p className="text-sm text-gray-500">It takes less than 5 minutes.</p>
          </div>
          <Link
            href="/complaints"
            className="shrink-0 flex items-center gap-2 bg-[#872030] hover:bg-[#6e1a27] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            File a Complaint <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </InnerPageLayout>
  );
}
