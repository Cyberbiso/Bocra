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


def search_type_approvals(query: str) -> dict[str, Any]:
    return registry.handlers["search_type_approvals"](query)


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
