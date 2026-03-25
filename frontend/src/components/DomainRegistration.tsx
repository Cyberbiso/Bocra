"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ArrowUpRight,
  Shield,
  Clock,
  DollarSign,
  Eye,
  Scale,
  Users,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const DOMAIN_EXTENSIONS = [
  { ext: ".co.bw", desc: "Commercial entities" },
  { ext: ".org.bw", desc: "Non-profit organisations" },
  { ext: ".ac.bw", desc: "Academic institutions" },
  { ext: ".net.bw", desc: "Network providers" },
  { ext: ".gov.bw", desc: "Government bodies" },
  { ext: ".shop.bw", desc: "E-commerce businesses" },
  { ext: ".agric.bw", desc: "Agricultural sector" },
  { ext: ".me.bw", desc: "Personal domains" },
];

const WHY_BW = [
  {
    icon: Eye,
    title: "Identifiable",
    desc: "Unique and locally relevant brand identity tied to Botswana.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: DollarSign,
    title: "Affordable",
    desc: "The registry does not charge accredited registrars maintenance fees.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Clock,
    title: "Timely",
    desc: "Queries resolved in 24 hours or less. Registrar accreditation within 7 working days.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    desc: "Protected with DNSSEC and Netcraft anti-phishing tools.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Users,
    title: "Trusted",
    desc: "Over 10,000 registered domains reflecting strong community growth.",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: Scale,
    title: "Fair",
    desc: "Registrations on a first-come, first-served basis with clear policy compliance.",
    color: "bg-rose-100 text-rose-700",
  },
];

const STATS = [
  { value: "10,000+", label: "Registered Domains" },
  { value: "70+", label: "Accredited Registrars" },
  { value: "8", label: "Domain Extensions" },
  { value: "24hrs", label: "Query Resolution" },
];

const REGISTRATION_STEPS = [
  "Do a WHOIS search to check domain name availability.",
  "Choose an accredited registrar to handle your registration.",
  "Provide your domain name, contact details, and customer ID.",
  "Optionally provide name servers, technical and billing contacts.",
  "Your registrar submits the request and your domain goes live.",
];

const FAQS = [
  {
    q: "What is a registrant?",
    a: "A registrant is an organisation or individual who registers a domain name. They are the owner of the domain.",
  },
  {
    q: "What is a registrar?",
    a: "A registrar is an accredited legal entity that handles domain name registrations on behalf of registrants. You must register through an accredited registrar — BOCRA does not accept registration requests directly from individuals.",
  },
  {
    q: "What domain names can I register?",
    a: "You can register any name that does not violate the .bw registration policy or infringe on existing trademarks. Available extensions include .co.bw, .org.bw, .ac.bw, .net.bw, .gov.bw, .shop.bw, .agric.bw, and .me.bw.",
  },
  {
    q: "How much does it cost?",
    a: "Pricing varies by registrar. Contact any of the 70+ accredited registrars for their current pricing. The registry itself does not charge registrars maintenance fees.",
  },
  {
    q: "How do I transfer or renew my domain?",
    a: "Contact your registrar directly for renewals. For transfers, you can retrieve an authorization code via the key retrieval process and provide it to your new registrar.",
  },
  {
    q: "How do I become an accredited registrar?",
    a: "Download the accreditation form from nic.net.bw, submit a complete application with required documents, and BOCRA will process it within a maximum of 7 working days.",
  },
];

const POLICIES = [
  "Domain Name Dispute Resolution Procedure",
  "Domain Name Dispute Resolution Policy",
  ".BW Registration Terms and Conditions",
  "Acceptable Use Policy (AUP)",
  "Registrar Accreditation Agreement (RAA)",
  "WHOIS Policy",
  "Domain Life Cycle Policy (DLP)",
];

