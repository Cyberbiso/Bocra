import { randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isRole, type Role } from '@/lib/types/roles'

export const AUTH_SESSION_COOKIE = 'bocra-auth'
export const DEMO_PASSWORDS = ['bocra2026', 'Password123!'] as const
export const DEMO_PASSWORD = DEMO_PASSWORDS[0]
export const SESSION_SECONDS = 60 * 60 * 24

type SupabaseAdminClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>

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

export interface PortalUserRecord {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_e164: string | null
  national_id: string | null
  status_code: string
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

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getDemoLoginUser(email: string | null | undefined) {
  if (!email) return undefined
  return DEMO_LOGIN_USERS[normalizeAuthEmail(email)]
}

export function isDemoPassword(password: string): boolean {
  return DEMO_PASSWORDS.includes(password as (typeof DEMO_PASSWORDS)[number])
}

export function allowDemoAuth(): boolean {
  const explicitSetting = process.env.ALLOW_DEMO_AUTH?.toLowerCase()
  if (explicitSetting === 'false') return false
  if (explicitSetting === 'true') return true

  // Keep the seeded demo accounts available for judging and local demos unless
  // the deployment explicitly opts out.
  return true
}

export function isDemoSessionToken(token: string | null | undefined): boolean {
  return typeof token === 'string' && token.startsWith('demo-session')
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

function getSupabaseAuthApiKey(): string | null {
  return process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

export async function signInWithSupabasePassword(
  email: string,
  password: string,
): Promise<{
  id: string
  email: string
  user_metadata?: Record<string, unknown>
  email_confirmed_at?: string | null
} | null> {
  const url = process.env.SUPABASE_URL
  const apiKey = getSupabaseAuthApiKey()
  if (!url || !apiKey) return null

  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })

    if (!response.ok) return null
    const payload = await response.json().catch(() => null)
    return payload?.user ?? null
  } catch (error) {
    console.error('Supabase password sign-in failed', error)
    return null
  }
}

export async function createSupabaseAuthUser(input: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<{
  id: string
  email: string
  user_metadata?: Record<string, unknown>
  email_confirmed_at?: string | null
} | null> {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  try {
    const response = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          first_name: input.firstName,
          last_name: input.lastName,
        },
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null)
      const message = errorPayload?.msg || errorPayload?.message || `Supabase create user failed (${response.status})`
      throw new Error(message)
    }

    return await response.json()
  } catch (error) {
    console.error('Supabase auth user creation failed', error)
    throw error
  }
}

export async function deleteSupabaseAuthUser(userId: string): Promise<void> {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey || !userId) return

  try {
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
    })
  } catch (error) {
    console.error('Supabase auth user cleanup failed', error)
  }
}

export async function getPortalUserByEmail(
  supabase: SupabaseAdminClient,
  email: string,
): Promise<(PortalUserRecord & { password_hash: string | null; auth_provider: string | null }) | null> {
  const { data: users, error } = await supabase
    .schema('iam')
    .from('users')
    .select('id, email, first_name, last_name, phone_e164, national_id, status_code, password_hash, auth_provider')
    .eq('email', normalizeAuthEmail(email))
    .limit(1)

  if (error) throw error
  return users?.[0] ?? null
}

export async function ensurePortalUser(
  supabase: SupabaseAdminClient,
  profile: {
    id?: string | null
    email: string
    firstName: string
    lastName: string
    phone?: string | null
    nationalId?: string | null
    authProvider?: string
    passwordHash?: string | null
    emailVerifiedAt?: string | null
    statusCode?: string
  },
): Promise<PortalUserRecord> {
  const existing = await getPortalUserByEmail(supabase, profile.email)

  if (existing) {
    const updates: Record<string, unknown> = {}
    if (profile.firstName && profile.firstName !== existing.first_name) updates.first_name = profile.firstName
    if (profile.lastName && profile.lastName !== existing.last_name) updates.last_name = profile.lastName
    if (profile.phone !== undefined && profile.phone !== existing.phone_e164) updates.phone_e164 = profile.phone
    if (profile.nationalId !== undefined && profile.nationalId !== existing.national_id) {
      updates.national_id = profile.nationalId
    }
    if (profile.authProvider && profile.authProvider !== existing.auth_provider) {
      updates.auth_provider = profile.authProvider
    }
    if (profile.passwordHash !== undefined && profile.passwordHash !== existing.password_hash) {
      updates.password_hash = profile.passwordHash
    }
    if (profile.emailVerifiedAt !== undefined) updates.email_verified_at = profile.emailVerifiedAt
    if (profile.statusCode && profile.statusCode !== existing.status_code) updates.status_code = profile.statusCode

    if (Object.keys(updates).length > 0) {
      const { data: updatedUsers, error } = await supabase
        .schema('iam')
        .from('users')
        .update(updates)
        .eq('id', existing.id)
        .select('id, email, first_name, last_name, phone_e164, national_id, status_code')
        .limit(1)

      if (error || !updatedUsers?.length) {
        throw error ?? new Error('Unable to update portal user.')
      }
      return updatedUsers[0]
    }

    return {
      id: existing.id,
      email: existing.email,
      first_name: existing.first_name,
      last_name: existing.last_name,
      phone_e164: existing.phone_e164,
      national_id: existing.national_id,
      status_code: existing.status_code,
    }
  }

  const insertPayload: Record<string, unknown> = {
    email: normalizeAuthEmail(profile.email),
    first_name: profile.firstName,
    last_name: profile.lastName,
    phone_e164: profile.phone ?? null,
    national_id: profile.nationalId ?? null,
    auth_provider: profile.authProvider ?? 'local',
    status_code: profile.statusCode ?? 'ACTIVE',
  }

  if (profile.id) insertPayload.id = profile.id
  if (profile.passwordHash !== undefined) insertPayload.password_hash = profile.passwordHash
  if (profile.emailVerifiedAt !== undefined) insertPayload.email_verified_at = profile.emailVerifiedAt

  const { data: newUsers, error } = await supabase
    .schema('iam')
    .from('users')
    .insert(insertPayload)
    .select('id, email, first_name, last_name, phone_e164, national_id, status_code')
    .limit(1)

  if (error || !newUsers?.length) {
    throw error ?? new Error('Unable to create portal user.')
  }

  return newUsers[0]
}

