import { NextRequest, NextResponse } from "next/server";

const DQOS_CHARTDATA_URL = "https://dqos.bocra.org.bw/api/chartdata";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 7;
const DEFAULT_NETWORK = "3g";
const DEFAULT_SERVICE = "voice";
const DEFAULT_KPI = "na";
const DEFAULT_LOCATION_ID = "1";

const PROVIDERS = [
  {
    id: "mascom",
    name: "Mascom",
    color: "#204079",
    logoUrl: "https://dqos.bocra.org.bw/storage/mascom.png",
    networks: ["2G", "3G", "4G"],
  },
  {
    id: "orange",
    name: "Orange",
    color: "#fa6403",
    logoUrl: "https://dqos.bocra.org.bw/storage/orange.png",
    networks: ["2G", "3G", "4G"],
  },
  {
    id: "btc",
    name: "BTC",
    color: "#46a33e",
    logoUrl: "https://dqos.bocra.org.bw/storage/btc.png",
    networks: ["2G", "3G", "4G"],
  },
] as const;

const BENCHMARK_LINKS = [
  { id: "mascom-btc", label: "Mascom vs BTC", href: "https://dqos.bocra.org.bw/nms-benchmark#mascom-btc" },
  { id: "mascom-orange", label: "Mascom vs Orange", href: "https://dqos.bocra.org.bw/nms-benchmark#mascom-orange" },
  { id: "orange-btc", label: "Orange vs BTC", href: "https://dqos.bocra.org.bw/nms-benchmark#orange-btc" },
] as const;

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------

const MOCK_PROVIDER_METRICS: Record<
  string,
  { voice_na: number; voice_sa: number; voice_sr: number }
> = {
  mascom: { voice_na: 97.2, voice_sa: 94.8, voice_sr: 98.5 },
  orange: { voice_na: 95.6, voice_sa: 93.1, voice_sr: 97.2 },
  btc:    { voice_na: 93.8, voice_sa: 91.5, voice_sr: 96.0 },
};

function buildMockSummary(resolvedDate: string, providerFilter?: string) {
  const filtered = PROVIDERS.filter(
    (p) => !providerFilter || p.id === providerFilter,
  );

  const providers = filtered.map((p) => {
    const m = MOCK_PROVIDER_METRICS[p.id];
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      logoUrl: p.logoUrl,
      networks: p.networks,
      vendor: "Mixed",
      primaryMetric: { id: "voice_na", label: "3G Voice NA", value: m.voice_na },
      secondaryMetrics: [
        { id: "voice_sa", label: "Voice SA", value: m.voice_sa },
        { id: "voice_sr", label: "Voice SR", value: m.voice_sr },
      ],
    };
  });

  return { resolvedDate, providers };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MetricRecord = Record<string, string | number | null | undefined>;

type LocationEntry = {
  operator?: string;
  network?: string;
  vendor?: string;
  location_id?: number;
  location_level?: number;
  data?: MetricRecord;
};

type DqosChartData = Record<
  string,
  Record<string, Record<string, Record<string, LocationEntry>>>
>;

