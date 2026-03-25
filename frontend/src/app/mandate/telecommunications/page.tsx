"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import {
  Radio,
  Network,
  MapPin,
  Hash,
  CheckCircle,
  Building2,
  Wifi,
  Globe,
} from "lucide-react";

const SIDEBAR_LINKS = [
  { label: "Legislation", href: "/mandate/legislation" },
  { label: "Telecommunications", href: "/mandate/telecommunications", active: true },
  { label: "Broadcasting", href: "/mandate/broadcasting" },
  { label: "Postal Services", href: "/mandate/postal" },
  { label: "Internet & ICT", href: "/mandate/internet" },
  { label: "Licensing", href: "/mandate/licensing" },
];

const OPERATORS = [
  {
    name: "Botswana Telecommunications Corporation Limited (BTCL)",
    type: "Public Telecommunications Operator",
    color: "bg-[#06193e]",
    initials: "BT",
    description:
      "Botswana's national incumbent operator, providing fixed-line, mobile (under beMOBILE brand), and broadband services. Listed on the Botswana Stock Exchange with partial government ownership.",
  },
  {
    name: "Mascom Wireless (Pty) Ltd",
    type: "Public Telecommunications Operator",
    color: "bg-[#027ac6]",
    initials: "MW",
    description:
      "One of Botswana's leading private mobile operators, holding one of the first mobile licences issued since 1998. Provides mobile voice, data, and value-added services nationwide.",
  },
  {
    name: "Orange Botswana (Pty) Ltd",
    type: "Public Telecommunications Operator",
    color: "bg-orange-500",
    initials: "OB",
    description:
      "Originally Vista Cellular, Orange Botswana is part of the global Orange Group. Provides mobile telecommunications, broadband internet, and enterprise services across Botswana.",
  },
  {
    name: "Botswana Fibre Networks (BoFiNet)",
    type: "Wholesale Infrastructure Operator",
    color: "bg-[#75AADB]",
    initials: "BF",
    description:
      "Government-owned wholesale infrastructure provider established in 2013 following BTC's structural separation. Provides open-access fibre backbone and international connectivity to all licensed operators.",
  },
];

const REGULATORY_AREAS = [
  {
    icon: Radio,
    title: "Radio Frequency Spectrum Management",
    description:
      "BOCRA administers the National Radio Frequency Plan (NRFP), allocating and assigning spectrum bands to operators and users across all services. Spectrum is a scarce public resource managed in the national interest.",
  },
  {
    icon: Network,
    title: "Network & Service Licensing",
    description:
      "All telecommunications networks and services require a licence under the CRA Act. BOCRA administers Network Facilities Provider (NFP) and Services and Applications Provider (SAP) licences since 2015.",
  },
  {
    icon: Hash,
    title: "National Numbering Plan",
    description:
      "BOCRA manages Botswana's National Numbering Plan, allocating number blocks to operators and managing number portability to enable subscribers to retain their numbers when switching providers.",
  },
  {
    icon: CheckCircle,
    title: "Type Approval",
    description:
      "All telecommunications equipment sold or used in Botswana must receive type approval from BOCRA, ensuring compliance with local technical standards and preventing interference.",
  },
  {
    icon: MapPin,
    title: "Quality of Service Monitoring",
    description:
      "BOCRA monitors and enforces QoS standards across mobile and fixed networks, publishing comparative performance data to promote accountability and informed consumer choice.",
  },
  {
    icon: Globe,
    title: "International Coordination",
    description:
      "BOCRA represents Botswana at the International Telecommunication Union (ITU), African Telecommunication Union (ATU), and SADC CRASA to coordinate cross-border spectrum and policy matters.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export default function TelecomPage() {
  return (
    <InnerPageLayout
      section="Mandate"
      title="Telecommunications Regulation"
      breadcrumbs={[
        { label: "Mandate", href: "/mandate" },
        { label: "Telecommunications", href: "/mandate/telecommunications" },
      ]}
      sidebarLinks={SIDEBAR_LINKS}
    >
      {/* Intro */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#06193e] flex items-center justify-center shrink-0">
            <Wifi className="w-6 h-6 text-[#75AADB]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#06193e] mb-3">
              Telecommunications Regulation in Botswana
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              BOCRA regulates the telecommunications sector under the{" "}
              <strong className="text-[#06193e]">
                Communications Regulatory Authority Act, 2012 (CRA Act)
              </strong>
              . The Authority&rsquo;s telecommunications mandate encompasses the licensing of
              operators, management of the radio frequency spectrum, administration of the
              national numbering plan, type approval of equipment, and enforcement of
              quality of service standards.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Since 2015, Botswana has operated under a{" "}
              <strong className="text-[#06193e]">
                technology-neutral ICT Licensing Framework
              </strong>{" "}
              that replaced sector-specific licences with unified Network Facilities Provider
              (NFP) and Services and Applications Provider (SAP) categories, enabling
              operators to deliver any communications service over any technology platform.
            </p>
          </div>
        </div>
      </div>

      {/* Licenced Operators */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-[#06193e] mb-2">Licensed Operators</h2>
        <p className="text-gray-500 text-sm mb-6">
          The key telecommunications operators currently licenced by BOCRA.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {OPERATORS.map((op, i) => (
            <motion.div
              key={op.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${op.color} w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shrink-0`}
                >
                  {op.initials}
                </div>
                <div>
                  <h3 className="font-black text-[#06193e] text-sm leading-tight mb-1">
                    {op.name}
                  </h3>
                  <span className="inline-block text-xs font-bold text-[#027ac6] bg-[#027ac6]/10 px-2 py-0.5 rounded-full mb-2">
                    {op.type}
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">{op.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Regulatory Areas */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-[#06193e] mb-2">Key Regulatory Areas</h2>
        <p className="text-gray-500 text-sm mb-6">
          BOCRA&rsquo;s core telecommunications regulatory functions.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {REGULATORY_AREAS.map((area, i) => (
            <motion.div
              key={area.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-[#027ac6]/30 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAFCFF] border border-gray-100 group-hover:bg-[#027ac6] group-hover:border-[#027ac6] flex items-center justify-center mb-4 transition-all">
                <area.icon className="w-5 h-5 text-[#027ac6] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-black text-[#06193e] text-sm mb-2">{area.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{area.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Licensing Framework highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-[#06193e] rounded-2xl p-7 text-white"
      >
        <div className="flex items-start gap-4">
          <Building2 className="w-8 h-8 text-[#75AADB] shrink-0 mt-1" />
          <div>
            <h3 className="font-black text-white text-lg mb-2">
              ICT Licensing Framework (Since 2015)
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Botswana migrated to a unified ICT Licensing Framework in 2015, replacing the
              previous system of sector-specific licences with three technology-neutral categories:
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "NFP", full: "Network Facilities Provider", desc: "Infrastructure owners and operators" },
                { label: "SAP", full: "Services & Applications Provider", desc: "Service and application providers" },
                { label: "CSP", full: "Content Services Provider", desc: "Broadcasting and content services" },
              ].map((cat) => (
                <div key={cat.label} className="bg-white/10 rounded-xl p-4">
                  <p className="font-black text-[#75AADB] text-lg">{cat.label}</p>
                  <p className="text-white text-xs font-bold mt-1">{cat.full}</p>
                  <p className="text-white/50 text-xs mt-1">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </InnerPageLayout>
  );
}
