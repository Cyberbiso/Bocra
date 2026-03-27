'use client'

import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

export interface QoSLocation {
  id: number
  name: string
  area_feature: object | null
}

interface QoSMapProps {
  locations: QoSLocation[]
  scores: Record<number, Record<string, number>>
}

const LAYERS = [
  { id: 'all', label: 'All', color: '#003580' },
  { id: 'mascom', label: 'Mascom', color: '#204079' },
  { id: 'orange', label: 'Orange', color: '#fa6403' },
  { id: 'btc', label: 'BTC', color: '#46a33e' },
]

type SupportedGeometry = Extract<Geometry, { type: 'Polygon' | 'MultiPolygon' }>

function isPosition(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1])
  )
}

function isLinearRing(value: unknown): value is [number, number][] {
  return Array.isArray(value) && value.length >= 4 && value.every(isPosition)
}

function isPolygonCoordinates(value: unknown): value is [number, number][][] {
  return Array.isArray(value) && value.length > 0 && value.every(isLinearRing)
}

function isMultiPolygonCoordinates(value: unknown): value is [number, number][][][] {
  return Array.isArray(value) && value.length > 0 && value.every(isPolygonCoordinates)
}

function extractGeometry(value: unknown): SupportedGeometry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as { type?: string; geometry?: unknown; coordinates?: unknown }

  if (candidate.type === 'Feature') {
    return extractGeometry(candidate.geometry)
  }

  if (candidate.type === 'Polygon' && isPolygonCoordinates(candidate.coordinates)) {
    return {
      type: 'Polygon',
      coordinates: candidate.coordinates,
    }
  }

  if (candidate.type === 'MultiPolygon' && isMultiPolygonCoordinates(candidate.coordinates)) {
    return {
      type: 'MultiPolygon',
      coordinates: candidate.coordinates,
    }
  }

  return null
}

function qosColor(score: number) {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

function getScore(locScores: Record<string, number>, layer: string): number {
  if (layer === 'all') {
    const vals = Object.values(locScores)
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 72
  }
  return locScores[layer] ?? 72
}

export default function QoSMap({ locations, scores }: QoSMapProps) {
  const [activeLayer, setActiveLayer] = useState('all')

  const featureCollection = useMemo<FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: locations.reduce<Feature[]>((features, loc) => {
      const geometry = extractGeometry(loc.area_feature)
      if (!geometry) return features

      features.push({
        type: 'Feature',
        properties: { id: loc.id, name: loc.name, scores: scores[loc.id] ?? {} },
        geometry,
      })

      return features
    }, []),
  }), [locations, scores])

  const hasFeatures = featureCollection.features.length > 0

  function styleFeature(feature?: Feature) {
    const locScores = (feature?.properties?.scores ?? {}) as Record<string, number>
    const score = getScore(locScores, activeLayer)
    return { fillColor: qosColor(score), fillOpacity: 0.55, color: '#ffffff', weight: 1 }
  }

  function onEachFeature(feature: Feature, layer: L.Layer) {
    const name = (feature.properties?.name ?? 'Unknown') as string
    const locScores = (feature.properties?.scores ?? {}) as Record<string, number>
    const score = Math.round(getScore(locScores, activeLayer))
    const color = qosColor(score)
    ;(layer as L.Path).bindPopup(
      `<div style="min-width:150px">` +
      `<strong style="font-size:13px">${name}</strong><br/>` +
      `<span style="font-size:12px;color:#6b7280">QoS Score: </span>` +
      `<span style="color:${color};font-weight:600">${score}%</span>` +
      `</div>`,
    )
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Layer toggle */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-white rounded-lg shadow-md p-1 border border-gray-200">
        {LAYERS.map((op) => (
          <button
            key={op.id}
            onClick={() => setActiveLayer(op.id)}
            className={
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors ' +
              (activeLayer === op.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100')
            }
            style={activeLayer === op.id ? { backgroundColor: op.color } : undefined}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-3 z-[1000] bg-white rounded-lg shadow-md p-3 border border-gray-200 text-xs">
        <p className="font-semibold text-gray-700 mb-2">QoS Score</p>
        {[
          { color: '#22c55e', label: '≥85% Good' },
          { color: '#f59e0b', label: '70–84% Fair' },
          { color: '#ef4444', label: '<70% Poor' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
            <span className="w-3 h-3 rounded-sm flex-none" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* No-data overlay */}
      {!hasFeatures && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 rounded-lg px-4 py-2 text-sm text-gray-500 shadow border border-gray-200">
            Coverage polygons unavailable — base map shown
          </div>
        </div>
      )}

      <MapContainer
        center={[-22.3285, 24.6849]}
        zoom={6}
        className="w-full h-full"
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasFeatures && (
          <GeoJSON
            key={activeLayer}
            data={featureCollection}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  )
}
