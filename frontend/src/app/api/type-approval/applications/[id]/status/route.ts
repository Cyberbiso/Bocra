import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null)

  const supabase = getSupabaseAdmin()
  if (supabase && body?.status) {
    const update: Record<string, unknown> = {
      current_status_code: body.status,
      updated_at: new Date().toISOString(),
    }
    if (body.stage) update.current_stage_code = body.stage
    if (body.status === 'APPROVED') update.decided_at = new Date().toISOString()

    const { error } = await supabase
      .schema('workflow')
      .from('applications')
      .update(update)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Could not update application status.' }, { status: 502 })
    }
  }

  return NextResponse.json({ success: true, applicationId: id, status: body?.status, stage: body?.stage, remarks: body?.remarks })
}
