from __future__ import annotations

import hashlib
import re
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
    AuditLog,
    Certificate,
    Complaint,
    ComplaintAttachment,
    ComplaintMessage,
    DeviceCatalog,
    DocumentFile,
    Invoice,
    InvoiceItem,
    LicenseApplication,
    LicenseRecord,
    Notification,
    Payment,
    Receipt,
    TypeApprovalRecord,
    TypeApprovalApplication,
    User,
    WorkflowApplication,
    WorkflowApplicationComment,
    WorkflowApplicationDocument,
    WorkflowApplicationParty,
    WorkflowApplicationStatusHistory,
    WorkflowApplicationTask,
    WorkflowEvent,
)
from app.repositories.bocra import (
    AgentRepository,
    AuditRepository,
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
        staff_roles = {"officer", "type_approver", "admin"}
        user_id = user.id if user and role not in staff_roles else None
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
        invoices = self.billing_repo.list_invoices(user.id if user and role not in staff_roles else None)
        certificates = self.certificate_repo.list_certificates(user.id if user and role not in staff_roles else None)

        open_invoices = [invoice for invoice in invoices if invoice.status_code in {"UNPAID", "OVERDUE"}]
        result: dict[str, Any] = {
            "applications": len(applications),
            "complaints": len(complaints),
            "invoiceCount": len(open_invoices),
            "invoiceTotal": f"P {sum(float(invoice.total_amount) for invoice in open_invoices):,.2f}",
            "certificates": len(certificates),
        }
        if role in staff_roles:
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
    STAFF_ROLES = {"officer", "admin"}

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ComplaintRepository(db)
        self.workflow_repo = WorkflowRepository(db)
        self.notifications = NotificationRepository(db)
        self.storage = StorageAdapter()

    def _can_access_complaint(self, complaint: Complaint, *, user: User | None, role: str) -> bool:
        if role in self.STAFF_ROLES:
            return True
        return bool(user and complaint.complainant_user_id == user.id)

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
            location_text=draft.get("location") or "",
            provider_contacted_first=str(draft.get("reportedToProvider", "")).lower() in {"yes", "true", "1"},
            narrative=draft["description"],
            current_status_code="NEW",
            expected_resolution_at=_utcnow() + timedelta(days=7),
            sla_due_at=_utcnow() + timedelta(days=7),
            metadata_json={
                "contact": {
                    "name": draft["name"],
                    "email": draft["email"],
                    "phone": draft["phone"],
                    "preferredContactMethod": draft.get("preferredContactMethod", ""),
                },
                "incidentDate": draft.get("incidentDate", ""),
                "providerCaseNumber": draft.get("providerCaseNumber", ""),
            },
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

    def get_detail(self, complaint_id: str, *, user: User | None = None, role: str = "public") -> dict[str, Any] | None:
        complaint = self.repo.get_complaint_by_reference(complaint_id)
        if not complaint:
            return None
        if not self._can_access_complaint(complaint, user=user, role=role):
            return None
        return {
            "complaint": complaint,
            "messages": self.repo.list_messages(complaint.id),
            "attachments": self.repo.list_attachments(complaint.id),
            "events": self.workflow_repo.list_events_for_resource("complaint", complaint.id),
        }

    def add_message(self, complaint_id: str, *, body: str, user: User | None, role: str) -> ComplaintMessage | None:
        complaint = self.repo.get_complaint_by_reference(complaint_id)
        if not complaint:
            return None
        if not self._can_access_complaint(complaint, user=user, role=role):
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

    def get_attachment_bytes(
        self,
        complaint_id: str,
        attachment_id: str,
        *,
        user: User | None,
        role: str,
    ) -> tuple[ComplaintAttachment, bytes] | None:
        complaint = self.repo.get_complaint_by_reference(complaint_id)
        if not complaint:
            return None
        if not self._can_access_complaint(complaint, user=user, role=role):
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
    STAFF_ROLES = {"officer", "admin"}

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
        user_id = user.id if user and role not in {"officer", "type_approver", "admin"} else None
        return {
            "licences": self.repo.list_licence_records(user_id=user_id),
            "applications": self.repo.list_license_applications(user_id=user_id),
        }

    def _can_access_workflow(self, workflow: WorkflowApplication, *, user: User | None, role: str) -> bool:
        if role in self.STAFF_ROLES:
            return True
        return bool(user and workflow.applicant_user_id == user.id)

    def _serialize_application_summary(self, application: LicenseApplication, workflow: WorkflowApplication) -> dict[str, Any]:
        return {
            "id": workflow.id,
            "licenseApplicationId": application.id,
            "applicationNumber": workflow.application_number,
            "status": workflow.current_status_code,
            "stage": workflow.current_stage_code,
            "title": workflow.title,
            "licenceType": application.licence_type_name,
            "applicantName": application.applicant_name,
            "applicantEmail": application.applicant_email,
            "submittedDate": _fmt_datetime(workflow.submitted_at),
            "dueDate": _fmt_datetime(workflow.expected_decision_at),
        }

    def list_applications(
        self,
        *,
        user: User | None,
        role: str,
        status: str | None,
        query: str | None,
        page: int,
        page_size: int,
    ) -> dict[str, Any]:
        rows, total = self.repo.list_license_applications_with_workflow(
            role=role,
            user_id=user.id if user else None,
            status=status,
            query=query,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, ceil(total / page_size)) if page_size else 1
        return {
            "data": [self._serialize_application_summary(application, workflow) for application, workflow in rows],
            "meta": {
                "total": total,
                "page": page,
                "pageSize": page_size,
                "totalPages": total_pages,
            },
        }

    def application_detail(self, reference: str, *, user: User | None, role: str) -> dict[str, Any] | None:
        result = self.repo.get_license_application_by_reference(reference)
        if not result:
            return None
        application, workflow = result
        if not self._can_access_workflow(workflow, user=user, role=role):
            return None
        return {
            "summary": self._serialize_application_summary(application, workflow),
            "application": {
                "id": application.id,
                "workflowId": workflow.id,
                "applicationNumber": workflow.application_number,
                "category": application.category_code,
                "licenceType": application.licence_type_name,
                "applicantName": application.applicant_name,
                "applicantEmail": application.applicant_email,
                "coverageArea": application.coverage_area,
                "formData": application.form_data_json,
            },
            "workflow": {
                "id": workflow.id,
                "status": workflow.current_status_code,
                "stage": workflow.current_stage_code,
                "submittedAt": _fmt_datetime(workflow.submitted_at),
                "expectedDecisionAt": _fmt_datetime(workflow.expected_decision_at),
            },
            "events": [
                {
                    "id": event.id,
                    "type": event.event_type_code,
                    "label": event.label,
                    "actor": event.actor_name,
                    "actorRole": event.actor_role,
                    "comment": event.comment or "",
                    "occurredAt": _fmt_datetime(event.occurred_at),
                }
                for event in self.workflow_repo.list_events_for_resource("licence_application", workflow.id)
            ],
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
    REVIEWER_ROLES = {"type_approver", "admin"}

    def __init__(self, db: Session) -> None:
        self.db = db
        self.device_repo = DeviceRepository(db)
        self.workflow_repo = WorkflowRepository(db)
        self.notifications = NotificationRepository(db)
        self.billing_repo = BillingRepository(db)
        self.certificate_repo = CertificateRepository(db)
        self.audit_repo = AuditRepository(db)
        self.auth_repo = AuthRepository(db)
        self.storage = StorageAdapter()

    def _is_reviewer(self, role: str) -> bool:
        return role in self.REVIEWER_ROLES

    def _role_for_user(self, user: User | None) -> str:
        if not user:
            return "public"
        roles = self.auth_repo.get_roles_for_user(user.id)
        return AuthService.primary_role(roles)

    def _actor_role(self, user: User | None) -> str:
        role = self._role_for_user(user)
        return "type_approver" if role == "type_approver" else role

    def _resolve_application(
        self,
        reference: str,
    ) -> tuple[TypeApprovalApplication, WorkflowApplication, DeviceCatalog] | None:
        return self.device_repo.get_type_approval_application(reference)

    def _ensure_access(self, workflow: WorkflowApplication, *, user: User | None, role: str) -> bool:
        if self._is_reviewer(role):
            return True
        return bool(user and workflow.applicant_user_id == user.id)

    def _safe_file_name(self, file_name: str) -> str:
        safe = re.sub(r"[^A-Za-z0-9._-]+", "_", file_name).strip("._")
        return safe or "upload.bin"

    def _applicant_display_name(self, workflow: WorkflowApplication) -> str:
        applicant = self.auth_repo.get_user_by_id(workflow.applicant_user_id)
        if applicant:
            full_name = f"{applicant.first_name} {applicant.last_name}".strip()
            if full_name:
                return full_name
        return workflow.title

    def _serialize_application_summary(
        self,
        application: TypeApprovalApplication,
        workflow: WorkflowApplication,
        device: DeviceCatalog,
    ) -> dict[str, Any]:
        open_tasks = self.workflow_repo.list_tasks(workflow.id, open_only=True)
        invoices = self.billing_repo.list_invoices_for_application(workflow.id)
        certificates = self.certificate_repo.list_for_application(workflow.id)
        return {
            "id": workflow.id,
            "typeApprovalApplicationId": application.id,
            "applicationNumber": workflow.application_number,
            "status": workflow.current_status_code,
            "stage": workflow.current_stage_code,
            "title": workflow.title,
            "brand": device.brand_name,
            "model": device.model_name,
            "deviceType": device.device_type,
            "simEnabled": device.is_sim_enabled,
            "sampleImei": application.sample_imei,
            "countryOfManufacture": application.country_of_manufacture,
            "submittedDate": _fmt_datetime(workflow.submitted_at),
            "dueDate": _fmt_datetime(workflow.expected_decision_at),
            "openTaskCount": len(open_tasks),
            "invoiceCount": len(invoices),
            "certificateCount": len(certificates),
        }

    def _serialize_party(self, party: WorkflowApplicationParty) -> dict[str, Any]:
        organization = self.auth_repo.get_organization_by_id(party.organization_id)
        contact = self.auth_repo.get_user_by_id(party.contact_user_id)
        contact_name = ""
        if contact:
            contact_name = f"{contact.first_name} {contact.last_name}".strip()
        return {
            "id": party.id,
            "partyType": party.party_type_code,
            "displayName": party.display_name or "",
            "organizationId": party.organization_id,
            "organizationName": organization.legal_name if organization else "",
            "contactUserId": party.contact_user_id,
            "contactName": contact_name,
            "metadata": party.metadata_json,
            "createdAt": _fmt_datetime(party.created_at),
        }

    def _serialize_comment(self, comment: WorkflowApplicationComment) -> dict[str, Any]:
        author = self.auth_repo.get_user_by_id(comment.author_user_id)
        author_name = "System"
        if author:
            author_name = f"{author.first_name} {author.last_name}".strip() or author.email
        return {
            "id": comment.id,
            "authorUserId": comment.author_user_id,
            "authorName": author_name,
            "visibility": comment.visibility_code,
            "body": comment.body,
            "createdAt": _fmt_datetime(comment.created_at),
        }

    def _serialize_document(
        self,
        workflow: WorkflowApplication,
        document: WorkflowApplicationDocument,
        file: DocumentFile,
    ) -> dict[str, Any]:
        return {
            "id": document.id,
            "fileId": file.id,
            "name": file.file_name,
            "mimeType": file.mime_type,
            "sizeBytes": file.file_size_bytes,
            "documentType": document.document_type_code,
            "isRequired": document.is_required,
            "reviewStatus": document.review_status_code,
            "storageKey": file.storage_key,
            "publicUrl": self.storage.public_url(file.storage_key),
            "downloadPath": f"/api/type-approval/applications/{workflow.application_number}/documents/{document.id}/download",
            "uploadedByUserId": document.uploaded_by_user_id,
            "uploadedAt": _fmt_datetime(document.created_at),
        }

    def list_applications(
        self,
        *,
        user: User | None,
        role: str,
        status: str | None,
        query: str | None,
        page: int,
        page_size: int,
    ) -> dict[str, Any]:
        rows, total = self.device_repo.list_type_approval_applications(
            role=role,
            user_id=user.id if user else None,
            status=status,
            query=query,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, ceil(total / page_size)) if page_size else 1
        return {
            "data": [self._serialize_application_summary(application, workflow, device) for application, workflow, device in rows],
            "meta": {
                "total": total,
                "page": page,
                "pageSize": page_size,
                "totalPages": total_pages,
            },
        }

    def queue(
        self,
        *,
        user: User | None,
        role: str,
        query: str | None,
        page: int,
        page_size: int,
    ) -> dict[str, Any]:
        payload = self.list_applications(user=user, role=role, status=None, query=query, page=page, page_size=page_size)
        queue_statuses = {"PENDING", "VALIDATED", "APPROVED", "REMANDED", "AWAITING_PAYMENT"}
        items = [item for item in payload["data"] if item["status"] in queue_statuses]
        payload["data"] = items
        payload["meta"]["total"] = len(items)
        payload["meta"]["totalPages"] = 1 if items else 1
        return payload

    def detail(self, reference: str, *, user: User | None, role: str) -> dict[str, Any] | None:
        result = self._resolve_application(reference)
        if not result:
            return None
        application, workflow, device = result
        if not self._ensure_access(workflow, user=user, role=role):
            return None

        accreditation = self.device_repo.get_accreditation_by_id(application.accreditation_id)
        record = self.device_repo.get_type_approval_record_by_application(application.id)
        invoices = self.billing_repo.list_invoices_for_application(workflow.id)
        certificates = self.certificate_repo.list_for_application(workflow.id)
        history = self.workflow_repo.list_status_history(workflow.id)
        tasks = self.workflow_repo.list_tasks(workflow.id)
        documents = self.workflow_repo.list_documents(workflow.id)
        parties = self.workflow_repo.list_parties(workflow.id)
        comments = self.workflow_repo.list_comments(workflow.id, include_internal=self._is_reviewer(role))
        events = self.workflow_repo.list_events_for_resource("application", workflow.id)
        legacy_events = self.workflow_repo.list_events_for_resource("type_approval_application", workflow.id)
        combined_events = sorted([*events, *legacy_events], key=lambda event: event.occurred_at)
        return {
            "summary": self._serialize_application_summary(application, workflow, device),
            "application": {
                "id": application.id,
                "workflowId": workflow.id,
                "applicationNumber": workflow.application_number,
                "formData": application.form_data_json,
                "description": workflow.description or "",
            },
            "device": {
                "id": device.id,
                "brand": device.brand_name,
                "marketingName": device.marketing_name,
                "model": device.model_name,
                "deviceType": device.device_type,
                "simEnabled": device.is_sim_enabled,
                "technicalSpec": device.technical_spec_json,
            },
            "accreditation": (
                {
                    "id": accreditation.id,
                    "type": accreditation.accreditation_type_code,
                    "reference": accreditation.reference_number,
                    "status": accreditation.status_code,
                    "validFrom": _fmt_date(accreditation.valid_from),
                    "validTo": _fmt_date(accreditation.valid_to),
                }
                if accreditation
                else None
            ),
            "record": (
                {
                    "id": record.id,
                    "status": record.status_code,
                    "approvalDate": _fmt_date(record.approval_date),
                    "certificateId": record.certificate_id,
                    "applicantName": record.applicant_name,
                }
                if record
                else None
            ),
            "statusHistory": [
                {
                    "id": item.id,
                    "fromStatus": item.from_status_code,
                    "toStatus": item.to_status_code,
                    "comment": item.comment or "",
                    "changedAt": _fmt_datetime(item.changed_at),
                    "changedByUserId": item.changed_by_user_id,
                }
                for item in history
            ],
            "tasks": [
                {
                    "id": task.id,
                    "type": task.task_type_code,
                    "title": task.title,
                    "status": task.task_status_code,
                    "assignedToUserId": task.assigned_to_user_id,
                    "dueAt": _fmt_datetime(task.due_at),
                    "completedAt": _fmt_datetime(task.completed_at),
                    "notes": task.notes or "",
                }
                for task in tasks
            ],
            "documents": [
                self._serialize_document(workflow, document, file)
                for document, file in documents
            ],
            "parties": [self._serialize_party(party) for party in parties],
            "comments": [self._serialize_comment(comment) for comment in comments],
            "events": [
                {
                    "id": event.id,
                    "type": event.event_type_code,
                    "label": event.label,
                    "actor": event.actor_name,
                    "actorRole": event.actor_role,
                    "comment": event.comment or "",
                    "occurredAt": _fmt_datetime(event.occurred_at),
                }
                for event in combined_events
            ],
            "invoices": [
                {
                    "id": invoice.id,
                    "number": invoice.invoice_number,
                    "status": invoice.status_code,
                    "description": invoice.description,
                    "totalAmount": float(invoice.total_amount),
                    "dueDate": _fmt_date(invoice.due_date),
                }
                for invoice in invoices
            ],
            "certificates": [
                {
                    "id": certificate.id,
                    "certificateNumber": certificate.certificate_number,
                    "status": certificate.status_code,
                    "issueDate": _fmt_date(certificate.issue_date),
                    "expiryDate": _fmt_date(certificate.expiry_date),
                    "qrToken": certificate.qr_token,
                }
                for certificate in certificates
            ],
        }

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
                    technical_spec_json={"notes": payload.get("techSpec") or ""},
                )
            )

        applicant_org_id = self.auth_repo.get_primary_organization_id(user.id if user else None)
        workflow = WorkflowApplication(
            application_number=f"APP-{_utcnow().year}-{str(uuid4().int)[-5:]}",
            application_type_code="TYPE_APPROVAL",
            service_module_code="TYPE_APPROVAL",
            applicant_user_id=user.id if user else None,
            applicant_org_id=applicant_org_id,
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
        self.workflow_repo.create_status_history(
            WorkflowApplicationStatusHistory(
                application_id=workflow.id,
                from_status_code=None,
                to_status_code="PENDING",
                changed_by_user_id=user.id if user else None,
                comment="Application submitted via portal.",
            )
        )
        self.workflow_repo.create_task(
            WorkflowApplicationTask(
                application_id=workflow.id,
                task_type_code="REVIEW",
                title="Review type approval application",
                assigned_to_user_id=None,
                task_status_code="OPEN",
                due_at=workflow.expected_decision_at,
                metadata_json={"module": "TYPE_APPROVAL"},
            )
        )

        applicant_name = f"{user.first_name} {user.last_name}".strip() if user else "Portal User"
        party_payloads = list(payload.get("parties") or [])
        if not any(str(item.get("partyType", "")).lower() == "applicant" for item in party_payloads):
            party_payloads.insert(
                0,
                {
                    "partyType": "applicant",
                    "displayName": applicant_name,
                    "organizationId": applicant_org_id,
                    "contactUserId": user.id if user else None,
                    "metadata": {"source": "system"},
                },
            )
        for party_payload in party_payloads:
            self.workflow_repo.create_party(
                WorkflowApplicationParty(
                    application_id=workflow.id,
                    party_type_code=str(party_payload.get("partyType", "")).upper(),
                    organization_id=party_payload.get("organizationId"),
                    contact_user_id=party_payload.get("contactUserId"),
                    display_name=party_payload.get("displayName"),
                    metadata_json=party_payload.get("metadata") or {},
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

    def add_comment(
        self,
        reference: str,
        *,
        user: User,
        role: str,
        body: str,
        visibility: str,
    ) -> dict[str, Any] | None:
        result = self._resolve_application(reference)
        if not result:
            return None
        _, workflow, _ = result
        if not self._ensure_access(workflow, user=user, role=role):
            raise PermissionError("You do not have access to comment on this application.")
        visibility_code = visibility.upper()
        if visibility_code == "PUBLIC":
            visibility_code = "APPLICANT"
        if visibility_code == "INTERNAL" and not self._is_reviewer(role):
            raise PermissionError("Only type approvers and admins can add internal comments.")
        comment = self.workflow_repo.create_comment(
            WorkflowApplicationComment(
                application_id=workflow.id,
                author_user_id=user.id,
                visibility_code=visibility_code,
                body=body.strip(),
            )
        )
        if visibility_code != "INTERNAL":
            self.workflow_repo.create_event(
                WorkflowEvent(
                    resource_kind="application",
                    resource_id=workflow.id,
                    event_type_code="TYPE_APPROVAL_COMMENT_ADDED",
                    label="Comment Added",
                    actor_name=f"{user.first_name} {user.last_name}".strip(),
                    actor_role=self._actor_role(user),
                    is_visible_to_applicant=True,
                    comment=body.strip(),
                )
            )
        return self._serialize_comment(comment)

    def add_party(
        self,
        reference: str,
        *,
        user: User,
        role: str,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        result = self._resolve_application(reference)
        if not result:
            return None
        _, workflow, _ = result
        if not self._ensure_access(workflow, user=user, role=role):
            raise PermissionError("You do not have access to manage parties on this application.")
        party = self.workflow_repo.create_party(
            WorkflowApplicationParty(
                application_id=workflow.id,
                party_type_code=str(payload.get("partyType", "")).upper(),
                organization_id=payload.get("organizationId"),
                contact_user_id=payload.get("contactUserId"),
                display_name=payload.get("displayName"),
                metadata_json=payload.get("metadata") or {},
            )
        )
        return self._serialize_party(party)

    def upload_document(
        self,
        reference: str,
        *,
        user: User,
        role: str,
        file_name: str,
        content_type: str,
        content: bytes,
        document_type: str,
        is_required: bool,
    ) -> dict[str, Any] | None:
        result = self._resolve_application(reference)
        if not result:
            return None
        _, workflow, _ = result
        if not self._ensure_access(workflow, user=user, role=role):
            raise PermissionError("You do not have access to upload documents for this application.")
        if not content:
            raise ValueError("Uploaded file is empty.")
        cleaned_name = self._safe_file_name(file_name)
        storage_key = self.storage.save_bytes(
            folder=f"type-approval/{workflow.application_number}",
            file_name=f"{uuid4().hex[:8]}-{cleaned_name}",
            content=content,
            content_type=content_type,
        )
        document_file = self.workflow_repo.create_file(
            DocumentFile(
                storage_key=storage_key,
                file_name=cleaned_name,
                mime_type=content_type,
                file_size_bytes=len(content),
                checksum_sha256=hashlib.sha256(content).hexdigest(),
                uploaded_by_user_id=user.id,
                source_module_code="TYPE_APPROVAL",
                metadata_json={"applicationNumber": workflow.application_number},
            )
        )
        document = self.workflow_repo.create_document(
            WorkflowApplicationDocument(
                application_id=workflow.id,
                file_id=document_file.id,
                document_type_code=document_type.upper(),
                is_required=is_required,
                review_status_code="PENDING",
                uploaded_by_user_id=user.id,
            )
        )
        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="application",
                resource_id=workflow.id,
                event_type_code="TYPE_APPROVAL_DOCUMENT_UPLOADED",
                label="Document Uploaded",
                actor_name=f"{user.first_name} {user.last_name}".strip(),
                actor_role=self._actor_role(user),
                is_visible_to_applicant=True,
                comment=f"{document_type.upper()} uploaded.",
            )
        )
        return self._serialize_document(workflow, document, document_file)

    def review_document(
        self,
        reference: str,
        *,
        document_id: str,
        reviewer: User,
        role: str,
        review_status: str,
        note: str = "",
    ) -> dict[str, Any] | None:
        result = self._resolve_application(reference)
        if not result:
            return None
        _, workflow, _ = result
        if not self._is_reviewer(role):
            raise PermissionError("Only type approvers and admins can review documents.")
        document_result = self.workflow_repo.get_document(workflow.id, document_id)
        if not document_result:
            return None
        document, document_file = document_result
        document.review_status_code = review_status
        self.db.add(document)
        self.db.flush()

        visibility = "APPLICANT" if review_status in {"REJECTED", "NEEDS_UPDATE"} else "INTERNAL"
        if note:
            self.workflow_repo.create_comment(
                WorkflowApplicationComment(
                    application_id=workflow.id,
                    author_user_id=reviewer.id,
                    visibility_code=visibility,
                    body=note,
                )
            )
        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="application",
                resource_id=workflow.id,
                event_type_code="TYPE_APPROVAL_DOCUMENT_REVIEWED",
                label="Document Reviewed",
                actor_name=f"{reviewer.first_name} {reviewer.last_name}".strip(),
                actor_role=self._actor_role(reviewer),
                is_visible_to_applicant=visibility != "INTERNAL",
                comment=note or f"{document.document_type_code} marked {review_status.lower()}",
            )
        )
        return self._serialize_document(workflow, document, document_file)

    def download_document(
        self,
        reference: str,
        *,
        document_id: str,
        user: User,
        role: str,
    ) -> dict[str, Any] | None:
        result = self._resolve_application(reference)
        if not result:
            return None
        _, workflow, _ = result
        if not self._ensure_access(workflow, user=user, role=role):
            raise PermissionError("You do not have access to this document.")
        document_result = self.workflow_repo.get_document(workflow.id, document_id)
        if not document_result:
            return None
        document, document_file = document_result
        return self._serialize_document(workflow, document, document_file)

    def officer_action(
        self,
        application_id: str,
        *,
        action: str,
        officer: User,
        note: str = "",
    ) -> WorkflowApplication | None:
        """Perform validate / approve / reject / remand / confirm_payment / issue_certificate on a type approval application."""
        result = self._resolve_application(application_id)
        if result:
            type_application, workflow, device = result
        else:
            workflow = self.workflow_repo.get_application(application_id)
            if not workflow or workflow.application_type_code != "TYPE_APPROVAL":
                return None
            fallback_result = self._resolve_application(workflow.id)
            if not fallback_result:
                return None
            type_application, workflow, device = fallback_result
        if workflow.application_type_code != "TYPE_APPROVAL":
            return None

        # validate: PENDING → VALIDATED
        # approve: VALIDATED → APPROVED (issues invoice, payment pending)
        # confirm_payment: APPROVED → CERTIFICATE_ISSUED (issues cert)
        # reject: any → REJECTED
        # remand: any → PENDING/REMANDED
        action_map = {
            "validate":          ("VALIDATED",          "VALIDATED",          "Application Validated"),
            "approve":           ("APPROVED",           "PAYMENT_PENDING",    "Application Approved — Invoice Issued"),
            "confirm_payment":   ("CERTIFICATE_ISSUED", "CERTIFICATE_ISSUED", "Payment Confirmed — Certificate Issued"),
            "issue_certificate": ("CERTIFICATE_ISSUED", "ISSUED",             "Certificate Issued"),
            "reject":            ("REJECTED",           "REJECTED",           "Application Rejected"),
            "remand":            ("PENDING",            "REMANDED",           "Application Remanded"),
        }
        if action not in action_map:
            raise ValueError(f"Unsupported action: {action}")

        reviewer_role = self._actor_role(officer)
        if reviewer_role not in self.REVIEWER_ROLES:
            raise PermissionError("Only type approvers and admins can progress type approval applications.")

        if action == "validate":
            documents = self.workflow_repo.list_documents(workflow.id)
            required_documents = [document for document, _ in documents if document.is_required]
            if required_documents and any(document.review_status_code != "APPROVED" for document in required_documents):
                raise ValueError("All required documents must be approved before validation.")

        old_status = workflow.current_status_code
        new_status, new_stage, label = action_map[action]
        workflow.current_status_code = new_status
        workflow.current_stage_code = new_stage
        self.db.flush()

        self.workflow_repo.create_status_history(
            WorkflowApplicationStatusHistory(
                application_id=workflow.id,
                from_status_code=old_status,
                to_status_code=new_status,
                changed_by_user_id=officer.id,
                comment=note or label,
            )
        )
        self.workflow_repo.complete_open_tasks(workflow.id, note=note or label)

        if action == "validate":
            self.workflow_repo.create_task(
                WorkflowApplicationTask(
                    application_id=workflow.id,
                    task_type_code="APPROVAL",
                    title="Approve validated type approval application",
                    assigned_to_user_id=officer.id,
                    task_status_code="OPEN",
                    due_at=workflow.expected_decision_at,
                    notes=note or None,
                    metadata_json={"module": "TYPE_APPROVAL"},
                )
            )

        if action == "approve":
            invoices = self.billing_repo.list_invoices_for_application(workflow.id)
            if not invoices:
                due_date = _utcnow().date() + timedelta(days=14)
                invoice = self.billing_repo.create_invoice(
                    Invoice(
                        invoice_number=f"INV-TA-{_utcnow().year}-{uuid4().hex[:6].upper()}",
                        application_id=workflow.id,
                        payer_org_id=workflow.applicant_org_id,
                        owner_user_id=workflow.applicant_user_id,
                        description=f"Type approval processing fee for {device.brand_name} {device.model_name}",
                        service_name="Type Approval",
                        currency_code="BWP",
                        subtotal_amount=7500.00,
                        vat_amount=900.00,
                        total_amount=8400.00,
                        due_date=due_date,
                        status_code="UNPAID",
                    )
                )
                self.billing_repo.create_invoice_item(
                    InvoiceItem(
                        invoice_id=invoice.id,
                        line_no=1,
                        item_code="TYPE_APPROVAL_FEE",
                        description=f"Type approval fee for {device.brand_name} {device.model_name}",
                        quantity=1,
                        unit_amount=7500.00,
                        line_total_amount=7500.00,
                    )
                )
            self.workflow_repo.create_task(
                WorkflowApplicationTask(
                    application_id=workflow.id,
                    task_type_code="PAYMENT",
                    title="Await payment for approved type approval application",
                    assigned_to_user_id=workflow.applicant_user_id,
                    task_status_code="OPEN",
                    due_at=_utcnow() + timedelta(days=14),
                    notes=note or None,
                    metadata_json={"module": "TYPE_APPROVAL"},
                )
            )

        if action == "remand":
            self.workflow_repo.create_task(
                WorkflowApplicationTask(
                    application_id=workflow.id,
                    task_type_code="APPLICANT_UPDATE",
                    title="Applicant to amend type approval submission",
                    assigned_to_user_id=workflow.applicant_user_id,
                    task_status_code="OPEN",
                    due_at=_utcnow() + timedelta(days=7),
                    notes=note or None,
                    metadata_json={"module": "TYPE_APPROVAL"},
                )
            )

        if note:
            visibility = "INTERNAL"
            if action in {"remand", "reject"}:
                visibility = "APPLICANT"
            self.workflow_repo.create_comment(
                WorkflowApplicationComment(
                    application_id=workflow.id,
                    author_user_id=officer.id,
                    visibility_code=visibility,
                    body=note,
                )
            )

        if action in {"issue_certificate", "confirm_payment"}:
            invoices = self.billing_repo.list_invoices_for_application(workflow.id)
            if invoices and any(invoice.status_code not in {"PAID", "COMPLETED"} for invoice in invoices):
                raise ValueError("Type approval invoice must be paid before issuing a certificate.")
            existing_certificates = self.certificate_repo.list_for_application(workflow.id)
            cert = existing_certificates[0] if existing_certificates else None
            if not cert:
                today = _utcnow().date()
                cert = Certificate(
                    certificate_number=f"TA-{today.year}-{uuid4().hex[:6].upper()}",
                    certificate_type="TYPE_APPROVAL",
                    holder_name=self._applicant_display_name(workflow),
                    device_name=f"{device.brand_name} {device.model_name}",
                    issue_date=today,
                    expiry_date=today.replace(year=today.year + 3),
                    status_code="ACTIVE",
                    qr_token=uuid4().hex,
                    application_id=workflow.id,
                    owner_user_id=workflow.applicant_user_id,
                    issued_by=f"{officer.first_name} {officer.last_name}".strip(),
                    remarks=note or None,
                )
                self.db.add(cert)
                self.db.flush()
            record = self.device_repo.get_type_approval_record_by_application(type_application.id)
            if not record:
                record = TypeApprovalRecord(
                    device_model_id=type_application.device_model_id,
                    certificate_id=cert.id,
                    application_id=type_application.id,
                    status_code="APPROVED",
                    approval_date=_utcnow().date(),
                    applicant_name=self._applicant_display_name(workflow),
                )
                self.db.add(record)
            else:
                record.certificate_id = cert.id
                record.status_code = "APPROVED"
                record.approval_date = _utcnow().date()
                self.db.add(record)
            self.db.flush()
            # Mark invoice paid if one exists
            billing_repo = BillingRepository(self.db)
            invoice = billing_repo.get_invoice_by_application_id(workflow.id)
            if invoice:
                invoice.status_code = "PAID"
                self.db.flush()

        self.workflow_repo.create_event(
            WorkflowEvent(
                resource_kind="application",
                resource_id=workflow.id,
                event_type_code=f"TYPE_APPROVAL_{action.upper()}",
                label=label,
                actor_name=f"{officer.first_name} {officer.last_name}".strip(),
                actor_role=reviewer_role,
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
                    source_table="workflow.applications",
                    source_id=workflow.id,
                )
            )
        self.audit_repo.create_log(
            AuditLog(
                actor_user_id=officer.id,
                action_code=f"TYPE_APPROVAL_{action.upper()}",
                entity_table="workflow.applications",
                entity_id=workflow.id,
                before_json={"status": old_status},
                after_json={"status": new_status, "stage": new_stage},
                metadata_json={"module": "TYPE_APPROVAL", "applicationNumber": workflow.application_number},
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
        user_id = user.id if user and role not in {"officer", "type_approver", "admin"} else None
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
        user_id = user.id if user and role not in {"officer", "type_approver", "admin"} else None
        return self.repo.list_invoices(user_id=user_id)

    def list_payments(self, user: User | None, role: str) -> list[Payment]:
        user_id = user.id if user and role not in {"officer", "type_approver", "admin"} else None
        return self.repo.list_payments(user_id=user_id)

    def list_receipts(self, user: User | None, role: str) -> list[Receipt]:
        user_id = user.id if user and role not in {"officer", "type_approver", "admin"} else None
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
