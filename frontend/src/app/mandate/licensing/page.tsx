"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { Wifi, Layers, Tv, Package, Truck, ArrowRight } from "lucide-react";

const MANDATE_LINKS = [
  { label: "Legislation", href: "/mandate/legislation" },
  { label: "Telecommunications", href: "/mandate/telecommunications" },
  { label: "Broadcasting", href: "/mandate/broadcasting" },
  { label: "Postal Services", href: "/mandate/postal" },
  { label: "Internet & ICT", href: "/mandate/internet" },
  { label: "Licensing", href: "/mandate/licensing", active: true },
];

const TELECOM_CATEGORIES = [
  { icon: Wifi, color: "bg-[#06193e]", title: "Network Facilities Provider (NFP)", desc: "Licensees own, operate, or provide physical infrastructure for carrying communications services. Includes fixed links, radio transmitters, satellites, fibre cables, towers, switches, and base stations." },
  { icon: Layers, color: "bg-[#027ac6]", title: "Services and Applications Provider (SAP)", desc: "Non-infrastructure providers delivering services based on speech, sound, data, text, and images to end users. Includes ISPs, mobile virtual network operators, and value-added service providers." },
  { icon: Tv, color: "bg-[#c61e53]", title: "Content Services Provider (CSP)", desc: "Providers offering content for broadcasting (TV and radio) and subscription video-on-demand services. Includes commercial radio stations, television broadcasters, and content distributors." },
];

const POSTAL_CATEGORIES = [
  { icon: Package, color: "bg-emerald-700", title: "Designated Postal Operator (DPO)", desc: "Carries universal postal service obligations. Delivers ordinary mail to P.O. Boxes nationwide at uniform tariffs. Currently: Botswana Post." },
  { icon: Truck, color: "bg-violet-700", title: "Commercial Postal Operator (CPO)", desc: "Provides courier, express, and value-added postal services on a commercial basis. No limit on number of operators. 10-year licence term." },
];

const LICENCE_TYPES = [
  "Aircraft Radio", "Amateur Radio", "Broadcasting", "Cellular",
  "Citizen Band Radio", "Point-to-Multipoint", "Point-to-Point",
  "Private Radio Communication", "Radio Dealers", "Radio Frequency",
  "Satellite Service", "Type Approval", "VANS",
];

export default function LicensingPage() {
  return (
    <InnerPageLayout
      section="Mandate"
      title="Licensing"
      breadcrumbs={[{ label: "Mandate", href: "/mandate" }, { label: "Licensing", href: "/mandate/licensing" }]}
      sidebarLinks={MANDATE_LINKS}
    >
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed mb-4">
            BOCRA is mandated by Section 6(h) of the CRA Act to "process applications for and issue licences,
            permits, permissions, concessions and authorities" for regulated sectors including telecommunications,
            internet, radio communications, broadcasting, and postal services.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Following a comprehensive review in 2015, BOCRA introduced a new converged ICT licensing framework
            designed to promote competition, technology neutrality, ease of market entry, consumer choice, and
            economic inclusion.
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-black text-[#06193e] mb-5">Telecommunications & Broadcasting Licences</h2>
          <div className="space-y-4">
            {TELECOM_CATEGORIES.map((cat, i) => (
              <motion.div key={cat.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
                <div className={`${cat.color} w-2 shrink-0`} />
                <div className="p-6 flex gap-4 items-start">
                  <div className={`${cat.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                    <cat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#06193e] mb-2">{cat.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{cat.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black text-[#06193e] mb-5">Postal Licences</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {POSTAL_CATEGORIES.map((cat, i) => (
              <motion.div key={cat.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className={`${cat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                  <cat.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-[#06193e] mb-2">{cat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-black text-[#06193e] mb-4">All Licence Types</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {LICENCE_TYPES.map((l) => (
              <span key={l} className="bg-[#027ac6]/8 text-[#027ac6] border border-[#027ac6]/20 px-3 py-1.5 rounded-full text-sm font-semibold">{l}</span>
            ))}
          </div>
          <a href="https://op-web.bocra.org.bw" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#06193e] hover:bg-[#027ac6] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors">
            Apply for a Licence <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </div>
    </InnerPageLayout>
  );
}
