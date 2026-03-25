import { NextRequest, NextResponse } from 'next/server'
import { backendFetch, BACKEND_SESSION_COOKIE } from '@/lib/backend'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { email, password, firstName, lastName, phone, nationalId } = body ?? {}

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json(
      { error: 'email, password, firstName and lastName are required.' },
      { status: 400 },
    )
  }

  try {
    const upstream = await backendFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName, phone, nationalId }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail ?? 'Registration failed.' },
        { status: upstream.status },
      )
    }

    const response = NextResponse.json({ success: true, user: data?.user ?? null }, { status: 201 })

    const setCookieHeader = upstream.headers.get('set-cookie')
    if (setCookieHeader) {
      response.headers.set('set-cookie', setCookieHeader)
    } else {
      response.cookies.set(BACKEND_SESSION_COOKIE, 'authenticated', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      })
    }

    return response
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the BOCRA API. Please try again later.' },
      { status: 502 },
    )
  }
}
