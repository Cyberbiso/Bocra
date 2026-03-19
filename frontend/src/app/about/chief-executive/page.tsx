"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { Quote, Mail, Phone, Linkedin } from "lucide-react";

const SIDEBAR_LINKS = [
  { label: "Profile", href: "/about/profile" },
  { label: "Word from the CEO", href: "/about/chief-executive", active: true },
  { label: "History", href: "/about/history" },
  { label: "Board of Directors", href: "/about/board" },
  { label: "Executive Management", href: "/about/executive" },
  { label: "Careers", href: "/about/careers" },
];

export default function ChiefExecutivePage() {
  return (
    <InnerPageLayout
      section="About"
      title="Word from the Chief Executive"
      breadcrumbs={[
        { label: "About", href: "/about" },
        { label: "Word from the CEO", href: "/about/chief-executive" },
      ]}
      sidebarLinks={SIDEBAR_LINKS}
    >
      {/* CEO Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8"
      >
        <div className="h-2 bg-gradient-to-r from-[#06193e] via-[#027ac6] to-[#75AADB]" />
        <div className="p-7 md:p-9">
          <div className="flex flex-col md:flex-row gap-7 items-start">
            {/* Avatar placeholder */}
            <div className="shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-[#06193e] flex items-center justify-center shadow-lg shadow-[#06193e]/20">
                <span className="text-4xl font-black text-[#75AADB]">MM</span>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-[#027ac6]">Chief Executive Officer</p>
              </div>
            </div>

            {/* Name and title */}
            <div className="flex-1">
              <h2 className="text-2xl font-black text-[#06193e] mb-1">
                Mr. Martin Mokgware
              </h2>
              <p className="text-[#027ac6] font-bold text-sm mb-4">
                Chief Executive, BOCRA
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Mr. Martin Mokgware serves as the Chief Executive Officer of the Botswana
                Communications Regulatory Authority. He provides strategic leadership and
                oversight to the Authority in the execution of its mandate to regulate
                Botswana&rsquo;s communications sector.
              </p>
              <div className="flex items-center gap-4 mt-5">
                <a
                  href="mailto:info@bocra.org.bw"
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#027ac6] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> info@bocra.org.bw
                </a>
                <a
                  href="tel:+26739577551"
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#027ac6] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> +267 395-7755
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pull quote */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative bg-[#06193e] rounded-2xl p-8 mb-8 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#027ac6]/20 blur-3xl" />
        <Quote className="w-10 h-10 text-[#027ac6]/40 mb-4" />
        <p className="text-xl md:text-2xl font-bold text-white leading-relaxed italic relative z-10">
          &ldquo;Our ambition is to create a regulatory environment that empowers citizens,
          attracts investment, and positions Botswana as a connected, digitally-driven
          society at the forefront of African telecommunications.&rdquo;
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="w-8 h-0.5 bg-[#027ac6]" />
          <p className="text-[#75AADB] text-sm font-bold">Martin Mokgware, CEO</p>
        </div>
      </motion.div>

      {/* Full message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 md:p-9 space-y-5"
      >
        <h3 className="text-xl font-black text-[#06193e] border-b border-gray-100 pb-4">
          A Message from the Chief Executive
        </h3>

        <p className="text-gray-600 leading-relaxed text-sm">
          On behalf of the Botswana Communications Regulatory Authority, I welcome you to
          our improved website. This digital platform represents our commitment to
          transparency, accessibility, and stakeholder engagement — core principles that
          guide how BOCRA serves Botswana.
        </p>

        <p className="text-gray-600 leading-relaxed text-sm">
          Since our establishment on 1 April 2013, BOCRA has made significant strides in
          developing a robust regulatory framework for Botswana&rsquo;s communications
          sector. We have worked tirelessly to promote competition, drive innovation, protect
          consumers, and extend access to communications services to all corners of our
          nation.
        </p>

        <p className="text-gray-600 leading-relaxed text-sm">
          The communications landscape is rapidly evolving. Emerging technologies such as
          5G, the Internet of Things, artificial intelligence, and cloud computing are
          reshaping how we connect and communicate. BOCRA is committed to developing
          forward-looking policies and regulatory frameworks that enable Botswana to
          harness the opportunities that these technologies present.
        </p>

        <p className="text-gray-600 leading-relaxed text-sm">
          Central to our mission is the protection of consumers. We understand that
          Batswana deserve reliable, affordable, and high-quality communications services.
          Our consumer protection mandate ensures that operators meet their obligations,
          and that citizens have a fair and effective channel to raise concerns.
        </p>

        <p className="text-gray-600 leading-relaxed text-sm">
          I encourage all our stakeholders — industry players, civil society, government
          partners, and the public — to engage actively with BOCRA. Your input shapes our
          decisions and helps us build a communications environment that works for all
          Batswana.
        </p>

        <p className="text-gray-600 leading-relaxed text-sm">
          Together, we can achieve the vision of a connected and digitally driven Botswana.
        </p>

        <div className="pt-4 border-t border-gray-100">
          <p className="font-black text-[#06193e]">Martin Mokgware</p>
          <p className="text-[#027ac6] text-sm font-bold">Chief Executive</p>
          <p className="text-gray-400 text-xs mt-1">
            Botswana Communications Regulatory Authority
          </p>
        </div>
      </motion.div>
    </InnerPageLayout>
  );
}
