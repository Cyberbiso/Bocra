"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import Image from "next/image";

const ABOUT_LINKS = [
  { label: "Profile", href: "/about/profile" },
  { label: "Word from the CEO", href: "/about/chief-executive" },
  { label: "History", href: "/about/history" },
  { label: "Board of Directors", href: "/about/board" },
  { label: "Executive Management", href: "/about/executive", active: true },
  { label: "Careers", href: "/about/careers" },
];

const EXCO = [
  {
    name: "Martin Mokgware",
    title: "Chief Executive",
    photo: "/people/mokgware.jpg",
    initials: "MM",
    accentColor: "bg-[#06193e]",
    desc: "Leads BOCRA as the principal executive officer, responsible for implementing Board decisions, managing the day-to-day operations of the Authority, and representing BOCRA at national and international forums including the ITU.",
    expertise: ["Regulatory Leadership", "ICT Policy", "International Relations"],
  },
  {
    name: "Director of Engineering",
    title: "Director: Engineering & Spectrum Management",
    photo: null,
    initials: "ES",
    accentColor: "bg-[#1B75BB]",
    desc: "Oversees spectrum management, type approval, QoS monitoring, and all technical regulatory functions across telecommunications and broadcasting sectors.",
    expertise: ["Spectrum Management", "Type Approval", "QoS Monitoring"],
  },
  {
    name: "Director of Legal",
    title: "Director: Legal & Compliance",
    photo: null,
    initials: "LC",
    accentColor: "bg-[#872030]",
    desc: "Manages BOCRA's legal affairs, licensing compliance, enforcement of regulatory obligations, and legal representation in regulatory proceedings.",
    expertise: ["Regulatory Law", "Licensing", "Compliance Enforcement"],
  },
  {
    name: "Director of Finance",
    title: "Director: Finance & Administration",
    photo: null,
    initials: "FA",
    accentColor: "bg-[#1C6B3C]",
    desc: "Responsible for financial management, annual budgeting, administration, and oversight of the Universal Access and Service Fund (UASF).",
    expertise: ["Financial Management", "UASF", "Administration"],
  },
  {
    name: "Director of Consumer Affairs",
    title: "Director: Consumer Affairs",
    photo: null,
    initials: "CA",
    accentColor: "bg-[#D4921A]",
    desc: "Oversees consumer protection programmes, complaints resolution management, public awareness campaigns, and stakeholder engagement.",
    expertise: ["Consumer Protection", "Complaints Management", "Public Education"],
  },
];

export default function ExecutivePage() {
  return (
    <InnerPageLayout
      section="About"
      title="Executive Management"
      breadcrumbs={[{ label: "About", href: "/about" }, { label: "Executive Management", href: "/about/executive" }]}
      sidebarLinks={ABOUT_LINKS}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            BOCRA&apos;s executive management team is responsible for the day-to-day operations of the Authority,
            implementing the strategic direction set by the Board of Directors, and ensuring effective delivery
            of BOCRA&apos;s regulatory mandate across telecommunications, broadcasting, postal, and internet sectors.
          </p>
        </div>

        {/* CEO — featured */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#06193e] rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative sm:w-56 h-64 sm:h-auto shrink-0">
              <Image
                src="/people/mokgware.jpg"
                alt="Martin Mokgware"
                fill
                className="object-cover"
                style={{ objectPosition: "center 8%" }}
                sizes="(max-width: 640px) 100vw, 224px"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#06193e] via-transparent to-transparent sm:bg-linear-to-r sm:from-transparent sm:to-[#06193e]" />
            </div>
            <div className="p-7 flex flex-col justify-center">
              <span className="text-[#D4921A] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Chief Executive Officer</span>
              <h3 className="text-2xl font-black text-white mb-1">Martin Mokgware</h3>
              <p className="text-[#75AADB] text-sm font-semibold mb-4">Chief Executive · BOCRA</p>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Leads BOCRA as the principal executive officer, responsible for implementing Board decisions,
                managing day-to-day operations of the Authority, and representing BOCRA at national and
                international forums including the ITU and SADC Regulators&apos; Association.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Regulatory Leadership", "ICT Policy", "International Relations"].map((e) => (
                  <span key={e} className="text-xs font-semibold bg-white/10 text-[#75AADB] px-2.5 py-1 rounded-full">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Directors — grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {EXCO.slice(1).map((exec, i) => (
            <motion.div
              key={exec.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              {/* Coloured initials avatar (no photo available for directors) */}
              <div className={`${exec.accentColor} w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0`}>
                {exec.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Executive Director</p>
                <h3 className="font-black text-[#06193e] text-base leading-tight">{exec.name}</h3>
                <p className="text-[#027ac6] text-sm font-bold mb-2">{exec.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{exec.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {exec.expertise.map((e) => (
                    <span key={e} className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </InnerPageLayout>
  );
}
