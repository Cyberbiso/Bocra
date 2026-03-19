"use client";

import { useState } from "react";
import InnerPageLayout from "@/components/InnerPageLayout";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS_LINKS = [
  { label: "Frequently Asked Questions", href: "/faqs", active: true },
  { label: "File a Complaint", href: "/#complaints" },
  { label: "Licensing", href: "/mandate/licensing" },
];

const FAQS = [
  {
    category: "Radio Licensing",
    items: [
      { q: "How long does a radio licence take to process?", a: "Normally a radio licence should take a maximum of three working days to process, subject to the availability of all required information and documents." },
      { q: "What is required to apply for a radio licence?", a: "You need to complete the frequency application form (available on the BOCRA website), include a copy of your company registration, and submit a licence renewal form with full equipment details including serial numbers, make, and model." },
      { q: "Can I use radio equipment I purchased overseas in Botswana?", a: "BOCRA encourages purchasing equipment from local dealers to ensure proper maintenance and programming. Importing unlicensed equipment without BOCRA authorisation is illegal. All radio equipment must be type-approved for use in Botswana." },
      { q: "Are radio licences issued for all locations?", a: "Radio licences are issued per geographical location (approximately 40 km radius). If you need to change location, you must submit a new application to BOCRA." },
      { q: "How do I dispose of old radio equipment?", a: "Write to BOCRA explaining your disposal intent. Take serviceable units to authorised dealers for deprogramming. Obtain boarding certificates for unusable equipment, or sell it to another licensed operator." },
    ],
  },
  {
    category: "Type Approval",
    items: [
      { q: "What is required for type approval of telecommunications equipment?", a: "Required documents include: the type approval application form, full business details, technical specifications, a regional type approval certificate, the manufacturer's declaration of conformity, and evidence of local repair capability." },
      { q: "Does every telecommunications device require type approval?", a: "Yes — every telecommunications equipment entering the Botswana market requires type approval unless the manufacturer has already obtained it on behalf of the distributor. Software variations require new type approval applications." },
      { q: "What is the role of a Radio Dealer?", a: "Radio Dealers provide expertise in the sale, maintenance, and repair of radio equipment. They also handle frequency programming and deprogramming of radio devices, and must hold a valid Radio Dealers Licence from BOCRA." },
    ],
  },
  {
    category: "Licensing & Fees",
    items: [
      { q: "What are the fees for an ISP or Data Provider licence?", a: "ISP and Data Provider licence fees are P10,000 as a one-time initial application fee, plus P3,000 annually. Both amounts are subject to VAT at the applicable rate." },
      { q: "What is a Value-Added Network Service (VANS)?", a: "VANs are services that provide additional functions to increase the value of basic telecommunications services and infrastructure. Examples include managed network services, cloud services, and data centre hosting." },
      { q: "How do I apply for a Radio Dealers licence?", a: "A Radio Dealers licence requires you to demonstrate technical expertise in radio equipment, possess appropriate test equipment, and show financial sustainability. Application forms are available from BOCRA." },
    ],
  },
  {
    category: "Consumer Complaints",
    items: [
      { q: "How do I complain about my service provider?", a: "First, contact your service provider directly and try to resolve the issue. If unresolved, escalate to the Consumer Affairs Manager or Compliance team. If still unresolved, contact BOCRA at +267 395-7755 or file a complaint online." },
      { q: "What information do I need to file a complaint with BOCRA?", a: "You will need: your personal contact details, the name of the service provider, a clear description of the issue with dates and times, supporting evidence such as bills or correspondence, and details of your attempts to resolve the matter with the provider." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="font-bold text-[#06193e] text-sm leading-snug">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 mt-0.5 transition-transform ${open ? "rotate-180 text-[#027ac6]" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50/50">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQsPage() {
  return (
    <InnerPageLayout
      section="Help"
      title="Frequently Asked Questions"
      breadcrumbs={[{ label: "FAQs", href: "/faqs" }]}
      sidebarLinks={FAQS_LINKS}
    >
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            Find answers to common questions about BOCRA's services, licensing, type approval, and consumer
            complaints. If you don't find what you're looking for, contact our team at{" "}
            <a href="tel:+26739577755" className="text-[#027ac6] font-semibold hover:underline">+267 395 7755</a>.
          </p>
        </div>
        {FAQS.map((section) => (
          <div key={section.category}>
            <h2 className="text-lg font-black text-[#06193e] mb-3 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#75AADB] inline-block" />
              {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </InnerPageLayout>
  );
}
