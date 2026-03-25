'use client'

import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  FileText,
  Smartphone,
  Building2,
  User,
  X,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Accreditation {
  id: string
  accreditation_type: 'CUSTOMER' | 'MANUFACTURER' | 'REPAIR_SERVICE_PROVIDER'
  accreditation_ref: string
  org_name: string
  status_code: 'APPROVED' | 'PENDING' | 'SUSPENDED'
  issued_at: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Applicant Details'     },
  { label: 'Equipment Information' },
  { label: 'Technical Details'     },
  { label: 'Attachments'           },
]

const MOCK_USER = {
  first_name: 'Kabo',
  last_name: 'Mothibi',
  email: 'kabo.mothibi@techimport.co.bw',
}

const MOCK_ORG = {
  legal_name: 'TechImport Botswana (Pty) Ltd',
  registration_number: 'BW-2021-087432',
}

const NETWORK_TECH_OPTIONS = ['2G', '3G', '4G', '5G', 'WiFi', 'Bluetooth', 'NFC', 'Other']
const STANDARDS_OPTIONS    = ['IEC', 'ITU', 'ETSI', 'FCC', 'CE', 'Other']
const COUNTRIES = [
  'China', 'South Korea', 'Japan', 'United States', 'Germany', 'Finland',
  'Taiwan', 'India', 'Vietnam', 'Malaysia', 'Indonesia', 'Thailand',
  'Brazil', 'Mexico', 'Hungary', 'Czech Republic', 'Poland', 'Netherlands',
  'Sweden', 'United Kingdom', 'France', 'Israel', 'Singapore', 'Botswana', 'Other',
]

const DOCUMENT_TYPES: {
  code: string
  label: string
  required: boolean
  accept: string
  maxFiles: number
  hint?: string
}[] = [
  { code: 'TEST_REPORT',      label: 'Test Report from Accredited Lab',    required: true,  accept: 'application/pdf',      maxFiles: 1 },
  { code: 'TECHNICAL_SPECS',  label: 'Technical Specification Sheet',      required: true,  accept: 'application/pdf',      maxFiles: 1 },
  { code: 'DECLARATION',      label: 'Declaration of Conformity',          required: true,  accept: 'application/pdf',      maxFiles: 1 },
  { code: 'DEVICE_PHOTOS',    label: 'Device Photos (min 3 angles)',       required: true,  accept: 'image/jpeg,image/png', maxFiles: 5, hint: 'Upload 3–5 photos from different angles. JPG or PNG, max 5 MB each.' },
  { code: 'SAMPLE_LABEL',     label: 'Device Label / Marking Sample',      required: true,  accept: 'application/pdf',      maxFiles: 1 },
  { code: 'FOREIGN_APPROVAL', label: 'Foreign Type Approval Certificate',  required: false, accept: 'application/pdf',      maxFiles: 1 },
  { code: 'ISO_CERT',         label: 'ISO or Quality Certification',       required: false, accept: 'application/pdf',      maxFiles: 1 },
  { code: 'OTHER',            label: 'Other Supporting Document',          required: false, accept: '*/*',                  maxFiles: 3 },
]

const REQUIRED_DOC_CODES = DOCUMENT_TYPES.filter(d => d.required).map(d => d.code)

// ── Zod schema ────────────────────────────────────────────────────────────────

