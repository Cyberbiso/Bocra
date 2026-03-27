import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// Demo password for seed users whose password_hash is null (auth_provider: 'supabase')
const DEMO_PASSWORD = 'bocra2026'

// Session duration: 24 hours
const SESSION_SECONDS = 60 * 60 * 24

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const { email, password } = body ?? {}

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // ── Supabase path ───────────────────────────────────────────────────────────
  if (supabase) {
    try {
      // 1. Look up user by email
      const { data: users, error: userErr } = await supabase
        .schema('iam')
        .from('users')
        .select('id, email, first_name, last_name, password_hash, auth_provider, status_code')
        .eq('email', email.toLowerCase().trim())
        .limit(1)

      if (userErr || !users?.length) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }

      const user = users[0]

      if (user.status_code === 'INACTIVE' || user.status_code === 'SUSPENDED') {
        return NextResponse.json({ error: 'Your account has been disabled. Contact BOCRA support.' }, { status: 403 })
      }

      // 2. Verify password
      const passwordValid = user.password_hash
        ? await bcrypt.compare(password, user.password_hash)
        : password === DEMO_PASSWORD // demo seed users have no hash

      if (!passwordValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }

      // 3. Get role + org via user_roles → roles + organizations
      const { data: userRoles } = await supabase
        .schema('iam')
        .from('user_roles')
        .select('role_id, organization_id')
        .eq('user_id', user.id)
        .or('effective_to.is.null,effective_to.gt.' + new Date().toISOString())
        .order('effective_from', { ascending: false })
        .limit(1)

      const userRole = userRoles?.[0]
      let roleCode = 'applicant'
      let orgId: string | null = userRole?.organization_id ?? null
      let orgName: string | null = null

      if (userRole?.role_id) {
        const { data: roles } = await supabase
          .schema('iam')
          .from('roles')
          .select('role_code')
          .eq('id', userRole.role_id)
          .limit(1)
        roleCode = roles?.[0]?.role_code ?? 'applicant'
      }

      if (orgId) {
        const { data: orgs } = await supabase
          .schema('iam')
          .from('organizations')
          .select('legal_name')
          .eq('id', orgId)
          .limit(1)
        orgName = orgs?.[0]?.legal_name ?? null
      }

      // 4. Create session
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString()

      await supabase
        .schema('iam')
        .from('sessions')
        .insert({ user_id: user.id, token, expires_at: expiresAt })

      // 5. Update last_login_at
      await supabase
        .schema('iam')
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: roleCode,
          orgId,
          orgName,
        },
      })

      response.cookies.set('bocra-auth', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_SECONDS,
      })

      return response
    } catch (err) {
      console.error('Login error', err)
      // Fall through to demo fallback
    }
  }

  // ── Demo fallback (no Supabase) ─────────────────────────────────────────────
  const DEMO_USERS: Record<string, { role: string; firstName: string; lastName: string; token: string }> = {
    'applicant@bocra.demo': { role: 'applicant', firstName: 'Naledi',  lastName: 'Molefe', token: 'demo-session-applicant' },
    'officer@bocra.demo':   { role: 'officer',   firstName: 'Tebogo',  lastName: 'Kgosi',  token: 'demo-session-officer'   },
    'admin@bocra.demo':     { role: 'admin',      firstName: 'Kabelo',  lastName: 'Mosweu', token: 'demo-session-admin'     },
  }

  const demoUser = DEMO_USERS[email.toLowerCase()]
  if (demoUser && password === DEMO_PASSWORD) {
    const { token, ...userFields } = demoUser
    const response = NextResponse.json({ success: true, user: { email, ...userFields } })
    response.cookies.set('bocra-auth', token, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS,
    })
    return response
  }

  return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
}
