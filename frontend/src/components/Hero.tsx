"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, ChevronRight, X, Wifi, Users, Radio, Globe } from "lucide-react";
import Link from "next/link";

type City = {
  name: string;
  x: number;
  y: number;
  main?: boolean;
  district: string;
  population: string;
  coverage4G: string;
  operators: string[];
  towers: number;
  internetPenetration: string;
  note: string;
};

const CITIES: City[] = [
  {
    name: "Gaborone",
    x: 265, y: 340, main: true,
    district: "South East District",
    population: "~280,000",
    coverage4G: "99%",
    operators: ["Mascom", "Orange", "BTC"],
    towers: 142,
    internetPenetration: "87%",
    note: "BOCRA Headquarters — Plot 50671, Independence Avenue. National 5G pilot zone.",
  },
  {
    name: "Francistown",
    x: 310, y: 165, main: true,
    district: "Francistown City",
    population: "~110,000",
    coverage4G: "98%",
    operators: ["Mascom", "Orange", "BTC"],
    towers: 58,
    internetPenetration: "79%",
    note: "Botswana's second city. Key northern commercial and logistics hub.",
  },
  {
    name: "Maun",
    x: 135, y: 145,
    district: "North West District",
    population: "~60,000",
    coverage4G: "89%",
    operators: ["Mascom", "Orange"],
    towers: 31,
    internetPenetration: "65%",
    note: "Gateway to the Okavango Delta. Tourism-driven connectivity demand.",
  },
  {
    name: "Kasane",
    x: 255, y: 55,
    district: "Chobe District",
    population: "~10,000",
    coverage4G: "82%",
    operators: ["Mascom"],
    towers: 14,
    internetPenetration: "58%",
    note: "Four Corners border point. Cross-border roaming agreements active.",
  },
  {
    name: "Palapye",
    x: 295, y: 240,
    district: "Central District",
    population: "~35,000",
    coverage4G: "93%",
    operators: ["Mascom", "Orange"],
    towers: 22,
    internetPenetration: "71%",
    note: "Central transport corridor hub. BOTASH and energy infrastructure.",
  },
  {
    name: "Ghanzi",
    x: 100, y: 220,
    district: "Ghanzi District",
    population: "~15,000",
    coverage4G: "74%",
    operators: ["Mascom"],
    towers: 11,
    internetPenetration: "48%",
    note: "Remote western district. BOCRA Universal Access Fund active here.",
  },
  {
    name: "Lobatse",
    x: 255, y: 385,
    district: "Southern District",
    population: "~30,000",
    coverage4G: "96%",
    operators: ["Mascom", "Orange", "BTC"],
    towers: 19,
    internetPenetration: "74%",
    note: "Abattoir and court city. High BTC fibre density.",
  },
  {
    name: "Selebi-Phikwe",
    x: 330, y: 205,
    district: "Central District",
    population: "~50,000",
    coverage4G: "91%",
    operators: ["Mascom", "Orange"],
    towers: 27,
    internetPenetration: "69%",
    note: "Former mining capital. Post-BCL diversification driving ICT investment.",
  },
];

const LINKS = [
  [0, 1], [0, 4], [0, 6], [1, 2], [1, 3], [1, 4],
  [1, 7], [2, 3], [2, 5], [3, 7], [4, 7], [5, 2],
];

