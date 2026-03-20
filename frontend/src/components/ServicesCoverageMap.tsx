"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Loader2,
  MapPinned,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type GeoPoint = [number, number];

type GeoPolygon = {
  type: "Polygon";
  coordinates: GeoPoint[][];
};

type GeoMultiPolygon = {
  type: "MultiPolygon";
  coordinates: GeoPoint[][][];
};

type SupportedGeometry = GeoPolygon | GeoMultiPolygon;

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
  area_feature: SupportedGeometry;
  ancestors: DqosAncestor[];
};

type PreparedLocation = DqosLocation & {
  displayName: string;
  searchText: string;
  path: string;
  projectedBounds: Bounds;
  trail: string[];
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const MAP_WIDTH = 920;
const MAP_HEIGHT = 700;
const MAP_PADDING = 44;
const SEARCH_RESULT_LIMIT = 8;

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isSupportedGeometry(value: unknown): value is SupportedGeometry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const geometry = value as { type?: string; coordinates?: unknown };

  return (
    (geometry.type === "Polygon" || geometry.type === "MultiPolygon") &&
    Array.isArray(geometry.coordinates)
  );
}

function getGeometryBounds(geometry: SupportedGeometry): Bounds | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const visitPoint = ([lng, lat]: GeoPoint) => {
    minX = Math.min(minX, lng);
    minY = Math.min(minY, lat);
    maxX = Math.max(maxX, lng);
    maxY = Math.max(maxY, lat);
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => ring.forEach(visitPoint));
  } else {
    geometry.coordinates.forEach((polygon) =>
      polygon.forEach((ring) => ring.forEach(visitPoint)),
    );
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function buildProjector(bounds: Bounds) {
  const width = bounds.maxX - bounds.minX || 1;
  const height = bounds.maxY - bounds.minY || 1;
  const scale = Math.min(
    (MAP_WIDTH - MAP_PADDING * 2) / width,
    (MAP_HEIGHT - MAP_PADDING * 2) / height,
  );
  const xOffset = (MAP_WIDTH - width * scale) / 2;
  const yOffset = (MAP_HEIGHT - height * scale) / 2;

  return ([lng, lat]: GeoPoint) => {
    const x = xOffset + (lng - bounds.minX) * scale;
    const y = MAP_HEIGHT - (yOffset + (lat - bounds.minY) * scale);
    return [x, y] as const;
  };
}

function geometryToPath(
  geometry: SupportedGeometry,
  projectPoint: (point: GeoPoint) => readonly [number, number],
) {
  const polygonToPath = (polygon: GeoPoint[][]) =>
    polygon
      .map((ring) => {
        if (ring.length === 0) {
          return "";
        }

        return ring
          .map((point, index) => {
            const [x, y] = projectPoint(point);
            return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ")
          .concat(" Z");
      })
      .join(" ");

  return geometry.type === "Polygon"
    ? polygonToPath(geometry.coordinates)
    : geometry.coordinates.map(polygonToPath).join(" ");
}

function projectBounds(
  geometryBounds: Bounds,
  projectPoint: (point: GeoPoint) => readonly [number, number],
): Bounds {
  const corners: GeoPoint[] = [
    [geometryBounds.minX, geometryBounds.minY],
    [geometryBounds.minX, geometryBounds.maxY],
    [geometryBounds.maxX, geometryBounds.minY],
    [geometryBounds.maxX, geometryBounds.maxY],
  ];

  const projected = corners.map(projectPoint);
  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function expandProjectedBounds(bounds: Bounds) {
  const margin = 40;
  const width = Math.max(bounds.maxX - bounds.minX, 120);
  const height = Math.max(bounds.maxY - bounds.minY, 120);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const halfWidth = width / 2 + margin;
  const halfHeight = height / 2 + margin;

  const minX = Math.max(0, centerX - halfWidth);
  const minY = Math.max(0, centerY - halfHeight);
  const maxX = Math.min(MAP_WIDTH, centerX + halfWidth);
  const maxY = Math.min(MAP_HEIGHT, centerY + halfHeight);

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}

function buildViewBox(bounds?: Bounds | null) {
  if (!bounds) {
    return `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;
  }

  return `${bounds.minX} ${bounds.minY} ${Math.max(bounds.maxX - bounds.minX, 1)} ${Math.max(bounds.maxY - bounds.minY, 1)}`;
}

function levelLabel(level: number) {
  if (level === 0) {
    return "Country";
  }

  return `Area level ${level}`;
}

function buildTrail(location: DqosLocation) {
  return [...location.ancestors.map((ancestor) => titleCase(ancestor.name)), titleCase(location.name)];
}

function locationScore(location: PreparedLocation, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const exactName = normalizeText(location.displayName);
  if (exactName === normalizedQuery) {
    return 1000;
  }

  if (exactName.startsWith(normalizedQuery)) {
    return 800;
  }

  if (location.searchText.includes(normalizedQuery)) {
    return 500 - Math.abs(location.searchText.indexOf(normalizedQuery));
  }

  return 0;
}

export default function ServicesCoverageMap() {
  const [locations, setLocations] = useState<DqosLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  async function loadLocations() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dqos/locations");
      const payload = (await response.json()) as {
        locations?: DqosLocation[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load location data.");
      }

      const normalized = Array.isArray(payload.locations)
        ? payload.locations.filter((location) => isSupportedGeometry(location.area_feature))
        : [];

      setLocations(normalized);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load location data right now.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLocations();
  }, []);

  const prepared = useMemo(() => {
    if (locations.length === 0) {
      return null;
    }

    const country = locations.find((location) => location.level === 0);
    const countryBounds =
      (country && getGeometryBounds(country.area_feature)) ||
      getGeometryBounds(locations[0].area_feature);

    if (!countryBounds) {
      return null;
    }

    const projectPoint = buildProjector(countryBounds);
    const preparedLocations = locations
      .map((location) => {
        const bounds = getGeometryBounds(location.area_feature);
        if (!bounds) {
          return null;
        }

        const trail = buildTrail(location);
        const displayName = titleCase(location.name);
        return {
          ...location,
          displayName,
          searchText: normalizeText(`${trail.join(" ")} ${levelLabel(location.level)}`),
          trail,
          path: geometryToPath(location.area_feature, projectPoint),
          projectedBounds: projectBounds(bounds, projectPoint),
        };
      })
      .filter((location): location is PreparedLocation => location !== null);

    return {
      country: preparedLocations.find((location) => location.level === 0) ?? null,
      locations: preparedLocations,
      byId: new Map(preparedLocations.map((location) => [location.id, location])),
      baseLocations: preparedLocations.filter((location) => location.level === 1),
      featuredLocations: preparedLocations.filter((location) => location.level === 1).slice(0, 6),
    };
  }, [locations]);

  const selectedLocation = useMemo(() => {
    if (!prepared || selectedLocationId == null) {
      return null;
    }

    return prepared.byId.get(selectedLocationId) ?? null;
  }, [prepared, selectedLocationId]);

  const suggestionLocations = useMemo(() => {
    if (!prepared) {
      return [];
    }

    const searchable = prepared.locations.filter((location) => location.level > 0);
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return prepared.featuredLocations;
    }

    return searchable
      .map((location) => ({
        location,
        score: locationScore(location, normalizedQuery),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.location.level - right.location.level)
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((entry) => entry.location);
  }, [prepared, query]);

  const activeViewBox = useMemo(() => {
    return buildViewBox(
      selectedLocation ? expandProjectedBounds(selectedLocation.projectedBounds) : null,
    );
  }, [selectedLocation]);

  const locationCount = prepared
    ? prepared.locations.filter((location) => location.level > 0).length
    : 0;

  function handleLocationSelect(location: PreparedLocation) {
    setSelectedLocationId(location.id);
    setQuery(location.displayName);
    setResultsOpen(false);
  }

  return (
    <section className="rounded-[2rem] border border-gray-100 bg-white shadow-sm shadow-[#06193e]/5 overflow-hidden">
      <div className="border-b border-gray-100 bg-linear-to-r from-[#06193e] via-[#0d2d63] to-[#027ac6] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#d8ecff]">
              <Sparkles className="h-3.5 w-3.5" />
              Network Coverage Explorer
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Search a location and focus the map instantly.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              This mirrors the public DQOS geographic search flow: choose an area,
              jump straight to its boundary, and inspect the service region without
              leaving the Services section.
            </p>
          </div>

          <a
            href="https://dqos.bocra.org.bw/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15"
          >
            Open Full DQOS Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="border-b border-gray-100 bg-[#f8fbff] p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="relative">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-[#027ac6]">
              Search Location
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setResultsOpen(true);
                }}
                onFocus={() => setResultsOpen(true)}
                placeholder="Try Gaborone, Francistown, Maun..."
                className="w-full rounded-2xl border border-[#75AADB]/25 bg-white px-11 py-3.5 text-sm text-[#06193e] shadow-sm outline-none transition focus:border-[#027ac6] focus:ring-4 focus:ring-[#75AADB]/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedLocationId(null);
                    setResultsOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-[#06193e]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {resultsOpen && suggestionLocations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute z-20 mt-3 max-h-96 w-full overflow-y-auto rounded-[1.5rem] border border-gray-100 bg-white p-2 shadow-2xl shadow-[#06193e]/10"
                >
                  {suggestionLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="block w-full rounded-[1.1rem] px-4 py-3 text-left transition hover:bg-[#f3f8ff]"
                    >
                      <p className="text-sm font-bold text-[#06193e]">{location.displayName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {levelLabel(location.level)} • {location.trail.slice(0, -1).join(" / ") || "Botswana"}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-[#75AADB]/20 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#027ac6]/10 text-[#027ac6]">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#027ac6]">
                    Coverage Search
                  </p>
                  <p className="text-sm text-gray-500">
                    {locationCount.toLocaleString()} searchable DQOS service areas
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(query ? suggestionLocations : prepared?.featuredLocations ?? []).slice(0, 4).map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                    className="rounded-full border border-[#75AADB]/30 bg-[#f7fbff] px-3 py-1.5 text-xs font-semibold text-[#06193e] transition hover:border-[#027ac6] hover:bg-[#eaf4ff]"
                  >
                    {location.displayName}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#027ac6]">
                    Selected Area
                  </p>
                  <h3 className="mt-2 text-xl font-black text-[#06193e]">
                    {selectedLocation ? selectedLocation.displayName : "Botswana"}
                  </h3>
                </div>
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocationId(null);
                      setQuery("");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:border-[#027ac6] hover:text-[#027ac6]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset View
                  </button>
                )}
              </div>

              {selectedLocation ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-[#f8fbff] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#027ac6]">
                      Administrative Trail
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#06193e]">
                      {selectedLocation.trail.join(" / ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Area Type
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#06193e]">
                        {levelLabel(selectedLocation.level)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Map Action
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#06193e]">
                        Boundary focused
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                  Search for a district, town, or service area and the map will
                  zoom straight to that boundary, just like the live DQOS
                  experience.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-[1.5rem] border border-[#c61e53]/15 bg-[#fff7f9] p-5">
                <p className="text-sm font-semibold text-[#872030]">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadLocations()}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#872030] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#6d1926]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Loading
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative min-h-[500px] overflow-hidden bg-linear-to-br from-[#06193e] via-[#0a2553] to-[#102e67] p-4 sm:p-6">
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(117,170,219,0.5) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(117,170,219,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(212,146,26,0.18),transparent_28%)]" />

          <div className="relative flex h-full min-h-[500px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-[0_30px_80px_rgba(6,25,62,0.35)] backdrop-blur-sm">
            {loading || !prepared ? (
              <div className="flex flex-col items-center gap-3 text-white/80">
                <Loader2 className="h-8 w-8 animate-spin text-[#75AADB]" />
                <p className="text-sm font-semibold">
                  Loading DQOS location boundaries...
                </p>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-[#06193e]/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#d8ecff] backdrop-blur">
                  Interactive Services Map
                </div>
                {selectedLocation && (
                  <div className="absolute right-4 top-4 z-10 rounded-full border border-[#D4921A]/20 bg-[#D4921A]/15 px-3 py-1.5 text-xs font-bold text-[#ffe1a0] backdrop-blur">
                    Focused: {selectedLocation.displayName}
                  </div>
                )}

                <svg
                  viewBox={activeViewBox}
                  className="h-auto w-full transition-[viewBox] duration-500"
                  aria-label="Interactive Botswana services coverage map"
                >
                  <defs>
                    <filter id="services-map-glow">
                      <feGaussianBlur stdDeviation="12" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {prepared.country && (
                    <path
                      d={prepared.country.path}
                      fill="#0d2a5e"
                      stroke="#75AADB"
                      strokeWidth="4"
                      strokeOpacity="0.6"
                    />
                  )}

                  {prepared.baseLocations.map((location) => {
                    const isSelected = selectedLocation?.id === location.id;
                    return (
                      <path
                        key={location.id}
                        d={location.path}
                        fill={isSelected ? "#D4921A" : "#163d7b"}
                        fillOpacity={isSelected ? 0.88 : 0.68}
                        stroke={isSelected ? "#ffe4a7" : "#9fd4ff"}
                        strokeWidth={isSelected ? 3 : 1.25}
                        strokeOpacity={isSelected ? 0.95 : 0.34}
                        className="cursor-pointer transition-all duration-300 hover:fill-[#1f4d98] hover:stroke-[#d8ecff]"
                        vectorEffect="non-scaling-stroke"
                        onClick={() => handleLocationSelect(location)}
                      />
                    );
                  })}

                  {selectedLocation && selectedLocation.level !== 1 && (
                    <path
                      d={selectedLocation.path}
                      fill="#D4921A"
                      fillOpacity={0.88}
                      stroke="#fff0c4"
                      strokeWidth="3"
                      strokeOpacity="0.95"
                      vectorEffect="non-scaling-stroke"
                      filter="url(#services-map-glow)"
                    />
                  )}
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
