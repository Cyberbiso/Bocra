'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  MessageSquareWarning,
  FileText,
  ShieldCheck,
  Smartphone,
  Award,
  CreditCard,
  BarChart3,
  Globe,
  Lock,
  BookOpen,
  Bell,
  Settings,
  PlugZap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppSelector } from '@/lib/store/hooks'
import type { DashboardRole } from '@/lib/store/slices/roleSlice'
import { roleHasPermission } from '@/lib/types/roles'

// ─── Nav config ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  permission: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Home', icon: LayoutDashboard, href: '/dashboard/home', permission: 'home' }],
  },
  {
    label: 'SERVICES',
    items: [
      { label: 'Global Search & Verify', icon: Search, href: '/dashboard/search', permission: 'search' },
      { label: 'Complaints', icon: MessageSquareWarning, href: '/dashboard/complaints', permission: 'complaints' },
      { label: 'Licensing & Spectrum', icon: FileText, href: '/dashboard/licensing', permission: 'licensing' },
      { label: 'Type Approval', icon: ShieldCheck, href: '/dashboard/type-approval', permission: 'type-approval' },
      { label: 'Device Verification & IMEI', icon: Smartphone, href: '/dashboard/device-verification', permission: 'device-verification' },
      { label: 'Certificates & Registers', icon: Award, href: '/dashboard/certificates', permission: 'certificates' },
      { label: 'Payments & Billing', icon: CreditCard, href: '/dashboard/payments', permission: 'payments' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { label: 'QoS & Coverage', icon: BarChart3, href: '/dashboard/qos', permission: 'qos' },
      { label: 'Domain Services', icon: Globe, href: '/dashboard/domain-services', permission: 'domain-services' },
      { label: 'Cybersecurity & CIRT', icon: Lock, href: '/dashboard/cybersecurity', permission: 'cybersecurity' },
      { label: 'Documents & Policies', icon: BookOpen, href: '/dashboard/documents', permission: 'documents' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { label: 'Notifications', icon: Bell, href: '/dashboard/notifications', permission: 'notifications' },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { label: 'Admin & Workflow', icon: Settings, href: '/dashboard/admin', permission: 'admin' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Integrations', icon: PlugZap, href: '/dashboard/integrations', permission: 'integrations' },
    ],
  },
]

const ROLE_CONFIG: Record<DashboardRole, { label: string; dot: string }> = {
  applicant: { label: 'Applicant', dot: 'bg-sky-400' },
  officer: { label: 'Officer', dot: 'bg-emerald-400' },
  type_approver: { label: 'Type Approver', dot: 'bg-amber-400' },
  admin: { label: 'Admin', dot: 'bg-rose-400' },
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}

export default function Sidebar({ collapsed, onToggleCollapse, onClose }: SidebarProps) {
  const pathname = usePathname()
  const role = useAppSelector((s) => s.role.role)

  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => roleHasPermission(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <TooltipProvider delay={0}>
      <div className="flex flex-col h-full bg-[#003580] text-white overflow-hidden select-none">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center h-16 px-3 shrink-0',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {collapsed ? (
            <Link
              href="/dashboard/home"
              className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shrink-0"
              title="BOCRA Dashboard"
            >
              <span className="text-[#003580] text-sm font-black leading-none">B</span>
            </Link>
          ) : (
            <Link href="/dashboard/home" className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shrink-0">
                <span className="text-[#003580] text-sm font-black leading-none">B</span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight tracking-wide truncate">
                  BOCRA
                </p>
                <p className="text-white/40 text-[10px] leading-tight truncate">
                  Regulatory Portal
                </p>
              </div>
            </Link>
          )}

          {/* Desktop collapse toggle */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-white/60" />
              )}
            </button>
          )}

          {/* Mobile close */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-white/10 shrink-0" />

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-none" aria-label="Main navigation">
          {visibleGroups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && 'mt-4')}>
              {!collapsed && (
                <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                  {group.label}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="mx-1 mb-2 mt-1 border-t border-white/10" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      // native title gives a tooltip in collapsed mode at zero cost
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#003580]',
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-white/65 hover:bg-white/[0.08] hover:text-white'
                      )}
                    >
                      <Icon
                        className={cn(
                          'shrink-0',
                          collapsed ? 'w-5 h-5' : 'w-4 h-4'
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 mb-3 border-t border-white/10 shrink-0" />

        {/* ── Sign Out ─────────────────────────────────────────────────── */}
        <div className={cn('px-3 pb-2 shrink-0', collapsed && 'px-2')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                onClick={() => void handleSignOut()}
                className="flex w-full items-center justify-center rounded-lg p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          )}
        </div>

        {/* ── Role indicator ────────────────────────────────────────────── */}
        <div className={cn('p-3 shrink-0', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger className="cursor-default rounded-full outline-none">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', ROLE_CONFIG[role].dot)}>
                  {ROLE_CONFIG[role].label[0]}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Role: {ROLE_CONFIG[role].label}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className={cn('w-2 h-2 rounded-full shrink-0', ROLE_CONFIG[role].dot)} />
              <span className="text-xs text-white/50">{ROLE_CONFIG[role].label}</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