async function getRoleIdByCode(supabase: SupabaseAdminClient, roleCode: Role): Promise<string | null> {
  const { data: roles, error } = await supabase
    .schema('iam')
    .from('roles')
    .select('id')
    .eq('role_code', roleCode)
    .limit(1)

  if (error) throw error
  return roles?.[0]?.id ?? null
}

export async function ensureApplicantRole(
  supabase: SupabaseAdminClient,
  userId: string,
  organizationId: string | null = null,
): Promise<void> {
  const roleId = await getRoleIdByCode(supabase, 'applicant')
  if (!roleId) return

  const nowIso = new Date().toISOString()
  const { data: existingRoles, error } = await supabase
    .schema('iam')
    .from('user_roles')
    .select('id, organization_id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .or(`effective_to.is.null,effective_to.gt.${nowIso}`)
    .limit(1)

  if (error) throw error

  if (existingRoles?.length) {
    const existingRole = existingRoles[0]
    if (organizationId && !existingRole.organization_id) {
      await supabase
        .schema('iam')
        .from('user_roles')
        .update({ organization_id: organizationId })
        .eq('id', existingRole.id)
    }
    return
  }

  const { error: insertError } = await supabase
    .schema('iam')
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId,
      organization_id: organizationId,
      effective_from: nowIso,
    })

  if (insertError) throw insertError
}

async function getRoleContext(
  supabase: SupabaseAdminClient,
  userId: string,
): Promise<Pick<SessionUser, 'role' | 'orgId' | 'orgName' | 'org'>> {
  const { data: userRoles, error: userRoleError } = await supabase
    .schema('iam')
    .from('user_roles')
    .select('role_id, organization_id')
    .eq('user_id', userId)
    .or(`effective_to.is.null,effective_to.gt.${new Date().toISOString()}`)
    .order('effective_from', { ascending: false })
    .limit(1)

  if (userRoleError) throw userRoleError

  const userRole = userRoles?.[0]
  let role: Role = 'applicant'
  let orgId: string | null = userRole?.organization_id ?? null
  let org: OrganisationSummary | null = null

  if (userRole?.role_id) {
    const { data: roles, error: roleError } = await supabase
      .schema('iam')
      .from('roles')
      .select('role_code')
      .eq('id', userRole.role_id)
      .limit(1)

    if (roleError) throw roleError
    const roleCode = roles?.[0]?.role_code
    if (isRole(roleCode)) {
      role = roleCode
    }
  }

  if (orgId) {
    const { data: orgs, error: orgError } = await supabase
      .schema('iam')
      .from('organizations')
      .select('id, legal_name, trading_name, org_type_code, registration_number, status_code')
      .eq('id', orgId)
      .limit(1)

    if (orgError) throw orgError
    org = orgs?.[0] ?? null
    orgId = org?.id ?? orgId
  }

  return {
    role,
    orgId,
    orgName: org?.legal_name ?? null,
    org,
  }
}

export async function buildSessionUser(
  supabase: SupabaseAdminClient,
  user: PortalUserRecord,
): Promise<SessionUser> {
  const context = await getRoleContext(supabase, user.id)
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    ...context,
  }
}

export async function createPortalSession(
  supabase: SupabaseAdminClient,
  userId: string,
): Promise<{ token: string; expiresAt: string }> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString()

  const { error } = await supabase
    .schema('iam')
    .from('sessions')
    .insert({ user_id: userId, token, expires_at: expiresAt })

  if (error) throw error

  return { token, expiresAt }
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
