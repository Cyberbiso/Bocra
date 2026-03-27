import { getSupabaseAdmin } from '@/lib/supabase'
import { isRole, type Role } from '@/lib/types/roles'

export const AUTH_SESSION_COOKIE = 'bocra-auth'
export const DEMO_PASSWORD = 'bocra2026'

interface OrganisationSummary {
  id: string
  legal_name: string
  trading_name: string | null
  org_type_code: string | null
  registration_number: string | null
  status_code: string
}

export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  orgId: string | null
  orgName: string | null
  org: OrganisationSummary | null
}

export const DEMO_SESSION_USERS: Record<string, SessionUser> = {
  'demo-session-applicant': {
    id: 'demo-applicant',
    email: 'applicant@bocra.demo',
    firstName: 'Naledi',
    lastName: 'Molefe',
    role: 'applicant',
    orgId: null,
    orgName: null,
    org: null,
  },
  'demo-session-officer': {
    id: 'demo-officer',
    email: 'officer@bocra.demo',
    firstName: 'Tebogo',
    lastName: 'Kgosi',
    role: 'officer',
    orgId: null,
    orgName: null,
    org: null,
  },
  'demo-session-type-approver': {
    id: 'demo-type-approver',
    email: 'approver@bocra.demo',
    firstName: 'Lesego',
    lastName: 'Ramasu',
    role: 'type_approver',
    orgId: null,
    orgName: null,
    org: null,
  },
  'demo-session-admin': {
    id: 'demo-admin',
    email: 'admin@bocra.demo',
    firstName: 'Kabelo',
    lastName: 'Mosweu',
    role: 'admin',
    orgId: null,
    orgName: null,
    org: null,
  },
  'demo-session': {
    id: 'demo',
    email: 'demo@bocra.demo',
    firstName: 'Demo',
    lastName: 'User',
    role: 'applicant',
    orgId: null,
    orgName: null,
    org: null,
  },
}

export const DEMO_LOGIN_USERS: Record<
  string,
  { role: Role; firstName: string; lastName: string; token: string }
> = {
  'applicant@bocra.demo': {
    role: 'applicant',
    firstName: 'Naledi',
    lastName: 'Molefe',
    token: 'demo-session-applicant',
  },
  'officer@bocra.demo': {
    role: 'officer',
    firstName: 'Tebogo',
    lastName: 'Kgosi',
    token: 'demo-session-officer',
  },
  'approver@bocra.demo': {
    role: 'type_approver',
    firstName: 'Lesego',
    lastName: 'Ramasu',
    token: 'demo-session-type-approver',
  },
  'admin@bocra.demo': {
    role: 'admin',
    firstName: 'Kabelo',
    lastName: 'Mosweu',
    token: 'demo-session-admin',
  },
}

export function isDemoSessionToken(token: string | null | undefined): boolean {
  return typeof token === 'string' && token.startsWith('demo-session')
}

function allowDemoAuth(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export function extractCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${cookieName}=`))

  return match ? decodeURIComponent(match.slice(cookieName.length + 1)) : null
}

export function getAuthTokenFromRequest(request: Request): string | null {
  return extractCookieValue(request.headers.get('cookie'), AUTH_SESSION_COOKIE)
}

async function getSessionUserFromSupabase(token: string): Promise<SessionUser | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data: sessions, error: sessionError } = await supabase
    .schema('iam')
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .limit(1)

  if (sessionError || !sessions?.length) {
    return null
  }

  const session = sessions[0]
  if (new Date(session.expires_at) < new Date()) {
    await supabase.schema('iam').from('sessions').delete().eq('token', token)
    return null
  }

  const { data: users, error: userError } = await supabase
    .schema('iam')
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', session.user_id)
    .limit(1)

  if (userError || !users?.length) {
    return null
  }

  const user = users[0]

  const { data: userRoles } = await supabase
    .schema('iam')
    .from('user_roles')
    .select('role_id, organization_id')
    .eq('user_id', user.id)
    .or(`effective_to.is.null,effective_to.gt.${new Date().toISOString()}`)
    .order('effective_from', { ascending: false })
    .limit(1)

  const userRole = userRoles?.[0]
  let role: Role = 'applicant'
  let orgId: string | null = userRole?.organization_id ?? null

  if (userRole?.role_id) {
    const { data: roles } = await supabase
      .schema('iam')
      .from('roles')
      .select('role_code')
      .eq('id', userRole.role_id)
      .limit(1)

    const roleCode = roles?.[0]?.role_code
    if (isRole(roleCode)) {
      role = roleCode
    }
  }

  let org: OrganisationSummary | null = null
  if (orgId) {
    const { data: orgs } = await supabase
      .schema('iam')
      .from('organizations')
      .select('id, legal_name, trading_name, org_type_code, registration_number, status_code')
      .eq('id', orgId)
      .limit(1)

    org = orgs?.[0] ?? null
    orgId = org?.id ?? orgId
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role,
    orgId,
    orgName: org?.legal_name ?? null,
    org,
  }
}

export async function getSessionUserFromToken(token: string): Promise<SessionUser | null> {
  if (allowDemoAuth()) {
    const demoUser = DEMO_SESSION_USERS[token]
    if (demoUser) {
      return demoUser
    }
  }

  try {
    return await getSessionUserFromSupabase(token)
  } catch (error) {
    console.error('Session lookup failed', error)
    return null
  }
}

export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  const token = getAuthTokenFromRequest(request)
  if (!token) return null
  return getSessionUserFromToken(token)
}
