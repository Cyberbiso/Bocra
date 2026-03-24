from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, fk, schema_args, schema_name


def uuid_str() -> str:
    return str(uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class Organization(Base, TimestampMixin):
    __tablename__ = schema_name("iam", "organizations")
    __table_args__ = schema_args("iam")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    legal_name: Mapped[str] = mapped_column(Text, nullable=False)
    trading_name: Mapped[str | None] = mapped_column(Text)
    org_type_code: Mapped[str] = mapped_column(Text, default="PRIVATE_COMPANY")
    registration_number: Mapped[str | None] = mapped_column(Text, unique=True)
    tax_number: Mapped[str | None] = mapped_column(Text)
    status_code: Mapped[str] = mapped_column(Text, default="ACTIVE")


class User(Base, TimestampMixin):
    __tablename__ = schema_name("iam", "users")
    __table_args__ = schema_args("iam")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    password_hash: Mapped[str | None] = mapped_column(Text)
    auth_provider: Mapped[str] = mapped_column(Text, default="local")
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    phone_e164: Mapped[str | None] = mapped_column(Text)
    national_id: Mapped[str | None] = mapped_column(Text)
    passport_number: Mapped[str | None] = mapped_column(Text)
    status_code: Mapped[str] = mapped_column(Text, default="ACTIVE")
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Role(Base):
    __tablename__ = schema_name("iam", "roles")
    __table_args__ = schema_args("iam")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    role_code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    scope_code: Mapped[str] = mapped_column(Text, default="GLOBAL")


class Permission(Base):
    __tablename__ = schema_name("iam", "permissions")
    __table_args__ = schema_args("iam")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    permission_code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    module_code: Mapped[str] = mapped_column(Text, nullable=False)


class RolePermission(Base):
    __tablename__ = schema_name("iam", "role_permissions")
    __table_args__ = schema_args("iam")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    role_id: Mapped[str] = mapped_column(ForeignKey(fk("iam", "roles", "id")), nullable=False)
    permission_id: Mapped[str] = mapped_column(ForeignKey(fk("iam", "permissions", "id")), nullable=False)


class UserRole(Base):
    __tablename__ = schema_name("iam", "user_roles")
    __table_args__ = schema_args("iam")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey(fk("iam", "users", "id")), nullable=False)
    role_id: Mapped[str] = mapped_column(ForeignKey(fk("iam", "roles", "id")), nullable=False)
    organization_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "organizations", "id")))
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SessionToken(Base):
    __tablename__ = schema_name("iam", "sessions")
    __table_args__ = schema_args("iam")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    token: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey(fk("iam", "users", "id")), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped[User] = relationship()


class WorkflowApplication(Base, TimestampMixin):
    __tablename__ = schema_name("workflow", "applications")
    __table_args__ = schema_args("workflow")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    application_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    application_type_code: Mapped[str] = mapped_column(Text, nullable=False)
    service_module_code: Mapped[str] = mapped_column(Text, nullable=False)
    applicant_user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    applicant_org_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "organizations", "id")))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    current_status_code: Mapped[str] = mapped_column(Text, nullable=False)
    current_stage_code: Mapped[str | None] = mapped_column(Text)
    public_tracker_token: Mapped[str | None] = mapped_column(Text, unique=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expected_decision_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    priority_code: Mapped[str] = mapped_column(Text, default="NORMAL")
    source_channel: Mapped[str] = mapped_column(Text, default="PORTAL")
    external_system_code: Mapped[str | None] = mapped_column(Text)
    external_record_id: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)


class WorkflowEvent(Base):
    __tablename__ = schema_name("workflow", "events")
    __table_args__ = schema_args("workflow")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    resource_kind: Mapped[str] = mapped_column(Text, nullable=False)
    resource_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    event_type_code: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    actor_name: Mapped[str] = mapped_column(Text, nullable=False)
    actor_role: Mapped[str] = mapped_column(Text, nullable=False)
    is_visible_to_applicant: Mapped[bool] = mapped_column(Boolean, default=True)
    comment: Mapped[str | None] = mapped_column(Text)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)


class ComplaintCategory(Base):
    __tablename__ = schema_name("complaints", "categories")
    __table_args__ = schema_args("complaints")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    category_code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    sector_code: Mapped[str] = mapped_column(Text, default="COMMUNICATIONS")
    default_sla_hours: Mapped[int] = mapped_column(Integer, default=168)


class Complaint(Base, TimestampMixin):
    __tablename__ = schema_name("complaints", "complaints")
    __table_args__ = schema_args("complaints")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    complaint_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    application_id: Mapped[str | None] = mapped_column(ForeignKey(fk("workflow", "applications", "id")))
    complainant_user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    complainant_org_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "organizations", "id")))
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    complaint_type_code: Mapped[str] = mapped_column(Text, nullable=False)
    service_provider_name: Mapped[str | None] = mapped_column(Text)
    operator_code: Mapped[str | None] = mapped_column(Text)
    location_text: Mapped[str | None] = mapped_column(Text)
    provider_contacted_first: Mapped[bool] = mapped_column(Boolean, default=False)
    narrative: Mapped[str] = mapped_column(Text, nullable=False)
    current_status_code: Mapped[str] = mapped_column(Text, default="NEW")
    assigned_to_user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    sla_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expected_resolution_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolution_summary: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)


