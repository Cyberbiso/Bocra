import { NextResponse } from "next/server";

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
  {
    id: "mascom-btc",
    label: "Mascom vs BTC",
    href: "https://dqos.bocra.org.bw/nms-benchmark#mascom-btc",
  },
  {
    id: "mascom-orange",
    label: "Mascom vs Orange",
    href: "https://dqos.bocra.org.bw/nms-benchmark#mascom-orange",
  },
  {
    id: "orange-btc",
    label: "Orange vs BTC",
    href: "https://dqos.bocra.org.bw/nms-benchmark#orange-btc",
  },
] as const;

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
  data?: {
    data?: DqosChartData;
  };
};

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseMetric(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getPreferredVendor(
  networkData?: Record<string, Record<string, LocationEntry>>,
) {
  if (!networkData) {
    return null;
  }

  const vendors = Object.keys(networkData);

  if (vendors.length === 0) {
    return null;
  }

  return vendors.includes("Mixed") ? "Mixed" : vendors[0];
}

function getLocationEntry(
  networkData: Record<string, Record<string, LocationEntry>> | undefined,
  vendor: string,
) {
  const vendorData = networkData?.[vendor];

  if (!vendorData) {
    return null;
  }

  return vendorData[DEFAULT_LOCATION_ID] ?? Object.values(vendorData)[0] ?? null;
}

function buildProviderSnapshot(
  provider: (typeof PROVIDERS)[number],
  chartData: DqosChartData[string] | undefined,
) {
  const networkData = chartData?.[DEFAULT_NETWORK];
  const preferredVendor = getPreferredVendor(networkData);

  if (!networkData || !preferredVendor) {
    return null;
  }

  const entry = getLocationEntry(networkData, preferredVendor);
  const metrics = entry?.data;

  if (!metrics) {
    return null;
  }

  const voiceNa = parseMetric(metrics.voice_na);
  const voiceSa = parseMetric(metrics.voice_sa);
  const voiceSr = parseMetric(metrics.voice_sr);

  if (voiceNa == null && voiceSa == null && voiceSr == null) {
    return null;
  }

  return {
    id: provider.id,
    name: provider.name,
    color: provider.color,
    logoUrl: provider.logoUrl,
    networks: provider.networks,
    vendor: preferredVendor,
    primaryMetric: {
      id: "voice_na",
      label: "3G Voice NA",
      value: voiceNa,
    },
    secondaryMetrics: [
      {
        id: "voice_sa",
        label: "Voice SA",
        value: voiceSa,
      },
      {
        id: "voice_sr",
        label: "Voice SR",
        value: voiceSr,
      },
    ],
  };
}

async function fetchSummaryForDate(date: string) {
  const searchParams = new URLSearchParams({
    kpi_type: "qos_values_for_location_level",
    level: "0",
    date,
  });

  const response = await fetch(`${DQOS_CHARTDATA_URL}?${searchParams.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 60 * 60,
    },
  });

  if (!response.ok) {
    return null;
  }

  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return null;
  }

  let payload: DqosPayload;

  try {
    payload = JSON.parse(rawBody) as DqosPayload;
  } catch {
    return null;
  }

  const chartData = payload.data?.data;

  if (!chartData) {
    return null;
  }

  const providers = PROVIDERS.map((provider) =>
    buildProviderSnapshot(provider, chartData[provider.id]),
  ).filter((provider): provider is NonNullable<typeof provider> => provider !== null);

  if (providers.length === 0) {
    return null;
  }

  return {
    resolvedDate: date,
    providers,
  };
}

export async function GET() {
  try {
    let summary: Awaited<ReturnType<typeof fetchSummaryForDate>> = null;

    for (let offset = 0; offset < LOOKBACK_DAYS; offset += 1) {
      const candidateDate = formatIsoDate(new Date(Date.now() - offset * DAY_IN_MS));
      summary = await fetchSummaryForDate(candidateDate);

      if (summary) {
        break;
      }
    }

    if (!summary) {
      return NextResponse.json(
        { error: "Unable to load the DQOS NMS summary right now." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        fetchedAt: new Date().toISOString(),
        resolvedDate: summary.resolvedDate,
        preset: {
          network: DEFAULT_NETWORK.toUpperCase(),
          service: DEFAULT_SERVICE.toUpperCase(),
          kpi: DEFAULT_KPI.toUpperCase(),
          scope: "National",
        },
        providers: summary.providers,
        detailsUrl: "https://dqos.bocra.org.bw/nms-details",
        summaryUrl: "https://dqos.bocra.org.bw/",
        benchmarkLinks: BENCHMARK_LINKS,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load DQOS NMS summary", error);

    return NextResponse.json(
      { error: "Unable to load the DQOS NMS summary right now." },
      { status: 500 },
    );
  }
}
