import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('bocra-auth')?.value

  if (token && token !== 'demo-session') {
    const supabase = getSupabaseAdmin()
    if (supabase) {
      await supabase.schema('iam').from('sessions').delete().eq('token', token)
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('bocra-auth', '', {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0,
  })
  return response
}
