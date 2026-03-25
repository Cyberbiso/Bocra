'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Key, CheckCircle2, XCircle, AlertTriangle,
  Clock, Globe, Copy, Check, PlugZap, ExternalLink, Plus, X,
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
      type="button"
      onClick={handleCopy}
      className="ml-1 rounded p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
      title="Copy API key"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ─── Register Integration Modal ───────────────────────────────────────────────

interface RegisterFormData {
  systemCode: string
  name: string
  description: string
  baseUrl: string
  healthEndpoint: string
  contactEmail: string
}

const EMPTY_FORM: RegisterFormData = {
  systemCode: '',
  name: '',
  description: '',
  baseUrl: '',
  healthEndpoint: '/health',
  contactEmail: '',
}

function RegisterModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (system: ExternalSystem & { apiKey: string }) => void
}) {
  const [form, setForm] = useState<RegisterFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof RegisterFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.systemCode || !form.name || !form.baseUrl) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemCode: form.systemCode.trim().toLowerCase().replace(/\s+/g, '_'),
          name: form.name.trim(),
          description: form.description.trim() || null,
          baseUrl: form.baseUrl.trim().replace(/\/$/, ''),
          healthEndpoint: form.healthEndpoint.trim() || '/health',
          contactEmail: form.contactEmail.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.detail ?? 'Failed to register system.')
        return
      }
      onCreated(data)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <PlugZap className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Register External System</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">System Code <span className="text-red-500">*</span></label>
              <input
                value={form.systemCode}
                onChange={(e) => set('systemCode', e.target.value)}
                placeholder="e.g. typeapproval_bocra"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <p className="mt-0.5 text-[10px] text-slate-400">Unique slug, lowercase, no spaces</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Display Name <span className="text-red-500">*</span></label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. BOCRA Type Approval Portal"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Base URL <span className="text-red-500">*</span></label>
            <input
              value={form.baseUrl}
              onChange={(e) => set('baseUrl', e.target.value)}
              placeholder="https://typeapproval.bocra.org.bw"
              type="url"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Health Endpoint</label>
              <input
                value={form.healthEndpoint}
                onChange={(e) => set('healthEndpoint', e.target.value)}
                placeholder="/health"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact Email</label>
              <input
                value={form.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                placeholder="admin@system.bw"
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description of what this system does…"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.systemCode || !form.name || !form.baseUrl}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering…' : 'Register & Generate Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const [showRegister, setShowRegister] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations-proxy')
      if (!res.ok) {
        // 5xx = real server error; show message. Others = empty state.
        if (res.status >= 500) setError('Server error — could not load integrations.')
        setSystems([])
        return
      }
      const data = await res.json()
      setSystems(Array.isArray(data) ? data : [])
    } catch {
      setError('Network error — could not reach the server.')
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

  function handleCreated(system: ExternalSystem & { apiKey: string }) {
    setShowRegister(false)
    setNewKey({ code: system.systemCode, key: system.apiKey })
    load()
  }

  const onlineCount = systems.filter(s => s.statusCode === 'ONLINE').length
  const offlineCount = systems.filter(s => s.statusCode === 'OFFLINE').length

  return (
    <>
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onCreated={handleCreated}
        />
      )}

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
          {!loading && systems.length > 0 && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => checkHealth()}
                disabled={checking}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={cn('h-4 w-4', checking && 'animate-spin')} />
                Check All
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Register System
              </button>
            </div>
          )}
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
              type="button"
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

        {/* System cards / empty state */}
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
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <PlugZap className="h-7 w-7 text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No systems registered yet</h3>
            <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">
              Register external systems to monitor their health and share API credentials
              for secure integration with the BOCRA platform.
            </p>
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Register First System
            </button>
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
    </>
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
          type="button"
          onClick={onCheckHealth}
          disabled={checking}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', checking && 'animate-spin')} />
          Ping
        </button>
        <button
          type="button"
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
