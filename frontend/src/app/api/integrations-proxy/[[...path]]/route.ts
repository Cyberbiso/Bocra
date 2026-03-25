import { type NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function proxy(request: NextRequest, segments: string[]) {
  // Map frontend proxy paths to backend paths
  // /api/integrations-proxy           → GET  /api/integrations
  // /api/integrations-proxy/health    → POST /api/integrations/health/check
  // /api/integrations-proxy/{code}/health → POST /api/integrations/{code}/health/check
  // /api/integrations-proxy/{code}/rotate-key → POST /api/integrations/{code}/rotate-key

  let backendPath = '/api/integrations'

  if (segments.length === 1 && segments[0] === 'health') {
    backendPath = '/api/integrations/health/check'
  } else if (segments.length === 2 && segments[1] === 'health') {
    backendPath = `/api/integrations/${segments[0]}/health/check`
  } else if (segments.length === 2 && segments[1] === 'rotate-key') {
    backendPath = `/api/integrations/${segments[0]}/rotate-key`
  }

  const url = `${BACKEND}${backendPath}`

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  if (cookie) headers['cookie'] = cookie

  const res = await fetch(url, {
    method: request.method,
    headers,
    credentials: 'include',
  })

  const data = await res.json().catch(() => null)
  return NextResponse.json(data, { status: res.status })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxy(req, path)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxy(req, path)
}
