'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  MessageSquareWarning,
  ShieldCheck,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Home',         icon: LayoutDashboard,     href: '/dashboard/home' },
  { label: 'Search',       icon: Search,               href: '/dashboard/search' },
  { label: 'Complaints',   icon: MessageSquareWarning, href: '/dashboard/complaints' },
  { label: 'Type Approval',icon: ShieldCheck,          href: '/dashboard/type-approval' },
  { label: 'AI Agent',     icon: Bot,                  href: '/dashboard/agent' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom"
    >
      <div className="flex h-16">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003580]/50',
                isActive
                  ? 'text-[#003580]'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform',
                  isActive && 'scale-110',
                )}
                aria-hidden
              />
              <span>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#003580]" aria-hidden />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
