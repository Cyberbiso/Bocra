import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const _body = await request.json().catch(() => null)

  // TODO: Validate payload with zod schema
  // TODO: Create record in iam.organizations (status_code = 'PENDING_REVIEW')
  // TODO: Create record in iam.users (email_verified = false)
  // TODO: Create record in iam.organization_members linking user to org
  // TODO: Trigger email verification workflow for the primary contact
  // TODO: Create record in workflow.applications with
  //       service_module_code = 'TYPE_APPROVAL_REGISTRATION'
  // TODO: Upload supporting documents to object storage and store refs

  const referenceNumber = `TAR-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`

  return NextResponse.json({ success: true, referenceNumber })
}
