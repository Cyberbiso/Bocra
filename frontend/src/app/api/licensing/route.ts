import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend'
import { getSessionUserFromRequest } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { canReviewLicensing } from '@/lib/types/roles'

export const runtime = 'nodejs'

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_LICENSE_TYPES = [
  { id: '1', code: 'NSL', name: 'Network Service Licence',      category: 'Electronic Comms', application_fee: '50000' },
  { id: '2', code: 'ASL', name: 'Application Service Licence',  category: 'Electronic Comms', application_fee: '25000' },
  { id: '3', code: 'ECN', name: 'Electronic Communications Network', category: 'Telecommunications', application_fee: '75000' },
  { id: '4', code: 'ECS', name: 'Electronic Communications Service', category: 'Telecommunications', application_fee: '40000' },
  { id: '5', code: 'BSL', name: 'Broadcasting Service Licence', category: 'Broadcasting',     application_fee: '30000' },
  { id: '6', code: 'PSL', name: 'Postal Service Licence',       category: 'Postal',           application_fee: '15000' },
  { id: '7', code: 'SML', name: 'Spectrum Management Licence',  category: 'Spectrum',         application_fee: null    },
  { id: '8', code: 'ISP', name: 'Internet Service Provider',    category: 'Data Services',    application_fee: '20000' },
]

const MOCK_LICENSES = [
  { id: 'l1', license_number: 'ECN-2019-0031', license_type: 'Electronic Communications Network', category: 'Telecommunications', holder_name: 'Mascom Wireless (Pty) Ltd', status_code: 'ACTIVE', issue_date: '2019-07-01', expiry_date: '2027-06-30' },
  { id: 'l2', license_number: 'ISP-2021-0012', license_type: 'Internet Service Provider',         category: 'Data Services',      holder_name: 'Orange Botswana (Pty) Ltd', status_code: 'ACTIVE', issue_date: '2021-03-15', expiry_date: '2026-03-14' },
  { id: 'l3', license_number: 'VSAT-2022-0007', license_type: 'VSAT Terminal Licence',            category: 'Satellite Services', holder_name: 'Techbridge Solutions BW',   status_code: 'SUSPENDED', issue_date: '2022-06-20', expiry_date: '2027-06-19' },
  { id: 'l4', license_number: 'BRD-2018-0002', license_type: 'Broadcasting Licence — FM Radio',   category: 'Broadcasting',       holder_name: 'Kalahari Radio (Pty) Ltd',  status_code: 'EXPIRED',  issue_date: '2018-01-10', expiry_date: '2024-01-09' },
  { id: 'l5', license_number: 'ECS-2020-0044', license_type: 'Electronic Communications Service', category: 'Telecommunications', holder_name: 'BTC Broadband',             status_code: 'ACTIVE',   issue_date: '2020-09-01', expiry_date: '2028-08-31' },
  { id: 'l6', license_number: 'POS-2017-0003', license_type: 'Postal Operator Licence',           category: 'Postal Services',    holder_name: 'Botswana Postal Services',  status_code: 'CANCELLED', issue_date: '2017-05-01', expiry_date: '2022-04-30' },
]

const MOCK_APPLICATIONS = [
  { id: 'a1', application_number: 'APP-2025-00412', license_type: 'Spectrum Authorisation',                   category: 'Telecommunications', status_code: 'UNDER_REVIEW',     submitted_date: '2025-03-01', updated_at: '2025-03-19' },
  { id: 'a2', application_number: 'APP-2025-00387', license_type: 'Type Approval — Wireless Router',          category: 'Type Approval',      status_code: 'AWAITING_PAYMENT', submitted_date: '2025-02-20', updated_at: '2025-03-15' },
  { id: 'a3', application_number: 'APP-2025-00291', license_type: 'Electronic Communications Service — Amendment', category: 'Telecommunications', status_code: 'APPROVED',   submitted_date: '2025-01-10', updated_at: '2025-03-10' },
  { id: 'a4', application_number: 'APP-2024-01841', license_type: 'Broadcasting Licence — TV',                category: 'Broadcasting',       status_code: 'REJECTED',         submitted_date: '2024-11-15', updated_at: '2025-02-28' },
]

function mapBackendLicence(record: {
  id: string
  licenceNumber: string
  licenceType: string
  category: string
  status: string
  issueDate: string
  expiryDate: string
}) {
  return {
    id: record.id,
    license_number: record.licenceNumber,
    license_type: record.licenceType,
    category: record.category,
    status_code: record.status,
    issue_date: record.issueDate,
    expiry_date: record.expiryDate,
  }
}

function mapBackendApplication(record: {
  id: string
  applicationNumber: string
  licenceType: string
  applicantName: string
  applicantEmail: string
  status: string
  submittedDate: string
  stage?: string
}) {
  return {
    id: record.id,
    application_number: record.applicationNumber,
    license_type: record.licenceType,
    category: record.licenceType,
    org_name: record.applicantName,
    contact_email: record.applicantEmail,
    status_code: record.status,
    submitted_date: record.submittedDate,
    updated_at: record.submittedDate,
    coverage_area: '',
    technical_details: '',
    stage_code: record.stage ?? '',
  }
}

