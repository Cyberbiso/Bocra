'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterConditional() {
  const pathname = usePathname()
  if (pathname.startsWith('/dashboard') || pathname === '/login') return null
  return <Footer />
}
