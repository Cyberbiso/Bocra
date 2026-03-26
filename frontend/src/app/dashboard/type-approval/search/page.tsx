'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import {
  ChevronLeft,
  Search,
  SearchX,
  Info,
  Eye,
  Download,
  Plus,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechSpec {
  network_technology: string[]
  frequency_bands: string
  transmission_power: string
}

interface DeviceCatalog {
  id: string
  brand_name: string
  marketing_name: string
  model_name: string
  is_sim_enabled: boolean
  technical_spec_json: TechSpec
}

interface Certificate {
  id: string
  certificate_number: string
  certificate_type_code: string
  issued_at: string
  status_code: string
  qr_token: string
}

interface SearchResult {
  id: string
  device_model_id: string
  certificate_id: string
  status_code: 'APPROVED'
  approved_at: string
  device_catalog: DeviceCatalog
  certificate: Certificate
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  brand_name: z
    .string()
    .min(1, 'Brand name is required')
    .min(2, 'Brand name must be at least 2 characters'),
  marketing_name: z.string().optional(),
  model_name: z.string().optional(),
  is_sim_enabled: z.enum(['all', 'true', 'false']),
})

type SearchForm = z.infer<typeof searchSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), 'dd MMM yyyy')
  } catch {
    return iso
  }
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-2 duration-200">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 text-white/60 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Certificate dialog ───────────────────────────────────────────────────────

interface CertDialogProps {
  result: SearchResult | null
  onClose: () => void
  onDownload: (certNumber: string) => void
}

