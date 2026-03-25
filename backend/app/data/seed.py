from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

import secrets

from app.config import get_settings
from app.integrations.supabase import SupabaseAuthAdapter
from app.models.entities import (
    ExternalSystem,
    Accreditation,
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
    TypeApprovalApplication,
    TypeApprovalRecord,
    User,
    UserRole,
    WorkflowApplication,
    WorkflowEvent,
)

settings = get_settings()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_file(storage_dir: Path, relative_path: str, content: str) -> str:
    path = storage_dir / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(content, encoding="utf-8")
    return str(path)


def ensure_reference_knowledge_documents(db: Session, now: datetime) -> None:
    reference_documents = [
        {
            "title": "BOCRA Mandate Overview 2026",
            "document_type_code": "GUIDE",
            "excerpt": "BOCRA regulates telecommunications, internet and ICT services, broadcasting, and postal services in Botswana while promoting consumer protection and fair competition.",
        },
        {
            "title": "BOCRA Complaint Process Overview 2026",
            "document_type_code": "GUIDE",
            "excerpt": "Consumers should first contact the provider, then submit a complaint to BOCRA with evidence, contact details, and a clear description of the issue for investigation.",
        },
    ]

    existing_titles = set(
        db.scalars(
            select(KnowledgeDocument.title).where(
                KnowledgeDocument.title.in_([document["title"] for document in reference_documents])
            )
        )
    )

    for document in reference_documents:
        if document["title"] in existing_titles:
            continue
        record = KnowledgeDocument(
            title=document["title"],
            document_type_code=document["document_type_code"],
            excerpt=document["excerpt"],
            published_at=now - timedelta(days=30),
        )
        db.add(record)
        db.flush()
        db.add(
            KnowledgeChunk(
                document_id=record.id,
                chunk_index=0,
                content=f"{record.title}. {record.excerpt}",
                token_count=64,
                source_url=record.source_url,
            )
        )


