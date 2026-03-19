"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { Calendar, ExternalLink, Mic, Newspaper, Megaphone, ArrowRight } from "lucide-react";
import Link from "next/link";

const MEDIA_LINKS = [
  { label: "All News", href: "/media", active: true },
  { label: "Press Releases", href: "/media#press-releases" },
  { label: "Speeches", href: "/media#speeches" },
  { label: "Tenders", href: "/tenders" },
];

const PRESS_RELEASES = [
  {
    title: "Botswana Collaborates with Five SADC Member States to Reduce International Roaming Tariffs",
    date: "12 March 2026",
    category: "International",
    categoryColor: "bg-[#1B75BB]/10 text-[#1B75BB]",
    excerpt: "BOCRA, in collaboration with regulators from Lesotho, Malawi, Mozambique, Zambia, and Zimbabwe, has agreed to substantially reduce and harmonise international roaming tariffs under the SADC One Network Area framework. Data roaming rates between Botswana and Zambia reduced by up to 94%.",
    href: "https://cajnewsafrica.com/2026/03/12/botswana-secures-breakthrough-sadc-roaming-charges-reduction/",
    external: true,
  },
  {
    title: "BOCRA Hosts Inaugural Botswana National Cyber Drill 2026",
    date: "26 February 2026",
    category: "Cybersecurity",
    categoryColor: "bg-[#872030]/10 text-[#872030]",
    excerpt: "BOCRA conducted Botswana's first National Cyber Drill under the theme 'Cyber Resilience in Action', in collaboration with FIRST — the global organisation for computer security incident response teams. The drill tested national incident response capabilities across critical communications infrastructure.",
    href: "https://cajnewsafrica.com/2026/02/26/botswana-conducts-cyber-resilience-drill/",
    external: true,
  },
  {
    title: "BOCRA Approves Reduced Data Prices for BTC Customers",
    date: "February 2026",
    category: "Consumer",
    categoryColor: "bg-[#1C6B3C]/10 text-[#1C6B3C]",
    excerpt: "BOCRA has approved revised data tariffs for Botswana Telecommunications Corporation (BTC), providing customers with more data at the same or lower price points, alongside the introduction of new flexible one-day data bundles.",
    href: "https://www.bwtechzone.com/2026/02/bocra-approves-reduced-data-prices-for.html",
    external: true,
  },
  {
    title: "BOCRA Invites Applications: ITA Commercial Broadcasting Radio Station Licence",
    date: "January 2026",
    category: "Licensing",
    categoryColor: "bg-violet-100 text-violet-700",
    excerpt: "BOCRA invites suitably qualified entities to apply for an Individual Tradable Assignment (ITA) commercial broadcasting radio station licence. Applications must comply with the Broadcasting Act and BOCRA's licensing framework.",
    href: "https://www.bocra.org.bw",
    external: true,
  },
  {
    title: "Cyble and BOCRA Sign MoU to Advance National Cybersecurity in Botswana",
    date: "November 2025",
    category: "Partnership",
    categoryColor: "bg-[#D4921A]/10 text-[#D4921A]",
    excerpt: "Cyble, a leading AI-powered cyber threat intelligence company, has signed a Memorandum of Understanding with BOCRA to strengthen Botswana's national cybersecurity posture through threat intelligence sharing and capacity building.",
    href: "https://www.intelligentcio.com/africa/2025/11/21/cyble-and-botswana-communications-regulatory-authority-bocra-sign-mou-to-advance-national-cybersecurity-in-botswana/",
    external: true,
  },
  {
    title: "Group-IB and BOCRA Join Forces to Strengthen Botswana's Cybersecurity",
    date: "September 2025",
    category: "Partnership",
    categoryColor: "bg-[#D4921A]/10 text-[#D4921A]",
    excerpt: "Singapore-based cybersecurity firm Group-IB has entered a formal partnership with BOCRA to enhance digital threat resilience across Botswana's communications sector, with a focus on critical infrastructure protection.",
    href: "https://www.itnewsafrica.com/2025/09/group-ib-and-bocra-join-forces-to-strengthen-botswanas-cybersecurity/",
    external: true,
  },
  {
    title: "BOCRA Published Q4 2025 Telecom Market Statistics",
    date: "March 2026",
    category: "Statistics",
    categoryColor: "bg-gray-100 text-gray-600",
    excerpt: "The latest quarterly statistics show mobile internet penetration has reached 82.3% of the population, with a total of 3.2 million active SIM cards across all operators — a 4.1% increase year-on-year.",
    href: "https://www.bocra.org.bw",
    external: true,
  },
  {
    title: "Public Notice — BOCRA Website Development Hackathon",
    date: "March 2026",
    category: "Announcement",
    categoryColor: "bg-teal-100 text-teal-700",
    excerpt: "BOCRA invites developers and digital teams to participate in the official BOCRA Website Development Hackathon, aimed at modernising BOCRA's digital citizen services and public information platforms.",
    href: "/",
    external: false,
  },
];

