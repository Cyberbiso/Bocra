'use client'

import Link from 'next/link'
import {
  FileText,
  MessageSquareWarning,
  CreditCard,
  Award,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  Smartphone,
  Bot,
  CheckCircle2,
  Clock,
  RefreshCw,
  Bell,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/lib/store/hooks'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type DashboardRole = 'applicant' | 'officer' | 'admin'

interface ActivityItem {
  id: string
  icon: React.ElementType
  iconColor: string
  title: string
  module: string
  moduleColor: string
  timestamp: string
  status: string
  statusColor: string
}

interface Notice {
  id: string
  title: string
  date: string
  category: string
  excerpt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// TODO: Replace with GET /api/dashboard/summary — returns counts per module for the current user
const SUMMARY_DATA: Record<DashboardRole, {
  applications: number
  complaints: number
  invoiceCount: number
  invoiceTotal: string
  certificates: number
  reviewQueue?: number
  slaBreaches?: number
}> = {
  applicant: {
    applications: 3,
    complaints: 2,
    invoiceCount: 1,
    invoiceTotal: 'P 4 800.00',
    certificates: 2,
  },
  officer: {
    applications: 3,
    complaints: 2,
    invoiceCount: 1,
    invoiceTotal: 'P 4 800.00',
    certificates: 2,
    reviewQueue: 14,
    slaBreaches: 3,
  },
  admin: {
    applications: 18,
    complaints: 31,
    invoiceCount: 7,
    invoiceTotal: 'P 142 600.00',
    certificates: 12,
    reviewQueue: 41,
    slaBreaches: 6,
  },
}

// TODO: Replace with GET /api/dashboard/activity?limit=5 — recent events for the current user
const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    title: 'Licence application LIC-2024-00831 approved',
    module: 'Licensing',
    moduleColor: 'bg-blue-50 text-blue-700',
    timestamp: '2 hours ago',
    status: 'Approved',
    statusColor: 'text-emerald-600',
  },
  {
    id: '2',
    icon: RefreshCw,
    iconColor: 'text-amber-500',
    title: 'Complaint CMP-2024-01142 status updated to "Under Review"',
    module: 'Complaints',
    moduleColor: 'bg-orange-50 text-orange-700',
    timestamp: 'Yesterday, 14:32',
    status: 'Under Review',
    statusColor: 'text-amber-600',
  },
  {
    id: '3',
    icon: Bell,
    iconColor: 'text-sky-500',
    title: 'Invoice INV-2024-0294 issued — BWP 4 800.00 due',
    module: 'Payments',
    moduleColor: 'bg-purple-50 text-purple-700',
    timestamp: 'Yesterday, 09:15',
    status: 'Payment Due',
    statusColor: 'text-sky-600',
  },
  {
    id: '4',
    icon: Award,
    iconColor: 'text-emerald-500',
    title: 'Type-approval certificate TA-2024-00217 ready for download',
    module: 'Type Approval',
    moduleColor: 'bg-green-50 text-green-700',
    timestamp: '2 days ago',
    status: 'Ready',
    statusColor: 'text-emerald-600',
  },
  {
    id: '5',
    icon: Clock,
    iconColor: 'text-gray-400',
    title: 'Spectrum renewal reminder — expires in 30 days',
    module: 'Licensing',
    moduleColor: 'bg-blue-50 text-blue-700',
    timestamp: '3 days ago',
    status: 'Reminder',
    statusColor: 'text-gray-500',
  },
]

// TODO: Replace with GET /api/notices?limit=3 — latest published regulatory notices
const BOCRA_NOTICES: Notice[] = [
  {
    id: '1',
    title: 'Public Consultation: Draft Electronic Communications (Amendment) Regulations 2025',
    date: '18 Mar 2025',
    category: 'Consultation',
    excerpt:
      'BOCRA invites stakeholders to submit written comments on the proposed amendments to the Electronic Communications Regulations by 15 April 2025.',
  },
  {
    id: '2',
    title: 'Notice to Operators: New QoS Reporting Templates Effective 1 April 2025',
    date: '12 Mar 2025',
    category: 'Regulatory Notice',
    excerpt:
      'All licensed operators must submit quarterly QoS reports using the updated templates available on the BOCRA portal.',
  },
  {
    id: '3',
    title: 'BOCRA Completes Annual Spectrum Audit — Report Now Available',
    date: '5 Mar 2025',
    category: 'Press Release',
    excerpt:
      'The annual spectrum monitoring and audit exercise has been completed. The full report is available for download in the Documents section.',
  },
]

