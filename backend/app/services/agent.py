from __future__ import annotations

import os
from collections.abc import Iterable, Iterator
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from app.agent.prompt import BOCRA_AGENT_INSTRUCTION
from app.agent.tools import configure_tool_registry
from app.config import get_settings
from app.models.entities import AgentAction, AgentMessage, AgentThread, AgentToolCall, User
from app.repositories.bocra import AgentRepository, CertificateRepository, KnowledgeRepository
from app.services.portal import BillingService, ComplaintService, LicensingService, QosService, SearchService, TypeApprovalService

settings = get_settings()

try:
    from google.adk.agents import Agent as AdkAgent
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types as genai_types
except Exception:  # pragma: no cover - optional at runtime
    AdkAgent = None
    Runner = None
    InMemorySessionService = None
    genai_types = None


class AgentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AgentRepository(db)
        self.knowledge_repo = KnowledgeRepository(db)
        self.search_service = SearchService(db)
        self.complaint_service = ComplaintService(db)
        self.licensing_service = LicensingService(db)
        self.type_approval_service = TypeApprovalService(db)
        self.billing_service = BillingService(db)
        self.qos_service = QosService()
        self.certificate_repo = CertificateRepository(db)
        self._runner = None
        self._session_service = None
        self._configure_adk()

    def _configure_adk(self) -> None:
        if AdkAgent is None or Runner is None or InMemorySessionService is None:
            return
        if settings.google_adk_use_vertexai:
            os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "TRUE"
            os.environ["GOOGLE_CLOUD_PROJECT"] = settings.google_cloud_project
            os.environ["GOOGLE_CLOUD_LOCATION"] = settings.google_cloud_location
            if settings.google_application_credentials:
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
        elif settings.google_api_key:
            os.environ.setdefault("GOOGLE_API_KEY", settings.google_api_key)
        else:
            return

        self._session_service = InMemorySessionService()
        configure_tool_registry(
            {
                "search_knowledge": self._tool_search_knowledge,
                "search_licences": self._tool_search_licences,
                "search_type_approvals": self._tool_search_type_approvals,
                "search_certificates": self._tool_search_certificates,
                "get_qos_by_location": self._tool_get_qos_by_location,
                "get_application_status": self._tool_get_application_status,
                "list_due_invoices": self._tool_list_due_invoices,
                "create_complaint_draft": self._tool_create_complaint_draft,
                "create_application_draft": self._tool_create_application_draft,
            }
        )
        from app.agent import tools as tool_module

        agent = AdkAgent(
            name="bocra_copilot",
            model=settings.google_ai_model,
            description="BOCRA workflow and search copilot.",
            instruction=BOCRA_AGENT_INSTRUCTION,
            tools=[
                tool_module.search_knowledge,
                tool_module.search_licences,
                tool_module.search_type_approvals,
                tool_module.search_certificates,
                tool_module.get_qos_by_location,
                tool_module.get_application_status,
                tool_module.list_due_invoices,
                tool_module.create_complaint_draft,
                tool_module.create_application_draft,
            ],
        )
        self._runner = Runner(agent=agent, app_name="bocra_copilot", session_service=self._session_service)

    def stream_chat(self, *, messages: list[dict[str, str]], external_thread_id: str | None, user: User | None) -> tuple[str, Iterator[str]]:
        thread_key = external_thread_id or f"thread-{uuid4().hex[:10]}"
        thread = self.repo.get_thread(thread_key)
        if not thread:
            thread = self.repo.create_thread(
                AgentThread(
                    external_thread_id=thread_key,
                    user_id=user.id if user else None,
                    context_scope_code="AUTHENTICATED" if user else "PUBLIC",
                    title=messages[0]["content"][:60] if messages else "Conversation",
                )
            )
        latest_user_message = messages[-1]["content"] if messages else ""

        self.repo.add_message(AgentMessage(thread_id=thread.id, role_code="user", content=latest_user_message))
        response_text, cited_ids, tool_invocations = self._generate_response(latest_user_message, user, thread.id)
        self.repo.add_message(
            AgentMessage(
                thread_id=thread.id,
                role_code="assistant",
                content=response_text,
                cited_document_ids=cited_ids,
                tool_invocations=tool_invocations,
            )
        )
        self.db.commit()
        return thread.external_thread_id, self._chunk_text(response_text)

    def _chunk_text(self, text: str, chunk_size: int = 48) -> Iterator[str]:
        for index in range(0, len(text), chunk_size):
            yield text[index:index + chunk_size]

    def _generate_response(self, prompt: str, user: User | None, thread_id: str) -> tuple[str, list[str], list[dict[str, Any]]]:
        if self._runner and self._session_service and genai_types:
            try:
                return self._run_adk(prompt, user, thread_id)
            except Exception:
                pass
        return self._run_fallback(prompt, user, thread_id)

    def _run_adk(self, prompt: str, user: User | None, thread_id: str) -> tuple[str, list[str], list[dict[str, Any]]]:
        user_key = user.id if user else "public"
        session = self._session_service.create_session(app_name="bocra_copilot", user_id=user_key)  # type: ignore[call-arg]
        content = genai_types.Content(role="user", parts=[genai_types.Part(text=prompt)])
        output_parts: list[str] = []
        tool_invocations: list[dict[str, Any]] = []
        cited_ids: list[str] = []
        for event in self._runner.run(user_id=user_key, session_id=session.id, new_message=content):  # type: ignore[union-attr]
            if not event.content or not event.content.parts:
                continue
            for part in event.content.parts:
                if getattr(part, "function_call", None):
                    tool_invocations.append({"tool": part.function_call.name, "input": dict(part.function_call.args or {})})
                if getattr(part, "function_response", None):
                    tool_invocations.append({"tool": part.function_response.name, "output": part.function_response.response})
                if getattr(part, "text", None):
                    output_parts.append(part.text)
        text = "".join(output_parts).strip() or "The BOCRA Copilot could not produce a response just now."
        return text, cited_ids, tool_invocations

    def _run_fallback(self, prompt: str, user: User | None, thread_id: str) -> tuple[str, list[str], list[dict[str, Any]]]:
        text = prompt.lower()
        tool_invocations: list[dict[str, Any]] = []
        cited_ids: list[str] = []

        if "invoice" in text or "payment" in text:
            invoices = self.billing_service.list_invoices(user, "applicant" if user else "public")
            due = [invoice for invoice in invoices if invoice.status_code in {"UNPAID", "OVERDUE"}]
            payload = {"count": len(due), "invoice_numbers": [invoice.invoice_number for invoice in due]}
            self._log_tool_call(thread_id, "list_due_invoices", {"user_id": user.id if user else None}, payload)
            tool_invocations.append({"tool": "list_due_invoices", "output": payload})
            if due:
                lines = [f"{invoice.invoice_number} is {invoice.status_code.lower()} for P {float(invoice.total_amount):,.2f} due on {invoice.due_date.isoformat()}." for invoice in due[:3]]
                return "Outstanding invoices:\n" + "\n".join(lines), cited_ids, tool_invocations
            return "You do not have any outstanding invoices right now.", cited_ids, tool_invocations

        if "pending application" in text or ("application" in text and "status" in text):
            data = self.licensing_service.dashboard_data(user=user, role="applicant" if user else "public")
            payload = {
                "applications": [
                    {"id": application.id, "workflow_id": application.workflow_application_id, "type": application.licence_type_name}
                    for application in data["applications"]
                ]
            }
            self._log_tool_call(thread_id, "get_application_status", {"user_id": user.id if user else None}, payload)
            tool_invocations.append({"tool": "get_application_status", "output": payload})
            if not data["applications"]:
                return "You do not have any tracked licensing applications yet.", cited_ids, tool_invocations
            lines = [f"{application.licence_type_name} is active under workflow {application.workflow_application_id}." for application in data["applications"][:3]]
            return "\n".join(lines), cited_ids, tool_invocations

        if "file" in text and "complaint" in text:
            subject = "Complaint filed by Copilot"
            description = prompt.strip()
            operator = "Unknown operator"
            for candidate in ("Mascom", "Orange", "BTC"):
                if candidate.lower() in text:
                    operator = candidate if candidate != "BTC" else "BTC Broadband"
            complaint = self.complaint_service.submit_complaint(
                draft={
                    "category": "coverage" if "coverage" in text or "signal" in text else "other",
                    "operator": operator,
                    "subject": subject,
                    "description": description,
                    "name": f"{user.first_name} {user.last_name}" if user else "Portal User",
                    "email": user.email if user else "public@bocra.demo",
                    "phone": user.phone_e164 if user else "",
                },
                attachments=[],
                user=user,
            )
            payload = {"complaint_number": complaint.complaint_number, "status": complaint.current_status_code}
            self._log_tool_call(thread_id, "create_complaint_draft", {"prompt": prompt}, payload)
            self._log_action(thread_id, "CREATE", "complaints.complaints", complaint.id)
            tool_invocations.append({"tool": "create_complaint_draft", "output": payload})
            return f"I created complaint {complaint.complaint_number} for {operator}. The case is now in status {complaint.current_status_code}.", cited_ids, tool_invocations

        if "apply" in text and "licence" in text:
            result = self.licensing_service.create_application(
                {
                    "category": "telecommunications",
                    "licenceType": "Electronic Communications Service Licence",
                    "applicantName": f"{user.first_name} {user.last_name}" if user else "Portal User",
                    "applicantEmail": user.email if user else "public@bocra.demo",
                    "coverageArea": "Nationwide",
                    "formData": {"prompt": prompt},
                },
                user,
            )
            workflow = result["workflow"]
            payload = {"application_number": workflow.application_number}
            self._log_tool_call(thread_id, "create_application_draft", {"module": "licensing", "prompt": prompt}, payload)
            self._log_action(thread_id, "CREATE", "workflow.applications", workflow.id)
            tool_invocations.append({"tool": "create_application_draft", "output": payload})
            return f"I created licence application {workflow.application_number}. It is now in status {workflow.current_status_code}.", cited_ids, tool_invocations

        if "type approval" in text and ("apply" in text or "submit" in text):
            try:
                result = self.type_approval_service.create_application(
                    {
                        "accreditationType": "customer",
                        "brandName": "Demo Device",
                        "modelName": "Demo Model",
                        "simEnabled": "yes",
                        "countryOfManufacture": "Botswana",
                        "declaration": True,
                    },
                    user,
                )
                workflow = result["workflow"]
                payload = {"application_number": workflow.application_number}
                self._log_tool_call(thread_id, "create_application_draft", {"module": "type_approval", "prompt": prompt}, payload)
                self._log_action(thread_id, "CREATE", "device.type_approval_applications", result["application"].id)
                tool_invocations.append({"tool": "create_application_draft", "output": payload})
                return f"I created type approval application {workflow.application_number}.", cited_ids, tool_invocations
            except Exception as error:
                return f"I could not create the type approval application: {error}", cited_ids, tool_invocations

        if "coverage" in text or "qos" in text or "which network" in text:
            summary = self.qos_service.summary()
            providers = summary.get("providers", [])
            best = max(providers, key=lambda provider: provider["primaryMetric"]["value"]) if providers else None
            payload = {"providers": providers}
            self._log_tool_call(thread_id, "get_qos_by_location", {"query": prompt}, payload)
            tool_invocations.append({"tool": "get_qos_by_location", "output": payload})
            if best:
                return f"{best['name']} currently has the highest reported {best['primaryMetric']['label']} score at {best['primaryMetric']['value']}%.", cited_ids, tool_invocations

        if "certificate" in text:
            certificates = self.search_service.search(prompt, "certificate")["certificates"]
            payload = {"count": len(certificates)}
            self._log_tool_call(thread_id, "search_certificates", {"query": prompt}, payload)
            tool_invocations.append({"tool": "search_certificates", "output": payload})
            if certificates:
                certificate = certificates[0]
                return f"I found certificate {certificate.certificate_number} issued to {certificate.holder_name}.", cited_ids, tool_invocations

        chunks = self.knowledge_repo.search_chunks(prompt, limit=2)
        payload = {"count": len(chunks), "titles": [document.title for _, document in chunks]}
        self._log_tool_call(thread_id, "search_knowledge", {"query": prompt}, payload)
        tool_invocations.append({"tool": "search_knowledge", "output": payload})
        if chunks:
            cited_ids = [document.id for _, document in chunks]
            titles = ", ".join(document.title for _, document in chunks)
            answer = f"According to {titles}, {chunks[0][0].content}"
            return answer, cited_ids, tool_invocations
        return "I can help you with BOCRA complaints, licensing, type approval, certificates, invoices, and QoS information.", cited_ids, tool_invocations

    def _log_tool_call(self, thread_id: str, tool_name: str, request_json: dict[str, Any], response_json: dict[str, Any]) -> None:
        self.repo.add_tool_call(
            AgentToolCall(
                thread_id=thread_id,
                tool_name=tool_name,
                request_json=request_json,
                response_json=response_json,
                result_status_code="SUCCESS",
            )
        )

    def _log_action(self, thread_id: str, action_type: str, target_table: str, target_id: str | None) -> None:
        self.repo.add_action(
            AgentAction(
                thread_id=thread_id,
                action_type_code=action_type,
                target_table=target_table,
                target_id=target_id,
                confirmation_state="EXECUTED",
            )
        )

    def _tool_search_knowledge(self, query: str) -> dict[str, Any]:
        chunks = self.knowledge_repo.search_chunks(query, limit=5)
        return {"results": [{"title": document.title, "excerpt": chunk.content} for chunk, document in chunks]}

    def _tool_search_licences(self, query: str) -> dict[str, Any]:
        result = self.search_service.search(query, "licence")
        return {"results": [record.licence_number for record in result["licences"]]}

    def _tool_search_type_approvals(self, query: str) -> dict[str, Any]:
        return self.type_approval_service.search_public(query, 0, 5)

    def _tool_search_certificates(self, query: str) -> dict[str, Any]:
        result = self.search_service.search(query, "certificate")
        return {"results": [certificate.certificate_number for certificate in result["certificates"]]}

    def _tool_get_qos_by_location(self, location: str) -> dict[str, Any]:
        return self.qos_service.summary()

    def _tool_get_application_status(self) -> dict[str, Any]:
        return self.licensing_service.dashboard_data(user=None, role="officer")

    def _tool_list_due_invoices(self) -> dict[str, Any]:
        invoices = self.billing_service.list_invoices(None, "officer")
        return {"results": [invoice.invoice_number for invoice in invoices if invoice.status_code in {"UNPAID", "OVERDUE"}]}

    def _tool_create_complaint_draft(self, subject: str, description: str, operator: str) -> dict[str, Any]:
        complaint = self.complaint_service.submit_complaint(
            draft={
                "category": "other",
                "operator": operator,
                "subject": subject,
                "description": description,
                "name": "ADK User",
                "email": "agent@bocra.demo",
                "phone": "",
            },
            attachments=[],
            user=None,
        )
        return {"complaint_number": complaint.complaint_number}

    def _tool_create_application_draft(self, module: str, licence_type: str) -> dict[str, Any]:
        if module == "licensing":
            result = self.licensing_service.create_application(
                {
                    "category": "telecommunications",
                    "licenceType": licence_type,
                    "applicantName": "ADK User",
                    "applicantEmail": "agent@bocra.demo",
                    "coverageArea": "Nationwide",
                    "formData": {},
                },
                None,
            )
            return {"application_number": result["workflow"].application_number}
        return {"status": "unsupported"}
