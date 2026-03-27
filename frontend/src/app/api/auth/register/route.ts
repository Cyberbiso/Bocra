import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const SESSION_SECONDS = 60 * 60 * 24

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const { email, password, firstName, lastName, phone, nationalId } = body ?? {}

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json(
      { error: 'email, password, firstName and lastName are required.' },
      { status: 400 },
    )
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (supabase) {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .schema('iam')
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .limit(1)

      if (existing?.length) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12)

      // Insert user
      const { data: newUsers, error: insertErr } = await supabase
        .schema('iam')
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          auth_provider: 'local',
          first_name: firstName,
          last_name: lastName,
          phone_e164: phone ?? null,
          national_id: nationalId ?? null,
          status_code: 'ACTIVE',
        })
        .select('id, email, first_name, last_name')

      if (insertErr || !newUsers?.length) {
        console.error('User insert error', insertErr)
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
      }

      const user = newUsers[0]

      // Assign applicant role
      const { data: roles } = await supabase
        .schema('iam')
        .from('roles')
        .select('id')
        .eq('role_code', 'applicant')
        .limit(1)

      if (roles?.length) {
        await supabase.schema('iam').from('user_roles').insert({
          user_id: user.id,
          role_id: roles[0].id,
          organization_id: null,
          effective_from: new Date().toISOString(),
        })
      }

      // Create session
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString()
      await supabase.schema('iam').from('sessions').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      })

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: 'applicant',
          orgId: null,
          orgName: null,
        },
      }, { status: 201 })

      response.cookies.set('bocra-auth', token, {
        httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS,
      })

      return response
    } catch (err) {
      console.error('Register error', err)
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }
  }

  // Fallback: no Supabase configured
  return NextResponse.json({ error: 'Registration service unavailable. Please try again later.' }, { status: 503 })
}
