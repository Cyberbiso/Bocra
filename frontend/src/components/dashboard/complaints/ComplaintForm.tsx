'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Upload,
  X,
  FileText,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatComplaintFileSize } from '@/lib/complaints'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  reportedToProvider: z.enum(['yes', 'no'], {
    error: 'Please indicate if you reported to your provider first',
  }),
  operator:  z.string().min(1, 'Please select an operator'),
  category:  z.string().min(1, 'Please select a category'),
  subject:   z.string().min(1, 'Subject is required').max(150, 'Maximum 150 characters'),
  location:  z.string().min(1, 'Location is required'),
  description: z.string().min(50, 'Please provide at least 50 characters'),
  providerCaseNumber: z.string().optional(),
  confirmed: z.boolean().refine((v) => v === true, {
    message: 'You must confirm this information is accurate before submitting',
  }),
})

type FormValues = z.infer<typeof schema>

// ─── Config ───────────────────────────────────────────────────────────────────

const STEP_FIELDS: (keyof FormValues)[][] = [
  ['reportedToProvider', 'operator', 'category', 'subject', 'location'],
  ['description'],
  ['confirmed'],
]

const STEP_LABELS = [
  'About Your Complaint',
  'Details & Evidence',
  'Review & Submit',
]

const OPERATORS = [
  'Mascom Wireless',
  'Orange Botswana',
  'BTC Broadband',
  'Botswana Postal Services',
  'Other',
]

const CATEGORIES = [
  'Network Quality',
  'Billing Dispute',
  'Service Outage',
  'Consumer Rights',
  'Other',
]

const MAX_FILES      = 5
const MAX_FILE_SIZE  = 10 * 1024 * 1024
const ACCEPTED_MIME  = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const ACCEPTED_EXT   = ['.pdf', '.jpg', '.jpeg', '.png']

function isValidFileType(f: File) {
  return (
    ACCEPTED_MIME.has(f.type) ||
    ACCEPTED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext))
  )
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>
}