const applySchema = z.object({
  // Step 1
  customer_accreditation_id:     z.string().min(1, 'Customer accreditation is required'),
  manufacturer_accreditation_id: z.string().optional(),
  repair_accreditation_id:       z.string().optional(),
  phone_e164:                    z.string().regex(/^\+267\d{7,8}$/, 'Use format +267 followed by 7–8 digits'),
  physical_address:              z.string().min(5, 'Physical address is required'),

  // Step 2
  brand_name:             z.string().min(1, 'Brand name is required'),
  marketing_name:         z.string().min(1, 'Marketing name is required'),
  model_name:             z.string().min(1, 'Model name / number is required'),
  is_sim_enabled:         z.enum(['yes', 'no']),
  sample_imei:            z.string().optional(),
  country_of_manufacture: z.string().min(1, 'Country of manufacture is required'),
  frequency_bands:        z.string().min(1, 'Frequency bands are required'),
  transmission_power:     z.string().min(1, 'Transmission power is required'),
  network_technology:     z.array(z.string()).min(1, 'Select at least one technology'),
  dimensions:             z.string().optional(),
  weight:                 z.string().optional(),
  battery_capacity_mah:   z.string().optional(),

  // Step 3
  standards_compliance:      z.array(z.string()).min(1, 'Select at least one standard'),
  test_laboratory_name:      z.string().min(1, 'Test laboratory name is required'),
  test_report_reference:     z.string().min(1, 'Test report reference is required'),
  test_date:                 z.string().min(1, 'Test date is required'),
  declaration_of_conformity: z.string().min(100, 'Minimum 100 characters required'),
  previously_approved:       z.enum(['yes', 'no']),
  previous_country:          z.string().optional(),
  previous_reference:        z.string().optional(),

  // Review
  declaration_confirmed: z.boolean().refine(v => v === true, { message: 'You must confirm the declaration to submit' }),
}).superRefine((data, ctx) => {
  if (data.is_sim_enabled === 'yes') {
    if (!data.sample_imei?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'IMEI is required when SIM is enabled', path: ['sample_imei'] })
    } else if (!/^\d{15}$/.test(data.sample_imei)) {
      ctx.addIssue({ code: 'custom', message: 'IMEI must be exactly 15 digits', path: ['sample_imei'] })
    }
  }
  if (data.previously_approved === 'yes') {
    if (!data.previous_country?.trim())
      ctx.addIssue({ code: 'custom', message: 'Country is required', path: ['previous_country'] })
    if (!data.previous_reference?.trim())
      ctx.addIssue({ code: 'custom', message: 'Approval reference is required', path: ['previous_reference'] })
  }
})

type ApplyForm = z.infer<typeof applySchema>

const STEP_FIELDS: Record<number, (keyof ApplyForm)[]> = {
  1: ['customer_accreditation_id', 'phone_e164', 'physical_address'],
  2: ['brand_name', 'marketing_name', 'model_name', 'is_sim_enabled', 'sample_imei',
      'country_of_manufacture', 'frequency_bands', 'transmission_power', 'network_technology'],
  3: ['standards_compliance', 'test_laboratory_name', 'test_report_reference', 'test_date',
      'declaration_of_conformity', 'previously_approved', 'previous_country', 'previous_reference'],
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertTriangle className="w-3 h-3 shrink-0" />{message}
    </p>
  )
}

const inputCls = (err?: boolean) =>
  cn('w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white',
     'focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors',
     err ? 'border-red-400' : 'border-gray-200')

