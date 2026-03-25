"use client";

import InnerPageLayout from "@/components/InnerPageLayout";
import { useState } from "react";
import { Search, Clock, CheckCircle2, AlertCircle, RotateCcw, ArrowRight } from "lucide-react";
import Link from "next/link";

const COMPLAINTS_LINKS = [
  { label: "File a Complaint", href: "/complaints" },
  { label: "Complaint Process", href: "/complaints/process" },
  { label: "Consumer Education", href: "/complaints/education" },
  { label: "Track Your Complaint", href: "/complaints/track", active: true },
];

type Status = "acknowledged" | "in-progress" | "resolved" | "dismissed";

interface MockResult {
  ref: string;
  status: Status;
  category: string;
  filed: string;
  lastUpdated: string;
  summary: string;
  timeline: { date: string; event: string }[];
}

// Mock lookup — in a real deployment this would hit the backend API
const MOCK_RESULTS: Record<string, MockResult> = {
  "BCR-2026-000142": {
    ref: "BCR-2026-000142",
    status: "in-progress",
    category: "Data Services — Billing Dispute",
    filed: "3 March 2026",
    lastUpdated: "12 March 2026",
    summary: "Complaint regarding unexpected data charges on a 30-day bundle. Operator engaged; awaiting billing records.",
    timeline: [
      { date: "3 Mar 2026", event: "Complaint received and acknowledged" },
      { date: "5 Mar 2026", event: "Complaint assigned to Consumer Affairs officer" },
      { date: "8 Mar 2026", event: "Operator notified and requested to provide billing records" },
      { date: "12 Mar 2026", event: "Operator response received — under review" },
    ],
  },
  "BCR-2026-000078": {
    ref: "BCR-2026-000078",
    status: "resolved",
    category: "Mobile Network — Quality of Service",
    filed: "14 February 2026",
    lastUpdated: "28 February 2026",
    summary: "Persistent call drops in residential area. BOCRA directed operator to conduct site survey and resolve within 14 days.",
    timeline: [
      { date: "14 Feb 2026", event: "Complaint received and acknowledged" },
      { date: "16 Feb 2026", event: "Operator engaged — site survey requested" },
      { date: "24 Feb 2026", event: "Operator completed site survey; fault identified" },
      { date: "28 Feb 2026", event: "Issue resolved — complaint closed" },
    ],
  },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: typeof CheckCircle2; bg: string }> = {
  acknowledged: { label: "Acknowledged", color: "text-[#1B75BB]", bg: "bg-[#1B75BB]/10", icon: Clock },
  "in-progress": { label: "Under Investigation", color: "text-[#D4921A]", bg: "bg-[#D4921A]/10", icon: RotateCcw },
  resolved: { label: "Resolved", color: "text-[#1C6B3C]", bg: "bg-[#1C6B3C]/10", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", color: "text-gray-500", bg: "bg-gray-100", icon: AlertCircle },
};

export default function TrackComplaintPage() {
  const [ref, setRef] = useState("");
  const [result, setResult] = useState<MockResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const key = ref.trim().toUpperCase();
    const found = MOCK_RESULTS[key];
    if (found) {
      setResult(found);
      setNotFound(false);
    } else {
      setResult(null);
      setNotFound(true);
    }
  }

  const StatusIcon = result ? STATUS_CONFIG[result.status].icon : null;

  return (
    <InnerPageLayout
      section="Complaints"
      title="Track Your Complaint"
      breadcrumbs={[{ label: "Complaints", href: "/complaints" }, { label: "Track", href: "/complaints/track" }]}
      sidebarLinks={COMPLAINTS_LINKS}
    >
      <div className="space-y-8">

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed">
            Enter your complaint reference number below to check the current status and progress
            of your case. Your reference number was included in the acknowledgement email sent
            when you filed your complaint. Reference numbers have the format <strong className="text-[#06193e]">BCR-YYYY-XXXXXX</strong>.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-black text-[#06193e] mb-3">
            Complaint Reference Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. BCR-2026-000142"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#027ac6]/30 focus:border-[#027ac6] transition-all"
              aria-label="Enter complaint reference number"
            />
            <button
              type="submit"
              className="shrink-0 flex items-center gap-2 bg-[#06193e] hover:bg-[#027ac6] text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Can&apos;t find your reference number? Check your acknowledgement email or call 0800 600 601.
          </p>
        </form>

        {/* Not found */}
        {notFound && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-black text-red-700 mb-1">Reference number not found</p>
              <p className="text-sm text-red-600">
                The reference number <strong>{ref.trim().toUpperCase()}</strong> was not found in our system.
                Please check the number and try again. If you believe this is an error, contact us at{" "}
                <a href="mailto:consumeraffairs@bocra.org.bw" className="underline">
                  consumeraffairs@bocra.org.bw
                </a>{" "}
                or call 0800 600 601.
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && StatusIcon && (
          <div className="space-y-5">
            {/* Status banner */}
            <div className="bg-[#06193e] rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    Reference Number
                  </p>
                  <p className="font-black text-xl font-mono">{result.ref}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${STATUS_CONFIG[result.status].bg}`}>
                  <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[result.status].color}`} />
                  <span className={`text-xs font-black ${STATUS_CONFIG[result.status].color}`}>
                    {STATUS_CONFIG[result.status].label}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Category</p>
                  <p className="text-white font-semibold">{result.category}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Filed</p>
                  <p className="text-white font-semibold">{result.filed}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Last Updated</p>
                  <p className="text-white font-semibold">{result.lastUpdated}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-black text-[#06193e] mb-5">Case Timeline</h3>
              <div className="space-y-4">
                {result.timeline.map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${i === result.timeline.length - 1 ? "bg-[#D4921A]" : "bg-[#06193e]"}`} />
                      {i < result.timeline.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-[10px] font-bold text-gray-400 mb-0.5">{event.date}</p>
                      <p className="text-sm text-gray-700 font-semibold">{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Demo hint */}
        <div className="bg-[#FAFCFF] border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-xs text-gray-400 mb-2">
            Demo: Try reference numbers <strong>BCR-2026-000142</strong> or <strong>BCR-2026-000078</strong>
          </p>
          <p className="text-xs text-gray-400">
            Don&apos;t have a complaint yet?{" "}
            <Link href="/complaints" className="text-[#027ac6] font-bold hover:underline inline-flex items-center gap-1">
              File one now <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>

      </div>
    </InnerPageLayout>
  );
}
