'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  User,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Schema ───────────────────────────────────────────────────────────────────

const step2Schema = z.object({
  account_type: z.string().min(1, 'Account type is required'),
  org_name: z.string().min(2, 'Organisation name is required'),
  org_contact: z.string().min(5, 'Organisation contact is required'),
  org_web: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  id_type: z.string().min(1, 'ID type is required'),
  id_number: z.string().min(3, 'ID / Passport number is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone number is required'),
  physical_address: z.string().min(5, 'Physical address is required'),
  postal_address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
})

const step3Schema = z.object({
  accepted_terms: z.literal(true, { error: 'You must accept the terms and conditions' }),
})

type Step2Form = z.infer<typeof step2Schema>
type Step3Form = z.infer<typeof step3Schema>

const ACCOUNT_TYPES = [
  'Individual / Sole Trader',
  'Private Company (Pty) Ltd',
  'Public Company',
  'Government Entity',
  'Non-Governmental Organisation',
  'Partnership',
  'Foreign Entity',
]

const ID_TYPES = [
  'National Identity Card',
  'Passport',
  'Work Permit',
  'Residence Permit',
]

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Welcome', icon: Globe },
  { label: 'Requestor Details', icon: User },
  { label: 'Terms & Conditions', icon: FileCheck },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-[#06193e] text-white ring-4 ring-[#06193e]/20'
                      : 'bg-gray-100 text-gray-400',
                )}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <span>{i + 1}</span>}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold whitespace-nowrap',
                  active ? 'text-[#06193e]' : done ? 'text-emerald-600' : 'text-gray-400',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-16 h-0.5 mb-4 mx-1 transition-colors',
                  i < current ? 'bg-emerald-400' : 'bg-gray-200',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

const inputCls =
  'w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06193e]/20 focus:border-[#06193e]/40 transition-colors'

const selectCls =
  'w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#06193e]/20 focus:border-[#06193e]/40 transition-colors'

