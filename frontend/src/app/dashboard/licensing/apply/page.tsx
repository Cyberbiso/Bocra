'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Radio,
  Wifi,
  Tv2,
  PhoneCall,
  ShieldCheck,
  FileQuestion,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  User,
  MapPin,
  CalendarDays,
  FileText,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'broadcasting' as const,
    label: 'Broadcasting',
    description: 'FM Radio, TV and community broadcasting licences',
    icon: Tv2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selectedBorder: 'border-purple-500',
    selectedBg: 'bg-purple-50',
  },
  {
    id: 'telecommunications' as const,
    label: 'Telecommunications',
    description: 'ECN, ECS, VSAT and fixed-line network licences',
    icon: PhoneCall,
    color: 'text-[#003580]',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selectedBorder: 'border-[#003580]',
    selectedBg: 'bg-blue-50',
  },
  {
    id: 'internet_services' as const,
    label: 'Internet Services',
    description: 'ISP and data service provider authorisations',
    icon: Wifi,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    selectedBorder: 'border-emerald-500',
    selectedBg: 'bg-emerald-50',
  },
  {
    id: 'spectrum_radio' as const,
    label: 'Spectrum / Radio',
    description: 'Spectrum authorisations and amateur radio licences',
    icon: Radio,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    selectedBorder: 'border-orange-500',
    selectedBg: 'bg-orange-50',
  },
  {
    id: 'type_approval' as const,
    label: 'Type Approval',
    description: 'Approval for radio and terminal equipment',
    icon: ShieldCheck,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    selectedBorder: 'border-teal-500',
    selectedBg: 'bg-teal-50',
  },
  {
    id: 'other' as const,
    label: 'Other',
    description: 'Postal operator, courier and other regulatory licences',
    icon: FileQuestion,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    selectedBorder: 'border-gray-500',
    selectedBg: 'bg-gray-100',
  },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

const LICENCE_TYPES: Record<CategoryId, string[]> = {
  broadcasting: [
    'FM Radio Broadcasting Licence',
    'TV Broadcasting Licence',
    'Community Broadcasting Licence',
    'Subscription Broadcasting Licence',
    'Signal Distribution Licence',
  ],
  telecommunications: [
    'Electronic Communications Network (ECN) Licence',
    'Electronic Communications Service (ECS) Licence',
    'VSAT Terminal Licence',
    'Reseller Authorisation',
    'Satellite Earth Station Licence',
  ],
  internet_services: [
    'Internet Service Provider (ISP) Licence',
    'Data Service Provider Licence',
    'Content Service Provider Licence',
    'Managed Data Network Licence',
  ],
  spectrum_radio: [
    'Spectrum Authorisation — Fixed Service',
    'Spectrum Authorisation — Mobile Service',
    'Spectrum Authorisation — 5G',
    'Amateur Radio Licence — Foundation',
    'Amateur Radio Licence — Full',
    'Fixed Satellite Service Licence',
    'Maritime Radio Licence',
    'Aeronautical Station Licence',
  ],
  type_approval: [
    'Type Approval — Radio Equipment',
    'Type Approval — Terminal Equipment',
    'Type Approval — Wireless Router / Access Point',
    'Type Approval — Mobile Handset',
    'Type Approval — IoT / M2M Device',
  ],
  other: [
    'Postal Operator Licence',
    'Courier Service Licence',
    'Electronic Payment Service Authorisation',
    'Numbering Resource Allocation',
  ],
}

const COVERAGE_AREAS = [
  'Nationwide',
  'South-East (Gaborone)',
  'North-East (Francistown)',
  'North-West (Maun)',
  'Central (Serowe / Palapye)',
  'South (Lobatse)',
  'Kgalagadi (Tsabong)',
  'Chobe (Kasane)',
  'Okavango Delta',
]

const SECTORS = [
  'Telecommunications',
  'Broadcasting',
  'Information Technology',
  'Finance & Banking',
  'Government',
  'Education',
  'Healthcare',
  'Mining & Resources',
  'Retail & Commerce',
  'Other',
]

