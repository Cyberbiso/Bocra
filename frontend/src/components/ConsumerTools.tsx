"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Search, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import Particles from "./Particles";

// Luhn algorithm for IMEI validation
function luhnCheck(imei: string): boolean {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Mock TAC database (first 8 digits of IMEI)
const MOCK_DEVICES: Record<string, { brand: string; model: string; approved: boolean }> = {
  "35617610": { brand: "Samsung", model: "Galaxy S24", approved: true },
  "35380110": { brand: "Apple", model: "iPhone 15 Pro", approved: true },
  "86643304": { brand: "Huawei", model: "Mate 60 Pro", approved: false },
  "86765101": { brand: "Xiaomi", model: "Redmi Note 13", approved: true },
  "35384010": { brand: "Apple", model: "iPhone 14", approved: true },
  "35954510": { brand: "Samsung", model: "Galaxy A54", approved: true },
};

type ImeiResult =
  | { status: "invalid" }
  | { status: "approved"; brand: string; model: string }
  | { status: "rejected"; brand?: string; model?: string }
  | null;

const TARIFF_DATA = [
  {
    operator: "Mascom",
    color: "bg-red-600",
    data1gb: "P 25.00",
    dataDaily: "P 3.50",
    voice: "P 0.55/min",
    sms: "P 0.20",
    internet: "4G / LTE",
  },
  {
    operator: "Orange",
    color: "bg-orange-500",
    data1gb: "P 22.00",
    dataDaily: "P 3.00",
    voice: "P 0.50/min",
    sms: "P 0.18",
    internet: "4G / LTE",
  },
  {
    operator: "BTC",
    color: "bg-blue-700",
    data1gb: "P 28.00",
    dataDaily: "P 4.00",
    voice: "P 0.60/min",
    sms: "P 0.22",
    internet: "4G / LTE",
  },
];

export default function ConsumerTools() {
  const [activeTab, setActiveTab] = useState<"imei" | "tariff">("imei");
  const [imei, setImei] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ImeiResult>(null);

  async function checkImei() {
    if (!imei.trim()) return;
    setChecking(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));

    const digits = imei.replace(/\s/g, "");
    if (!luhnCheck(digits)) {
      setResult({ status: "invalid" });
    } else {
      const tac = digits.slice(0, 8);
      const device = MOCK_DEVICES[tac];
      if (device) {
        setResult(
          device.approved
            ? { status: "approved", brand: device.brand, model: device.model }
            : { status: "rejected", brand: device.brand, model: device.model }
        );
      } else {
        // Valid IMEI but not in TAC database — treat as approved for demo
        setResult({ status: "approved", brand: "Unknown Brand", model: "Unregistered Model" });
      }
    }
    setChecking(false);
  }

  return (
    <section id="consumer-tools" className="py-20 bg-[#06193e] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      <Particles count={120} connectionDistance={130} speed={0.25} maxRadius={1.5} maxOpacity={0.35} lineOpacity={0.09} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-widest mb-4"
          >
            Consumer Tools
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl font-bold text-white font-[family-name:var(--font-outfit)] mb-3"
          >
            Protect Yourself as a Consumer
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-blue-200 max-w-xl mx-auto"
          >
            Free tools to check your device&apos;s approval status and compare operator tariffs across Botswana.
          </motion.p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 rounded-xl p-1 flex gap-1 backdrop-blur-sm">
            {(["imei", "tariff"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-white text-[#06193e] shadow"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                {tab === "imei" ? "IMEI Checker" : "Tariff Comparison"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* IMEI Checker */}
          {activeTab === "imei" && (
            <motion.div
              key="imei"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#027ac6]/10 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-[#027ac6]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#06193e] text-lg">IMEI Device Checker</h3>
                    <p className="text-gray-500 text-sm">Verify if your device is approved for use in Botswana</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-700">
                  <strong>How to find your IMEI:</strong> Dial <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">*#06#</code> on your phone, or check Settings → About Phone.
                </div>

                <div className="relative mb-4">
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => {
                      setImei(e.target.value.replace(/\D/g, "").slice(0, 15));
                      setResult(null);
                    }}
                    placeholder="Enter 15-digit IMEI number"
                    maxLength={15}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg font-mono tracking-widest focus:outline-none focus:border-[#027ac6] transition-all"
                  />
                  <span className="absolute right-4 top-4 text-xs text-gray-400 font-medium">
                    {imei.length}/15
                  </span>
                </div>

                <button
                  onClick={checkImei}
                  disabled={imei.length !== 15 || checking}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#027ac6] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#005ea6] transition-colors"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Check Device
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 rounded-2xl p-5 ${
                        result.status === "approved"
                          ? "bg-green-50 border border-green-100"
                          : result.status === "rejected"
                          ? "bg-red-50 border border-red-100"
                          : "bg-yellow-50 border border-yellow-100"
                      }`}
                    >
                      {result.status === "invalid" && (
                        <div className="flex items-start gap-3">
                          <XCircle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-yellow-800">Invalid IMEI</p>
                            <p className="text-yellow-700 text-sm mt-1">
                              The number you entered did not pass the Luhn check. Please verify your IMEI and try again.
                            </p>
                          </div>
                        </div>
                      )}
                      {result.status === "approved" && (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-green-800">Device Approved ✓</p>
                            <p className="text-green-700 text-sm mt-1">
                              <strong>{result.brand} {result.model}</strong> is type-approved for use in Botswana.
                            </p>
                          </div>
                        </div>
                      )}
                      {result.status === "rejected" && (
                        <div className="flex items-start gap-3">
                          <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-red-800">Not Approved</p>
                            <p className="text-red-700 text-sm mt-1">
                              <strong>{result.brand} {result.model}</strong> is not type-approved for use in Botswana. Using this device may violate the Communications Regulatory Authority Act.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Tariff Comparison */}
          {activeTab === "tariff" && (
            <motion.div
              key="tariff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">
                    Indicative tariffs as regulated by BOCRA. Last updated March 2026. Verify current rates with operators.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wide">Service</th>
                        {TARIFF_DATA.map((op) => (
                          <th key={op.operator} className="px-6 py-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${op.color}`} />
                              <span className="font-bold text-[#06193e]">{op.operator}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "1GB Data Bundle", key: "data1gb" as const },
                        { label: "Daily Data Bundle", key: "dataDaily" as const },
                        { label: "Voice Call", key: "voice" as const },
                        { label: "SMS", key: "sms" as const },
                        { label: "Max Network", key: "internet" as const },
                      ].map((row, i) => (
                        <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{row.label}</td>
                          {TARIFF_DATA.map((op) => (
                            <td key={op.operator} className="px-6 py-4 text-center text-sm font-bold text-[#06193e]">
                              {op[row.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Prices in Botswana Pula (BWP). VAT inclusive.</p>
                  <a
                    href="https://www.bocra.org.bw/tariffs"
                    className="flex items-center gap-1 text-[#027ac6] text-sm font-bold hover:underline"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Full Tariff Schedule <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