function BotswanaNetworkSVG({
  selectedCity,
  onCityClick,
}: {
  selectedCity: City | null;
  onCityClick: (city: City) => void;
}) {
  return (
    <svg
      viewBox="0 0 420 440"
      className="w-full h-full"
      aria-label="Interactive Botswana telecommunications network map"
    >
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#75AADB" strokeWidth="0.3" strokeOpacity="0.2" />
        </pattern>
        <clipPath id="botswana-clip">
          <path d="M 60 55 L 120 35 L 205 28 L 260 40 L 290 38 L 330 60 L 370 90 L 375 130
                   L 360 175 L 355 230 L 345 290 L 330 340 L 310 400 L 270 420 L 210 415
                   L 160 400 L 110 370 L 75 320 L 55 255 L 45 190 L 50 120 Z" />
        </clipPath>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#75AADB" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#75AADB" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="selectedGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4921A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D4921A" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Country fill */}
      <path
        d="M 60 55 L 120 35 L 205 28 L 260 40 L 290 38 L 330 60 L 370 90 L 375 130
           L 360 175 L 355 230 L 345 290 L 330 340 L 310 400 L 270 420 L 210 415
           L 160 400 L 110 370 L 75 320 L 55 255 L 45 190 L 50 120 Z"
        fill="#75AADB"
        fillOpacity="0.06"
        stroke="#75AADB"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      <rect x="0" y="0" width="420" height="440" fill="url(#grid)" clipPath="url(#botswana-clip)" />

      {/* Connection lines */}
      {LINKS.map(([a, b], i) => {
        const isActive =
          selectedCity &&
          (CITIES[a].name === selectedCity.name || CITIES[b].name === selectedCity.name);
        return (
          <motion.line
            key={i}
            x1={CITIES[a].x} y1={CITIES[a].y}
            x2={CITIES[b].x} y2={CITIES[b].y}
            stroke={isActive ? "#D4921A" : "#75AADB"}
            strokeWidth={isActive ? "1.5" : "1"}
            strokeOpacity={isActive ? 0.8 : 0.35}
            strokeDasharray={isActive ? "none" : "4 4"}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
          />
        );
      })}

      {/* Animated data pulses */}
      {LINKS.slice(0, 4).map(([a, b], i) => (
        <motion.circle
          key={`pulse-${i}`}
          r="2"
          fill="#75AADB"
          initial={{ opacity: 0 }}
          animate={{
            x: [CITIES[a].x, CITIES[b].x],
            y: [CITIES[a].y, CITIES[b].y],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 2, delay: 2 + i * 0.7, repeat: Infinity, repeatDelay: 3 }}
        />
      ))}

      {/* City nodes */}
      {CITIES.map((city) => {
        const isSelected = selectedCity?.name === city.name;
        return (
          <g
            key={city.name}
            onClick={() => onCityClick(city)}
            style={{ cursor: "pointer" }}
          >
            {/* Glow ring */}
            <motion.circle
              cx={city.x} cy={city.y}
              r={isSelected ? 28 : city.main ? 18 : 12}
              fill={isSelected ? "url(#selectedGlow)" : "url(#nodeGlow)"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: isSelected ? [1, 1.15, 1] : [1, 1.25, 1],
                opacity: isSelected ? [0.8, 1, 0.8] : [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />

            {/* Hit target (transparent larger circle) */}
            <circle
              cx={city.x} cy={city.y}
              r="16"
              fill="transparent"
            />

            {/* Node circle */}
            <motion.circle
              cx={city.x} cy={city.y}
              r={isSelected ? 8 : city.main ? 6 : 4}
              fill={isSelected ? "#D4921A" : city.main ? "#75AADB" : "#ffffff"}
              fillOpacity={city.main || isSelected ? 1 : 0.6}
              stroke={isSelected ? "#D4921A" : "#75AADB"}
              strokeWidth="1.5"
              filter={isSelected ? "url(#glow)" : undefined}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + CITIES.indexOf(city) * 0.1, type: "spring" }}
            />

            {/* Label */}
            <motion.text
              x={city.x + (city.x > 200 ? 12 : -12)}
              y={city.y + 4}
              fontSize={isSelected ? "10" : "9"}
              fontWeight={isSelected ? "bold" : "normal"}
              fill={isSelected ? "#D4921A" : "#75AADB"}
              fillOpacity={isSelected ? 1 : 0.8}
              textAnchor={city.x > 200 ? "start" : "end"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 + CITIES.indexOf(city) * 0.1 }}
            >
              {city.name}
            </motion.text>
          </g>
        );
      })}

      {/* Signal rings from Gaborone (or selected city) */}
      {[20, 35, 50].map((r, i) => {
        const src = selectedCity ?? CITIES[0];
        return (
          <motion.circle
            key={`ring-${i}`}
            cx={src.x} cy={src.y}
            r={r}
            fill="none"
            stroke={selectedCity ? "#D4921A" : "#75AADB"}
            strokeWidth="0.8"
            initial={{ opacity: 0.5, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 2.5, delay: i * 0.8, repeat: Infinity, repeatDelay: 0.5 }}
          />
        );
      })}
    </svg>
  );
}

const STATS = [
  { value: "3.2M", label: "Active SIM Cards" },
  { value: "82.3%", label: "Internet Penetration" },
  { value: "15+", label: "Licensed Operators" },
  { value: "4,287", label: "Complaints Resolved" },
];

const OPERATOR_COLORS: Record<string, string> = {
  Mascom: "bg-[#06193e]",
  Orange: "bg-orange-500",
  BTC: "bg-[#1B75BB]",
};

