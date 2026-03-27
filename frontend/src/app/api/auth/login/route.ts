import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  AUTH_SESSION_COOKIE,
  allowDemoAuth,
  buildSessionUser,
  createPortalSession,
  ensureApplicantRole,
  ensurePortalUser,
  getDemoLoginUser,
  getPortalUserByEmail,
  isDemoPassword,
  normalizeAuthEmail,
  SESSION_SECONDS,
  signInWithSupabasePassword,
} from '@/lib/server-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const { email, password } = body ?? {}
  const normalizedEmail = typeof email === 'string' ? normalizeAuthEmail(email) : ''

  if (!normalizedEmail || typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const demoAuthAllowed = allowDemoAuth()
  const demoUser = getDemoLoginUser(normalizedEmail)
  const demoPasswordValid = isDemoPassword(password)

  // ── Supabase path ───────────────────────────────────────────────────────────
  if (supabase) {
    try {
      const portalUser = await getPortalUserByEmail(supabase, normalizedEmail)
      if (portalUser && (portalUser.status_code === 'INACTIVE' || portalUser.status_code === 'SUSPENDED')) {
        return NextResponse.json(
          { error: 'Your account has been disabled. Contact BOCRA support.' },
          { status: 403 },
        )
      }

      let localPasswordValid = false
      if (portalUser?.password_hash) {
        try {
          localPasswordValid = await bcrypt.compare(password, portalUser.password_hash)
        } catch {
          localPasswordValid = false
        }
      }

      const authUser = localPasswordValid ? null : await signInWithSupabasePassword(normalizedEmail, password)
      if (localPasswordValid || authUser) {
        const metadata = authUser?.user_metadata ?? {}
        const syncedUser = await ensurePortalUser(supabase, {
          id: authUser?.id,
          email: normalizedEmail,
          firstName:
            (typeof metadata.first_name === 'string' && metadata.first_name) ||
            portalUser?.first_name ||
            normalizedEmail.split('@')[0],
          lastName:
            (typeof metadata.last_name === 'string' && metadata.last_name) ||
            portalUser?.last_name ||
            '',
          phone: portalUser?.phone_e164 ?? null,
          nationalId: portalUser?.national_id ?? null,
          authProvider: authUser ? 'supabase' : portalUser?.auth_provider ?? 'local',
          emailVerifiedAt: authUser?.email_confirmed_at ?? undefined,
          statusCode: portalUser?.status_code ?? 'ACTIVE',
        })

        await ensureApplicantRole(supabase, syncedUser.id)
        const { token } = await createPortalSession(supabase, syncedUser.id)
        const sessionUser = await buildSessionUser(supabase, syncedUser)

        await supabase
          .schema('iam')
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', syncedUser.id)

        const response = NextResponse.json({
          success: true,
          user: sessionUser,
        })

        response.cookies.set(AUTH_SESSION_COOKIE, token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_SECONDS,
        })

        return response
      }

      const demoLoginValid = demoAuthAllowed && !!demoUser && demoPasswordValid
      if (!demoLoginValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }
    } catch (err) {
      console.error('Login error', err)
      // Fall through to demo fallback
    }
  }

  // ── Demo fallback ───────────────────────────────────────────────────────────
  if (demoAuthAllowed && demoUser && demoPasswordValid) {
    const { token, ...userFields } = demoUser
    if (supabase) {
      try {
        const { data: users } = await supabase
          .schema('iam')
          .from('users')
          .select('id')
          .eq('email', normalizedEmail)
          .limit(1)

        const userId = users?.[0]?.id
        if (userId) {
          const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString()
          await supabase.schema('iam').from('sessions').delete().eq('token', token)
          await supabase.schema('iam').from('sessions').insert({
            user_id: userId,
            token,
            expires_at: expiresAt,
          })
        }
      } catch (err) {
        console.warn('Demo session sync failed', err)
      }
    }
    const response = NextResponse.json({ success: true, user: { email: normalizedEmail, ...userFields } })
    response.cookies.set(AUTH_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_SECONDS,
    })

    return response
  }

  return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
}
