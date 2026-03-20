"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Globe,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import InnerPageLayout from "@/components/InnerPageLayout";
import ServicesCoverageMap from "@/components/ServicesCoverageMap";
import ServicesNmsSummary from "@/components/ServicesNmsSummary";

const SIDEBAR_LINKS = [
  { label: "Services Overview", href: "/services", active: true },
  { label: "Licence Verification", href: "/services/licence-verification" },
  { label: "Type Approval Certificates", href: "/services/type-approval" },
  { label: "Register .bw Domain", href: "/services/domain-registration" },
];

const SERVICE_CARDS = [
  {
    title: "Licence Verification",
    href: "/services/licence-verification",
    description: "Verify BOCRA-issued licences by operator, licence number, or licence type.",
    icon: ShieldCheck,
    className: "bg-[#1C6B3C] text-white",
    accentClassName: "bg-white/15 text-white",
  },
  {
    title: "Type Approval Certificates",
    href: "/services/type-approval",
    description: "Check if a handset or device is type-approved for use in Botswana.",
    icon: Smartphone,
    className: "bg-[#06193e] text-white",
    accentClassName: "bg-[#75AADB]/20 text-[#d8ecff]",
  },
  {
    title: "Register .bw Domain",
    href: "/services/domain-registration",
    description: "Learn how to register and manage .bw domain names through BOCRA.",
    icon: Globe,
    className: "bg-[#D4921A] text-[#06193e]",
    accentClassName: "bg-black/10 text-[#06193e]",
  },
  {
    title: "Live QoS Dashboard",
    href: "https://dqos.bocra.org.bw/",
    description: "Open the public DQOS dashboard for the full network quality experience.",
    icon: Activity,
    className: "bg-[#c61e53] text-white",
    accentClassName: "bg-white/15 text-white",
    external: true,
  },
];

export default function ServicesHub() {
  return (
    <InnerPageLayout
      section="Services"
      title="Digital Services and network coverage tools for Botswana."
      breadcrumbs={[{ label: "Services", href: "/services" }]}
      sidebarLinks={SIDEBAR_LINKS}
    >
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm shadow-[#06193e]/5"
        >
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#027ac6]">
                BOCRA Digital Services
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#06193e] sm:text-4xl">
                Live NMS provider insights, coverage search, and BOCRA services in one place.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
                The Services hub now pairs a live DQOS-style NMS summary for
                Mascom, Orange, and BTC with the interactive location explorer.
                Users can compare operators, jump to mapped boundaries, and move
                directly into BOCRA’s core digital services from one page.
              </p>
            </div>

            <div className="border-t border-gray-100 bg-[#f8fbff] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { value: "3", label: "Mobile operators in the live NMS summary" },
                  { value: "Live", label: "DQOS-backed national snapshot" },
                  { value: "Search", label: "Location-to-map focus experience" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.4rem] border border-[#75AADB]/20 bg-white px-5 py-4 shadow-sm"
                  >
                    <p className="text-2xl font-black text-[#06193e]">{stat.value}</p>
                    <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <ServicesNmsSummary />

        <ServicesCoverageMap />

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="grid gap-4 md:grid-cols-2"
        >
          {SERVICE_CARDS.map((card) => {
            const Icon = card.icon;

            const content = (
              <div
                className={`group h-full rounded-[1.8rem] p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 ${card.className}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accentClassName}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-5 w-5 opacity-70 transition-transform duration-200 group-hover:translate-x-1" />
                </div>

                <h3 className="mt-8 text-2xl font-black tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80">
                  {card.description}
                </p>
              </div>
            );

            if (card.external) {
              return (
                <a
                  key={card.title}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {content}
                </a>
              );
            }

            return (
              <Link key={card.title} href={card.href} className="block">
                {content}
              </Link>
            );
          })}
        </motion.section>
      </div>
    </InnerPageLayout>
  );
}
