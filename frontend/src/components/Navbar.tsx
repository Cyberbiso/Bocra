"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Globe, Accessibility, Type, SunMoon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FontSize = "sm" | "base" | "lg";
const FONT_CLASSES: Record<FontSize, string> = { sm: "text-sm-a11y", base: "", lg: "text-lg-a11y" };

function useA11y() {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === "undefined") return "base";
    const saved = localStorage.getItem("a11y-font");
    return saved === "sm" || saved === "lg" || saved === "base" ? saved : "base";
  });
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("a11y-contrast") === "1";
  });

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("text-sm-a11y", "text-lg-a11y");
    if (FONT_CLASSES[fontSize]) html.classList.add(FONT_CLASSES[fontSize]);
    localStorage.setItem("a11y-font", fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("a11y-contrast", highContrast ? "1" : "0");
  }, [highContrast]);

  return { fontSize, setFontSize, highContrast, setHighContrast };
}

const NAV = [
  {
    name: "About",
    href: "/about",
    dropdown: [
      { label: "Profile", href: "/about/profile", desc: "Who we are and our mandate" },
      { label: "Word from the CEO", href: "/about/chief-executive", desc: "Message from leadership" },
      { label: "History", href: "/about/history", desc: "Communication regulation in Botswana" },
      { label: "Board of Directors", href: "/about/board", desc: "BOCRA's governing board" },
      { label: "Executive Management", href: "/about/executive", desc: "Senior leadership team" },
      { label: "Projects", href: "/projects", desc: "Current BOCRA projects" },
      { label: "Careers", href: "/about/careers", desc: "Join the BOCRA team" },
    ],
  },
  {
    name: "Mandate",
    href: "/mandate",
    dropdown: [
      { label: "Legislation", href: "/mandate/legislation", desc: "Laws governing BOCRA" },
      { label: "Telecommunications", href: "/mandate/telecommunications", desc: "Telecom regulation & spectrum" },
      { label: "Broadcasting", href: "/mandate/broadcasting", desc: "Radio & TV regulation" },
      { label: "Postal Services", href: "/mandate/postal", desc: "Postal operator oversight" },
      { label: "Internet & ICT", href: "/mandate/internet", desc: "bw ccTLD & bw CIRT" },
      { label: "Licensing", href: "/mandate/licensing", desc: "Operator licence framework" },
    ],
  },
  {
    name: "Services",
    href: "/services",
    dropdown: [
      { label: "Licence Verification", href: "/services/licence-verification", desc: "Verify BOCRA-issued licence status" },
      { label: "Type Approval Certificates", href: "/services/type-approval", desc: "Search approved devices registry" },
      { label: "Register .bw Domain", href: "/services/domain-registration", desc: "Register a .bw domain name" },
    ],
  },
  {
    name: "Documents",
    href: "/documents",
    dropdown: [
      { label: "Draft Documents", href: "/consultations", desc: "Open for public comment" },
      { label: "ICT Licensing Framework", href: "/documents", desc: "Framework documents" },
      { label: "Legislation", href: "/mandate/legislation", desc: "Acts & regulations" },
      { label: "Annual Reports", href: "/documents#annual-reports", desc: "Yearly performance reports" },
    ],
  },
  {
    name: "Complaints",
    href: "/complaints",
    dropdown: [
      { label: "File a Complaint", href: "#complaints", desc: "Submit your complaint online" },
      { label: "Complaint Process", href: "/complaints/process", desc: "How we handle complaints" },
      { label: "Consumer Education", href: "/complaints/education", desc: "Know your rights" },
      { label: "Track Your Complaint", href: "/complaints/track", desc: "Check complaint status" },
      { label: "Consultations", href: "/consultations", desc: "Public comment & consultations" },
    ],
  },
  {
    name: "Media",
    href: "/media",
    dropdown: [
      { label: "News & Events", href: "/media", desc: "Latest announcements" },
      { label: "Press Releases", href: "/media#press-releases", desc: "Official statements" },
      { label: "Speeches", href: "/media#speeches", desc: "CEO and Board speeches" },
      { label: "Tenders", href: "/tenders", desc: "Open procurement opportunities" },
    ],
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fontSize, setFontSize, highContrast, setHighContrast } = useA11y();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function openDropdown(name: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(name);
  }

  function closeDropdown() {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/98 backdrop-blur-xl shadow-md shadow-gray-100/80 py-2 border-b border-gray-100"
          : "bg-white py-3 border-b border-gray-100"
      }`}
    >
      {/* Botswana flag stripe at very top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-[#75AADB] via-[#06193e] to-[#75AADB]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-28 h-10">
              <Image src="/logo.png" alt="BOCRA Logo" fill className="object-contain" priority />
            </div>
            <div className="hidden md:flex flex-col border-l border-gray-200 pl-3">
              <span className="text-[9px] font-black text-[#06193e] uppercase tracking-widest leading-tight">
                Botswana Communications
              </span>
              <span className="text-[9px] font-black text-[#027ac6] uppercase tracking-widest leading-tight">
                Regulatory Authority
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.dropdown && openDropdown(item.name)}
                onMouseLeave={() => item.dropdown && closeDropdown()}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all duration-150 ${
                    activeDropdown === item.name
                      ? "text-[#027ac6] bg-[#027ac6]/5"
                      : "text-gray-700 hover:text-[#027ac6] hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                  {item.dropdown && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === item.name ? "rotate-180 text-[#027ac6]" : "text-gray-400"}`} />
                  )}
                </Link>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {item.dropdown && activeDropdown === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-gray-200/80 border border-gray-100 overflow-hidden z-50"
                      onMouseEnter={() => openDropdown(item.name)}
                      onMouseLeave={closeDropdown}
                    >
                      {/* Dropdown header stripe */}
                      <div className="h-1 bg-linear-to-r from-[#06193e] to-[#027ac6]" />
                      <div className="p-2">
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#027ac6]/5 group transition-colors"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#75AADB] mt-1.5 shrink-0 group-hover:bg-[#027ac6] transition-colors" />
                            <div>
                              <p className="text-sm font-bold text-[#06193e] group-hover:text-[#027ac6] transition-colors leading-tight">
                                {sub.label}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{sub.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right: Accessibility + Portal + Tenders */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/tenders"
              className="px-4 py-2 text-[13px] font-bold text-gray-600 hover:text-[#06193e] transition-colors"
            >
              Tenders
            </Link>

            {/* Accessibility button */}
            <div className="relative">
              <button
                onClick={() => setA11yOpen((v) => !v)}
                className="p-2 rounded-lg text-gray-500 hover:text-[#027ac6] hover:bg-gray-50 transition-colors"
                aria-label="Accessibility options"
                aria-expanded={a11yOpen}
              >
                <Accessibility className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {a11yOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="h-1 bg-linear-to-r from-[#06193e] to-[#027ac6]" />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessibility</span>
                        <button onClick={() => setA11yOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close"><X className="w-3.5 h-3.5" /></button>
                      </div>

                      {/* Text size */}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Type className="w-3 h-3" /> Text Size</p>
                      <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setFontSize(fontSize === "lg" ? "base" : "sm")} disabled={fontSize === "sm"} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">A−</button>
                        <span className="text-xs font-black text-[#06193e] w-8 text-center">{fontSize === "sm" ? "A-" : fontSize === "base" ? "A" : "A+"}</span>
                        <button onClick={() => setFontSize(fontSize === "sm" ? "base" : "lg")} disabled={fontSize === "lg"} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">A+</button>
                      </div>

                      {/* Contrast */}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><SunMoon className="w-3 h-3" /> Contrast</p>
                      <button
                        onClick={() => setHighContrast((v) => !v)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${highContrast ? "bg-[#06193e] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        aria-pressed={highContrast}
                      >
                        {highContrast ? "High Contrast: ON" : "High Contrast: OFF"}
                      </button>
                      <button onClick={() => { setFontSize("base"); setHighContrast(false); }} className="w-full mt-2 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors">Reset</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-white bg-[#06193e] hover:bg-[#027ac6] rounded-lg transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              Portal
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg"
          >
            <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
              {NAV.map((item) => (
                <div key={item.name}>
                  <button
                    onClick={() =>
                      item.dropdown
                        ? setExpandedMobile(expandedMobile === item.name ? null : item.name)
                        : setIsOpen(false)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-bold text-gray-800 hover:bg-blue-50 hover:text-[#027ac6] transition-colors"
                  >
                    {item.name}
                    {item.dropdown && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedMobile === item.name ? "rotate-180 text-[#027ac6]" : "text-gray-400"}`} />
                    )}
                  </button>

                  <AnimatePresence>
                    {item.dropdown && expandedMobile === item.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden ml-4"
                      >
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#027ac6] hover:bg-blue-50/50 rounded-lg transition-colors"
                          >
                            <div className="w-1 h-1 rounded-full bg-[#75AADB]" />
                            {sub.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="pt-4 mt-2 border-t border-gray-100">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#027ac6] rounded-xl hover:bg-blue-50/50 transition-colors"
                >
                  Portal
                  <Globe className="w-3.5 h-3.5 text-gray-300" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
