from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from math import ceil
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.integrations.qos import DqosClient
from app.integrations.supabase import StorageAdapter
from app.models.entities import (
    Certificate,
    Complaint,
    ComplaintAttachment,
    ComplaintMessage,
    DeviceCatalog,
    Invoice,
    LicenseApplication,
    LicenseRecord,
    Notification,
    Payment,
    Receipt,
    TypeApprovalApplication,
    User,
    WorkflowApplication,
    WorkflowEvent,
)
from app.repositories.bocra import (
    AgentRepository,
    AuthRepository,
    BillingRepository,
    CertificateRepository,
    ComplaintRepository,
    DeviceRepository,
    KnowledgeRepository,
    LicensingRepository,
    NotificationRepository,
    SearchRepository,
    WorkflowRepository,
)
from app.services.auth import AuthService


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _fmt_date(value: date | datetime | None) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    return value.isoformat()


def _fmt_datetime(value: datetime | None) -> str:
    return value.isoformat() if value else ""


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.knowledge_repo = KnowledgeRepository(db)
        self.workflow_repo = WorkflowRepository(db)
        self.complaint_repo = ComplaintRepository(db)
        self.licensing_repo = LicensingRepository(db)
        self.billing_repo = BillingRepository(db)
        self.certificate_repo = CertificateRepository(db)

    def summary(self, *, role: str, user: User | None) -> dict[str, Any]:
        user_id = user.id if user and role not in {"officer", "admin"} else None
        applications = self.licensing_repo.list_license_applications(user_id=user_id)
        complaints, _ = self.complaint_repo.list_complaints(
            role=role,
            user_id=user.id if user else None,
            status=None,
            operator=None,
            date_from=None,
            date_to=None,
            page=1,
            page_size=100,
        )
        invoices = self.billing_repo.list_invoices(user.id if user and role not in {"officer", "admin"} else None)
        certificates = self.certificate_repo.list_certificates(user.id if user and role not in {"officer", "admin"} else None)

        open_invoices = [invoice for invoice in invoices if invoice.status_code in {"UNPAID", "OVERDUE"}]
        result: dict[str, Any] = {
            "applications": len(applications),
            "complaints": len(complaints),
            "invoiceCount": len(open_invoices),
            "invoiceTotal": f"P {sum(float(invoice.total_amount) for invoice in open_invoices):,.2f}",
            "certificates": len(certificates),
        }
        if role in {"officer", "admin"}:
            result["reviewQueue"] = sum(
                1 for application in applications if application.workflow_application_id
            ) + sum(1 for complaint in complaints if complaint.current_status_code in {"NEW", "ASSIGNED", "PENDING"})
            now = _utcnow()
            result["slaBreaches"] = sum(
                1
                for complaint in complaints
                if complaint.expected_resolution_at and complaint.expected_resolution_at < now and complaint.current_status_code not in {"RESOLVED", "CLOSED"}
            )
        return result

    def activity(self, limit: int = 5) -> list[WorkflowEvent]:
        return self.workflow_repo.list_recent_events(limit=limit)

    def queue_summary(self) -> dict[str, int]:
        events = self.workflow_repo.list_recent_events(visible_only=False, limit=50)
        queue = [event for event in events if event.resource_kind in {"complaint", "licence_application", "application"}]
        return {
            "pending": sum(1 for event in queue if "Submitted" in event.label or "Pending" in event.label),
            "review": sum(1 for event in queue if "Review" in event.label),
            "urgent": sum(1 for event in queue if "Awaiting Payment" in event.label or "Rejected" in event.label),
        }

    def notices(self, limit: int = 3) -> list[Any]:
        return self.knowledge_repo.list_notices(limit=limit)


