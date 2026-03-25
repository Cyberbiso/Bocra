import { NextResponse } from 'next/server'

// TODO: Replace with real queries:
// PATCH — UPDATE workflow.applications
//   SET  current_status_code = :status,
//        current_stage_code  = :stage,
//        updated_at          = NOW(),
//        decided_at          = CASE WHEN :status = 'APPROVED' THEN NOW() ELSE decided_at END
//   WHERE id = :id
// INSERT INTO workflow.application_decisions (application_id, officer_id, status_code, stage_code, remarks, decided_at)
//   VALUES (:id, :officerId, :status, :stage, :remarks, NOW())
// If status = 'APPROVED':
//   INSERT INTO docs.certificates (...) VALUES (...)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null)

  return NextResponse.json({
    success: true,
    applicationId: id,
    status: body?.status ?? null,
    stage: body?.stage ?? null,
    remarks: body?.remarks ?? null,
  })
}
