import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_SESSION_COOKIE,
  getSessionUserFromToken,
} from '@/lib/server-auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const user = await getSessionUserFromToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Session invalid or expired.' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