export default function Hero() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  return (
    <div className="relative min-h-screen bg-[#03102A] overflow-hidden flex flex-col">

      {/* Botswana flag stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#75AADB] via-[#ffffff] to-[#75AADB] opacity-60" />
      <div className="absolute top-1 left-0 right-0 h-0.5 bg-black opacity-40" />

      {/* Background dot grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #75AADB 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Diagonal accent */}
      <div
        className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-bl from-[#06193e] to-transparent opacity-70 pointer-events-none"
        style={{ clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)" }}
      />

      {/* Atmospheric glows */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#75AADB] rounded-full blur-[180px] opacity-[0.04] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-[#027ac6] rounded-full blur-[140px] opacity-[0.07] pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center min-h-[70vh]">

          {/* LEFT: Text content */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 mb-8"
            >
              <div className="w-8 h-0.5 bg-[#75AADB]" />
              <span className="text-[#75AADB] text-xs font-bold uppercase tracking-[0.2em]">
                Botswana&apos;s Communications Regulator
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 font-[family-name:var(--font-outfit)]"
            >
              Connecting
              <br />
              <span className="text-transparent" style={{ WebkitTextStroke: "2px #75AADB" }}>
                Botswana.
              </span>
              <br />
              <span className="text-[#75AADB]">Protecting</span>
              <br />
              Consumers.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 text-base leading-relaxed mb-10 max-w-lg"
            >
              BOCRA was established through the Communications Regulatory Authority Act, 2012 to regulate
              telecommunications, internet, broadcasting, and postal services across Botswana — ensuring
              fair access, consumer protection, and a competitive digital economy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <a
                href="#complaints"
                className="group flex items-center gap-2 bg-[#75AADB] hover:bg-[#5b96d0] text-[#03102A] px-8 py-4 rounded-lg font-black text-sm tracking-wide transition-all shadow-lg shadow-[#75AADB]/20 active:scale-95"
              >
                File a Complaint
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://op-web.bocra.org.bw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white hover:bg-white/5 px-8 py-4 rounded-lg font-bold text-sm tracking-wide transition-all"
              >
                BOCRA Portal
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { label: "About BOCRA", href: "/about/profile" },
                { label: "Licensing", href: "/mandate/licensing" },
                { label: "Statistics", href: "#statistics" },
                { label: "FAQs", href: "/faqs" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-full"
                >
                  {link.label}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: Interactive Botswana network map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex items-center justify-center relative"
          >
            <div className="relative w-full max-w-lg">
              {/* Glow behind map */}
              <div className="absolute inset-0 bg-[#027ac6] rounded-full blur-[100px] opacity-10" />

              {/* Hint label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="absolute top-0 right-0 text-[10px] text-gray-500 uppercase tracking-widest"
              >
                Click a city to explore
              </motion.p>

              <BotswanaNetworkSVG selectedCity={selectedCity} onCityClick={(city) => setSelectedCity(city === selectedCity ? null : city)} />

              {/* === City detail panel === */}
              <AnimatePresence>
                {selectedCity ? (
                  <motion.div
                    key={selectedCity.name}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="absolute top-8 right-0 w-52 bg-[#06193e]/95 backdrop-blur-sm border border-[#D4921A]/30 rounded-2xl p-4 shadow-xl shadow-black/40"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[#D4921A] text-[10px] font-bold uppercase tracking-widest">
                          {selectedCity.district}
                        </p>
                        <h3 className="text-white font-black text-base leading-tight">
                          {selectedCity.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedCity(null)}
                        className="text-gray-500 hover:text-white transition-colors mt-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#75AADB] shrink-0" />
                        <span className="text-gray-300 text-xs">Pop: {selectedCity.population}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-3.5 h-3.5 text-[#75AADB] shrink-0" />
                        <span className="text-gray-300 text-xs">4G: {selectedCity.coverage4G}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#75AADB] shrink-0" />
                        <span className="text-gray-300 text-xs">Internet: {selectedCity.internetPenetration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-[#75AADB] shrink-0" />
                        <span className="text-gray-300 text-xs">{selectedCity.towers} towers</span>
                      </div>
                    </div>

                    {/* Operators */}
                    <div className="flex gap-1 flex-wrap mb-3">
                      {selectedCity.operators.map((op) => (
                        <span
                          key={op}
                          className={`text-[9px] font-bold text-white px-2 py-0.5 rounded-full ${OPERATOR_COLORS[op] ?? "bg-gray-700"}`}
                        >
                          {op}
                        </span>
                      ))}
                    </div>

                    <p className="text-gray-500 text-[10px] leading-relaxed border-t border-white/10 pt-2">
                      {selectedCity.note}
                    </p>
                  </motion.div>
                ) : (
                  /* Default floating cards when nothing selected */
                  <>
                    <motion.div
                      key="default-4g"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: 1.5 }}
                      className="absolute top-12 left-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3"
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">4G Coverage</p>
                      <p className="text-white font-bold text-lg">94.2%</p>
                      <p className="text-[10px] text-gray-400">Population covered</p>
                    </motion.div>

                    <motion.div
                      key="default-hq"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: 1.7 }}
                      className="absolute bottom-16 right-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3"
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Gaborone HQ</p>
                      <p className="text-white font-bold">Plot 50671</p>
                      <p className="text-[10px] text-gray-400">Independence Avenue</p>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Bottom stat strip */}
      <div className="relative z-10 border-t border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="py-5 px-6 flex flex-col gap-1"
              >
                <span className="text-2xl font-black text-white font-[family-name:var(--font-outfit)]">
                  {stat.value}
                </span>
                <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Consultation Banner */}
      <div className="relative z-10 bg-[#D4921A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#03102A] text-[#D4921A] px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
              Open Now
            </div>
            <p className="text-[#03102A] font-bold text-sm">
              ICT Policy Framework 2025–2030: Public Consultation — Comment period closes{" "}
              <span className="underline">30 April 2026</span>
            </p>
          </div>
          <Link
            href="/consultations"
            className="shrink-0 flex items-center gap-2 text-[#03102A] border border-[#03102A]/20 hover:bg-[#03102A]/10 px-4 py-1.5 rounded text-sm font-black transition-colors"
          >
            Participate <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
