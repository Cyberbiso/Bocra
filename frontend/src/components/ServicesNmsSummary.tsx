"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Gauge,
  GitCompareArrows,
  Loader2,
  RefreshCw,
  RadioTower,
} from "lucide-react";
import { useEffect, useState } from "react";

type ProviderSummary = {
  id: string;
  name: string;
  color: string;
  logoUrl: string;
  networks: string[];
  vendor: string;
  primaryMetric: {
    id: string;
    label: string;
    value: number | null;
  };
  secondaryMetrics: Array<{
    id: string;
    label: string;
    value: number | null;
  }>;
};

type SummaryPayload = {
  resolvedDate: string;
  preset: {
    network: string;
    service: string;
    kpi: string;
    scope: string;
  };
  providers: ProviderSummary[];
  detailsUrl: string;
  summaryUrl: string;
  benchmarkLinks: Array<{
    id: string;
    label: string;
    href: string;
  }>;
  error?: string;
};

function formatMetric(value: number | null) {
  if (value == null) {
    return "N/A";
  }

  if (Math.abs(value) < 1) {
    return `${value.toFixed(3)}%`;
  }

  return `${value.toFixed(2)}%`;
}

function formatSnapshotDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-BW", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function LoadingCard() {
  return (
    <div className="rounded-[1.8rem] border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-[#eef5ff]" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-[#eef5ff]" />
      </div>
      <div className="mt-6 h-8 w-36 animate-pulse rounded-full bg-[#eef5ff]" />
      <div className="mt-3 h-14 w-44 animate-pulse rounded-[1.4rem] bg-[#eef5ff]" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="h-20 animate-pulse rounded-[1.3rem] bg-[#f5f9ff]" />
        <div className="h-20 animate-pulse rounded-[1.3rem] bg-[#f5f9ff]" />
      </div>
    </div>
  );
}

export default function ServicesNmsSummary() {
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dqos/nms-summary");
      const payload = (await response.json()) as SummaryPayload;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load the DQOS NMS summary.");
      }

      setSummary(payload);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the DQOS NMS summary.";
      setError(message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm shadow-[#06193e]/5">
      <div className="border-b border-gray-100 bg-linear-to-r from-[#06193e] via-[#12346d] to-[#027ac6] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#d8ecff]">
              <Activity className="h-3.5 w-3.5" />
              NMS Summary
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Live DQOS provider snapshot for Mascom, Orange, and BTC.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              This block mirrors the public BOCRA DQOS summary pattern by pulling
              the national location-level snapshot and showing the three monitored
              operators side by side before users move into map search or deeper
              benchmark analysis.
            </p>

            {summary && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  Snapshot: {formatSnapshotDate(summary.resolvedDate)}
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  {summary.preset.scope}
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  {summary.preset.network}
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  {summary.preset.service}
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  KPI: {summary.preset.kpi}
                </span>
              </div>
            )}
          </div>

          <a
            href={summary?.summaryUrl ?? "https://dqos.bocra.org.bw/"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15"
          >
            Open Full DQOS Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="bg-[#fbfdff] px-6 py-6 sm:px-8">
        {loading ? (
          <div className="grid gap-4 xl:grid-cols-3">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : error ? (
          <div className="rounded-[1.8rem] border border-[#c61e53]/15 bg-[#fff7f9] p-6">
            <p className="text-sm font-semibold text-[#872030]">{error}</p>
            <button
              type="button"
              onClick={() => void loadSummary()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#872030] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#6d1926]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry DQOS Summary
            </button>
          </div>
        ) : summary ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="grid gap-4 xl:grid-cols-3">
              {summary.providers.map((provider) => (
                <article
                  key={provider.id}
                  className="rounded-[1.8rem] border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                      style={{
                        borderColor: `${provider.color}33`,
                        backgroundColor: `${provider.color}12`,
                      }}
                    >
                      <img
                        src={provider.logoUrl}
                        alt={`${provider.name} logo`}
                        className="h-9 w-auto object-contain"
                      />
                    </div>
                    <div
                      className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
                      style={{
                        backgroundColor: `${provider.color}12`,
                        color: provider.color,
                      }}
                    >
                      {provider.vendor}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-2xl font-black tracking-tight text-[#06193e]">
                      {provider.name}
                    </h3>
                    <div className="mt-4 rounded-[1.6rem] border border-gray-100 bg-[#fbfdff] p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                        {provider.primaryMetric.label}
                      </p>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <p className="text-4xl font-black tracking-tight text-[#06193e]">
                          {formatMetric(provider.primaryMetric.value)}
                        </p>
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: `${provider.color}14`, color: provider.color }}
                        >
                          <Gauge className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {provider.secondaryMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="rounded-[1.3rem] border border-gray-100 bg-[#f8fbff] p-4"
                      >
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-xl font-black text-[#06193e]">
                          {formatMetric(metric.value)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#75AADB]/20 bg-[#f3f8ff] px-3 py-1.5 text-xs font-semibold text-[#06193e]">
                      <RadioTower className="h-3.5 w-3.5 text-[#027ac6]" />
                      {provider.networks.join(" / ")}
                    </span>
                    <a
                      href={summary.detailsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#06193e] transition hover:border-[#027ac6] hover:text-[#027ac6]"
                    >
                      NMS details
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-[1.8rem] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#027ac6]">
                    NMS Benchmark
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-[#06193e]">
                    Compare operators using the public DQOS benchmark view.
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                    These links open the live DQOS benchmark routes with operator
                    pairs pre-selected the same way the public benchmark hash works.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {summary.benchmarkLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[#75AADB]/25 bg-[#f7fbff] px-4 py-2 text-sm font-semibold text-[#06193e] transition hover:border-[#027ac6] hover:text-[#027ac6]"
                    >
                      <GitCompareArrows className="h-4 w-4" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center rounded-[1.8rem] border border-gray-100 bg-white">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#027ac6]" />
              <p className="text-sm font-semibold">Loading NMS summary...</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