// ─── Step 1 — Welcome ─────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 rounded-2xl bg-[#06193e]/5 flex items-center justify-center mx-auto">
        <Building2 className="w-8 h-8 text-[#06193e]" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#06193e]">Register your Organisation</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          Create a BOCRA portal account to apply for type approval, licences, and other regulatory
          services online.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
        {[
          { icon: Building2, title: 'Organisation Profile', desc: 'Register your company or entity details with BOCRA.' },
          { icon: FileCheck, title: 'Regulatory Services', desc: 'Apply for type approval, spectrum, and licences.' },
          { icon: CheckCircle2, title: 'Track Applications', desc: 'Monitor your applications and receive decisions.' },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
            <item.icon className="w-5 h-5 text-[#027ac6] mb-2" />
            <p className="text-xs font-bold text-gray-800">{item.title}</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">{item.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-3 bg-[#06193e] hover:bg-[#027ac6] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
      >
        Get Started
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Step 2 — Requestor Details ───────────────────────────────────────────────

function RequestorDetailsStep({
  onNext,
  onBack,
  onSaveData,
}: {
  onNext: () => void
  onBack: () => void
  onSaveData: (data: Step2Form) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Form>({ resolver: zodResolver(step2Schema) })

  function onValid(data: Step2Form) {
    onSaveData(data)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">

      {/* Account Type */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Account Information
        </h3>
        <div>
          <FieldLabel required>Account Type</FieldLabel>
          <select {...register('account_type')} className={selectCls} defaultValue="">
            <option value="" disabled>Select account type…</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <FieldError message={errors.account_type?.message} />
        </div>
      </div>

      {/* Organisation Details */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Organisation Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel required>Organisation Name</FieldLabel>
            <input {...register('org_name')} className={inputCls} placeholder="e.g. TechImport Botswana (Pty) Ltd" />
            <FieldError message={errors.org_name?.message} />
          </div>
          <div>
            <FieldLabel required>Organisation Contact</FieldLabel>
            <input {...register('org_contact')} className={inputCls} placeholder="+267 3xxxxxxx" />
            <FieldError message={errors.org_contact?.message} />
          </div>
          <div>
            <FieldLabel>Web Address</FieldLabel>
            <input {...register('org_web')} className={inputCls} placeholder="https://example.co.bw" />
            <FieldError message={errors.org_web?.message} />
          </div>
        </div>
      </div>

      {/* Contact Person */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Contact Person
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>First Name</FieldLabel>
            <input {...register('first_name')} className={inputCls} placeholder="First name" />
            <FieldError message={errors.first_name?.message} />
          </div>
          <div>
            <FieldLabel required>Last Name</FieldLabel>
            <input {...register('last_name')} className={inputCls} placeholder="Last name" />
            <FieldError message={errors.last_name?.message} />
          </div>
          <div>
            <FieldLabel required>ID Type</FieldLabel>
            <select {...register('id_type')} className={selectCls} defaultValue="">
              <option value="" disabled>Select ID type…</option>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <FieldError message={errors.id_type?.message} />
          </div>
          <div>
            <FieldLabel required>ID / Passport Number</FieldLabel>
            <input {...register('id_number')} className={inputCls} placeholder="ID or passport number" />
            <FieldError message={errors.id_number?.message} />
          </div>
          <div>
            <FieldLabel required>Email Address</FieldLabel>
            <input {...register('email')} type="email" className={inputCls} placeholder="contact@example.co.bw" />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <FieldLabel required>Phone Number</FieldLabel>
            <input {...register('phone')} className={inputCls} placeholder="+267 7xxxxxxx" />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Address
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel required>Physical Address</FieldLabel>
            <input {...register('physical_address')} className={inputCls} placeholder="Plot / Street, Area" />
            <FieldError message={errors.physical_address?.message} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Postal Address</FieldLabel>
            <input {...register('postal_address')} className={inputCls} placeholder="P.O. Box or Private Bag" />
            <FieldError message={errors.postal_address?.message} />
          </div>
          <div>
            <FieldLabel required>City / Town</FieldLabel>
            <input {...register('city')} className={inputCls} placeholder="Gaborone" />
            <FieldError message={errors.city?.message} />
          </div>
          <div>
            <FieldLabel required>Country</FieldLabel>
            <input {...register('country')} className={inputCls} placeholder="Botswana" defaultValue="Botswana" />
            <FieldError message={errors.country?.message} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-[#06193e] hover:bg-[#027ac6] text-white text-sm font-bold rounded-xl transition-colors"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}

// ─── Step 3 — Terms & Conditions ──────────────────────────────────────────────

function TermsStep({
  onSubmit: onFormSubmit,
  onBack,
}: {
  onSubmit: () => void
  onBack: () => void
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Form>({ resolver: zodResolver(step3Schema) })

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Terms and Conditions</h3>
        <div className="h-56 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 leading-relaxed space-y-3">
          <p className="font-bold text-gray-800">BOCRA Portal Registration Terms</p>
          <p>
            By registering on the BOCRA Digital Portal, you agree to provide accurate, complete, and
            current information about your organisation and authorised representatives. You accept
            responsibility for the accuracy of all submitted data and for maintaining the
            confidentiality of your account credentials.
          </p>
          <p>
            All applications and submissions made through this portal are subject to the
            Communications Regulatory Authority Act (Cap. 73:01), the Botswana
            Telecommunications Act, and all relevant regulations and guidelines issued by BOCRA.
          </p>
          <p>
            BOCRA reserves the right to verify any information submitted, request additional
            documentation, and suspend or revoke portal access in cases of misrepresentation,
            fraud, or breach of these terms.
          </p>
          <p>
            Personal data collected during registration is processed in accordance with the Data
            Protection Act (Cap. 65:04) of Botswana. Data will be used solely for regulatory
            administration purposes and will not be shared with third parties except as required
            by law or with your consent.
          </p>
          <p>
            By completing registration, you confirm that the designated contact person is
            authorised to act on behalf of the organisation for all regulatory matters handled
            through this portal.
          </p>
        </div>
      </div>

      <Controller
        control={control}
        name="accepted_terms"
        render={({ field }) => (
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={field.value ?? false}
                onChange={(e) => field.onChange(e.target.checked as true)}
                className="sr-only peer"
              />
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                field.value
                  ? 'bg-[#06193e] border-[#06193e]'
                  : 'bg-white border-gray-300 group-hover:border-[#06193e]/40',
              )}>
                {field.value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-700">
              I have read and accept the{' '}
              <span className="font-semibold text-[#06193e]">Terms and Conditions</span> and
              confirm that the information provided is accurate and complete.
            </span>
          </label>
        )}
      />
      {errors.accepted_terms && (
        <p className="text-xs text-red-500 -mt-2">{errors.accepted_terms.message}</p>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-[#06193e] hover:bg-[#027ac6] text-white text-sm font-bold rounded-xl transition-colors"
        >
          Submit Registration
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessState({ orgName }: { orgName: string }) {
  return (
    <div className="text-center py-8 space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Registration Submitted</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          <span className="font-semibold text-gray-700">{orgName}</span> has been registered.
          BOCRA will review your application and send confirmation to your email address.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/dashboard/type-approval"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#06193e] hover:bg-[#027ac6] text-white text-sm font-bold rounded-xl transition-colors"
        >
          Go to Type Approval
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<Partial<Step2Form>>({})
  const [submitted, setSubmitted] = useState(false)

  function handleSaveData(data: Step2Form) {
    setFormData(data)
  }

  function handleSubmit() {
    // TODO: POST /api/register with formData
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-24 h-9">
              <Image src="/logo.png" alt="BOCRA Logo" fill className="object-contain" priority />
            </div>
            <div className="hidden sm:flex flex-col border-l border-gray-200 pl-3">
              <span className="text-[9px] font-black text-[#06193e] uppercase tracking-widest leading-tight">
                Botswana Communications
              </span>
              <span className="text-[9px] font-black text-[#027ac6] uppercase tracking-widest leading-tight">
                Regulatory Authority
              </span>
            </div>
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-gray-500 hover:text-[#06193e] transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {submitted ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <SuccessState orgName={formData.org_name ?? 'Your organisation'} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-black text-[#06193e]">Portal Registration</h1>
              <p className="text-sm text-gray-500 mt-1">Register your organisation with BOCRA</p>
            </div>

            <StepIndicator current={step} />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
              {step === 1 && (
                <RequestorDetailsStep
                  onNext={() => setStep(2)}
                  onBack={() => setStep(0)}
                  onSaveData={handleSaveData}
                />
              )}
              {step === 2 && (
                <TermsStep
                  onSubmit={handleSubmit}
                  onBack={() => setStep(1)}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
