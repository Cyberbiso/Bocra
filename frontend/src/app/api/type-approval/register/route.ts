import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const referenceNumber = `TAR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`

  const supabase = getSupabaseAdmin()
  if (supabase && body?.orgName) {
    try {
      const { data: orgs, error: orgErr } = await supabase
        .schema('iam')
        .from('organizations')
        .insert({
          legal_name:          body.orgName,
          trading_name:        body.tradingName ?? null,
          org_type_code:       body.accountType ?? null,
          registration_number: body.idNumber ?? null,
          tax_number:          null,
          status_code:         'PENDING_REVIEW',
        })
        .select('id')

      if (!orgErr && orgs?.length) {
        const orgId = orgs[0].id

        // Link to current user if a session cookie is present
        const token = request.cookies.get('bocra-auth')?.value
        if (token && token !== 'demo-session') {
          const { data: sessions } = await supabase
            .schema('iam')
            .from('sessions')
            .select('user_id')
            .eq('token', token)
            .limit(1)

          const userId = sessions?.[0]?.user_id
          if (userId) {
            const { data: roles } = await supabase
              .schema('iam')
              .from('roles')
              .select('id')
              .eq('role_code', 'applicant')
              .limit(1)

            if (roles?.length) {
              await supabase.schema('iam').from('user_roles').upsert(
                { user_id: userId, role_id: roles[0].id, organization_id: orgId, effective_from: new Date().toISOString() },
                { onConflict: 'user_id,role_id' }
              )
            }
          }
        }

        return NextResponse.json({ success: true, referenceNumber, orgId })
      }
    } catch (err) {
      console.error('Org registration error', err)
    }
  }

  return NextResponse.json({ success: true, referenceNumber })
}
