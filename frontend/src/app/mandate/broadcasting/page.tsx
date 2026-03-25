"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { motion } from "framer-motion";
import { Radio, Tv, Music, Users, ShieldCheck, MapPin, Star } from "lucide-react";

const SIDEBAR_LINKS = [
  { label: "Legislation", href: "/mandate/legislation" },
  { label: "Telecommunications", href: "/mandate/telecommunications" },
  { label: "Broadcasting", href: "/mandate/broadcasting", active: true },
  { label: "Postal Services", href: "/mandate/postal" },
  { label: "Internet & ICT", href: "/mandate/internet" },
  { label: "Licensing", href: "/mandate/licensing" },
];

const RADIO_STATIONS = [
  {
    name: "Yarona FM",
    type: "Commercial Radio",
    color: "bg-[#027ac6]",
    initials: "YF",
    description: "One of Botswana's most popular commercial radio stations, licensed since 1999. Broadcasts music, entertainment, and news content targeting a broad audience nationwide.",
    frequency: "106.6 FM",
  },
  {
    name: "Duma FM",
    type: "Commercial Radio",
    color: "bg-[#06193e]",
    initials: "DF",
    description: "Commercial FM station broadcasting news, current affairs, and entertainment. Known for its Setswana-language programming promoting local culture and content.",
    frequency: "Various FM",
  },
  {
    name: "Gabz FM",
    type: "Commercial Radio",
    color: "bg-[#c61e53]",
    initials: "GF",
    description: "Gaborone-based commercial radio station licensed in 1999. Broadcasts a mix of local and international music with news programming for the greater Gaborone area.",
    frequency: "96.2 FM",
  },
];

const TV_CONTENT = [
  {
    name: "eBotswana",
    type: "Commercial Television",
    color: "bg-emerald-700",
    initials: "eB",
    description:
      "Botswana's first licensed commercial television broadcaster. Operates a UHF terrestrial signal covering approximately 60km radius from Gaborone. eBotswana has plans to expand nationally via satellite, which would make it the first free-to-air commercial TV service with national coverage.",
    coverage: "Gaborone metropolitan area (~60km radius)",
  },
];

const REGULATORY_OBLIGATIONS = [
  {
    icon: Music,
    title: "Local Content Quota",
    description:
      "Licensed broadcasters must promote local artists and Batswana culture. The broadcasting regulations set minimum quotas for locally produced content, ensuring Botswana's creative industry benefits from broadcast exposure.",
  },
  {
    icon: Users,
    title: "Consumer Protection",
    description:
      "BOCRA ensures broadcasters adhere to programming standards that protect consumers, including content classification, advertising standards, and complaint handling procedures.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Monitoring",
    description:
      "Regular monitoring of broadcast content ensures compliance with licence conditions, including local content requirements, advertising time limits, and prohibited content regulations.",
  },
  {
    icon: MapPin,
    title: "Coverage Obligations",
    description:
      "Broadcasters are required to maintain minimum coverage areas as specified in their licence conditions, ensuring their services reach the communities for which they are licensed.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export default function BroadcastingPage() {
  return (
    <InnerPageLayout
      section="Mandate"
      title="Broadcasting Regulation"
      breadcrumbs={[
        { label: "Mandate", href: "/mandate" },
        { label: "Broadcasting", href: "/mandate/broadcasting" },
      ]}
      sidebarLinks={SIDEBAR_LINKS}
    >
      {/* Intro */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#06193e] flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-[#75AADB]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#06193e] mb-3">
              Broadcasting Regulation
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              BOCRA is responsible for the regulation of broadcasting in Botswana under the{" "}
              <strong className="text-[#06193e]">
                Communications Regulatory Authority Act, 2012
              </strong>
              . The Authority oversees commercial broadcasting services, including private
              FM radio stations and commercial television, while state broadcasting (Botswana
              Radio and Botswana Television — BTV) falls under the oversight of the state.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Broadcasting licences are issued as Content Services Provider (CSP) licences
              under the unified ICT Licensing Framework. BOCRA ensures that all broadcasters
              comply with their licence conditions, including local content requirements,
              programming standards, and technical obligations.
            </p>
          </div>
        </div>
      </div>

      {/* Key policy highlight */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-linear-to-r from-[#06193e] to-[#027ac6] rounded-2xl p-6 mb-8 text-white"
      >
        <div className="flex items-start gap-4">
          <Star className="w-7 h-7 text-[#75AADB] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-white mb-2">Local Artist Promotion Policy</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              A cornerstone of Botswana&rsquo;s broadcasting policy is the requirement that
              all licensed broadcasters actively promote local artists and Batswana cultural
              content. This policy supports the growth of the local creative industry and
              ensures that Botswana&rsquo;s cultural heritage is celebrated and preserved
              through broadcasting platforms.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Radio Stations */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-[#06193e] mb-2">
          Licensed Commercial Radio Stations
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Commercial FM radio broadcasters licenced and regulated by BOCRA.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {RADIO_STATIONS.map((station, i) => (
            <motion.div
              key={station.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`${station.color} w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shrink-0`}
                >
                  {station.initials}
                </div>
                <div>
                  <h3 className="font-black text-[#06193e]">{station.name}</h3>
                  <p className="text-xs text-[#027ac6] font-bold">{station.frequency}</p>
                </div>
              </div>
              <span className="inline-block text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full mb-3">
                {station.type}
              </span>
              <p className="text-xs text-gray-500 leading-relaxed">{station.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* TV */}
      <div className="mb-10">
        <h2 className="text-2xl font-black text-[#06193e] mb-2">
          Licensed Commercial Television
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Commercial television broadcasters operating in Botswana.
        </p>
        {TV_CONTENT.map((station, i) => (
          <motion.div
            key={station.name}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div
                className={`${station.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0`}
              >
                {station.initials}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-black text-[#06193e] text-lg">{station.name}</h3>
                  <Tv className="w-4 h-4 text-[#027ac6]" />
                </div>
                <span className="inline-block text-xs font-bold text-[#027ac6] bg-[#027ac6]/10 px-2.5 py-1 rounded-full mb-3">
                  {station.type}
                </span>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                  {station.description}
                </p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#c61e53]" />
                  <p className="text-xs font-bold text-gray-500">{station.coverage}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Regulatory Obligations */}
      <div>
        <h2 className="text-2xl font-black text-[#06193e] mb-2">
          Broadcaster Obligations
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Key regulatory obligations applicable to all BOCRA-licenced broadcasters.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {REGULATORY_OBLIGATIONS.map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-[#027ac6]/30 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAFCFF] border border-gray-100 group-hover:bg-[#027ac6] group-hover:border-[#027ac6] flex items-center justify-center mb-4 transition-all">
                <item.icon className="w-5 h-5 text-[#027ac6] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-black text-[#06193e] text-sm mb-2">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </InnerPageLayout>
  );
}
