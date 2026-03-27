from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.config import get_settings
from app.core.security import new_session_token, session_expires_at
from app.core.database import SessionLocal
from app.models.entities import (
    AgentAction,
    AgentMessage,
    AgentThread,
    AgentToolCall,
    Complaint,
    LicenseApplication,
    SessionToken,
    TypeApprovalApplication,
    User,
)

settings = get_settings()


def _login_with_local_session(client: TestClient, email: str) -> None:
    with SessionLocal() as session:
        user = session.query(User).filter_by(email=email).one()
        token = new_session_token()
        session.add(SessionToken(token=token, user_id=user.id, expires_at=session_expires_at()))
        session.commit()
    client.cookies.set(settings.session_cookie_name, token)


def login_as_applicant(client: TestClient) -> None:
    _login_with_local_session(client, "applicant@bocra.demo")


def login_as_officer(client: TestClient) -> None:
    _login_with_local_session(client, "officer@bocra.demo")


def login_as_type_approver(client: TestClient) -> None:
    _login_with_local_session(client, "approver@bocra.demo")


def login_as_admin(client: TestClient) -> None:
    _login_with_local_session(client, "admin@bocra.demo")


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


def test_demo_login_accepts_judge_password() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@bocra.demo", "password": "bocra2026"},
        )

        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["success"] is True
        assert payload["user"]["email"] == "admin@bocra.demo"
        assert "admin" in payload["user"]["roles"]
        assert response.cookies.get(settings.session_cookie_name)


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
                "location": "Mogoditshane",
                "reportedToProvider": "yes",
                "providerCaseNumber": "MSC-2026-00124",
                "preferredContactMethod": "phone",
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
        assert submitted["complaint"]["location"] == "Mogoditshane"
        assert submitted["complaint"]["reportedToProvider"] == "yes"
        assert submitted["complaint"]["providerCaseNumber"] == "MSC-2026-00124"
        assert submitted["complaint"]["preferredContactMethod"] == "phone"

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


