"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, MessageSquare, ExternalLink } from "lucide-react";

const NEWS = [
  {
    tag: "Regulatory",
    tagColor: "bg-[#1B75BB]/10 text-[#1B75BB]",
    title: "Botswana Secures Breakthrough SADC Roaming Charges Reduction",
    excerpt:
      "BOCRA collaborated with Lesotho, Malawi, Mozambique, Zambia, and Zimbabwe to reduce and harmonise cross-border roaming tariffs under the SADC One Network Area framework. Data roaming rates between Botswana and Zambia reduced by up to 94%.",
    date: "12 March 2026",
    readTime: "4 min read",
    href: "https://cajnewsafrica.com/2026/03/12/botswana-secures-breakthrough-sadc-roaming-charges-reduction/",
    external: true,
    highlight: true,
    badge: "New",
  },
  {
    tag: "Cybersecurity",
    tagColor: "bg-[#872030]/10 text-[#872030]",
    title: "BOCRA Hosts Inaugural Botswana National Cyber Drill 2026",
    excerpt:
      "BOCRA conducted Botswana's first National Cyber Drill under the theme \"Cyber Resilience in Action\", in collaboration with FIRST — the global organisation for computer security incident response teams.",
    date: "26 February 2026",
    readTime: "3 min read",
    href: "https://cajnewsafrica.com/2026/02/26/botswana-conducts-cyber-resilience-drill/",
    external: true,
  },
  {
    tag: "Consumer",
    tagColor: "bg-[#1C6B3C]/10 text-[#1C6B3C]",
    title: "BOCRA Approves Reduced Data Prices for BTC Customers",
    excerpt:
      "BOCRA has approved revised data tariffs for Botswana Telecommunications Corporation (BTC), providing customers with more data at the same or lower price points, including new one-day bundles.",
    date: "February 2026",
    readTime: "2 min read",
    href: "https://www.bwtechzone.com/2026/02/bocra-approves-reduced-data-prices-for.html",
    external: true,
  },
  {
    tag: "Consultation",
    tagColor: "bg-teal-100 text-teal-700",
    title: "ICT Policy Framework 2025–2030: Public Consultation Open",
    excerpt:
      "BOCRA invites all stakeholders and members of the public to submit comments on the proposed national ICT Policy Framework. The framework sets Botswana's digital agenda for the next five years.",
    date: "12 March 2026",
    readTime: "3 min read",
    deadline: "30 April 2026",
    href: "/consultations",
    highlight: false,
  },
  {
    tag: "Partnership",
    tagColor: "bg-violet-100 text-violet-700",
    title: "Group-IB and BOCRA Sign MoU to Strengthen Botswana's Cybersecurity",
    excerpt:
      "Singapore-based cybersecurity firm Group-IB has entered a formal partnership with BOCRA to enhance digital threat resilience across Botswana's communications sector.",
    date: "September 2025",
    readTime: "3 min read",
    href: "https://www.itnewsafrica.com/2025/09/group-ib-and-bocra-join-forces-to-strengthen-botswanas-cybersecurity/",
    external: true,
  },
];

const CONSULTATIONS = [
  {
    title: "ICT Policy Framework 2025–2030",
    deadline: "30 April 2026",
    status: "Open",
    responses: 47,
  },
  {
    title: "Draft Spectrum Pricing Regulations",
    deadline: "15 May 2026",
    status: "Open",
    responses: 12,
  },
];

