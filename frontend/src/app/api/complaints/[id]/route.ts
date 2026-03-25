import { NextResponse } from 'next/server'

// TODO: Replace with real queries:
// PATCH — UPDATE workflow.complaints
//   SET  status_code     = :status,
//        updated_at      = NOW(),
//        resolved_at     = CASE WHEN :status IN ('RESOLVED','CLOSED') THEN NOW() ELSE resolved_at END
//   WHERE id = :id
// INSERT INTO workflow.complaint_notes (complaint_id, officer_id, note, created_at)
//   VALUES (:id, :officerId, :note, NOW())

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null)

  return NextResponse.json({
    success: true,
    complaintId: id,
    status: body?.status ?? null,
    note: body?.note ?? null,
  })
}
