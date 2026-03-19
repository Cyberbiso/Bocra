"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface SidebarLink {
  label: string;
  href: string;
  active?: boolean;
}

interface InnerPageLayoutProps {
  section: string;
  title: string;
  breadcrumbs: BreadcrumbItem[];
  sidebarLinks: SidebarLink[];
  children: ReactNode;
}

export default function InnerPageLayout({
  section,
  title,
  breadcrumbs,
  sidebarLinks,
  children,
}: InnerPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAFCFF]">
      {/* Banner */}
      <div className="relative bg-[#06193e] overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#027ac6] blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-[#75AADB] blur-2xl" />
        </div>
        {/* Bottom accent stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#75AADB] via-[#027ac6] to-[#c61e53]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Section tag */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-[#027ac6]/20 border border-[#027ac6]/30 text-[#75AADB] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#75AADB] inline-block" />
            {section}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-3xl"
          >
            {title}
          </motion.h1>

          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-1.5 mt-5 text-sm"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="flex items-center gap-1 text-[#75AADB] hover:text-white transition-colors font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-[#027ac6]" />
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-white/80 font-medium">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-[#75AADB] hover:text-white transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </motion.nav>
        </div>
      </div>

      {/* Body: Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Sidebar */}
          <aside className="lg:w-[260px] shrink-0">
            <div className="lg:sticky lg:top-24">
              {/* Section label */}
              <div className="mb-3 px-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {section}
                </p>
              </div>
              <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#06193e] to-[#027ac6]" />
                <ul className="p-2">
                  {sidebarLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                          link.active
                            ? "bg-[#027ac6] text-white shadow-sm shadow-[#027ac6]/30"
                            : "text-gray-700 hover:text-[#027ac6] hover:bg-[#027ac6]/5"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            link.active ? "bg-white" : "bg-[#75AADB]"
                          }`}
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Help box */}
              <div className="mt-5 bg-[#06193e] rounded-2xl p-5 text-white">
                <p className="text-xs font-black uppercase tracking-widest text-[#75AADB] mb-2">
                  Need Assistance?
                </p>
                <p className="text-sm text-white/70 mb-4 leading-relaxed">
                  Our team is ready to help with any questions.
                </p>
                <a
                  href="tel:+26739577551"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#027ac6] hover:bg-[#027ac6]/90 px-4 py-2.5 rounded-xl transition-colors w-full justify-center"
                >
                  +267 395-7755
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