def seed_database(db: Session) -> None:
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    today = date(2026, 3, 24)
    now = datetime(2026, 3, 24, 10, 0, tzinfo=timezone.utc)

    if db.scalar(select(User.id).limit(1)):
        ensure_reference_knowledge_documents(db, now)
        db.commit()
        return

    organizations = {
        "bottel": Organization(
            legal_name="BotswanaTel Communications (Pty) Ltd",
            trading_name="BotswanaTel Communications",
            org_type_code="TELECOM",
            registration_number="BW-REG-2001-000041",
        ),
        "linkserve": Organization(
            legal_name="Linkserve Botswana (Pty) Ltd",
            trading_name="Linkserve Botswana",
            org_type_code="ISP",
            registration_number="BW-REG-2011-000089",
        ),
        "mascom": Organization(
            legal_name="Mascom Wireless (Pty) Ltd",
            trading_name="Mascom Wireless",
            org_type_code="MNO",
            registration_number="BW-REG-2000-000041",
        ),
        "orange": Organization(
            legal_name="Orange Botswana (Pty) Ltd",
            trading_name="Orange Botswana",
            org_type_code="MNO",
            registration_number="BW-REG-1999-000017",
        ),
        "btc": Organization(
            legal_name="Botswana Telecommunications Corporation Ltd",
            trading_name="BTC Broadband",
            org_type_code="MNO_ISP",
            registration_number="BW-REG-1996-000003",
        ),
        "xiaomi": Organization(
            legal_name="Xiaomi Inc",
            trading_name="Xiaomi",
            org_type_code="MANUFACTURER",
            registration_number="INT-XIAOMI-001",
        ),
        "gcc": Organization(
            legal_name="Gaborone City Council",
            trading_name="Gaborone City Council",
            org_type_code="GOVERNMENT",
            registration_number="BW-GOV-000023",
        ),
    }
    db.add_all(organizations.values())
    db.flush()

    # Create seed accounts in Supabase Auth (admin API, no email confirmation needed).
    # These simulate accounts that would normally be created via the external portal
    # at typeapproval.bocra.org.bw — all use password: Password123!
    supabase = SupabaseAuthAdapter()
    _SEED_PASSWORD = "Password123!"
    _SEED_ACCOUNTS = [
        ("public",    "public@bocra.demo",    "Public",  "User",   None,            None),
        ("applicant", "applicant@bocra.demo", "Naledi",  "Molefe", "+26771234567",  None),
        ("officer",   "officer@bocra.demo",   "Tebogo",  "Kgosi",  "+26772345678",  None),
        ("admin",     "admin@bocra.demo",     "Kabelo",  "Mosweu", "+26773456789",  None),
    ]

    users: dict[str, User] = {}
    for key, email, first_name, last_name, phone, national_id in _SEED_ACCOUNTS:
        sb = supabase.admin_create_user(
            email,
            _SEED_PASSWORD,
            email_confirm=True,
            metadata={"first_name": first_name, "last_name": last_name},
        )
        # Use Supabase UUID as user ID so token validation syncs correctly.
        # Fall back to a fresh UUID if Supabase is unavailable (local dev without keys).
        user_id = sb["id"] if sb else None
        user = User(
            **({"id": user_id} if user_id else {}),
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_e164=phone,
            national_id=national_id,
            auth_provider="supabase",
            email_verified_at=now,
        )
        users[key] = user

    db.add_all(users.values())
    db.flush()

    roles = {
        "public": Role(role_code="public", name="Public User"),
        "applicant": Role(role_code="applicant", name="Applicant / Requestor"),
        "officer": Role(role_code="officer", name="BOCRA Officer"),
        "admin": Role(role_code="admin", name="Administrator"),
    }
    db.add_all(roles.values())
    db.flush()

    permissions = [
        Permission(permission_code="dashboard.read", name="Read dashboard", module_code="dashboard"),
        Permission(permission_code="complaints.read", name="Read complaints", module_code="complaints"),
        Permission(permission_code="complaints.write", name="Write complaints", module_code="complaints"),
        Permission(permission_code="licensing.read", name="Read licensing", module_code="licensing"),
        Permission(permission_code="licensing.write", name="Write licensing", module_code="licensing"),
        Permission(permission_code="type_approval.read", name="Read type approval", module_code="type_approval"),
        Permission(permission_code="type_approval.write", name="Write type approval", module_code="type_approval"),
        Permission(permission_code="billing.read", name="Read billing", module_code="billing"),
        Permission(permission_code="billing.write", name="Write billing", module_code="billing"),
        Permission(permission_code="agent.use", name="Use AI agent", module_code="agent"),
        Permission(permission_code="admin.manage", name="Administer platform", module_code="admin"),
    ]
    db.add_all(permissions)
    db.flush()
    permission_map = {permission.permission_code: permission for permission in permissions}

    def bind_permissions(role_code: str, permission_codes: list[str]) -> None:
        role = roles[role_code]
        for code in permission_codes:
            db.add(RolePermission(role_id=role.id, permission_id=permission_map[code].id))

    bind_permissions("public", ["dashboard.read", "complaints.read", "complaints.write", "agent.use"])
    bind_permissions(
        "applicant",
        [
            "dashboard.read",
            "complaints.read",
            "complaints.write",
            "licensing.read",
            "licensing.write",
            "type_approval.read",
            "type_approval.write",
            "billing.read",
            "agent.use",
        ],
    )
    bind_permissions(
        "officer",
        [
            "dashboard.read",
            "complaints.read",
            "complaints.write",
            "licensing.read",
            "licensing.write",
            "type_approval.read",
            "type_approval.write",
            "billing.read",
            "billing.write",
            "agent.use",
        ],
    )
    bind_permissions(
        "admin",
        [
            "dashboard.read",
            "complaints.read",
            "complaints.write",
            "licensing.read",
            "licensing.write",
            "type_approval.read",
            "type_approval.write",
            "billing.read",
            "billing.write",
            "agent.use",
            "admin.manage",
        ],
    )

    db.add_all(
        [
            UserRole(user_id=users["public"].id, role_id=roles["public"].id),
            UserRole(user_id=users["applicant"].id, role_id=roles["applicant"].id, organization_id=organizations["bottel"].id),
            UserRole(user_id=users["officer"].id, role_id=roles["officer"].id),
            UserRole(user_id=users["admin"].id, role_id=roles["admin"].id),
        ]
    )

    complaint_categories = [
        ComplaintCategory(category_code="billing", name="Billing Dispute", default_sla_hours=120),
        ComplaintCategory(category_code="coverage", name="Network Coverage", default_sla_hours=168),
        ComplaintCategory(category_code="service_quality", name="Service Quality", default_sla_hours=168),
        ComplaintCategory(category_code="broadcasting", name="Broadcasting", default_sla_hours=240),
        ComplaintCategory(category_code="postal", name="Postal Services", default_sla_hours=240),
        ComplaintCategory(category_code="other", name="Other", default_sla_hours=168),
    ]
    db.add_all(complaint_categories)

    notices = [
        KnowledgeDocument(
            title="Public Consultation: Draft Electronic Communications (Amendment) Regulations 2025",
            document_type_code="NOTICE",
            category="Consultation",
            excerpt="BOCRA invites stakeholders to submit written comments on the proposed amendments by 15 April 2025.",
            published_at=now - timedelta(days=6),
        ),
        KnowledgeDocument(
            title="Notice to Operators: New QoS Reporting Templates Effective 1 April 2025",
            document_type_code="NOTICE",
            category="Regulatory Notice",
            excerpt="All licensed operators must submit quarterly QoS reports using the updated templates available on the BOCRA portal.",
            published_at=now - timedelta(days=12),
        ),
        KnowledgeDocument(
            title="BOCRA Completes Annual Spectrum Audit — Report Now Available",
            document_type_code="NOTICE",
            category="Press Release",
            excerpt="The annual spectrum monitoring and audit exercise has been completed and the full report is available for download.",
            published_at=now - timedelta(days=19),
        ),
    ]
    knowledge_docs = [
        KnowledgeDocument(
            title="BOCRA Type Approval Guidelines 2023",
            document_type_code="GUIDELINE",
            excerpt="Documents required for type approval include incorporation records, accredited lab reports, equipment datasheets, and declarations of conformity.",
            published_at=now - timedelta(days=120),
        ),
        KnowledgeDocument(
            title="BOCRA Consumer Complaints Manual 2024",
            document_type_code="MANUAL",
            excerpt="Complainants should first contact the provider, then escalate to BOCRA with evidence and contact details.",
            published_at=now - timedelta(days=95),
        ),
        KnowledgeDocument(
            title="BOCRA Licensing Application Checklist 2025",
            document_type_code="CHECKLIST",
            excerpt="Licence applicants must provide incorporation documents, tax clearance, technical plans, and coverage details depending on the category.",
            published_at=now - timedelta(days=80),
        ),
    ]
    db.add_all(notices + knowledge_docs)
    db.flush()

    for document in notices + knowledge_docs:
        db.add(
            KnowledgeChunk(
                document_id=document.id,
                chunk_index=0,
                content=f"{document.title}. {document.excerpt}",
                token_count=64,
                source_url=document.source_url,
            )
        )

    ensure_reference_knowledge_documents(db, now)

    workflow_apps: dict[str, WorkflowApplication] = {
        "lic_app_1": WorkflowApplication(
            application_number="APP-2025-00412",
            application_type_code="LICENCE",
            service_module_code="LICENSING",
            applicant_user_id=users["applicant"].id,
            applicant_org_id=organizations["bottel"].id,
            title="Spectrum Authorisation Application",
            description="Spectrum authorisation request for business communications network.",
            current_status_code="UNDER_REVIEW",
            current_stage_code="TECHNICAL_REVIEW",
            submitted_at=now - timedelta(days=23),
            expected_decision_at=now + timedelta(days=14),
        ),
        "type_app_1": WorkflowApplication(
            application_number="APP-2025-00387",
            application_type_code="TYPE_APPROVAL",
            service_module_code="TYPE_APPROVAL",
            applicant_user_id=users["applicant"].id,
            applicant_org_id=organizations["xiaomi"].id,
            title="Type Approval — Wireless Router",
            description="Approval request for Xiaomi wireless router.",
            current_status_code="AWAITING_PAYMENT",
            current_stage_code="INVOICE_PENDING",
            submitted_at=now - timedelta(days=32),
            expected_decision_at=now + timedelta(days=7),
        ),
        "lic_app_2": WorkflowApplication(
            application_number="APP-2025-00291",
            application_type_code="LICENCE",
            service_module_code="LICENSING",
            applicant_user_id=users["applicant"].id,
            applicant_org_id=organizations["bottel"].id,
            title="Electronic Communications Service Amendment",
            description="Amendment to existing ECS licence.",
            current_status_code="APPROVED",
            current_stage_code="ISSUED",
            submitted_at=now - timedelta(days=75),
            expected_decision_at=now - timedelta(days=5),
        ),
        "lic_app_3": WorkflowApplication(
            application_number="APP-2024-01841",
            application_type_code="LICENCE",
            service_module_code="LICENSING",
            applicant_user_id=users["applicant"].id,
            applicant_org_id=organizations["linkserve"].id,
            title="Broadcasting Licence — TV",
            description="Broadcasting licence application for regional TV service.",
            current_status_code="REJECTED",
            current_stage_code="DECISION",
            submitted_at=now - timedelta(days=130),
            expected_decision_at=now - timedelta(days=25),
        ),
    }
    db.add_all(workflow_apps.values())
    db.flush()

    licence_records = [
        LicenseRecord(
            id="l1",
            licence_number="ECN-2019-0031",
            licence_type="Electronic Communications Network",
            category="Telecommunications",
            sub_category="Fixed-line",
            status_code="ACTIVE",
            issue_date=today - timedelta(days=1710),
            expiry_date=today + timedelta(days=8),
            holder_name="BotswanaTel Communications (Pty) Ltd",
            holder_address="Plot 50671, Fairgrounds, Gaborone, Botswana",
            coverage_area="Nationwide",
            assigned_officer_name="K. Mosweu",
            assigned_officer_dept="Licensing & Compliance",
        ),
        LicenseRecord(
            id="l2",
            licence_number="ISP-2021-0012",
            licence_type="Internet Service Provider",
            category="Data Services",
            sub_category="Broadband Internet",
            status_code="ACTIVE",
            issue_date=today - timedelta(days=1470),
            expiry_date=today + timedelta(days=42),
            holder_name="Linkserve Botswana (Pty) Ltd",
            holder_address="Plot 14399, Industrial Site, Francistown, Botswana",
            coverage_area="Northern Botswana",
            assigned_officer_name="K. Mosweu",
            assigned_officer_dept="Licensing & Compliance",
        ),
        LicenseRecord(
            id="l3",
            licence_number="VSAT-2022-0007",
            licence_type="VSAT Terminal Licence",
            category="Satellite Services",
            sub_category="VSAT",
            status_code="SUSPENDED",
            issue_date=today - timedelta(days=1300),
            expiry_date=today + timedelta(days=180),
            holder_name="Techbridge Solutions",
            coverage_area="Nationwide",
            assigned_officer_name="T. Gaokgane",
            assigned_officer_dept="Spectrum Management",
        ),
        LicenseRecord(
            id="l4",
            licence_number="BRD-2018-0002",
            licence_type="Broadcasting Licence — FM Radio",
            category="Broadcasting",
            sub_category="FM Radio",
            status_code="EXPIRED",
            issue_date=today - timedelta(days=2500),
            expiry_date=today - timedelta(days=45),
            holder_name="Kalahari Cable TV",
            coverage_area="Regional",
            assigned_officer_name="L. Seretse",
            assigned_officer_dept="Broadcasting",
        ),
        LicenseRecord(
            id="l5",
            licence_number="ECS-2020-0044",
            licence_type="Electronic Communications Service",
            category="Telecommunications",
            sub_category="Service",
            status_code="ACTIVE",
            issue_date=today - timedelta(days=1650),
            expiry_date=today + timedelta(days=310),
            holder_name="Orange Botswana (Pty) Ltd",
            coverage_area="Nationwide",
            assigned_officer_name="T. Gaokgane",
            assigned_officer_dept="Licensing & Compliance",
        ),
        LicenseRecord(
            id="l6",
            licence_number="POS-2017-0003",
            licence_type="Postal Operator Licence",
            category="Postal Services",
            sub_category="Postal",
            status_code="CANCELLED",
            issue_date=today - timedelta(days=3200),
            expiry_date=today - timedelta(days=200),
            holder_name="Botswana Postal Services",
            coverage_area="Nationwide",
            assigned_officer_name="L. Seretse",
            assigned_officer_dept="Postal Regulation",
        ),
    ]
    db.add_all(licence_records)
    db.flush()

    licence_applications = [
        LicenseApplication(
            id="a1",
            workflow_application_id=workflow_apps["lic_app_1"].id,
            category_code="telecommunications",
            licence_type_name="Spectrum Authorisation",
            applicant_name="BotswanaTel Communications (Pty) Ltd",
            applicant_email="applicant@bocra.demo",
            coverage_area="Nationwide",
        ),
        LicenseApplication(
            id="a3",
            workflow_application_id=workflow_apps["lic_app_2"].id,
            category_code="telecommunications",
            licence_type_name="Electronic Communications Service — Amendment",
            applicant_name="BotswanaTel Communications (Pty) Ltd",
            applicant_email="applicant@bocra.demo",
            coverage_area="Nationwide",
        ),
        LicenseApplication(
            id="a4",
            workflow_application_id=workflow_apps["lic_app_3"].id,
            category_code="broadcasting",
            licence_type_name="Broadcasting Licence — TV",
            applicant_name="Linkserve Botswana (Pty) Ltd",
            applicant_email="applicant@bocra.demo",
            coverage_area="Northern Botswana",
        ),
    ]
    db.add_all(licence_applications)

    accreditations = [
        Accreditation(
            user_id=users["applicant"].id,
            organization_id=organizations["bottel"].id,
            accreditation_type_code="customer",
            reference_number="ACC-2024-00183",
            status_code="APPROVED",
            valid_from=today - timedelta(days=200),
            valid_to=today + timedelta(days=165),
        ),
        Accreditation(
            user_id=users["applicant"].id,
            organization_id=organizations["xiaomi"].id,
            accreditation_type_code="manufacturer",
            reference_number="ACC-2025-00041",
            status_code="PENDING",
            valid_from=today - timedelta(days=20),
            valid_to=today + timedelta(days=345),
        ),
    ]
    db.add_all(accreditations)
    db.flush()

    devices = {
        "samsung_a55": DeviceCatalog(
            brand_name="Samsung",
            marketing_name="Galaxy A55 5G",
            model_name="Galaxy A55 5G",
            device_type="Smartphone",
            is_sim_enabled=True,
        ),
        "iphone_15": DeviceCatalog(
            brand_name="Apple",
            marketing_name="iPhone 15 Pro",
            model_name="iPhone 15 Pro",
            device_type="Smartphone",
            is_sim_enabled=True,
        ),
        "huawei_p60": DeviceCatalog(
            brand_name="Huawei",
            marketing_name="P60 Pro",
            model_name="P60 Pro",
            device_type="Smartphone",
            is_sim_enabled=True,
        ),
        "xiaomi_redmi": DeviceCatalog(
            brand_name="Xiaomi",
            marketing_name="Redmi Note 13 Pro",
            model_name="Redmi Note 13 Pro",
            device_type="Smartphone",
            is_sim_enabled=True,
        ),
        "router": DeviceCatalog(
            brand_name="Xiaomi",
            marketing_name="AX3000 Router",
            model_name="AX3000",
            device_type="Router",
            is_sim_enabled=False,
        ),
    }
    db.add_all(devices.values())
    db.flush()

    type_app = TypeApprovalApplication(
        id="ta-app-1",
        workflow_application_id=workflow_apps["type_app_1"].id,
        device_model_id=devices["router"].id,
        accreditation_id=accreditations[0].id,
        sample_imei=None,
        country_of_manufacture="China",
        form_data_json={"brandName": "Xiaomi", "modelName": "AX3000", "simEnabled": "no"},
    )
    db.add(type_app)

    type_records = [
        TypeApprovalRecord(
            id="ta1",
            device_model_id=devices["samsung_a55"].id,
            application_id=type_app.id,
            status_code="APPROVED",
            approval_date=today - timedelta(days=400),
            applicant_name="Samsung Electronics",
        ),
        TypeApprovalRecord(
            id="ta2",
            device_model_id=devices["iphone_15"].id,
            status_code="APPROVED",
            approval_date=today - timedelta(days=535),
            applicant_name="Apple",
        ),
        TypeApprovalRecord(
            id="ta3",
            device_model_id=devices["huawei_p60"].id,
            status_code="REJECTED",
            approval_date=today - timedelta(days=200),
            applicant_name="Huawei Technologies",
        ),
        TypeApprovalRecord(
            id="ta4",
            device_model_id=devices["xiaomi_redmi"].id,
            status_code="PENDING",
            approval_date=today - timedelta(days=6),
            applicant_name="Xiaomi Inc",
        ),
    ]
    db.add_all(type_records)
    db.flush()

    verification_items = [
        DeviceVerificationItem(
            imei="354789100234561",
            device_model_id=devices["samsung_a55"].id,
            verification_status_code="VERIFIED",
            verified_at=now - timedelta(days=3),
            response_payload_json={"typeApprovalNumber": "TA-2024-23456"},
        ),
        DeviceVerificationItem(
            imei="356123400891234",
            device_model_id=devices["iphone_15"].id,
            verification_status_code="VERIFIED",
            verified_at=now - timedelta(days=4),
            response_payload_json={"typeApprovalNumber": "TA-2023-14142"},
        ),
        DeviceVerificationItem(
            imei="350112233445566",
            device_model_id=devices["xiaomi_redmi"].id,
            verification_status_code="BLACKLISTED",
            verified_at=now - timedelta(days=1),
            remarks="Device is blacklisted.",
        ),
        DeviceVerificationItem(
            imei="352987600112233",
            device_model_id=devices["samsung_a55"].id,
            verification_status_code="BLOCKED",
            verified_at=now - timedelta(days=2),
            remarks="Reported stolen.",
        ),
        DeviceVerificationItem(
            imei="490154203237518",
            device_model_id=devices["huawei_p60"].id,
            verification_status_code="NOT_FOUND",
            verified_at=now - timedelta(days=1),
            remarks="IMEI not found in BOCRA registry.",
        ),
    ]
    db.add_all(verification_items)

    certificates = [
        Certificate(
            id="c1",
            certificate_number="LCN-2024-0031",
            certificate_type="LICENCE",
            holder_name="BotswanaTel Communications (Pty) Ltd",
            issue_date=today - timedelta(days=434),
            expiry_date=today + timedelta(days=365),
            status_code="VALID",
            qr_token="qv-bottel-lcn",
            owner_user_id=users["applicant"].id,
            issued_by="BOCRA Licensing Department",
        ),
        Certificate(
            id="c2",
            certificate_number="TA-2023-0142",
            certificate_type="TYPE_APPROVAL",
            holder_name="Samsung Electronics",
            device_name="Samsung Galaxy A55 5G",
            issue_date=today - timedelta(days=674),
            expiry_date=today + timedelta(days=180),
            status_code="VALID",
            qr_token="qv-samsung-a55",
            owner_user_id=users["applicant"].id,
            application_id="APP-2023-00412",
            issued_by="BOCRA Type Approval Department",
        ),
        Certificate(
            id="c3",
            certificate_number="TA-2022-0089",
            certificate_type="TYPE_APPROVAL",
            holder_name="Huawei Technologies",
            device_name="Huawei P60 Pro",
            issue_date=today - timedelta(days=1110),
            expiry_date=today - timedelta(days=90),
            status_code="EXPIRED",
            qr_token="qv-huawei-p60",
            issued_by="BOCRA Type Approval Department",
            remarks="This certificate has expired and is no longer valid. A renewal application must be submitted.",
        ),
        Certificate(
            id="c4",
            certificate_number="EX-2025-0023",
            certificate_type="EXEMPTION",
            holder_name="Gaborone City Council",
            issue_date=today - timedelta(days=440),
            expiry_date=today + timedelta(days=730),
            status_code="VALID",
            qr_token="qv-gcc-ex",
            issued_by="BOCRA Spectrum Management Department",
        ),
        Certificate(
            id="c5",
            certificate_number="DVC-2024-0307",
            certificate_type="DEVICE_VERIFICATION",
            holder_name="BotswanaTel Communications (Pty) Ltd",
            device_name="Apple iPhone 15 Pro",
            issue_date=today - timedelta(days=140),
            expiry_date=today + timedelta(days=300),
            status_code="VALID",
            qr_token="qv-iph15-dvc",
            owner_user_id=users["applicant"].id,
            issued_by="BOCRA Type Approval Department",
        ),
        Certificate(
            id="c6",
            certificate_number="LCN-2021-0056",
            certificate_type="LICENCE",
            holder_name="Linkserve Botswana (Pty) Ltd",
            issue_date=today - timedelta(days=1665),
            expiry_date=today + timedelta(days=60),
            status_code="SUSPENDED",
            qr_token="qv-linkserve-lcn",
            issued_by="BOCRA Licensing Department",
            remarks="Licence suspended pending investigation into service quality non-compliance.",
        ),
        Certificate(
            id="c7",
            certificate_number="TA-2025-0098",
            certificate_type="TYPE_APPROVAL",
            holder_name="Xiaomi Inc",
            device_name="Xiaomi Redmi Note 13 Pro",
            issue_date=today - timedelta(days=38),
            expiry_date=today + timedelta(days=500),
            status_code="VALID",
            qr_token="qv-redmi13-ta",
            owner_user_id=users["applicant"].id,
            issued_by="BOCRA Type Approval Department",
        ),
        Certificate(
            id="c8",
            certificate_number="TA-2020-0014",
            certificate_type="TYPE_APPROVAL",
            holder_name="Motorola Mobility LLC",
            device_name="Motorola Moto G85",
            issue_date=today - timedelta(days=2082),
            expiry_date=today - timedelta(days=400),
            status_code="REVOKED",
            qr_token="qv-motorola-g85",
            issued_by="BOCRA Type Approval Department",
            remarks="Certificate revoked following post-market surveillance findings.",
        ),
    ]
    db.add_all(certificates)

    invoices = [
        Invoice(
            id="inv1",
            invoice_number="INV-2025-0019",
            application_id="APP-2025-00412",
            payer_org_id=organizations["bottel"].id,
            owner_user_id=users["applicant"].id,
            description="Spectrum Authorisation Application Fee",
            service_name="Spectrum Authorisation Application Fee",
            subtotal_amount=8000,
            vat_amount=1120,
            total_amount=9120,
            due_date=today - timedelta(days=5),
            status_code="OVERDUE",
        ),
        Invoice(
            id="inv2",
            invoice_number="INV-2024-0187",
            application_id="LCN-2021-0056",
            payer_org_id=organizations["linkserve"].id,
            description="Annual Spectrum Management Fee — 2024/25",
            service_name="Annual Spectrum Management Fee",
            subtotal_amount=3200,
            vat_amount=448,
            total_amount=3648,
            due_date=today - timedelta(days=45),
            status_code="OVERDUE",
        ),
        Invoice(
            id="inv3",
            invoice_number="INV-2025-0031",
            application_id="APP-2025-00098",
            payer_org_id=organizations["xiaomi"].id,
            owner_user_id=users["applicant"].id,
            description="Type Approval Application Fee (Xiaomi Redmi Note 13 Pro)",
            service_name="Type Approval Application Fee",
            subtotal_amount=2500,
            vat_amount=350,
            total_amount=2850,
            due_date=today + timedelta(days=3),
            status_code="UNPAID",
        ),
        Invoice(
            id="inv4",
            invoice_number="INV-2025-0041",
            application_id="EX-2025-0023",
            payer_org_id=organizations["gcc"].id,
            description="Exemption Certificate — Gaborone City Council",
            service_name="Exemption Certificate",
            subtotal_amount=1500,
            vat_amount=210,
            total_amount=1710,
            due_date=today + timedelta(days=7),
            status_code="UNPAID",
        ),
        Invoice(
            id="inv5",
            invoice_number="INV-2025-0028",
            application_id="LCN-2024-0031",
            payer_org_id=organizations["bottel"].id,
            owner_user_id=users["applicant"].id,
            description="Electronic Communications Licence Renewal Fee",
            service_name="Electronic Communications Licence Renewal Fee",
            subtotal_amount=5000,
            vat_amount=700,
            total_amount=5700,
            due_date=today + timedelta(days=15),
            status_code="UNPAID",
        ),
    ]
    db.add_all(invoices)
    db.flush()

    payments = [
        Payment(
            id="pay1",
            invoice_id=invoices[0].id,
            gateway_code="ORANGE_MONEY",
            gateway_reference="OM-20250115-7734",
            amount_paid=2850,
            status_code="COMPLETED",
            paid_at=now - timedelta(days=68),
        ),
        Payment(
            id="pay2",
            invoice_id=invoices[2].id,
            gateway_code="BANK_TRANSFER",
            gateway_reference="BTR-20250203-1192",
            amount_paid=1710,
            status_code="COMPLETED",
            paid_at=now - timedelta(days=50),
        ),
        Payment(
            id="pay3",
            invoice_id=invoices[4].id,
            gateway_code="CARD",
            gateway_reference="CARD-20250228-4401",
            amount_paid=5700,
            status_code="FAILED",
            paid_at=now - timedelta(days=25),
        ),
        Payment(
            id="pay4",
            invoice_id=invoices[4].id,
            gateway_code="SMEGA",
            gateway_reference="SMG-20250305-9981",
            amount_paid=285,
            status_code="COMPLETED",
            paid_at=now - timedelta(days=19),
        ),
        Payment(
            id="pay5",
            invoice_id=invoices[1].id,
            gateway_code="BANK_TRANSFER",
            gateway_reference="BTR-20250310-2250",
            amount_paid=4560,
            status_code="PENDING",
            paid_at=now - timedelta(days=14),
        ),
    ]
    db.add_all(payments)
    db.flush()

    receipt_paths = [
        ensure_file(settings.storage_dir, "receipts/RCP-2025-0001.txt", "BOCRA receipt RCP-2025-0001"),
        ensure_file(settings.storage_dir, "receipts/RCP-2025-0002.txt", "BOCRA receipt RCP-2025-0002"),
        ensure_file(settings.storage_dir, "receipts/RCP-2025-0003.txt", "BOCRA receipt RCP-2025-0003"),
    ]
    receipts = [
        Receipt(payment_id=payments[0].id, receipt_number="RCP-2025-0001", file_path=receipt_paths[0], issued_at=now - timedelta(days=68)),
        Receipt(payment_id=payments[1].id, receipt_number="RCP-2025-0002", file_path=receipt_paths[1], issued_at=now - timedelta(days=50)),
        Receipt(payment_id=payments[3].id, receipt_number="RCP-2025-0003", file_path=receipt_paths[2], issued_at=now - timedelta(days=19)),
    ]
    db.add_all(receipts)

    complaints = [
        Complaint(
            id="c01",
            complaint_number="CMP-2025-00841",
            complainant_user_id=users["applicant"].id,
            complainant_org_id=organizations["bottel"].id,
            subject="No network signal for 3 days in Gaborone West",
            complaint_type_code="coverage",
            service_provider_name="Mascom Wireless",
            operator_code="MASCOM",
            location_text="Gaborone West, Plot 4312",
            provider_contacted_first=True,
            narrative="Since 18 March 2025 I have had no network signal at my home in Gaborone West affecting both calls and mobile data.",
            current_status_code="ASSIGNED",
            assigned_to_user_id=users["officer"].id,
            expected_resolution_at=now + timedelta(days=1),
            sla_due_at=now + timedelta(days=1),
        ),
        Complaint(
            id="c02",
            complaint_number="CMP-2025-00839",
            complainant_user_id=users["applicant"].id,
            complainant_org_id=organizations["bottel"].id,
            subject="Overcharged on data bundle — BWP 120 deducted incorrectly",
            complaint_type_code="billing",
            service_provider_name="Orange Botswana",
            operator_code="ORANGE",
            location_text="Francistown",
            provider_contacted_first=True,
            narrative="On 16 March 2025, BWP 120 was deducted from my account without authorisation for a bundle I never activated.",
            current_status_code="PENDING",
            assigned_to_user_id=users["officer"].id,
            expected_resolution_at=now,
            sla_due_at=now,
        ),
        Complaint(
            id="c03",
            complaint_number="CMP-2025-00774",
            complainant_user_id=users["public"].id,
            subject="Postal parcel lost in transit — tracking shows delivered",
            complaint_type_code="postal",
            service_provider_name="Botswana Postal Services",
            operator_code="POSTAL",
            location_text="Maun",
            provider_contacted_first=False,
            narrative="A parcel sent from Gaborone to Maun was marked delivered but never received by the recipient.",
            current_status_code="NEW",
            expected_resolution_at=now + timedelta(days=10),
            sla_due_at=now + timedelta(days=10),
        ),
    ]
    db.add_all(complaints)
    db.flush()

    complaint_files = [
        ensure_file(settings.storage_dir, "complaints/c01/mascom_reference_screenshot.pdf", "Complaint attachment placeholder"),
        ensure_file(settings.storage_dir, "complaints/c01/no_signal_photo.jpg", "Image placeholder"),
        ensure_file(settings.storage_dir, "complaints/c02/account_statement_march.pdf", "Billing statement placeholder"),
    ]
    db.add_all(
        [
            ComplaintAttachment(
                complaint_id="c01",
                file_name="mascom_reference_screenshot.pdf",
                content_type="application/pdf",
                size_bytes=218000,
                storage_path=complaint_files[0],
            ),
            ComplaintAttachment(
                complaint_id="c01",
                file_name="no_signal_photo.jpg",
                content_type="image/jpeg",
                size_bytes=1400000,
                storage_path=complaint_files[1],
            ),
            ComplaintAttachment(
                complaint_id="c02",
                file_name="account_statement_march.pdf",
                content_type="application/pdf",
                size_bytes=156000,
                storage_path=complaint_files[2],
            ),
        ]
    )
    db.add_all(
        [
            ComplaintMessage(
                complaint_id="c01",
                author_user_id=users["applicant"].id,
                author_name="Portal User",
                author_role="complainant",
                body="I submitted this complaint on 18 March. It has now been 3 days and I still have no signal.",
                created_at=now - timedelta(days=3),
            ),
            ComplaintMessage(
                complaint_id="c01",
                author_user_id=users["officer"].id,
                author_name="Officer T. Kgosi",
                author_role="officer",
                body="We have contacted Mascom's technical team and expect a report by 22 March 2025.",
                created_at=now - timedelta(days=2),
            ),
            ComplaintMessage(
                complaint_id="c02",
                author_user_id=users["officer"].id,
                author_name="Officer B. Seretse",
                author_role="officer",
                body="We have sent a formal request to Orange Botswana for your billing records.",
                created_at=now - timedelta(days=1),
            ),
        ]
    )

    workflow_events = [
        WorkflowEvent(resource_kind="complaint", resource_id="c01", event_type_code="SUBMITTED", label="Submitted", actor_name="System", actor_role="system", comment="Complaint received and assigned case number CMP-2025-00841.", occurred_at=now - timedelta(days=6)),
        WorkflowEvent(resource_kind="complaint", resource_id="c01", event_type_code="ASSIGNED", label="Assigned", actor_name="Officer T. Kgosi", actor_role="officer", comment="Case assigned to Officer Kgosi in the Network Quality team.", occurred_at=now - timedelta(days=5)),
        WorkflowEvent(resource_kind="complaint", resource_id="c01", event_type_code="UNDER_REVIEW", label="Under Review", actor_name="Officer T. Kgosi", actor_role="officer", comment="Technical team contacted Mascom for infrastructure report.", occurred_at=now - timedelta(days=4)),
        WorkflowEvent(resource_kind="complaint", resource_id="c02", event_type_code="SUBMITTED", label="Submitted", actor_name="System", actor_role="system", comment="Complaint received and assigned case number CMP-2025-00839.", occurred_at=now - timedelta(days=7)),
        WorkflowEvent(resource_kind="complaint", resource_id="c02", event_type_code="PENDING", label="Pending", actor_name="Officer B. Seretse", actor_role="officer", comment="Awaiting billing records from Orange Botswana.", occurred_at=now - timedelta(days=4)),
        WorkflowEvent(resource_kind="complaint", resource_id="c03", event_type_code="SUBMITTED", label="Submitted", actor_name="System", actor_role="system", comment="Complaint received and assigned case number CMP-2025-00774.", occurred_at=now - timedelta(days=10)),
        WorkflowEvent(resource_kind="licence_record", resource_id="l1", event_type_code="RENEWAL_REMINDER", label="Renewal reminder dispatched", actor_name="BOCRA System", actor_role="system", comment="Automatic 14-day renewal reminder sent to the holder.", occurred_at=now - timedelta(days=5)),
        WorkflowEvent(resource_kind="licence_record", resource_id="l1", event_type_code="COMPLIANCE_REPORT", label="Annual compliance report submitted", actor_name="BotswanaTel Communications", actor_role="applicant", comment="Annual compliance report submitted.", occurred_at=now - timedelta(days=60)),
        WorkflowEvent(resource_kind="licence_application", resource_id="a1", event_type_code="UNDER_REVIEW", label="Under Review", actor_name="Officer K. Mosweu", actor_role="officer", comment="Spectrum authorisation application is under technical review.", occurred_at=now - timedelta(days=2)),
        WorkflowEvent(resource_kind="licence_application", resource_id="a3", event_type_code="APPROVED", label="Approved", actor_name="Officer K. Mosweu", actor_role="officer", comment="Application approved and certificate queued.", occurred_at=now - timedelta(days=14)),
        WorkflowEvent(resource_kind="licence_application", resource_id="a4", event_type_code="REJECTED", label="Rejected", actor_name="Officer L. Seretse", actor_role="officer", comment="Application rejected after regulatory review.", occurred_at=now - timedelta(days=24)),
        WorkflowEvent(resource_kind="application", resource_id=workflow_apps["type_app_1"].id, event_type_code="AWAITING_PAYMENT", label="Awaiting Payment", actor_name="System", actor_role="system", comment="Invoice generated and awaiting payment before issuance.", occurred_at=now - timedelta(days=9)),
    ]
    db.add_all(workflow_events)

    notifications = [
        Notification(
            user_id=users["applicant"].id,
            channel_code="IN_APP",
            title="Invoice INV-2025-0031 is due soon",
            body="Your type approval invoice will be due in 3 days.",
            status_code="SENT",
            sent_at=now - timedelta(days=1),
            source_table="billing.invoices",
            source_id="inv3",
        ),
        Notification(
            user_id=users["applicant"].id,
            channel_code="IN_APP",
            title="Complaint CMP-2025-00841 updated",
            body="Your network coverage complaint is under review.",
            status_code="SENT",
            sent_at=now - timedelta(days=1),
            source_table="complaints.complaints",
            source_id="c01",
        ),
    ]
    db.add_all(notifications)

    # ── External system integrations ──────────────────────────────────────────
    _KNOWN_SYSTEMS = [
        {
            "system_code": "typeapproval_portal",
            "name": "Type Approval Portal",
            "description": "BOCRA Type Approval self-service portal — handles device application submissions and hosts user account registration.",
            "base_url": "https://typeapproval.bocra.org.bw",
            "health_endpoint": "/health",
            "contact_email": "support@bocra.org.bw",
        },
    ]
    existing_codes = set(
        db.scalars(
            select(ExternalSystem.system_code).where(
                ExternalSystem.system_code.in_([s["system_code"] for s in _KNOWN_SYSTEMS])
            )
        )
    )
    for s in _KNOWN_SYSTEMS:
        if s["system_code"] not in existing_codes:
            db.add(ExternalSystem(
                system_code=s["system_code"],
                name=s["name"],
                description=s["description"],
                base_url=s["base_url"],
                health_endpoint=s["health_endpoint"],
                contact_email=s["contact_email"],
                api_key=f"bocra_{secrets.token_urlsafe(32)}",
            ))

    db.commit()
