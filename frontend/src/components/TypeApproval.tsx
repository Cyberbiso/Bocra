"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Cpu,
  Calendar,
  Building2,
  Hash,
} from "lucide-react";

interface Certificate {
  id: string;
  referenceNumber: string;
  approvalApplication: {
    equipmentDetails: {
      make: string;
      model: string;
    };
    customerName: string;
  } | null;
  created: string;
}

interface SearchResult {
  total: number;
  pages: number;
  currentPage: number;
  content: Certificate[];
}

export default function TypeApproval() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    async (pageNum = 0) => {
      setLoading(true);
      setHasSearched(true);
      setPage(pageNum);
      try {
        const params = new URLSearchParams({
          q: query,
          page: pageNum.toString(),
          size: pageSize.toString(),
        });
        const res = await fetch(`/api/type-approval?${params}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({ total: 0, pages: 0, currentPage: 0, content: [] });
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  const totalPages = results?.pages ?? 0;

  return (
    <section id="type-approval" className="py-0 bg-white overflow-hidden">
      {/* Section header */}
      <div className="relative bg-violet-950 py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #a78bfa 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-violet-300 text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-violet-400" />
                Device Registry
              </p>
              <h2 className="text-4xl font-black text-white font-[family-name:var(--font-outfit)] leading-tight">
                Type Approval
                <br />
                <span className="text-violet-300">Certificates</span>
              </h2>
            </div>
            <p className="text-violet-200/60 max-w-sm text-sm leading-relaxed">
              Search the official BOCRA registry of type-approved devices.
              Verify that equipment has been certified for use in Botswana.
            </p>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-8 bg-white"
          style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
        />
      </div>

      {/* Search & Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-10"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(0);
            }}
            className="relative"
          >
            <div className="flex items-center bg-[#06193e] rounded-2xl p-2 shadow-lg">
              <div className="flex items-center gap-3 flex-1 px-4">
                <Smartphone className="w-5 h-5 text-violet-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by make, model, or applicant name..."
                  className="w-full bg-transparent border-none text-white text-sm placeholder:text-gray-500 focus:outline-none py-2"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {loading ? "Searching..." : "Search"}
                </span>
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              e.g. &quot;Samsung&quot;, &quot;Huawei P30&quot;, &quot;iPhone&quot;, or
              &quot;Mascom&quot;
            </p>
          </form>
        </motion.div>

        {/* Empty state */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mb-6">
              <Cpu className="w-10 h-10 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-[#06193e] mb-2 font-[family-name:var(--font-outfit)]">
              BOCRA Approved Devices
            </h3>
            <p className="text-gray-500 text-sm max-w-md">
              Search over 8,700 type-approved devices in the official BOCRA
              registry. Find approved phones, radios, IoT devices, and more.
            </p>
          </div>
        )}

        {/* Loading state */}
        {hasSearched && loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">
              Searching BOCRA device registry...
            </p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {hasSearched && !loading && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  <span className="font-bold text-[#06193e]">
                    {results.total.toLocaleString()}
                  </span>{" "}
                  approved device{results.total !== 1 ? "s" : ""} found
                </p>
                {totalPages > 1 && (
                  <p className="text-xs text-gray-400">
                    Page {page + 1} of {totalPages}
                  </p>
                )}
              </div>

              {results.content.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-bold text-gray-700 mb-1">
                    No devices found
                  </h4>
                  <p className="text-gray-400 text-sm max-w-sm">
                    Try searching with a different make, model, or applicant
                    name.
                  </p>
                </div>
              ) : (
                <>
                  {/* Device cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.content.map((cert, i) => {
                      const make =
                        cert.approvalApplication?.equipmentDetails?.make || "—";
                      const model =
                        cert.approvalApplication?.equipmentDetails?.model ||
                        "—";
                      const applicant =
                        cert.approvalApplication?.customerName || "—";
                      const date = cert.created
                        ? new Date(cert.created).toLocaleDateString("en-BW", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—";

                      return (
                        <motion.div
                          key={cert.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-violet-300 transition-all group"
                        >
                          {/* Make & Model header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                                <Smartphone className="w-4 h-4 text-violet-600" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-[#06193e] text-sm truncate">
                                  {make}
                                </h4>
                                <p className="text-gray-500 text-xs truncate">
                                  {model}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Approved
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-gray-500">
                              <Hash className="w-3 h-3 shrink-0" />
                              <span className="truncate font-medium text-gray-700">
                                {cert.referenceNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{applicant}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{date}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                      <button
                        onClick={() => handleSearch(page - 1)}
                        disabled={page <= 0}
                        className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i;
                          } else if (page <= 2) {
                            pageNum = i;
                          } else if (page >= totalPages - 3) {
                            pageNum = totalPages - 5 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handleSearch(pageNum)}
                              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                pageNum === page
                                  ? "bg-violet-600 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() => handleSearch(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