class ComplaintMessage(Base):
    __tablename__ = schema_name("complaints", "messages")
    __table_args__ = schema_args("complaints")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    complaint_id: Mapped[str] = mapped_column(ForeignKey(fk("complaints", "complaints", "id")), nullable=False)
    author_user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    author_name: Mapped[str] = mapped_column(Text, nullable=False)
    author_role: Mapped[str] = mapped_column(Text, nullable=False)
    visibility_code: Mapped[str] = mapped_column(Text, default="PUBLIC")
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class ComplaintAttachment(Base):
    __tablename__ = schema_name("complaints", "attachments")
    __table_args__ = schema_args("complaints")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    complaint_id: Mapped[str] = mapped_column(ForeignKey(fk("complaints", "complaints", "id")), nullable=False)
    file_name: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class LicenseRecord(Base, TimestampMixin):
    __tablename__ = schema_name("licensing", "records")
    __table_args__ = schema_args("licensing")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    workflow_application_id: Mapped[str | None] = mapped_column(ForeignKey(fk("workflow", "applications", "id")))
    licence_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    licence_type: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    sub_category: Mapped[str | None] = mapped_column(Text)
    status_code: Mapped[str] = mapped_column(Text, nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    holder_name: Mapped[str] = mapped_column(Text, nullable=False)
    holder_address: Mapped[str | None] = mapped_column(Text)
    coverage_area: Mapped[str | None] = mapped_column(Text)
    frequency_band: Mapped[str | None] = mapped_column(Text)
    assigned_officer_name: Mapped[str | None] = mapped_column(Text)
    assigned_officer_dept: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)


class LicenseApplication(Base, TimestampMixin):
    __tablename__ = schema_name("licensing", "applications")
    __table_args__ = schema_args("licensing")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    workflow_application_id: Mapped[str] = mapped_column(ForeignKey(fk("workflow", "applications", "id")), nullable=False)
    category_code: Mapped[str] = mapped_column(Text, nullable=False)
    licence_type_name: Mapped[str] = mapped_column(Text, nullable=False)
    applicant_name: Mapped[str] = mapped_column(Text, nullable=False)
    applicant_email: Mapped[str] = mapped_column(Text, nullable=False)
    coverage_area: Mapped[str | None] = mapped_column(Text)
    form_data_json: Mapped[dict[str, Any]] = mapped_column("form_data", JSON, default=dict)


class Accreditation(Base, TimestampMixin):
    __tablename__ = schema_name("device", "accreditations")
    __table_args__ = schema_args("device")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    organization_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "organizations", "id")))
    user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    accreditation_type_code: Mapped[str] = mapped_column(Text, nullable=False)
    reference_number: Mapped[str | None] = mapped_column(Text)
    status_code: Mapped[str] = mapped_column(Text, nullable=False)
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_to: Mapped[date | None] = mapped_column(Date)


class DeviceCatalog(Base, TimestampMixin):
    __tablename__ = schema_name("device", "catalog")
    __table_args__ = schema_args("device")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    brand_name: Mapped[str] = mapped_column(Text, nullable=False)
    marketing_name: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(Text, nullable=False)
    device_type: Mapped[str] = mapped_column(Text, default="Smartphone")
    is_sim_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    technical_spec_json: Mapped[dict[str, Any]] = mapped_column("technical_spec", JSON, default=dict)


class TypeApprovalApplication(Base, TimestampMixin):
    __tablename__ = schema_name("device", "type_approval_applications")
    __table_args__ = schema_args("device")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    workflow_application_id: Mapped[str] = mapped_column(ForeignKey(fk("workflow", "applications", "id")), nullable=False)
    device_model_id: Mapped[str] = mapped_column(ForeignKey(fk("device", "catalog", "id")), nullable=False)
    accreditation_id: Mapped[str | None] = mapped_column(ForeignKey(fk("device", "accreditations", "id")))
    sample_imei: Mapped[str | None] = mapped_column(Text)
    country_of_manufacture: Mapped[str | None] = mapped_column(Text)
    form_data_json: Mapped[dict[str, Any]] = mapped_column("form_data", JSON, default=dict)


class TypeApprovalRecord(Base, TimestampMixin):
    __tablename__ = schema_name("device", "type_approval_records")
    __table_args__ = schema_args("device")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    device_model_id: Mapped[str] = mapped_column(ForeignKey(fk("device", "catalog", "id")), nullable=False)
    certificate_id: Mapped[str | None] = mapped_column(Text)
    application_id: Mapped[str | None] = mapped_column(ForeignKey(fk("device", "type_approval_applications", "id")))
    status_code: Mapped[str] = mapped_column(Text, nullable=False)
    approval_date: Mapped[date | None] = mapped_column(Date)
    applicant_name: Mapped[str | None] = mapped_column(Text)


