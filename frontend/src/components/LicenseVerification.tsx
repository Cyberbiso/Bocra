"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";

interface LicenseType {
  snapInName: string;
  licenseTypeId: number;
}

interface Customer {
  clientId: string;
  clientName: string;
}

interface LicenseDetail {
  clientName: string;
  licensenum: string;
  licenseType: string;
  expirationDate: string;
  make: string;
  model: string;
  description: string;
  status: string;
}

interface SearchResult {
  data: LicenseDetail[];
  totalRecords: number;
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  if (lower === "active" || lower === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" />
        {status}
      </span>
    );
  }
  if (lower === "expired") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function LicenseVerification() {
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Load license types on mount
  useEffect(() => {
    fetch("/api/licenses?action=types")
      .then((r) => r.json())
      .then(setLicenseTypes)
      .catch(() => {});
  }, []);

  // Close customer dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        customerRef.current &&
        !customerRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced customer search
  const searchCustomers = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/licenses?action=customers&name=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data.slice(0, 15) : []);
        setShowCustomerDropdown(true);
      } catch {
        setCustomers([]);
      }
    }, 300);
  }, []);

  const handleSearch = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setHasSearched(true);
      setPage(pageNum);
      try {
        const params = new URLSearchParams({
          action: "search",
          clientId: selectedCustomer?.clientId || "0",
          licenseNumber: licenseNumber || "All",
          licenseType: selectedType,
          page: pageNum.toString(),
          pageSize: pageSize.toString(),
        });
        const res = await fetch(`/api/licenses?${params}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({ data: [], totalRecords: 0 });
      } finally {
        setLoading(false);
      }
    },
    [selectedCustomer, licenseNumber, selectedType, pageSize]
  );

  const totalPages = results
    ? Math.ceil(results.totalRecords / pageSize)
    : 0;

  return (
    <section id="license-verification" className="py-0 bg-white overflow-hidden">
      {/* Section header */}
      <div className="relative bg-[#1C6B3C] py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-emerald-300" />
                Regulatory Compliance
              </p>
              <h2 className="text-4xl font-black text-white font-[family-name:var(--font-outfit)] leading-tight">
                Licence
                <br />
                <span className="text-emerald-200">Verification</span>
              </h2>
            </div>
            <p className="text-emerald-100/70 max-w-sm text-sm leading-relaxed">
              Verify the status of any BOCRA-issued licence. Search by
              operator name, licence number, or licence type.
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Search panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4"
          >
            <div className="bg-[#06193e] rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-lg font-[family-name:var(--font-outfit)]">
                  Search Licences
                </h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(1);
                }}
                className="space-y-4"
              >
                {/* Customer search */}
                <div ref={customerRef} className="relative">
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">
                    Operator / Client Name
                  </label>
                  <input
                    type="text"
                    value={customerQuery}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setSelectedCustomer(null);
                      searchCustomers(e.target.value);
                    }}
                    placeholder="e.g. Mascom, BTC, Orange..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all"
                  />
                  {selectedCustomer && (
                    <p className="text-emerald-400 text-xs mt-1">
                      Selected: {selectedCustomer.clientName}
                    </p>
                  )}
                  <AnimatePresence>
                    {showCustomerDropdown && customers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-48 overflow-y-auto"
                      >
                        {customers.map((c) => (
                          <button
                            key={c.clientId}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerQuery(c.clientName);
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                          >
                            {c.clientName}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* License number */}
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">
                    Licence Number
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. BOCRA/TA/2024/1234"
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all"
                  />
                </div>

                {/* License type */}
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5 flex items-center gap-1.5">
                    <Filter className="w-3 h-3" /> Licence Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedType("All")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedType === "All"
                          ? "bg-emerald-500 text-white"
                          : "bg-white/10 text-gray-400 hover:bg-white/20"
                      }`}
                    >
                      All
                    </button>
                    {licenseTypes.map((lt) => (
                      <button
                        key={lt.licenseTypeId}
                        type="button"
                        onClick={() =>
                          setSelectedType(lt.licenseTypeId.toString())
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedType === lt.licenseTypeId.toString()
                            ? "bg-emerald-500 text-white"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        {lt.snapInName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {loading ? "Searching..." : "Search Licences"}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Results panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8"
          >
            {!hasSearched && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-[#1C6B3C]/10 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-[#1C6B3C]" />
                </div>
                <h3 className="text-xl font-bold text-[#06193e] mb-2 font-[family-name:var(--font-outfit)]">
                  Search BOCRA Licences
                </h3>
                <p className="text-gray-500 text-sm max-w-md">
                  Enter an operator name, licence number, or select a licence
                  type, then click &quot;Search Licences&quot; to see results from the
                  official BOCRA registry.
                </p>
              </div>
            )}

            {hasSearched && loading && (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-[#1C6B3C] animate-spin mb-4" />
                <p className="text-gray-500 text-sm">
                  Querying BOCRA licence registry...
                </p>
              </div>
            )}

            {hasSearched && !loading && results && (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-[#06193e]">
                      {results.totalRecords}
                    </span>{" "}
                    licence{results.totalRecords !== 1 ? "s" : ""} found
                  </p>
                  {totalPages > 1 && (
                    <p className="text-xs text-gray-400">
                      Page {page} of {totalPages}
                    </p>
                  )}
                </div>

                {results.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-bold text-gray-700 mb-1">
                      No licences found
                    </h4>
                    <p className="text-gray-400 text-sm max-w-sm">
                      Try adjusting your search criteria or search by a
                      different operator name.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Card-based results */}
                    <div className="space-y-3">
                      {results.data.map((license, i) => (
                        <motion.div
                          key={`${license.licensenum}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-[#1C6B3C]/30 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-bold text-[#06193e] text-sm truncate">
                                  {license.clientName}
                                </h4>
                                <StatusBadge status={license.status} />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                <div>
                                  <span className="text-gray-400">
                                    Licence No:
                                  </span>{" "}
                                  <span className="text-gray-700 font-medium">
                                    {license.licensenum}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Type:</span>{" "}
                                  <span className="text-gray-700 font-medium">
                                    {license.licenseType}
                                  </span>
                                </div>
                                {license.expirationDate && (
                                  <div>
                                    <span className="text-gray-400">
                                      Expires:
                                    </span>{" "}
                                    <span className="text-gray-700 font-medium">
                                      {license.expirationDate}
                                    </span>
                                  </div>
                                )}
                                {license.make && (
                                  <div>
                                    <span className="text-gray-400">
                                      Make/Model:
                                    </span>{" "}
                                    <span className="text-gray-700 font-medium">
                                      {license.make}
                                      {license.model
                                        ? ` / ${license.model}`
                                        : ""}
                                    </span>
                                  </div>
                                )}
                                {license.description && (
                                  <div className="sm:col-span-2">
                                    <span className="text-gray-400">
                                      Description:
                                    </span>{" "}
                                    <span className="text-gray-700 font-medium">
                                      {license.description}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                          onClick={() => handleSearch(page - 1)}
                          disabled={page <= 1}
                          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        {Array.from(
                          { length: Math.min(totalPages, 5) },
                          (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handleSearch(pageNum)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                  pageNum === page
                                    ? "bg-[#1C6B3C] text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                        <button
                          onClick={() => handleSearch(page + 1)}
                          disabled={page >= totalPages}
                          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
