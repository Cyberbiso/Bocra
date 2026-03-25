import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const res = await backendFetch('/api/integrations/health/check', {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
    const data = await res.json().catch(() => null)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ detail: 'Backend unavailable.' }, { status: 503 })
  }
}