const readOnlyCls =
  'w-full rounded-lg border border-gray-100 px-3.5 py-2.5 text-sm text-gray-700 bg-gray-50 cursor-default select-none'

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const pct = Math.round(((current - 1) / STEPS.length) * 100 + (1 / STEPS.length) * 50)
  return (
    <div className="space-y-3">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const done   = idx < current - 1
          const active = idx === current - 1
          return (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-all',
                done   ? 'bg-[#003580] border-[#003580] text-white' : '',
                active ? 'bg-white border-[#003580] text-[#003580] shadow-sm' : '',
                !done && !active ? 'bg-white border-gray-200 text-gray-400' : '',
              )}>
                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={cn('hidden sm:block ml-2 text-xs font-medium whitespace-nowrap',
                active ? 'text-[#003580]' : done ? 'text-gray-500' : 'text-gray-300',
              )}>
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors',
                  idx < current - 1 ? 'bg-[#003580]' : 'bg-gray-200')} />
              )}
            </div>
          )
        })}
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-[#003580] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Document Upload Row ───────────────────────────────────────────────────────

function DocUploadRow({
  code, label, required, accept, maxFiles, hint,
  files, onAdd, onRemove,
}: {
  code: string; label: string; required: boolean
  accept: string; maxFiles: number; hint?: string
  files: File[]; onAdd: (f: File[]) => void; onRemove: (i: number) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const isPhotos = code === 'DEVICE_PHOTOS'
  const complete  = isPhotos ? files.length >= 3 : files.length >= 1

  return (
    <div className="py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <Badge variant="outline" className={cn('text-[10px]',
              required ? 'border-red-200 text-red-600 bg-red-50' : 'text-gray-500')}>
              {required ? 'Required' : 'Optional'}
            </Badge>
          </div>
          {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1">
                  <FileText className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-700 max-w-[140px] truncate">{f.name}</span>
                  <span className="text-[10px] text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => onRemove(i)}
                    className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn('flex items-center gap-1.5 text-xs font-medium',
            complete ? 'text-emerald-600' : 'text-gray-400')}>
            {complete
              ? <><CheckCircle2 className="w-3.5 h-3.5" />Uploaded</>
              : <><div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                  {isPhotos && files.length > 0 ? `${files.length}/3 min` : 'Not Uploaded'}</>
            }
          </span>
          {files.length < maxFiles && (
            <>
              <button type="button" onClick={() => ref.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580] rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
                <Upload className="w-3 h-3" />
                {files.length > 0 ? 'Add More' : 'Upload'}
              </button>
              <input ref={ref} type="file" accept={accept} multiple={maxFiles > 1}
                className="sr-only"
                onChange={e => {
                  const picked = Array.from(e.target.files ?? [])
                    .filter(f => f.size <= 5 * 1024 * 1024)
                    .slice(0, maxFiles - files.length)
                  onAdd(picked)
                  e.target.value = ''
                }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Toggle button group ───────────────────────────────────────────────────────

function ToggleGroup({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
            value === opt.value ? 'bg-[#003580] text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
            'not-first:border-l not-first:border-gray-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-1">
      {children}
    </p>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TypeApprovalApplyPage() {
  const searchParams = useSearchParams()
  const brandFromUrl = searchParams.get('brand') ?? ''
  const modelFromUrl = searchParams.get('model') ?? ''
  const nameFromUrl  = searchParams.get('name')  ?? ''

  const [step, setStep]               = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})
  const [filesError, setFilesError]   = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [submittedRef, setSubmittedRef] = useState('')
  const [submittedId, setSubmittedId]  = useState('')

  // ── Accreditations ─────────────────────────────────────────────────────────

  const { data: accreditations = [], isLoading: loadingAccreds } = useQuery<Accreditation[]>({
    queryKey: ['type-approval-accreditations'],
    queryFn: () => fetch('/api/type-approval/accreditations').then(r => r.json()),
    staleTime: 5 * 60_000,
  })

  const approvedList    = accreditations.filter(a => a.status_code === 'APPROVED')
  const hasApproved     = approvedList.length > 0
  const customerList    = approvedList.filter(a => a.accreditation_type === 'CUSTOMER')
  const mfgList         = approvedList.filter(a => a.accreditation_type === 'MANUFACTURER')
  const repairList      = approvedList.filter(a => a.accreditation_type === 'REPAIR_SERVICE_PROVIDER')

  // ── Form ───────────────────────────────────────────────────────────────────

  const {
    register,
    control,
    trigger,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      phone_e164:           '+26771234567',
      physical_address:     'Plot 54368, CBD, Gaborone, Botswana',
      brand_name:           brandFromUrl,
      marketing_name:       nameFromUrl,
      model_name:           modelFromUrl,
      is_sim_enabled:       'no',
      network_technology:   [],
      standards_compliance: [],
      previously_approved:  'no',
      declaration_confirmed: false,
    },
  })

  const isSimEnabled    = watch('is_sim_enabled')    === 'yes'
  const prevApproved    = watch('previously_approved') === 'yes'
  const docLen          = watch('declaration_of_conformity')?.length ?? 0

  // ── File helpers ───────────────────────────────────────────────────────────

  function addFiles(code: string, newFiles: File[]) {
    setUploadedFiles(prev => ({ ...prev, [code]: [...(prev[code] ?? []), ...newFiles] }))
  }

  function removeFile(code: string, idx: number) {
    setUploadedFiles(prev => ({
      ...prev,
      [code]: (prev[code] ?? []).filter((_, i) => i !== idx),
    }))
  }

  const uploadedRequiredCount = REQUIRED_DOC_CODES.filter(code => {
    const files = uploadedFiles[code] ?? []
    return code === 'DEVICE_PHOTOS' ? files.length >= 3 : files.length >= 1
  }).length
  const allRequiredUploaded = uploadedRequiredCount === REQUIRED_DOC_CODES.length

  // ── Navigation ─────────────────────────────────────────────────────────────

  async function handleNext() {
    const ok = await trigger(STEP_FIELDS[step])
    if (ok) setStep(s => s + 1)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(async (values) => {
    if (!allRequiredUploaded) {
      setFilesError('Please upload all required documents before submitting.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/type-approval/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, documents: Object.keys(uploadedFiles) }),
      })
      const data = await res.json()
      setSubmittedRef(data.applicationNumber)
      setSubmittedId(data.id)
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  })

  // ── Success state ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Application Submitted Successfully</h1>
          <p className="text-sm text-gray-500 mb-2">Your reference number is:</p>
          <p className="font-mono text-lg font-bold text-[#003580]">{submittedRef}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 w-full text-left space-y-2 text-sm text-gray-600">
          <p>A confirmation has been sent to <span className="font-medium text-gray-900">{MOCK_USER.email}</span>.</p>
          <p>BOCRA will review your application. You can track the status under <span className="font-medium text-gray-900">Type Approval &rsaquo; My Applications</span>.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Link
            href="/dashboard/type-approval"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            View My Applications
          </Link>
          <Link
            href={`/dashboard/type-approval/${submittedId}`}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors shadow-sm"
          >
            Track This Application
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // ── Loading accreditations ─────────────────────────────────────────────────

  if (loadingAccreds) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />Checking accreditation status…
      </div>
    )
  }

  // ── Accreditation required blocker ─────────────────────────────────────────

  if (!hasApproved) {
    return (
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/type-approval" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Type Approval Application</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              <Link href="/dashboard/type-approval" className="hover:underline">Type Approval</Link>
              {' › '} New Application
            </p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Accreditation Required</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You must have at least one approved accreditation before submitting a Type Approval application.
            </p>
          </div>
          <Link
            href="/dashboard/type-approval/accreditations"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors shadow-sm"
          >
            Go to Accreditations
          </Link>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center gap-2.5">
        <Link href="/dashboard/type-approval" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Type Approval Application</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            <Link href="/dashboard/type-approval" className="hover:underline">Type Approval</Link>
            {' › '} New Application
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-7">

        {/* Step indicator */}
        <StepIndicator current={step} />

        <Separator />

        {/* ═══ STEP 1: Applicant Details ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">

            {/* Accreditations */}
            <div>
              <SectionHeading>Accreditation</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <FieldLabel required>Customer Accreditation</FieldLabel>
                  <select {...register('customer_accreditation_id')} className={inputCls(!!errors.customer_accreditation_id)}>
                    <option value="">— Select accreditation —</option>
                    {customerList.map(a => (
                      <option key={a.id} value={a.id}>{a.org_name} — {a.accreditation_ref}</option>
                    ))}
                  </select>
                  {customerList.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">No approved customer accreditations found.</p>
                  )}
                  <FieldError message={errors.customer_accreditation_id?.message} />
                </div>

                <div>
                  <FieldLabel>Manufacturer Accreditation</FieldLabel>
                  <select {...register('manufacturer_accreditation_id')} className={inputCls()}>
                    <option value="">— None —</option>
                    {mfgList.map(a => (
                      <option key={a.id} value={a.id}>{a.org_name} — {a.accreditation_ref}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">Required if you are the manufacturer.</p>
                </div>

                <div>
                  <FieldLabel>Repair Service Provider Accreditation</FieldLabel>
                  <select {...register('repair_accreditation_id')} className={inputCls()}>
                    <option value="">— None —</option>
                    {repairList.map(a => (
                      <option key={a.id} value={a.id}>{a.org_name} — {a.accreditation_ref}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            <Separator />

            {/* Contact info */}
            <div>
              <SectionHeading>Applicant Contact</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <div className={readOnlyCls}>{MOCK_USER.first_name} {MOCK_USER.last_name}</div>
                </div>

                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  <div className={readOnlyCls}>{MOCK_USER.email}</div>
                </div>

                <div>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <input
                    {...register('phone_e164')}
                    placeholder="+26771234567"
                    className={inputCls(!!errors.phone_e164)}
                  />
                  <FieldError message={errors.phone_e164?.message} />
                </div>

              </div>
            </div>

            <Separator />

            {/* Organisation */}
            <div>
              <SectionHeading>Organisation</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <FieldLabel>Legal Name</FieldLabel>
                  <div className={readOnlyCls}>{MOCK_ORG.legal_name}</div>
                </div>

                <div>
                  <FieldLabel>Registration Number</FieldLabel>
                  <div className={readOnlyCls}>{MOCK_ORG.registration_number}</div>
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel required>Physical Address</FieldLabel>
                  <input
                    {...register('physical_address')}
                    placeholder="Plot number, street, city"
                    className={inputCls(!!errors.physical_address)}
                  />
                  <FieldError message={errors.physical_address?.message} />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Equipment Information ══════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">

            <div>
              <SectionHeading>Device Identity</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <FieldLabel required>Brand Name</FieldLabel>
                  <input
                    {...register('brand_name')}
                    placeholder="e.g. Samsung"
                    className={inputCls(!!errors.brand_name)}
                  />
                  <FieldError message={errors.brand_name?.message} />
                </div>

                <div>
                  <FieldLabel required>Marketing Name</FieldLabel>
                  <input
                    {...register('marketing_name')}
                    placeholder="e.g. Galaxy A55"
                    className={inputCls(!!errors.marketing_name)}
                  />
                  <FieldError message={errors.marketing_name?.message} />
                </div>

                <div>
                  <FieldLabel required>Model Name / Number</FieldLabel>
                  <input
                    {...register('model_name')}
                    placeholder="e.g. SM-A556B"
                    className={inputCls(!!errors.model_name)}
                  />
                  <FieldError message={errors.model_name?.message} />
                </div>

                <div>
                  <FieldLabel required>Country of Manufacture</FieldLabel>
                  <select {...register('country_of_manufacture')} className={inputCls(!!errors.country_of_manufacture)}>
                    <option value="">— Select country —</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <FieldError message={errors.country_of_manufacture?.message} />
                </div>

              </div>
            </div>

            <Separator />

            <div>
              <SectionHeading>SIM Support</SectionHeading>
              <div className="space-y-4">
                <div>
                  <FieldLabel required>SIM-Enabled Device?</FieldLabel>
                  <Controller
                    control={control}
                    name="is_sim_enabled"
                    render={({ field }) => (
                      <ToggleGroup
                        value={field.value}
                        onChange={field.onChange}
                        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                      />
                    )}
                  />
                </div>

                {isSimEnabled && (
                  <div className="max-w-xs">
                    <FieldLabel required>Sample IMEI Number</FieldLabel>
                    <input
                      {...register('sample_imei')}
                      placeholder="15-digit IMEI"
                      maxLength={15}
                      className={inputCls(!!errors.sample_imei)}
                    />
                    <FieldError message={errors.sample_imei?.message} />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <SectionHeading>Technical Specifications</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <FieldLabel required>Frequency Bands</FieldLabel>
                  <input
                    {...register('frequency_bands')}
                    placeholder="e.g. 700/800/900/1800/2100/2600 MHz"
                    className={inputCls(!!errors.frequency_bands)}
                  />
                  <FieldError message={errors.frequency_bands?.message} />
                </div>

                <div>
                  <FieldLabel required>Transmission Power</FieldLabel>
                  <input
                    {...register('transmission_power')}
                    placeholder="e.g. 23 dBm"
                    className={inputCls(!!errors.transmission_power)}
                  />
                  <FieldError message={errors.transmission_power?.message} />
                </div>

                <div>
                  <FieldLabel>Dimensions</FieldLabel>
                  <input
                    {...register('dimensions')}
                    placeholder="e.g. 158 × 76 × 8.2 mm"
                    className={inputCls()}
                  />
                </div>

                <div>
                  <FieldLabel>Weight</FieldLabel>
                  <input
                    {...register('weight')}
                    placeholder="e.g. 202 g"
                    className={inputCls()}
                  />
                </div>

                <div>
                  <FieldLabel>Battery Capacity (mAh)</FieldLabel>
                  <input
                    {...register('battery_capacity_mah')}
                    type="number"
                    placeholder="e.g. 5000"
                    className={inputCls()}
                  />
                </div>

              </div>

              <div className="mt-4">
                <FieldLabel required>Network Technologies</FieldLabel>
                <Controller
                  control={control}
                  name="network_technology"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {NETWORK_TECH_OPTIONS.map(opt => {
                        const checked = field.value?.includes(opt) ?? false
                        return (
                          <label key={opt} className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors select-none',
                            checked ? 'bg-[#003580] border-[#003580] text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-[#003580]/40',
                          )}>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={e => {
                                if (e.target.checked) field.onChange([...(field.value ?? []), opt])
                                else field.onChange((field.value ?? []).filter((v: string) => v !== opt))
                              }}
                            />
                            {opt}
                          </label>
                        )
                      })}
                    </div>
                  )}
                />
                <FieldError message={errors.network_technology?.message} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Technical Details ═══════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">

            <div>
              <SectionHeading>Standards Compliance</SectionHeading>
              <Controller
                control={control}
                name="standards_compliance"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {STANDARDS_OPTIONS.map(opt => {
                      const checked = field.value?.includes(opt) ?? false
                      return (
                        <label key={opt} className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors select-none',
                          checked ? 'bg-[#003580] border-[#003580] text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-[#003580]/40',
                        )}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={e => {
                              if (e.target.checked) field.onChange([...(field.value ?? []), opt])
                              else field.onChange((field.value ?? []).filter((v: string) => v !== opt))
                            }}
                          />
                          {opt}
                        </label>
                      )
                    })}
                  </div>
                )}
              />
              <FieldError message={errors.standards_compliance?.message} />
            </div>

            <Separator />

            <div>
              <SectionHeading>Test Information</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <FieldLabel required>Test Laboratory Name</FieldLabel>
                  <input
                    {...register('test_laboratory_name')}
                    placeholder="e.g. CTTL, TÜV Rheinland"
                    className={inputCls(!!errors.test_laboratory_name)}
                  />
                  <FieldError message={errors.test_laboratory_name?.message} />
                </div>

                <div>
                  <FieldLabel required>Test Report Reference Number</FieldLabel>
                  <input
                    {...register('test_report_reference')}
                    placeholder="e.g. CTTL-2025-08734"
                    className={inputCls(!!errors.test_report_reference)}
                  />
                  <FieldError message={errors.test_report_reference?.message} />
                </div>

                <div>
                  <FieldLabel required>Test Date</FieldLabel>
                  <input
                    {...register('test_date')}
                    type="date"
                    className={inputCls(!!errors.test_date)}
                  />
                  <FieldError message={errors.test_date?.message} />
                </div>

              </div>
            </div>

            <Separator />

            <div>
              <FieldLabel required>Declaration of Conformity</FieldLabel>
              <textarea
                {...register('declaration_of_conformity')}
                rows={5}
                placeholder="Describe how the equipment conforms to the applicable technical standards. Minimum 100 characters."
                className={cn(inputCls(!!errors.declaration_of_conformity), 'resize-none')}
              />
              <div className="flex justify-between mt-1">
                <FieldError message={errors.declaration_of_conformity?.message} />
                <p className={cn('text-xs ml-auto', docLen >= 100 ? 'text-emerald-600' : 'text-gray-400')}>
                  {docLen}/100 min
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <SectionHeading>Prior Approvals</SectionHeading>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Has this equipment been type approved in another country?</FieldLabel>
                  <Controller
                    control={control}
                    name="previously_approved"
                    render={({ field }) => (
                      <ToggleGroup
                        value={field.value}
                        onChange={field.onChange}
                        options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
                      />
                    )}
                  />
                </div>

                {prevApproved && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Country</FieldLabel>
                      <input
                        {...register('previous_country')}
                        placeholder="e.g. South Africa"
                        className={inputCls(!!errors.previous_country)}
                      />
                      <FieldError message={errors.previous_country?.message} />
                    </div>
                    <div>
                      <FieldLabel required>Approval Reference Number</FieldLabel>
                      <input
                        {...register('previous_reference')}
                        placeholder="e.g. ICASA-TA-2024-00123"
                        className={inputCls(!!errors.previous_reference)}
                      />
                      <FieldError message={errors.previous_reference?.message} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Attachments + Review ════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-6">

            {/* Completeness bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Required documents: <span className={cn('font-bold', allRequiredUploaded ? 'text-emerald-600' : 'text-[#003580]')}>
                    {uploadedRequiredCount} of {REQUIRED_DOC_CODES.length}
                  </span> uploaded
                </p>
                {allRequiredUploaded && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />All required documents uploaded
                  </span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500',
                    allRequiredUploaded ? 'bg-emerald-500' : 'bg-[#003580]')}
                  style={{ width: `${(uploadedRequiredCount / REQUIRED_DOC_CODES.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Upload rows */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Document Uploads</p>
              </div>
              <div className="px-5">
                {DOCUMENT_TYPES.map(doc => (
                  <DocUploadRow
                    key={doc.code}
                    code={doc.code}
                    label={doc.label}
                    required={doc.required}
                    accept={doc.accept}
                    maxFiles={doc.maxFiles}
                    hint={doc.hint}
                    files={uploadedFiles[doc.code] ?? []}
                    onAdd={f => addFiles(doc.code, f)}
                    onRemove={i => removeFile(doc.code, i)}
                  />
                ))}
              </div>
            </div>

            {/* ── Review ── */}
            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-900">Review Your Application</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Applicant */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-[#003580]" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applicant</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{MOCK_ORG.legal_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{MOCK_USER.first_name} {MOCK_USER.last_name} · {MOCK_USER.email}</p>
                  <p className="text-xs text-gray-500">{watch('phone_e164')}</p>
                </div>

                {/* Equipment */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="w-4 h-4 text-[#003580]" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipment</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{watch('brand_name')} {watch('marketing_name')}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{watch('model_name')}</p>
                  <p className="text-xs text-gray-500">
                    SIM-enabled: {watch('is_sim_enabled') === 'yes' ? 'Yes' : 'No'}
                    {watch('sample_imei') ? ` · IMEI: ${watch('sample_imei')}` : ''}
                  </p>
                </div>

                {/* Technical */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[#003580]" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Technical</p>
                  </div>
                  <p className="text-xs text-gray-600">Standards: {watch('standards_compliance')?.join(', ') || '—'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Lab: {watch('test_laboratory_name') || '—'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Test date: {watch('test_date') || '—'}</p>
                </div>

                {/* Attachments */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="w-4 h-4 text-[#003580]" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attachments</p>
                  </div>
                  <div className="space-y-1">
                    {DOCUMENT_TYPES.filter(d => (uploadedFiles[d.code] ?? []).length > 0).map(d => (
                      <div key={d.code} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        {d.label}
                        <span className="text-gray-400">({(uploadedFiles[d.code] ?? []).length} file{(uploadedFiles[d.code] ?? []).length !== 1 ? 's' : ''})</span>
                      </div>
                    ))}
                    {Object.keys(uploadedFiles).length === 0 && (
                      <p className="text-xs text-gray-400">No documents uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className={cn('bg-blue-50 border rounded-xl px-4 py-3.5 flex items-start gap-3',
                errors.declaration_confirmed ? 'border-red-300 bg-red-50' : 'border-blue-200')}>
                <input
                  type="checkbox"
                  id="declaration_confirmed"
                  {...register('declaration_confirmed')}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#003580] focus:ring-[#003580]/30 cursor-pointer shrink-0"
                />
                <label htmlFor="declaration_confirmed" className="text-sm text-blue-900 leading-relaxed cursor-pointer">
                  I confirm that all information provided is accurate, complete, and that the equipment meets BOCRA&apos;s technical requirements.
                </label>
              </div>
              <FieldError message={errors.declaration_confirmed?.message} />

              {filesError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{filesError}
                </p>
              )}

              {/* Submit button */}
              <button
                type="button"
                onClick={() => {
                  setFilesError('')
                  onSubmit()
                }}
                disabled={isSubmitting || !allRequiredUploaded}
                title={!allRequiredUploaded ? 'Upload all required documents first' : undefined}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#003580] text-white font-semibold text-sm rounded-lg hover:bg-[#002a6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                  : <><ShieldCheck className="w-4 h-4" />Submit Type Approval Application</>
                }
              </button>
            </div>
          </div>
        )}

        <Separator />

        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />Back
            </button>
          ) : (
            <Link
              href="/dashboard/type-approval"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />Cancel
            </Link>
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
