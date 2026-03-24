from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.entities import (
    AgentAction,
    AgentMessage,
    AgentThread,
    AgentToolCall,
    Complaint,
    LicenseApplication,
    TypeApprovalApplication,
)


def login_as_applicant(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "applicant@bocra.demo", "password": "Password123!"},
    )
    assert response.status_code == 200, response.text


def run_agent(client: TestClient, thread_id: str, content: str) -> str:
    response = client.post(
        "/api/agent",
        json={"messages": [{"role": "user", "content": content}], "threadId": thread_id},
    )
    assert response.status_code == 200, response.text
    return response.text


def test_auth_session_and_profile() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        session_response = client.get("/api/auth/session")
        assert session_response.status_code == 200
        body = session_response.json()
        assert body["authenticated"] is True
        assert "user" in body

        me_response = client.get("/api/me")
        assert me_response.status_code == 200
        profile = me_response.json()
        assert profile["email"] == "applicant@bocra.demo"
        assert "applicant" in profile["roles"]


def test_dashboard_contracts() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        summary = client.get("/api/dashboard/summary")
        assert summary.status_code == 200
        payload = summary.json()
        assert {"applications", "complaints", "invoiceCount", "invoiceTotal", "certificates"} <= payload.keys()

        activity = client.get("/api/dashboard/activity?limit=3")
        assert activity.status_code == 200
        assert isinstance(activity.json(), list)

        notices = client.get("/api/notices?limit=2")
        assert notices.status_code == 200
        assert len(notices.json()) == 2


def test_protected_routes_require_authentication() -> None:
    with TestClient(app) as client:
        dashboard = client.get("/api/dashboard/summary")
        assert dashboard.status_code == 401

        invoices = client.get("/api/invoices")
        assert invoices.status_code == 401

        agent = client.post(
            "/api/agent",
            json={"messages": [{"role": "user", "content": "List my due invoices"}], "threadId": "thread-anon"},
        )
        assert agent.status_code == 401


def test_complaint_submission_and_list() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        response = client.post(
            "/api/complaints",
            data={
                "category": "coverage",
                "operator": "Mascom Wireless",
                "subject": "Coverage issue in Mogoditshane",
                "description": "There has been no reliable data connection in Mogoditshane for five days.",
                "incidentDate": "2026-03-20",
                "name": "Naledi Molefe",
                "email": "applicant@bocra.demo",
                "phone": "+26771234567",
                "consentGiven": "true",
            },
            files=[("attachments", ("evidence.txt", b"signal dropped", "text/plain"))],
        )
        assert response.status_code == 200, response.text
        submitted = response.json()
        assert submitted["message"] == "Complaint submitted successfully"
        assert submitted["status"] == "Received"

        listing = client.get("/api/complaints")
        assert listing.status_code == 200
        body = listing.json()
        assert "data" in body and "meta" in body
        assert any(item["caseNumber"] == submitted["id"] for item in body["data"])


def test_search_certificate_and_device_contracts() -> None:
    with TestClient(app) as client:
        search = client.get("/api/search?q=Samsung&category=all")
        assert search.status_code == 200
        payload = search.json()
        assert {"licences", "certificates", "typeApprovals", "devices", "organizations", "meta"} <= payload.keys()

        certificate = client.get("/api/certificates/verify/qv-samsung-a55")
        assert certificate.status_code == 200
        cert_payload = certificate.json()
        assert cert_payload["certificateNumber"] == "TA-2023-0142"

        verification = client.post("/api/device-verification", json={"imei": "354789100234561"})
        assert verification.status_code == 200
        verify_payload = verification.json()
        assert verify_payload["status"] == "VERIFIED"
        assert verify_payload["brand"] == "Samsung"


