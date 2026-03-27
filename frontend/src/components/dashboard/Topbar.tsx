'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Bell, Menu, Bot } from 'lucide-react'
import { useChatStore } from '@/lib/stores/chat-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppSelector } from '@/lib/store/hooks'
import { ROLE_LABELS } from '@/lib/types/roles'
import logoImage from './../../../public/logo.png'

interface TopbarProps {
  onMobileMenuOpen: () => void
}

export default function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)
  const authUser = useAppSelector((s) => s.auth.user)
  const role = useAppSelector((s) => s.role.role)
  const { toggle: toggleChat } = useChatStore()
  const router = useRouter()
  const [query, setQuery] = useState('')

  const roleLabel = ROLE_LABELS[role] ?? role
  const displayName = authUser
    ? `${authUser.firstName} ${authUser.lastName}`
    : 'BOCRA User'
  const initials = authUser
    ? `${authUser.firstName[0]}${authUser.lastName[0]}`.toUpperCase()
    : role[0].toUpperCase()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(`/dashboard/search${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  function handleMobileSearch() {
    const q = query.trim()
    router.push(`/dashboard/search${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-3 px-4 shrink-0 z-30">

      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/40"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* BOCRA Logo — matches landing page Navbar pattern */}
      <Link href="/dashboard/home" className="flex items-center gap-2.5 shrink-0 group">
        <div className="relative w-28 h-9">
          <Image src={logoImage} alt="BOCRA Logo" fill className="object-contain" priority />
        </div>
        <div className="hidden lg:flex flex-col border-l border-gray-200 pl-2.5">
          <span className="text-[9px] font-black text-[#06193e] uppercase tracking-widest leading-tight">
            Botswana Communications
          </span>
          <span className="text-[9px] font-black text-[#027ac6] uppercase tracking-widest leading-tight">
            Regulatory Authority
          </span>
        </div>
      </Link>

      {/* Search — grows to fill available space */}
      <form
        role="search"
        onSubmit={handleSearch}
        className="flex-1 max-w-xl mx-auto hidden sm:block"
      >
        <div className="relative">
          <label htmlFor="topbar-search" className="sr-only">
            Search licences, complaints, services
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden />
          <input
            id="topbar-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search licences, complaints, services…"
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/25 focus:bg-white transition-colors"
          />
        </div>
      </form>

      {/* Right-side actions */}
      <div className="flex items-center gap-1 ml-auto">

        {/* AI Assist */}
        <button
          onClick={toggleChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-[#003580] hover:bg-[#002a6e] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/40"
          aria-label="Open AI assistant"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">AI Assist</span>
        </button>

        {/* Search icon (mobile only) */}
        <button
          onClick={handleMobileSearch}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/40"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>

        {/* Notification bell */}
        <Link
          href="/dashboard/notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User avatar + dropdown.
            DropdownMenuTrigger renders a <button> natively — style via className. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-gray-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/40"
            aria-label={`User menu — ${roleLabel}`}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#003580] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium text-gray-700 leading-tight">
              {displayName}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <span className="block font-semibold text-gray-900">{displayName}</span>
              <span className="block text-xs font-normal text-gray-500 mt-0.5">
                {authUser?.orgName ?? roleLabel}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
