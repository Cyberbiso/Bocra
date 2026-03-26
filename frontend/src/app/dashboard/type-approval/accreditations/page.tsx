'use client'

import type { ElementType } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AccreditationType = 'CUSTOMER' | 'MANUFACTURER' | 'REPAIR_SERVICE_PROVIDER'

interface Accreditation {
  id: string
  accreditation_type: AccreditationType
  accreditation_ref: string
  org_name: string
  status_code: string
  issued_at: string | null
}

const TYPE_LABELS: Record<AccreditationType, string> = {
  CUSTOMER: 'Customer',
  MANUFACTURER: 'Manufacturer',
  REPAIR_SERVICE_PROVIDER: 'Repair Service Provider',
}

const TYPE_ICONS = {
  CUSTOMER: User,
  MANUFACTURER: Building2,
  REPAIR_SERVICE_PROVIDER: Smartphone,
} satisfies Record<AccreditationType, ElementType>

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
}

function formatDate(value: string | null) {
  if (!value) return 'Not issued yet'
  return new Intl.DateTimeFormat('en-BW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

async function fetchAccreditations(): Promise<Accreditation[]> {
  const res = await fetch('/api/type-approval/accreditations')
  if (!res.ok) throw new Error('Failed to load accreditations')
  return res.json() as Promise<Accreditation[]>
}

export default function TypeApprovalAccreditationsPage() {
  const { data = [], isLoading, error } = useQuery<Accreditation[]>({
    queryKey: ['type-approval-accreditations-page'],
    queryFn: fetchAccreditations,
  })

  const approvedCount = data.filter((item) => item.status_code === 'APPROVED').length
  const pendingCount = data.filter((item) => item.status_code === 'PENDING').length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-[#dce8ff] bg-linear-to-r from-[#f6faff] to-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#003580]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Type Approval
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">Accreditations</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                Review the accreditation records linked to your organization before starting a new type approval
                application. Approved accreditations unlock the relevant sections of the workflow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/type-approval/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-[#003580] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#002a6e]"
            >
              Continue to application
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/type-approval"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#b7cff7] hover:text-[#003580]"
            >
              Back to Type Approval
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Approved</p>
          <p className="mt-3 text-3xl font-black text-gray-900">{approvedCount}</p>
          <p className="mt-1 text-sm text-gray-500">Accreditations ready for use in applications.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Pending</p>
          <p className="mt-3 text-3xl font-black text-gray-900">{pendingCount}</p>
          <p className="mt-1 text-sm text-gray-500">Records still awaiting BOCRA review.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">Application access</p>
          <p className="mt-3 text-lg font-bold text-gray-900">{approvedCount > 0 ? 'Ready to apply' : 'Waiting for approval'}</p>
          <p className="mt-1 text-sm text-gray-500">
            {approvedCount > 0
              ? 'At least one approved accreditation is available for your type approval workflow.'
              : 'You need an approved accreditation before submitting a new type approval application.'}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Organization accreditations</h2>
          <p className="mt-1 text-sm text-gray-500">These records are loaded from the type approval accreditation API.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading accreditations...
          </div>
        ) : error ? (
          <div className="px-6 py-10 text-sm text-red-600">We could not load accreditations right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Issued</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const Icon = TYPE_ICONS[item.accreditation_type]

                  return (
                    <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-900">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ff] text-[#003580]">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-medium">{TYPE_LABELS[item.accreditation_type]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{item.accreditation_ref}</code>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{item.org_name}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(item.issued_at)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                            STATUS_STYLES[item.status_code] ?? 'bg-gray-100 text-gray-600 border-gray-200',
                          )}
                        >
                          {item.status_code === 'APPROVED' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}
                          {item.status_code}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
