"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";

const ABOUT_LINKS = [
  { label: "Profile", href: "/about/profile" },
  { label: "Word from the CEO", href: "/about/chief-executive" },
  { label: "History", href: "/about/history", active: true },
  { label: "Board of Directors", href: "/about/board" },
  { label: "Executive Management", href: "/about/executive" },
  { label: "Careers", href: "/about/careers" },
];

const TIMELINE = [
  { year: "1996", title: "Telecommunications Act & BTA Established", desc: "The Telecommunications Act was approved, establishing the Botswana Telecommunications Authority (BTA). Market liberalisation of the telecommunications sector began, opening Botswana to competition." },
  { year: "1997", title: "Mobile Procurement Tender", desc: "BTA was set up with assistance from the Swedish Management Group. A mobile service procurement tender was published, paving the way for competitive mobile services." },
  { year: "1998", title: "First Mobile Licences", desc: "Competition commenced with the award of the first fifteen-year mobile licences to Mascom Wireless (Pty) Ltd and Vista Cellular (now Orange Botswana), transforming the mobile landscape." },
  { year: "1999", title: "Radio & Internet Liberalisation", desc: "The first commercial FM radio stations were licensed — Yarona FM and Gabz-FM. Initial Internet Service Provider (ISP) licences were also awarded, marking the beginning of Botswana's internet era." },
  { year: "2000", title: "BTA Relocation & National Roaming", desc: "BTA relocated to its permanent office. The TRASA Programme office was hosted. National roaming was suspended as network infrastructure matured." },
  { year: "2001", title: "Seven-Digit Numbering & ITU Recognition", desc: "The seven-digit numbering plan was implemented nationwide. The ITU declared BTA a best-practice regulatory model — international recognition of Botswana's regulatory excellence." },
  { year: "2003", title: "BTC Licenced", desc: "The Botswana Telecommunications Corporation (BTC) was granted a 15-year licence. Interconnection guidelines were issued to govern fair access between operators." },
  { year: "2007", title: "Service-Neutral Licensing", desc: "Service-neutral licensing was introduced, allowing greater flexibility for operators. beMOBILE was created as BTC's mobile subsidiary, increasing competition in the mobile market." },
  { year: "2012", title: "CRA Act — Converged Regulation", desc: "The Communications Regulatory Authority Act 2012 was passed, mandating converged regulation of all communications sectors under a single authority." },
  { year: "2013", title: "BOCRA Established", desc: "BOCRA officially came into existence on 1 April 2013, replacing BTA. BTC's structural separation created BoFiNet as the wholesale infrastructure provider, promoting open access." },
  { year: "2014", title: "Universal Access Fund", desc: "The Universal Access and Service Fund was created, alongside the Electronic Records and Communications Acts — cementing Botswana's legal framework for digital transactions and evidence." },
  { year: "2015", title: "New ICT Licensing Framework", desc: "BOCRA implemented a new converged ICT Licensing Framework, introducing technology-neutral categories: Network Facilities Provider (NFP), Services and Applications Provider (SAP), and Content Services Provider (CSP)." },
  { year: "2016", title: "Africa Internet Summit", desc: "Botswana hosted the Africa Internet Summit. BOCRA fully implemented the new licensing framework across all sectors, completing the modernisation of communications regulation." },
];

export default function HistoryPage() {
  return (
    <InnerPageLayout
      section="About"
      title="History of Communication Regulation"
      breadcrumbs={[{ label: "About", href: "/about" }, { label: "History", href: "/about/history" }]}
      sidebarLinks={ABOUT_LINKS}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            Botswana's communications regulatory journey began in 1996 and has evolved into one of
            Africa's most respected regulatory frameworks. From the establishment of the Botswana
            Telecommunications Authority to the creation of BOCRA, the sector has undergone
            continuous modernisation to keep pace with the rapidly evolving ICT landscape.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#06193e] via-[#027ac6] to-[#75AADB]" />

          <div className="space-y-4">
            {TIMELINE.map((event, i) => (
              <motion.div
                key={event.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-6"
              >
                {/* Year bubble */}
                <div className="shrink-0 w-14 h-14 rounded-full bg-[#06193e] text-white flex flex-col items-center justify-center text-center shadow-lg z-10">
                  <span className="text-[10px] font-black text-[#75AADB] leading-none">{event.year}</span>
                </div>

                {/* Content card */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-1 hover:border-[#027ac6]/30 transition-colors">
                  <h3 className="font-black text-[#06193e] mb-1.5">{event.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{event.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
}
