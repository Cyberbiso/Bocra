"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import {
  Target,
  Eye,
  Star,
  Layers,
  ShieldCheck,
  Users,
  TrendingUp,
  Globe,
  Heart,
  Award,
  Radio,
} from "lucide-react";

const SIDEBAR_LINKS = [
  { label: "Profile", href: "/about/profile", active: true },
  { label: "Word from the CEO", href: "/about/chief-executive" },
  { label: "History", href: "/about/history" },
  { label: "Board of Directors", href: "/about/board" },
  { label: "Executive Management", href: "/about/executive" },
  { label: "Careers", href: "/about/careers" },
];

const CORE_VALUES = [
  {
    icon: Award,
    name: "Excellence",
    description:
      "We deliver world-class regulatory services that meet and exceed international standards, ensuring Botswana's communications sector is competitive on a global stage.",
    color: "bg-[#027ac6]",
  },
  {
    icon: TrendingUp,
    name: "Proactiveness",
    description:
      "We adopt a forward-looking approach to regulation, anticipating industry trends and technological shifts to remain ahead of challenges before they arise.",
    color: "bg-[#06193e]",
  },
  {
    icon: ShieldCheck,
    name: "Integrity",
    description:
      "We uphold the highest standards of openness, honesty, and accountability in all our interactions with stakeholders, operators, and the public.",
    color: "bg-[#872030]",
  },
  {
    icon: Users,
    name: "People",
    description:
      "We invest in the continuous development of our employees, recognising that our people are our greatest asset and the foundation of our success.",
    color: "bg-[#75AADB]",
  },
];

const STRATEGIC_PILLARS = [
  { icon: TrendingUp, label: "Competition", desc: "Fostering fair market competition across all communications sectors" },
  { icon: Globe, label: "Universal Access & Service", desc: "Ensuring affordable access to communications services for all Batswana" },
  { icon: ShieldCheck, label: "Consumer Protection", desc: "Safeguarding the rights and interests of communications consumers" },
  { icon: Layers, label: "Resource Optimisation", desc: "Maximising efficiency in the use of spectrum and other scarce resources" },
  { icon: Users, label: "Talent Management", desc: "Building a skilled, motivated and capable regulatory workforce" },
  { icon: Heart, label: "Stakeholder Engagement", desc: "Partnering with industry, government and civil society for better outcomes" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export default function ProfilePage() {
  return (
    <InnerPageLayout
      section="About"
      title="About BOCRA"
      breadcrumbs={[
        { label: "About", href: "/about" },
        { label: "Profile", href: "/about/profile" },
      ]}
      sidebarLinks={SIDEBAR_LINKS}
    >
      {/* Intro hero band */}
      <div className="relative bg-[#06193e] rounded-2xl p-8 mb-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #75AADB 0, #75AADB 1px, transparent 0, transparent 50%)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#75AADB] rounded-full blur-[100px] opacity-10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#75AADB]/20 border border-[#75AADB]/30 flex items-center justify-center shrink-0">
            <Star className="w-8 h-8 text-[#75AADB]" />
          </div>
          <div>
            <p className="text-[#75AADB] text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Established 1 April 2013</p>
            <h2 className="text-2xl font-black text-white mb-2">
              Botswana Communications Regulatory Authority
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm max-w-2xl">
              BOCRA is an independent statutory body established under the{" "}
              <span className="text-[#75AADB] font-semibold">Communications Regulatory Authority Act, 2012</span>{" "}
              responsible for regulating telecommunications, broadcasting, postal services, and
              the management of the radio frequency spectrum and national numbering plan across Botswana.
            </p>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 pt-6">
          {[
            { value: "2013", label: "Year Established" },
            { value: "15+", label: "Licensed Operators" },
            { value: "4", label: "Sectors Regulated" },
            { value: "BTA", label: "Succeeded" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-black text-white">{item.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Context box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10">
        <p className="text-gray-600 leading-relaxed text-sm">
          BOCRA succeeded the Botswana Telecommunications Authority (BTA), which had regulated the
          sector since 1996. The creation of BOCRA marked a new era in Botswana&apos;s regulatory
          landscape, with a broader mandate encompassing the full spectrum of modern communications
          technologies — from spectrum management and type approval to internet governance and
          consumer protection.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-[#06193e] rounded-2xl p-7 text-white overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#027ac6]/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#027ac6]/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#75AADB]" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#75AADB]">
                Our Mission
              </span>
            </div>
            <p className="text-lg font-bold leading-relaxed text-white/90 italic">
              &ldquo;To regulate the Communications sector for the promotion of competition,
              innovation, consumer protection and universal access.&rdquo;
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-[#027ac6] rounded-2xl p-7 text-white overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white/70">
                Our Vision
              </span>
            </div>
            <p className="text-lg font-bold leading-relaxed text-white/90 italic">
              &ldquo;A connected and Digitally Driven Society.&rdquo;
            </p>
          </div>
        </motion.div>
      </div>

      {/* Core Values */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-[#06193e] mb-2">Core Values</h2>
        <p className="text-gray-500 text-sm mb-6">
          The principles that guide everything we do at BOCRA.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {CORE_VALUES.map((value, i) => (
            <motion.div
              key={value.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl ${value.color} flex items-center justify-center shrink-0`}
                >
                  <value.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-[#06193e] mb-1">{value.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{value.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Strategic Pillars */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-[#06193e] mb-2">Strategic Pillars</h2>
        <p className="text-gray-500 text-sm mb-6">
          The six pillars driving BOCRA&rsquo;s strategic agenda.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STRATEGIC_PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#027ac6]/30 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAFCFF] border border-gray-100 group-hover:bg-[#027ac6] group-hover:border-[#027ac6] flex items-center justify-center mb-3 transition-all">
                <pillar.icon className="w-5 h-5 text-[#027ac6] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-black text-[#06193e] text-sm mb-1">{pillar.label}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sectors regulated */}
      <div>
        <h2 className="text-2xl font-black text-[#06193e] mb-2">Sectors Regulated</h2>
        <p className="text-gray-500 text-sm mb-6">BOCRA oversees four pillars of Botswana&apos;s communications economy.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Telecommunications", color: "bg-[#1B75BB]", desc: "Regulates fixed, mobile, and data services including spectrum allocation and national numbering. Operators: Mascom, Orange, BTC.", icon: Globe },
            { label: "Broadcasting", color: "bg-[#872030]", desc: "Licenses radio and television broadcasters, enforces content standards and local content requirements.", icon: Radio },
            { label: "Postal Services", color: "bg-[#1C6B3C]", desc: "Regulates Botswana Post and courier operators, ensuring universal postal service obligations are met.", icon: Layers },
            { label: "Internet & ICT", color: "bg-[#D4921A]", desc: "Administers the .bw ccTLD, oversees bwCIRT (national cyber-security team) and electronic transactions.", icon: ShieldCheck },
          ].map((sector, i) => (
            <motion.div
              key={sector.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4"
            >
              <div className={`w-11 h-11 rounded-xl ${sector.color} flex items-center justify-center shrink-0`}>
                <sector.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-[#06193e] mb-1">{sector.label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{sector.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </InnerPageLayout>
  );
}