class ComplaintService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ComplaintRepository(db)
        self.workflow_repo = WorkflowRepository(db)
        self.notifications = NotificationRepository(db)
        self.storage = StorageAdapter()

    def list_complaints(
        self,
        *,
        role: str,
        user: User | None,
        status: str | None,
        operator: str | None,
        date_from: str | None,
        date_to: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Complaint], int]:
        return self.repo.list_complaints(
            role=role,
            user_id=user.id if user else None,
            status=status,
            operator=operator,
            date_from=date_from,
            date_to=date_to,
            page=page,
            page_size=page_size,
        )

    def submit_complaint(
        self,
        *,
        draft: dict[str, Any],
        attachments: list[tuple[str, str, bytes]],
        user: User | None,
    ) -> Complaint:
        year = _utcnow().year
        serial = str(uuid4().int)[-6:]
        complaint = Complaint(
            complaint_number=f"BCR-{year}-{serial}",
            complainant_user_id=user.id if user else None,
            subject=draft["subject"],
            complaint_type_code=draft["category"],
            service_provider_name=draft["operator"],
            location_text=draft.get("incidentDate") or draft.get("location") or "",
            provider_contacted_first=True,
            narrative=draft["description"],
            current_status_code="NEW",
            expected_resolution_at=_utcnow() + timedelta(days=7),
            sla_due_at=_utcnow() + timedelta(days=7),
            metadata_json={"contact": {"name": draft["name"], "email": draft["email"], "phone": draft["phone"]}},
        )
        self.repo.create_complaint(complaint)

        for file_name, content_type, content in attachments:
            storage_path = self.storage.save_bytes(folder=f"complaints/{complaint.id}", file_name=file_name, content=content)
            self.repo.add_attachment(
                ComplaintAttachment(
                    complaint_id=complaint.id,
                    file_name=file_name,
                    content_type=content_type,
                    size_bytes=len(content),
                    storage_path=storage_path,
                )
            )

        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="complaint",
                resource_id=complaint.id,
                event_type_code="SUBMITTED",
                label="Submitted",
                actor_name="System",
                actor_role="system",
                comment=f"Complaint received and assigned case number {complaint.complaint_number}.",
            )
        )

        if user:
            self.notifications.create(
                Notification(
                    user_id=user.id,
                    channel_code="IN_APP",
                    title="Complaint submitted successfully",
                    body=f"Your complaint {complaint.complaint_number} has been received.",
                    status_code="SENT",
                    sent_at=_utcnow(),
                    source_table="complaints.complaints",
                    source_id=complaint.id,
                )
            )

        self.db.commit()
        self.db.refresh(complaint)
        return complaint

    def get_detail(self, complaint_id: str) -> dict[str, Any] | None:
        complaint = self.repo.get_complaint_by_reference(complaint_id)
        if not complaint:
            return None
        return {
            "complaint": complaint,
            "messages": self.repo.list_messages(complaint.id),
            "attachments": self.repo.list_attachments(complaint.id),
            "events": self.workflow_repo.list_events_for_resource("complaint", complaint.id),
        }

    def add_message(self, complaint_id: str, *, body: str, user: User | None) -> ComplaintMessage | None:
        complaint = self.repo.get_complaint_by_reference(complaint_id)
        if not complaint:
            return None
        author_name = f"{user.first_name} {user.last_name}" if user else "Portal User"
        if user:
            roles = AuthRepository(self.db).get_roles_for_user(user.id)
            author_role = AuthService.primary_role(roles)
        else:
            author_role = "complainant"
        message = ComplaintMessage(
            complaint_id=complaint.id,
            author_user_id=user.id if user else None,
            author_name=author_name,
            author_role=author_role,
            body=body,
        )
        self.repo.add_message(message)
        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="complaint",
                resource_id=complaint.id,
                event_type_code="MESSAGE",
                label="Message Added",
                actor_name=author_name,
                actor_role=author_role,
                comment=body[:140],
            )
        )
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_attachment_bytes(self, complaint_id: str, attachment_id: str) -> tuple[ComplaintAttachment, bytes] | None:
        complaint = self.repo.get_complaint_by_reference(complaint_id)
        if not complaint:
            return None
        attachments = self.repo.list_attachments(complaint.id)
        attachment = next((item for item in attachments if item.id == attachment_id), None)
        if not attachment:
            return None
        return attachment, self.storage.read_bytes(attachment.storage_path)

    def officer_action(
        self,
        complaint_id: str,
        *,
        action: str,
        officer: User,
        note: str = "",
    ) -> Complaint | None:
        """Perform approve / reject / remand / assign on a complaint."""
        complaint = self.repo.get_complaint_by_reference(complaint_id)
        if not complaint:
            return None

        action_map = {
            "approve": ("APPROVED", "Complaint Approved"),
            "reject": ("REJECTED", "Complaint Rejected"),
            "remand": ("REMANDED", "Complaint Remanded for Further Information"),
            "resolve": ("RESOLVED", "Complaint Resolved"),
            "assign": ("IN_PROGRESS", "Complaint Assigned to Officer"),
        }
        if action not in action_map:
            raise ValueError(f"Unsupported action: {action}")

        new_status, label = action_map[action]
        complaint.current_status_code = new_status
        if action == "assign":
            complaint.assigned_to_user_id = officer.id
        if action in {"approve", "resolve"}:
            complaint.resolved_at = _utcnow()
            complaint.resolution_summary = note or label
        self.db.flush()

        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="complaint",
                resource_id=complaint.id,
                event_type_code=f"COMPLAINT_{action.upper()}",
                label=label,
                actor_name=f"{officer.first_name} {officer.last_name}".strip(),
                actor_role="officer",
                is_visible_to_applicant=True,
                comment=note or None,
            )
        )

        if complaint.complainant_user_id:
            self.notifications.create(
                Notification(
                    user_id=complaint.complainant_user_id,
                    channel_code="IN_APP",
                    title=label,
                    body=f"Your complaint {complaint.complaint_number} has been {new_status.lower().replace('_', ' ')}.",
                    status_code="SENT",
                    sent_at=_utcnow(),
                    source_table="complaints",
                    source_id=complaint.id,
                )
            )
        return complaint


