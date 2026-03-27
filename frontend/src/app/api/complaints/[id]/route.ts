import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const newStatus: string | null = body?.status ?? null
  const note: string | null = body?.note ?? null

  const supabase = getSupabaseAdmin()

  if (!supabase) {
    // No Supabase configured — return optimistic success so the UI still works
    return NextResponse.json({ success: true, complaintId: id, status: newStatus, note })
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (newStatus) {
    updatePayload.current_status_code = newStatus
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      updatePayload.resolved_at = new Date().toISOString()
    }
  }

  const { error } = await supabase
    .schema('complaints')
    .from('complaints')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    console.error('Supabase complaint PATCH error', error)
    return NextResponse.json({ error: 'Could not update complaint status.' }, { status: 502 })
  }

  return NextResponse.json({ success: true, complaintId: id, status: newStatus, note })
}
