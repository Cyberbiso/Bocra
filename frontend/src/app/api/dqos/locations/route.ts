import { NextResponse } from "next/server";

const DQOS_LOCATIONS_URL = "https://dqos.bocra.org.bw/api/locations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock fallback — simplified bounding-box polygons for main Botswana districts
// ---------------------------------------------------------------------------

const MOCK_LOCATIONS = [
  {
    id: 1,
    name: "Botswana",
    level: 0,
    parent_id: null,
    area_feature: {
      type: "Feature",
      properties: { name: "Botswana" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [19.9986, -17.7788],
            [29.3757, -17.7788],
            [29.3757, -26.9068],
            [19.9986, -26.9068],
            [19.9986, -17.7788],
          ],
        ],
      },
    },
    ancestors: [],
  },
  {
    id: 2,
    name: "South East District",
    level: 1,
    parent_id: 1,
    area_feature: {
      type: "Feature",
      properties: { name: "South East District" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [25.4, -24.4],
            [26.5, -24.4],
            [26.5, -25.4],
            [25.4, -25.4],
            [25.4, -24.4],
          ],
        ],
      },
    },
    ancestors: [{ id: 1, name: "Botswana", level: 0, parent_id: null }],
  },
  {
    id: 3,
    name: "North East District",
    level: 1,
    parent_id: 1,
    area_feature: {
      type: "Feature",
      properties: { name: "North East District" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [26.8, -20.2],
            [28.1, -20.2],
            [28.1, -21.6],
            [26.8, -21.6],
            [26.8, -20.2],
          ],
        ],
      },
    },
    ancestors: [{ id: 1, name: "Botswana", level: 0, parent_id: null }],
  },
  {
    id: 4,
    name: "Central District",
    level: 1,
    parent_id: 1,
    area_feature: {
      type: "Feature",
      properties: { name: "Central District" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [23.5, -20.5],
            [27.5, -20.5],
            [27.5, -24.5],
            [23.5, -24.5],
            [23.5, -20.5],
          ],
        ],
      },
    },
    ancestors: [{ id: 1, name: "Botswana", level: 0, parent_id: null }],
  },
  {
    id: 5,
    name: "Ngamiland District",
    level: 1,
    parent_id: 1,
    area_feature: {
      type: "Feature",
      properties: { name: "Ngamiland District" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [19.9, -18.0],
            [24.5, -18.0],
            [24.5, -21.5],
            [19.9, -21.5],
            [19.9, -18.0],
          ],
        ],
      },
    },
    ancestors: [{ id: 1, name: "Botswana", level: 0, parent_id: null }],
  },
  {
    id: 6,
    name: "Kgatleng District",
    level: 1,
    parent_id: 1,
    area_feature: {
      type: "Feature",
      properties: { name: "Kgatleng District" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [26.0, -23.6],
            [27.2, -23.6],
            [27.2, -24.6],
            [26.0, -24.6],
            [26.0, -23.6],
          ],
        ],
      },
    },
    ancestors: [{ id: 1, name: "Botswana", level: 0, parent_id: null }],
  },
  {
    id: 7,
    name: "Southern District",
    level: 1,
    parent_id: 1,
    area_feature: {
      type: "Feature",
      properties: { name: "Southern District" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [23.0, -23.5],
            [26.5, -23.5],
            [26.5, -26.9],
            [23.0, -26.9],
            [23.0, -23.5],
          ],
        ],
      },
    },
    ancestors: [{ id: 1, name: "Botswana", level: 0, parent_id: null }],
  },
  {
    id: 8,
    name: "Kweneng District",
    level: 1,
    parent_id: 1,
    area_feature: {
      type: "Feature",
      properties: { name: "Kweneng District" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [24.0, -23.0],
            [26.0, -23.0],
            [26.0, -25.5],
            [24.0, -25.5],
            [24.0, -23.0],
          ],
        ],
      },
    },
    ancestors: [{ id: 1, name: "Botswana", level: 0, parent_id: null }],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonField<T>(value: unknown): T | null {
  if (value == null) return null;
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
  if (!parsed) return [];
  const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
  return list
    .filter((a) => a && typeof a.id === "number")
    .map((a) => ({ id: a.id, name: a.name, level: a.level, parent_id: a.parent_id ?? null }))
    .sort((a, b) => a.level - b.level);
}

function normalizeLocations(locations: DqosLocation[]) {
  return locations
    .map((loc) => {
      const areaFeature = parseJsonField(loc.area_feature);
      if (!areaFeature) return null;
      return {
        id: loc.id,
        name: loc.name,
        level: loc.level,
        parent_id: loc.parent_id ?? null,
        area_feature: areaFeature,
        ancestors: normalizeAncestors(loc.ancestors),
      };
    })
    .filter((loc): loc is NonNullable<typeof loc> => loc !== null)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  // Try live API first
  try {
    const response = await fetch(DQOS_LOCATIONS_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`upstream ${response.status}`);

    const payload = (await response.json()) as { data?: DqosLocation[] };
    const locations = Array.isArray(payload.data) ? payload.data : [];
    const normalized = normalizeLocations(locations);

    if (normalized.length === 0) throw new Error("empty location list");

    return NextResponse.json(
      { fetchedAt: new Date().toISOString(), count: normalized.length, locations: normalized, source: "live" },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.warn("[dqos/locations] falling back to mock data:", err);
  }

  // Fallback to mock
  return NextResponse.json(
    {
      fetchedAt: new Date().toISOString(),
      count: MOCK_LOCATIONS.length,
      locations: MOCK_LOCATIONS,
      source: "mock",
    },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