type DqosPayload = {
  success?: boolean;
  data?: { data?: DqosChartData };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseMetric(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getPreferredVendor(networkData?: Record<string, Record<string, LocationEntry>>) {
  if (!networkData) return null;
  const vendors = Object.keys(networkData);
  if (vendors.length === 0) return null;
  return vendors.includes("Mixed") ? "Mixed" : vendors[0];
}

function getLocationEntry(
  networkData: Record<string, Record<string, LocationEntry>> | undefined,
  vendor: string,
  locationId: string,
) {
  const vendorData = networkData?.[vendor];
  if (!vendorData) return null;
  return vendorData[locationId] ?? Object.values(vendorData)[0] ?? null;
}

function buildProviderSnapshot(
  provider: (typeof PROVIDERS)[number],
  chartData: DqosChartData[string] | undefined,
  locationId: string,
) {
  const networkData = chartData?.[DEFAULT_NETWORK];
  const preferredVendor = getPreferredVendor(networkData);
  if (!networkData || !preferredVendor) return null;

  const entry = getLocationEntry(networkData, preferredVendor, locationId);
  const metrics = entry?.data;
  if (!metrics) return null;

  const voiceNa = parseMetric(metrics.voice_na);
  const voiceSa = parseMetric(metrics.voice_sa);
  const voiceSr = parseMetric(metrics.voice_sr);

  if (voiceNa == null && voiceSa == null && voiceSr == null) return null;

  return {
    id: provider.id,
    name: provider.name,
    color: provider.color,
    logoUrl: provider.logoUrl,
    networks: provider.networks,
    vendor: preferredVendor,
    primaryMetric: { id: "voice_na", label: "3G Voice NA", value: voiceNa },
    secondaryMetrics: [
      { id: "voice_sa", label: "Voice SA", value: voiceSa },
      { id: "voice_sr", label: "Voice SR", value: voiceSr },
    ],
  };
}

async function fetchSummaryForDate(date: string, locationId: string, providerFilter?: string) {
  const searchParams = new URLSearchParams({
    kpi_type: "qos_values_for_location_level",
    level: "0",
    date,
    ...(locationId !== DEFAULT_LOCATION_ID ? { location_id: locationId } : {}),
    ...(providerFilter ? { provider: providerFilter } : {}),
  });

  const response = await fetch(
    `${DQOS_CHARTDATA_URL}?${searchParams.toString()}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) return null;

  const rawBody = await response.text();
  if (!rawBody.trim()) return null;

  let payload: DqosPayload;
  try {
    payload = JSON.parse(rawBody) as DqosPayload;
  } catch {
    return null;
  }

  const chartData = payload.data?.data;
  if (!chartData) return null;

  const candidateProviders = providerFilter
    ? PROVIDERS.filter((p) => p.id === providerFilter)
    : PROVIDERS;

  const providers = candidateProviders
    .map((p) => buildProviderSnapshot(p, chartData[p.id], locationId))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (providers.length === 0) return null;

  return { resolvedDate: date, providers };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateParam = searchParams.get("date") ?? null;
  const locationId = searchParams.get("locationId") ?? DEFAULT_LOCATION_ID;
  const providerCode = searchParams.get("providerCode") ?? undefined;

  try {
    let summary: Awaited<ReturnType<typeof fetchSummaryForDate>> = null;

    if (dateParam) {
      // Caller specified an exact date — try that date only
      summary = await fetchSummaryForDate(dateParam, locationId, providerCode);
    } else {
      // Auto-detect: walk back up to LOOKBACK_DAYS to find the latest available data
      for (let offset = 0; offset < LOOKBACK_DAYS; offset++) {
        const candidate = formatIsoDate(new Date(Date.now() - offset * DAY_IN_MS));
        summary = await fetchSummaryForDate(candidate, locationId, providerCode);
        if (summary) break;
      }
    }

    if (!summary) throw new Error("no data from upstream");

    return NextResponse.json(
      {
        fetchedAt: new Date().toISOString(),
        resolvedDate: summary.resolvedDate,
        locationId,
        preset: {
          network: DEFAULT_NETWORK.toUpperCase(),
          service: DEFAULT_SERVICE.toUpperCase(),
          kpi: DEFAULT_KPI.toUpperCase(),
          scope: locationId === DEFAULT_LOCATION_ID ? "National" : `Location ${locationId}`,
        },
        providers: summary.providers,
        detailsUrl: "https://dqos.bocra.org.bw/nms-details",
        summaryUrl: "https://dqos.bocra.org.bw/",
        benchmarkLinks: BENCHMARK_LINKS,
        source: "live",
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (err) {
    console.warn("[dqos/nms-summary] falling back to mock data:", err);

    const resolvedDate = dateParam ?? formatIsoDate(new Date());
    const mock = buildMockSummary(resolvedDate, providerCode);

    return NextResponse.json(
      {
        fetchedAt: new Date().toISOString(),
        resolvedDate: mock.resolvedDate,
        locationId,
        preset: {
          network: DEFAULT_NETWORK.toUpperCase(),
          service: DEFAULT_SERVICE.toUpperCase(),
          kpi: DEFAULT_KPI.toUpperCase(),
          scope: locationId === DEFAULT_LOCATION_ID ? "National" : `Location ${locationId}`,
        },
        providers: mock.providers,
        detailsUrl: "https://dqos.bocra.org.bw/nms-details",
        summaryUrl: "https://dqos.bocra.org.bw/",
        benchmarkLinks: BENCHMARK_LINKS,
        source: "mock",
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } },
    );
  }
}
