'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  ImageIcon,
  FileText,
  Smartphone,
  ShieldCheck,
  User,
  Building2,
  Wrench,
  Info,
  Banknote,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

type AccreditationTypeId = 'customer' | 'manufacturer' | 'repair_provider'
type AccreditationStatus = 'APPROVED' | 'PENDING' | 'SUSPENDED' | 'NOT_FOUND'

const ACCREDITATION_TYPES: {
  id: AccreditationTypeId
  label: string
  description: string
  icon: React.ElementType
}[] = [
  {
    id: 'customer',
    label: 'Customer',
    description: 'End-user or retailer importing/selling devices for personal or commercial use',
    icon: User,
  },
  {
    id: 'manufacturer',
    label: 'Manufacturer',
    description: 'Original Equipment Manufacturer or authorised representative seeking device approval',
    icon: Building2,
  },
  {
    id: 'repair_provider',
    label: 'Repair Service Provider',
    description: 'Authorised repair centre requiring approval for replacement components',
    icon: Wrench,
  },
]

// Mock accreditation status per type — in production, fetched via GET /api/accreditation?type={id}
const MOCK_ACCREDITATION: Record<AccreditationTypeId, { status: AccreditationStatus; reference?: string }> = {
  customer:        { status: 'APPROVED',   reference: 'ACC-2024-00183' },
  manufacturer:    { status: 'PENDING',    reference: 'ACC-2025-00041' },
  repair_provider: { status: 'NOT_FOUND' },
}

const ACCREDITATION_STATUS_CONFIG: Record<AccreditationStatus, {
  icon: React.ElementType
  cls: string
  label: string
  canProceed: boolean
}> = {
  APPROVED:  { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50', label: 'Approved',  canProceed: true  },
  PENDING:   { icon: Clock,        cls: 'border-amber-200 bg-amber-50',     label: 'Pending',   canProceed: false },
  SUSPENDED: { icon: XCircle,      cls: 'border-red-200 bg-red-50',         label: 'Suspended', canProceed: false },
  NOT_FOUND: { icon: AlertCircle,  cls: 'border-gray-200 bg-gray-50',       label: 'Not Found', canProceed: false },
}

const COUNTRIES = [
  'China', 'South Korea', 'Japan', 'United States', 'Germany', 'Finland',
  'Taiwan', 'India', 'Vietnam', 'Malaysia', 'Indonesia', 'Thailand',
  'Brazil', 'Mexico', 'Hungary', 'Czech Republic', 'Poland', 'Netherlands',
  'Sweden', 'United Kingdom', 'France', 'Israel', 'Singapore', 'Other',
]

const STEPS = [
  { label: 'Accreditation' },
  { label: 'Device Details' },
  { label: 'Documents'      },
  { label: 'Review & Fee'   },
  { label: 'Submit'         },
]

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  // Step 1
  accreditationType: z.enum(['customer', 'manufacturer', 'repair_provider'], {
    error: 'Please select your accreditation type',
  }),

  // Step 2
  brandName:  z.string().min(1, 'Brand name is required'),
  modelName:  z.string().min(1, 'Model / marketing name is required'),
  simEnabled: z.enum(['yes', 'no'], { error: 'Please indicate SIM support' }),
  techSpec:   z.string().optional(),
  sampleImei: z.string().optional().refine(
    (v) => !v || /^\d{15}$/.test(v),
    { message: 'IMEI must be exactly 15 digits' },
  ),
  countryOfManufacture: z.string().min(1, 'Country of manufacture is required'),

  // Step 5
  declaration: z.boolean().refine((v) => v === true, {
    message: 'You must accept the declaration to submit',
  }),
})

type FormValues = z.infer<typeof schema>

const STEP_FIELDS: (keyof FormValues)[][] = [
  ['accreditationType'],
  ['brandName', 'modelName', 'simEnabled', 'countryOfManufacture'],
  [],
  [],
  ['declaration'],
]

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580]',
        'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        className,
      )}
      {...props}
    />
  )
}

