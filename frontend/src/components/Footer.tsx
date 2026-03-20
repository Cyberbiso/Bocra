import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ExternalLink, ArrowUpRight } from "lucide-react";
import Particles from "./Particles";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const SOCIAL = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/BTAbw/",
    icon: FacebookIcon,
    color: "hover:bg-[#1877F2]",
  },
  {
    label: "X",
    href: "https://x.com/BOCRAbw",
    icon: XIcon,
    color: "hover:bg-black",
  },
  {
    label: "LinkedIn",
    href: "https://bw.linkedin.com/company/bta_3",
    icon: LinkedInIcon,
    color: "hover:bg-[#0A66C2]",
  },
];

const QUICK_LINKS = [
  { label: "About BOCRA", href: "/about/profile" },
  { label: "Board of Directors", href: "/about/board" },
  { label: "Legislation", href: "/mandate/legislation" },
  { label: "Licensing Framework", href: "/mandate/licensing" },
  { label: "Tenders", href: "/tenders" },
  { label: "Careers", href: "/about/careers" },
];

const SERVICES = [
  { label: "File a Complaint", href: "/#complaints" },
  {
    label: "Verify a Licence",
    href: "https://customerportal.bocra.org.bw/OnlineLicenseVerification/verify",
    external: true,
  },
  {
    label: "Type Approval",
    href: "https://typeapproval.bocra.org.bw/",
    external: true,
  },
  { label: "Register .bw Domain", href: "https://nic.net.bw/", external: true },
  { label: "Telecom Statistics", href: "/#statistics" },
  { label: "FAQs", href: "/faqs" },
];

const PORTALS = [
  { label: "BOCRA Online Portal", href: "https://op-web.bocra.org.bw" },
  { label: "QoS Monitoring", href: "https://dqos.bocra.org.bw" },
  { label: "ASMS Spectrum Mgmt", href: "https://registration.bocra.org.bw/" },
];

export default function Footer() {
  return (
    <footer className="bg-[#03102A] text-white relative overflow-hidden">
      {/* Top decorative stripe — Botswana flag colours */}
      <div className="h-1 bg-linear-to-r from-[#75AADB] via-black to-[#75AADB]" />

      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #75AADB 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Animated particles */}
      <Particles count={150} connectionDistance={130} lineOpacity={0.1} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* === CTA Banner inside footer === */}
        <div className="py-10 border-b border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[#75AADB] text-xs font-bold uppercase tracking-[0.2em] mb-2">
                Consumer Protection
              </p>
              <h3 className="text-2xl font-black font-(family-name:--font-outfit)">
                Having a problem with a telecom operator?
              </h3>
            </div>
            <a
              href="/#complaints"
              className="shrink-0 bg-[#75AADB] hover:bg-[#5b96d0] text-[#03102A] font-black px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#75AADB]/10 text-sm"
            >
              File a Complaint →
            </a>
          </div>
        </div>

        {/* === Main footer grid === */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="relative w-36 h-12 bg-white rounded-xl p-2 mb-6">
              <Image
                src="/logo.png"
                alt="BOCRA Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              Botswana Communications Regulatory Authority — regulating the
              communications sector for the benefit of Botswana citizens,
              operators, and the national economy.
            </p>

            {/* Contact */}
            <div className="space-y-3 mb-6">
              <a
                href="tel:+26739577755"
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-[#75AADB] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#75AADB]/10 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                +267 395 7755
              </a>
              <a
                href="mailto:info@bocra.org.bw"
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-[#75AADB] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#75AADB]/10 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                info@bocra.org.bw
              </a>
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>
                  Plot 50671 Independence Avenue,
                  <br />
                  Gaborone, Botswana
                </span>
              </div>
            </div>

            {/* Social links */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-3">
                Follow Us
              </p>
              <div className="flex gap-2">
                {SOCIAL.map(({ label, href, icon: Icon, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all ${color}`}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-[#75AADB] mb-5">
              About
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-[#75AADB] transition-all duration-200 rounded" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-[#75AADB] mb-5">
              Services
            </h4>
            <ul className="space-y-3">
              {SERVICES.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-[#75AADB] transition-all duration-200 rounded" />
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-[#75AADB] transition-all duration-200 rounded" />
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-[#75AADB] mb-5">
              Online Portals
            </h4>
            <ul className="space-y-3">
              {PORTALS.map((portal) => (
                <li key={portal.label}>
                  <a
                    href={portal.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-between group"
                  >
                    {portal.label}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#75AADB]" />
                  </a>
                </li>
              ))}
            </ul>

            {/* Regulator badge */}
            <div className="mt-8 border border-white/10 rounded-xl p-4 bg-white/2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Established under
              </p>
              <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                Communications Regulatory Authority Act, 2012
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                1 April 2013 · Republic of Botswana
              </p>
            </div>
          </div>
        </div>

        {/* === Bottom bar === */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Botswana Communications Regulatory
            Authority. All rights reserved. BOCRA is an independent regulatory
            authority.
          </p>
          <div className="flex gap-6 text-xs font-medium">
            <Link
              href="/privacy-notice"
              className="text-gray-500 hover:text-[#75AADB] transition-colors"
            >
              Privacy Notice
            </Link>
            <Link
              href="/faqs"
              className="text-gray-500 hover:text-[#75AADB] transition-colors"
            >
              FAQs
            </Link>
            <Link
              href="/tenders"
              className="text-gray-500 hover:text-[#75AADB] transition-colors"
            >
              Tenders
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