const REQUIRED_DOCS: Record<CategoryId, { id: string; name: string; required: boolean }[]> = {
  broadcasting: [
    { id: 'cert_inc',   name: 'Certificate of Incorporation',           required: true  },
    { id: 'tax_clear',  name: 'Tax Clearance Certificate',              required: true  },
    { id: 'tech_spec',  name: 'Technical Specifications / Equipment List', required: true  },
    { id: 'content_pol',name: 'Content / Editorial Policy',             required: true  },
    { id: 'fin_plan',   name: 'Financial Projections (3 years)',        required: false },
  ],
  telecommunications: [
    { id: 'cert_inc',   name: 'Certificate of Incorporation',           required: true  },
    { id: 'tax_clear',  name: 'Tax Clearance Certificate',              required: true  },
    { id: 'net_arch',   name: 'Network Architecture Plan',              required: true  },
    { id: 'fin_stmt',   name: 'Audited Financial Statements',           required: true  },
    { id: 'rollout',    name: 'Network Rollout / Coverage Plan',        required: false },
  ],
  internet_services: [
    { id: 'cert_inc',   name: 'Certificate of Incorporation',           required: true  },
    { id: 'tax_clear',  name: 'Tax Clearance Certificate',              required: true  },
    { id: 'tech_spec',  name: 'Technical Specifications',               required: true  },
    { id: 'sla_doc',    name: 'Service Level Agreement (template)',     required: false },
  ],
  spectrum_radio: [
    { id: 'cert_inc',   name: 'Certificate of Incorporation',           required: true  },
    { id: 'freq_plan',  name: 'Frequency Plan / Coordination Request',  required: true  },
    { id: 'equip_spec', name: 'Equipment Technical Specification Sheet',required: true  },
    { id: 'site_plan',  name: 'Site / Installation Plan',               required: false },
  ],
  type_approval: [
    { id: 'cert_inc',   name: 'Certificate of Incorporation',           required: true  },
    { id: 'test_report',name: 'Accredited Test Laboratory Report',      required: true  },
    { id: 'equip_data', name: 'Equipment Datasheet / User Manual',      required: true  },
    { id: 'decl_conf',  name: 'Declaration of Conformity',              required: true  },
    { id: 'auth_letter',name: 'Manufacturer Authorisation Letter',      required: false },
  ],
  other: [
    { id: 'cert_inc',   name: 'Certificate of Incorporation',           required: true  },
    { id: 'tax_clear',  name: 'Tax Clearance Certificate',              required: true  },
    { id: 'biz_plan',   name: 'Business Plan',                          required: true  },
  ],
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Category',     shortLabel: '1' },
  { label: 'Organisation', shortLabel: '2' },
  { label: 'Licence',      shortLabel: '3' },
  { label: 'Documents',    shortLabel: '4' },
  { label: 'Review',       shortLabel: '5' },
]

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  // Step 1
  category: z.enum(
    ['broadcasting', 'telecommunications', 'internet_services', 'spectrum_radio', 'type_approval', 'other'],
    { error: 'Please select a licence category' },
  ),

  // Step 2
  orgName:            z.string().min(2, 'Organisation name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  taxNumber:          z.string().optional(),
  sector:             z.string().min(1, 'Please select a sector'),
  contactName:        z.string().min(2, 'Contact name is required'),
  contactEmail:       z.string().email('Invalid email address'),
  contactPhone:       z.string().min(7, 'Phone number is required'),
  address:            z.string().min(5, 'Registered address is required'),

  // Step 3
  licenceType:        z.string().min(1, 'Please select a licence type'),
  requestedStartDate: z.string().min(1, 'Requested start date is required'),
  coverageArea:       z.string().min(1, 'Please select a coverage area'),
  technicalDetails:   z.string().optional(),
  equipment: z.array(z.object({
    make:   z.string(),
    model:  z.string(),
    serial: z.string(),
  })).optional(),

  // Step 5
  declaration: z.boolean().refine((v) => v === true, {
    message: 'You must accept the declaration to submit',
  }),
})

type FormValues = z.infer<typeof schema>

