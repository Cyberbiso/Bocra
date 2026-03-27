import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  AUTH_SESSION_COOKIE,
  DEMO_LOGIN_USERS,
  DEMO_PASSWORD,
} from '@/lib/server-auth'
import { backendFetch } from '@/lib/backend'
import { isRole } from '@/lib/types/roles'

export const runtime = 'nodejs'

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
        const dbRole = roles?.[0]?.role_code
        roleCode = isRole(dbRole) ? dbRole : 'applicant'
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

      // Also create a backend session so proxied API calls are authenticated
      try {
        const beRes = await backendFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        if (beRes.ok) {
          const beData = await beRes.json()
          const beToken = beData?.session?.token
          if (beToken) {
            response.cookies.set('bocra-session', beToken, {
              httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS,
            })
          }
        }
      } catch { /* backend unreachable — frontend session still works */ }

      return response
    } catch (err) {
      console.error('Login error', err)
      // Fall through to demo fallback
    }
  }

  // ── Demo fallback (non-production only) ────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const demoUser = DEMO_LOGIN_USERS[email.toLowerCase()]
    if (demoUser && password === DEMO_PASSWORD) {
      const { token, ...userFields } = demoUser
      const response = NextResponse.json({ success: true, user: { email, ...userFields } })
      response.cookies.set(AUTH_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_SECONDS,
      })

      // Also create a backend session for demo users
      try {
        const beRes = await backendFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        if (beRes.ok) {
          const beData = await beRes.json()
          const beToken = beData?.session?.token
          if (beToken) {
            response.cookies.set('bocra-session', beToken, {
              httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS,
            })
          }
        }
      } catch { /* backend unreachable */ }

      return response
    }
  }

  return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
}
