"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { Package, ShieldCheck, Truck } from "lucide-react";

const MANDATE_LINKS = [
  { label: "Legislation", href: "/mandate/legislation" },
  { label: "Telecommunications", href: "/mandate/telecommunications" },
  { label: "Broadcasting", href: "/mandate/broadcasting" },
  { label: "Postal Services", href: "/mandate/postal", active: true },
  { label: "Internet & ICT", href: "/mandate/internet" },
  { label: "Licensing", href: "/mandate/licensing" },
];

const LICENCE_TYPES = [
  {
    icon: Package,
    color: "bg-[#06193e]",
    title: "Public Postal Operator (PPO)",
    term: "15-year licence term",
    holder: "Currently held by Botswana Postal Services Limited (Botswana Post)",
    desc: "The Designated Public Postal Operator is responsible for providing universal postal services nationwide — delivering ordinary mail to P.O. Boxes across Botswana at uniform tariffs.",
    obligations: ["Universal service obligation", "Nationwide P.O. Box delivery", "Uniform tariffs across all regions", "Reserved services for ordinary mail"],
  },
  {
    icon: Truck,
    color: "bg-[#027ac6]",
    title: "Commercial Postal Operator (CPO)",
    term: "10-year licence term",
    holder: "No limit on number of operators",
    desc: "Commercial Postal Operators provide courier and value-added services on a commercial basis, offering direct delivery services at market rates.",
    obligations: ["Courier and direct delivery services", "Value-added postal services", "Commercial tariff setting", "No universal service obligation"],
  },
];

export default function PostalPage() {
  return (
    <InnerPageLayout
      section="Mandate"
      title="Postal Services"
      breadcrumbs={[{ label: "Mandate", href: "/mandate" }, { label: "Postal Services", href: "/mandate/postal" }]}
      sidebarLinks={MANDATE_LINKS}
    >
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed mb-4">
            Under the Communications Regulatory Authority Act, 2012, BOCRA was given oversight of the postal
            services sector. The CRA Act prohibits any person from providing postal services in Botswana
            without a valid licence issued by BOCRA.
          </p>
          <p className="text-gray-600 leading-relaxed">
            BOCRA ensures safe, reliable, efficient, and affordable postal services throughout Botswana by
            establishing regulatory frameworks including the Postal Sector Licensing Framework and Licence
            Application Requirements, assessed and implemented in August 2015.
          </p>
        </div>

        {/* Market Structure */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#027ac6]/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#027ac6]" />
            </div>
            <h2 className="text-2xl font-black text-[#06193e]">Postal Market Structure</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">The postal sector is divided into two service categories:</p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { n: "1", title: "Ordinary Mail / Universal Postal Services", desc: "Nation-wide delivery to P.O. Boxes by the Designated Public Postal Operator (Botswana Post). Subject to uniform tariffs." },
              { n: "2", title: "Courier / Value-Added Services", desc: "Direct delivery on a commercial basis by Commercial Postal Operators. Includes express, tracked, and specialised services." },
            ].map((cat) => (
              <div key={cat.n} className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-[#06193e] text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">{cat.n}</div>
                <div>
                  <h3 className="font-bold text-[#06193e] mb-1 text-sm">{cat.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Licence Types */}
        <div className="grid md:grid-cols-2 gap-5">
          {LICENCE_TYPES.map((lic, i) => (
            <motion.div
              key={lic.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className={`${lic.color} p-6`}>
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-4">
                  <lic.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">{lic.title}</h3>
                <p className="text-white/70 text-sm">{lic.term}</p>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Current Holder</p>
                <p className="text-sm font-semibold text-[#06193e] mb-4">{lic.holder}</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{lic.desc}</p>
                <ul className="space-y-1.5">
                  {lic.obligations.map((o) => (
                    <li key={o} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-1 h-1 rounded-full bg-[#027ac6] shrink-0" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </InnerPageLayout>
  );
}