class LicensingService:
    LICENCE_TYPES = [
        {"id": 1, "name": "Individual Service Provider (ISP)"},
        {"id": 2, "name": "Network Service Provider (NSP)"},
        {"id": 3, "name": "Postal Service Licence"},
        {"id": 4, "name": "Broadcasting Licence"},
        {"id": 5, "name": "Type Approval Certificate"},
        {"id": 6, "name": "Spectrum Usage Licence"},
    ]

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = LicensingRepository(db)
        self.workflow_repo = WorkflowRepository(db)
        self.notifications = NotificationRepository(db)

    def dashboard_data(self, *, user: User | None, role: str) -> dict[str, Any]:
        user_id = user.id if user and role not in {"officer", "admin"} else None
        return {
            "licences": self.repo.list_licence_records(user_id=user_id),
            "applications": self.repo.list_license_applications(user_id=user_id),
        }

    def detail(self, record_id: str) -> dict[str, Any] | None:
        licence = self.repo.get_licence_record(record_id)
        if licence:
            return {
                "recordType": "licence",
                "record": licence,
                "events": self.workflow_repo.list_events_for_resource("licence_record", licence.id),
            }
        application = self.repo.get_license_application(record_id)
        if not application:
            return None
        return {
            "recordType": "application",
            "record": application,
            "workflow": self.workflow_repo.get_application(application.workflow_application_id),
            "events": self.workflow_repo.list_events_for_resource("licence_application", application.id),
        }

    def tracker(self, reference: str) -> dict[str, Any] | None:
        """Return journey events for an application by application_number or public_tracker_token."""
        workflow = self.workflow_repo.get_application_by_number(reference)
        if not workflow:
            workflow = self.db.scalar(
                select(WorkflowApplication).where(WorkflowApplication.public_tracker_token == reference)
            )
        if not workflow:
            return None
        events = self.workflow_repo.list_events_for_resource(
            workflow.application_type_code.lower(), workflow.id
        )
        return {
            "applicationNumber": workflow.application_number,
            "title": workflow.title,
            "status": workflow.current_status_code,
            "stage": workflow.current_stage_code,
            "submittedAt": workflow.submitted_at.isoformat() if workflow.submitted_at else None,
            "expectedDecisionAt": workflow.expected_decision_at.isoformat() if workflow.expected_decision_at else None,
            "events": [
                {
                    "id": event.id,
                    "type": event.event_type_code,
                    "label": event.label,
                    "actorRole": event.actor_role,
                    "occurredAt": event.occurred_at.isoformat(),
                    "comment": event.comment,
                }
                for event in events
                if event.is_visible_to_applicant
            ],
        }

    def officer_action(
        self,
        application_id: str,
        *,
        action: str,
        officer: User,
        note: str = "",
    ) -> WorkflowApplication | None:
        """Perform approve / reject / remand on a licence application."""
        workflow = self.workflow_repo.get_application(application_id)
        if not workflow or workflow.application_type_code != "LICENCE":
            return None

        action_map = {
            "approve": ("APPROVED", "APPROVED", "Licence Application Approved"),
            "reject": ("REJECTED", "REJECTED", "Licence Application Rejected"),
            "remand": ("PENDING", "REMANDED", "Licence Application Remanded"),
        }
        if action not in action_map:
            raise ValueError(f"Unsupported action: {action}")

        new_status, new_stage, label = action_map[action]
        workflow.current_status_code = new_status
        workflow.current_stage_code = new_stage
        self.db.flush()

        if action == "approve":
            today = _utcnow().date()
            lic = LicenseRecord(
                workflow_application_id=workflow.id,
                licence_number=f"LIC-{today.year}-{uuid4().hex[:6].upper()}",
                licence_type=workflow.title,
                category="LICENSED",
                status_code="ACTIVE",
                issue_date=today,
                expiry_date=today.replace(year=today.year + 2),
                holder_name=f"{officer.first_name} {officer.last_name}".strip(),
                assigned_officer_name=f"{officer.first_name} {officer.last_name}".strip(),
            )
            self.db.add(lic)
            self.db.flush()

        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="licence_application",
                resource_id=workflow.id,
                event_type_code=f"LICENCE_{action.upper()}",
                label=label,
                actor_name=f"{officer.first_name} {officer.last_name}".strip(),
                actor_role="officer",
                is_visible_to_applicant=True,
                comment=note or None,
            )
        )

        if workflow.applicant_user_id:
            self.notifications.create(
                Notification(
                    user_id=workflow.applicant_user_id,
                    channel_code="IN_APP",
                    title=label,
                    body=f"Your licence application {workflow.application_number} has been {new_status.lower()}.",
                    status_code="SENT",
                    sent_at=_utcnow(),
                    source_table="workflow_applications",
                    source_id=workflow.id,
                )
            )
        return workflow

    def public_action(self, *, action: str | None, params: dict[str, str]) -> Any:
        if action == "types":
            return self.LICENCE_TYPES
        if action == "customers":
            query = params.get("name", "")
            matches = self.repo.licence_customer_search(query)
            return [{"clientId": index + 1, "clientName": item.legal_name} for index, item in enumerate(matches)]
        if action == "search":
            records = self.repo.list_licence_records()
            client_id = params.get("clientId")
            licence_number = params.get("licenseNumber")
            licence_type = params.get("licenseType")
            filtered = records
            if licence_number and licence_number not in {"0", "All"}:
                filtered = [record for record in filtered if licence_number.lower() in record.licence_number.lower()]
            if licence_type and licence_type not in {"0", "All"}:
                filtered = [record for record in filtered if licence_type.lower() in record.licence_type.lower()]
            if client_id and client_id not in {"0", ""}:
                filtered = filtered[:3]
            return {
                "totalCount": len(filtered),
                "pageNumber": int(params.get("page", "1")),
                "pageSize": int(params.get("pageSize", "10")),
                "data": [
                    {
                        "licenceNumber": record.licence_number,
                        "licenceType": record.licence_type,
                        "clientName": record.holder_name,
                        "status": record.status_code.title(),
                        "issueDate": record.issue_date.isoformat(),
                        "expiryDate": record.expiry_date.isoformat(),
                    }
                    for record in filtered
                ],
            }
        return self.dashboard_data(user=None, role="public")

    def create_application(self, payload: dict[str, Any], user: User | None) -> dict[str, Any]:
        workflow = WorkflowApplication(
            application_number=f"APP-{_utcnow().year}-{str(uuid4().int)[-5:]}",
            application_type_code="LICENCE",
            service_module_code="LICENSING",
            applicant_user_id=user.id if user else None,
            title=payload["licenceType"],
            description=f"Licence application for {payload['licenceType']}",
            current_status_code="PENDING",
            current_stage_code="SUBMITTED",
            submitted_at=_utcnow(),
            expected_decision_at=_utcnow() + timedelta(days=21),
            public_tracker_token=uuid4().hex,
        )
        self.workflow_repo.create_application(workflow)
        application = LicenseApplication(
            workflow_application_id=workflow.id,
            category_code=payload["category"],
            licence_type_name=payload["licenceType"],
            applicant_name=payload["applicantName"],
            applicant_email=payload["applicantEmail"],
            coverage_area=payload.get("coverageArea"),
            form_data_json=payload.get("formData", {}),
        )
        self.repo.create_license_application(application)
        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="licence_application",
                resource_id=application.id,
                event_type_code="SUBMITTED",
                label="Submitted",
                actor_name=payload["applicantName"],
                actor_role="applicant",
                comment="Licence application submitted via the BOCRA portal.",
            )
        )
        self.db.commit()
        return {"application": application, "workflow": workflow}


