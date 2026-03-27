'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { fetchApplications, fetchAccreditations, DEMO_REGISTRATION } from '@/lib/store/slices/typeApprovalSlice'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import {
  ShieldCheck,
  Plus,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Smartphone,
  Building2,
  User,
  FileText,
  ArrowRight,
  Info,
  Lock,
  Search,
  SearchX,
  Eye,
  Download,
  Loader2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

// ─── Application types ────────────────────────────────────────────────────────

type AppStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'MORE_INFO'
type AccreditationType = 'Customer' | 'Manufacturer' | 'Repair Provider'

interface TAApplication {
  id: string
  reference: string
  brand: string
  model: string
  accreditationType: AccreditationType
  submitted: string
  status: AppStatus
  requestor?: string
}

// ─── Search types ─────────────────────────────────────────────────────────────

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

// ─── Search schema ────────────────────────────────────────────────────────────

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

// ─── Application mock data ────────────────────────────────────────────────────

const MOCK_REGISTRATION = {
  registered: true,
  status: 'APPROVED' as const,
  reference: 'TAR-2026-00183',
  organisation: 'TeleCo BW (Pty) Ltd',
  accreditationTypes: ['Customer', 'Manufacturer'] as AccreditationType[],
}

const MY_APPLICATIONS: TAApplication[] = [
  { id: 'TA-APP-2026-0041', reference: 'TA-APP-2026-0041', brand: 'Samsung',  model: 'Galaxy A55 5G',  accreditationType: 'Customer',         submitted: '22 Mar 2026', status: 'UNDER_REVIEW' },
  { id: 'TA-APP-2026-0038', reference: 'TA-APP-2026-0038', brand: 'Xiaomi',   model: 'Redmi Note 13',  accreditationType: 'Customer',         submitted: '14 Mar 2026', status: 'APPROVED'     },
  { id: 'TA-APP-2026-0031', reference: 'TA-APP-2026-0031', brand: 'Huawei',   model: 'MatePad Pro 12', accreditationType: 'Manufacturer',     submitted: '3 Mar 2026',  status: 'MORE_INFO'    },
  { id: 'TA-APP-2026-0022', reference: 'TA-APP-2026-0022', brand: 'Apple',    model: 'iPhone 16 Pro',  accreditationType: 'Customer',         submitted: '12 Feb 2026', status: 'APPROVED'     },
  { id: 'TA-APP-2026-0011', reference: 'TA-APP-2026-0011', brand: 'Asus',     model: 'ZenFone 10',     accreditationType: 'Repair Provider',  submitted: '5 Jan 2026',  status: 'REJECTED'     },
]

const STAFF_EXTRA: TAApplication[] = [
  { id: 'TA-APP-2026-0098', reference: 'TA-APP-2026-0098', brand: 'Xiaomi',  model: 'Redmi 14C',    accreditationType: 'Customer',     submitted: '20 Mar 2026', status: 'PENDING',      requestor: 'TeleCo BW (Pty) Ltd'      },
  { id: 'TA-APP-2026-0097', reference: 'TA-APP-2026-0097', brand: 'Samsung', model: 'Galaxy Tab S9', accreditationType: 'Manufacturer', submitted: '19 Mar 2026', status: 'UNDER_REVIEW', requestor: 'Linkserve Botswana'       },
  { id: 'TA-APP-2026-0094', reference: 'TA-APP-2026-0094', brand: 'Apple',   model: 'iPad Air M2',  accreditationType: 'Customer',     submitted: '12 Mar 2026', status: 'UNDER_REVIEW', requestor: 'BotswanaTel Communications'},
]

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppStatus, { label: string; icon: React.ElementType; badge: string; dot: string }> = {
  PENDING:      { label: 'Pending',        icon: Clock,         badge: 'bg-slate-100 text-slate-700 border-slate-200',      dot: 'bg-slate-400'   },
  UNDER_REVIEW: { label: 'Under Review',   icon: ClipboardList, badge: 'bg-amber-100 text-amber-700 border-amber-200',      dot: 'bg-amber-400'   },
  APPROVED:     { label: 'Approved',       icon: CheckCircle2,  badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',dot: 'bg-emerald-500' },
  REJECTED:     { label: 'Rejected',       icon: XCircle,       badge: 'bg-red-100 text-red-700 border-red-200',            dot: 'bg-red-500'     },
  MORE_INFO:    { label: 'More Info Req.', icon: AlertCircle,   badge: 'bg-blue-100 text-blue-700 border-blue-200',         dot: 'bg-blue-500'    },
}

const ACRED_ICON: Record<AccreditationType, React.ElementType> = {
  Customer:          User,
  Manufacturer:      Building2,
  'Repair Provider': Smartphone,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try { return format(new Date(iso), 'dd MMM yyyy') } catch { return iso }
}

// ─── Small shared components ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, ' '),
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.badge)}>
      {config.label}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-1">
      <div className={cn('w-2 h-2 rounded-full', color)} />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 text-white/60 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Certificate dialog ───────────────────────────────────────────────────────