function SelectEl({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580]',
        'disabled:opacity-50 transition-colors appearance-none',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580]',
        'resize-none transition-colors',
        className,
      )}
      {...props}
    />
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const progress = Math.round(((current + 1) / STEPS.length) * 100)
  return (
    <div className="space-y-3">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const done    = idx < current
          const active  = idx === current
          const pending = idx > current
          return (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-all',
                done    && 'bg-[#003580] border-[#003580] text-white',
                active  && 'bg-white border-[#003580] text-[#003580] shadow-sm',
                pending && 'bg-white border-gray-200 text-gray-400',
              )}>
                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={cn(
                'hidden sm:block ml-2 text-xs font-medium whitespace-nowrap',
                active  && 'text-[#003580]',
                done    && 'text-gray-500',
                pending && 'text-gray-300',
              )}>
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors',
                  idx < current ? 'bg-[#003580]' : 'bg-gray-200',
                )} />
              )}
            </div>
          )
        })}
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#003580] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">{progress}% complete</p>
    </div>
  )
}

// ─── Step 1 — Accreditation check ─────────────────────────────────────────────

function Step1({
  value,
  onChange,
  error,
}: {
  value: AccreditationTypeId | undefined
  onChange: (v: AccreditationTypeId) => void
  error?: string
}) {
  const accred = value ? MOCK_ACCREDITATION[value] : null
  const config = accred ? ACCREDITATION_STATUS_CONFIG[accred.status] : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Accreditation Check</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select your accreditation type. Only accredited entities may submit a type approval application.
        </p>
      </div>

      {/* Type cards */}
      <div className="space-y-2.5">
        {ACCREDITATION_TYPES.map((type) => {
          const selected = value === type.id
          const Icon = type.icon
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={cn(
                'group w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30',
                selected
                  ? 'border-[#003580] bg-blue-50/40 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              {/* Radio circle */}
              <div className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                selected ? 'border-[#003580]' : 'border-gray-300',
              )}>
                {selected && <div className="h-2.5 w-2.5 rounded-full bg-[#003580]" />}
              </div>

              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-[#003580]/10 text-[#003580]' : 'bg-gray-100 text-gray-400',
              )}>
                <Icon className="w-4.5 h-4.5 w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', selected ? 'text-gray-900' : 'text-gray-700')}>
                  {type.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{type.description}</p>
              </div>
            </button>
          )
        })}
      </div>
      {error && <FieldError message={error} />}

      {/* Accreditation status panel */}
      {accred && config && (
        <div className={cn('rounded-xl border-2 p-4 space-y-3 transition-all', config.cls)}>
          <div className="flex items-start gap-3">
            <config.icon className={cn(
              'w-5 h-5 shrink-0 mt-0.5',
              accred.status === 'APPROVED'  && 'text-emerald-600',
              accred.status === 'PENDING'   && 'text-amber-600',
              accred.status === 'SUSPENDED' && 'text-red-600',
              accred.status === 'NOT_FOUND' && 'text-gray-400',
            )} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={cn(
                  'text-sm font-semibold',
                  accred.status === 'APPROVED'  && 'text-emerald-800',
                  accred.status === 'PENDING'   && 'text-amber-800',
                  accred.status === 'SUSPENDED' && 'text-red-800',
                  accred.status === 'NOT_FOUND' && 'text-gray-700',
                )}>
                  Accreditation Status: {config.label}
                </p>
                {accred.reference && (
                  <code className="text-xs bg-white/70 border border-current/20 px-1.5 py-0.5 rounded font-mono opacity-70">
                    {accred.reference}
                  </code>
                )}
              </div>

              {accred.status === 'APPROVED' && (
                <p className="text-xs text-emerald-700 mt-1">
                  Your accreditation is active. You may proceed with this application.
                </p>
              )}
              {accred.status === 'PENDING' && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-amber-700">
                    Your accreditation application is currently under review. You cannot submit a type
                    approval application until accreditation is approved.
                  </p>
                  <Link
                    href="/dashboard/complaints"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 underline hover:text-amber-900"
                  >
                    Track accreditation status →
                  </Link>
                </div>
              )}
              {accred.status === 'SUSPENDED' && (
                <p className="text-xs text-red-700 mt-1">
                  Your accreditation has been suspended. Contact BOCRA on <strong>+267 395 7755</strong> to
                  resolve the suspension before proceeding.
                </p>
              )}
              {accred.status === 'NOT_FOUND' && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-600">
                    No accreditation record was found for this type. You must complete the accreditation
                    process before applying for type approval.
                  </p>
                  <Link
                    href="/dashboard/licensing/apply"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#003580] underline hover:text-[#002a6b]"
                  >
                    Apply for accreditation →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 2 — Device details ──────────────────────────────────────────────────

function SimToggle({
  value,
  onChange,
  error,
}: {
  value: 'yes' | 'no' | undefined
  onChange: (v: 'yes' | 'no') => void
  error?: string
}) {
  return (
    <div>
      <Label required>SIM-Enabled Device?</Label>
      <div className="flex gap-2 mt-1">
        {(['yes', 'no'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'flex-1 rounded-lg border-2 py-2.5 text-sm font-semibold transition-all',
              value === opt
                ? opt === 'yes'
                  ? 'border-[#003580] bg-blue-50 text-[#003580]'
                  : 'border-gray-400 bg-gray-50 text-gray-700'
                : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300',
            )}
          >
            {opt === 'yes' ? 'Yes — SIM Enabled' : 'No — Non-SIM Device'}
          </button>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  )
}

function Step2({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, control, formState: { errors } } = form

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Device Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Provide the technical details of the device seeking type approval.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Brand Name</Label>
          <Input {...register('brandName')} placeholder="e.g. Samsung" />
          <FieldError message={errors.brandName?.message} />
        </div>

        <div>
          <Label required>Marketing / Model Name</Label>
          <Input {...register('modelName')} placeholder="e.g. Galaxy A55 5G" />
          <FieldError message={errors.modelName?.message} />
        </div>

        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="simEnabled"
            render={({ field }) => (
              <SimToggle
                value={field.value}
                onChange={field.onChange}
                error={errors.simEnabled?.message}
              />
            )}
          />
        </div>

        <div>
          <Label>Sample IMEI</Label>
          <Input
            {...register('sampleImei')}
            placeholder="15-digit IMEI (optional)"
            maxLength={15}
            inputMode="numeric"
          />
          <p className="mt-1 text-xs text-gray-400">
            Dial *#06# on the device. Must be exactly 15 digits if provided.
          </p>
          <FieldError message={errors.sampleImei?.message} />
        </div>

        <div>
          <Label required>Country of Manufacture</Label>
          <SelectEl {...register('countryOfManufacture')}>
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectEl>
          <FieldError message={errors.countryOfManufacture?.message} />
        </div>

        <div className="sm:col-span-2">
          <Label>Technical Specification</Label>
          <Textarea
            {...register('techSpec')}
            rows={5}
            placeholder={
              'Describe the device technical specification, e.g.:\n' +
              '• Radio frequencies / bands supported\n' +
              '• Transmit power (dBm)\n' +
              '• Wireless standards (LTE, Wi-Fi 6, Bluetooth 5.3…)\n' +
              '• Antenna configuration'
            }
          />
          <p className="mt-1 text-xs text-gray-400">Optional — you may also attach a datasheet in the next step.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 — Documents ───────────────────────────────────────────────────────

interface DocSlot {
  id: string
  label: string
  description: string
  required: boolean
  accept: string
  maxMb: number
}

const DOC_SLOTS: DocSlot[] = [
  {
    id: 'test_results',
    label: 'Accredited Test Laboratory Report',
    description: 'RF / EMC / SAR test results from an accredited lab (PDF)',
    required: true,
    accept: '.pdf',
    maxMb: 20,
  },
  {
    id: 'mfr_declaration',
    label: 'Manufacturer Declaration of Conformity',
    description: 'Signed declaration confirming device conforms to applicable standards (PDF)',
    required: true,
    accept: '.pdf',
    maxMb: 10,
  },
  {
    id: 'datasheet',
    label: 'Device Datasheet / Technical Manual',
    description: 'Official product datasheet or user manual (PDF, optional)',
    required: false,
    accept: '.pdf',
    maxMb: 20,
  },
]

function SingleDocUpload({
  slot,
  file,
  onUpload,
}: {
  slot: DocSlot
  file: File | null
  onUpload: (f: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (f.size > slot.maxMb * 1024 * 1024) {
      alert(`File exceeds ${slot.maxMb} MB limit.`)
      return
    }
    onUpload(f)
  }

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors',
      file ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-white',
    )}>
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5',
        file ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400',
      )}>
        {file ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{slot.label}</p>
        {file ? (
          <p className="text-xs text-emerald-600 mt-0.5 truncate">
            {file.name} &middot; {(file.size / 1024).toFixed(0)} KB
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">{slot.description}</p>
        )}
      </div>

      <input ref={inputRef} type="file" accept={slot.accept} className="hidden" onChange={handleChange} />

      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        {!slot.required && (
          <span className="text-xs text-gray-400 font-medium">Optional</span>
        )}
        {file && (
          <button
            type="button"
            onClick={() => { onUpload(null); if (inputRef.current) inputRef.current.value = '' }}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            file
              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50',
          )}
        >
          <Upload className="w-3.5 h-3.5" />
          {file ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
  )
}

function PhotoUpload({
  photos,
  onAdd,
  onRemove,
}: {
  photos: File[]
  onAdd: (f: File) => void
  onRemove: (idx: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const MAX = 3

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const f of files) {
      if (photos.length >= MAX) break
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        alert('Only JPG, PNG and WebP images are accepted.')
        continue
      }
      if (f.size > 5 * 1024 * 1024) {
        alert(`${f.name} exceeds the 5 MB limit.`)
        continue
      }
      onAdd(f)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn(
      'rounded-xl border px-4 py-3.5 transition-colors',
      photos.length > 0 ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5',
          photos.length > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400',
        )}>
          <ImageIcon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">Device Photos</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Up to {MAX} photos of the physical device and label (JPG, PNG — max 5 MB each). Optional.
          </p>

          {/* Thumbnails */}
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {photos.map((f, idx) => {
                const url = URL.createObjectURL(f)
                return (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={f.name}
                      onLoad={() => URL.revokeObjectURL(url)}
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleChange}
        />

        {photos.length < MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0 mt-0.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Add photo
          </button>
        )}
      </div>
    </div>
  )
}

function Step3({
  docs,
  photos,
  onDocUpload,
  onPhotoAdd,
  onPhotoRemove,
}: {
  docs: Record<string, File | null>
  photos: File[]
  onDocUpload: (id: string, f: File | null) => void
  onPhotoAdd: (f: File) => void
  onPhotoRemove: (idx: number) => void
}) {
  const requiredSlots = DOC_SLOTS.filter((s) => s.required)
  const uploadedRequired = requiredSlots.filter((s) => !!docs[s.id]).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Test Results & Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload test results from an accredited laboratory and the manufacturer declaration.
          BOCRA accepts test reports from SABS, ETSI, FCC, CE and other recognised bodies.
        </p>
      </div>

      {/* Upload progress */}
      <div className="flex items-center gap-2 text-sm">
        <span className={cn(
          'font-semibold',
          uploadedRequired === requiredSlots.length ? 'text-emerald-600' : 'text-gray-700',
        )}>
          {uploadedRequired} / {requiredSlots.length}
        </span>
        <span className="text-gray-400">required documents uploaded</span>
        {uploadedRequired === requiredSlots.length && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
      </div>

      <div className="space-y-2.5">
        {DOC_SLOTS.map((slot) => (
          <SingleDocUpload
            key={slot.id}
            slot={slot}
            file={docs[slot.id] ?? null}
            onUpload={(f) => onDocUpload(slot.id, f)}
          />
        ))}
        <PhotoUpload photos={photos} onAdd={onPhotoAdd} onRemove={onPhotoRemove} />
      </div>
    </div>
  )
}

// ─── Step 4 — Review & fee estimate ──────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 mt-0.5">
        {value || <span className="text-gray-300">—</span>}
      </dd>
    </div>
  )
}

function Step4({
  values,
  docs,
  photos,
  accreditationType,
}: {
  values: Partial<FormValues>
  docs: Record<string, File | null>
  photos: File[]
  accreditationType: AccreditationTypeId | undefined
}) {
  const accredLabel = ACCREDITATION_TYPES.find((t) => t.id === accreditationType)?.label

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Fee Estimate</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Review your application details below. Use Back to make corrections.
        </p>
      </div>

      {/* Device summary */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <Smartphone className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Device Details</h3>
        </div>
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <ReviewRow label="Accreditation Type"       value={accredLabel} />
          <ReviewRow label="Brand Name"               value={values.brandName} />
          <ReviewRow label="Model / Marketing Name"   value={values.modelName} />
          <ReviewRow label="SIM-Enabled"              value={values.simEnabled === 'yes' ? 'Yes' : values.simEnabled === 'no' ? 'No' : undefined} />
          <ReviewRow label="Country of Manufacture"   value={values.countryOfManufacture} />
          {values.sampleImei && <ReviewRow label="Sample IMEI" value={values.sampleImei} />}
          {values.techSpec && (
            <div className="sm:col-span-2">
              <ReviewRow label="Technical Specification" value={values.techSpec} />
            </div>
          )}
        </div>
      </div>

      {/* Documents summary */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <FileText className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Documents</h3>
        </div>
        <div className="px-4 py-4 space-y-2">
          {DOC_SLOTS.map((slot) => {
            const uploaded = !!docs[slot.id]
            return (
              <div key={slot.id} className="flex items-center gap-2 text-sm">
                {uploaded
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : <AlertCircle  className={cn('w-3.5 h-3.5 shrink-0', slot.required ? 'text-red-400' : 'text-gray-300')} />
                }
                <span className={cn(
                  uploaded ? 'text-gray-700' : slot.required ? 'text-red-600' : 'text-gray-400',
                )}>
                  {slot.label}
                  {!uploaded && slot.required  && ' — missing'}
                  {!uploaded && !slot.required && ' — not uploaded (optional)'}
                </span>
              </div>
            )
          })}
          <div className="flex items-center gap-2 text-sm mt-1">
            <ImageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-500">
              {photos.length > 0
                ? `${photos.length} device photo${photos.length !== 1 ? 's' : ''} uploaded`
                : 'No device photos (optional)'}
            </span>
          </div>
        </div>
      </div>

      {/* Fee estimate */}
      <div className="rounded-xl border-2 border-[#003580]/20 bg-[#003580]/4 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#003580]/8 border-b border-[#003580]/10">
          <Banknote className="w-4 h-4 text-[#003580]" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#003580]">Fee Estimate</h3>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Type Approval Application Fee</span>
            <span className="font-semibold text-gray-800">P 2,500.00</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">VAT (14%)</span>
            <span className="font-semibold text-gray-800">P 350.00</span>
          </div>
          <div className="h-px bg-[#003580]/15" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Total Estimated Amount</span>
            <span className="text-lg font-bold text-[#003580]">P 2,850.00</span>
          </div>

          <div className="flex items-start gap-2 mt-3 rounded-lg bg-white/60 border border-[#003580]/10 px-3 py-2.5">
            <Info className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              An invoice will be generated automatically upon submission. Payment is required before
              the Type Approval Certificate can be issued. You may pay via EFT, bank deposit or at
              the BOCRA offices. Quote your application number on all payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5 — Declaration & submit ───────────────────────────────────────────

function Step5({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, formState: { errors } } = form
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Declaration & Submission</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Read and accept the declaration below, then submit your application.
        </p>
      </div>

      <div className={cn(
        'rounded-xl border px-4 py-4 space-y-3',
        errors.declaration ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-gray-50/60',
      )}>
        <p className="text-xs text-gray-600 leading-relaxed">
          I/We, the undersigned, declare that:
        </p>
        <ul className="text-xs text-gray-600 space-y-1.5 list-none pl-0">
          {[
            'All information and documents submitted in this application are true, accurate and complete.',
            'The device described has been tested in accordance with applicable technical standards and the test reports submitted are genuine.',
            'I/We accept that BOCRA may inspect the device and conduct independent testing at any time.',
            'I/We understand that submitting false or misleading information may result in rejection and/or regulatory action under the Communications Regulatory Authority Act (Cap. 72:05).',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#003580]/10 text-[#003580] text-[10px] font-bold">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>

        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input
            {...register('declaration')}
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#003580] focus:ring-[#003580]/30"
          />
          <span className="text-sm font-medium text-gray-700">
            I confirm that all information provided is accurate and I accept the terms of this declaration.
          </span>
        </label>
        <FieldError message={errors.declaration?.message} />
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ appNumber }: { appNumber: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900">Application Submitted</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your type approval application has been received. An invoice will be sent to your
          registered email. Processing typically takes 15–20 business days after payment.
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 space-y-1">
        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Application Reference</p>
        <p className="text-2xl font-bold text-emerald-700 font-mono">{appNumber}</p>
        <p className="text-xs text-emerald-600">Quote this number on all correspondence and payments</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/dashboard/type-approval"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#003580] text-white text-sm font-semibold hover:bg-[#002a6b] transition-colors shadow-sm"
        >
          Back to Type Approval
        </Link>
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View Invoice & Pay
        </Link>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeApplicationNumber() {
  const year   = new Date().getFullYear()
  const serial = String(Math.floor(Math.random() * 90000) + 10000)
  return `TA-${year}-${serial}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TypeApprovalApplyPage() {
  const router = useRouter()

  const [step, setStep]         = useState(0)
  const [submitting, setSubmit] = useState(false)
  const [appNumber, setAppNum]  = useState<string | null>(null)

  // Document uploads
  const [docs, setDocs]     = useState<Record<string, File | null>>({})
  const [photos, setPhotos] = useState<File[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      accreditationType: undefined,
      brandName:  '',
      modelName:  '',
      simEnabled: undefined,
      techSpec:   '',
      sampleImei: '',
      countryOfManufacture: '',
      declaration: false,
    },
  })

  const { watch, handleSubmit, trigger, formState: { errors } } = form
  const accreditationType = watch('accreditationType') as AccreditationTypeId | undefined

  // Derive whether current accreditation type allows proceeding
  const accredStatus = accreditationType ? MOCK_ACCREDITATION[accreditationType].status : null
  const canProceedStep1 = accredStatus === 'APPROVED'

  const handleNext = async () => {
    const fields = STEP_FIELDS[step]
    if (fields.length > 0) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    if (step === 0 && !canProceedStep1) return
    setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const onSubmit = async (_vals: FormValues) => {
    setSubmit(true)
    // TODO: POST /api/type-approval/applications
    await new Promise((r) => setTimeout(r, 1300))
    setAppNum(makeApplicationNumber())
    setSubmit(false)
  }

  if (appNumber) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <SuccessScreen appNumber={appNumber} />
        </div>
      </div>
    )
  }

  const allValues = watch()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/type-approval"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Type Approval
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Apply for Type Approval</h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit a type approval application for radio or terminal equipment to be sold or used in Botswana.
        </p>
      </div>

      {/* Step indicator */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 shadow-sm">
        <StepIndicator current={step} />
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {step === 0 && (
            <Step1
              value={accreditationType}
              onChange={(v) => form.setValue('accreditationType', v, { shouldValidate: true })}
              error={errors.accreditationType?.message}
            />
          )}
          {step === 1 && <Step2 form={form} />}
          {step === 2 && (
            <Step3
              docs={docs}
              photos={photos}
              onDocUpload={(id, f) => setDocs((p) => ({ ...p, [id]: f }))}
              onPhotoAdd={(f) => setPhotos((p) => [...p, f])}
              onPhotoRemove={(idx) => setPhotos((p) => p.filter((_, i) => i !== idx))}
            />
          )}
          {step === 3 && (
            <Step4
              values={allValues}
              docs={docs}
              photos={photos}
              accreditationType={accreditationType}
            />
          )}
          {step === 4 && <Step5 form={form} />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={step === 0 ? () => router.push('/dashboard/type-approval') : handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 0 && (!accreditationType || !canProceedStep1)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm',
                  'bg-[#003580] text-white hover:bg-[#002a6b]',
                  'disabled:opacity-40 disabled:pointer-events-none',
                )}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#003580] text-white text-sm font-semibold hover:bg-[#002a6b] transition-colors shadow-sm disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" />Submit Application</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
