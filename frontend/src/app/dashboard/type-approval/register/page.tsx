'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Info,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Paperclip,
  Eye,
  EyeOff,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Zod schema ───────────────────────────────────────────────────────────────

const phoneRegex = /^\+267\d{7,8}$/

const schema = z
  .object({
    // Section 1 — Organisation
    legal_name: z.string().min(1, 'Legal name is required'),
    trading_name: z.string().optional(),
    org_type_code: z.enum(['COMPANY', 'GOVERNMENT', 'NGO', 'PARASTATAL', 'INDIVIDUAL'], {
      error: 'Select an organisation type',
    }),
    registration_number: z.string().min(1, 'Registration number is required'),
    tax_number: z.string().min(1, 'Tax number is required'),
    physical_address: z.string().min(1, 'Physical address is required'),
    postal_address: z.string().optional(),
    website_url: z
      .string()
      .optional()
      .refine((v) => !v || /^https?:\/\/.+/.test(v), 'Must be a valid URL (https://…)'),

    // Section 2 — Primary Contact
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    phone_e164: z
      .string()
      .regex(phoneRegex, 'Must be in format +267XXXXXXXX'),
    national_id: z.string().optional(),
    passport_number: z.string().optional(),
    position: z.string().min(1, 'Position/title is required'),

    // Section 3 — Account
    username: z.string().min(6, 'Username must be at least 6 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirm_password: z.string(),

    // Section 5 — Declaration
    declaration_accurate: z.literal(true, {
      error: 'You must confirm the information is accurate',
    }),
    declaration_terms: z.literal(true, {
      error: 'You must agree to the terms and conditions',
    }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((d) => !!(d.national_id || d.passport_number), {
    message: 'Provide either a National ID or Passport number',
    path: ['national_id'],
  })

type FormValues = z.infer<typeof schema>

// ─── File upload types ────────────────────────────────────────────────────────

interface UploadedFile {
  name: string
  size: number
}

type DocKey =
  | 'cert_incorporation'
  | 'tax_clearance'
  | 'director_id'
  | 'proof_address'
  | 'other'

const DOC_CONFIG: { key: DocKey; label: string; required: boolean }[] = [
  { key: 'cert_incorporation', label: 'Certificate of Incorporation', required: true },
  { key: 'tax_clearance',      label: 'Tax Clearance Certificate',    required: true },
  { key: 'director_id',        label: 'Director / Owner ID',          required: true },
  { key: 'proof_address',      label: 'Proof of Physical Address',    required: true },
  { key: 'other',              label: 'Other Supporting Document',    required: false },
]

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

// ─── Small helpers ────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}

function Label({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-800 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-[#003580] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  )
}

const INPUT_CLS =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-colors'

const SELECT_CLS =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003580]/25 focus:border-[#003580] transition-colors appearance-none'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TypeApprovalRegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const [docs, setDocs] = useState<Partial<Record<DocKey, UploadedFile>>>({})
  const [docErrors, setDocErrors] = useState<Partial<Record<DocKey, string>>>({})
  const fileRefs = useRef<Partial<Record<DocKey, HTMLInputElement>>>({})

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [submitted, setSubmitted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const emailValue = watch('email')

  function handleFileChange(key: DocKey, file: File | null) {
    if (!file) return
    if (!file.type.includes('pdf')) {
      setDocErrors((p) => ({ ...p, [key]: 'Only PDF files are accepted' }))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setDocErrors((p) => ({ ...p, [key]: 'File exceeds 5 MB limit' }))
      return
    }
    setDocErrors((p) => ({ ...p, [key]: undefined }))
    setDocs((p) => ({ ...p, [key]: { name: file.name, size: file.size } }))
  }

  function removeDoc(key: DocKey) {
    setDocs((p) => { const n = { ...p }; delete n[key]; return n })
    if (fileRefs.current[key]) fileRefs.current[key]!.value = ''
  }

  async function onSubmit(data: FormValues) {
    // Validate required documents
    const missingDocs = DOC_CONFIG.filter((d) => d.required && !docs[d.key])
    if (missingDocs.length) {
      const newErrors: Partial<Record<DocKey, string>> = {}
      missingDocs.forEach((d) => { newErrors[d.key] = 'This document is required' })
      setDocErrors(newErrors)
      return
    }

    setSubmitError(null)
    try {
      const res = await fetch('/api/type-approval/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, documents: Object.keys(docs) }),
      })
      const json = await res.json() as { success: boolean; referenceNumber?: string; error?: string }
      if (!json.success) throw new Error(json.error ?? 'Submission failed')
      setReferenceNumber(json.referenceNumber ?? 'TAR-2026-00000')
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-[#003580]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCheck className="w-10 h-10 text-[#003580]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Registration Submitted Successfully
        </h1>
        <p className="text-sm font-medium text-[#003580] mb-6">
          Your reference number is: <span className="font-bold">{referenceNumber}</span>
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 text-left space-y-3 mb-8">
          <p className="text-sm text-gray-700">
            We have sent a verification email to{' '}
            <span className="font-semibold text-gray-900">{emailValue}</span>. Please verify
            your email address to complete your registration.
          </p>
          <p className="text-sm text-gray-700">
            BOCRA will review your application and notify you once your account has been approved.
            This process typically takes <span className="font-medium">3–5 business days</span>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/home"
            className="px-6 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors"
          >
            Return to Home
          </Link>
          <Link
            href="/dashboard/type-approval"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Type Approval Home
          </Link>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Register as a Type Approval Requestor
        </h1>
        <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">
          Complete this form to apply for Type Approval Requestor status. BOCRA will review your
          application and contact you once approved.
        </p>
      </div>

      {/* ── Process steps banner ────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <Info className="w-5 h-5 text-[#003580] shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 flex-1">
          {[
            'Submit registration request',
            'Verify your email address',
            'BOCRA reviews your account',
            'Receive approval notification',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 sm:flex-1">
              <div className="w-5 h-5 rounded-full bg-[#003580] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <span className="text-xs text-gray-700 font-medium">{step}</span>
              {i < 3 && (
                <div className="hidden sm:block flex-1 h-px bg-blue-200 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">

        {/* ── Section 1: Organisation Details ──────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-6">
          <SectionHeading n={1} title="Organisation Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <Label required>Legal Name</Label>
              <input
                {...register('legal_name')}
                placeholder="As registered with CIPA"
                className={cn(INPUT_CLS, errors.legal_name && 'border-red-400')}
              />
              <FieldError msg={errors.legal_name?.message} />
            </div>

            <div>
              <Label>Trading Name</Label>
              <input
                {...register('trading_name')}
                placeholder="If different from legal name"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <Label required>Organisation Type</Label>
              <select
                {...register('org_type_code')}
                className={cn(SELECT_CLS, errors.org_type_code && 'border-red-400')}
              >
                <option value="">Select type…</option>
                <option value="COMPANY">Company</option>
                <option value="GOVERNMENT">Government</option>
                <option value="NGO">NGO</option>
                <option value="PARASTATAL">Parastatal</option>
                <option value="INDIVIDUAL">Individual</option>
              </select>
              <FieldError msg={errors.org_type_code?.message} />
            </div>

            <div>
              <Label required>Registration Number</Label>
              <input
                {...register('registration_number')}
                placeholder="CIPA registration number"
                className={cn(INPUT_CLS, errors.registration_number && 'border-red-400')}
              />
              <FieldError msg={errors.registration_number?.message} />
            </div>

            <div>
              <Label required>Tax Number (TIN)</Label>
              <input
                {...register('tax_number')}
                placeholder="BURS tax identification number"
                className={cn(INPUT_CLS, errors.tax_number && 'border-red-400')}
              />
              <FieldError msg={errors.tax_number?.message} />
            </div>

            <div className="sm:col-span-2">
              <Label required>Physical Address</Label>
              <textarea
                {...register('physical_address')}
                rows={2}
                placeholder="Street address, city, district"
                className={cn(INPUT_CLS, 'resize-none', errors.physical_address && 'border-red-400')}
              />
              <FieldError msg={errors.physical_address?.message} />
            </div>

            <div className="sm:col-span-2">
              <Label>Postal Address</Label>
              <textarea
                {...register('postal_address')}
                rows={2}
                placeholder="P.O. Box or private bag (if different from physical)"
                className={cn(INPUT_CLS, 'resize-none')}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Website URL</Label>
              <input
                {...register('website_url')}
                type="url"
                placeholder="https://www.example.com"
                className={cn(INPUT_CLS, errors.website_url && 'border-red-400')}
              />
              <FieldError msg={errors.website_url?.message} />
            </div>

          </div>
        </div>

        {/* ── Section 2: Primary Contact ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-6">
          <SectionHeading n={2} title="Primary Contact" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <Label required>First Name</Label>
              <input
                {...register('first_name')}
                className={cn(INPUT_CLS, errors.first_name && 'border-red-400')}
              />
              <FieldError msg={errors.first_name?.message} />
            </div>

            <div>
              <Label required>Last Name</Label>
              <input
                {...register('last_name')}
                className={cn(INPUT_CLS, errors.last_name && 'border-red-400')}
              />
              <FieldError msg={errors.last_name?.message} />
            </div>

            <div>
              <Label required>Email Address</Label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@organisation.bw"
                className={cn(INPUT_CLS, errors.email && 'border-red-400')}
              />
              <FieldError msg={errors.email?.message} />
            </div>

            <div>
              <Label required>Phone Number</Label>
              <input
                {...register('phone_e164')}
                placeholder="+26771234567"
                className={cn(INPUT_CLS, errors.phone_e164 && 'border-red-400')}
              />
              <FieldError msg={errors.phone_e164?.message} />
            </div>

            <div>
              <Label>National ID Number</Label>
              <input
                {...register('national_id')}
                placeholder="Omang number"
                className={cn(INPUT_CLS, errors.national_id && 'border-red-400')}
              />
              <FieldError msg={errors.national_id?.message} />
            </div>

            <div>
              <Label>Passport Number</Label>
              <input
                {...register('passport_number')}
                placeholder="Required if no National ID"
                className={INPUT_CLS}
              />
              <p className="mt-1 text-xs text-gray-400">Provide National ID or Passport — at least one is required</p>
            </div>

            <div className="sm:col-span-2">
              <Label required>Position / Title at Organisation</Label>
              <input
                {...register('position')}
                placeholder="e.g. Managing Director, IT Manager"
                className={cn(INPUT_CLS, errors.position && 'border-red-400')}
              />
              <FieldError msg={errors.position?.message} />
            </div>

          </div>
        </div>

        {/* ── Section 3: Account Details ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-6">
          <SectionHeading n={3} title="Account Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2 sm:max-w-sm">
              <Label required>Preferred Username</Label>
              <input
                {...register('username')}
                placeholder="Minimum 6 characters"
                className={cn(INPUT_CLS, errors.username && 'border-red-400')}
              />
              <FieldError msg={errors.username?.message} />
            </div>

            <div>
              <Label required>Password</Label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars"
                  className={cn(INPUT_CLS, 'pr-10', errors.password && 'border-red-400')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.password?.message} />
              <p className="mt-1 text-xs text-gray-400">Uppercase, lowercase, number, special character</p>
            </div>

            <div>
              <Label required>Confirm Password</Label>
              <div className="relative">
                <input
                  {...register('confirm_password')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className={cn(INPUT_CLS, 'pr-10', errors.confirm_password && 'border-red-400')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.confirm_password?.message} />
            </div>

          </div>
        </div>

        {/* ── Section 4: Supporting Documents ─────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-6">
          <SectionHeading n={4} title="Supporting Documents" />
          <p className="text-xs text-gray-500 mb-5">PDF format only · Max 5 MB per file</p>

          <div className="space-y-3">
            {DOC_CONFIG.map(({ key, label, required }) => {
              const uploaded = docs[key]
              const err = docErrors[key]
              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors',
                    uploaded
                      ? 'border-emerald-300 bg-emerald-50'
                      : err
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {uploaded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                      </p>
                      {uploaded ? (
                        <p className="text-xs text-emerald-700 truncate">
                          {uploaded.name} · {fmtBytes(uploaded.size)}
                        </p>
                      ) : err ? (
                        <p className="text-xs text-red-600">{err}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Not uploaded</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {uploaded ? (
                      <button
                        type="button"
                        onClick={() => removeDoc(key)}
                        aria-label={`Remove ${label}`}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRefs.current[key]?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580] rounded-lg hover:bg-[#003580] hover:text-white transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                    )}
                    <input
                      ref={(el) => { if (el) fileRefs.current[key] = el }}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(key, e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Section 5: Declaration ───────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-6">
          <SectionHeading n={5} title="Declaration" />
          <div className="space-y-4">

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                {...register('declaration_accurate')}
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#003580] focus:ring-[#003580]/25 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                I confirm that the information provided in this form is accurate and complete to
                the best of my knowledge.
              </span>
            </label>
            <FieldError msg={errors.declaration_accurate?.message} />

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                {...register('declaration_terms')}
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#003580] focus:ring-[#003580]/25 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                I agree to BOCRA&apos;s{' '}
                <a href="#" className="text-[#003580] underline underline-offset-2 hover:text-[#002a6e]">
                  terms and conditions for Type Approval Requestors
                </a>
                .
              </span>
            </label>
            <FieldError msg={errors.declaration_terms?.message} />

          </div>
        </div>

        {/* ── Submit ───────────────────────────────────────────────────── */}
        {submitError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard/type-approval"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#003580] text-white text-sm font-semibold rounded-lg hover:bg-[#002a6e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit Registration Request'
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