const NOTICE_CATEGORY_COLOURS: Record<string, string> = {
  Consultation: 'bg-blue-50 text-blue-700',
  'Regulatory Notice': 'bg-amber-50 text-amber-700',
  'Press Release': 'bg-emerald-50 text-emerald-700',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickActionButton({
  href,
  icon: Icon,
  label,
  accent = false,
}: {
  href: string
  icon: React.ElementType
  label: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        accent
          ? 'bg-[#003580] text-white hover:bg-[#002a6b] shadow-sm'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-[#003580]/40 hover:text-[#003580] hover:bg-blue-50/50'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}

function StatCard({
  title,
  count,
  sub,
  href,
  icon: Icon,
  iconBg,
  iconColor,
  countColor,
}: {
  title: string
  count: number | string
  sub?: string
  href: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  countColor?: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <Link
            href={href}
            className="text-xs text-[#003580] font-medium hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn('text-3xl font-bold leading-none', countColor ?? 'text-gray-900')}>
          {count}
        </p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardHomePage() {
  const role = useAppSelector((s) => s.role.role)

  const summary = SUMMARY_DATA[role]

  const roleBadgeStyle: Record<DashboardRole, string> = {
    applicant: 'bg-sky-100 text-sky-700 border-sky-200',
    officer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    admin: 'bg-rose-100 text-rose-700 border-rose-200',
  }

  const roleLabel: Record<DashboardRole, string> = {
    applicant: 'Applicant / Requestor',
    officer: 'BOCRA Officer',
    admin: 'Administrator',
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── Welcome bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            {/* TODO: Replace "User" with authenticated user's display name from session */}
            <span className="text-2xl font-bold text-[#003580]">User</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                roleBadgeStyle[role]
              )}
            >
              {roleLabel[role]}
            </span>
            <span className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-BW', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <QuickActionButton
            href="/dashboard/complaints"
            icon={MessageSquareWarning}
            label="Submit Complaint"
            accent
          />
          <QuickActionButton
            href="/dashboard/licensing"
            icon={ShieldCheck}
            label="Verify a Licence"
          />
          <QuickActionButton
            href="/dashboard/device-verification"
            icon={Smartphone}
            label="Check IMEI"
          />
          <QuickActionButton
            href="/dashboard/agent"
            icon={Bot}
            label="Ask BOCRA Agent"
          />
        </div>
      </div>

      {/* ── Status summary cards ────────────────────────────────────────── */}
      {/* TODO: All counts from GET /api/dashboard/summary */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Summary
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="My Applications"
            count={summary.applications}
            href="/dashboard/licensing"
            icon={FileText}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Open Complaints"
            count={summary.complaints}
            href="/dashboard/complaints"
            icon={MessageSquareWarning}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatCard
            title="Pending Invoices"
            count={summary.invoiceCount}
            sub={summary.invoiceCount > 0 ? `Total: ${summary.invoiceTotal}` : undefined}
            href="/dashboard/payments"
            icon={CreditCard}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Certificates Ready"
            count={summary.certificates}
            href="/dashboard/certificates"
            icon={Award}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Officer-only cards */}
        {(role === 'officer' || role === 'admin') && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* TODO: Officer queue counts from GET /api/officer/queue-summary */}
            <StatCard
              title="Items in Review Queue"
              count={summary.reviewQueue ?? 0}
              href="/dashboard/admin"
              icon={ClipboardList}
              iconBg="bg-sky-50"
              iconColor="text-sky-600"
            />
            <StatCard
              title="SLA Breaches Today"
              count={summary.slaBreaches ?? 0}
              href="/dashboard/admin"
              icon={AlertTriangle}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              countColor={summary.slaBreaches && summary.slaBreaches > 0 ? 'text-red-600' : undefined}
            />
          </div>
        )}
      </section>

      {/* ── Bottom: activity + notices ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Recent Activity — 3/5 width on large screens */}
        <section className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Recent Activity
          </h2>
          {/* TODO: Replace with GET /api/dashboard/activity?limit=5 */}
          <Card>
            <CardContent className="px-0 py-0">
              <ul className="divide-y divide-gray-100">
                {RECENT_ACTIVITY.map((item) => {
                  const Icon = item.icon
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="mt-0.5 shrink-0">
                        <Icon className={cn('w-4 h-4', item.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug line-clamp-2">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={cn(
                              'text-[11px] font-medium px-1.5 py-0.5 rounded',
                              item.moduleColor
                            )}
                          >
                            {item.module}
                          </span>
                          <span className={cn('text-[11px] font-medium', item.statusColor)}>
                            {item.status}
                          </span>
                          <span className="text-[11px] text-gray-400">{item.timestamp}</span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
            <CardFooter className="justify-center py-2.5">
              <Link
                href="/dashboard/notifications"
                className="text-xs text-[#003580] font-medium hover:underline flex items-center gap-1"
              >
                View all activity <ChevronRight className="w-3 h-3" />
              </Link>
            </CardFooter>
          </Card>
        </section>

        {/* Latest BOCRA Notices — 2/5 width on large screens */}
        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Latest BOCRA Notices
          </h2>
          {/* TODO: Replace with GET /api/notices?limit=3&published=true */}
          <div className="space-y-3">
            {BOCRA_NOTICES.map((notice) => (
              <Card key={notice.id} size="sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        NOTICE_CATEGORY_COLOURS[notice.category] ?? 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {notice.category}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">{notice.date}</span>
                  </div>
                  <CardTitle className="text-sm leading-snug mt-1">{notice.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {notice.excerpt}
                  </p>
                </CardContent>
                <CardFooter className="py-2">
                  <Link
                    href="/dashboard/documents"
                    className="text-xs text-[#003580] font-medium hover:underline flex items-center gap-1"
                  >
                    Read more <ExternalLink className="w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
