"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { Globe, Shield, Lock, Server } from "lucide-react";

const MANDATE_LINKS = [
  { label: "Legislation", href: "/mandate/legislation" },
  { label: "Telecommunications", href: "/mandate/telecommunications" },
  { label: "Broadcasting", href: "/mandate/broadcasting" },
  { label: "Postal Services", href: "/mandate/postal" },
  { label: "Internet & ICT", href: "/mandate/internet", active: true },
  { label: "Licensing", href: "/mandate/licensing" },
];

const AREAS = [
  {
    icon: Globe, color: "bg-[#027ac6]",
    title: "bw ccTLD",
    subtitle: "Country Code Top Level Domain",
    desc: "BOCRA oversees the administration of the .bw country code top-level domain — the national internet identifier for Botswana. The .bw domain promotes online sovereignty and provides businesses, organisations, and individuals with a trusted Botswana online identity.",
    links: [{ label: "Register a .bw Domain", href: "https://nic.net.bw/" }],
  },
  {
    icon: Shield, color: "bg-[#c61e53]",
    title: "bw CIRT",
    subtitle: "Computer Incident Response Team",
    desc: "The Botswana Computer Incident Response Team (bw CIRT) is mandated to coordinate national cybersecurity incident response. bw CIRT assists government, businesses, and individuals in responding to cybersecurity threats, sharing threat intelligence, and building national cybersecurity resilience.",
    links: [{ label: "Report a Cybersecurity Incident", href: "mailto:info@bocra.org.bw" }],
  },
  {
    icon: Lock, color: "bg-emerald-700",
    title: "Electronic Evidence",
    subtitle: "Electronic Records Act",
    desc: "BOCRA administers the Electronic Records (Evidence) Act, certifying electronic records systems and establishing processes for the production of electronic documents as admissible evidence in Botswana courts.",
    links: [],
  },
  {
    icon: Server, color: "bg-violet-700",
    title: "Electronic Communications & Transactions",
    subtitle: "E-Commerce Regulation",
    desc: "BOCRA accredits digital signature service providers and administers take-down notices under the Electronic Communications and Transactions Act, 2014 — supporting the growth of e-commerce in Botswana.",
    links: [],
  },
];

export default function InternetPage() {
  return (
    <InnerPageLayout
      section="Mandate"
      title="Internet & ICT"
      breadcrumbs={[{ label: "Mandate", href: "/mandate" }, { label: "Internet & ICT", href: "/mandate/internet" }]}
      sidebarLinks={MANDATE_LINKS}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA's Internet and ICT mandate covers the regulation of internet services, domain name
            administration, cybersecurity incident response, and the legal frameworks underpinning
            digital transactions and electronic evidence in Botswana.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {AREAS.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className={`${area.color} p-6`}>
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mb-3">
                  <area.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">{area.title}</h3>
                <p className="text-white/70 text-xs font-semibold mt-1">{area.subtitle}</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{area.desc}</p>
                {area.links.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#027ac6] hover:underline">
                    {link.label} →
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </InnerPageLayout>
  );
}
