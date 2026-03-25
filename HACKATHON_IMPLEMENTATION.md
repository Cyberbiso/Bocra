# BOCRA Hackathon — Backend Implementation Rundown

> Branch: `hackathon/backend-implementation`
> Date: 2026-03-25

---

## Bug Fixes

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `repositories/bocra.py` | `list_licence_records()` returned all records for all users — security leak | Joined through `WorkflowApplication` to filter by `applicant_user_id` |
| 2 | `integrations/qos.py` | `get_summary()` always returned mock data — duplicate `resolvedDate` key silently overwrote real payload | Removed the duplicate key so real API response flows through |
| 3 | `services/agent.py` | `_generate_response()` never set `_current_user`; ADK errors swallowed silently | Set `_current_user` from session before calling ADK; log errors properly |
| 4 | `services/agent.py` | `_tool_get_qos_by_location()` ignored location name from DB | Now looks up `QosLocation` by name and attaches it to the response |
| 5 | `services/agent.py` | `_tool_get_application_status()` and `_tool_list_due_invoices()` used stale/wrong user context | Both now use `_current_user` + `_role_for_current_user()` |
| 6 | `services/agent.py` | Lazy imports / missing imports (`datetime`, `WorkflowApplication`, `AuthRepository`, `AuthService`) | Added all missing imports at module level |
| 7 | `services/portal.py` | `LicensingService.tracker()` used lazy imports inside method body | Moved to top-level `from sqlalchemy import select` |

---

## New Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/register` | User self-registration (creates user + assigns `applicant` role + session cookie) |
| `GET` | `/api/notifications` | Lists in-app notifications for the authenticated user |
| `PATCH` | `/api/notifications/{id}/read` | Marks a notification as read |
| `POST` | `/api/complaints/{id}/action` | Officer approve / reject / remand / resolve / assign on a complaint |
| `POST` | `/api/type-approval/applications/{id}/action` | Officer approve / reject / remand on a type approval application |
| `POST` | `/api/licence-applications/{id}/action` | Officer approve / reject / remand on a licence application |
| `GET` | `/api/applications/tracker/{reference}` | Public tracker — journey events by application number or tracker token |
| `GET` | `/api/licence-verification` | Public licence verification — tries external BOCRA portal, falls back to local DB |
| `GET` | `/api/cirt/incidents` | List cyber incident reports (authenticated; officers see all, users see own) |
| `POST` | `/api/cirt/incidents` | Submit a cyber incident report (public) |
| `GET` | `/api/cirt/incidents/{reference}` | Get incident by reference number (public) |
| `GET` | `/api/knowledge/documents` | List ingested knowledge base documents (officer/admin only) |
| `POST` | `/api/knowledge/ingest/url` | Fetch a URL, chunk it, store for RAG |
| `POST` | `/api/knowledge/ingest/text` | Chunk raw text and store for RAG |

---

## New Files

| File | What it does |
|------|-------------|
| `controllers/notifications.py` | Notification list + mark-read endpoints |
| `controllers/cirt.py` | CIRT incident reporting (submit, track, list) |
| `controllers/knowledge.py` | Knowledge base ingestion endpoints |
| `services/knowledge.py` | `KnowledgeIngestionService` — HTML stripping, text chunking with overlap, DB persistence |
| `integrations/customer_portal.py` | `CustomerPortalClient` — calls `customerportal.bocra.org.bw` with mock fallback |

---

## Service / Logic Additions

| Where | What was added |
|-------|---------------|
| `services/auth.py` | `AuthService.register()` — full user onboarding flow |
| `services/portal.py` | `ComplaintService.officer_action()` — status transitions + events + notifications |
| `services/portal.py` | `TypeApprovalService.officer_action()` — same pattern; on approve creates a `Certificate` record |
| `services/portal.py` | `LicensingService.officer_action()` — same pattern; on approve creates a `LicenseRecord` |
| `services/portal.py` | `LicensingService.tracker()` — public application journey tracker |
| `services/portal.py` | `LicensingService.create_application()` — now sets `public_tracker_token` on creation |
| `services/portal.py` | `PublicService.statistics()` — now queries real DB counts for resolved complaints + active licences |
| `services/agent.py` | `_role_for_current_user()` helper; `_tool_create_application_draft()` now handles `type_approval` module |
| `repositories/bocra.py` | `NotificationRepository.get()`, `mark_read()`, `get_document_by_source()`, `create_document()`, `create_chunk()`, `delete_chunks_for_document()` |

---

## Models

| Where | What was added |
|-------|---------------|
| `models/entities.py` | `CyberIncidentReport` ORM model (`cirt` schema) |
| `models/schemas.py` | `RegisterRequest` Pydantic model |
| `core/database.py` | `"cirt"` added to schema creation list |
| `config.py` | `customer_portal_url` setting |

---

## Presenters Fixed

| Function | Was | Now |
|----------|-----|-----|
| `present_accreditation()` | `return data` | Returns typed shape with `isValid: bool` |
| `present_type_approval_search()` | `return data` | Returns explicit `{total, pages, currentPage, content}` with defaults |
| `present_verification_result()` | `return data` | Returns full shape with `verified: bool` and null-safe fields |