// SVG social icons
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function NewsSection() {
  return (
    <section id="consultations" className="py-20 bg-[#FAFCFF] border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* News Column */}
          <div className="lg:col-span-2">
            <div className="flex items-end justify-between mb-8">
              <div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="inline-block px-4 py-1.5 rounded-full bg-[#027ac6]/10 text-[#027ac6] text-xs font-bold uppercase tracking-widest mb-3"
                >
                  Latest Updates
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 }}
                  className="text-3xl font-bold text-[#06193e] font-[family-name:var(--font-outfit)]"
                >
                  News & Announcements
                </motion.h2>
              </div>
              <Link
                href="/media"
                className="hidden sm:flex items-center gap-1 text-[#027ac6] text-sm font-bold hover:gap-2 transition-all"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {NEWS.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07 }}
                >
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <NewsCard item={item} />
                    </a>
                  ) : (
                    <Link href={item.href} className="group block">
                      <NewsCard item={item} />
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Active Consultations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#06193e] rounded-3xl p-6 text-white"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h3 className="font-bold text-lg">Active Consultations</h3>
              </div>

              <div className="space-y-4 mb-6">
                {CONSULTATIONS.map((c) => (
                  <div key={c.title} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm leading-snug">{c.title}</p>
                      <span className="bg-green-400/20 text-green-300 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-blue-200 text-xs mb-2">
                      Closes: <strong className="text-white">{c.deadline}</strong>
                    </p>
                    <div className="flex items-center gap-1 text-blue-300 text-xs">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {c.responses} responses received
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/consultations"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#027ac6] hover:bg-[#005ea6] text-white font-bold text-sm transition-colors"
              >
                Submit Your Comment
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-bold text-sm mb-4">Quick Links</h4>
                <div className="space-y-2">
                  {[
                    { label: "Annual Report 2024", href: "/documents" },
                    { label: "Legislation & Regulations", href: "/mandate/legislation" },
                    { label: "Tenders", href: "/tenders" },
                    { label: "Careers at BOCRA", href: "/about/careers" },
                  ].map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center justify-between text-sm text-blue-200 hover:text-white transition-colors py-1"
                    >
                      {link.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Social Media Follow */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
            >
              <h3 className="font-black text-[#06193e] mb-1">Follow BOCRA</h3>
              <p className="text-gray-400 text-xs mb-5">Stay up to date with the latest regulatory news</p>

              <div className="space-y-3">
                <a
                  href="https://www.facebook.com/BTAbw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#1877F2]/30 hover:bg-[#1877F2]/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0">
                    <FacebookIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#06193e]">Facebook</p>
                    <p className="text-xs text-gray-400">47,272 followers</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#1877F2] transition-colors shrink-0" />
                </a>

                <a
                  href="https://x.com/BOCRAbw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-black/20 hover:bg-black/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0">
                    <XIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#06193e]">X (Twitter)</p>
                    <p className="text-xs text-gray-400">@BOCRAbw · 1,741 followers</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors shrink-0" />
                </a>

                <a
                  href="https://bw.linkedin.com/company/bta_3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#0A66C2]/30 hover:bg-[#0A66C2]/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0A66C2] flex items-center justify-center shrink-0">
                    <LinkedInIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#06193e]">LinkedIn</p>
                    <p className="text-xs text-gray-400">22,269 followers</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#0A66C2] transition-colors shrink-0" />
                </a>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}

function NewsCard({ item }: { item: (typeof NEWS)[0] }) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg ${
        item.highlight
          ? "border-[#027ac6]/30 shadow-md"
          : "border-gray-100 hover:border-[#027ac6]/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.tagColor}`}>
              {item.tag}
            </span>
            {"badge" in item && item.badge && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#D4921A] text-white">
                {item.badge}
              </span>
            )}
          </div>
          <h3 className="font-bold text-[#06193e] mb-2 group-hover:text-[#027ac6] transition-colors leading-snug">
            {item.title}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
            {item.excerpt}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-medium flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {item.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {item.readTime}
            </span>
            {"deadline" in item && item.deadline && (
              <span className="text-red-500 font-bold">
                Closes: {item.deadline}
              </span>
            )}
            {"external" in item && item.external && (
              <span className="flex items-center gap-1 text-gray-400">
                <ExternalLink className="w-3 h-3" /> External source
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#027ac6] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
      </div>
    </div>
  );
}
