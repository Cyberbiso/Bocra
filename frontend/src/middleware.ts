import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('bocra-auth')

  // Authenticated users cannot access the landing page or login page
  if (token?.value && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/dashboard/home', request.url))
  }

  // Unauthenticated users cannot access the dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token?.value) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
}