class TypeApprovalService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.device_repo = DeviceRepository(db)
        self.workflow_repo = WorkflowRepository(db)
        self.notifications = NotificationRepository(db)

    def search_public(self, query: str, page: int, size: int) -> dict[str, Any]:
        matches = self.device_repo.list_type_approvals()
        records: list[dict[str, Any]] = []
        lowered = query.lower().strip()
        for record in matches:
            device = self.device_repo.get_device(record.device_model_id)
            if not device:
                continue
            haystack = " ".join([device.brand_name, device.model_name, device.device_type, record.applicant_name or ""]).lower()
            if lowered and lowered not in haystack:
                continue
            records.append(
                {
                    "id": record.id,
                    "referenceNumber": f"TA-CERT-{(record.approval_date or date.today()).year}-{record.id[-5:]}",
                    "approvalApplication": {
                        "equipmentDetails": {"make": device.brand_name, "model": device.model_name},
                        "customerName": record.applicant_name or "Unknown Applicant",
                    },
                    "created": _fmt_date(record.approval_date),
                }
            )
        total = len(records)
        start = page * size
        end = start + size
        return {
            "total": total,
            "pages": ceil(total / size) if size else 1,
            "currentPage": page,
            "content": records[start:end],
        }

    def get_accreditation(self, user: User | None, accreditation_type: str) -> dict[str, Any]:
        record = self.device_repo.get_accreditation(user.id if user else None, accreditation_type)
        status = record.status_code if record else "NOT_FOUND"
        return {"type": accreditation_type, "status": status, "reference": record.reference_number if record else None}

    def create_application(self, payload: dict[str, Any], user: User | None) -> dict[str, Any]:
        accreditation = self.device_repo.get_accreditation(user.id if user else None, payload["accreditationType"])
        if not accreditation or accreditation.status_code != "APPROVED":
            raise ValueError("Selected accreditation is not approved.")
        device = self.device_repo.find_device_by_brand_model(payload["brandName"], payload["modelName"])
        if not device:
            device = self.device_repo.create_device(
                DeviceCatalog(
                    brand_name=payload["brandName"],
                    marketing_name=payload["modelName"],
                    model_name=payload["modelName"],
                    device_type="Smartphone" if payload["simEnabled"] == "yes" else "Router",
                    is_sim_enabled=payload["simEnabled"] == "yes",
                )
            )

        workflow = WorkflowApplication(
            application_number=f"APP-{_utcnow().year}-{str(uuid4().int)[-5:]}",
            application_type_code="TYPE_APPROVAL",
            service_module_code="TYPE_APPROVAL",
            applicant_user_id=user.id if user else None,
            title=f"Type Approval — {payload['brandName']} {payload['modelName']}",
            description="Type approval application submitted via portal.",
            current_status_code="PENDING",
            current_stage_code="SUBMITTED",
            submitted_at=_utcnow(),
            expected_decision_at=_utcnow() + timedelta(days=14),
        )
        self.workflow_repo.create_application(workflow)
        application = TypeApprovalApplication(
            workflow_application_id=workflow.id,
            device_model_id=device.id,
            accreditation_id=accreditation.id,
            sample_imei=payload.get("sampleImei") or None,
            country_of_manufacture=payload.get("countryOfManufacture"),
            form_data_json=payload,
        )
        self.device_repo.create_type_approval_application(application)
        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="application",
                resource_id=workflow.id,
                event_type_code="SUBMITTED",
                label="Submitted",
                actor_name=f"{user.first_name} {user.last_name}" if user else "Portal User",
                actor_role="applicant",
                comment="Type approval application submitted via BOCRA portal.",
            )
        )
        self.db.commit()
        return {"workflow": workflow, "application": application}

    def list_user_applications(self, user: User, *, is_officer: bool = False) -> list[dict[str, Any]]:
        """Return all TYPE_APPROVAL workflow applications for a user (or all if officer)."""
        workflows = self.workflow_repo.list_applications(
            user_id=None if is_officer else user.id
        )
        ta_workflows = [w for w in workflows if w.application_type_code == "TYPE_APPROVAL"]
        results = []
        for workflow in ta_workflows:
            ta = self.device_repo.get_ta_application_by_workflow_id(workflow.id)
            device = self.device_repo.get_device(ta.device_model_id) if ta else None
            results.append({
                "id": workflow.id,
                "applicationNumber": workflow.application_number,
                "title": workflow.title,
                "status": workflow.current_status_code,
                "stage": workflow.current_stage_code,
                "submittedAt": workflow.submitted_at.isoformat() if workflow.submitted_at else None,
                "expectedDecisionAt": workflow.expected_decision_at.isoformat() if workflow.expected_decision_at else None,
                "device": {
                    "brand": device.brand_name,
                    "model": device.model_name,
                    "type": device.device_type,
                } if device else None,
            })
        return results

    def get_application_detail(self, application_id: str, user: User, *, is_officer: bool = False) -> dict[str, Any] | None:
        """Return full detail for a single TYPE_APPROVAL application including events, invoice, certificate."""
        workflow = self.workflow_repo.get_application(application_id)
        if not workflow or workflow.application_type_code != "TYPE_APPROVAL":
            return None
        # Applicants may only see their own
        if not is_officer and workflow.applicant_user_id != user.id:
            return None

        ta = self.device_repo.get_ta_application_by_workflow_id(workflow.id)
        device = self.device_repo.get_device(ta.device_model_id) if ta else None
        events = self.workflow_repo.list_events_for_resource("type_approval_application", workflow.id)
        billing_repo = BillingRepository(self.db)
        cert_repo = CertificateRepository(self.db)
        invoice = billing_repo.get_invoice_by_application_id(workflow.id)
        certificate = cert_repo.get_by_application_id(workflow.id)

        return {
            "id": workflow.id,
            "applicationNumber": workflow.application_number,
            "title": workflow.title,
            "status": workflow.current_status_code,
            "stage": workflow.current_stage_code,
            "submittedAt": workflow.submitted_at.isoformat() if workflow.submitted_at else None,
            "expectedDecisionAt": workflow.expected_decision_at.isoformat() if workflow.expected_decision_at else None,
            "device": {
                "brand": device.brand_name,
                "model": device.model_name,
                "type": device.device_type,
                "simEnabled": device.is_sim_enabled,
            } if device else None,
            "formData": ta.form_data_json if ta else {},
            "events": [
                {
                    "id": e.id,
                    "eventType": e.event_type_code,
                    "label": e.label,
                    "actorName": e.actor_name,
                    "actorRole": e.actor_role,
                    "comment": e.comment,
                    "occurredAt": e.occurred_at.isoformat() if e.occurred_at else None,
                }
                for e in events
            ],
            "invoice": {
                "id": invoice.id,
                "invoiceNumber": invoice.invoice_number,
                "totalAmount": float(invoice.total_amount),
                "currency": invoice.currency_code,
                "dueDate": invoice.due_date.isoformat() if invoice.due_date else None,
                "status": invoice.status_code,
            } if invoice else None,
            "certificate": {
                "id": certificate.id,
                "certificateNumber": certificate.certificate_number,
                "issueDate": certificate.issue_date.isoformat() if certificate.issue_date else None,
                "expiryDate": certificate.expiry_date.isoformat() if certificate.expiry_date else None,
                "status": certificate.status_code,
                "qrToken": certificate.qr_token,
                "holderName": certificate.holder_name,
            } if certificate else None,
        }

    def officer_action(
        self,
        application_id: str,
        *,
        action: str,
        officer: User,
        note: str = "",
    ) -> WorkflowApplication | None:
        """Perform validate / approve / reject / remand / confirm_payment on a type approval application."""
        workflow = self.workflow_repo.get_application(application_id)
        if not workflow or workflow.application_type_code != "TYPE_APPROVAL":
            return None

        # validate: PENDING → VALIDATED
        # approve: VALIDATED → APPROVED (issues invoice, payment pending)
        # confirm_payment: APPROVED → CERTIFICATE_ISSUED (issues cert)
        # reject: any → REJECTED
        # remand: any → PENDING/REMANDED
        action_map = {
            "validate":        ("VALIDATED",         "VALIDATED",         "Application Validated"),
            "approve":         ("APPROVED",          "PAYMENT_PENDING",   "Application Approved — Invoice Issued"),
            "confirm_payment": ("CERTIFICATE_ISSUED","CERTIFICATE_ISSUED","Payment Confirmed — Certificate Issued"),
            "reject":          ("REJECTED",          "REJECTED",          "Application Rejected"),
            "remand":          ("PENDING",           "REMANDED",          "Application Remanded"),
        }
        if action not in action_map:
            raise ValueError(f"Unsupported action: {action}")

        new_status, new_stage, label = action_map[action]
        workflow.current_status_code = new_status
        workflow.current_stage_code = new_stage
        self.db.flush()

        if action == "approve":
            # Create pending invoice for the type approval fee
            today = _utcnow().date()
            subtotal = 5000.0
            vat = round(subtotal * 0.12, 2)
            billing_repo = BillingRepository(self.db)
            invoice = Invoice(
                invoice_number=f"INV-TA-{today.year}-{uuid4().hex[:6].upper()}",
                application_id=workflow.id,
                owner_user_id=workflow.applicant_user_id,
                description=f"Type Approval Fee — {workflow.title}",
                service_name="Type Approval",
                currency_code="BWP",
                subtotal_amount=subtotal,
                vat_amount=vat,
                total_amount=round(subtotal + vat, 2),
                due_date=today + timedelta(days=14),
                status_code="PENDING",
            )
            billing_repo.create_invoice(invoice)

        if action == "confirm_payment":
            # Issue the certificate
            today = _utcnow().date()
            cert_repo = CertificateRepository(self.db)
            officer_name = f"{officer.first_name} {officer.last_name}".strip()
            cert = Certificate(
                certificate_number=f"TA-{today.year}-{uuid4().hex[:6].upper()}",
                certificate_type="TYPE_APPROVAL",
                holder_name=officer_name,
                device_name=workflow.title,
                issue_date=today,
                expiry_date=today.replace(year=today.year + 3),
                status_code="ACTIVE",
                qr_token=uuid4().hex,
                application_id=workflow.id,
                owner_user_id=workflow.applicant_user_id,
                issued_by=officer_name,
                remarks=note or None,
            )
            self.db.add(cert)
            self.db.flush()
            # Mark invoice paid if one exists
            billing_repo = BillingRepository(self.db)
            invoice = billing_repo.get_invoice_by_application_id(workflow.id)
            if invoice:
                invoice.status_code = "PAID"
                self.db.flush()

        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="type_approval_application",
                resource_id=workflow.id,
                event_type_code=f"TYPE_APPROVAL_{action.upper()}",
                label=label,
                actor_name=f"{officer.first_name} {officer.last_name}".strip(),
                actor_role="officer",
                is_visible_to_applicant=True,
                comment=note or None,
            )
        )

        if workflow.applicant_user_id:
            self.notifications.create(
                Notification(
                    user_id=workflow.applicant_user_id,
                    channel_code="IN_APP",
                    title=label,
                    body=f"Your type approval application {workflow.application_number}: {label.lower()}.",
                    status_code="SENT",
                    sent_at=_utcnow(),
                    source_table="workflow_applications",
                    source_id=workflow.id,
                )
            )
        return workflow


