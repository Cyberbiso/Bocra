"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { Shield, Mail, Phone } from "lucide-react";

const PRIVACY_LINKS = [
  { label: "Privacy Notice", href: "/privacy-notice", active: true },
  { label: "File a Complaint", href: "/complaints" },
  { label: "Consultations", href: "/consultations" },
];

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: `The Botswana Communications Regulatory Authority (BOCRA) is an independent statutory body established under the Communications Regulatory Authority Act, 2012 (Cap. 72:04). BOCRA is the data controller for personal information collected through this website and related digital services.`,
  },
  {
    title: "2. What Information We Collect",
    body: `When you use this website or submit a complaint, we may collect: your full name, contact telephone number, email address, physical address, details of your complaint or enquiry, and your internet service provider and device type (collected automatically via server logs). We do not collect payment information or sensitive personal data unless specifically required for a regulatory process.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `Your personal information is used to: process and respond to complaints and enquiries, communicate regulatory decisions and updates, conduct statistical analysis to improve service delivery, fulfil BOCRA's statutory obligations under the CRA Act and related legislation, and contact you regarding the status of your submission. BOCRA will not sell, rent, or trade your personal information to third parties.`,
  },
  {
    title: "4. Legal Basis for Processing",
    body: `BOCRA processes personal data in the exercise of its official regulatory authority conferred by the Communications Regulatory Authority Act, 2012. Where processing is not covered by statutory mandate, we rely on your explicit consent, which you may withdraw at any time by contacting us.`,
  },
  {
    title: "5. Data Sharing",
    body: `Your information may be shared with: other government ministries or agencies where required by law; licensed telecommunications, broadcasting, or postal operators directly involved in resolving your complaint; international regulatory bodies such as the ITU or SADC Regulators' Association, where legally required. All data sharing is governed by applicable data protection obligations.`,
  },
  {
    title: "6. Data Retention",
    body: `Complaint and enquiry records are retained for a minimum of five (5) years in accordance with BOCRA's records management policy and the National Archives Act. Website analytics data is retained for twelve (12) months. You may request deletion of your personal data subject to our legal retention obligations.`,
  },
  {
    title: "7. Your Rights",
    body: `Under applicable Botswana data protection provisions, you have the right to: access the personal information we hold about you; request correction of inaccurate information; request deletion of your data (subject to legal retention requirements); withdraw consent where processing is consent-based; and lodge a complaint with BOCRA if you believe your data has been mishandled. To exercise these rights, contact our Data Protection Officer using the details below.`,
  },
  {
    title: "8. Cookies and Analytics",
    body: `This website uses functional cookies necessary for the website to operate correctly. We do not use advertising or tracking cookies. Anonymous usage statistics may be collected to improve the website experience. You can disable cookies in your browser settings; some features of this site may not function correctly if cookies are disabled.`,
  },
  {
    title: "9. Security",
    body: `BOCRA implements appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and you submit information at your own risk.`,
  },
  {
    title: "10. Changes to This Notice",
    body: `BOCRA may update this Privacy Notice from time to time to reflect changes in our practices or legal obligations. The date of the most recent revision is shown below. Continued use of this website after any update constitutes acceptance of the revised Notice.`,
  },
];

export default function PrivacyNoticePage() {
  return (
    <InnerPageLayout
      section="Legal"
      title="Privacy Notice"
      breadcrumbs={[{ label: "Privacy Notice", href: "/privacy-notice" }]}
      sidebarLinks={PRIVACY_LINKS}
    >
      <div className="space-y-8">

        {/* Intro */}
        <div className="bg-[#06193e] rounded-2xl p-7 text-white flex gap-5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-[#75AADB]" />
          </div>
          <div>
            <h2 className="font-black text-lg mb-1">Your Privacy Matters</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              BOCRA is committed to protecting the personal information you share with us. This Notice
              explains what information we collect, why we collect it, and how we safeguard it in
              accordance with Botswana data protection law.
            </p>
            <p className="text-gray-400 text-xs mt-3">Last updated: March 2026</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h3 className="font-black text-[#06193e] mb-3">{section.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-[#FAFCFF] border border-gray-200 rounded-2xl p-6">
          <h3 className="font-black text-[#06193e] mb-4">Data Protection Officer — Contact Details</h3>
          <div className="space-y-3">
            <a
              href="mailto:dpo@bocra.org.bw"
              className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#027ac6] transition-colors"
            >
              <div className="w-9 h-9 bg-[#06193e] rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-[#75AADB]" />
              </div>
              dpo@bocra.org.bw
            </a>
            <a
              href="tel:+26736319100"
              className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#027ac6] transition-colors"
            >
              <div className="w-9 h-9 bg-[#06193e] rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-[#75AADB]" />
              </div>
              +267 363 1900
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Postal address: Private Bag 00495, Gaborone, Botswana
          </p>
        </div>

      </div>
    </InnerPageLayout>
  );
}