const STEP_FIELDS: (keyof FormValues)[][] = [
  ['category'],
  ['orgName', 'registrationNumber', 'sector', 'contactName', 'contactEmail', 'contactPhone', 'address'],
  ['licenceType', 'requestedStartDate', 'coverageArea'],
  [],
  ['declaration'],
]

// ─── Field / label primitives ─────────────────────────────────────────────────

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

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
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
      {/* Step dots */}
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const done    = idx < current
          const active  = idx === current
          const pending = idx > current

          return (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-all',
                  done    && 'bg-[#003580] border-[#003580] text-white',
                  active  && 'bg-white border-[#003580] text-[#003580] shadow-sm',
                  pending && 'bg-white border-gray-200 text-gray-400',
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              {/* Label (hidden on small screens) */}
              <span
                className={cn(
                  'hidden sm:block ml-2 text-xs font-medium whitespace-nowrap',
                  active  && 'text-[#003580]',
                  done    && 'text-gray-500',
                  pending && 'text-gray-300',
                )}
              >
                {step.label}
              </span>
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors',
                    idx < current ? 'bg-[#003580]' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
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

// ─── Step 1 — Category selection ──────────────────────────────────────────────

function Step1({
  value,
  onChange,
}: {
  value: CategoryId | undefined
  onChange: (v: CategoryId) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Select Licence Category</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose the regulatory category that best describes your application.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const selected = value === cat.id
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className={cn(
                'group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                'hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30',
                selected
                  ? `${cat.selectedBorder} ${cat.selectedBg} shadow-sm`
                  : `${cat.border} bg-white hover:border-gray-300`,
              )}
            >
              {/* Selected checkmark */}
              {selected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#003580] text-white">
                  <Check className="w-3 h-3" />
                </span>
              )}

              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', cat.bg)}>
                <Icon className={cn('w-5 h-5', cat.color)} />
              </div>

              <div>
                <p className={cn('text-sm font-semibold', selected ? 'text-gray-900' : 'text-gray-800')}>
                  {cat.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{cat.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2 — Organisation & contact ──────────────────────────────────────────

function Step2({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Organisation & Applicant Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Provide details about your organisation and primary contact person.
        </p>
      </div>

      {/* Organisation */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 w-full">
          <Building2 className="w-4 h-4 text-gray-400" />
          Organisation Information
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Organisation Name</Label>
            <Input
              {...register('orgName')}
              placeholder="e.g. Acme Telecoms (Pty) Ltd"
            />
            <FieldError message={errors.orgName?.message} />
          </div>

          <div>
            <Label required>Registration Number</Label>
            <Input
              {...register('registrationNumber')}
              placeholder="e.g. BW0000001234"
            />
            <FieldError message={errors.registrationNumber?.message} />
          </div>

          <div>
            <Label>Tax Identification Number</Label>
            <Input
              {...register('taxNumber')}
              placeholder="e.g. C000012345678"
            />
            <FieldError message={errors.taxNumber?.message} />
          </div>

          <div>
            <Label required>Primary Business Sector</Label>
            <Select {...register('sector')}>
              <option value="">Select sector…</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <FieldError message={errors.sector?.message} />
          </div>
        </div>
      </fieldset>

      {/* Contact */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 w-full">
          <User className="w-4 h-4 text-gray-400" />
          Primary Contact
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Full Name</Label>
            <Input
              {...register('contactName')}
              placeholder="e.g. Kabo Mosweu"
            />
            <FieldError message={errors.contactName?.message} />
          </div>

          <div>
            <Label required>Email Address</Label>
            <Input
              {...register('contactEmail')}
              type="email"
              placeholder="e.g. licensing@company.co.bw"
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>

          <div>
            <Label required>Phone Number</Label>
            <Input
              {...register('contactPhone')}
              type="tel"
              placeholder="e.g. +267 395 0000"
            />
            <FieldError message={errors.contactPhone?.message} />
          </div>
        </div>
      </fieldset>

      {/* Address */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 w-full">
          <MapPin className="w-4 h-4 text-gray-400" />
          Registered Address
        </legend>

        <div>
          <Label required>Full Registered Address</Label>
          <Textarea
            {...register('address')}
            rows={3}
            placeholder="Plot number, street, town/city, district, Botswana"
          />
          <FieldError message={errors.address?.message} />
        </div>
      </fieldset>
    </div>
  )
}

// ─── Step 3 — Licence details ─────────────────────────────────────────────────

function Step3({
  form,
  category,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  category: CategoryId | undefined
}) {
  const { register, control, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'equipment' })
  const licenceTypes = category ? LICENCE_TYPES[category] : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Licence Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Specify the type of licence, coverage and any technical requirements.
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 w-full">
          <FileText className="w-4 h-4 text-gray-400" />
          Licence Information
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label required>Requested Licence Type</Label>
            <Select {...register('licenceType')}>
              <option value="">Select licence type…</option>
              {licenceTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <FieldError message={errors.licenceType?.message} />
          </div>

          <div>
            <Label required>Requested Start Date</Label>
            <Input
              {...register('requestedStartDate')}
              type="date"
              min={new Date().toISOString().slice(0, 10)}
            />
            <FieldError message={errors.requestedStartDate?.message} />
          </div>

          <div>
            <Label required>Coverage Area / Region</Label>
            <Select {...register('coverageArea')}>
              <option value="">Select coverage area…</option>
              {COVERAGE_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
            <FieldError message={errors.coverageArea?.message} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 w-full">
          <Settings className="w-4 h-4 text-gray-400" />
          Technical Information
          <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
        </legend>

        <div>
          <Label>Technical Details</Label>
          <Textarea
            {...register('technicalDetails')}
            rows={4}
            placeholder="Describe any technical specifications, frequency requirements, network topology, or additional details relevant to your application…"
          />
        </div>
      </fieldset>

      {/* Equipment table */}
      <fieldset className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <legend className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            Equipment List
            <span className="text-xs font-normal text-gray-400">(optional)</span>
          </legend>
          <button
            type="button"
            onClick={() => append({ make: '', model: '', serial: '' })}
            className="flex items-center gap-1 text-xs font-medium text-[#003580] hover:text-[#002a6b] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add equipment
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No equipment added. Click "Add equipment" to list your devices.</p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1">
              {['Make / Brand', 'Model', 'Serial Number', ''].map((h) => (
                <span key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                <div>
                  <label className="sm:hidden text-xs text-gray-400 mb-0.5 block">Make / Brand</label>
                  <Controller
                    control={control}
                    name={`equipment.${idx}.make`}
                    render={({ field }) => (
                      <Input {...field} placeholder="e.g. Ericsson" />
                    )}
                  />
                </div>
                <div>
                  <label className="sm:hidden text-xs text-gray-400 mb-0.5 block">Model</label>
                  <Controller
                    control={control}
                    name={`equipment.${idx}.model`}
                    render={({ field }) => (
                      <Input {...field} placeholder="e.g. AIR 6449" />
                    )}
                  />
                </div>
                <div>
                  <label className="sm:hidden text-xs text-gray-400 mb-0.5 block">Serial Number</label>
                  <Controller
                    control={control}
                    name={`equipment.${idx}.serial`}
                    render={({ field }) => (
                      <Input {...field} placeholder="e.g. SN0012345" />
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="mt-0 sm:mt-0 h-10 w-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                  title="Remove row"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  )
}

// ─── Step 4 — Document upload ─────────────────────────────────────────────────

function Step4({
  category,
  uploads,
  onUpload,
}: {
  category: CategoryId | undefined
  uploads: Record<string, File | null>
  onUpload: (docId: string, file: File | null) => void
}) {
  const docs = category ? REQUIRED_DOCS[category] : []
  const allRequired = docs.filter((d) => d.required)
  const uploadedCount = allRequired.filter((d) => !!uploads[d.id]).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Document Upload</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload the required supporting documents for your application.
          Accepted formats: PDF, JPG, PNG (max 10 MB per file).
        </p>
      </div>

      {/* Upload progress */}
      <div className="flex items-center gap-2 text-sm">
        <span className={cn(
          'font-semibold',
          uploadedCount === allRequired.length ? 'text-emerald-600' : 'text-gray-700',
        )}>
          {uploadedCount} / {allRequired.length}
        </span>
        <span className="text-gray-400">required documents uploaded</span>
        {uploadedCount === allRequired.length && allRequired.length > 0 && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
      </div>

      <div className="space-y-2">
        {docs.map((doc) => {
          const file = uploads[doc.id] ?? null
          return (
            <DocUploadRow
              key={doc.id}
              doc={doc}
              file={file}
              onUpload={(f) => onUpload(doc.id, f)}
            />
          )
        })}
      </div>
    </div>
  )
}

function DocUploadRow({
  doc,
  file,
  onUpload,
}: {
  doc: { id: string; name: string; required: boolean }
  file: File | null
  onUpload: (f: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f) {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png']
      if (!allowed.includes(f.type)) {
        alert('Invalid file type. Please upload a PDF, JPG or PNG.')
        return
      }
      if (f.size > 10 * 1024 * 1024) {
        alert('File exceeds 10 MB limit.')
        return
      }
    }
    onUpload(f)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
        file ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-white',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          file ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400',
        )}
      >
        {file ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
        {file ? (
          <p className="text-xs text-emerald-600 mt-0.5 truncate">
            {file.name} &middot; {(file.size / 1024).toFixed(0)} KB
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">
            {doc.required ? 'Required' : 'Optional'}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex items-center gap-2 shrink-0">
        {file && (
          <button
            type="button"
            onClick={() => {
              onUpload(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
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

// ─── Step 5 — Review & submit ─────────────────────────────────────────────────

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <Icon className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      </div>
      <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  )
}

function Step5({
  form,
  category,
  uploads,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  category: CategoryId | undefined
  uploads: Record<string, File | null>
}) {
  const { register, formState: { errors }, watch } = form
  const values = watch()
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label ?? '—'
  const docs = category ? REQUIRED_DOCS[category] : []
  const uploadedCount = docs.filter((d) => !!uploads[d.id]).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Please review all information before submitting. Use the Back button to make changes.
        </p>
      </div>

      <ReviewSection title="Licence Category" icon={ShieldCheck}>
        <ReviewField label="Selected Category" value={catLabel} />
        <ReviewField label="Licence Type" value={values.licenceType} />
      </ReviewSection>

      <ReviewSection title="Organisation" icon={Building2}>
        <ReviewField label="Organisation Name"     value={values.orgName} />
        <ReviewField label="Registration Number"   value={values.registrationNumber} />
        <ReviewField label="Tax Number"            value={values.taxNumber} />
        <ReviewField label="Business Sector"       value={values.sector} />
      </ReviewSection>

      <ReviewSection title="Primary Contact" icon={User}>
        <ReviewField label="Contact Name"  value={values.contactName} />
        <ReviewField label="Email"         value={values.contactEmail} />
        <ReviewField label="Phone"         value={values.contactPhone} />
        <div className="sm:col-span-2">
          <ReviewField label="Registered Address" value={values.address} />
        </div>
      </ReviewSection>

      <ReviewSection title="Licence Details" icon={FileText}>
        <ReviewField label="Requested Start Date" value={values.requestedStartDate} />
        <ReviewField label="Coverage Area"        value={values.coverageArea} />
        {values.technicalDetails && (
          <div className="sm:col-span-2">
            <ReviewField label="Technical Details" value={values.technicalDetails} />
          </div>
        )}
        {(values.equipment ?? []).length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-400 mb-1">Equipment</dt>
            <dd className="space-y-1">
              {(values.equipment ?? []).map((eq, i) => (
                <span key={i} className="block text-sm text-gray-800">
                  {eq.make} {eq.model}{eq.serial ? ` (${eq.serial})` : ''}
                </span>
              ))}
            </dd>
          </div>
        )}
      </ReviewSection>

      <ReviewSection title="Documents" icon={Upload}>
        <div className="sm:col-span-2 space-y-1.5">
          {docs.length === 0 ? (
            <p className="text-sm text-gray-400">No documents required.</p>
          ) : (
            docs.map((doc) => {
              const uploaded = !!uploads[doc.id]
              return (
                <div key={doc.id} className="flex items-center gap-2 text-sm">
                  {uploaded
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <AlertCircle className={cn('w-3.5 h-3.5 shrink-0', doc.required ? 'text-red-400' : 'text-gray-300')} />
                  }
                  <span className={cn(uploaded ? 'text-gray-700' : doc.required ? 'text-red-600' : 'text-gray-400')}>
                    {doc.name}
                    {!uploaded && doc.required && ' (missing)'}
                    {!uploaded && !doc.required && ' (optional)'}
                  </span>
                </div>
              )
            })
          )}
          <p className="text-xs text-gray-400 pt-1">
            {uploadedCount} of {docs.length} document{docs.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
      </ReviewSection>

      {/* Declaration */}
      <div className={cn(
        'rounded-xl border px-4 py-4 space-y-3',
        errors.declaration ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-gray-50/60',
      )}>
        <p className="text-xs text-gray-600 leading-relaxed">
          I/We, the undersigned, declare that all information provided in this application is true and
          accurate to the best of my/our knowledge. I/We understand that providing false or misleading
          information may result in rejection of this application and/or regulatory action under the
          Communications Regulatory Authority Act (Cap. 72:05).
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            {...register('declaration')}
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#003580] focus:ring-[#003580]/30 accent-[#003580]"
          />
          <span className="text-sm font-medium text-gray-700">
            I confirm that the information provided is accurate and I accept the terms of this declaration.
          </span>
        </label>
        <FieldError message={errors.declaration?.message} />
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ applicationNumber }: { applicationNumber: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900">Application Submitted</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your licence application has been received by BOCRA. You will be notified by email
          once your application is under review.
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 space-y-1">
        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Application Reference</p>
        <p className="text-2xl font-bold text-emerald-700 font-mono">{applicationNumber}</p>
        <p className="text-xs text-emerald-600">Keep this number for your records</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/dashboard/licensing"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#003580] text-white text-sm font-semibold hover:bg-[#002a6b] transition-colors shadow-sm"
        >
          Back to Licensing
        </Link>
        <Link
          href="/dashboard/complaints"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View All Applications
        </Link>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createApplicationNumber(): string {
  const year   = new Date().getFullYear()
  const serial = String(Math.floor(Math.random() * 90000) + 10000)
  return `APP-${year}-${serial}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LicenceApplicationPage() {
  const router = useRouter()
  const [step, setStep]           = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [appNumber, setAppNumber]   = useState<string | null>(null)
  const [uploads, setUploads]       = useState<Record<string, File | null>>({})

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      category: undefined,
      orgName: '',
      registrationNumber: '',
      taxNumber: '',
      sector: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      licenceType: '',
      requestedStartDate: '',
      coverageArea: '',
      technicalDetails: '',
      equipment: [],
      declaration: false,
    },
  })

  const { watch, handleSubmit, trigger } = form
  const category = watch('category') as CategoryId | undefined

  const handleUpload = (docId: string, file: File | null) => {
    setUploads((prev) => ({ ...prev, [docId]: file }))
  }

  const handleNext = async () => {
    const fields = STEP_FIELDS[step]
    if (fields.length > 0) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    // Step 1: must have a category selected
    if (step === 0 && !category) return
    setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const onSubmit = async (_values: FormValues) => {
    setSubmitting(true)
    // TODO: POST /api/licence-applications
    await new Promise((r) => setTimeout(r, 1200))
    const ref = createApplicationNumber()
    setAppNumber(ref)
    setSubmitting(false)
  }

  // Success state
  if (appNumber) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <SuccessScreen applicationNumber={appNumber} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/licensing"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Licensing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Apply for New Licence</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete all steps to submit your licence application to BOCRA.
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
              value={category}
              onChange={(v) => form.setValue('category', v, { shouldValidate: true })}
            />
          )}
          {step === 1 && <Step2 form={form} />}
          {step === 2 && <Step3 form={form} category={category} />}
          {step === 3 && (
            <Step4 category={category} uploads={uploads} onUpload={handleUpload} />
          )}
          {step === 4 && (
            <Step5 form={form} category={category} uploads={uploads} />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={step === 0 ? () => router.push('/dashboard/licensing') : handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 0 && !category}
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