def test_type_approval_review_queue_detail_and_certificate_workflow() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        created = client.post(
            "/api/type-approval/applications",
            json={
                "accreditationType": "customer",
                "brandName": "Queue Brand",
                "modelName": "Queue Phone",
                "simEnabled": "yes",
                "techSpec": "LTE",
                "sampleImei": "354789100234561",
                "countryOfManufacture": "Botswana",
                "declaration": True,
            },
        )
        assert created.status_code == 200, created.text
        application_number = created.json()["applicationNumber"]

        applicant_list = client.get("/api/type-approval/applications")
        assert applicant_list.status_code == 200, applicant_list.text
        assert any(item["applicationNumber"] == application_number for item in applicant_list.json()["data"])

        applicant_detail = client.get(f"/api/type-approval/applications/{application_number}")
        assert applicant_detail.status_code == 200, applicant_detail.text
        workflow_id = applicant_detail.json()["summary"]["id"]

        applicant_comment = client.post(
            f"/api/type-approval/applications/{application_number}/comments",
            json={"body": "Please note that the LTE report is the latest signed version.", "visibility": "APPLICANT"},
        )
        assert applicant_comment.status_code == 200, applicant_comment.text

        party = client.post(
            f"/api/type-approval/applications/{application_number}/parties",
            json={
                "partyType": "manufacturer",
                "displayName": "Queue Devices Manufacturing Ltd",
                "metadata": {"country": "Botswana"},
            },
        )
        assert party.status_code == 200, party.text
        assert party.json()["partyType"] == "MANUFACTURER"

        upload = client.post(
            f"/api/type-approval/applications/{application_number}/documents",
            data={"documentType": "lab_report", "isRequired": "true"},
            files=[("file", ("lab-report.txt", b"lab certification data", "text/plain"))],
        )
        assert upload.status_code == 200, upload.text
        document_id = upload.json()["id"]

        download = client.get(f"/api/type-approval/applications/{application_number}/documents/{document_id}/download")
        assert download.status_code == 200, download.text
        assert download.content == b"lab certification data"

        login_as_type_approver(client)

        queue = client.get("/api/type-approval/queue")
        assert queue.status_code == 200, queue.text
        assert any(item["applicationNumber"] == application_number for item in queue.json()["data"])

        review_document = client.post(
            f"/api/type-approval/applications/{application_number}/documents/{document_id}/review",
            json={"reviewStatus": "APPROVED", "note": "Lab report checked and accepted."},
        )
        assert review_document.status_code == 200, review_document.text
        assert review_document.json()["reviewStatus"] == "APPROVED"

        internal_note = client.post(
            f"/api/type-approval/applications/{application_number}/comments",
            json={"body": "Internal note: all mandatory documents are now complete.", "visibility": "INTERNAL"},
        )
        assert internal_note.status_code == 200, internal_note.text
        assert internal_note.json()["visibility"] == "INTERNAL"

        validate = client.post(
            f"/api/type-approval/applications/{workflow_id}/action",
            json={"action": "validate", "note": "Technical checks passed."},
        )
        assert validate.status_code == 200, validate.text
        assert validate.json()["status"] == "VALIDATED"

        approve = client.post(
            f"/api/type-approval/applications/{workflow_id}/action",
            json={"action": "approve", "note": "Ready for invoicing."},
        )
        assert approve.status_code == 200, approve.text
        assert approve.json()["status"] == "APPROVED"

        officer_detail = client.get(f"/api/type-approval/applications/{application_number}")
        assert officer_detail.status_code == 200, officer_detail.text
        invoice_id = officer_detail.json()["invoices"][0]["id"]

        login_as_applicant(client)
        payment = client.post(
            "/api/payments",
            json={"invoiceId": invoice_id, "method": "mobile_money", "reference": "TA-QUEUE-PAY-001"},
        )
        assert payment.status_code == 200, payment.text
        assert payment.json()["success"] is True

        login_as_type_approver(client)
        issued = client.post(
            f"/api/type-approval/applications/{workflow_id}/action",
            json={"action": "issue_certificate", "note": "Payment confirmed."},
        )
        assert issued.status_code == 200, issued.text
        assert issued.json()["status"] == "CERTIFICATE_ISSUED"

        final_detail = client.get(f"/api/type-approval/applications/{application_number}")
        assert final_detail.status_code == 200, final_detail.text
        final_payload = final_detail.json()
        assert final_payload["summary"]["certificateCount"] >= 1
        assert final_payload["record"] is not None
        assert any(comment["visibility"] == "INTERNAL" for comment in final_payload["comments"])
        assert any(document["reviewStatus"] == "APPROVED" for document in final_payload["documents"])
        assert any(party_item["partyType"] == "MANUFACTURER" for party_item in final_payload["parties"])


def test_officer_cannot_access_type_approval_reviewer_routes() -> None:
    with TestClient(app) as client:
        login_as_officer(client)

        queue = client.get("/api/type-approval/queue")
        assert queue.status_code == 403

        review = client.post(
            "/api/type-approval/applications/APP-2025-00387/action",
            json={"action": "validate", "note": "Trying reviewer route as generic officer."},
        )
        assert review.status_code == 403


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


def test_type_approver_agent_can_read_and_progress_type_approval_queue() -> None:
    with TestClient(app) as client:
        login_as_type_approver(client)

        queue_reply = run_agent(client, "agent-type-approval-queue", "Show me the type approval queue")
        assert "type approval queue" in queue_reply.lower()

        review_reply = run_agent(
            client,
            "agent-type-approval-review",
            "Validate type approval application APP-2025-00387 because the documents are complete.",
        )
        assert "validated" in review_reply.lower() or "status validated" in review_reply.lower()