class DeviceVerificationItem(Base):
    __tablename__ = schema_name("device", "verification_items")
    __table_args__ = schema_args("device")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    imei: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    serial_number: Mapped[str | None] = mapped_column(Text)
    device_model_id: Mapped[str | None] = mapped_column(ForeignKey(fk("device", "catalog", "id")))
    verification_source: Mapped[str] = mapped_column(Text, default="BOCRA")
    verification_status_code: Mapped[str] = mapped_column(Text, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text)
    response_payload_json: Mapped[dict[str, Any]] = mapped_column("response_payload", JSON, default=dict)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class Certificate(Base, TimestampMixin):
    __tablename__ = schema_name("docs", "certificates")
    __table_args__ = schema_args("docs")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    certificate_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    certificate_type: Mapped[str] = mapped_column(Text, nullable=False)
    holder_name: Mapped[str] = mapped_column(Text, nullable=False)
    device_name: Mapped[str | None] = mapped_column(Text)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    status_code: Mapped[str] = mapped_column(Text, nullable=False)
    qr_token: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    application_id: Mapped[str | None] = mapped_column(Text)
    owner_user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    issued_by: Mapped[str] = mapped_column(Text, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text)


class Invoice(Base, TimestampMixin):
    __tablename__ = schema_name("billing", "invoices")
    __table_args__ = schema_args("billing")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    invoice_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    application_id: Mapped[str | None] = mapped_column(Text)
    payer_org_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "organizations", "id")))
    owner_user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    service_name: Mapped[str] = mapped_column(Text, nullable=False)
    currency_code: Mapped[str] = mapped_column(Text, default="BWP")
    subtotal_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    vat_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status_code: Mapped[str] = mapped_column(Text, nullable=False)


class Payment(Base):
    __tablename__ = schema_name("billing", "payments")
    __table_args__ = schema_args("billing")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    invoice_id: Mapped[str] = mapped_column(ForeignKey(fk("billing", "invoices", "id")), nullable=False)
    gateway_code: Mapped[str] = mapped_column(Text, nullable=False)
    gateway_reference: Mapped[str] = mapped_column(Text, nullable=False)
    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status_code: Mapped[str] = mapped_column(Text, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class Receipt(Base):
    __tablename__ = schema_name("billing", "receipts")
    __table_args__ = schema_args("billing")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    payment_id: Mapped[str] = mapped_column(ForeignKey(fk("billing", "payments", "id")), nullable=False)
    receipt_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    file_path: Mapped[str | None] = mapped_column(Text)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class KnowledgeDocument(Base, TimestampMixin):
    __tablename__ = schema_name("knowledge", "documents")
    __table_args__ = schema_args("knowledge")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    document_type_code: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text)
    file_path: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status_code: Mapped[str] = mapped_column(Text, default="PUBLISHED")
    excerpt: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text)


class KnowledgeChunk(Base):
    __tablename__ = schema_name("knowledge", "document_chunks")
    __table_args__ = schema_args("knowledge")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    document_id: Mapped[str] = mapped_column(ForeignKey(fk("knowledge", "documents", "id")), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text)
    page_number: Mapped[int | None] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer)
    embedding_json: Mapped[list[float] | None] = mapped_column("embedding", JSON)
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class Notification(Base, TimestampMixin):
    __tablename__ = schema_name("notify", "notifications")
    __table_args__ = schema_args("notify")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    channel_code: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status_code: Mapped[str] = mapped_column(Text, default="PENDING")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source_table: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str | None] = mapped_column(Text)


class AgentThread(Base, TimestampMixin):
    __tablename__ = schema_name("agent", "threads")
    __table_args__ = schema_args("agent")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    external_thread_id: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "users", "id")))
    organization_id: Mapped[str | None] = mapped_column(ForeignKey(fk("iam", "organizations", "id")))
    context_scope_code: Mapped[str] = mapped_column(Text, default="PUBLIC")
    title: Mapped[str | None] = mapped_column(Text)


class AgentMessage(Base):
    __tablename__ = schema_name("agent", "messages")
    __table_args__ = schema_args("agent")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    thread_id: Mapped[str] = mapped_column(ForeignKey(fk("agent", "threads", "id")), nullable=False)
    role_code: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cited_document_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    tool_invocations: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class AgentToolCall(Base):
    __tablename__ = schema_name("agent", "tool_calls")
    __table_args__ = schema_args("agent")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    thread_id: Mapped[str] = mapped_column(ForeignKey(fk("agent", "threads", "id")), nullable=False)
    tool_name: Mapped[str] = mapped_column(Text, nullable=False)
    request_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    response_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    result_status_code: Mapped[str] = mapped_column(Text, default="SUCCESS")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class AgentAction(Base):
    __tablename__ = schema_name("agent", "actions")
    __table_args__ = schema_args("agent")

    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    thread_id: Mapped[str] = mapped_column(ForeignKey(fk("agent", "threads", "id")), nullable=False)
    action_type_code: Mapped[str] = mapped_column(Text, nullable=False)
    target_table: Mapped[str] = mapped_column(Text, nullable=False)
    target_id: Mapped[str | None] = mapped_column(Text)
    confirmation_state: Mapped[str] = mapped_column(Text, default="EXECUTED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
