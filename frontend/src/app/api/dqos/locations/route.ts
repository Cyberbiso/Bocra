import { NextResponse } from "next/server";

const DQOS_LOCATIONS_URL = "https://dqos.bocra.org.bw/api/locations";

type DqosAncestor = {
  id: number;
  name: string;
  level: number;
  parent_id: number | null;
};

type DqosLocation = {
  id: number;
  name: string;
  level: number;
  parent_id: number | null;
  area_feature: unknown;
  ancestors: unknown;
};

function parseJsonField<T>(value: unknown): T | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  return value as T;
}

function normalizeAncestors(value: unknown): DqosAncestor[] {
  const parsed = parseJsonField<Record<string, DqosAncestor> | DqosAncestor[]>(value);

  if (!parsed) {
    return [];
  }

  const list = Array.isArray(parsed) ? parsed : Object.values(parsed);

  return list
    .filter((ancestor) => ancestor && typeof ancestor.id === "number")
    .map((ancestor) => ({
      id: ancestor.id,
      name: ancestor.name,
      level: ancestor.level,
      parent_id: ancestor.parent_id ?? null,
    }))
    .sort((a, b) => a.level - b.level);
}

export async function GET() {
  try {
    const response = await fetch(DQOS_LOCATIONS_URL, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 6,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `DQOS request failed with status ${response.status}` },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as { data?: DqosLocation[] };
    const locations = Array.isArray(payload.data) ? payload.data : [];

    const normalized = locations
      .map((location) => {
        const areaFeature = parseJsonField(location.area_feature);

        if (!areaFeature) {
          return null;
        }

        return {
          id: location.id,
          name: location.name,
          level: location.level,
          parent_id: location.parent_id ?? null,
          area_feature: areaFeature,
          ancestors: normalizeAncestors(location.ancestors),
        };
      })
      .filter((location): location is NonNullable<typeof location> => location !== null)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

    return NextResponse.json(
      {
        fetchedAt: new Date().toISOString(),
        count: normalized.length,
        locations: normalized,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load DQOS locations", error);

    return NextResponse.json(
      { error: "Unable to load DQOS locations right now." },
      { status: 500 },
    );
  }
}