def test_workflow_creation_for_licensing_type_approval_and_payment() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        licence = client.post(
            "/api/licence-applications",
            json={
                "category": "telecommunications",
                "licenceType": "Electronic Communications Service Licence",
                "applicantName": "Naledi Molefe",
                "applicantEmail": "applicant@bocra.demo",
                "coverageArea": "Nationwide",
                "formData": {"source": "test"},
            },
        )
        assert licence.status_code == 200, licence.text
        assert licence.json()["applicationNumber"].startswith("APP-")

        type_approval = client.post(
            "/api/type-approval/applications",
            json={
                "accreditationType": "customer",
                "brandName": "Demo Brand",
                "modelName": "Demo Phone",
                "simEnabled": "yes",
                "techSpec": "5G capable",
                "sampleImei": "354789100234561",
                "countryOfManufacture": "Botswana",
                "declaration": True,
            },
        )
        assert type_approval.status_code == 200, type_approval.text
        assert type_approval.json()["applicationNumber"].startswith("APP-")

        payment = client.post(
            "/api/payments",
            json={"invoiceId": "inv3", "method": "mobile_money", "reference": "TEST-REF-001"},
        )
        assert payment.status_code == 200, payment.text
        assert payment.json()["success"] is True

        accreditation = client.get("/api/accreditation?query=customer")
        assert accreditation.status_code == 200, accreditation.text
        assert accreditation.json()["type"] == "customer"


def test_agent_streaming_and_audit_logs() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        response = client.post(
            "/api/agent",
            json={"messages": [{"role": "user", "content": "List my due invoices"}], "threadId": "thread-test"},
        )
        assert response.status_code == 200, response.text
        assert "invoice" in response.text.lower()

    with SessionLocal() as session:
        assert session.query(AgentToolCall).count() >= 1
        assert session.query(AgentAction).count() >= 0
        assert session.query(Complaint).count() >= 1


def test_agent_capabilities_cover_read_write_and_audit() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        knowledge_reply = run_agent(client, "agent-knowledge-capability", "What does BOCRA regulate?")
        assert "According to" in knowledge_reply

        invoice_reply = run_agent(client, "agent-invoices-capability", "List my due invoices")
        assert "invoice" in invoice_reply.lower()

        with SessionLocal() as session:
            complaint_before = session.query(Complaint).count()
            licence_before = session.query(LicenseApplication).count()
            type_approval_before = session.query(TypeApprovalApplication).count()

        complaint_reply = run_agent(
            client,
            "agent-complaint-capability",
            "Please file a complaint about Mascom signal issues in Gaborone.",
        )
        assert "complaint" in complaint_reply.lower()
        assert "created" in complaint_reply.lower()

        licence_reply = run_agent(
            client,
            "agent-licence-capability",
            "Please apply for a licence for my telecom service.",
        )
        assert "licence application" in licence_reply.lower()

        type_approval_reply = run_agent(
            client,
            "agent-type-approval-capability",
            "Please submit a type approval application for my device.",
        )
        assert "type approval application" in type_approval_reply.lower()

        with SessionLocal() as session:
            complaint_after = session.query(Complaint).count()
            licence_after = session.query(LicenseApplication).count()
            type_approval_after = session.query(TypeApprovalApplication).count()

            assert complaint_after == complaint_before + 1
            assert licence_after == licence_before + 1
            assert type_approval_after == type_approval_before + 1

            knowledge_thread = session.query(AgentThread).filter_by(external_thread_id="agent-knowledge-capability").one()
            knowledge_message = (
                session.query(AgentMessage)
                .filter_by(thread_id=knowledge_thread.id, role_code="assistant")
                .order_by(AgentMessage.created_at.desc())
                .first()
            )
            assert knowledge_message is not None
            assert knowledge_message.cited_document_ids
            assert knowledge_message.tool_invocations
            assert any(item["tool"] == "search_knowledge" for item in knowledge_message.tool_invocations)

            invoice_thread = session.query(AgentThread).filter_by(external_thread_id="agent-invoices-capability").one()
            invoice_tool_calls = session.query(AgentToolCall).filter_by(thread_id=invoice_thread.id).all()
            assert any(tool_call.tool_name == "list_due_invoices" for tool_call in invoice_tool_calls)

            complaint_thread = session.query(AgentThread).filter_by(external_thread_id="agent-complaint-capability").one()
            complaint_actions = session.query(AgentAction).filter_by(thread_id=complaint_thread.id).all()
            assert any(action.target_table == "complaints.complaints" for action in complaint_actions)

            licence_thread = session.query(AgentThread).filter_by(external_thread_id="agent-licence-capability").one()
            licence_actions = session.query(AgentAction).filter_by(thread_id=licence_thread.id).all()
            assert any(action.target_table == "workflow.applications" for action in licence_actions)

            type_thread = session.query(AgentThread).filter_by(external_thread_id="agent-type-approval-capability").one()
            type_actions = session.query(AgentAction).filter_by(thread_id=type_thread.id).all()
            assert any(action.target_table == "device.type_approval_applications" for action in type_actions)
