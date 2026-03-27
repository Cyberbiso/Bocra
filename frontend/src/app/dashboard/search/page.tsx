'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDemoAwareQuery } from '@/lib/demo/useDemoAwareQuery'
import { DEMO_SEARCH_RESPONSE } from '@/lib/demo/seed-data'
import {
  Search,
  QrCode,
  Download,
  Eye,
  SearchX,
  Loader2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type {
  SearchCategory,
  SearchResponse,
  LicenceResult,
  CertificateResult,
  TypeApprovalResult,
  ImeiResult,
  OrganizationResult,
} from '@/app/api/search/route'

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

// TODO: Swap /api/search for the real portal once SearchCustomer + GetLicenseDetails
//       endpoints are available at customerportal.bocra.org.bw
async function fetchSearch(q: string, category: SearchCategory): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, category })
  const res = await fetch(`/api/search?${params}`)
  if (!res.ok) throw new Error('Search request failed')
  return res.json() as Promise<SearchResponse>
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: { value: SearchCategory; label: string; plural: string }[] = [
  { value: 'all', label: 'All', plural: 'All Results' },
  { value: 'licence', label: 'Licence', plural: 'Licences' },
  { value: 'type-approval', label: 'Type Approval', plural: 'Type Approvals' },
  { value: 'imei', label: 'IMEI / Device', plural: 'IMEI / Devices' },
  { value: 'organization', label: 'Organization', plural: 'Organizations' },
]

const TAB_VALUES = ['licence', 'type-approval', 'imei', 'organization'] as const

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Registered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Expired: 'bg-gray-100 text-gray-500 border-gray-200',
  Unregistered: 'bg-gray-100 text-gray-500 border-gray-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
  Revoked: 'bg-red-50 text-red-700 border-red-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Blacklisted: 'bg-red-50 text-red-700 border-red-200',
  'Reported Stolen': 'bg-red-50 text-red-700 border-red-200',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
      )}
    >
      {status}
    </span>
  )
}

// ─── Table wrapper ────────────────────────────────────────────────────────────

function ResultTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200',
        className
      )}
    >
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-gray-700 border-b border-gray-100 last:border-b-0', className)}>
      {children}
    </td>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 last:border-b-0">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className={cn('h-4', j === 0 ? 'w-32' : 'w-24')} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <SearchX className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-base font-semibold text-gray-700">No results found</p>
      <p className="text-sm text-gray-400 mt-1 max-w-xs">
        {query
          ? `No records match "${query}". Try a different search term or category.`
          : 'Enter a licence number, IMEI, organisation name, or certificate number above.'}
      </p>
    </div>
  )
}

// ─── Per-category tables ──────────────────────────────────────────────────────

function LicenceTable({
  rows,
  loading,
}: {
  rows: LicenceResult[]
  loading: boolean
}) {
  return (
    <ResultTable>
      <thead>
        <tr>
          <Th>Client Name</Th>
          <Th>Licence Number</Th>
          <Th>Licence Type</Th>
          <Th>Status</Th>
          <Th>Expiry Date</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </thead>
      {loading ? (
        <SkeletonRows cols={6} />
      ) : rows.length === 0 ? null : (
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
              <Td className="font-medium text-gray-900">{r.clientName}</Td>
              <Td>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{r.licenceNumber}</code>
              </Td>
              <Td className="text-gray-500">{r.licenceType}</Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td className="text-gray-500">{r.expiryDate}</Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="flex items-center gap-1 text-xs text-[#003580] hover:underline font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:underline font-medium">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      )}
    </ResultTable>
  )
}

function CertificateTable({
  rows,
  loading,
}: {
  rows: CertificateResult[]
  loading: boolean
}) {
  return (
    <ResultTable>
      <thead>
        <tr>
          <Th>Certificate Number</Th>
          <Th>Type</Th>
          <Th>Issued Date</Th>
          <Th>Status</Th>
          <Th className="text-center">QR Verify</Th>
        </tr>
      </thead>
      {loading ? (
        <SkeletonRows cols={5} />
      ) : rows.length === 0 ? null : (
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
              <Td>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{r.certificateNumber}</code>
              </Td>
              <Td className="text-gray-700">{r.type}</Td>
              <Td className="text-gray-500">{r.issuedDate}</Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td className="text-center">
                <button
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-[#003580]/30 text-[#003580] hover:bg-[#003580]/5 font-medium transition-colors"
                  title="QR Verification — coming soon"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Verify
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      )}
    </ResultTable>
  )
}

function TypeApprovalTable({
  rows,
  loading,
}: {
  rows: TypeApprovalResult[]
  loading: boolean
}) {
  return (
    <ResultTable>
      <thead>
        <tr>
          <Th>Device</Th>
          <Th>Brand</Th>
          <Th>Model</Th>
          <Th>Approval Date</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      {loading ? (
        <SkeletonRows cols={5} />
      ) : rows.length === 0 ? null : (
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
              <Td className="text-gray-500">{r.device}</Td>
              <Td className="font-medium text-gray-900">{r.brand}</Td>
              <Td className="text-gray-700">{r.model}</Td>
              <Td className="text-gray-500">{r.approvalDate}</Td>
              <Td><StatusBadge status={r.status} /></Td>
            </tr>
          ))}
        </tbody>
      )}
    </ResultTable>
  )
}