def test_officer_agent_handles_complaints_and_licensing_without_crossing_into_type_approval() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        complaint = client.post(
            "/api/complaints",
            data={
                "category": "billing",
                "operator": "Orange Botswana",
                "subject": "Agent officer routing complaint",
                "description": "Test complaint so the officer agent can inspect the case.",
                "incidentDate": "2026-03-24",
                "name": "Naledi Molefe",
                "email": "applicant@bocra.demo",
                "phone": "+26771234567",
                "consentGiven": "true",
            },
        )
        assert complaint.status_code == 200, complaint.text
        complaint_number = complaint.json()["id"]

        licence = client.post(
            "/api/licence-applications",
            json={
                "category": "telecommunications",
                "licenceType": "National Services Licence",
                "applicantName": "Naledi Molefe",
                "applicantEmail": "applicant@bocra.demo",
                "coverageArea": "Gaborone",
                "formData": {"source": "officer-agent-routing-test"},
            },
        )
        assert licence.status_code == 200, licence.text
        application_number = licence.json()["applicationNumber"]

        login_as_officer(client)

        complaint_reply = run_agent(client, "agent-officer-complaint", f"Show complaint {complaint_number}")
        assert complaint_number in complaint_reply
        assert "subject:" in complaint_reply.lower()

        licence_reply = run_agent(client, "agent-officer-licence", f"Show {application_number}")
        assert application_number in licence_reply
        assert "applicant:" in licence_reply.lower()

        approval_reply = run_agent(client, "agent-officer-licence", "Approve it because technical review passed.")
        assert application_number in approval_reply
        assert "approved" in approval_reply.lower()

        licence_detail = client.get(f"/api/licence-applications/{application_number}")
        assert licence_detail.status_code == 200, licence_detail.text
        assert licence_detail.json()["summary"]["status"] == "APPROVED"

        wrong_lane_reply = run_agent(client, "agent-officer-type-approval-block", "Show APP-2025-00387")
        assert "type approvers and admins" in wrong_lane_reply.lower()

        queue_reply = run_agent(client, "agent-officer-type-approval-queue-block", "Show me the type approval queue")
        assert "type approvers and admins" in queue_reply.lower()


def test_type_approver_agent_uses_thread_context_without_entering_officer_workflows() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        type_approval = client.post(
            "/api/type-approval/applications",
            json={
                "accreditationType": "customer",
                "brandName": "Context Brand",
                "modelName": "Context Router",
                "simEnabled": "yes",
                "techSpec": "Wi-Fi 6",
                "sampleImei": "354789100234561",
                "countryOfManufacture": "Botswana",
                "declaration": True,
            },
        )
        assert type_approval.status_code == 200, type_approval.text
        application_number = type_approval.json()["applicationNumber"]

        login_as_type_approver(client)

        detail_reply = run_agent(client, "agent-type-context", f"Show {application_number}")
        assert application_number in detail_reply
        assert "context brand" in detail_reply.lower()

        follow_up_reply = run_agent(client, "agent-type-context", "Show documents")
        assert application_number in follow_up_reply
        assert "documents" in follow_up_reply.lower()

        complaint_lane_reply = run_agent(client, "agent-type-complaint-block", "Show me the complaint queue")
        assert "officers and admins" in complaint_lane_reply.lower()

        licensing_lane_reply = run_agent(client, "agent-type-licensing-block", "Show APP-2025-00412")
        assert "officers and admins" in licensing_lane_reply.lower()


