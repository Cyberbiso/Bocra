import { NextResponse } from 'next/server'
import { getSessionUserFromRequest } from '@/lib/server-auth'
import { canReviewTypeApproval } from '@/lib/types/roles'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  if (!canReviewTypeApproval(user.role)) {
    return NextResponse.json({ error: 'Type approver or admin role required.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)

  // TODO: Update workflow.application_tasks record:
  //   SET assigned_to_user_id = :assignedTo,
  //       due_at              = :dueAt,
  //       priority_code       = :priority,
  //       assignment_note     = :note,
  //       assigned_at         = NOW(),
  //       updated_at          = NOW()
  //   WHERE application_id = :id
  //     AND task_type_code = 'REVIEW'
  // TODO: Notify assigned officer via iam.notifications

  return NextResponse.json({
    success: true,
    applicationId: id,
    assignedTo: body?.assignedTo ?? null,
    priority: body?.priority ?? 'NORMAL',
  })
}
