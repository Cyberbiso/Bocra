from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.entities import (
    Certificate,
    Complaint,
    ComplaintAttachment,
    ComplaintMessage,
    KnowledgeDocument,
    LicenseApplication,
    LicenseRecord,
    Payment,
    Receipt,
    Role,
    User,
    WorkflowApplication,
    WorkflowEvent,
)
from app.services.auth import LoginResult


def _fmt_date(value: datetime | None) -> str:
    return value.isoformat() if value else ""


def _to_date(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    return value.isoformat()


def _file_size_label(size_bytes: int) -> str:
    if size_bytes < 1024 * 1024:
        return f"{max(1, round(size_bytes / 1024))} KB"
    return f"{size_bytes / (1024 * 1024):.1f} MB"


def present_session(result: LoginResult) -> dict[str, Any]:
    return {
        "success": True,
        "session": {"token": result.access_token},
        "user": present_user(result.user, result.roles, result.permissions),
    }


def present_user(user: User, roles: list[Role], permissions: list[str]) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "phone": user.phone_e164,
        "roles": [role.role_code for role in roles],
        "permissions": sorted(set(permissions)),
    }


def present_dashboard_summary(summary: dict[str, Any]) -> dict[str, Any]:
    return summary


def present_dashboard_activity(events: list[WorkflowEvent]) -> list[dict[str, Any]]:
    records = []
    for event in events:
        module = {
            "complaint": "Complaints",
            "licence_application": "Licensing",
            "licence_record": "Licensing",
            "application": "Type Approval",
        }.get(event.resource_kind, "General")
        records.append(
            {
                "id": event.id,
                "title": event.comment or event.label,
                "module": module,
                "timestamp": event.occurred_at.isoformat(),
                "status": event.label,
                "actor": event.actor_name,
            }
        )
    return records


def present_queue_summary(summary: dict[str, int]) -> dict[str, int]:
    return summary


def present_notices(notices: list[KnowledgeDocument]) -> list[dict[str, Any]]:
    return [
        {
            "id": notice.id,
            "title": notice.title,
            "date": _to_date(notice.published_at),
            "category": notice.category or "Notice",
            "excerpt": notice.excerpt or "",
        }
        for notice in notices
    ]


def present_complaints(complaints: list[Complaint], total: int, page: int, page_size: int) -> dict[str, Any]:
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {
        "data": [
            {
                "id": complaint.id,
                "caseNumber": complaint.complaint_number,
                "subject": complaint.subject,
                "operator": complaint.service_provider_name or "",
                "category": complaint.complaint_type_code.replace("_", " ").title(),
                "status": complaint.current_status_code,
                "submittedDate": _to_date(complaint.created_at),
                "expectedResolution": _to_date(complaint.expected_resolution_at),
                "assignedOfficer": complaint.assigned_to_user_id,
                "submittedBy": complaint.complainant_user_id or "public",
            }
            for complaint in complaints
        ],
        "meta": {"total": total, "page": page, "pageSize": page_size, "totalPages": total_pages},
    }


def present_complaint_submission(
    complaint: Complaint,
    draft: dict[str, Any],
    attachments: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "message": "Complaint submitted successfully",
        "id": complaint.complaint_number,
        "status": "Received",
        "complaint": {
            "category": draft.get("category", ""),
            "operator": draft.get("operator", ""),
            "subject": draft.get("subject", ""),
            "description": draft.get("description", ""),
            "incidentDate": draft.get("incidentDate", ""),
            "name": draft.get("name", ""),
            "email": draft.get("email", ""),
            "phone": draft.get("phone", ""),
            "consentGiven": bool(draft.get("consentGiven", True)),
        },
        "attachments": attachments,
    }


def present_complaint_detail(detail: dict[str, Any], officer: User | None = None) -> dict[str, Any]:
    complaint: Complaint = detail["complaint"]
    messages: list[ComplaintMessage] = detail["messages"]
    attachments: list[ComplaintAttachment] = detail["attachments"]
    events: list[WorkflowEvent] = detail["events"]
    return {
        "id": complaint.id,
        "caseNumber": complaint.complaint_number,
        "subject": complaint.subject,
        "description": complaint.narrative,
        "operator": complaint.service_provider_name or "",
        "category": complaint.complaint_type_code.replace("_", " ").title(),
        "status": complaint.current_status_code,
        "submittedDate": _to_date(complaint.created_at),
        "expectedResolution": _to_date(complaint.expected_resolution_at),
        "location": complaint.location_text or "",
        "reportedToProvider": complaint.provider_contacted_first,
        "timeline": [
            {
                "id": event.id,
                "status": event.label,
                "date": event.occurred_at.strftime("%Y-%m-%d %H:%M"),
                "actor": event.actor_name,
                "isSystem": event.actor_role == "system",
                "comment": event.comment or "",
            }
            for event in events
        ],
        "messages": present_complaint_messages(messages),
        "attachments": [
            {
                "id": attachment.id,
                "name": attachment.file_name,
                "size": _file_size_label(attachment.size_bytes),
                "type": "pdf" if attachment.content_type == "application/pdf" else "image",
                "uploadedAt": _to_date(attachment.uploaded_at),
            }
            for attachment in attachments
        ],
        "assignedOfficer": (
            {
                "name": f"{officer.first_name} {officer.last_name}",
                "email": officer.email,
                "department": "Consumer Protection",
                "assignedDate": _to_date(complaint.updated_at),
            }
            if officer
            else None
        ),
    }