def test_admin_agent_can_route_across_all_workflow_lanes() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        complaint = client.post(
            "/api/complaints",
            data={
                "category": "coverage",
                "operator": "Mascom Wireless",
                "subject": "Admin agent routing complaint",
                "description": "Complaint created for admin agent workflow coverage.",
                "incidentDate": "2026-03-24",
                "name": "Naledi Molefe",
                "email": "applicant@bocra.demo",
                "phone": "+26771234567",
                "consentGiven": "true",
            },
        )
        assert complaint.status_code == 200, complaint.text
        complaint_number = complaint.json()["id"]

        licence = client.post(
            "/api/licence-applications",
            json={
                "category": "telecommunications",
                "licenceType": "Admin Review Licence",
                "applicantName": "Naledi Molefe",
                "applicantEmail": "applicant@bocra.demo",
                "coverageArea": "Francistown",
                "formData": {"source": "admin-agent-routing-test"},
            },
        )
        assert licence.status_code == 200, licence.text
        licence_application_number = licence.json()["applicationNumber"]

        type_approval = client.post(
            "/api/type-approval/applications",
            json={
                "accreditationType": "customer",
                "brandName": "Admin Brand",
                "modelName": "Admin Phone",
                "simEnabled": "yes",
                "techSpec": "5G",
                "sampleImei": "354789100234561",
                "countryOfManufacture": "Botswana",
                "declaration": True,
            },
        )
        assert type_approval.status_code == 200, type_approval.text
        type_approval_number = type_approval.json()["applicationNumber"]

        login_as_admin(client)

        summary_reply = run_agent(client, "agent-admin-summary", "Show me the operational queue summary")
        assert "operational queues" in summary_reply.lower()

        complaint_reply = run_agent(client, "agent-admin-complaint", f"Show complaint {complaint_number}")
        assert complaint_number in complaint_reply

        licensing_reply = run_agent(client, "agent-admin-licence", f"Show {licence_application_number}")
        assert licence_application_number in licensing_reply
        assert "applicant:" in licensing_reply.lower()

        type_approval_reply = run_agent(client, "agent-admin-type-approval", f"Show {type_approval_number}")
        assert type_approval_number in type_approval_reply
        assert "admin brand" in type_approval_reply.lower()


def test_officer_agent_can_continue_from_queue_selection_over_multiple_turns() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        licence = client.post(
            "/api/licence-applications",
            json={
                "category": "telecommunications",
                "licenceType": "Queue Memory Licence",
                "applicantName": "Naledi Molefe",
                "applicantEmail": "applicant@bocra.demo",
                "coverageArea": "Maun",
                "formData": {"source": "queue-memory-test"},
            },
        )
        assert licence.status_code == 200, licence.text
        application_number = licence.json()["applicationNumber"]

        login_as_officer(client)

        queue_reply = run_agent(client, "agent-officer-queue-memory", "Show me the licence queue")
        assert application_number in queue_reply

        open_reply = run_agent(client, "agent-officer-queue-memory", "Open the first application")
        assert application_number in open_reply
        assert "queue memory licence" in open_reply.lower()

        approve_reply = run_agent(client, "agent-officer-queue-memory", "Approve it because all licensing checks passed.")
        assert application_number in approve_reply
        assert "approved" in approve_reply.lower()


def test_type_approver_agent_can_continue_from_queue_into_document_review() -> None:
    with TestClient(app) as client:
        login_as_applicant(client)

        created = client.post(
            "/api/type-approval/applications",
            json={
                "accreditationType": "customer",
                "brandName": "Memory Brand",
                "modelName": "Memory Phone",
                "simEnabled": "yes",
                "techSpec": "LTE",
                "sampleImei": "354789100234561",
                "countryOfManufacture": "Botswana",
                "declaration": True,
            },
        )
        assert created.status_code == 200, created.text
        application_number = created.json()["applicationNumber"]

        upload = client.post(
            f"/api/type-approval/applications/{application_number}/documents",
            data={"documentType": "lab_report", "isRequired": "true"},
            files=[("file", ("memory-lab-report.txt", b"memory lab data", "text/plain"))],
        )
        assert upload.status_code == 200, upload.text

        login_as_type_approver(client)

        queue_reply = run_agent(client, "agent-type-queue-memory", "Show me the type approval queue")
        assert application_number in queue_reply

        open_reply = run_agent(client, "agent-type-queue-memory", "Open the first one")
        assert application_number in open_reply
        assert "memory brand" in open_reply.lower()

        documents_reply = run_agent(client, "agent-type-queue-memory", "Show documents")
        assert "lab_report" in documents_reply.lower()

        review_reply = run_agent(client, "agent-type-queue-memory", "Approve the document because it has been checked.")
        assert application_number in review_reply
        assert "approved" in review_reply.lower()

        note_reply = run_agent(client, "agent-type-queue-memory", "Add internal note that the supporting documents are complete.")
        assert "internal comment" in note_reply.lower()
