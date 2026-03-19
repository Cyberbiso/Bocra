"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { Briefcase, MapPin, Mail } from "lucide-react";

const ABOUT_LINKS = [
  { label: "Profile", href: "/about/profile" },
  { label: "Word from the CEO", href: "/about/chief-executive" },
  { label: "History", href: "/about/history" },
  { label: "Board of Directors", href: "/about/board" },
  { label: "Executive Management", href: "/about/executive" },
  { label: "Careers", href: "/about/careers", active: true },
];

export default function CareersPage() {
  return (
    <InnerPageLayout
      section="About"
      title="Careers at BOCRA"
      breadcrumbs={[{ label: "About", href: "/about" }, { label: "Careers", href: "/about/careers" }]}
      sidebarLinks={ABOUT_LINKS}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-black text-[#06193e] mb-4">Work With Us</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            BOCRA is an equal opportunity employer committed to attracting and retaining exceptional talent
            to help shape Botswana's digital future. We offer a professional environment where innovation,
            integrity, and excellence are valued.
          </p>
          <p className="text-gray-600 leading-relaxed">
            As a regulatory authority, BOCRA offers unique career opportunities in telecommunications engineering,
            spectrum management, broadcasting regulation, legal compliance, consumer affairs, and corporate services.
          </p>
        </div>

        {/* No current vacancies message */}
        <div className="bg-[#06193e] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-[#75AADB]" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">No Current Vacancies</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            There are no open positions at this time. Check back regularly or send us your CV for future opportunities.
          </p>
          <a
            href="mailto:hr@bocra.org.bw"
            className="inline-flex items-center gap-2 bg-[#75AADB] hover:bg-[#5b96d0] text-[#06193e] font-black px-7 py-3 rounded-xl transition-colors text-sm"
          >
            <Mail className="w-4 h-4" /> Send Your CV
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
          <MapPin className="w-5 h-5 text-[#027ac6] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[#06193e] mb-1">Human Resources Department</h3>
            <p className="text-sm text-gray-500">Plot 50671 Independence Avenue, Gaborone, Botswana</p>
            <p className="text-sm text-gray-500">Tel: +267 395 7755 · Email: hr@bocra.org.bw</p>
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
}