function CertificateDialog({
  result,
  onClose,
  onDownload,
}: {
  result: SearchResult | null
  onClose: () => void
  onDownload: (certNumber: string) => void
}) {
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

        <div className="bg-[#003580] px-6 py-5 text-white text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">
            Botswana Communications Regulatory Authority
          </p>
          <p className="text-base font-bold tracking-wide uppercase">Type Approval Certificate</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            {([
              ['Certificate No', <span key="cn" className="font-mono font-bold text-gray-900">{cert.certificate_number}</span>],
              ['Issued To',       dc.brand_name],
              ['Equipment',       `${dc.marketing_name} — ${dc.model_name}`],
              ['Network Type',    dc.is_sim_enabled ? 'SIM-Enabled' : 'Non-SIM'],
              ['Technologies',   (
                <span key="tech" className="flex flex-wrap gap-1">
                  {dc.technical_spec_json.network_technology.map((t) => (
                    <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">{t}</span>
                  ))}
                </span>
              )],
              ['Frequency Bands', dc.technical_spec_json.frequency_bands],
              ['Approved Date',   fmtDate(result.approved_at)],
              ['Valid From',      fmtDate(cert.issued_at)],
              ['Status',         (
                <span key="status" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />{cert.status_code}
                </span>
              )],
            ] as [string, React.ReactNode][]).map(([label, value]) => (
              <>
                <span key={`l-${label}`} className="text-gray-500 whitespace-nowrap">{label}</span>
                <span key={`v-${label}`} className="text-gray-900">{value}</span>
              </>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Scan to Verify</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'search' | 'register'

export default function TypeApprovalPage() {
  const role = useAppSelector((s) => s.role.role)
  const isStaff = role === 'officer' || role === 'admin'

  const dispatch = useAppDispatch()
  const isDemo = useAppSelector((s) => s.demo.isDemo)
  const { applications: rawApplications, applicationsLoading, registration: storedReg, accreditations, accreditationsLoading } = useAppSelector((s) => s.typeApproval)

  // Use stored registration from Redux, or demo fallback
  const MOCK_REGISTRATION = storedReg ?? DEMO_REGISTRATION

  useEffect(() => {
    dispatch(fetchApplications({ status: 'ALL', page: 1 }))
    dispatch(fetchAccreditations())
  }, [dispatch, isDemo])

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // ── Applications data ──────────────────────────────────────────────────────
  // Map API shape to legacy TAApplication shape for compatibility
  const MY_APPLICATIONS: TAApplication[] = rawApplications.map((a) => ({
    id: a.id,
    reference: a.application_number,
    brand: a.brand ?? a.application_number.split('-')[0] ?? '',
    model: a.model ?? '',
    accreditationType: (a.accreditation_type ?? 'Customer') as AccreditationType,
    submitted: a.submitted_at ? a.submitted_at.slice(0, 10) : '',
    status: (a.current_status_code ?? 'PENDING') as AppStatus,
    requestor: a.applicant_org?.legal_name,
  }))

  const allApplications = isStaff
    ? MY_APPLICATIONS.sort((a, b) => b.reference.localeCompare(a.reference))
    : MY_APPLICATIONS

  const stats = {
    total:     allApplications.length,
    pending:   allApplications.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length,
    approved:  allApplications.filter((a) => a.status === 'APPROVED').length,
    attention: allApplications.filter((a) => a.status === 'REJECTED' || a.status === 'MORE_INFO').length,
  }

  const _ = applicationsLoading // referenced to avoid lint warning

  // ── Search state ───────────────────────────────────────────────────────────
  const {
    register: sreg,
    handleSubmit: sHandleSubmit,
    watch: sWatch,
    setValue: sSetValue,
    formState: { errors: sErrors },
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { is_sim_enabled: 'all' },
  })

  const simValue = sWatch('is_sim_enabled')
  const brandValue = sWatch('brand_name')
  const modelValue = sWatch('model_name')
  const nameValue  = sWatch('marketing_name')

  const [queryParams, setQueryParams]               = useState<SearchForm | null>(null)
  const [hasSearched, setHasSearched]               = useState(false)
  const [selectedCert, setSelectedCert]             = useState<SearchResult | null>(null)
  const [toast, setToast]                           = useState<string | null>(null)

  const { data: searchData = [], isLoading: searchLoading } = useQuery<SearchResult[]>({
    queryKey: ['type-approval-search', queryParams],
    queryFn: async () => {
      if (!queryParams) return []
      const params = new URLSearchParams({ brand: queryParams.brand_name })
      if (queryParams.model_name)     params.set('model', queryParams.model_name)
      if (queryParams.marketing_name) params.set('name',  queryParams.marketing_name)
      if (queryParams.is_sim_enabled !== 'all') params.set('sim', queryParams.is_sim_enabled)
      const res = await fetch(`/api/type-approval/search?${params.toString()}`)
      if (!res.ok) throw new Error('Search failed')
      return res.json() as Promise<SearchResult[]>
    },
    enabled: queryParams !== null,
    staleTime: 5 * 60 * 1000,
  })

  function onSearchSubmit(values: SearchForm) {
    setQueryParams(values)
    setHasSearched(true)
  }

  function handleSearchAgain() {
    setHasSearched(false)
    setQueryParams(null)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleDownload(certNumber: string) {
    // TODO: implement real PDF download from docs.files
    showToast(`Certificate ${certNumber} download started`)
  }

  const applyHref = (() => {
    if (!queryParams) return '/dashboard/type-approval/apply'
    const p = new URLSearchParams({ brand: queryParams.brand_name })
    if (queryParams.model_name)     p.set('model', queryParams.model_name)
    if (queryParams.marketing_name) p.set('name',  queryParams.marketing_name)
    return `/dashboard/type-approval/apply?${p.toString()}`
  })()

  // ── Input class ────────────────────────────────────────────────────────────
  const inputCls = (hasError?: boolean) =>
    cn(
      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white',
      'focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors',
      hasError ? 'border-red-400' : 'border-gray-300',
    )

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ShieldCheck className="w-6 h-6 text-[#003580]" />
            <h1 className="text-2xl font-bold text-gray-900">Type Approval</h1>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Manage type approval applications for telecommunications equipment sold or used in Botswana.
            All devices that connect to a public network must hold a valid BOCRA type approval certificate.
          </p>
        </div>
        {MOCK_REGISTRATION.registered && (
          <button
            onClick={() => setActiveTab('search')}
            title="You must search for the equipment model first before starting a new application"
            className="flex items-center gap-2 shrink-0 px-4 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Application
          </button>
        )}
      </div>

      {/* ── Tab strip ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { id: 'overview',  label: 'Overview'          },
          { id: 'search',    label: 'Search Equipment'  },
          { id: 'register',  label: 'Register'          },
        ] as { id: TabId; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
              activeTab === tab.id
                ? 'border-[#003580] text-[#003580]'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* Workflow steps */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Type Approval Workflow
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
              {[
                { step: 1, title: 'Register Organisation', desc: 'Register as a Type Approval Requestor and submit supporting documents.', tabTarget: 'register' as TabId, icon: Building2, done: MOCK_REGISTRATION.registered },
                { step: 2, title: 'Search Equipment',      desc: 'Check if the equipment model already has an approved Type Approval.',    tabTarget: 'search'   as TabId, icon: Search,    done: false },
                { step: 3, title: 'Submit Application',    desc: 'Provide device details, upload test reports and pay the assessment fee.', tabTarget: 'search'   as TabId, icon: FileText,  done: stats.approved > 0 },
                { step: 4, title: 'Receive Certificate',   desc: 'Download your Type Approval Certificate once the application is approved.',tabTarget: null,               icon: ShieldCheck,done: false },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex sm:flex-col sm:flex-1 items-start sm:items-center gap-4 sm:gap-2 sm:text-center">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2',
                      item.done ? 'bg-[#003580] border-[#003580] text-white' : 'bg-white border-gray-200 text-gray-400',
                    )}>
                      {item.done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className={cn('hidden sm:block flex-1 h-0.5 w-full mt-5 -mx-3', i < 3 ? 'bg-gray-200' : 'bg-transparent')} />
                    <div>
                      <p className={cn('text-xs font-semibold', item.done ? 'text-[#003580]' : 'text-gray-600')}>
                        Step {item.step}: {item.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      {item.tabTarget ? (
                        <button
                          onClick={() => setActiveTab(item.tabTarget!)}
                          className="inline-flex items-center gap-1 text-xs text-[#003580] font-medium mt-1.5 hover:underline"
                        >
                          {item.done ? 'View details' : 'Get started'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <div className="mt-1.5 h-4" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Registration banner (applicants) */}
          {!isStaff && (
            MOCK_REGISTRATION.registered ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{MOCK_REGISTRATION.organisation}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                        Registered
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ref: <span className="font-mono">{MOCK_REGISTRATION.reference}</span>
                      {accreditations.length > 0 && (
                        <>{' · '}Accredited as:{' '}
                        <span className="font-medium text-gray-700">
                          {accreditations.map((a) => a.accreditation_type).join(', ')}
                        </span></>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('search')}
                  title="You must search for the equipment model first before starting a new application"
                  className="flex items-center gap-2 shrink-0 px-4 py-2 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Application
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">You are not registered as a Type Approval Requestor</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      You must register your organisation before you can submit any type approval applications.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('register')}
                  className="flex items-center gap-2 shrink-0 px-4 py-2 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors"
                >
                  Register Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}

          {/* Staff quick-action cards */}
          {isStaff && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: ClipboardList, label: 'Review Queue',       value: `${stats.pending} awaiting review`,   accent: 'border-amber-200 bg-amber-50',   iconCls: 'text-amber-600'  },
                { icon: AlertCircle,  label: 'Needs Attention',     value: `${stats.attention} requiring action`,accent: 'border-red-200 bg-red-50',       iconCls: 'text-red-500'    },
                { icon: CheckCircle2, label: 'Approved This Month', value: `${stats.approved} certificates issued`,accent: 'border-emerald-200 bg-emerald-50',iconCls: 'text-emerald-600'},
              ].map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.label} className={cn('flex items-center gap-4 rounded-xl border px-5 py-4', card.accent)}>
                    <Icon className={cn('w-6 h-6 shrink-0', card.iconCls)} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{card.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{card.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Applications" value={stats.total}    color="bg-[#003580]"   />
            <StatCard label="In Progress"        value={stats.pending}  color="bg-amber-400"   />
            <StatCard label="Approved"           value={stats.approved} color="bg-emerald-500" />
            <StatCard label="Needs Attention"    value={stats.attention}color="bg-red-500"     />
          </div>

          {/* Applications table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{isStaff ? 'All Applications' : 'My Applications'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isStaff
                    ? 'Type approval applications submitted by all registered requestors'
                    : 'Track the status of your type approval submissions'}
                </p>
              </div>
              {MOCK_REGISTRATION.registered && !isStaff && (
                <button
                  onClick={() => setActiveTab('search')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#003580] border border-[#003580] rounded-lg hover:bg-[#003580] hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              )}
            </div>

            {allApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No applications yet</p>
                <button
                  onClick={() => setActiveTab(MOCK_REGISTRATION.registered ? 'search' : 'register')}
                  className="mt-1 px-4 py-2 bg-[#003580] text-white text-xs font-semibold rounded-lg hover:bg-[#002a6e] transition-colors"
                >
                  {MOCK_REGISTRATION.registered ? 'Submit Application' : 'Register Now'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Reference', 'Device', 'Accreditation Type', ...(isStaff ? ['Requestor'] : []), 'Submitted', 'Status', ''].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allApplications.map((app) => {
                      const Icon = ACRED_ICON[app.accreditationType]
                      return (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-5 py-3.5 font-mono text-xs text-[#003580] font-medium whitespace-nowrap">{app.reference}</td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-gray-900 text-sm">{app.brand}</p>
                            <p className="text-xs text-gray-500">{app.model}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                              <Icon className="w-3.5 h-3.5 text-gray-400" />{app.accreditationType}
                            </span>
                          </td>
                          {isStaff && <td className="px-5 py-3.5 text-xs text-gray-600">{app.requestor}</td>}
                          <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{app.submitted}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              href={`/dashboard/type-approval/${app.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#003580] opacity-0 group-hover:opacity-100 transition-opacity hover:underline whitespace-nowrap"
                            >
                              View <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">What requires Type Approval?</h3>
              <ul className="space-y-1.5">
                {['Mobile phones, tablets and laptops', 'Routers, modems and Wi-Fi access points', 'IoT and M2M devices using licensed spectrum', 'Radio communications equipment', 'Terminal equipment connecting to public networks'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#003580] mt-1.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Assessment Fees</h3>
              <div className="space-y-2">
                {[
                  { type: 'Customer application',        fee: 'P 1 500'      },
                  { type: 'Manufacturer application',    fee: 'P 3 000'      },
                  { type: 'Repair provider application', fee: 'P 2 000'      },
                  { type: 'Expedited processing (+50%)', fee: 'P 750 – 1 500'},
                ].map((row) => (
                  <div key={row.type} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{row.type}</span>
                    <span className="font-semibold text-gray-900">{row.fee}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">Fees are payable via the Payments module after application submission.</p>
            </div>
          </div>

          {/* Staff note */}
          {isStaff && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                As a BOCRA staff member you have read access to all type approval records.
                Use the{' '}
                <Link href="/dashboard/admin" className="text-[#003580] underline underline-offset-2">
                  Admin & Workflow
                </Link>{' '}
                module to manage assignments, set priorities, and approve or reject applications.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: SEARCH EQUIPMENT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'search' && (
        <div className="space-y-5">

          {/* Search form card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Search Equipment Models</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Search for an equipment model before starting a new Type Approval application.
                If the model is already approved, you can use the existing certificate.
              </p>
            </div>
            <div className="px-5 py-5">
              <form onSubmit={sHandleSubmit(onSearchSubmit)} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">
                      Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...sreg('brand_name')}
                      placeholder="e.g. Samsung, Huawei, Apple"
                      className={inputCls(!!sErrors.brand_name)}
                    />
                    {sErrors.brand_name && <p className="mt-1 text-xs text-red-600">{sErrors.brand_name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Marketing Name</label>
                    <input
                      {...sreg('marketing_name')}
                      placeholder="e.g. Galaxy A55, Nova 12"
                      className={inputCls()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Model Name / Number</label>
                    <input
                      {...sreg('model_name')}
                      placeholder="e.g. SM-A556B, HWI-AL00"
                      className={inputCls()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">SIM Type</label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      {([
                        { value: 'all',   label: 'All'         },
                        { value: 'true',  label: 'SIM-Enabled' },
                        { value: 'false', label: 'Non-SIM'     },
                      ] as const).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => sSetValue('is_sim_enabled', value)}
                          className={cn(
                            'flex-1 py-2.5 text-sm font-medium transition-colors focus:outline-none',
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

                <div className="flex justify-end mt-5">
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {searchLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
                    ) : (
                      <><Search className="w-4 h-4" />Search</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-4">

              {/* Skeleton */}
              {searchLoading && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="px-4 py-3.5">
                              <Skeleton className="h-4 w-full rounded" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Results found */}
              {!searchLoading && searchData.length > 0 && (
                <>
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
                    <Info className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">
                      This model already has an approved Type Approval. You may download the existing certificate below.
                      If your equipment differs from the approved model, you may proceed with a new application.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">{searchData.length}</span>{' '}
                        approved model{searchData.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {['Brand', 'Model', 'Type', 'Network', 'Status', 'Approved Date', 'Certificate', 'Actions'].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {searchData.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                                {row.device_catalog.brand_name}
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="text-gray-900">{row.device_catalog.marketing_name}</p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{row.device_catalog.model_name}</p>
                              </td>
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
                              <td className="px-4 py-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {row.device_catalog.technical_spec_json.network_technology.map((t) => (
                                    <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-medium">{t}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />{row.status_code}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                                {fmtDate(row.approved_at)}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                                {row.certificate.certificate_number}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setSelectedCert(row)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                                  >
                                    <Eye className="w-3 h-3" />View
                                  </button>
                                  <button
                                    onClick={() => handleDownload(row.certificate.certificate_number)}
                                    className="p-1.5 text-xs text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                                    aria-label="Download certificate"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-gray-400">Only proceed if your equipment differs from the models listed above.</p>
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
              {!searchLoading && searchData.length === 0 && (
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: REGISTER
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div className="space-y-5 max-w-2xl">

          {MOCK_REGISTRATION.registered ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-base font-semibold text-gray-900">{MOCK_REGISTRATION.organisation}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                      Registered &amp; Approved
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Reference: <span className="font-mono font-medium text-gray-700">{MOCK_REGISTRATION.reference}</span>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Status</p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />{MOCK_REGISTRATION.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Accreditation Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {accreditations.length > 0
                      ? accreditations.map((a) => (
                          <span key={a.id} className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">{a.accreditation_type}</span>
                        ))
                      : MOCK_REGISTRATION.accreditationTypes.map((t) => (
                          <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">{t}</span>
                        ))
                    }
                  </div>
                </div>
              </div>

              {/* Accreditations detail table */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Accreditations</p>
                {accreditationsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                  </div>
                ) : accreditations.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                    {accreditations.map((a) => {
                      const isActive = a.status_code === 'ACTIVE' || a.status_code === 'APPROVED'
                      return (
                        <div key={a.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn('w-2 h-2 rounded-full shrink-0', isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{a.accreditation_type}</p>
                              <p className="text-xs text-gray-400 font-mono">{a.accreditation_ref}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            {a.issued_at && (
                              <p className="text-xs text-gray-400 hidden sm:block">Issued {fmtDate(a.issued_at)}</p>
                            )}
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border',
                              isActive
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}>
                              {a.status_code}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No accreditations on record.</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                  Your organisation is registered and approved. You can now search for equipment models
                  and submit type approval applications using the{' '}
                  <button onClick={() => setActiveTab('search')} className="font-semibold underline underline-offset-2 hover:no-underline">
                    Search Equipment
                  </button>{' '}
                  tab.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-8 flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Register as a Type Approval Requestor</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-md">
                  Before you can submit any type approval applications, your organisation must be registered
                  and approved as a Type Approval Requestor by BOCRA.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2.5 text-left">
                {['Submit registration with company documents', 'Verify your email address', 'BOCRA reviews your application (3–5 business days)', 'Receive approval and start submitting applications'].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#003580] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/type-approval/register"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors shadow-sm"
              >
                Start Registration
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Certificate dialog ──────────────────────────────────────────── */}
      <CertificateDialog
        result={selectedCert}
        onClose={() => setSelectedCert(null)}
        onDownload={handleDownload}
      />

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

    </div>
  )
}
