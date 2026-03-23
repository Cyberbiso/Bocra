'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileBottomNav from './MobileBottomNav'
import DemoModeBanner from './DemoModeBanner'
import { DashboardChatPanel } from './DashboardChatPanel'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">

      {/* ── Demo mode banner ──────────────────────────────────────────── */}
      <DemoModeBanner />

      {/* ── Full-width topbar ─────────────────────────────────────────── */}
      <Topbar onMobileMenuOpen={() => setMobileOpen(true)} />

      {/* ── Below topbar: sidebar + content ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside
          className={cn(
            'hidden md:flex flex-col shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden',
            collapsed ? 'w-16' : 'w-64'
          )}
          aria-label="Primary navigation"
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        </aside>

        {/* Mobile sidebar — shadcn Sheet drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 bg-[#003580] border-0 [&>button]:text-white/60 [&>button]:hover:text-white [&>button]:hover:bg-white/10"
          >
            {/* Visually hidden title for screen readers */}
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar
              collapsed={false}
              onClose={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main content area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto p-4 md:p-6 min-w-0 pb-20 md:pb-6 outline-none"
        >
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation bar ──────────────────────────────── */}
      <MobileBottomNav />

      {/* ── Dashboard AI chat panel ───────────────────────────────────── */}
      <DashboardChatPanel />
    </div>
  )
}
