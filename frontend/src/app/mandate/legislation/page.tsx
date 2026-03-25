"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { FileText, Scale, Globe, Shield } from "lucide-react";

const MANDATE_LINKS = [
  { label: "Legislation", href: "/mandate/legislation", active: true },
  { label: "Telecommunications", href: "/mandate/telecommunications" },
  { label: "Broadcasting", href: "/mandate/broadcasting" },
  { label: "Postal Services", href: "/mandate/postal" },
  { label: "Internet & ICT", href: "/mandate/internet" },
  { label: "Licensing", href: "/mandate/licensing" },
];

const ACTS = [
  {
    icon: Scale,
    color: "bg-[#06193e]",
    iconColor: "text-[#75AADB]",
    title: "Communications Regulatory Authority Act, 2012",
    badge: "Primary Legislation",
    badgeColor: "bg-[#06193e] text-[#75AADB]",
    desc: "The foundational legislation establishing BOCRA as an independent communications regulatory authority. The CRA Act came into effect on 1 April 2013, replacing the Botswana Telecommunications Authority (BTA). It mandates BOCRA to regulate telecommunications, Internet, ICTs, radio communications, broadcasting, and postal services.",
    keyPoints: [
      "Established BOCRA as an independent authority",
      "Mandates regulation of telecommunications, broadcasting, and postal sectors",
      "Provides for licensing, compliance, and consumer protection",
      "Establishes the Universal Access and Service Fund",
    ],
  },
  {
    icon: FileText,
    color: "bg-[#027ac6]",
    iconColor: "text-white",
    title: "Electronic Records (Evidence) Act, No. 13 of 2014",
    badge: "ICT Law",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "This Act deals with the admissibility of electronic evidence in court. BOCRA is mandated to establish an approved process for the production of electronic documents and certify electronic records systems to ensure their integrity in legal proceedings.",
    keyPoints: [
      "Establishes admissibility of electronic evidence in Botswana courts",
      "BOCRA certifies electronic records systems for legal integrity",
      "Provides a process for producing electronic documents as evidence",
    ],
  },
  {
    icon: Globe,
    color: "bg-emerald-700",
    iconColor: "text-white",
    title: "Electronic Communications and Transactions Act, 2014",
    badge: "E-Commerce",
    badgeColor: "bg-emerald-100 text-emerald-700",
    desc: "This Act facilitates e-commerce and gives electronic signatures the legal equivalence of handwritten signatures before courts of law. BOCRA is mandated to carry out accreditation of secure digital signature service providers and administer take-down notices for unlawful online content.",
    keyPoints: [
      "Electronic signatures have legal equivalence of handwritten signatures",
      "BOCRA accredits digital signature service providers",
      "BOCRA administers take-down notices for unlawful content",
      "Facilitates e-commerce transactions in Botswana",
    ],
  },
  {
    icon: Shield,
    color: "bg-violet-700",
    iconColor: "text-white",
    title: "Universal Access and Service Notarial Deed of Trust",
    badge: "Universal Access",
    badgeColor: "bg-violet-100 text-violet-700",
    desc: "BOCRA has entered into a memorandum of agreement with the Universal Access and Service Fund (UASF). Under this agreement, BOCRA serves as the Manager of the Fund, providing investment and management services to promote universal access to communications services across Botswana.",
    keyPoints: [
      "BOCRA manages the Universal Access and Service Fund",
      "Promotes connectivity in underserved and rural areas",
      "Supports rollout of communications infrastructure",
    ],
  },
];

export default function LegislationPage() {
  return (
    <InnerPageLayout
      section="Mandate"
      title="Legislation"
      breadcrumbs={[{ label: "Mandate", href: "/mandate" }, { label: "Legislation", href: "/mandate/legislation" }]}
      sidebarLinks={MANDATE_LINKS}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA derives its regulatory powers from several key pieces of legislation passed by the Parliament
            of Botswana. These Acts collectively define the authority's mandate, powers, and obligations in
            regulating the communications sector.
          </p>
        </div>

        {ACTS.map((act, i) => (
          <motion.div
            key={act.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className={`${act.color} p-6 flex items-start gap-4`}>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <act.icon className={`w-6 h-6 ${act.iconColor}`} />
              </div>
              <div>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${act.badgeColor} mb-2 inline-block`}>
                  {act.badge}
                </span>
                <h3 className="text-xl font-black text-white leading-tight">{act.title}</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed mb-4">{act.desc}</p>
              <ul className="space-y-2">
                {act.keyPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#027ac6] mt-2 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </InnerPageLayout>
  );
}
