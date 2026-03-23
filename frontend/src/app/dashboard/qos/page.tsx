'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import { useDemoAwareQuery } from '@/lib/demo/useDemoAwareQuery'
import {
  DEMO_NMS_SUMMARY,
  DEMO_LOCATIONS_RESPONSE,
} from '@/lib/demo/seed-data'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { QoSLocation } from '@/components/dashboard/qos/QoSMap'

const QoSMap = dynamic(() => import('@/components/dashboard/qos/QoSMap'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string
  name: string
  color: string
  primaryMetric: { id: string; label: string; value: number | null }
  secondaryMetrics: { id: string; label: string; value: number | null }[]
}

interface NmsSummaryResponse {
  providers?: Provider[]
}

interface LocationsResponse {
  locations?: QoSLocation[]
}

// ─── Mock fallback data ────────────────────────────────────────────────────────

const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'mascom', name: 'Mascom', color: '#204079',
    primaryMetric: { id: 'voice_na', label: '3G Voice NA', value: 1.82 },
    secondaryMetrics: [
      { id: 'voice_sa', label: 'Voice SA', value: 97.2 },
      { id: 'voice_sr', label: 'Voice SR', value: 94.5 },
    ],
  },
  {
    id: 'orange', name: 'Orange', color: '#fa6403',
    primaryMetric: { id: 'voice_na', label: '3G Voice NA', value: 2.14 },
    secondaryMetrics: [
      { id: 'voice_sa', label: 'Voice SA', value: 96.8 },
      { id: 'voice_sr', label: 'Voice SR', value: 93.1 },
    ],
  },
  {
    id: 'btc', name: 'BTC', color: '#46a33e',
    primaryMetric: { id: 'voice_na', label: '3G Voice NA', value: 1.55 },
    secondaryMetrics: [
      { id: 'voice_sa', label: 'Voice SA', value: 98.1 },
      { id: 'voice_sr', label: 'Voice SR', value: 95.8 },
    ],
  },
]

const OP_SEED: Record<string, number> = { mascom: 1, orange: 2, btc: 3 }

function mockScore(locationId: number, operatorId: string) {
  return ((locationId * 7 + (OP_SEED[operatorId] ?? 1) * 13) % 35) + 65
}

// ─── Chart data ────────────────────────────────────────────────────────────────

function generateTrendData(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return {
      date: d.toLocaleDateString('en-BW', { month: 'short', day: 'numeric' }),
      mascom: +(96 + Math.sin(i * 0.28 + 0.0) * 2.5).toFixed(1),
      orange: +(94 + Math.sin(i * 0.28 + 1.2) * 2.5).toFixed(1),
      btc:    +(95 + Math.sin(i * 0.28 + 2.4) * 2.5).toFixed(1),
    }
  })
}

const REGION_DATA = [
  { region: 'Gaborone',    mascom: 94.2, orange: 92.8, btc: 95.1 },
  { region: 'Francistown', mascom: 91.5, orange: 90.2, btc: 92.3 },
  { region: 'Maun',        mascom: 87.3, orange: 85.9, btc: 88.7 },
  { region: 'Serowe',      mascom: 89.8, orange: 88.4, btc: 90.5 },
  { region: 'Lobatse',     mascom: 92.1, orange: 91.3, btc: 93.4 },
  { region: 'Kasane',      mascom: 85.6, orange: 84.2, btc: 86.9 },
]

const RANGE_OPTIONS = [
  { id: '7d',  label: '7 days',  days: 7  },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
]

const METRIC_OPTIONS = [
  { id: 'voice', label: 'Voice Quality'  },
  { id: 'data',  label: 'Data Throughput' },
  { id: 'drop',  label: 'Drop Rate'       },
  { id: 'sms',   label: 'SMS Delivery'    },
]

const OPERATOR_OPTIONS = [
  { id: 'mascom', label: 'Mascom', color: '#204079' },
  { id: 'orange', label: 'Orange', color: '#fa6403' },
  { id: 'btc',    label: 'BTC',    color: '#46a33e' },
]

// ─── Scorecard ────────────────────────────────────────────────────────────────