const SPEECHES = [
  {
    speaker: "Martin Mokgware, CEO",
    title: "Welcome Remarks — DBS Memorandum of Agreement Signing Ceremony",
    context: "Remarks at the signing of the Memorandum of Agreement between the Universal Access and Service Fund (UASF) and the Department of Broadcasting Services (DBS).",
  },
  {
    speaker: "Martin Mokgware, CEO",
    title: "Keynote Address — QoS/QoE National Workshop",
    context: "Opening address at the national Quality of Service and Quality of Experience monitoring workshop for licensed telecommunications operators.",
  },
  {
    speaker: "Martin Mokgware, CEO",
    title: "Welcome Remarks — MoU Signing with University of Botswana",
    context: "Address at the signing of a cooperation agreement between BOCRA and the University of Botswana on ICT research and regulatory capacity building.",
  },
  {
    speaker: "Martin Mokgware, CEO",
    title: "Address to Broadcasters — National Broadcasting Conference",
    context: "Annual address to commercial and community broadcasters on BOCRA's regulatory priorities, content standards, and the digital switchover transition.",
  },
  {
    speaker: "Martin Mokgware, CEO",
    title: "Remarks — Spectrum Management Stakeholder Engagement",
    context: "Opening remarks at the national spectrum management stakeholder consultation, covering the National Radio Frequency Plan review.",
  },
  {
    speaker: "Martin Mokgware, CEO",
    title: "Welcome Remarks — Statistics Botswana ICT Survey Launch",
    context: "Remarks at the launch of the national ICT survey conducted in partnership with Statistics Botswana, covering household and enterprise connectivity.",
  },
];

export default function MediaPage() {
  return (
    <InnerPageLayout
      section="Media"
      title="News & Media Centre"
      breadcrumbs={[{ label: "Media", href: "/media" }]}
      sidebarLinks={MEDIA_LINKS}
    >
      <div className="space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            The BOCRA Media Centre provides press releases, speeches, regulatory announcements, and news
            about Botswana&apos;s communications sector. Subscribe to our social media channels for real-time updates.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: "Facebook · 47K followers", href: "https://www.facebook.com/BTAbw/", color: "bg-[#1877F2]" },
              { label: "X @BOCRAbw · 1.7K", href: "https://x.com/BOCRAbw", color: "bg-black" },
              { label: "LinkedIn · 22K followers", href: "https://bw.linkedin.com/company/bta_3", color: "bg-[#0A66C2]" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${s.color} text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity`}
              >
                {s.label} <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Press Releases */}
        <div id="press-releases">
          <div className="flex items-center gap-3 mb-5">
            <Newspaper className="w-5 h-5 text-[#06193e]" />
            <h2 className="text-xl font-black text-[#06193e]">Press Releases & Announcements</h2>
          </div>
          <div className="space-y-4">
            {PRESS_RELEASES.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="group block">
                    <PressCard item={item} />
                  </a>
                ) : (
                  <Link href={item.href} className="group block">
                    <PressCard item={item} />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Speeches */}
        <div id="speeches">
          <div className="flex items-center gap-3 mb-5">
            <Mic className="w-5 h-5 text-[#06193e]" />
            <h2 className="text-xl font-black text-[#06193e]">Speeches & Addresses</h2>
          </div>
          <div className="space-y-3">
            {SPEECHES.map((speech, i) => (
              <motion.div
                key={speech.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-[#06193e] flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-[#75AADB]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#027ac6] uppercase tracking-widest mb-0.5">{speech.speaker}</p>
                  <h3 className="font-black text-[#06193e] text-sm mb-1">{speech.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{speech.context}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <a
              href="https://www.bocra.org.bw/speeches"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#027ac6] hover:text-[#005ea6] transition-colors"
            >
              View all speeches on bocra.org.bw <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </InnerPageLayout>
  );
}

function PressCard({ item }: { item: (typeof PRESS_RELEASES)[0] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-[#027ac6]/20 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.categoryColor}`}>{item.category}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />{item.date}
            </span>
          </div>
          <h3 className="font-black text-[#06193e] mb-2 group-hover:text-[#027ac6] transition-colors leading-snug">{item.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{item.excerpt}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#027ac6] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
      </div>
    </div>
  );
}
