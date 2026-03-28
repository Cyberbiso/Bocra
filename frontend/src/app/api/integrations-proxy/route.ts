import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const res = await backendFetch('/api/integrations', {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
    const data = await res.json().catch(() => [])
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const res = await backendFetch('/api/integrations', {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
      body,
    })
    const data = await res.json().catch(() => null)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ detail: 'Backend unavailable.' }, { status: 503 })
  }
}
