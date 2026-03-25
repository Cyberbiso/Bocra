"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { Globe, Wifi, Radio, Shield, Layers, TrendingUp, CheckCircle2, Clock, ExternalLink } from "lucide-react";

const PROJECTS_LINKS = [
  { label: "All Projects", href: "/projects", active: true },
  { label: "Universal Access Fund", href: "/projects#uasf" },
  { label: "Digital Switchover", href: "/projects#dso" },
  { label: ".bw Domain", href: "/projects#bw-domain" },
  { label: "Cybersecurity (bwCIRT)", href: "/projects#bwcirt" },
];

const PROJECTS = [
  {
    id: "uasf",
    title: "Universal Access and Service Fund (UASF)",
    status: "Ongoing",
    statusColor: "bg-green-500",
    icon: Wifi,
    accentColor: "bg-[#1B75BB]",
    tagColor: "bg-[#1B75BB]/10 text-[#1B75BB]",
    year: "2013 – Present",
    lead: "BOCRA / Ministry of Transport",
    desc: "The Universal Access and Service Fund ensures that underserved and remote communities across Botswana gain access to affordable telecommunications and internet services. BOCRA manages the Fund under a Deed of Trust, channelling levies collected from licensed operators into rural connectivity projects, community broadband schemes, and public payphone programmes.",
    highlights: [
      "Funded rural internet access in 14 remote districts",
      "Connected over 200 government schools to broadband",
      "Subsidised community telecentres in Ghanzi and Kgalagadi",
      "Annual disbursements averaging P45 million",
    ],
    link: "https://www.bocra.org.bw/universal-access",
  },
  {
    id: "dso",
    title: "Digital Switchover (DSO) — Analogue to Digital Broadcasting",
    status: "Completed",
    statusColor: "bg-gray-400",
    icon: Radio,
    accentColor: "bg-[#872030]",
    tagColor: "bg-[#872030]/10 text-[#872030]",
    year: "2008 – 2020",
    lead: "BOCRA / BTVC / BTV",
    desc: "Botswana's migration from analogue to digital terrestrial television broadcasting, in line with the ITU Regional Radiocommunications Conference 2006 (RRC-06) planning. BOCRA coordinated the Digital Broadcasting Reference Group, established in February 2008, to manage the switchover across VHF and UHF frequency bands.",
    highlights: [
      "Full digital coverage achieved across Gaborone, Francistown, and Maun",
      "Over 500,000 households migrated to digital receivers",
      "Freed up spectrum for 4G/LTE broadband deployment",
      "Compliant with ITU African Region switchover deadline",
    ],
    link: "https://www.bocra.org.bw",
  },
  {
    id: "bw-domain",
    title: ".bw Country Code Top-Level Domain (ccTLD)",
    status: "Ongoing",
    statusColor: "bg-green-500",
    icon: Globe,
    accentColor: "bg-[#1C6B3C]",
    tagColor: "bg-[#1C6B3C]/10 text-[#1C6B3C]",
    year: "2010 – Present",
    lead: "BOCRA / Technical Advisory Committee",
    desc: "BOCRA was mandated by Government to perform regulatory and administrative functions for the .bw country code domain. The Technical Advisory Committee (TAC), established on 28 April 2010, comprises nine member organisations including BOCRA, BOCCIM, Mascom, Orange, BTC, and leading universities. ISPs are permitted to register and sell .bw domain names at retail level.",
    highlights: [
      "TAC with 9 member organisations including all major telcos",
      "Policy and Public Awareness sub-committees active",
      "ISP retail registration framework operational",
      "Botswana's digital identity anchored at nic.net.bw",
    ],
    link: "https://nic.net.bw",
  },
  {
    id: "infrastructure",
    title: "Infrastructure Sharing Framework",
    status: "Ongoing",
    statusColor: "bg-green-500",
    icon: Layers,
    accentColor: "bg-[#D4921A]",
    tagColor: "bg-[#D4921A]/10 text-[#D4921A]",
    year: "2018 – Present",
    lead: "BOCRA / Department of Environmental Affairs",
    desc: "BOCRA developed guidelines enabling telecommunications operators to negotiate shared passive infrastructure arrangements. The framework minimises tower and duct duplication, protects the environment, promotes fair competition, and reduces capital expenditure — allowing operators to direct investment towards network improvements rather than duplicating infrastructure.",
    highlights: [
      "Reduced number of duplicate tower constructions by ~30%",
      "Joint environmental impact assessments introduced",
      "Standard commercial terms for passive sharing published",
      "Active infrastructure sharing roadmap under development",
    ],
    link: "https://www.bocra.org.bw",
  },
  {
    id: "bwcirt",
    title: "Botswana Computer Incident Response Team (bwCIRT)",
    status: "Ongoing",
    statusColor: "bg-green-500",
    icon: Shield,
    accentColor: "bg-[#06193e]",
    tagColor: "bg-[#06193e]/10 text-[#06193e]",
    year: "2016 – Present",
    lead: "BOCRA / Ministry of ICT",
    desc: "bwCIRT is Botswana's national cyber-security incident response team, operated under BOCRA's mandate. It coordinates national responses to cyber threats, issues alerts and advisories, and builds capacity for digital resilience. In 2026, BOCRA hosted the inaugural Botswana National Cyber Drill under the theme 'Cyber Resilience in Action', in collaboration with FIRST — the global organisation for incident response teams.",
    highlights: [
      "Member of FIRST (global incident response network)",
      "MoU signed with Group-IB (Sept 2025) for threat intelligence",
      "MoU signed with Cyble (Nov 2025) for national cybersecurity",
      "Inaugural National Cyber Drill hosted in February 2026",
    ],
    link: "https://www.bocra.org.bw/bwcirt",
  },
  {
    id: "qos",
    title: "QoS Monitoring Infrastructure Upgrade",
    status: "Procurement",
    statusColor: "bg-[#D4921A]",
    icon: TrendingUp,
    accentColor: "bg-violet-700",
    tagColor: "bg-violet-100 text-violet-700",
    year: "2026",
    lead: "BOCRA Engineering Division",
    desc: "BOCRA has issued a Request for Proposals (BOCRA/TEN/2026/001) for the upgrade of the national Quality of Service monitoring infrastructure, including hardware, software, and implementation services. The upgraded system will provide real-time visibility into network performance across all licensed operators.",
    highlights: [
      "National QoS probe network covering all 8 cities",
      "Real-time mobile, broadband, and broadcasting monitoring",
      "Public QoS dashboard at dqos.bocra.org.bw",
      "RFP closes 15 April 2026",
    ],
    link: "https://dqos.bocra.org.bw",
  },
];