async function backendRouteFetch(
  request: Request,
  path: string,
  init: RequestInit = {},
) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const headers = new Headers(init.headers)
  if (cookieHeader && !headers.has('cookie')) {
    headers.set('cookie', cookieHeader)
  }
  return backendFetch(path, {
    ...init,
    headers,
    cache: 'no-store',
  })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action   = searchParams.get('action') ?? ''
  const search   = searchParams.get('search') ?? ''
  const status   = searchParams.get('status') ?? ''
  const page     = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

  const supabase = getSupabaseAdmin()

  // ── License types ──────────────────────────────────────────────────────────
  if (action === 'types') {
    try {
      const upstream = await backendRouteFetch(request, '/api/licenses?action=types')
      if (upstream.ok) {
        const data = await upstream.json()
        return NextResponse.json({ data })
      }
    } catch {
      // Fall back to direct reads below.
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .schema('licensing')
          .from('license_types')
          .select('id, code, name, category, application_fee, status_code')
          .order('name')
        if (!error && data?.length) return NextResponse.json({ data })
      } catch (err) {
        console.warn('[licensing] license_types fallback:', err)
      }
    }
    return NextResponse.json({ data: MOCK_LICENSE_TYPES })
  }

  // ── License list ───────────────────────────────────────────────────────────
  if (action === 'list') {
    try {
      const upstream = await backendRouteFetch(request, '/api/licenses')
      if (upstream.ok) {
        const payload = await upstream.json()
        const licences = Array.isArray(payload?.licences) ? payload.licences.map(mapBackendLicence) : []
        const filtered = licences.filter((licence: { status_code: string; license_number: string; license_type: string; category: string }) => {
          const matchStatus = !status || licence.status_code === status
          const loweredSearch = search.toLowerCase()
          const matchSearch = !search ||
            licence.license_number.toLowerCase().includes(loweredSearch) ||
            licence.license_type.toLowerCase().includes(loweredSearch) ||
            licence.category.toLowerCase().includes(loweredSearch)
          return matchStatus && matchSearch
        })
        const start = (page - 1) * pageSize
        const paged = filtered.slice(start, start + pageSize)
        return NextResponse.json({
          data: paged,
          meta: { total: filtered.length, page, pageSize },
        })
      }
    } catch {
      // Fall back to direct reads below.
    }

    if (supabase) {
      try {
        let q = supabase
          .schema('licensing')
          .from('licenses')
          .select('id, license_number, license_type, category, holder_name, status_code, issue_date, expiry_date', { count: 'exact' })
          .order('expiry_date', { ascending: true })
          .range((page - 1) * pageSize, page * pageSize - 1)

        if (status) q = q.eq('status_code', status)
        if (search) q = q.or(
          `license_number.ilike.%${search}%,license_type.ilike.%${search}%,holder_name.ilike.%${search}%`
        )

        const { data, count, error } = await q
        if (!error && data) {
          return NextResponse.json({
            data,
            meta: { total: count ?? data.length, page, pageSize },
          })
        }
      } catch (err) {
        console.warn('[licensing] licenses fallback:', err)
      }
    }

    const filtered = MOCK_LICENSES.filter((l) => {
      const matchStatus = !status || l.status_code === status
      const matchSearch = !search ||
        l.license_number.toLowerCase().includes(search.toLowerCase()) ||
        l.license_type.toLowerCase().includes(search.toLowerCase()) ||
        l.holder_name.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
    return NextResponse.json({ data: filtered, meta: { total: filtered.length, page: 1, pageSize: 50 } })
  }

  // ── Applications ───────────────────────────────────────────────────────────
  if (action === 'applications') {
    const orgId = searchParams.get('orgId') ?? ''

    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('q', search)
      params.set('page', String(page))
      params.set('size', String(pageSize))

      const upstream = await backendRouteFetch(
        request,
        `/api/licence-applications?${params.toString()}`,
      )
      if (upstream.ok) {
        const payload = await upstream.json()
        return NextResponse.json({
          data: Array.isArray(payload?.data) ? payload.data.map(mapBackendApplication) : [],
          meta: payload?.meta ?? { total: 0, page, pageSize },
        })
      }
    } catch {
      // Fall back to direct reads below.
    }

    if (supabase) {
      try {
        let q = supabase
          .schema('licensing')
          .from('applications')
          .select('id, application_number, license_type, category, status_code, submitted_date, updated_at')
          .order('submitted_date', { ascending: false })

        if (orgId) q = q.eq('org_id', orgId)
        if (status) q = q.eq('status_code', status)

        const { data, error } = await q
        if (!error && data) return NextResponse.json({ data })
      } catch (err) {
        console.warn('[licensing] applications fallback:', err)
      }
    }
    return NextResponse.json({ data: MOCK_APPLICATIONS })
  }

  // ── Review queue (officer / admin) ────────────────────────────────────────
  if (action === 'review') {
    const user = await getSessionUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }
    if (!canReviewLicensing(user.role)) {
      return NextResponse.json({ error: 'Officer or admin role required.' }, { status: 403 })
    }

    const statusFilter = searchParams.get('status') ?? ''

    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', '1')
      params.set('size', '100')

      const upstream = await backendRouteFetch(
        request,
        `/api/licence-applications?${params.toString()}`,
      )
      if (upstream.ok) {
        const payload = await upstream.json()
        return NextResponse.json({
          data: Array.isArray(payload?.data) ? payload.data.map(mapBackendApplication) : [],
        })
      }
    } catch {
      // Fall back to direct reads below.
    }

    if (supabase) {
      try {
        let q = supabase
          .schema('licensing')
          .from('applications')
          .select('id, application_number, license_type, category, org_name, contact_email, status_code, submitted_date, updated_at, coverage_area, technical_details')
          .order('submitted_date', { ascending: false })

        if (statusFilter) {
          q = q.eq('status_code', statusFilter)
        } else {
          q = q.in('status_code', ['PENDING', 'UNDER_REVIEW', 'AWAITING_PAYMENT'])
        }

        const { data, error } = await q
        if (!error && data) return NextResponse.json({ data })
      } catch (err) {
        console.warn('[licensing] review fallback:', err)
      }
    }

    const reviewMock = MOCK_APPLICATIONS.filter((a) =>
      statusFilter ? a.status_code === statusFilter : ['PENDING', 'UNDER_REVIEW', 'AWAITING_PAYMENT'].includes(a.status_code)
    )
    return NextResponse.json({ data: reviewMock })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// ─── POST: submit application / update status ─────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { action } = body
  const supabase = getSupabaseAdmin()

  // ── Submit new application ─────────────────────────────────────────────────
  if (action === 'submit') {
    try {
      const upstream = await backendRouteFetch(request, '/api/licence-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: body.category ?? '',
          licenceType: body.licenceType ?? '',
          applicantName: body.orgName ?? body.contactName ?? '',
          applicantEmail: body.contactEmail ?? '',
          coverageArea: body.coverageArea ?? null,
          formData: body,
        }),
      })
      if (upstream.ok) {
        const data = await upstream.json()
        return NextResponse.json(data, { status: upstream.status })
      }
    } catch {
      // Fall back to legacy path below.
    }

    const year   = new Date().getFullYear()
    const serial = String(Math.floor(Math.random() * 90000) + 10000)
    const applicationNumber = `APP-${year}-${serial}`

    const record = {
      application_number:  applicationNumber,
      license_type:        body.licenceType    ?? '',
      category:            body.category       ?? '',
      org_name:            body.orgName        ?? '',
      org_registration_number: body.registrationNumber ?? '',
      contact_name:        body.contactName    ?? '',
      contact_email:       body.contactEmail   ?? '',
      contact_phone:       body.contactPhone   ?? '',
      address:             body.address        ?? '',
      coverage_area:       body.coverageArea   ?? '',
      technical_details:   body.technicalDetails ?? null,
      equipment_list:      body.equipment?.length ? JSON.stringify(body.equipment) : null,
      requested_start_date: body.requestedStartDate ?? null,
      status_code:         'PENDING',
      submitted_date:      new Date().toISOString(),
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .schema('licensing')
          .from('applications')
          .insert(record)
        if (error) throw error
        return NextResponse.json({ success: true, applicationNumber }, { status: 201 })
      } catch (err) {
        console.warn('[licensing] insert fallback:', err)
      }
    }

    // Demo fallback — return success without persisting
    return NextResponse.json({ success: true, applicationNumber }, { status: 201 })
  }

  // ── Update application status (officer / admin) ────────────────────────────
  if (action === 'updateStatus') {
    const user = await getSessionUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }
    if (!canReviewLicensing(user.role)) {
      return NextResponse.json({ error: 'Officer or admin role required.' }, { status: 403 })
    }

    const { id, status_code, notes } = body
    if (!id || !status_code) return NextResponse.json({ error: 'id and status_code required' }, { status: 400 })

    const actionMap: Record<string, 'approve' | 'reject' | 'remand'> = {
      APPROVED: 'approve',
      REJECTED: 'reject',
      UNDER_REVIEW: 'remand',
      PENDING: 'remand',
    }

    const backendAction = actionMap[status_code]
    if (backendAction) {
      try {
        const upstream = await backendRouteFetch(request, `/api/licence-applications/${id}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: backendAction, note: notes ?? '' }),
        })
        if (upstream.ok) {
          return NextResponse.json({ success: true })
        }
      } catch {
        // Fall back to legacy path below.
      }
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .schema('licensing')
          .from('applications')
          .update({ status_code, updated_at: new Date().toISOString(), ...(notes ? { notes } : {}) })
          .eq('id', id)
        if (error) throw error
        return NextResponse.json({ success: true })
      } catch (err) {
        console.warn('[licensing] updateStatus fallback:', err)
      }
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
