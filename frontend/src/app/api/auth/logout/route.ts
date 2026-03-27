import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  AUTH_SESSION_COOKIE,
  isDemoSessionToken,
} from '@/lib/server-auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value

  if (token && !isDemoSessionToken(token)) {
    const supabase = getSupabaseAdmin()
    if (supabase) {
      await supabase.schema('iam').from('sessions').delete().eq('token', token)
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(AUTH_SESSION_COOKIE, '', {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0,
  })
  return response
}
