"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { BookOpen, Shield, Wifi, Phone, Package, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

const COMPLAINTS_LINKS = [
  { label: "File a Complaint", href: "/complaints" },
  { label: "Complaint Process", href: "/complaints/process" },
  { label: "Consumer Education", href: "/complaints/education", active: true },
  { label: "Track Your Complaint", href: "/complaints/track" },
];

const RIGHTS = [
  {
    icon: Wifi,
    color: "bg-[#1B75BB]",
    title: "Right to Quality Service",
    desc: "You have the right to receive telecommunications and internet services that meet BOCRA's minimum Quality of Service (QoS) standards. Operators are legally required to maintain network performance thresholds published by BOCRA.",
    actions: [
      "Check your operator's QoS statistics on dqos.bocra.org.bw",
      "Report persistent slow speeds or dropped calls to your operator",
      "Escalate to BOCRA if the operator fails to act",
    ],
  },
  {
    icon: Shield,
    color: "bg-[#1C6B3C]",
    title: "Right to Accurate Billing",
    desc: "You have the right to clear, accurate, and itemised billing. Operators must not charge you for services you did not subscribe to, and must provide sufficient notice before changing tariffs.",
    actions: [
      "Request itemised bills from your operator at any time",
      "Dispute incorrect charges in writing within 30 days",
      "BOCRA can intervene in unresolved billing disputes",
    ],
  },
  {
    icon: Package,
    color: "bg-[#D4921A]",
    title: "Right to Fair Contract Terms",
    desc: "All service contracts must be in plain language and disclose all material terms, including contract duration, early termination fees, and automatic renewal clauses. Unfair or misleading terms are unenforceable.",
    actions: [
      "Read your contract before signing — request time to review",
      "Ask for written confirmation of verbal promises",
      "Report aggressive or deceptive sales tactics to BOCRA",
    ],
  },
  {
    icon: Phone,
    color: "bg-[#872030]",
    title: "Right to Number Portability",
    desc: "You have the right to keep your mobile number when switching operators under Botswana's Mobile Number Portability (MNP) regime. The porting process must be completed within 2 business days.",
    actions: [
      "Visit any authorised dealer of your new operator to port",
      "Porting is free of charge",
      "Your existing contract obligations remain with the old operator",
    ],
  },
  {
    icon: BookOpen,
    color: "bg-[#06193e]",
    title: "Right to Access Information",
    desc: "You have the right to access information about your service, including your remaining data balance, applicable charges, and how to opt out of value-added services. Operators must provide this information free of charge.",
    actions: [
      "USSD codes (e.g. *141#) must show your real-time balance",
      "Request a full disclosure of all active VAS subscriptions",
      "Unsubscribe from any VAS at any time — no charges apply",
    ],
  },
];

const TIPS = [
  "Always request a written complaint reference number from your operator.",
  "Keep records of all communications — screenshots, emails, and call logs.",
  "Check operator tariffs on BOCRA's website before subscribing.",
  "Verify device type approval before purchasing — use typeapproval.bocra.org.bw.",
  "Report scam calls and SMS to your operator and to BOCRA.",
  "BOCRA's consumer helpline 0800 600 601 is toll-free from any network.",
];

export default function ConsumerEducationPage() {
  return (
    <InnerPageLayout
      section="Complaints"
      title="Consumer Education"
      breadcrumbs={[{ label: "Complaints", href: "/complaints" }, { label: "Consumer Education", href: "/complaints/education" }]}
      sidebarLinks={COMPLAINTS_LINKS}
    >
      <div className="space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            Understanding your rights as a communications consumer in Botswana empowers you to demand
            quality services and take action when operators fall short. BOCRA is mandated under the
            Communications Regulatory Authority Act, 2012 to protect the interests of consumers across
            telecommunications, internet, broadcasting, and postal services.
          </p>
        </div>

        {/* Rights */}
        <div>
          <h2 className="text-xl font-black text-[#06193e] mb-5 flex items-center gap-3">
            <Shield className="w-5 h-5" /> Your Consumer Rights
          </h2>
          <div className="space-y-5">
            {RIGHTS.map((right, i) => {
              const Icon = right.icon;
              return (
                <motion.div
                  key={right.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className={`${right.color} px-6 py-4 flex items-center gap-3`}>
                    <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-black text-base">{right.title}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{right.desc}</p>
                    <div className="space-y-2">
                      {right.actions.map((action) => (
                        <div key={action} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#1C6B3C] shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-[#06193e] rounded-2xl p-7">
          <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#75AADB]" /> Quick Consumer Tips
          </h2>
          <div className="space-y-3">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4921A] flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* External resources */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-[#06193e] mb-4">Useful Resources</h2>
          <div className="space-y-2">
            {[
              { label: "BOCRA Consumer Portal", href: "https://op-web.bocra.org.bw", desc: "Online regulatory services" },
              { label: "QoS Dashboard", href: "https://dqos.bocra.org.bw", desc: "Live network quality statistics" },
              { label: "Type Approval Register", href: "https://typeapproval.bocra.org.bw", desc: "Check if your device is approved" },
              { label: "Operator Licence Verification", href: "https://customerportal.bocra.org.bw/OnlineLicenseVerification/verify", desc: "Verify a service provider's licence" },
            ].map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-bold text-[#06193e] group-hover:text-[#027ac6] transition-colors">{r.label}</p>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#027ac6] transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#FAFCFF] border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-black text-[#06193e]">Have an unresolved complaint?</p>
            <p className="text-sm text-gray-500">BOCRA can help — file a complaint in under 5 minutes.</p>
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