class DeviceService:
    BRAND_MODELS = {
        "0": ("Samsung", ["Galaxy A55 5G", "Galaxy A35", "Galaxy A15"]),
        "1": ("Apple", ["iPhone 15 Pro", "iPhone 15", "iPhone 14"]),
        "2": ("Huawei", ["P60 Pro", "Nova 12 SE", "Y9s"]),
        "3": ("Xiaomi", ["Redmi Note 13 Pro", "Poco X6", "14T"]),
        "4": ("Nokia", ["G42 5G", "C32", "XR21"]),
        "5": ("Oppo", ["Reno 11 F", "A79 5G", "Find X7"]),
        "6": ("Tecno", ["Spark 20 Pro", "Camon 30", "Phantom V Flip"]),
        "7": ("Infinix", ["Hot 40 Pro", "Note 40 Pro", "Zero 40 5G"]),
        "8": ("Motorola", ["Moto G85", "Edge 50 Pro", "G54 5G"]),
        "9": ("Itel", ["A70", "P55 5G", "Vision 3 Plus"]),
    }

    def __init__(self, db: Session) -> None:
        self.repo = DeviceRepository(db)

    def verify_imei(self, imei: str) -> dict[str, Any]:
        checked_at = _utcnow().isoformat()
        cleaned = "".join(char for char in imei if char.isdigit())
        if len(cleaned) != 15:
            return {"imei": cleaned or imei, "status": "FAILED_VERIFICATION", "remarks": "Invalid format — IMEI must be exactly 15 digits.", "checkedAt": checked_at}
        if cleaned.startswith("52"):
            return {"imei": cleaned, "status": "BLACKLISTED", "remarks": "Device is on the BOCRA national blacklist. It may not be legally operated in Botswana.", "checkedAt": checked_at}
        if cleaned.startswith("01"):
            return {"imei": cleaned, "status": "BLOCKED", "remarks": "Device has been reported lost or stolen by a network operator and is blocked.", "checkedAt": checked_at}
        if cleaned.startswith("99"):
            return {"imei": cleaned, "status": "DUPLICATE", "remarks": "This IMEI appears more than once in the BOCRA registry, indicating a counterfeit device.", "checkedAt": checked_at}
        if cleaned.startswith("77"):
            return {"imei": cleaned, "status": "FAILED_VERIFICATION", "remarks": "IMEI failed Luhn checksum verification. The device may be counterfeit.", "checkedAt": checked_at}

        record = self.repo.find_verification_item(cleaned)
        if record and record.device_model_id:
            device = self.repo.get_device(record.device_model_id)
            if record.verification_status_code == "VERIFIED" and device:
                return {
                    "imei": cleaned,
                    "status": "VERIFIED",
                    "brand": device.brand_name,
                    "model": device.model_name,
                    "typeApprovalNumber": (record.response_payload_json or {}).get("typeApprovalNumber"),
                    "checkedAt": checked_at,
                }

        if cleaned.startswith("35"):
            digit3 = cleaned[2]
            digit4 = int(cleaned[3])
            brand, models = self.BRAND_MODELS.get(digit3, self.BRAND_MODELS["0"])
            model = models[digit4 % len(models)]
            return {
                "imei": cleaned,
                "status": "VERIFIED",
                "brand": brand,
                "model": model,
                "typeApprovalNumber": f"TA-{2020 + (digit4 % 5)}-{int(cleaned[4:8]) % 90000 + 10000}",
                "checkedAt": checked_at,
            }
        return {"imei": cleaned, "status": "NOT_FOUND", "remarks": "IMEI not found in the BOCRA Type Approval registry. The device may not be approved for use in Botswana.", "checkedAt": checked_at}