export default function DomainRegistration() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="domain-registration" className="py-0 bg-white overflow-hidden">
      {/* Section header */}
      <div className="relative bg-teal-800 py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(60deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-teal-200 text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-teal-300" />
                Domain Services
              </p>
              <h2 className="text-4xl font-black text-white font-[family-name:var(--font-outfit)] leading-tight">
                Switch to
                <br />
                <span className="text-teal-200">.bw</span>
              </h2>
            </div>
            <p className="text-teal-100/70 max-w-sm text-sm leading-relaxed">
              Secure your Botswana internet identity. The .bw domain is managed
              by BOCRA as the trustee, administrator, and technical contact for
              Botswana&apos;s country-code top-level domain.
            </p>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-8 bg-white"
          style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-[#06193e] rounded-2xl p-6 text-center"
            >
              <p className="text-2xl md:text-3xl font-black text-teal-400 font-[family-name:var(--font-outfit)]">
                {s.value}
              </p>
              <p className="text-gray-400 text-xs font-medium mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Why .bw */}
        <div>
          <h3 className="text-2xl font-black text-[#06193e] font-[family-name:var(--font-outfit)] mb-6">
            Why Register a .bw Domain?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_BW.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#06193e] text-sm mb-1">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Domain extensions */}
        <div>
          <h3 className="text-2xl font-black text-[#06193e] font-[family-name:var(--font-outfit)] mb-2">
            .bw Domain Name Structure
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-2xl">
            Choose the extension that best fits your organisation. All .bw
            domains are registered through accredited registrars on a
            first-come, first-served basis.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DOMAIN_EXTENSIONS.map((d, i) => (
              <motion.div
                key={d.ext}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#06193e] rounded-xl p-4 text-center hover:bg-[#0d2a5e] transition-colors"
              >
                <p className="text-lg font-black text-teal-400 font-[family-name:var(--font-outfit)]">
                  {d.ext}
                </p>
                <p className="text-gray-400 text-xs mt-1">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The 3-R Model + How to Register */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3-R Model */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-black text-[#06193e] font-[family-name:var(--font-outfit)] mb-6">
              The 3-R Model
            </h3>
            <div className="space-y-4">
              {[
                {
                  role: "Registry",
                  desc: "The organisation charged with responsibility of managing the domain names database. BOCRA serves as the registry for all .bw domains.",
                  color: "border-l-teal-500 bg-teal-50/50",
                },
                {
                  role: "Registrar",
                  desc: "An entity accredited by BOCRA to implement domain registration activities. There are over 70 accredited registrars in Botswana.",
                  color: "border-l-blue-500 bg-blue-50/50",
                },
                {
                  role: "Registrant",
                  desc: "The organisation or individual registering domain names. This is the domain owner who registers through an accredited registrar.",
                  color: "border-l-violet-500 bg-violet-50/50",
                },
              ].map((r) => (
                <div
                  key={r.role}
                  className={`border-l-4 ${r.color} rounded-r-xl p-5`}
                >
                  <h4 className="font-bold text-[#06193e] text-base mb-1">
                    {r.role}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* How to register */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-black text-[#06193e] font-[family-name:var(--font-outfit)] mb-6">
              How to Register
            </h3>
            <div className="bg-[#06193e] rounded-2xl p-6 space-y-4">
              {REGISTRATION_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                    <span className="text-teal-400 text-sm font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed pt-1">
                    {step}
                  </p>
                </div>
              ))}
              <div className="pt-4 border-t border-white/10">
                <a
                  href="https://nic.net.bw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  Purchase a Domain
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Policies */}
        <div>
          <h3 className="text-2xl font-black text-[#06193e] font-[family-name:var(--font-outfit)] mb-6">
            Policies & Governance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POLICIES.map((p) => (
              <div
                key={p}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-teal-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-sm font-medium text-[#06193e]">{p}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-xs mt-3">
            Full policy documents are available at{" "}
            <a
              href="https://nic.net.bw/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline"
            >
              nic.net.bw
            </a>
          </p>
        </div>

        {/* FAQs */}
        <div>
          <h3 className="text-2xl font-black text-[#06193e] font-[family-name:var(--font-outfit)] mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-2 max-w-3xl">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-[#06193e] text-sm pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Registrar accreditation + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Become a Registrar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-2xl p-8"
          >
            <h3 className="text-xl font-black text-[#06193e] font-[family-name:var(--font-outfit)] mb-4">
              Become an Accredited Registrar
            </h3>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Entities can apply to become accredited .bw domain registrars.
              The process takes a maximum of 7 working days.
            </p>
            <div className="space-y-2.5 mb-6">
              {[
                "Download the accreditation form from nic.net.bw",
                "Submit complete application with required documents",
                "BOCRA processes within 7 working days",
                "Verified applicants receive accreditation",
              ].map((step) => (
                <div key={step} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-600">{step}</span>
                </div>
              ))}
            </div>
            <a
              href="https://nic.net.bw/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-700 font-bold text-sm hover:underline"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#06193e] rounded-2xl p-8"
          >
            <h3 className="text-xl font-black text-white font-[family-name:var(--font-outfit)] mb-4">
              Contact the Registry
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              For queries about .bw domain registration, accreditation, or
              policy, reach out to the BOCRA registry team.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <a
                    href="mailto:registry@bocra.org.bw"
                    className="text-white text-sm font-medium hover:text-teal-300 transition-colors"
                  >
                    registry@bocra.org.bw
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Phone</p>
                  <a
                    href="tel:+2673957755"
                    className="text-white text-sm font-medium hover:text-teal-300 transition-colors"
                  >
                    +267 395 7755
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Address</p>
                  <p className="text-white text-sm font-medium">
                    Plot 50671, Independence Avenue, Gaborone
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-500 text-xs mb-3 font-medium uppercase tracking-widest">
                Affiliations
              </p>
              <div className="flex flex-wrap gap-2">
                {["ICANN", "IANA", "AFRINIC", "AfTLD", "IGF"].map((org) => (
                  <span
                    key={org}
                    className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs font-medium"
                  >
                    {org}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