function ImeiTable({ rows, loading }: { rows: ImeiResult[]; loading: boolean }) {
  return (
    <ResultTable>
      <thead>
        <tr>
          <Th>IMEI</Th>
          <Th>Brand</Th>
          <Th>Model</Th>
          <Th>Verification Status</Th>
        </tr>
      </thead>
      {loading ? (
        <SkeletonRows cols={4} />
      ) : rows.length === 0 ? null : (
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
              <Td>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono tracking-wider">
                  {r.imei}
                </code>
              </Td>
              <Td className="font-medium text-gray-900">{r.brand}</Td>
              <Td className="text-gray-700">{r.model}</Td>
              <Td><StatusBadge status={r.verificationStatus} /></Td>
            </tr>
          ))}
        </tbody>
      )}
    </ResultTable>
  )
}

function OrganizationTable({
  rows,
  loading,
}: {
  rows: OrganizationResult[]
  loading: boolean
}) {
  return (
    <ResultTable>
      <thead>
        <tr>
          <Th>Name</Th>
          <Th>Registration Number</Th>
          <Th>Type</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      {loading ? (
        <SkeletonRows cols={4} />
      ) : rows.length === 0 ? null : (
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
              <Td className="font-medium text-gray-900">{r.name}</Td>
              <Td>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{r.registrationNumber}</code>
              </Td>
              <Td className="text-gray-500">{r.type}</Td>
              <Td><StatusBadge status={r.status} /></Td>
            </tr>
          ))}
        </tbody>
      )}
    </ResultTable>
  )
}

// ─── Result count chip ────────────────────────────────────────────────────────

function CountChip({ n }: { n: number }) {
  if (n === 0) return null
  return (
    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#003580]/10 text-[#003580] text-[10px] font-bold px-1">
      {n}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GlobalSearchPage() {
  const [inputValue, setInputValue] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')
  const [activeTab, setActiveTab] = useState<typeof TAB_VALUES[number]>('licence')

  const debouncedQuery = useDebounce(inputValue, 400)

  // Sync active tab when category selector jumps to a specific one
  useEffect(() => {
    if (category !== 'all') {
      setActiveTab(category as typeof TAB_VALUES[number])
    }
  }, [category])

  const { data, isLoading } = useDemoAwareQuery<SearchResponse>({
    queryKey: ['search', debouncedQuery, category],
    fetchFn: () => fetchSearch(debouncedQuery, category),
    demoFallback: DEMO_SEARCH_RESPONSE,
  })

  const isFetching = false
  const loading = isLoading || isFetching

  const counts = {
    licence: data?.licences.length ?? 0,
    'type-approval': data?.typeApprovals.length ?? 0,
    imei: data?.devices.length ?? 0,
    organization: data?.organizations.length ?? 0,
  }

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCategory(e.target.value as SearchCategory)
    },
    []
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Global Search & Verification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search licences, type approvals, IMEI records, and registered organisations.
        </p>
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {/* Category filter */}
        <div className="shrink-0">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580]/40 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by licence number, IMEI, device model, organisation name…"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580]/40 transition-colors"
          />
          {/* Live fetch indicator */}
          {isFetching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Results summary */}
      {data && (
        <p className="text-xs text-gray-400">
          {data.meta.totalResults > 0
            ? `${data.meta.totalResults} result${data.meta.totalResults !== 1 ? 's' : ''}${debouncedQuery ? ` for "${debouncedQuery}"` : ''}`
            : debouncedQuery
            ? `No results for "${debouncedQuery}"`
            : 'Showing all records'}
        </p>
      )}

      {/* ── Tabbed results ──────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof TAB_VALUES[number])}
      >
        <TabsList
          variant="line"
          className="w-full justify-start border-b border-gray-200 pb-0 rounded-none h-auto bg-transparent gap-0"
        >
          {TAB_VALUES.map((tab) => {
            const cfg = CATEGORIES.find((c) => c.value === tab)!
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 data-active:border-[#003580] data-active:text-[#003580] hover:text-gray-700 transition-colors"
              >
                {cfg.plural}
                <CountChip n={counts[tab]} />
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ── Licences ─────────────────────────────────────────────────── */}
        <TabsContent value="licence" className="mt-4">
          {/* TODO: GET /api/search?q=...&category=licence */}
          {!loading && counts.licence === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            <LicenceTable rows={data?.licences ?? []} loading={loading} />
          )}
        </TabsContent>

        {/* ── Type Approvals ────────────────────────────────────────────── */}
        <TabsContent value="type-approval" className="mt-4">
          {/* TODO: GET /api/search?q=...&category=type-approval */}
          {!loading && counts['type-approval'] === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            <TypeApprovalTable rows={data?.typeApprovals ?? []} loading={loading} />
          )}
        </TabsContent>

        {/* ── IMEI / Device ─────────────────────────────────────────────── */}
        <TabsContent value="imei" className="mt-4">
          {/* TODO: GET /api/search?q=...&category=imei */}
          {!loading && counts.imei === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            <ImeiTable rows={data?.devices ?? []} loading={loading} />
          )}
        </TabsContent>

        {/* ── Organizations ─────────────────────────────────────────────── */}
        <TabsContent value="organization" className="mt-4">
          {/* TODO: GET /api/search?q=...&category=organization */}
          {!loading && counts.organization === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            <OrganizationTable rows={data?.organizations ?? []} loading={loading} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
