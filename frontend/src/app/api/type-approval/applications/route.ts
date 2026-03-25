import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const _body = await request.json().catch(() => null)

  // TODO: Validate payload with zod schema
  // TODO: Insert into workflow.applications with:
  //       application_type_code = 'TYPE_APPROVAL'
  //       service_module_code   = 'TYPE_APPROVAL'
  //       current_status_code   = 'PENDING'
  //       submitted_by          = :current_user_id
  // TODO: Insert into device.type_approval_applications with:
  //       device_model_id, customer_accreditation_id,
  //       manufacturer_accreditation_id, repair_accreditation_id,
  //       sample_imei, technical_spec_json
  // TODO: Insert into workflow.application_documents for each uploaded file:
  //       document_type_code, file_ref (object storage path), is_required
  // TODO: Trigger confirmation email to applicant with reference number

  const applicationNumber = `TA-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`
  const mockId = `app-${Date.now()}`

  return NextResponse.json({ success: true, applicationNumber, id: mockId })
}
