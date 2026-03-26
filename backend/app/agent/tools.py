from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ToolRegistry:
    handlers: dict[str, Any]


registry = ToolRegistry(handlers={})


def configure_tool_registry(handlers: dict[str, Any]) -> None:
    registry.handlers = handlers


def search_knowledge(query: str) -> dict[str, Any]:
    return registry.handlers["search_knowledge"](query)


def search_licences(query: str) -> dict[str, Any]:
    return registry.handlers["search_licences"](query)


def list_complaints(query: str = "") -> dict[str, Any]:
    return registry.handlers["list_complaints"](query)


def get_complaint_case(reference: str) -> dict[str, Any]:
    return registry.handlers["get_complaint_case"](reference)


def act_on_complaint_case(reference: str, action: str, note: str = "") -> dict[str, Any]:
    return registry.handlers["act_on_complaint_case"](reference, action, note)


def list_licence_applications(query: str = "") -> dict[str, Any]:
    return registry.handlers["list_licence_applications"](query)


def get_licence_application(reference: str) -> dict[str, Any]:
    return registry.handlers["get_licence_application"](reference)


def act_on_licence_application(reference: str, action: str, note: str = "") -> dict[str, Any]:
    return registry.handlers["act_on_licence_application"](reference, action, note)


def get_staff_queue_summary(_: str = "") -> dict[str, Any]:
    return registry.handlers["get_staff_queue_summary"]()


def search_type_approvals(query: str) -> dict[str, Any]:
    return registry.handlers["search_type_approvals"](query)


def list_type_approval_applications(query: str = "") -> dict[str, Any]:
    return registry.handlers["list_type_approval_applications"](query)


def get_type_approval_application(reference: str) -> dict[str, Any]:
    return registry.handlers["get_type_approval_application"](reference)


def act_on_type_approval(reference: str, action: str, note: str = "") -> dict[str, Any]:
    return registry.handlers["act_on_type_approval"](reference, action, note)


def add_type_approval_comment(reference: str, body: str, visibility: str = "INTERNAL") -> dict[str, Any]:
    return registry.handlers["add_type_approval_comment"](reference, body, visibility)


def review_type_approval_document(reference: str, document_id: str, review_status: str, note: str = "") -> dict[str, Any]:
    return registry.handlers["review_type_approval_document"](reference, document_id, review_status, note)


def search_certificates(query: str) -> dict[str, Any]:
    return registry.handlers["search_certificates"](query)


def get_qos_by_location(location: str) -> dict[str, Any]:
    return registry.handlers["get_qos_by_location"](location)


def get_application_status(_: str = "") -> dict[str, Any]:
    return registry.handlers["get_application_status"]()


def list_due_invoices(_: str = "") -> dict[str, Any]:
    return registry.handlers["list_due_invoices"]()


def create_complaint_draft(subject: str, description: str, operator: str) -> dict[str, Any]:
    return registry.handlers["create_complaint_draft"](subject, description, operator)


def create_application_draft(module: str, licence_type: str) -> dict[str, Any]:
    return registry.handlers["create_application_draft"](module, licence_type)
