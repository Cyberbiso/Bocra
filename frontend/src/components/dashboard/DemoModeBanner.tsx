'use client'

import { useAppSelector } from '@/lib/store/hooks'

export default function DemoModeBanner() {
  const isDemo = useAppSelector((s) => s.demo.isDemo)

  if (!isDemo) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950"
    >
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-800" aria-hidden="true" />
      DEMO MODE — data shown is simulated for presentation purposes only
    </div>
  )
}
