import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  AUTH_SESSION_COOKIE,
  buildSessionUser,
  createPortalSession,
  createSupabaseAuthUser,
  deleteSupabaseAuthUser,
  ensureApplicantRole,
  ensurePortalUser,
  getPortalUserByEmail,
  normalizeAuthEmail,
  SESSION_SECONDS,
} from '@/lib/server-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    nationalId,
    orgName,
    accountType,
    tradingName,
    registrationNumber,
  } = body ?? {}
  const normalizedEmail = typeof email === 'string' ? normalizeAuthEmail(email) : ''

  if (!normalizedEmail || !password || !firstName || !lastName || !orgName) {
    return NextResponse.json(
      { error: 'email, password, firstName, lastName and orgName are required.' },
      { status: 400 },
    )
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (supabase) {
    let createdAuthUserId: string | null = null
    let createdOrgId: string | null = null
    let createdPortalUserId: string | null = null

    try {
      const existingUser = await getPortalUserByEmail(supabase, normalizedEmail)
      if (existingUser) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }

      const authUser = await createSupabaseAuthUser({
        email: normalizedEmail,
        password,
        firstName,
        lastName,
      })

      if (!authUser) {
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
      }
      createdAuthUserId = authUser.id

      const { data: orgs, error: orgErr } = await supabase
        .schema('iam')
        .from('organizations')
        .insert({
          legal_name: orgName,
          trading_name: tradingName ?? null,
          org_type_code: accountType ?? 'PRIVATE_COMPANY',
          registration_number: registrationNumber ?? null,
          tax_number: null,
          status_code: 'PENDING_REVIEW',
        })
        .select('id')
        .limit(1)

      if (orgErr || !orgs?.length) {
        throw orgErr ?? new Error('Organisation creation failed.')
      }
      createdOrgId = orgs[0].id

      const portalUser = await ensurePortalUser(supabase, {
        id: authUser.id,
        email: normalizedEmail,
        firstName,
        lastName,
        phone: phone ?? null,
        nationalId: nationalId ?? null,
        authProvider: 'supabase',
        emailVerifiedAt: authUser.email_confirmed_at ?? new Date().toISOString(),
        statusCode: 'ACTIVE',
      })
      createdPortalUserId = portalUser.id

      await ensureApplicantRole(supabase, portalUser.id, createdOrgId)
      const { token } = await createPortalSession(supabase, portalUser.id)
      const sessionUser = await buildSessionUser(supabase, portalUser)

      await supabase
        .schema('iam')
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', portalUser.id)

      const response = NextResponse.json({
        success: true,
        user: sessionUser,
        organization: {
          id: createdOrgId,
          name: orgName,
          status: 'PENDING_REVIEW',
        },
      }, { status: 201 })

      response.cookies.set(AUTH_SESSION_COOKIE, token, {
        httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS,
      })

      return response
    } catch (err) {
      console.error('Register error', err)

      if (createdPortalUserId && createdPortalUserId === createdAuthUserId) {
        await supabase.schema('iam').from('users').delete().eq('id', createdPortalUserId)
      }
      if (createdOrgId) {
        await supabase.schema('iam').from('organizations').delete().eq('id', createdOrgId)
      }
      if (createdAuthUserId) {
        await deleteSupabaseAuthUser(createdAuthUserId)
      }

      const message = err instanceof Error ? err.message : ''
      if (/already exists|already registered|duplicate/i.test(message)) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }

      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }
  }

  // Fallback: no Supabase configured
  return NextResponse.json({ error: 'Registration service unavailable. Please try again later.' }, { status: 503 })
}