function CertificateDialog({ result, onClose, onDownload }: CertDialogProps) {
  if (!result) return null
  const { device_catalog: dc, certificate: cert } = result

  return (
    <Dialog open={!!result} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Type Approval Certificate</DialogTitle>
          <DialogDescription>
            Official BOCRA Type Approval Certificate for {dc.brand_name} {dc.marketing_name}
          </DialogDescription>
        </DialogHeader>

        {/* Certificate header */}
        <div className="bg-[#003580] px-6 py-5 text-white text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">
            Botswana Communications Regulatory Authority
          </p>
          <p className="text-base font-bold tracking-wide uppercase">
            Type Approval Certificate
          </p>
        </div>

        {/* Certificate body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            {[
              ['Certificate No', <span key="cn" className="font-mono font-bold text-gray-900">{cert.certificate_number}</span>],
              ['Issued To', dc.brand_name],
              ['Equipment', `${dc.marketing_name} — ${dc.model_name}`],
              ['Network Type', dc.is_sim_enabled ? 'SIM-Enabled' : 'Non-SIM'],
              ['Technologies', (
                <span key="tech" className="flex flex-wrap gap-1">
                  {dc.technical_spec_json.network_technology.map((t) => (
                    <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">{t}</span>
                  ))}
                </span>
              )],
              ['Frequency Bands', dc.technical_spec_json.frequency_bands],
              ['Approved Date', fmtDate(result.approved_at)],
              ['Valid From', fmtDate(cert.issued_at)],
              ['Status', (
                <span key="status" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />{cert.status_code}
                </span>
              )],
            ].map(([label, value]) => (
              <>
                <span key={`l-${label}`} className="text-gray-500 whitespace-nowrap">{label}</span>
                <span key={`v-${label}`} className="text-gray-900">{value}</span>
              </>
            ))}
          </div>

          <Separator />

          {/* QR code */}
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Scan to Verify
            </p>
            <div className="p-3 border border-gray-200 rounded-xl bg-white">
              <QRCodeSVG value={cert.qr_token} size={160} level="M" />
            </div>
            <p className="text-[10px] text-gray-400">Certificate ID: {cert.qr_token}</p>
          </div>

          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            This certificate was issued by the Botswana Communications Regulatory Authority
            and is valid as of the date shown above.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onDownload(cert.certificate_number)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#003580] rounded-lg hover:bg-[#002a6e] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Certificate
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <Skeleton className="h-4 w-full rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TypeApprovalSearchPage() {
  const router = useRouter()
  const _searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { is_sim_enabled: 'all' },
  })

  const simValue = watch('is_sim_enabled')

  const [queryParams, setQueryParams] = useState<SearchForm | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<SearchResult | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // ── React Query ─────────────────────────────────────────────────────────────
  const { data = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['type-approval-search', queryParams],
    queryFn: async () => {
      if (!queryParams) return []
      const params = new URLSearchParams({ brand: queryParams.brand_name })
      if (queryParams.model_name)    params.set('model', queryParams.model_name)
      if (queryParams.marketing_name) params.set('name', queryParams.marketing_name)
      if (queryParams.is_sim_enabled !== 'all') params.set('sim', queryParams.is_sim_enabled)
      const res = await fetch(`/api/type-approval/search?${params.toString()}`)
      if (!res.ok) throw new Error('Search failed')
      return res.json() as Promise<SearchResult[]>
    },
    enabled: queryParams !== null,
    staleTime: 5 * 60 * 1000,
  })

  function onSubmit(values: SearchForm) {
    setQueryParams(values)
    setHasSearched(true)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleDownload(certNumber: string) {
    // TODO: implement real PDF download from docs.files
    showToast(`Certificate ${certNumber} download started`)
  }

  function handleSearchAgain() {
    setHasSearched(false)
    setQueryParams(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const applyHref = (() => {
    if (!queryParams) return '/dashboard/type-approval/apply'
    const p = new URLSearchParams({ brand: queryParams.brand_name })
    if (queryParams.model_name)     p.set('model', queryParams.model_name)
    if (queryParams.marketing_name) p.set('name',  queryParams.marketing_name)
    return `/dashboard/type-approval/apply?${p.toString()}`
  })()

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* ── Breadcrumb + back ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link href="/dashboard/home" className="hover:text-gray-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/type-approval" className="hover:text-gray-600 transition-colors">Type Approval</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">Equipment Search</span>
        </div>

        <div className="flex items-start gap-3 mt-1">
          <Link
            href="/dashboard/type-approval"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors shrink-0 mt-0.5"
            aria-label="Back to Type Approval"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Type Approval Search</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Search for an equipment model before starting a new Type Approval application.
              If the model is already approved, you can use the existing certificate.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search form ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Search Equipment Models</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('brand_name')}
                  placeholder="e.g. Samsung, Huawei, Apple"
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors bg-white',
                    errors.brand_name ? 'border-red-400' : 'border-gray-300',
                  )}
                />
                {errors.brand_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.brand_name.message}</p>
                )}
              </div>

              {/* Marketing name */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Marketing Name
                </label>
                <input
                  {...register('marketing_name')}
                  placeholder="e.g. Galaxy A55, Nova 12"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors bg-white"
                />
              </div>

              {/* Model name */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Model Name / Number
                </label>
                <input
                  {...register('model_name')}
                  placeholder="e.g. SM-A556B, HWI-AL00"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors bg-white"
                />
              </div>

              {/* SIM toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  SIM Type
                </label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {([
                    { value: 'all',   label: 'All' },
                    { value: 'true',  label: 'SIM-Enabled' },
                    { value: 'false', label: 'Non-SIM' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('is_sim_enabled', value)}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30',
                        simValue === value
                          ? 'bg-[#003580] text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50',
                        value !== 'all' && 'border-l border-gray-300',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Submit row */}
            <div className="flex justify-end mt-5">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {hasSearched && (
        <div className="space-y-4">

          {/* Loading skeletons */}
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <SkeletonRows />
                </tbody>
              </table>
            </div>
          )}

          {/* Results found */}
          {!isLoading && data.length > 0 && (
            <>
              {/* Info banner */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
                <Info className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  This model already has an approved Type Approval. You may download the existing
                  certificate below. If your equipment differs from the approved model, you may
                  proceed with a new application.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{data.length}</span> approved model{data.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Brand', 'Model', 'Type', 'Network', 'Status', 'Approved Date', 'Certificate', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                          {/* Brand */}
                          <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                            {row.device_catalog.brand_name}
                          </td>

                          {/* Model */}
                          <td className="px-4 py-3.5">
                            <p className="text-gray-900">{row.device_catalog.marketing_name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{row.device_catalog.model_name}</p>
                          </td>

                          {/* SIM type */}
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={row.device_catalog.is_sim_enabled ? 'default' : 'outline'}
                              className={row.device_catalog.is_sim_enabled
                                ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'text-gray-500'}
                            >
                              {row.device_catalog.is_sim_enabled ? 'SIM-Enabled' : 'Non-SIM'}
                            </Badge>
                          </td>

                          {/* Network technologies */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {row.device_catalog.technical_spec_json.network_technology.map((t) => (
                                <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-medium">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {row.status_code}
                            </span>
                          </td>

                          {/* Approved date */}
                          <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                            {fmtDate(row.approved_at)}
                          </td>

                          {/* Certificate number */}
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                            {row.certificate.certificate_number}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedCertificate(row)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={() => handleDownload(row.certificate.certificate_number)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Download certificate"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-gray-400">
                    Only proceed if your equipment differs from the models listed above.
                  </p>
                  <Link
                    href={applyHref}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    Proceed with New Application Anyway
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!isLoading && data.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-16 flex flex-col items-center text-center gap-4">
              <SearchX className="w-12 h-12 text-gray-300" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">No Approved Type Approval Found</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-md">
                  No approved Type Approval record was found for{' '}
                  <span className="font-semibold text-gray-700">&ldquo;{queryParams?.brand_name}&rdquo;</span>{' '}
                  in the BOCRA register. You may proceed to submit a new Type Approval application.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Link
                  href={applyHref}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Start New Type Approval Application
                </Link>
                <button
                  onClick={handleSearchAgain}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Certificate dialog ─────────────────────────────────────────── */}
      <CertificateDialog
        result={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        onDownload={handleDownload}
      />

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