const inputCls = (hasError?: boolean) =>
  cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:border-[#003580]/40 transition-colors',
    hasError
      ? 'border-red-300 focus:ring-red-200'
      : 'border-gray-200 focus:ring-[#003580]/20'
  )

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                i < step
                  ? 'bg-[#003580] border-[#003580] text-white'
                  : i === step
                  ? 'bg-[#003580] border-[#003580] text-white shadow-md'
                  : 'bg-white border-gray-300 text-gray-400'
              )}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'mt-1.5 text-[11px] font-medium text-center w-24 leading-tight',
                i <= step ? 'text-[#003580]' : 'text-gray-400'
              )}
            >
              {label}
            </span>
          </div>

          {/* Connector line */}
          {i < STEP_LABELS.length - 1 && (
            <div
              className={cn(
                'w-16 h-0.5 mx-1 mb-5 transition-colors',
                i < step ? 'bg-[#003580]' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── File upload ──────────────────────────────────────────────────────────────

interface FileUploadProps {
  files: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  error?: string
}

function FileUpload({ files, onAdd, onRemove, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAdd(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleChange}
        className="hidden"
      />

      {/* Drop zone / trigger */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= MAX_FILES}
        className={cn(
          'w-full rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          files.length >= MAX_FILES
            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
            : 'border-gray-200 hover:border-[#003580]/40 hover:bg-blue-50/30 cursor-pointer',
          error && 'border-red-300'
        )}
      >
        <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
        <p className="text-sm text-gray-600 font-medium">
          {files.length >= MAX_FILES ? 'Maximum files reached' : 'Click to upload files'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          PDF, JPG, PNG — up to {MAX_FILES} files, 10 MB each
        </p>
      </button>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
            >
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="flex-1 truncate text-gray-700 text-xs">{f.name}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {formatComplaintFileSize(f.size)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                aria-label={`Remove ${f.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, watch, formState: { errors } } = form
  const reported = watch('reportedToProvider')
  const subject  = watch('subject') ?? ''

  return (
    <div className="space-y-5">

      {/* Reported to provider */}
      <div>
        <FieldLabel required>
          Was this issue reported to your provider first?
        </FieldLabel>
        <div className="flex gap-6 mt-1">
          {(['yes', 'no'] as const).map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={val}
                {...register('reportedToProvider')}
                className="accent-[#003580] w-4 h-4"
              />
              <span className="text-sm text-gray-700 capitalize">{val}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.reportedToProvider?.message} />

        {reported === 'no' && (
          <div className="mt-3 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>BOCRA requires provider-first escalation.</strong> Please contact your service
              provider to log the complaint and allow them a reasonable opportunity to resolve it before
              filing with BOCRA. You may still proceed, but BOCRA may refer your complaint back to the
              provider if this step is not taken.
            </p>
          </div>
        )}
      </div>

      {/* Operator */}
      <div>
        <FieldLabel htmlFor="operator" required>Provider / Operator</FieldLabel>
        <select
          id="operator"
          {...register('operator')}
          className={inputCls(!!errors.operator)}
        >
          <option value="">Select an operator…</option>
          {OPERATORS.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        <FieldError message={errors.operator?.message} />
      </div>

      {/* Category */}
      <div>
        <FieldLabel htmlFor="category" required>Complaint Category</FieldLabel>
        <select
          id="category"
          {...register('category')}
          className={inputCls(!!errors.category)}
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <FieldError message={errors.category?.message} />
      </div>

      {/* Subject */}
      <div>
        <FieldLabel htmlFor="subject" required>Subject</FieldLabel>
        <input
          id="subject"
          type="text"
          maxLength={150}
          placeholder="Briefly describe the issue…"
          {...register('subject')}
          className={inputCls(!!errors.subject)}
        />
        <div className="flex justify-between mt-1">
          <FieldError message={errors.subject?.message} />
          <span className={cn('text-xs ml-auto', subject.length > 130 ? 'text-amber-600' : 'text-gray-400')}>
            {subject.length}/150
          </span>
        </div>
      </div>

      {/* Location */}
      <div>
        <FieldLabel htmlFor="location" required>Location</FieldLabel>
        <input
          id="location"
          type="text"
          placeholder="e.g. Gaborone West, Plot 1234"
          {...register('location')}
          className={inputCls(!!errors.location)}
        />
        <FieldError message={errors.location?.message} />
      </div>
    </div>
  )
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  form,
  files,
  onAddFiles,
  onRemoveFile,
  fileError,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  files: File[]
  onAddFiles: (files: File[]) => void
  onRemoveFile: (i: number) => void
  fileError: string
}) {
  const { register, watch, formState: { errors } } = form
  const description = watch('description') ?? ''

  return (
    <div className="space-y-5">

      {/* Description */}
      <div>
        <FieldLabel htmlFor="description" required>Full description of your complaint</FieldLabel>
        <textarea
          id="description"
          rows={5}
          placeholder="Describe the issue in detail — what happened, when it started, and what impact it has had…"
          {...register('description')}
          className={cn(inputCls(!!errors.description), 'resize-none leading-relaxed')}
        />
        <div className="flex justify-between mt-1">
          <FieldError message={errors.description?.message} />
          <span
            className={cn(
              'text-xs ml-auto',
              description.length < 50 ? 'text-gray-400' : 'text-emerald-600'
            )}
          >
            {description.length} chars {description.length < 50 && `(min 50)`}
          </span>
        </div>
      </div>

      {/* File upload */}
      <div>
        <FieldLabel>Supporting Documents / Evidence</FieldLabel>
        <FileUpload
          files={files}
          onAdd={onAddFiles}
          onRemove={onRemoveFile}
          error={fileError}
        />
      </div>

      {/* Provider case number */}
      <div>
        <FieldLabel htmlFor="providerCaseNumber">
          Provider reference / case number
          <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
        </FieldLabel>
        <input
          id="providerCaseNumber"
          type="text"
          placeholder="e.g. MAS-2025-12345"
          {...register('providerCaseNumber')}
          className={inputCls()}
        />
      </div>
    </div>
  )
}

// ─── Step 3 (review) ──────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
      <dt className="w-40 shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-gray-800 break-words flex-1">{value || '—'}</dd>
    </div>
  )
}

function Step3({
  form,
  files,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  files: File[]
}) {
  const { register, watch, formState: { errors } } = form
  const values = watch()

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 divide-y divide-gray-100">
          <dl>
            <ReviewRow label="Reported to Provider" value={values.reportedToProvider === 'yes' ? 'Yes' : 'No'} />
            <ReviewRow label="Operator" value={values.operator} />
            <ReviewRow label="Category" value={values.category} />
            <ReviewRow label="Subject" value={values.subject} />
            <ReviewRow label="Location" value={values.location} />
            <ReviewRow label="Description" value={values.description} />
            {values.providerCaseNumber && (
              <ReviewRow label="Provider Ref." value={values.providerCaseNumber} />
            )}
            {files.length > 0 && (
              <ReviewRow
                label="Attachments"
                value={files.map((f) => f.name).join(', ')}
              />
            )}
          </dl>
        </div>
      </div>

      {/* Confirmation */}
      <div>
        <label
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors',
            errors.confirmed ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
          )}
        >
          <input
            type="checkbox"
            {...register('confirmed')}
            className="mt-0.5 accent-[#003580] w-4 h-4 shrink-0"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            I confirm that the information provided in this complaint is accurate and complete to the
            best of my knowledge.
          </span>
        </label>
        <FieldError message={errors.confirmed?.message} />
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  caseNumber,
  onClose,
  onReset,
}: {
  caseNumber: string
  onClose?: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-2 space-y-5">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900">Complaint Submitted</h3>
        <p className="text-sm text-gray-500 mt-1">
          Your complaint has been received and is being reviewed by BOCRA.
        </p>
      </div>

      <div className="w-full rounded-xl bg-[#003580]/5 border border-[#003580]/20 px-5 py-4">
        <p className="text-xs text-gray-500 mb-1">Your case number</p>
        <p className="text-2xl font-mono font-bold text-[#003580] tracking-wider">{caseNumber}</p>
        <p className="text-xs text-gray-400 mt-1">Keep this number to track your complaint</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full">
        <Link
          href="/dashboard/complaints"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6b] transition-colors"
          onClick={onClose}
        >
          Track your complaint
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Submit another
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ComplaintFormProps {
  onClose?: () => void
}

export default function ComplaintForm({ onClose }: ComplaintFormProps) {
  const [step, setStep] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [caseNumber, setCaseNumber] = useState('')
  const [apiError, setApiError] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { confirmed: false },
    mode: 'onBlur',
  })

  const { handleSubmit, trigger, reset } = form

  // ── File handlers ────────────────────────────────────────────────────────

  const handleAddFiles = (incoming: File[]) => {
    setFileError('')
    const errors: string[] = []
    const valid: File[] = []

    for (const f of incoming) {
      if (files.length + valid.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed`)
        break
      }
      if (!isValidFileType(f)) {
        errors.push(`"${f.name}" is not a supported file type (PDF, JPG, PNG only)`)
        continue
      }
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`"${f.name}" exceeds the 10 MB limit`)
        continue
      }
      valid.push(f)
    }

    if (errors.length) setFileError(errors[0])
    if (valid.length) setFiles((prev) => [...prev, ...valid])
  }

  const handleRemoveFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
    setFileError('')
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  // ── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    setSubmitState('loading')
    setApiError('')

    const fd = new FormData()
    fd.append('category', values.category)
    fd.append('operator', values.operator)
    fd.append('subject', values.subject)
    fd.append('description', values.description)
    fd.append('incidentDate', new Date().toISOString().slice(0, 10))
    // TODO: replace placeholders with authenticated user details from session
    fd.append('name', 'Portal User')
    fd.append('email', 'user@bocra.bw')
    fd.append('phone', '0000000000')
    fd.append('consentGiven', 'true')
    if (values.location)            fd.append('location', values.location)
    if (values.reportedToProvider)  fd.append('reportedToProvider', values.reportedToProvider)
    if (values.providerCaseNumber)  fd.append('providerCaseNumber', values.providerCaseNumber)
    files.forEach((f) => fd.append('attachments', f))

    try {
      const res = await fetch('/api/complaints', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setApiError(json.error ?? 'Something went wrong. Please try again.')
        setSubmitState('error')
        return
      }

      setCaseNumber(json.id ?? `BCR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`)
      setSubmitState('success')
    } catch {
      setApiError('Network error. Please check your connection and try again.')
      setSubmitState('error')
    }
  }

  const handleReset = () => {
    reset()
    setFiles([])
    setFileError('')
    setApiError('')
    setStep(0)
    setSubmitState('idle')
    setCaseNumber('')
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (submitState === 'success') {
    return (
      <SuccessScreen caseNumber={caseNumber} onClose={onClose} onReset={handleReset} />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepIndicator step={step} />

      {/* Step content */}
      <div className="min-h-[340px]">
        {step === 0 && <Step1 form={form} />}
        {step === 1 && (
          <Step2
            form={form}
            files={files}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            fileError={fileError}
          />
        )}
        {step === 2 && <Step3 form={form} files={files} />}
      </div>

      {/* API error */}
      {apiError && (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{apiError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
            step === 0
              ? 'border-gray-100 text-gray-300 cursor-not-allowed'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6b] transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitState === 'loading'}
              className="flex items-center gap-2 px-5 py-2 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6b] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitState === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitState === 'loading' ? 'Submitting…' : 'Submit Complaint'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
