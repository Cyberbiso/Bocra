from __future__ import annotations

import os
import re
from collections.abc import Iterable, Iterator
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from app.agent.prompt import BOCRA_AGENT_INSTRUCTION
from app.agent.tools import configure_tool_registry
from app.config import get_settings
from app.models.entities import AgentAction, AgentMessage, AgentThread, AgentToolCall, User, WorkflowApplication
from app.repositories.bocra import AgentRepository, AuthRepository, CertificateRepository, KnowledgeRepository, WorkflowRepository
from app.services.auth import AuthService
from app.services.portal import BillingService, ComplaintService, DashboardService, LicensingService, QosService, SearchService, TypeApprovalService

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
        self.workflow_repo = WorkflowRepository(db)
        self.knowledge_repo = KnowledgeRepository(db)
        self.search_service = SearchService(db)
        self.complaint_service = ComplaintService(db)
        self.licensing_service = LicensingService(db)
        self.type_approval_service = TypeApprovalService(db)
        self.billing_service = BillingService(db)
        self.dashboard_service = DashboardService(db)
        self.qos_service = QosService()
        self.certificate_repo = CertificateRepository(db)
        self._runner = None
        self._session_service = None
        self._current_user: User | None = None
        self._current_thread_id: str | None = None
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
                "list_complaints": self._tool_list_complaints,
                "get_complaint_case": self._tool_get_complaint_case,
                "act_on_complaint_case": self._tool_act_on_complaint_case,
                "list_licence_applications": self._tool_list_licence_applications,
                "get_licence_application": self._tool_get_licence_application,
                "act_on_licence_application": self._tool_act_on_licence_application,
                "get_staff_queue_summary": self._tool_get_staff_queue_summary,
                "search_type_approvals": self._tool_search_type_approvals,
                "list_type_approval_applications": self._tool_list_type_approval_applications,
                "get_type_approval_application": self._tool_get_type_approval_application,
                "act_on_type_approval": self._tool_act_on_type_approval,
                "add_type_approval_comment": self._tool_add_type_approval_comment,
                "review_type_approval_document": self._tool_review_type_approval_document,
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
                tool_module.list_complaints,
                tool_module.get_complaint_case,
                tool_module.act_on_complaint_case,
                tool_module.list_licence_applications,
                tool_module.get_licence_application,
                tool_module.act_on_licence_application,
                tool_module.get_staff_queue_summary,
                tool_module.search_type_approvals,
                tool_module.list_type_approval_applications,
                tool_module.get_type_approval_application,
                tool_module.act_on_type_approval,
                tool_module.add_type_approval_comment,
                tool_module.review_type_approval_document,
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
        self._current_user = user
        self._current_thread_id = thread_id
        if self._runner and self._session_service and genai_types:
            try:
                return self._run_adk(prompt, user, thread_id)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("ADK runner failed, falling back: %s", exc)
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
        role = self._role_for_current_user()
        thread_memory = self._build_thread_memory(thread_id)
        application_reference, complaint_reference, workflow, workflow_type = self._resolve_conversation_context(
            prompt,
            thread_id,
            thread_memory,
        )
        complaint_action = self._extract_complaint_action(text) if complaint_reference or "complaint" in text else None
        licensing_action = self._extract_licensing_action(text) if workflow_type == "LICENCE" or "licence" in text or "license" in text else None
        type_approval_action = self._extract_type_approval_action(text) if workflow_type == "TYPE_APPROVAL" or "type approval" in text else None
        complaint_queue_request = any(phrase in text for phrase in ("complaint queue", "complaints queue", "pending complaints", "complaint cases"))
        licensing_queue_request = any(
            phrase in text for phrase in ("licence queue", "license queue", "pending licences", "pending licenses", "licence applications queue")
        )
        type_approval_queue_request = any(keyword in text for keyword in ("type approval queue", "type approval review queue", "pending type approval"))
        type_approval_document_review = "document" in text and any(keyword in text for keyword in ("approve", "reject", "needs update", "mark"))
        type_approval_comment_write = any(phrase in text for phrase in ("add comment", "leave comment", "internal note", "add note"))

        if workflow_type == "LICENCE" and "type approval" in text:
            return f"{application_reference} is a licence application, not a type approval application.", cited_ids, tool_invocations
        if workflow_type == "TYPE_APPROVAL" and ("licence" in text or "license" in text):
            return f"{application_reference} is a type approval application, not a licensing application.", cited_ids, tool_invocations
        if role == "officer" and (workflow_type == "TYPE_APPROVAL" or type_approval_queue_request or type_approval_document_review or type_approval_comment_write or type_approval_action):
            return "Type approval review belongs to type approvers and admins, so I will not mix it into an officer session.", cited_ids, tool_invocations
        if role == "type_approver" and (complaint_reference or complaint_queue_request or complaint_action):
            return "Complaint review belongs to officers and admins, so I will not mix it into a type approver session.", cited_ids, tool_invocations
        if role == "type_approver" and (workflow_type == "LICENCE" or licensing_queue_request or licensing_action):
            return "Licensing review belongs to officers and admins, so I will not mix it into a type approver session.", cited_ids, tool_invocations
        if role not in {"officer", "admin"} and (complaint_queue_request or complaint_action):
            return "Only officers and admins can progress complaint workflows.", cited_ids, tool_invocations
        if role not in {"officer", "admin"} and (licensing_queue_request or licensing_action):
            return "Only officers and admins can progress licensing workflows.", cited_ids, tool_invocations
        if role not in {"type_approver", "admin", "applicant"} and (workflow_type == "TYPE_APPROVAL" or type_approval_queue_request or type_approval_document_review or type_approval_comment_write or type_approval_action):
            return "Only applicants, type approvers, and admins can access type approval workflows.", cited_ids, tool_invocations

        if role == "admin" and any(phrase in text for phrase in ("queue summary", "all queues", "operational queue", "needs attention")):
            payload = self._tool_get_staff_queue_summary()
            self._log_tool_call(thread_id, "get_staff_queue_summary", {}, payload)
            tool_invocations.append({"tool": "get_staff_queue_summary", "output": payload})
            return (
                f"Operational queues: complaints {payload['complaints']}, licensing {payload['licensing']}, "
                f"type approval {payload['typeApproval']}."
            ), cited_ids, tool_invocations

        if complaint_reference or "complaint" in text:
            if complaint_action:
                if not self._can_run_officer_workflows(role) or not user:
                    return "Only officers and admins can progress complaint workflows.", cited_ids, tool_invocations
                if not complaint_reference:
                    return "Please share the complaint number, for example BCR-2026-123456 or CMP-2025-00841.", cited_ids, tool_invocations
                note = self._extract_note(prompt)
                try:
                    complaint = self.complaint_service.officer_action(complaint_reference, action=complaint_action, officer=user, note=note)
                except ValueError as error:
                    return str(error), cited_ids, tool_invocations
                if not complaint:
                    return f"I could not find complaint {complaint_reference}.", cited_ids, tool_invocations
                payload = {"complaintNumber": complaint.complaint_number, "status": complaint.current_status_code}
                self._log_tool_call(thread_id, "act_on_complaint_case", {"reference": complaint_reference, "action": complaint_action, "note": note}, payload)
                self._log_action(thread_id, complaint_action.upper(), "complaints.complaints", complaint.id)
                tool_invocations.append({"tool": "act_on_complaint_case", "output": payload})
                return f"{complaint.complaint_number} is now in status {complaint.current_status_code}.", cited_ids, tool_invocations

            if self._can_run_officer_workflows(role) and any(phrase in text for phrase in ("complaint queue", "complaints queue", "pending complaints", "complaint cases")):
                complaints, _ = self.complaint_service.list_complaints(
                    role=role,
                    user=user,
                    status=None,
                    operator=None,
                    date_from=None,
                    date_to=None,
                    page=1,
                    page_size=10,
                )
                queue_items = [item for item in complaints if item.current_status_code in {"NEW", "ASSIGNED", "IN_PROGRESS", "PENDING", "REMANDED"}]
                payload = {"count": len(queue_items), "complaintNumbers": [item.complaint_number for item in queue_items[:10]]}
                self._log_tool_call(thread_id, "list_complaints", {"queue": True}, payload)
                tool_invocations.append({"tool": "list_complaints", "output": payload})
                if not queue_items:
                    return "The complaint queue is clear right now.", cited_ids, tool_invocations
                lines = [
                    f"{item.complaint_number} for {item.service_provider_name or 'Unknown provider'} is {item.current_status_code}."
                    for item in queue_items[:5]
                ]
                return "Complaint queue:\n" + "\n".join(lines), cited_ids, tool_invocations

            if complaint_reference and any(keyword in text for keyword in ("show", "status", "detail", "open", "review", "inspect")):
                detail = self.complaint_service.get_detail(complaint_reference, user=user, role=role)
                payload = {"found": bool(detail), "reference": complaint_reference}
                self._log_tool_call(thread_id, "get_complaint_case", {"reference": complaint_reference}, payload)
                tool_invocations.append({"tool": "get_complaint_case", "output": payload})
                if not detail:
                    return f"I could not find complaint {complaint_reference}.", cited_ids, tool_invocations
                complaint = detail["complaint"]
                return (
                    f"{complaint.complaint_number} is {complaint.current_status_code} for {complaint.service_provider_name or 'Unknown provider'}. "
                    f"Subject: {complaint.subject}. Messages: {len(detail['messages'])}. Attachments: {len(detail['attachments'])}."
                ), cited_ids, tool_invocations

            if "my complaints" in text or (self._can_run_officer_workflows(role) and "list complaints" in text):
                complaints, _ = self.complaint_service.list_complaints(
                    role=role,
                    user=user,
                    status=None,
                    operator=None,
                    date_from=None,
                    date_to=None,
                    page=1,
                    page_size=10,
                )
                payload = {"count": len(complaints), "complaintNumbers": [item.complaint_number for item in complaints[:10]]}
                self._log_tool_call(thread_id, "list_complaints", {"queue": False}, payload)
                tool_invocations.append({"tool": "list_complaints", "output": payload})
                if not complaints:
                    return "There are no complaint cases to show right now.", cited_ids, tool_invocations
                lines = [
                    f"{item.complaint_number} for {item.service_provider_name or 'Unknown provider'} is {item.current_status_code}."
                    for item in complaints[:5]
                ]
                return "Complaints:\n" + "\n".join(lines), cited_ids, tool_invocations

        if workflow_type == "LICENCE" or "licence" in text or "license" in text:
            if licensing_action:
                if not self._can_run_officer_workflows(role) or not user:
                    return "Only officers and admins can progress licensing workflows.", cited_ids, tool_invocations
                if not application_reference:
                    return "Please share the licensing application number, for example APP-2026-12345.", cited_ids, tool_invocations
                if workflow_type and workflow_type != "LICENCE":
                    return f"{application_reference} is not a licensing application.", cited_ids, tool_invocations
                detail = self.licensing_service.application_detail(application_reference, user=user, role=role)
                if not detail:
                    return f"I could not find licensing application {application_reference}.", cited_ids, tool_invocations
                note = self._extract_note(prompt)
                try:
                    updated = self.licensing_service.officer_action(detail["workflow"]["id"], action=licensing_action, officer=user, note=note)
                except ValueError as error:
                    return str(error), cited_ids, tool_invocations
                if not updated:
                    return f"I could not find licensing application {application_reference}.", cited_ids, tool_invocations
                payload = {"applicationNumber": updated.application_number, "status": updated.current_status_code, "stage": updated.current_stage_code}
                self._log_tool_call(thread_id, "act_on_licence_application", {"reference": application_reference, "action": licensing_action, "note": note}, payload)
                self._log_action(thread_id, licensing_action.upper(), "workflow.applications", updated.id)
                tool_invocations.append({"tool": "act_on_licence_application", "output": payload})
                return f"{updated.application_number} is now in status {updated.current_status_code}.", cited_ids, tool_invocations

            if self._can_run_officer_workflows(role) and any(phrase in text for phrase in ("licence queue", "license queue", "pending licences", "pending licenses", "licence applications queue")):
                payload = self.licensing_service.list_applications(user=user, role=role, status=None, query=None, page=1, page_size=10)
                queue_payload = {
                    "count": len(payload["data"]),
                    "applicationNumbers": [item["applicationNumber"] for item in payload["data"][:10]],
                }
                self._log_tool_call(thread_id, "list_licence_applications", {"queue": True}, queue_payload)
                tool_invocations.append({"tool": "list_licence_applications", "output": queue_payload})
                if not payload["data"]:
                    return "The licensing queue is clear right now.", cited_ids, tool_invocations
                lines = [
                    f"{item['applicationNumber']} for {item['licenceType']} is {item['status']}."
                    for item in payload["data"][:5]
                ]
                return "Licensing queue:\n" + "\n".join(lines), cited_ids, tool_invocations

            if application_reference and (workflow_type == "LICENCE" or any(keyword in text for keyword in ("show", "status", "detail", "open", "review", "inspect"))):
                detail = self.licensing_service.application_detail(application_reference, user=user, role=role)
                detail_payload = {"found": bool(detail), "reference": application_reference}
                self._log_tool_call(thread_id, "get_licence_application", {"reference": application_reference}, detail_payload)
                tool_invocations.append({"tool": "get_licence_application", "output": detail_payload})
                if detail:
                    summary = detail["summary"]
                    return (
                        f"{summary['applicationNumber']} is {summary['status']} for {summary['licenceType']}. "
                        f"Applicant: {summary['applicantName']}. Stage: {summary['stage'] or 'N/A'}."
                    ), cited_ids, tool_invocations
                if workflow_type == "LICENCE":
                    return f"I could not find licensing application {application_reference}.", cited_ids, tool_invocations

            if "my licence applications" in text or "my license applications" in text or (self._can_run_officer_workflows(role) and ("licence applications" in text or "license applications" in text)):
                payload = self.licensing_service.list_applications(user=user, role=role, status=None, query=None, page=1, page_size=10)
                list_payload = {
                    "count": len(payload["data"]),
                    "applicationNumbers": [item["applicationNumber"] for item in payload["data"][:10]],
                }
                self._log_tool_call(thread_id, "list_licence_applications", {"queue": False}, list_payload)
                tool_invocations.append({"tool": "list_licence_applications", "output": list_payload})
                if not payload["data"]:
                    return "There are no licensing applications to show right now.", cited_ids, tool_invocations
                lines = [
                    f"{item['applicationNumber']} for {item['licenceType']} is {item['status']}."
                    for item in payload["data"][:5]
                ]
                return "Licensing applications:\n" + "\n".join(lines), cited_ids, tool_invocations

        if workflow_type == "TYPE_APPROVAL" or "type approval" in text:
            if type_approval_document_review:
                if not self._can_run_type_approval_workflows(role) or not user:
                    return "Only type approvers and admins can review type approval documents.", cited_ids, tool_invocations
                if not application_reference:
                    return "Please share the type approval application number, for example APP-2025-00387.", cited_ids, tool_invocations
                detail = self.type_approval_service.detail(application_reference, user=user, role=role)
                if not detail:
                    return f"I could not find type approval application {application_reference}.", cited_ids, tool_invocations
                document = self._match_document_from_prompt(detail.get("documents", []), prompt)
                if not document:
                    return "Please mention the document name or document id so I can review the right file.", cited_ids, tool_invocations
                review_status = "APPROVED"
                if "reject" in text:
                    review_status = "REJECTED"
                elif "needs update" in text or "need update" in text:
                    review_status = "NEEDS_UPDATE"
                note = self._extract_note(prompt)
                try:
                    payload = self.type_approval_service.review_document(
                        application_reference,
                        document_id=document["id"],
                        reviewer=user,
                        role=role,
                        review_status=review_status,
                        note=note,
                    )
                except (PermissionError, ValueError) as error:
                    return str(error), cited_ids, tool_invocations
                if not payload:
                    return "I could not find that type approval document.", cited_ids, tool_invocations
                self._log_tool_call(
                    thread_id,
                    "review_type_approval_document",
                    {"reference": application_reference, "documentId": document["id"], "reviewStatus": review_status, "note": note},
                    payload,
                )
                self._log_action(thread_id, review_status, "workflow.application_documents", document["id"])
                tool_invocations.append({"tool": "review_type_approval_document", "output": payload})
                return f"{payload['documentType']} is now marked {payload['reviewStatus']} on {application_reference}.", cited_ids, tool_invocations

            if type_approval_comment_write:
                if not user:
                    return "Please sign in before adding a comment.", cited_ids, tool_invocations
                if not application_reference:
                    return "Please share the type approval application number, for example APP-2025-00387.", cited_ids, tool_invocations
                visibility = "INTERNAL" if any(phrase in text for phrase in ("internal note", "internal comment")) else "APPLICANT"
                note = self._extract_note(prompt) or self._extract_comment_body(prompt)
                if not note:
                    return "Please include the comment you want me to save.", cited_ids, tool_invocations
                try:
                    payload = self.type_approval_service.add_comment(
                        application_reference,
                        user=user,
                        role=role,
                        body=note,
                        visibility=visibility,
                    )
                except (PermissionError, ValueError) as error:
                    return str(error), cited_ids, tool_invocations
                if not payload:
                    return f"I could not find type approval application {application_reference}.", cited_ids, tool_invocations
                self._log_tool_call(
                    thread_id,
                    "add_type_approval_comment",
                    {"reference": application_reference, "visibility": visibility, "body": note},
                    payload,
                )
                self._log_action(thread_id, "COMMENT", "workflow.application_comments", payload["id"])
                tool_invocations.append({"tool": "add_type_approval_comment", "output": payload})
                return f"I added a {payload['visibility'].lower()} comment to {application_reference}.", cited_ids, tool_invocations

            action = type_approval_action
            if action:
                if not self._can_run_type_approval_workflows(role) or not user:
                    return "Only type approvers and admins can perform type approval review actions.", cited_ids, tool_invocations
                if not application_reference:
                    return "Please share the type approval application number, for example APP-2025-00387.", cited_ids, tool_invocations
                note = self._extract_note(prompt)
                try:
                    workflow = self.type_approval_service.officer_action(
                        application_reference,
                        action=action,
                        officer=user,
                        note=note,
                    )
                except (PermissionError, ValueError) as error:
                    return str(error), cited_ids, tool_invocations
                if not workflow:
                    return f"I could not find type approval application {application_reference}.", cited_ids, tool_invocations
                payload = {
                    "applicationNumber": workflow.application_number,
                    "status": workflow.current_status_code,
                    "stage": workflow.current_stage_code,
                }
                self._log_tool_call(thread_id, "act_on_type_approval", {"reference": application_reference, "action": action, "note": note}, payload)
                self._log_action(thread_id, action.upper(), "workflow.applications", workflow.id)
                tool_invocations.append({"tool": "act_on_type_approval", "output": payload})
                return f"{workflow.application_number} is now in status {workflow.current_status_code}.", cited_ids, tool_invocations

            if self._can_run_type_approval_workflows(role) and type_approval_queue_request:
                payload = self.type_approval_service.queue(user=user, role=role, query=None, page=1, page_size=10)
                queue_payload = {
                    "count": len(payload["data"]),
                    "applicationNumbers": [item["applicationNumber"] for item in payload["data"][:10]],
                }
                self._log_tool_call(thread_id, "list_type_approval_applications", {"queue": True}, queue_payload)
                tool_invocations.append({"tool": "list_type_approval_applications", "output": queue_payload})
                if not payload["data"]:
                    return "The type approval review queue is clear right now.", cited_ids, tool_invocations
                lines = [
                    f"{item['applicationNumber']} for {item['brand']} {item['model']} is {item['status']} with {item['openTaskCount']} open task(s)."
                    for item in payload["data"][:5]
                ]
                return "Type approval queue:\n" + "\n".join(lines), cited_ids, tool_invocations

            if application_reference and (workflow_type == "TYPE_APPROVAL" or any(keyword in text for keyword in ("show", "status", "detail", "open", "review", "inspect"))):
                detail = self.type_approval_service.detail(application_reference, user=user, role=role)
                detail_payload = {"found": bool(detail), "reference": application_reference}
                self._log_tool_call(thread_id, "get_type_approval_application", {"reference": application_reference}, detail_payload)
                tool_invocations.append({"tool": "get_type_approval_application", "output": detail_payload})
                if not detail:
                    return f"I could not find type approval application {application_reference}.", cited_ids, tool_invocations
                summary = detail["summary"]
                if "document" in text:
                    if not detail["documents"]:
                        return f"{summary['applicationNumber']} has no uploaded documents yet.", cited_ids, tool_invocations
                    lines = [
                        f"{document['documentType']} ({document['name']}) is {document['reviewStatus']}."
                        for document in detail["documents"][:5]
                    ]
                    return "Type approval documents:\n" + "\n".join(lines), cited_ids, tool_invocations
                if "comment" in text or "note" in text:
                    if not detail["comments"]:
                        return f"{summary['applicationNumber']} has no saved comments yet.", cited_ids, tool_invocations
                    lines = [
                        f"{comment['visibility']}: {comment['body']}"
                        for comment in detail["comments"][-5:]
                    ]
                    return "Type approval comments:\n" + "\n".join(lines), cited_ids, tool_invocations
                if "party" in text:
                    if not detail["parties"]:
                        return f"{summary['applicationNumber']} has no structured parties yet.", cited_ids, tool_invocations
                    lines = [
                        f"{party['partyType']}: {party['displayName'] or party['organizationName']}"
                        for party in detail["parties"]
                    ]
                    return "Type approval parties:\n" + "\n".join(lines), cited_ids, tool_invocations
                return (
                    f"{summary['applicationNumber']} is {summary['status']} for {summary['brand']} {summary['model']}. "
                    f"Stage: {summary['stage'] or 'N/A'}. Open tasks: {summary['openTaskCount']}. "
                    f"Invoices: {summary['invoiceCount']}. Certificates: {summary['certificateCount']}."
                ), cited_ids, tool_invocations

            if "my type approval" in text or "type approval applications" in text:
                payload = self.type_approval_service.list_applications(user=user, role=role, status=None, query=None, page=1, page_size=10)
                list_payload = {
                    "count": len(payload["data"]),
                    "applicationNumbers": [item["applicationNumber"] for item in payload["data"][:10]],
                }
                self._log_tool_call(thread_id, "list_type_approval_applications", {"queue": False}, list_payload)
                tool_invocations.append({"tool": "list_type_approval_applications", "output": list_payload})
                if not payload["data"]:
                    return "You do not have any type approval applications yet.", cited_ids, tool_invocations
                lines = [
                    f"{item['applicationNumber']} for {item['brand']} {item['model']} is {item['status']}."
                    for item in payload["data"][:5]
                ]
                return "Type approval applications:\n" + "\n".join(lines), cited_ids, tool_invocations

        if "invoice" in text or "payment" in text:
            invoices = self.billing_service.list_invoices(user, role)
            due = [invoice for invoice in invoices if invoice.status_code in {"UNPAID", "OVERDUE"}]
            payload = {"count": len(due), "invoice_numbers": [invoice.invoice_number for invoice in due]}
            self._log_tool_call(thread_id, "list_due_invoices", {"user_id": user.id if user else None}, payload)
            tool_invocations.append({"tool": "list_due_invoices", "output": payload})
            if due:
                lines = [f"{invoice.invoice_number} is {invoice.status_code.lower()} for P {float(invoice.total_amount):,.2f} due on {invoice.due_date.isoformat()}." for invoice in due[:3]]
                return "Outstanding invoices:\n" + "\n".join(lines), cited_ids, tool_invocations
            return "You do not have any outstanding invoices right now.", cited_ids, tool_invocations

        if "pending application" in text or ("application" in text and "status" in text):
            data = self.licensing_service.dashboard_data(user=user, role=role)
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

    def _role_for_current_user(self) -> str:
        user = self._current_user
        if not user:
            return "public"
        roles = AuthRepository(self.db).get_roles_for_user(user.id)
        return AuthService.primary_role(roles)

    def _extract_application_reference(self, prompt: str) -> str | None:
        match = re.search(r"\bAPP-\d{4}-[A-Z0-9]+\b", prompt, flags=re.IGNORECASE)
        if match:
            return match.group(0).upper()
        return None

    def _extract_complaint_reference(self, prompt: str) -> str | None:
        match = re.search(r"\b(?:BCR|CMP)-\d{4}-[A-Z0-9]+\b", prompt, flags=re.IGNORECASE)
        if match:
            return match.group(0).upper()
        return None

    def _resolve_conversation_context(
        self,
        prompt: str,
        thread_id: str,
        thread_memory: dict[str, Any] | None = None,
    ) -> tuple[str | None, str | None, WorkflowApplication | None, str | None]:
        memory = thread_memory or self._build_thread_memory(thread_id)
        application_reference = self._extract_application_reference(prompt)
        complaint_reference = self._extract_complaint_reference(prompt)
        module_hint = self._module_hint_from_prompt(prompt) or memory.get("activeModule")
        if not application_reference and not complaint_reference and self._should_use_thread_context(prompt):
            ordinal_index = self._extract_queue_position(prompt)
            if ordinal_index is not None:
                if module_hint == "complaint":
                    complaint_reference = self._reference_from_queue(memory, "complaint", ordinal_index)
                elif module_hint == "licensing":
                    application_reference = self._reference_from_queue(memory, "licensing", ordinal_index)
                elif module_hint == "type_approval":
                    application_reference = self._reference_from_queue(memory, "type_approval", ordinal_index)
            if not application_reference and not complaint_reference:
                if module_hint == "complaint":
                    complaint_reference = memory.get("recentReferenceByModule", {}).get("complaint")
                elif module_hint == "licensing":
                    application_reference = memory.get("recentReferenceByModule", {}).get("licensing")
                elif module_hint == "type_approval":
                    application_reference = memory.get("recentReferenceByModule", {}).get("type_approval")
        workflow = self._resolve_workflow_reference(application_reference)
        workflow_type = workflow.application_type_code if workflow else None
        return application_reference, complaint_reference, workflow, workflow_type

    def _build_thread_memory(self, thread_id: str) -> dict[str, Any]:
        messages = self.repo.list_messages(thread_id)
        memory: dict[str, Any] = {
            "activeModule": None,
            "recentReferenceByModule": {
                "complaint": None,
                "licensing": None,
                "type_approval": None,
            },
            "recentQueues": {
                "complaint": [],
                "licensing": [],
                "type_approval": [],
            },
        }
        workflow_cache: dict[str, WorkflowApplication | None] = {}
        for message in messages:
            complaint_reference = self._extract_complaint_reference(message.content)
            if complaint_reference:
                memory["activeModule"] = "complaint"
                memory["recentReferenceByModule"]["complaint"] = complaint_reference
            application_reference = self._extract_application_reference(message.content)
            if application_reference:
                workflow = workflow_cache.get(application_reference)
                if application_reference not in workflow_cache:
                    workflow = self._resolve_workflow_reference(application_reference)
                    workflow_cache[application_reference] = workflow
                module = self._module_for_workflow(workflow)
                if module:
                    memory["activeModule"] = module
                    memory["recentReferenceByModule"][module] = application_reference
            module_hint = self._module_hint_from_prompt(message.content)
            if module_hint:
                memory["activeModule"] = module_hint
            for invocation in message.tool_invocations or []:
                self._apply_tool_invocation_to_memory(memory, invocation)
        return memory

    def _apply_tool_invocation_to_memory(self, memory: dict[str, Any], invocation: dict[str, Any]) -> None:
        tool = invocation.get("tool")
        output = invocation.get("output") or {}
        if tool == "list_complaints":
            complaint_numbers = list(output.get("complaintNumbers") or [])
            memory["recentQueues"]["complaint"] = complaint_numbers
            if complaint_numbers:
                memory["activeModule"] = "complaint"
                memory["recentReferenceByModule"]["complaint"] = complaint_numbers[0]
            return
        if tool == "list_licence_applications":
            application_numbers = list(output.get("applicationNumbers") or [])
            memory["recentQueues"]["licensing"] = application_numbers
            if application_numbers:
                memory["activeModule"] = "licensing"
                memory["recentReferenceByModule"]["licensing"] = application_numbers[0]
            return
        if tool == "list_type_approval_applications":
            application_numbers = list(output.get("applicationNumbers") or [])
            memory["recentQueues"]["type_approval"] = application_numbers
            if application_numbers:
                memory["activeModule"] = "type_approval"
                memory["recentReferenceByModule"]["type_approval"] = application_numbers[0]
            return
        if tool in {"get_complaint_case", "act_on_complaint_case", "create_complaint_draft"}:
            reference = output.get("complaintNumber") or output.get("reference")
            if reference:
                memory["activeModule"] = "complaint"
                memory["recentReferenceByModule"]["complaint"] = reference
            return
        if tool in {"get_licence_application", "act_on_licence_application"}:
            reference = output.get("applicationNumber") or output.get("reference")
            if reference:
                memory["activeModule"] = "licensing"
                memory["recentReferenceByModule"]["licensing"] = reference
            return
        if tool in {"get_type_approval_application", "act_on_type_approval"}:
            reference = output.get("applicationNumber") or output.get("reference")
            if reference:
                memory["activeModule"] = "type_approval"
                memory["recentReferenceByModule"]["type_approval"] = reference
            return
        if tool in {"add_type_approval_comment", "review_type_approval_document"}:
            reference = invocation.get("input", {}).get("reference")
            if reference:
                memory["activeModule"] = "type_approval"
                memory["recentReferenceByModule"]["type_approval"] = reference

    def _should_use_thread_context(self, prompt: str) -> bool:
        lowered = prompt.lower()
        words = re.findall(r"[a-z0-9]+", lowered)
        follow_up_markers = (
            " it",
            " this",
            " that",
            " same ",
            "the application",
            "the complaint",
            "the case",
            "those documents",
            "that one",
        )
        follow_up_intents = (
            "approve",
            "reject",
            "remand",
            "validate",
            "assign",
            "resolve",
            "issue",
            "review",
            "show",
            "open",
            "inspect",
            "status",
            "document",
            "documents",
            "comment",
            "comments",
            "note",
            "notes",
            "party",
            "parties",
        )
        has_marker = any(marker in f" {lowered} " for marker in follow_up_markers)
        has_follow_up_intent = any(intent in lowered for intent in follow_up_intents)
        return has_marker or (len(words) <= 8 and has_follow_up_intent)

    def _module_hint_from_prompt(self, prompt: str) -> str | None:
        lowered = prompt.lower()
        if "type approval" in lowered:
            return "type_approval"
        if "licence" in lowered or "license" in lowered:
            return "licensing"
        if "complaint" in lowered or "case" in lowered:
            return "complaint"
        return None

    def _module_for_workflow(self, workflow: WorkflowApplication | None) -> str | None:
        if not workflow:
            return None
        if workflow.application_type_code == "LICENCE":
            return "licensing"
        if workflow.application_type_code == "TYPE_APPROVAL":
            return "type_approval"
        return None

    def _reference_from_queue(self, memory: dict[str, Any], module: str, index: int) -> str | None:
        queue = list(memory.get("recentQueues", {}).get(module) or [])
        if not queue:
            return None
        if index < 0:
            return queue[-1]
        if index >= len(queue):
            return None
        return queue[index]

    def _extract_queue_position(self, prompt: str) -> int | None:
        lowered = prompt.lower()
        ordinal_map = {
            "first": 0,
            "1st": 0,
            "second": 1,
            "2nd": 1,
            "third": 2,
            "3rd": 2,
            "fourth": 3,
            "4th": 3,
            "last": -1,
        }
        for token, index in ordinal_map.items():
            if re.search(rf"\b{re.escape(token)}\b", lowered):
                return index
        return None

    def _resolve_workflow_reference(self, reference: str | None) -> WorkflowApplication | None:
        if not reference:
            return None
        workflow = self.workflow_repo.get_application_by_number(reference)
        if workflow:
            return workflow
        return self.workflow_repo.get_application(reference)

    def _can_run_officer_workflows(self, role: str) -> bool:
        return role in {"officer", "admin"}

    def _can_run_type_approval_workflows(self, role: str) -> bool:
        return role in {"type_approver", "admin"}

    def _extract_complaint_action(self, lowered: str) -> str | None:
        if "assign" in lowered:
            return "assign"
        if "resolve" in lowered:
            return "resolve"
        if "approve" in lowered:
            return "approve"
        if "remand" in lowered:
            return "remand"
        if "reject" in lowered:
            return "reject"
        return None

    def _extract_licensing_action(self, lowered: str) -> str | None:
        if "approve" in lowered:
            return "approve"
        if "remand" in lowered:
            return "remand"
        if "reject" in lowered:
            return "reject"
        return None

    def _extract_type_approval_action(self, lowered: str) -> str | None:
        if "issue certificate" in lowered or "issue the certificate" in lowered:
            return "issue_certificate"
        if "validate" in lowered:
            return "validate"
        if "approve" in lowered:
            return "approve"
        if "remand" in lowered:
            return "remand"
        if "reject" in lowered:
            return "reject"
        return None

    def _extract_note(self, prompt: str) -> str:
        match = re.search(r"\b(?:because|note)\b[: ]+(.*)$", prompt, flags=re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _extract_comment_body(self, prompt: str) -> str:
        match = re.search(r"\b(?:comment|note)\b(?:[: ]+|.*?\bthat\b[: ]+)(.*)$", prompt, flags=re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _match_document_from_prompt(self, documents: list[dict[str, Any]], prompt: str) -> dict[str, Any] | None:
        lowered = prompt.lower()
        document_id_match = re.search(r"\b[0-9a-f]{8}-[0-9a-f-]{27}\b", lowered)
        explicit_id = document_id_match.group(0) if document_id_match else None
        for document in documents:
            if explicit_id and explicit_id in {str(document.get("id", "")).lower(), str(document.get("fileId", "")).lower()}:
                return document
            document_type = str(document.get("documentType", "")).lower().replace("_", " ")
            document_name = str(document.get("name", "")).lower()
            if document_type and document_type in lowered:
                return document
            if document_name and document_name in lowered:
                return document
        if len(documents) == 1:
            return documents[0]
        return None

    def _tool_search_knowledge(self, query: str) -> dict[str, Any]:
        chunks = self.knowledge_repo.search_chunks(query, limit=5)
        return {"results": [{"title": document.title, "excerpt": chunk.content} for chunk, document in chunks]}

    def _tool_search_licences(self, query: str) -> dict[str, Any]:
        result = self.search_service.search(query, "licence")
        return {"results": [record.licence_number for record in result["licences"]]}

    def _tool_list_complaints(self, query: str = "") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        complaints, _ = self.complaint_service.list_complaints(
            role=role,
            user=user,
            status=None,
            operator=None,
            date_from=None,
            date_to=None,
            page=1,
            page_size=10,
        )
        lowered = query.lower().strip()
        if lowered:
            complaints = [
                complaint for complaint in complaints
                if lowered in " ".join(
                    [
                        complaint.complaint_number,
                        complaint.subject or "",
                        complaint.service_provider_name or "",
                        complaint.current_status_code or "",
                    ]
                ).lower()
            ]
        return {
            "results": [
                {
                    "complaintNumber": complaint.complaint_number,
                    "status": complaint.current_status_code,
                    "subject": complaint.subject,
                    "operator": complaint.service_provider_name,
                }
                for complaint in complaints
            ]
        }

    def _tool_get_complaint_case(self, reference: str) -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        detail = self.complaint_service.get_detail(reference, user=user, role=role)
        if not detail:
            return {"found": False, "reference": reference}
        complaint = detail["complaint"]
        return {
            "complaintNumber": complaint.complaint_number,
            "status": complaint.current_status_code,
            "subject": complaint.subject,
            "operator": complaint.service_provider_name,
            "messageCount": len(detail["messages"]),
            "attachmentCount": len(detail["attachments"]),
        }

    def _tool_act_on_complaint_case(self, reference: str, action: str, note: str = "") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        if not self._can_run_officer_workflows(role) or not user:
            return {"error": "Officer or admin role required."}
        try:
            complaint = self.complaint_service.officer_action(reference, action=action, officer=user, note=note)
        except ValueError as error:
            return {"error": str(error)}
        if not complaint:
            return {"error": f"Complaint {reference} not found."}
        if self._current_thread_id:
            self._log_action(self._current_thread_id, action.upper(), "complaints.complaints", complaint.id)
        return {"complaintNumber": complaint.complaint_number, "status": complaint.current_status_code}

    def _tool_list_licence_applications(self, query: str = "") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        return self.licensing_service.list_applications(user=user, role=role, status=None, query=query or None, page=1, page_size=10)

    def _tool_get_licence_application(self, reference: str) -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        detail = self.licensing_service.application_detail(reference, user=user, role=role)
        return detail or {"found": False, "reference": reference}

    def _tool_act_on_licence_application(self, reference: str, action: str, note: str = "") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        if not self._can_run_officer_workflows(role) or not user:
            return {"error": "Officer or admin role required."}
        detail = self.licensing_service.application_detail(reference, user=user, role=role)
        if not detail:
            return {"error": f"Licensing application {reference} not found."}
        try:
            workflow = self.licensing_service.officer_action(detail["workflow"]["id"], action=action, officer=user, note=note)
        except ValueError as error:
            return {"error": str(error)}
        if not workflow:
            return {"error": f"Licensing application {reference} not found."}
        if self._current_thread_id:
            self._log_action(self._current_thread_id, action.upper(), "workflow.applications", workflow.id)
        return {
            "applicationNumber": workflow.application_number,
            "status": workflow.current_status_code,
            "stage": workflow.current_stage_code,
        }

    def _tool_get_staff_queue_summary(self) -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        complaints, _ = self.complaint_service.list_complaints(
            role="admin" if role == "admin" else "officer",
            user=user,
            status=None,
            operator=None,
            date_from=None,
            date_to=None,
            page=1,
            page_size=100,
        ) if role in {"officer", "admin"} else ([], 0)
        licensing = self.licensing_service.list_applications(
            user=user,
            role="admin" if role == "admin" else "officer",
            status=None,
            query=None,
            page=1,
            page_size=100,
        ) if role in {"officer", "admin"} else {"data": []}
        type_approval = self.type_approval_service.queue(
            user=user,
            role=role,
            query=None,
            page=1,
            page_size=100,
        ) if role in {"type_approver", "admin"} else {"data": []}
        complaint_queue_statuses = {"NEW", "ASSIGNED", "IN_PROGRESS", "PENDING", "REMANDED"}
        return {
            "complaints": len([item for item in complaints if item.current_status_code in complaint_queue_statuses]),
            "licensing": len([item for item in licensing["data"] if item["status"] not in {"APPROVED", "REJECTED"}]),
            "typeApproval": len(type_approval["data"]),
        }

    def _tool_search_type_approvals(self, query: str) -> dict[str, Any]:
        return self.type_approval_service.search_public(query, 0, 5)

    def _tool_list_type_approval_applications(self, query: str = "") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        if role in {"type_approver", "admin"}:
            return self.type_approval_service.queue(user=user, role=role, query=query or None, page=1, page_size=10)
        return self.type_approval_service.list_applications(user=user, role=role, status=None, query=query or None, page=1, page_size=10)

    def _tool_get_type_approval_application(self, reference: str) -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        detail = self.type_approval_service.detail(reference, user=user, role=role)
        return detail or {"found": False, "reference": reference}

    def _tool_act_on_type_approval(self, reference: str, action: str, note: str = "") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        if role not in {"type_approver", "admin"} or not user:
            return {"error": "Type approver or admin role required."}
        try:
            workflow = self.type_approval_service.officer_action(reference, action=action, officer=user, note=note)
        except (PermissionError, ValueError) as error:
            return {"error": str(error)}
        if not workflow:
            return {"error": f"Type approval application {reference} not found."}
        if self._current_thread_id:
            self._log_action(self._current_thread_id, action.upper(), "workflow.applications", workflow.id)
        return {
            "applicationNumber": workflow.application_number,
            "status": workflow.current_status_code,
            "stage": workflow.current_stage_code,
        }

    def _tool_add_type_approval_comment(self, reference: str, body: str, visibility: str = "INTERNAL") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        if not user:
            return {"error": "Authentication required."}
        try:
            payload = self.type_approval_service.add_comment(reference, user=user, role=role, body=body, visibility=visibility)
        except (PermissionError, ValueError) as error:
            return {"error": str(error)}
        if not payload:
            return {"error": f"Type approval application {reference} not found."}
        if self._current_thread_id:
            self._log_action(self._current_thread_id, "COMMENT", "workflow.application_comments", payload["id"])
        return payload

    def _tool_review_type_approval_document(self, reference: str, document_id: str, review_status: str, note: str = "") -> dict[str, Any]:
        role = self._role_for_current_user()
        user = self._current_user
        if role not in {"type_approver", "admin"} or not user:
            return {"error": "Type approver or admin role required."}
        try:
            payload = self.type_approval_service.review_document(
                reference,
                document_id=document_id,
                reviewer=user,
                role=role,
                review_status=review_status,
                note=note,
            )
        except (PermissionError, ValueError) as error:
            return {"error": str(error)}
        if not payload:
            return {"error": f"Type approval document {document_id} not found."}
        if self._current_thread_id:
            self._log_action(self._current_thread_id, review_status, "workflow.application_documents", document_id)
        return payload

    def _tool_search_certificates(self, query: str) -> dict[str, Any]:
        result = self.search_service.search(query, "certificate")
        return {"results": [certificate.certificate_number for certificate in result["certificates"]]}

    def _tool_get_qos_by_location(self, location: str) -> dict[str, Any]:
        all_locations = self.qos_service.locations().get("locations", [])
        matched = next(
            (loc for loc in all_locations if location.lower() in loc.get("name", "").lower()),
            None,
        )
        summary = self.qos_service.summary()
        summary["queriedLocation"] = matched["name"] if matched else location
        return summary

    def _tool_get_application_status(self) -> dict[str, Any]:
        user = self._current_user
        role = self._role_for_current_user()
        return self.licensing_service.dashboard_data(user=user, role=role)

    def _tool_list_due_invoices(self) -> dict[str, Any]:
        user = self._current_user
        role = self._role_for_current_user()
        invoices = self.billing_service.list_invoices(user, role)
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
        user = self._current_user
        now = datetime.now(timezone.utc)
        if module == "licensing":
            result = self.licensing_service.create_application(
                {
                    "category": "telecommunications",
                    "licenceType": licence_type,
                    "applicantName": f"{user.first_name} {user.last_name}".strip() if user else "ADK User",
                    "applicantEmail": user.email if user else "agent@bocra.demo",
                    "coverageArea": "Nationwide",
                    "formData": {},
                },
                user,
            )
            return {"application_number": result["workflow"].application_number}
        if module == "type_approval":
            workflow = WorkflowApplication(
                application_number=f"APP-{now.year}-{uuid4().hex[:6].upper()}",
                application_type_code="TYPE_APPROVAL",
                service_module_code="TYPE_APPROVAL",
                applicant_user_id=user.id if user else None,
                title=f"Type Approval — {licence_type}",
                description="Type approval draft created via BOCRA Copilot.",
                current_status_code="DRAFT",
                current_stage_code="INITIATED",
                submitted_at=now,
                expected_decision_at=now + timedelta(days=14),
            )
            self.workflow_repo.create_application(workflow)
            return {"application_number": workflow.application_number, "note": "Draft created. Complete device details in the portal."}
        return {"status": "unsupported", "supported_modules": ["licensing", "type_approval"]}
