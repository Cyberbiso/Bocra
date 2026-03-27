import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  AUTH_SESSION_COOKIE,
} from '@/lib/server-auth'
import { backendFetch } from '@/lib/backend'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value

  if (token) {
    const supabase = getSupabaseAdmin()
    if (supabase) {
      await supabase.schema('iam').from('sessions').delete().eq('token', token)
    }
  }

  // Also invalidate the backend session
  try {
    await backendFetch('/api/auth/logout', {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
  } catch { /* backend unreachable */ }

  const response = NextResponse.json({ success: true })
  response.cookies.set(AUTH_SESSION_COOKIE, '', {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0,
  })
  response.cookies.set('bocra-session', '', {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0,
  })
  return response
}