export default function ProjectsPage() {
  return (
    <InnerPageLayout
      section="Projects"
      title="Projects & Initiatives"
      breadcrumbs={[{ label: "Projects", href: "/projects" }]}
      sidebarLinks={PROJECTS_LINKS}
    >
      <div className="space-y-6">

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA leads and participates in a range of strategic projects that advance Botswana&apos;s
            digital economy — from universal broadband access in remote communities to national
            cybersecurity resilience. Below is an overview of our key current and completed initiatives.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "6", label: "Active Projects" },
            { value: "200+", label: "Schools Connected" },
            { value: "P45M+", label: "UASF Annual Spend" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#06193e] rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="space-y-5">
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.id}
              id={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header band */}
              <div className={`${project.accentColor} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
                    <project.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{project.lead}</p>
                    <h3 className="text-white font-black text-base leading-tight">{project.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${project.statusColor} ${project.status === "Ongoing" ? "animate-pulse" : ""}`} />
                  <span className="text-white text-xs font-bold">{project.status}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${project.tagColor}`}>{project.status}</span>
                  <span className="text-xs text-gray-400">{project.year}</span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-5">{project.desc}</p>

                {/* Highlights */}
                <div className="space-y-2 mb-5">
                  {project.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1C6B3C] shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{h}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#027ac6] hover:text-[#005ea6] transition-colors"
                >
                  Learn more <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-[#FAFCFF] border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#06193e] rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#75AADB]" />
            </div>
            <div>
              <p className="font-black text-[#06193e] text-sm">Project Funding Enquiries</p>
              <p className="text-xs text-gray-500">Interested in partnering with BOCRA on a project?</p>
            </div>
          </div>
          <a
            href="mailto:info@bocra.org.bw"
            className="shrink-0 bg-[#06193e] hover:bg-[#027ac6] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            Contact Us
          </a>
        </div>

      </div>
    </InnerPageLayout>
  );
}