def present_complaint_messages(messages: list[ComplaintMessage]) -> list[dict[str, Any]]:
    return [
        {
            "id": message.id,
            "author": message.author_name,
            "authorRole": message.author_role,
            "content": message.body,
            "timestamp": message.created_at.strftime("%Y-%m-%d %H:%M"),
        }
        for message in messages
    ]


def present_licensing_dashboard(data: dict[str, Any]) -> dict[str, Any]:
    licences: list[LicenseRecord] = data["licences"]
    applications: list[LicenseApplication] = data["applications"]
    return {
        "licences": [
            {
                "id": record.id,
                "licenceNumber": record.licence_number,
                "licenceType": record.licence_type,
                "category": record.category,
                "status": record.status_code,
                "issueDate": _to_date(record.issue_date),
                "expiryDate": _to_date(record.expiry_date),
            }
            for record in licences
        ],
        "applications": [
            {
                "id": application.id,
                "applicationNumber": application.workflow_application_id,
                "type": application.licence_type_name,
                "category": application.category_code.replace("_", " ").title(),
                "status": "PENDING",
                "submittedDate": _to_date(application.created_at),
                "lastUpdated": _to_date(application.updated_at),
            }
            for application in applications
        ],
    }


def present_licensing_detail(data: dict[str, Any]) -> dict[str, Any]:
    record_type = data["recordType"]
    events: list[WorkflowEvent] = data["events"]
    if record_type == "licence":
        record: LicenseRecord = data["record"]
        return {
            "recordType": "licence",
            "id": record.id,
            "licenceNumber": record.licence_number,
            "licenceType": record.licence_type,
            "category": record.category,
            "subCategory": record.sub_category or "",
            "status": record.status_code,
            "issueDate": _to_date(record.issue_date),
            "expiryDate": _to_date(record.expiry_date),
            "holder": record.holder_name,
            "holderAddress": record.holder_address or "",
            "coverageArea": record.coverage_area or "",
            "frequencyBand": record.frequency_band,
            "assignedOfficer": record.assigned_officer_name or "",
            "assignedOfficerDept": record.assigned_officer_dept or "",
            "conditions": [
                {"id": "cond-1", "clause": "6.1", "description": "Submit annual compliance reports.", "compliant": True},
                {"id": "cond-2", "clause": "9.1", "description": "Pay annual fees by the due date.", "compliant": record.status_code == "ACTIVE"},
            ],
            "documents": [
                {"id": f"doc-{record.id}", "name": f"{record.licence_number} — Licence Certificate", "type": "certificate", "issuedDate": _to_date(record.issue_date), "sizeMb": 0.4},
            ],
            "history": [
                {
                    "id": event.id,
                    "date": _to_date(event.occurred_at),
                    "actor": event.actor_name,
                    "actorRole": event.actor_role,
                    "action": event.label,
                    "note": event.comment,
                }
                for event in events
            ],
        }

    record: LicenseApplication = data["record"]
    workflow: WorkflowApplication | None = data.get("workflow")
    return {
        "recordType": "application",
        "id": record.id,
        "applicationNumber": workflow.application_number if workflow else record.workflow_application_id,
        "type": record.licence_type_name,
        "category": record.category_code.replace("_", " ").title(),
        "status": workflow.current_status_code if workflow else "PENDING",
        "submittedDate": _to_date(workflow.submitted_at if workflow else record.created_at),
        "lastUpdated": _to_date(record.updated_at),
        "applicantName": record.applicant_name,
        "applicantEmail": record.applicant_email,
        "notes": workflow.description if workflow else "",
        "history": [
            {
                "id": event.id,
                "date": _to_date(event.occurred_at),
                "actor": event.actor_name,
                "actorRole": event.actor_role,
                "action": event.label,
                "note": event.comment,
            }
            for event in events
        ],
    }


def present_accreditation(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("status", "NOT_FOUND"))
    return {
        "type": data.get("type"),
        "status": status,
        "reference": data.get("reference"),
        "isValid": status == "APPROVED",
    }


def present_type_approval_search(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "total": data.get("total", 0),
        "pages": data.get("pages", 1),
        "currentPage": data.get("currentPage", 0),
        "content": data.get("content", []),
    }


def present_verification_result(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("status", "NOT_FOUND"))
    return {
        "imei": data.get("imei"),
        "status": status,
        "verified": status == "VERIFIED",
        "brand": data.get("brand"),
        "model": data.get("model"),
        "typeApprovalNumber": data.get("typeApprovalNumber"),
        "remarks": data.get("remarks"),
        "checkedAt": data.get("checkedAt"),
    }


