/**
 * Utility for server-side Next.js API routes to proxy requests to the
 * FastAPI backend. Session cookies are forwarded automatically.
 *
 * Usage:
 *   import { backendFetch, BACKEND_SESSION_COOKIE } from '@/lib/backend'
 *
 *   const res = await backendFetch('/api/complaints', { headers: req.headers })
 */

const BACKEND_URL = process.env.BOCRA_API_URL ?? 'http://localhost:8000'

export const BACKEND_SESSION_COOKIE = 'bocra-session'
export const FRONTEND_SESSION_COOKIE = 'bocra-auth'

export type BackendFetchInit = RequestInit & {
  /** Forward these incoming request headers (typically from NextRequest.headers) */
  headers?: HeadersInit
}

/**
 * Proxy a fetch call to the FastAPI backend, forwarding Cookie headers so
 * the session token reaches the backend unchanged.
 */
export async function backendFetch(
  path: string,
  init: BackendFetchInit = {},
): Promise<Response> {
  const url = `${BACKEND_URL}${path}`
  const headers = new Headers(init.headers)
  const cookieHeader = headers.get('cookie')
  const sessionToken =
    extractNamedCookie(cookieHeader, BACKEND_SESSION_COOKIE) ??
    extractNamedCookie(cookieHeader, FRONTEND_SESSION_COOKIE)

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (sessionToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${sessionToken}`)
  }

  return fetch(url, {
    ...init,
    headers,
  })
}

/** Extract the bocra-session cookie value from a Cookie header string. */
export function extractSessionCookie(cookieHeader: string | null): string | null {
  return extractNamedCookie(cookieHeader, BACKEND_SESSION_COOKIE)
}

function extractNamedCookie(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${cookieName}=`))
  return match ? match.slice(cookieName.length + 1) : null
}
