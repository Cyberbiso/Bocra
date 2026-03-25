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
  return fetch(url, {
    ...init,
    // Ensure cookies from the browser are forwarded to the backend
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ? Object.fromEntries(new Headers(init.headers)) : {}),
    },
  })
}

/** Extract the bocra-session cookie value from a Cookie header string. */
export function extractSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${BACKEND_SESSION_COOKIE}=`))
  return match ? match.slice(BACKEND_SESSION_COOKIE.length + 1) : null
}