def present_certificates(certificates: list[Certificate]) -> list[dict[str, Any]]:
    return [
        {
            "id": certificate.id,
            "certificateNumber": certificate.certificate_number,
            "type": certificate.certificate_type,
            "holder": certificate.holder_name,
            "device": certificate.device_name,
            "issueDate": _to_date(certificate.issue_date),
            "expiryDate": _to_date(certificate.expiry_date),
            "status": certificate.status_code,
            "qrToken": certificate.qr_token,
            "applicationId": certificate.application_id,
            "ownerId": certificate.owner_user_id,
        }
        for certificate in certificates
    ]


def present_certificate_verification(token: str, certificate: Certificate | None) -> dict[str, Any]:
    if not certificate:
        return {
            "token": token,
            "valid": False,
            "status": "NOT_FOUND",
            "remarks": "No certificate found for this QR token. It may be invalid, tampered with, or from a different issuer.",
            "verifiedAt": datetime.now(timezone.utc).isoformat(),
        }
    return {
        "token": token,
        "valid": certificate.status_code == "VALID",
        "certificateNumber": certificate.certificate_number,
        "type": certificate.certificate_type.replace("_", " ").title(),
        "issuedTo": certificate.holder_name,
        "device": certificate.device_name,
        "issueDate": _to_date(certificate.issue_date),
        "validUntil": _to_date(certificate.expiry_date),
        "status": certificate.status_code,
        "issuedBy": certificate.issued_by,
        "remarks": certificate.remarks,
        "verifiedAt": datetime.now(timezone.utc).isoformat(),
    }


def present_invoices(invoices: list[Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": invoice.id,
            "number": invoice.invoice_number,
            "application": invoice.application_id,
            "description": invoice.description,
            "amount": float(invoice.subtotal_amount),
            "vat": float(invoice.vat_amount),
            "dueDate": _to_date(invoice.due_date),
            "status": invoice.status_code,
        }
        for invoice in invoices
    ]


def present_payments(payments: list[Payment], invoice_lookup: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": payment.id,
            "date": _to_date(payment.paid_at),
            "invoiceNumber": invoice_lookup.get(payment.invoice_id, {}).get("invoice_number", ""),
            "service": invoice_lookup.get(payment.invoice_id, {}).get("service_name", ""),
            "amount": float(payment.amount_paid),
            "method": payment.gateway_code.replace("_", " ").title(),
            "reference": payment.gateway_reference,
            "status": payment.status_code,
        }
        for payment in payments
    ]


def present_receipts(receipts: list[Receipt], payment_lookup: dict[str, Payment], invoice_lookup: dict[str, Any]) -> list[dict[str, Any]]:
    result = []
    for receipt in receipts:
        payment = payment_lookup.get(receipt.payment_id)
        invoice = invoice_lookup.get(payment.invoice_id) if payment else None
        result.append(
            {
                "id": receipt.id,
                "number": receipt.receipt_number,
                "date": _to_date(receipt.issued_at),
                "service": invoice.service_name if invoice else "",
                "amount": float(payment.amount_paid) if payment else 0,
                "invoiceNumber": invoice.invoice_number if invoice else "",
                "filePath": receipt.file_path,
            }
        )
    return result


def present_search(results: dict[str, Any]) -> dict[str, Any]:
    return {
        "licences": [
            {
                "id": record.id,
                "clientName": record.holder_name,
                "licenceNumber": record.licence_number,
                "licenceType": record.licence_type,
                "status": record.status_code.title(),
                "expiryDate": _to_date(record.expiry_date),
            }
            for record in results["licences"]
        ],
        "certificates": [
            {
                "id": certificate.id,
                "certificateNumber": certificate.certificate_number,
                "type": certificate.certificate_type.replace("_", " ").title(),
                "issuedDate": _to_date(certificate.issue_date),
                "status": certificate.status_code.title(),
            }
            for certificate in results["certificates"]
        ],
        "typeApprovals": [
            {
                "id": record.id,
                "device": device.device_type,
                "brand": device.brand_name,
                "model": device.model_name,
                "approvalDate": _to_date(record.approval_date),
                "status": record.status_code.title(),
            }
            for record, device in results["typeApprovals"]
        ],
        "devices": [
            {
                "id": item.id,
                "imei": item.imei,
                "brand": device.brand_name if device else "",
                "model": device.model_name if device else "",
                "verificationStatus": item.verification_status_code.replace("_", " ").title(),
            }
            for item, device in results["devices"]
        ],
        "organizations": [
            {
                "id": organization.id,
                "name": organization.legal_name,
                "registrationNumber": organization.registration_number,
                "type": organization.org_type_code.replace("_", " ").title(),
                "status": organization.status_code.title(),
            }
            for organization in results["organizations"]
        ],
        "meta": results["meta"],
    }


def present_statistics(data: dict[str, Any]) -> dict[str, Any]:
    return data


def present_public_chat(data: dict[str, Any]) -> dict[str, Any]:
    return data