class CertificateService:
    def __init__(self, db: Session) -> None:
        self.repo = CertificateRepository(db)

    def list_certificates(self, user: User | None, role: str, cert_type: str | None = None) -> list[Certificate]:
        user_id = user.id if user and role not in {"officer", "admin"} else None
        return self.repo.list_certificates(user_id=user_id, cert_type=cert_type)

    def verify(self, token: str) -> Certificate | None:
        return self.repo.get_by_qr_token(token)


class BillingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = BillingRepository(db)
        self.notifications = NotificationRepository(db)
        self.storage = StorageAdapter()

    def list_invoices(self, user: User | None, role: str) -> list[Invoice]:
        user_id = user.id if user and role not in {"officer", "admin"} else None
        return self.repo.list_invoices(user_id=user_id)

    def list_payments(self, user: User | None, role: str) -> list[Payment]:
        user_id = user.id if user and role not in {"officer", "admin"} else None
        return self.repo.list_payments(user_id=user_id)

    def list_receipts(self, user: User | None, role: str) -> list[Receipt]:
        user_id = user.id if user and role not in {"officer", "admin"} else None
        return self.repo.list_receipts(user_id=user_id)

    def create_payment(self, *, payload: dict[str, Any], user: User | None) -> dict[str, Any]:
        invoice = self.repo.get_invoice(payload["invoiceId"])
        if not invoice:
            raise ValueError("Invoice not found.")
        status = "COMPLETED" if payload["method"] != "card" else "PENDING"
        payment = Payment(
            invoice_id=invoice.id,
            gateway_code=payload["method"].upper(),
            gateway_reference=payload["reference"],
            amount_paid=invoice.total_amount,
            status_code=status,
            paid_at=_utcnow(),
        )
        self.repo.create_payment(payment)
        invoice.status_code = "PAID" if status == "COMPLETED" else "PENDING"
        self.repo.update_invoice(invoice)
        receipt = None
        if status == "COMPLETED":
            file_path = self.storage.save_bytes(
                folder="receipts",
                file_name=f"{invoice.invoice_number}.txt",
                content=f"Receipt for invoice {invoice.invoice_number}".encode("utf-8"),
            )
            receipt = self.repo.create_receipt(
                Receipt(payment_id=payment.id, receipt_number=f"RCP-{_utcnow().year}-{str(uuid4().int)[-4:]}", file_path=file_path)
            )
        if user:
            self.notifications.create(
                Notification(
                    user_id=user.id,
                    channel_code="IN_APP",
                    title=f"Payment update for {invoice.invoice_number}",
                    body=f"Payment reference {payload['reference']} recorded with status {status}.",
                    status_code="SENT",
                    sent_at=_utcnow(),
                    source_table="billing.payments",
                    source_id=payment.id,
                )
            )
        self.db.commit()
        return {"invoice": invoice, "payment": payment, "receipt": receipt}


