import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// Demo user map for fallback when Supabase is unavailable
const DEMO_SESSIONS: Record<string, { id: string; email: string; firstName: string; lastName: string; role: string; orgId: null; orgName: null }> = {
  'demo-session-applicant': { id: 'demo-applicant', email: 'applicant@bocra.demo', firstName: 'Naledi',  lastName: 'Molefe', role: 'applicant', orgId: null, orgName: null },
  'demo-session-officer':   { id: 'demo-officer',   email: 'officer@bocra.demo',   firstName: 'Tebogo',  lastName: 'Kgosi',  role: 'officer',   orgId: null, orgName: null },
  'demo-session-admin':     { id: 'demo-admin',     email: 'admin@bocra.demo',     firstName: 'Kabelo',  lastName: 'Mosweu', role: 'admin',     orgId: null, orgName: null },
  // legacy token kept for backward compat
  'demo-session':           { id: 'demo', email: 'demo@bocra.demo', firstName: 'Demo', lastName: 'User', role: 'applicant', orgId: null, orgName: null },
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('bocra-auth')?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  if (supabase && token !== 'demo-session') {
    try {
      // 1. Validate session
      const { data: sessions, error: sessErr } = await supabase
        .schema('iam')
        .from('sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .limit(1)

      if (sessErr || !sessions?.length) {
        return NextResponse.json({ error: 'Session invalid or expired.' }, { status: 401 })
      }

      const session = sessions[0]

      if (new Date(session.expires_at) < new Date()) {
        await supabase.schema('iam').from('sessions').delete().eq('token', token)
        return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
      }

      // 2. Get user
      const { data: users, error: userErr } = await supabase
        .schema('iam')
        .from('users')
        .select('id, email, first_name, last_name, status_code')
        .eq('id', session.user_id)
        .limit(1)

      if (userErr || !users?.length) {
        return NextResponse.json({ error: 'User not found.' }, { status: 401 })
      }

      const user = users[0]

      // 3. Get active role + org
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
          .select('id, legal_name, trading_name, org_type_code, registration_number, status_code')
          .eq('id', orgId)
          .limit(1)
        orgName = orgs?.[0]?.legal_name ?? null

        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: roleCode,
            orgId,
            orgName,
            org: orgs?.[0] ?? null,
          },
        })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: roleCode,
          orgId: null,
          orgName: null,
          org: null,
        },
      })
    } catch (err) {
      console.error('Me route error', err)
      return NextResponse.json({ error: 'Failed to load session.' }, { status: 500 })
    }
  }

  // Demo fallback
  const demoUser = DEMO_SESSIONS[token]
  if (demoUser) {
    return NextResponse.json({ user: demoUser })
  }

  return NextResponse.json({ error: 'Session invalid.' }, { status: 401 })
}
