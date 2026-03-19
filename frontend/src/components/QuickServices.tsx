"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  BarChart2,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Smartphone,
  MessageCircle,
} from "lucide-react";

export default function QuickServices() {
  return (
    <section className="py-0 bg-white overflow-hidden">
      {/* Section header with diagonal stripe */}
      <div className="relative bg-[#06193e] py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #75AADB 0, #75AADB 1px, transparent 0, transparent 50%)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[#75AADB] text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-[#75AADB]" />
                Citizen Services
              </p>
              <h2 className="text-4xl font-black text-white font-[family-name:var(--font-outfit)] leading-tight">
                What can we
                <br />
                <span className="text-[#75AADB]">help you with?</span>
              </h2>
            </div>
            <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
              From filing complaints to verifying licences — access all BOCRA services
              digitally, 24/7. No physical visit needed.
            </p>
          </div>
        </div>
        {/* Diagonal bottom cut */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} />
      </div>

      {/* Services grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* === Feature card: File a Complaint === */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 group"
          >
            <a href="#complaints" className="block h-full">
              <div className="relative h-full min-h-[280px] bg-[#872030] rounded-2xl p-8 overflow-hidden flex flex-col justify-between">
                {/* Background texture */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                {/* Large icon watermark */}
                <div className="absolute bottom-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageCircle className="w-40 h-40 text-white" />
                </div>

                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 font-[family-name:var(--font-outfit)]">
                    File a Complaint
                  </h3>
                  <p className="text-red-100 text-sm leading-relaxed max-w-xs">
                    Submit complaints about telecom, broadcasting, or postal operators.
                    Get a reference number instantly.
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-8">
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    24hr Response
                  </span>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <ArrowRight className="w-5 h-5 text-[#872030]" />
                  </div>
                </div>
              </div>
            </a>
          </motion.div>

          {/* Right column: 2x2 grid of smaller services */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Apply for Licence */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <a
                href="https://op-web.bocra.org.bw"
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <div className="h-full min-h-[130px] bg-[#06193e] rounded-2xl p-6 flex flex-col justify-between group-hover:bg-[#0d2a5e] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-[#75AADB]/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#75AADB]" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#75AADB] transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Apply for a Licence</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Telecom, broadcasting &amp; postal licences</p>
                  </div>
                </div>
              </a>
            </motion.div>

            {/* Verify a Licence */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="group"
            >
              <a
                href="https://customerportal.bocra.org.bw/OnlineLicenseVerification/verify"
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <div className="h-full min-h-[130px] bg-[#1C6B3C] rounded-2xl p-6 flex flex-col justify-between group-hover:bg-[#175730] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Verify a Licence</h3>
                    <p className="text-green-100/70 text-xs leading-relaxed">Instant licence validity check</p>
                  </div>
                </div>
              </a>
            </motion.div>

            {/* IMEI / Device Check */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <a href="#consumer-tools" className="block h-full">
                <div className="h-full min-h-[130px] bg-violet-950 rounded-2xl p-6 flex flex-col justify-between group-hover:bg-violet-900 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-violet-400/20 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="text-[10px] bg-violet-400/20 text-violet-300 font-bold px-2 py-0.5 rounded-full">IMEI</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Check Device Approval</h3>
                    <p className="text-violet-300/60 text-xs leading-relaxed">Real Luhn algorithm validation</p>
                  </div>
                </div>
              </a>
            </motion.div>

            {/* Live Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="group"
            >
              <a href="#statistics" className="block h-full">
                <div className="h-full min-h-[130px] bg-[#D4921A] rounded-2xl p-6 flex flex-col justify-between group-hover:bg-[#bc7f16] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-black/15 rounded-lg flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-[#06193e]" />
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#06193e] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#06193e] text-base mb-1">Live Statistics</h3>
                    <p className="text-[#06193e]/60 text-xs leading-relaxed">Market data, penetration &amp; QoS</p>
                  </div>
                </div>
              </a>
            </motion.div>
          </div>

          {/* === Bottom wide bar: Active Consultation CTA === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-12"
          >
            <div className="bg-[#FAFCFF] border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">2 Active</span>
                    <span className="text-xs text-gray-400">Public Consultations</span>
                  </div>
                  <p className="font-bold text-[#06193e] text-sm">
                    ICT Policy Framework 2025–2030 — Share your views before 30 April 2026
                  </p>
                </div>
              </div>
              <Link
                href="/consultations"
                className="shrink-0 flex items-center gap-2 bg-[#06193e] hover:bg-[#027ac6] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                Participate Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