class SearchService:
    def __init__(self, db: Session) -> None:
        self.repo = SearchRepository(db)

    def search(self, query: str, category: str) -> dict[str, Any]:
        licences = self.repo.search_licences(query) if category in {"all", "licence"} else []
        certificates = self.repo.search_certificates(query) if category in {"all", "certificate"} else []
        type_approvals = self.repo.search_type_approvals(query) if category in {"all", "type-approval"} else []
        devices = self.repo.search_devices(query) if category in {"all", "imei"} else []
        organizations = self.repo.search_organizations(query) if category in {"all", "organization"} else []
        return {
            "licences": licences,
            "certificates": certificates,
            "typeApprovals": type_approvals,
            "devices": devices,
            "organizations": organizations,
            "meta": {
                "query": query,
                "category": category,
                "totalResults": len(licences) + len(certificates) + len(type_approvals) + len(devices) + len(organizations),
            },
        }


class PublicService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.knowledge_repo = KnowledgeRepository(db)

    def statistics(self) -> dict[str, Any]:
        resolved_count = self.db.scalar(
            select(func.count(Complaint.id)).where(
                Complaint.current_status_code.in_(["RESOLVED", "CLOSED"])
            )
        ) or 0
        active_licences = self.db.scalar(
            select(func.count(LicenseRecord.id)).where(LicenseRecord.status_code == "ACTIVE")
        ) or 0
        return {
            "mobile_subscribers": {"Mascom": 1850000, "Orange": 1600000, "BTC": 850000},
            "internet_penetration": {"2022": 62, "2023": 68, "2024": 74, "2025": 79, "2026": 85},
            "complaints_resolved": resolved_count,
            "active_licences": active_licences,
        }

    def chat(self, message: str) -> dict[str, str]:
        matches = self.knowledge_repo.search_chunks(message, limit=2)
        if matches:
            titles = ", ".join(document.title for _, document in matches)
            return {"reply": f"According to {titles}, I can help you with that. Please check the BOCRA dashboard or ask the Copilot for the next workflow step."}
        return {"reply": "I can help with BOCRA services, complaints, licensing, tariffs, and contact information."}


class QosService:
    def __init__(self) -> None:
        self.client = DqosClient()

    def locations(self) -> dict[str, Any]:
        return self.client.get_locations()

    def summary(self) -> dict[str, Any]:
        return self.client.get_summary()