function KpiScorecard({ provider }: { provider: Provider }) {
  const na = provider.primaryMetric.value
  const naOk = na != null && na <= 2.0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-none"
            style={{ backgroundColor: provider.color }}
          />
          <span className="font-semibold text-gray-900 text-[15px]">{provider.name}</span>
        </div>
        <span
          className={cn(
            'text-xs px-2.5 py-0.5 rounded-full font-medium',
            naOk ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
          )}
        >
          {naOk ? 'Compliant' : 'Review'}
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-0.5">{provider.primaryMetric.label}</p>
        <div className="flex items-end gap-1.5 mb-4">
          <span className={cn('text-3xl font-bold', naOk ? 'text-green-600' : 'text-red-600')}>
            {na != null ? `${na.toFixed(2)}%` : '—'}
          </span>
          <span className="text-xs text-gray-400 pb-1">non-accessibility</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          {provider.secondaryMetrics.map((m) => (
            <div key={m.id}>
              <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
              <p className="text-sm font-semibold text-gray-800">
                {m.value != null ? `${m.value.toFixed(1)}%` : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function QoSPage() {
  const [range, setRange]   = useState('30d')
  const [metric, setMetric] = useState('voice')
  const [activeOps, setActiveOps] = useState<Set<string>>(
    new Set(['mascom', 'orange', 'btc']),
  )

  function toggleOp(id: string) {
    setActiveOps((prev) => {
      const next = new Set(prev)
      if (next.has(id) && next.size > 1) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Data ─────────────────────────────────────────────────────────────────────

  const { data: nmsData } = useDemoAwareQuery<NmsSummaryResponse>({
    queryKey: ['nms-summary'],
    fetchFn: () => fetch('/api/dqos/nms-summary').then((r) => r.json()),
    demoFallback: DEMO_NMS_SUMMARY,
  })

  const { data: locData } = useDemoAwareQuery<LocationsResponse>({
    queryKey: ['dqos-locations'],
    fetchFn: () => fetch('/api/dqos/locations').then((r) => r.json()),
    demoFallback: DEMO_LOCATIONS_RESPONSE,
  })

  const providers: Provider[] = nmsData?.providers ?? MOCK_PROVIDERS

  const locations = useMemo<QoSLocation[]>(() => {
    const raw = locData?.locations ?? []
    return raw.filter((l) => l.area_feature != null).slice(0, 60)
  }, [locData])

  const scores = useMemo<Record<number, Record<string, number>>>(() => {
    const result: Record<number, Record<string, number>> = {}
    for (const loc of locations) {
      result[loc.id] = {
        mascom: mockScore(loc.id, 'mascom'),
        orange: mockScore(loc.id, 'orange'),
        btc:    mockScore(loc.id, 'btc'),
      }
    }
    return result
  }, [locations])

  const rangeDays = RANGE_OPTIONS.find((r) => r.id === range)?.days ?? 30
  const trendData = useMemo(() => generateTrendData(rangeDays), [rangeDays])

  // Downsample to ≤30 points for readability
  const trendDisplay = useMemo(() => {
    if (trendData.length <= 30) return trendData
    const step = Math.ceil(trendData.length / 30)
    return trendData.filter((_, i) => i % step === 0)
  }, [trendData])

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          QoS, Coverage &amp; Telecom Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Live network quality indicators, coverage maps and operator benchmarking
        </p>
      </div>

      {/* KPI scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => <KpiScorecard key={p.id} provider={p} />)}
      </div>

      {/* Coverage map */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Coverage Map</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              QoS scores by district — click a region for details
            </p>
          </div>
          <span className="text-xs text-gray-400 italic">
            {locations.length > 0
              ? `${locations.length} district${locations.length !== 1 ? 's' : ''} loaded`
              : 'Fetching coverage data…'}
          </span>
        </div>
        <QoSMap locations={locations} scores={scores} />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Period:</span>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md border transition-colors',
                    range === r.id
                      ? 'bg-[#003580] text-white border-[#003580]'
                      : 'text-gray-600 border-gray-200 hover:border-gray-400',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Operator toggles */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Operators:</span>
            <div className="flex gap-1.5">
              {OPERATOR_OPTIONS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => toggleOp(op.id)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md border transition-colors font-medium',
                    activeOps.has(op.id)
                      ? 'text-white'
                      : 'text-gray-500 border-gray-200 hover:border-gray-400',
                  )}
                  style={
                    activeOps.has(op.id)
                      ? { backgroundColor: op.color, borderColor: op.color }
                      : undefined
                  }
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Metric selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Metric:</span>
            <div className="flex gap-1 flex-wrap">
              {METRIC_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md border transition-colors',
                    metric === m.id
                      ? 'bg-[#003580] text-white border-[#003580]'
                      : 'text-gray-600 border-gray-200 hover:border-gray-400',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Line chart: voice quality trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Voice Quality Trend</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Service Accessibility (%) — last {rangeDays} days
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={trendDisplay}
              margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={Math.ceil(trendDisplay.length / 6)}
              />
              <YAxis domain={[88, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {activeOps.has('mascom') && (
                <Line
                  type="monotone" dataKey="mascom" name="Mascom"
                  stroke="#204079" strokeWidth={2} dot={false}
                />
              )}
              {activeOps.has('orange') && (
                <Line
                  type="monotone" dataKey="orange" name="Orange"
                  stroke="#fa6403" strokeWidth={2} dot={false}
                />
              )}
              {activeOps.has('btc') && (
                <Line
                  type="monotone" dataKey="btc" name="BTC"
                  stroke="#46a33e" strokeWidth={2} dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart: QoS score by region */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">QoS Score by Region</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Average quality score per major district (%)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={REGION_DATA}
              margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="region" tick={{ fontSize: 10 }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}%` : v]} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {activeOps.has('mascom') && (
                <Bar dataKey="mascom" name="Mascom" fill="#204079" radius={[3, 3, 0, 0]} />
              )}
              {activeOps.has('orange') && (
                <Bar dataKey="orange" name="Orange" fill="#fa6403" radius={[3, 3, 0, 0]} />
              )}
              {activeOps.has('btc') && (
                <Bar dataKey="btc" name="BTC" fill="#46a33e" radius={[3, 3, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
