import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export interface Organisation {
  id: string
  legal_name: string
  trading_name: string | null
  org_type_code: string | null
  registration_number: string | null
  status_code: string
  created_at: string
  contact_name: string | null
  contact_email: string | null
}

export interface OrganisationsResponse {
  data: Organisation[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
}

const STATUS_ORDER = ['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED']

const MOCK_ORGS: Organisation[] = [
  { id: 'm-001', legal_name: 'TechImport Botswana (Pty) Ltd', trading_name: 'TechImport BW', org_type_code: 'Private Company (Pty) Ltd', registration_number: 'BW2021/0041', status_code: 'ACTIVE',         created_at: '2026-01-10T09:00:00Z', contact_name: 'Naledi Molefe',    contact_email: 'naledi@techimport.co.bw' },
  { id: 'm-002', legal_name: 'Linkserve Botswana (Pty) Ltd',  trading_name: null,            org_type_code: 'Private Company (Pty) Ltd', registration_number: 'BW2019/0118', status_code: 'ACTIVE',         created_at: '2026-01-18T11:30:00Z', contact_name: 'Thabo Sithole',    contact_email: 'info@linkserve.co.bw'   },
  { id: 'm-003', legal_name: 'NetOne Africa Ltd',             trading_name: 'NetOne',        org_type_code: 'Public Company',            registration_number: 'BW2020/0077', status_code: 'PENDING_REVIEW', created_at: '2026-03-20T14:00:00Z', contact_name: 'Boitumelo Kgosi',  contact_email: 'bkgosi@netone.co.bw'   },
  { id: 'm-004', legal_name: 'Gaborone Electronics Ltd',      trading_name: null,            org_type_code: 'Private Company (Pty) Ltd', registration_number: null,          status_code: 'PENDING_REVIEW', created_at: '2026-03-22T08:45:00Z', contact_name: 'Mpho Seretse',     contact_email: 'mpho@gabroelectro.co.bw'},
  { id: 'm-005', legal_name: 'Digital Connect Botswana',      trading_name: 'DigiConnect',   org_type_code: 'Foreign Entity',            registration_number: 'BW2022/0203', status_code: 'SUSPENDED',      created_at: '2025-11-05T10:00:00Z', contact_name: 'James Osei',       contact_email: 'josei@digiconnect.com'  },
]

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const params   = request.nextUrl.searchParams
  const page     = Math.max(1, Number(params.get('page') ?? 1))
  const pageSize = 20
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1
  const status   = params.get('status')
  const search   = params.get('search')?.trim()

  if (supabase) {
    try {
      let q = supabase
        .schema('iam')
        .from('organizations')
        .select('id, legal_name, trading_name, org_type_code, registration_number, status_code, created_at', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

      if (status && status !== 'ALL') q = q.eq('status_code', status)
      if (search) q = q.or(`legal_name.ilike.%${search}%,trading_name.ilike.%${search}%,registration_number.ilike.%${search}%`)

      const { data: rows, count, error } = await q

      if (error) {
        console.error('Organisations query error', error)
        return NextResponse.json({ error: 'Could not load organisations.' }, { status: 502 })
      }

      const total      = count ?? 0
      const totalPages = Math.max(1, Math.ceil(total / pageSize))

      const data: Organisation[] = (rows ?? []).map((r) => ({
        id:                  String(r.id),
        legal_name:          r.legal_name,
        trading_name:        r.trading_name ?? null,
        org_type_code:       r.org_type_code ?? null,
        registration_number: r.registration_number ?? null,
        status_code:         r.status_code ?? 'PENDING_REVIEW',
        created_at:          r.created_at,
        contact_name:        null,
        contact_email:       null,
      }))

      return NextResponse.json({ data, meta: { total, page, pageSize, totalPages } } satisfies OrganisationsResponse)
    } catch (err) {
      console.error('Organisations GET error', err)
    }
  }

  // Mock fallback
  let results = [...MOCK_ORGS].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status_code) - STATUS_ORDER.indexOf(b.status_code)
  )
  if (status && status !== 'ALL') results = results.filter((o) => o.status_code === status)
  if (search) {
    const q = search.toLowerCase()
    results = results.filter((o) =>
      o.legal_name.toLowerCase().includes(q) ||
      (o.trading_name ?? '').toLowerCase().includes(q) ||
      (o.registration_number ?? '').toLowerCase().includes(q)
    )
  }
  const total = results.length
  return NextResponse.json({
    data: results.slice(from, to + 1),
    meta: { total, page, pageSize: 20, totalPages: Math.max(1, Math.ceil(total / 20)) },
  } satisfies OrganisationsResponse)
}

export async function PATCH(request: NextRequest) {
  const { id, status_code } = await request.json().catch(() => ({}))
  if (!id || !status_code) {
    return NextResponse.json({ error: 'id and status_code are required.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (supabase) {
    const { error } = await supabase
      .schema('iam')
      .from('organizations')
      .update({ status_code, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
