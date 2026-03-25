import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  try {
    const upstream = await backendFetch('/api/notifications', {
      headers: { cookie: cookieHeader },
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
}
