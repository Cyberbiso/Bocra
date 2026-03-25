'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function NavbarConditional() {
  const pathname = usePathname()
  if (pathname.startsWith('/dashboard') || pathname === '/login') return null
  return <Navbar />
}
