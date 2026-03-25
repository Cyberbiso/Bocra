# Live Schema To Backend Mapping

Generated on `2026-03-25` after comparing the live Supabase schema snapshot with the current FastAPI backend.

Related references:
- `backend/sql/004_live_supabase_app_schema.sql`
- `docs/live_supabase_schema_overview.md`

## Covered By Current SQLAlchemy Models

Core platform:
- `iam.organizations`
- `iam.users`
- `iam.roles`
- `iam.permissions`
- `iam.role_permissions`
- `iam.user_roles`
- `iam.sessions`

Workflow:
- `workflow.applications`
- `workflow.events`
- `workflow.application_status_history`
- `workflow.application_tasks`
- `workflow.application_documents`

Complaints:
- `complaints.categories`
- `complaints.complaints`
- `complaints.messages`
- `complaints.attachments`

Licensing:
- `licensing.records`
- `licensing.applications`

Device and type approval:
- `device.accreditations`
- `device.catalog`
- `device.type_approval_applications`
- `device.type_approval_records`
- `device.verification_items`
- `device.device_verification_batches`
- `device.device_verification_certificates`

Billing and docs:
- `billing.invoices`
- `billing.invoice_items`
- `billing.payments`
- `billing.receipts`
- `docs.certificates`
- `docs.files`

Knowledge, agent, notify, audit:
- `knowledge.documents`
- `knowledge.document_chunks`
- `notify.notifications`
- `agent.threads`
- `agent.messages`
- `agent.tool_calls`
- `agent.actions`
- `audit.audit_logs`

Other already modeled:
- `iam.external_systems`
- `cirt.incident_reports`

## Covered By Current Controllers Or Services

Type approval endpoints now backed by real workflow review data:
- `GET /api/type-approval`
- `GET /api/type-approval/applications`
- `GET /api/type-approval/applications/{reference}`
- `GET /api/type-approval/queue`
- `POST /api/type-approval/applications`
- `POST /api/type-approval/applications/{application_id}/action`

Type approval service now uses:
- `workflow.application_status_history`
- `workflow.application_tasks`
- `billing.invoices`
- `billing.invoice_items`
- `docs.certificates`
- `audit.audit_logs`

Agent support added for:
- reading the type approval review queue
- opening type approval application details
- officer review actions from chat

## Partially Covered

These exist in the DB and are now modeled or close to modeled, but are not yet fully surfaced through the API or UI:
- `device.device_verification_batches`
- `device.device_verification_certificates`
- `workflow.application_documents`
- `docs.files`
- `billing.invoice_items`
- `audit.audit_logs`

## Still In Live DB But Not Yet Mapped Into The Main Backend Flow

Workflow and notifications:
- `workflow.application_parties`
- `workflow.application_comments`
- `workflow.status_catalog`
- `notify.notification_deliveries`
- `notify.notification_events`
- `notify.notification_preferences`
- `notify.notification_templates`
- `agent.agent_profiles`

Complaints extensions:
- `complaints.complaint_assignments`
- `complaints.complaint_sla_events`
- `complaints.complaint_status_history`

Licensing extensions:
- `licensing.frequency_assignments`
- `licensing.licence_documents`
- `licensing.licence_renewal_alerts`
- `licensing.licence_status_history`
- `licensing.licence_types`
- `licensing.public_register_entries`
- `licensing.radio_equipments`

Device extensions:
- `device.accreditation_status_history`
- `device.exemption_applications`

Other product domains not yet wired into this backend flow:
- `cyber.*`
- `domain.*`
- `integration.*`
- `qos.*`
- `tariffs.*`

## High-Value Next Steps

1. Add `workflow.application_comments` and `workflow.application_parties` to the ORM and type approval detail endpoint.
2. Move type approval document uploads from generic `form_data` into `docs.files` plus `workflow.application_documents`.
3. Add applicant-side remediation flow for remanded applications using `workflow.application_tasks`.
4. Expose `audit.audit_logs` to admin review tooling.
5. Decide whether to introduce a dedicated `type_approver` role or keep using `officer` plus more granular permissions.
