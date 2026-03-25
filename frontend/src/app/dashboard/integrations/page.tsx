'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Key, CheckCircle2, XCircle, AlertTriangle,
  Clock, Globe, Copy, Check, PlugZap, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusCode = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN'

interface ExternalSystem {
  id: string
  systemCode: string
  name: string
  description: string | null
  baseUrl: string
  healthEndpoint: string
  apiKey: string
  contactEmail: string | null
  statusCode: StatusCode
  lastResponseMs: number | null
  lastCheckedAt: string | null
  createdAt: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusCode, {
  label: string
  icon: React.ElementType
  dot: string
  badge: string
}> = {
  ONLINE:   { label: 'Online',   icon: CheckCircle2,   dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  DEGRADED: { label: 'Degraded', icon: AlertTriangle,  dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  OFFLINE:  { label: 'Offline',  icon: XCircle,        dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
  UNKNOWN:  { label: 'Unknown',  icon: Clock,          dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 ring-slate-200' },
}

function StatusBadge({ code }: { code: StatusCode }) {
  const cfg = STATUS_CONFIG[code] ?? STATUS_CONFIG.UNKNOWN
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', cfg.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1 rounded p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
      title="Copy API key"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [systems, setSystems] = useState<ExternalSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [rotatingKey, setRotatingKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<{ code: string; key: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations-proxy')
      if (!res.ok) throw new Error(await res.text())
      setSystems(await res.json())
    } catch {
      setError('Could not load integrations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const checkHealth = async (systemCode?: string) => {
    setChecking(true)
    try {
      const url = systemCode
        ? `/api/integrations-proxy/${systemCode}/health`
        : '/api/integrations-proxy/health'
      const res = await fetch(url, { method: 'POST' })
      if (res.ok) await load()
    } finally {
      setChecking(false)
    }
  }

  const rotateKey = async (systemCode: string) => {
    setRotatingKey(systemCode)
    setNewKey(null)
    try {
      const res = await fetch(`/api/integrations-proxy/${systemCode}/rotate-key`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNewKey({ code: systemCode, key: data.apiKey })
        await load()
      }
    } finally {
      setRotatingKey(null)
    }
  }

  const onlineCount = systems.filter(s => s.statusCode === 'ONLINE').length
  const offlineCount = systems.filter(s => s.statusCode === 'OFFLINE').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PlugZap className="h-6 w-6 text-blue-600" />
            System Integrations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage external systems connected to the BOCRA platform. Each system
            is issued an API key to authenticate requests.
          </p>
        </div>
        <button
          onClick={() => checkHealth()}
          disabled={checking || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', checking && 'animate-spin')} />
          Check All Health
        </button>
      </div>

      {/* Summary pills */}
      {!loading && systems.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            {systems.length} system{systems.length !== 1 ? 's' : ''} registered
          </span>
          {onlineCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {onlineCount} online
            </span>
          )}
          {offlineCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              {offlineCount} offline
            </span>
          )}
        </div>
      )}

      {/* New key alert */}
      {newKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            New API key generated — copy it now, it will not be shown again in full.
          </p>
          <div className="mt-2 flex items-center gap-2 font-mono text-xs text-amber-900 bg-amber-100 rounded px-3 py-2">
            <span className="break-all">{newKey.key}</span>
            <CopyButton value={newKey.key} />
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-amber-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* System cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : systems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No external systems registered yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {systems.map(system => (
            <SystemCard
              key={system.id}
              system={system}
              onCheckHealth={() => checkHealth(system.systemCode)}
              onRotateKey={() => rotateKey(system.systemCode)}
              checking={checking}
              rotating={rotatingKey === system.systemCode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── System card ──────────────────────────────────────────────────────────────

function SystemCard({
  system,
  onCheckHealth,
  onRotateKey,
  checking,
  rotating,
}: {
  system: ExternalSystem
  onCheckHealth: () => void
  onRotateKey: () => void
  checking: boolean
  rotating: boolean
}) {
  const checkedAt = system.lastCheckedAt
    ? new Date(system.lastCheckedAt).toLocaleString()
    : 'Never'

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{system.name}</h3>
          {system.description && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{system.description}</p>
          )}
        </div>
        <StatusBadge code={system.statusCode as StatusCode} />
      </div>

      {/* Details */}
      <div className="px-5 pb-4 space-y-2 flex-1">
        <a
          href={system.baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline truncate"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{system.baseUrl}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>

        {system.contactEmail && (
          <p className="text-xs text-slate-500">
            Contact: <span className="text-slate-700">{system.contactEmail}</span>
          </p>
        )}

        {/* Response time */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Last checked: {checkedAt}
          </span>
          {system.lastResponseMs !== null && (
            <span className={cn(
              'font-medium',
              system.lastResponseMs < 300 ? 'text-emerald-600' :
              system.lastResponseMs < 1000 ? 'text-amber-600' : 'text-rose-600'
            )}>
              {system.lastResponseMs} ms
            </span>
          )}
        </div>

        {/* API key */}
        <div className="mt-1">
          <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
            <Key className="h-3.5 w-3.5" /> API Key (share with system)
          </p>
          <div className="flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2 py-1.5">
            <code className="text-xs text-slate-700 font-mono flex-1 truncate">{system.apiKey}</code>
            <CopyButton value={system.apiKey} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50">
        <button
          onClick={onCheckHealth}
          disabled={checking}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', checking && 'animate-spin')} />
          Ping
        </button>
        <button
          onClick={onRotateKey}
          disabled={rotating}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <Key className={cn('h-3.5 w-3.5', rotating && 'animate-spin')} />
          Rotate Key
        </button>
      </div>
    </div>
  )
}
