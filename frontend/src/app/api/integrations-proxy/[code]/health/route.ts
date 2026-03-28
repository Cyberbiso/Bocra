import { type NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  try {
    const res = await backendFetch(`/api/integrations/${code}/health/check`, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
    const data = await res.json().catch(() => null)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ detail: 'Backend unavailable.' }, { status: 503 })
  }
}
