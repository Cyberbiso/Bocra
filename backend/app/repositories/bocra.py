from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.entities import (
    Accreditation,
    AgentAction,
    AgentMessage,
    AgentThread,
    AgentToolCall,
    Certificate,
    Complaint,
    ComplaintAttachment,
    ComplaintCategory,
    ComplaintMessage,
    DeviceCatalog,
    DeviceVerificationItem,
    Invoice,
    KnowledgeChunk,
    KnowledgeDocument,
    LicenseApplication,
    LicenseRecord,
    Notification,
    Organization,
    Payment,
    Permission,
    Receipt,
    Role,
    RolePermission,
    SessionToken,
    TypeApprovalApplication,
    TypeApprovalRecord,
    User,
    UserRole,
    WorkflowApplication,
    WorkflowEvent,
)


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(func.lower(User.email) == email.lower()))

    def get_user_by_id(self, user_id: str | None) -> User | None:
        if not user_id:
            return None
        return self.db.get(User, user_id)

    def get_active_session(self, token: str) -> SessionToken | None:
        return self.db.scalar(
            select(SessionToken)
            .where(SessionToken.token == token, SessionToken.expires_at > datetime.now(timezone.utc))
        )

    def create_session(self, session_token: SessionToken) -> SessionToken:
        self.db.add(session_token)
        self.db.flush()
        return session_token

    def delete_session(self, token: str) -> None:
        session = self.db.scalar(select(SessionToken).where(SessionToken.token == token))
        if session:
            self.db.delete(session)
            self.db.flush()

    def get_roles_for_user(self, user_id: str) -> list[Role]:
        stmt = (
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        return list(self.db.scalars(stmt))

    def get_permissions_for_roles(self, role_ids: list[str]) -> list[Permission]:
        if not role_ids:
            return []
        stmt = (
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id.in_(role_ids))
        )
        return list(self.db.scalars(stmt))


class KnowledgeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_notices(self, limit: int = 3) -> list[KnowledgeDocument]:
        stmt = (
            select(KnowledgeDocument)
            .where(KnowledgeDocument.document_type_code == "NOTICE")
            .order_by(KnowledgeDocument.published_at.desc(), KnowledgeDocument.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def list_documents(self) -> list[KnowledgeDocument]:
        return list(self.db.scalars(select(KnowledgeDocument)))

    def get_document_by_source(self, source_url: str) -> KnowledgeDocument | None:
        return self.db.scalar(select(KnowledgeDocument).where(KnowledgeDocument.source_url == source_url))

    def create_document(self, document: KnowledgeDocument) -> KnowledgeDocument:
        self.db.add(document)
        self.db.flush()
        return document

    def create_chunk(self, chunk: KnowledgeChunk) -> KnowledgeChunk:
        self.db.add(chunk)
        self.db.flush()
        return chunk

    def delete_chunks_for_document(self, document_id: str) -> None:
        from sqlalchemy import delete as _delete
        self.db.execute(_delete(KnowledgeChunk).where(KnowledgeChunk.document_id == document_id))

    def search_chunks(self, query: str, limit: int = 5) -> list[tuple[KnowledgeChunk, KnowledgeDocument]]:
        normalized = query.lower().strip()
        if not normalized:
            return []
        stop_words = {"the", "and", "for", "with", "that", "this", "from", "what", "does", "how", "your"}
        terms = [term for term in re.findall(r"[a-z0-9]+", normalized) if len(term) > 2 and term not in stop_words]
        if not terms:
            terms = [normalized]
        conditions = [func.lower(KnowledgeChunk.content).like(f"%{term}%") for term in terms]
        stmt = (
            select(KnowledgeChunk, KnowledgeDocument)
            .join(KnowledgeDocument, KnowledgeDocument.id == KnowledgeChunk.document_id)
            .where(or_(*conditions))
        )
        results = list(self.db.execute(stmt).all())

        def score(row: tuple[KnowledgeChunk, KnowledgeDocument]) -> tuple[int, int]:
            chunk, document = row
            title = (document.title or "").lower()
            content = chunk.content.lower()
            title_hits = sum(1 for term in terms if term in title)
            content_hits = sum(1 for term in terms if term in content)
            return (title_hits, content_hits)

        results.sort(key=score, reverse=True)
        return results[:limit]


class WorkflowRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_application(self, application: WorkflowApplication) -> WorkflowApplication:
        self.db.add(application)
        self.db.flush()
        return application

    def get_application(self, application_id: str) -> WorkflowApplication | None:
        return self.db.get(WorkflowApplication, application_id)

    def get_application_by_number(self, number: str) -> WorkflowApplication | None:
        return self.db.scalar(select(WorkflowApplication).where(WorkflowApplication.application_number == number))

    def list_applications(self, user_id: str | None = None) -> list[WorkflowApplication]:
        stmt = select(WorkflowApplication)
        if user_id:
            stmt = stmt.where(WorkflowApplication.applicant_user_id == user_id)
        return list(self.db.scalars(stmt.order_by(WorkflowApplication.created_at.desc())))

    def create_event(self, event: WorkflowEvent) -> WorkflowEvent:
        self.db.add(event)
        self.db.flush()
        return event

    def list_events_for_resource(self, resource_kind: str, resource_id: str) -> list[WorkflowEvent]:
        stmt = (
            select(WorkflowEvent)
            .where(WorkflowEvent.resource_kind == resource_kind, WorkflowEvent.resource_id == resource_id)
            .order_by(WorkflowEvent.occurred_at.asc())
        )
        return list(self.db.scalars(stmt))

    def list_recent_events(self, visible_only: bool = True, limit: int = 5) -> list[WorkflowEvent]:
        stmt = select(WorkflowEvent)
        if visible_only:
            stmt = stmt.where(WorkflowEvent.is_visible_to_applicant.is_(True))
        stmt = stmt.order_by(WorkflowEvent.occurred_at.desc()).limit(limit)
        return list(self.db.scalars(stmt))


class ComplaintRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_categories(self) -> list[ComplaintCategory]:
        return list(self.db.scalars(select(ComplaintCategory).order_by(ComplaintCategory.name.asc())))

    def list_complaints(
        self,
        *,
        role: str,
        user_id: str | None,
        status: str | None,
        operator: str | None,
        date_from: str | None,
        date_to: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Complaint], int]:
        conditions = []
        if role not in {"officer", "admin"} and user_id:
            conditions.append(Complaint.complainant_user_id == user_id)
        if status and status != "ALL":
            conditions.append(Complaint.current_status_code == status)
        if operator and operator != "ALL":
            conditions.append(Complaint.service_provider_name == operator)
        if date_from:
            conditions.append(func.date(Complaint.created_at) >= date_from)
        if date_to:
            conditions.append(func.date(Complaint.created_at) <= date_to)

        stmt = select(Complaint)
        count_stmt = select(func.count()).select_from(Complaint)
        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = int(self.db.scalar(count_stmt) or 0)
        stmt = stmt.order_by(Complaint.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        return list(self.db.scalars(stmt)), total

    def create_complaint(self, complaint: Complaint) -> Complaint:
        self.db.add(complaint)
        self.db.flush()
        return complaint

    def get_complaint(self, complaint_id: str) -> Complaint | None:
        return self.db.get(Complaint, complaint_id)

    def get_complaint_by_reference(self, complaint_ref: str) -> Complaint | None:
        return self.db.scalar(
            select(Complaint).where(
                or_(Complaint.id == complaint_ref, Complaint.complaint_number == complaint_ref)
            )
        )

    def add_message(self, message: ComplaintMessage) -> ComplaintMessage:
        self.db.add(message)
        self.db.flush()
        return message

    def list_messages(self, complaint_id: str) -> list[ComplaintMessage]:
        stmt = (
            select(ComplaintMessage)
            .where(ComplaintMessage.complaint_id == complaint_id)
            .order_by(ComplaintMessage.created_at.asc())
        )
        return list(self.db.scalars(stmt))

    def add_attachment(self, attachment: ComplaintAttachment) -> ComplaintAttachment:
        self.db.add(attachment)
        self.db.flush()
        return attachment

    def list_attachments(self, complaint_id: str) -> list[ComplaintAttachment]:
        stmt = (
            select(ComplaintAttachment)
            .where(ComplaintAttachment.complaint_id == complaint_id)
            .order_by(ComplaintAttachment.uploaded_at.asc())
        )
        return list(self.db.scalars(stmt))


class LicensingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_licence_records(self, user_id: str | None = None) -> list[LicenseRecord]:
        stmt = select(LicenseRecord).order_by(LicenseRecord.expiry_date.asc())
        if user_id:
            stmt = stmt.join(WorkflowApplication, WorkflowApplication.id == LicenseRecord.workflow_application_id)
            stmt = stmt.where(WorkflowApplication.applicant_user_id == user_id)
        return list(self.db.scalars(stmt))

    def get_licence_record(self, record_id: str) -> LicenseRecord | None:
        return self.db.get(LicenseRecord, record_id)

    def list_license_applications(self, user_id: str | None = None) -> list[LicenseApplication]:
        stmt = select(LicenseApplication).order_by(LicenseApplication.created_at.desc())
        if user_id:
            stmt = stmt.join(WorkflowApplication, WorkflowApplication.id == LicenseApplication.workflow_application_id)
            stmt = stmt.where(WorkflowApplication.applicant_user_id == user_id)
        return list(self.db.scalars(stmt))

    def get_license_application(self, application_id: str) -> LicenseApplication | None:
        return self.db.get(LicenseApplication, application_id)

    def create_license_application(self, application: LicenseApplication) -> LicenseApplication:
        self.db.add(application)
        self.db.flush()
        return application

    def licence_customer_search(self, name: str) -> list[Organization]:
        stmt = (
            select(Organization)
            .where(func.lower(Organization.legal_name).like(f"%{name.lower()}%"))
            .order_by(Organization.legal_name.asc())
        )
        return list(self.db.scalars(stmt))


class DeviceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_type_approvals(self) -> list[TypeApprovalRecord]:
        return list(self.db.scalars(select(TypeApprovalRecord).order_by(TypeApprovalRecord.created_at.desc())))

    def get_device(self, device_id: str) -> DeviceCatalog | None:
        return self.db.get(DeviceCatalog, device_id)

    def find_device_by_brand_model(self, brand_name: str, model_name: str) -> DeviceCatalog | None:
        stmt = select(DeviceCatalog).where(
            func.lower(DeviceCatalog.brand_name) == brand_name.lower(),
            func.lower(DeviceCatalog.model_name) == model_name.lower(),
        )
        return self.db.scalar(stmt)

    def create_device(self, device: DeviceCatalog) -> DeviceCatalog:
        self.db.add(device)
        self.db.flush()
        return device

    def get_accreditation(self, user_id: str | None, accreditation_type: str) -> Accreditation | None:
        if not user_id:
            return None
        stmt = (
            select(Accreditation)
            .where(
                Accreditation.user_id == user_id,
                Accreditation.accreditation_type_code == accreditation_type,
            )
            .order_by(Accreditation.created_at.desc())
        )
        return self.db.scalar(stmt)

    def create_type_approval_application(
        self,
        application: TypeApprovalApplication,
    ) -> TypeApprovalApplication:
        self.db.add(application)
        self.db.flush()
        return application

    def list_verification_items(self) -> list[DeviceVerificationItem]:
        return list(self.db.scalars(select(DeviceVerificationItem)))

    def find_verification_item(self, imei: str) -> DeviceVerificationItem | None:
        stmt = select(DeviceVerificationItem).where(DeviceVerificationItem.imei == imei)
        return self.db.scalar(stmt)


class CertificateRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_certificates(self, user_id: str | None = None, cert_type: str | None = None) -> list[Certificate]:
        stmt = select(Certificate)
        if user_id:
            stmt = stmt.where(or_(Certificate.owner_user_id == user_id, Certificate.owner_user_id.is_(None)))
        if cert_type and cert_type != "ALL":
            stmt = stmt.where(Certificate.certificate_type == cert_type)
        stmt = stmt.order_by(Certificate.issue_date.desc())
        return list(self.db.scalars(stmt))

    def get_by_qr_token(self, token: str) -> Certificate | None:
        return self.db.scalar(select(Certificate).where(Certificate.qr_token == token))


class BillingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_invoices(self, user_id: str | None = None) -> list[Invoice]:
        stmt = select(Invoice).order_by(Invoice.due_date.asc())
        if user_id:
            stmt = stmt.where(or_(Invoice.owner_user_id == user_id, Invoice.owner_user_id.is_(None)))
        return list(self.db.scalars(stmt))

    def list_payments(self, user_id: str | None = None) -> list[Payment]:
        stmt = select(Payment).order_by(Payment.created_at.desc())
        if user_id:
            stmt = stmt.join(Invoice, Invoice.id == Payment.invoice_id).where(
                or_(Invoice.owner_user_id == user_id, Invoice.owner_user_id.is_(None))
            )
        return list(self.db.scalars(stmt))

    def list_receipts(self, user_id: str | None = None) -> list[Receipt]:
        stmt = select(Receipt).order_by(Receipt.issued_at.desc())
        if user_id:
            stmt = stmt.join(Payment, Payment.id == Receipt.payment_id).join(Invoice, Invoice.id == Payment.invoice_id).where(
                or_(Invoice.owner_user_id == user_id, Invoice.owner_user_id.is_(None))
            )
        return list(self.db.scalars(stmt))

    def get_invoice(self, invoice_id: str) -> Invoice | None:
        return self.db.get(Invoice, invoice_id)

    def create_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment

    def update_invoice(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        self.db.flush()
        return invoice

    def create_receipt(self, receipt: Receipt) -> Receipt:
        self.db.add(receipt)
        self.db.flush()
        return receipt


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.flush()
        return notification

    def list_for_user(self, user_id: str | None) -> list[Notification]:
        stmt = select(Notification).order_by(Notification.created_at.desc())
        if user_id:
            stmt = stmt.where(Notification.user_id == user_id)
        return list(self.db.scalars(stmt))

    def get(self, notification_id: str) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def mark_read(self, notification_id: str, user_id: str) -> Notification | None:
        notification = self.db.get(Notification, notification_id)
        if not notification or notification.user_id != user_id:
            return None
        notification.status_code = "READ"
        self.db.flush()
        return notification


class SearchRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def search_licences(self, query: str) -> list[LicenseRecord]:
        stmt = select(LicenseRecord)
        if query:
            q = f"%{query.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(LicenseRecord.holder_name).like(q),
                    func.lower(LicenseRecord.licence_number).like(q),
                    func.lower(LicenseRecord.licence_type).like(q),
                )
            )
        return list(self.db.scalars(stmt))

    def search_certificates(self, query: str) -> list[Certificate]:
        stmt = select(Certificate)
        if query:
            q = f"%{query.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Certificate.certificate_number).like(q),
                    func.lower(Certificate.certificate_type).like(q),
                )
            )
        return list(self.db.scalars(stmt))

    def search_type_approvals(self, query: str) -> list[tuple[TypeApprovalRecord, DeviceCatalog]]:
        stmt = select(TypeApprovalRecord, DeviceCatalog).join(DeviceCatalog, DeviceCatalog.id == TypeApprovalRecord.device_model_id)
        if query:
            q = f"%{query.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(DeviceCatalog.brand_name).like(q),
                    func.lower(DeviceCatalog.model_name).like(q),
                    func.lower(DeviceCatalog.device_type).like(q),
                )
            )
        return list(self.db.execute(stmt).all())

    def search_devices(self, query: str) -> list[tuple[DeviceVerificationItem, DeviceCatalog | None]]:
        stmt = select(DeviceVerificationItem, DeviceCatalog).join(
            DeviceCatalog, DeviceCatalog.id == DeviceVerificationItem.device_model_id, isouter=True
        )
        if query:
            q = f"%{query.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(DeviceVerificationItem.imei).like(q),
                    func.lower(DeviceCatalog.brand_name).like(q),
                    func.lower(DeviceCatalog.model_name).like(q),
                )
            )
        return list(self.db.execute(stmt).all())

    def search_organizations(self, query: str) -> list[Organization]:
        stmt = select(Organization)
        if query:
            q = f"%{query.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Organization.legal_name).like(q),
                    func.lower(Organization.registration_number).like(q),
                    func.lower(Organization.org_type_code).like(q),
                )
            )
        return list(self.db.scalars(stmt))


class AgentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_thread(self, external_thread_id: str) -> AgentThread | None:
        return self.db.scalar(select(AgentThread).where(AgentThread.external_thread_id == external_thread_id))

    def create_thread(self, thread: AgentThread) -> AgentThread:
        self.db.add(thread)
        self.db.flush()
        return thread

    def add_message(self, message: AgentMessage) -> AgentMessage:
        self.db.add(message)
        self.db.flush()
        return message

    def list_messages(self, thread_id: str) -> list[AgentMessage]:
        stmt = select(AgentMessage).where(AgentMessage.thread_id == thread_id).order_by(AgentMessage.created_at.asc())
        return list(self.db.scalars(stmt))

    def add_tool_call(self, tool_call: AgentToolCall) -> AgentToolCall:
        self.db.add(tool_call)
        self.db.flush()
        return tool_call

    def add_action(self, action: AgentAction) -> AgentAction:
        self.db.add(action)
        self.db.flush()
        return action
