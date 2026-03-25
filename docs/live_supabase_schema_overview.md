# Live Supabase Schema Overview

Generated on `2026-03-25` from the live Supabase Postgres database.

Full SQL snapshot:
- `backend/sql/004_live_supabase_app_schema.sql`

Purpose:
- keep the live database shape close to the codebase for agent and backend work
- make it easier to reason about what already exists in Supabase before adding new models or migrations

## Snapshot Scope

Dumped into the repo:
- `agent`
- `audit`
- `billing`
- `cirt`
- `complaints`
- `cyber`
- `device`
- `docs`
- `domain`
- `iam`
- `integration`
- `knowledge`
- `licensing`
- `notify`
- `qos`
- `tariffs`
- `workflow`

Live in Supabase but not included in the repo SQL snapshot because they are mostly platform-managed:
- `auth`
- `public`
- `realtime`
- `storage`
- `vault`

## Live Schema Counts

| Schema | Tables |
| --- | ---: |
| `agent` | 5 |
| `audit` | 1 |
| `auth` | 23 |
| `billing` | 4 |
| `cirt` | 1 |
| `complaints` | 7 |
| `cyber` | 4 |
| `device` | 9 |
| `docs` | 4 |
| `domain` | 4 |
| `iam` | 8 |
| `integration` | 3 |
| `knowledge` | 5 |
| `licensing` | 9 |
| `notify` | 5 |
| `public` | 1 |
| `qos` | 6 |
| `realtime` | 3 |
| `storage` | 8 |
| `tariffs` | 2 |
| `vault` | 1 |
| `workflow` | 8 |

## High-Signal Tables For The Agent

Type approval and device work:
- `device.type_approval_applications`
- `device.type_approval_records`
- `device.exemption_applications`
- `device.device_verification_batches`
- `device.device_verification_certificates`
- `device.verification_items`

Workflow and review orchestration:
- `workflow.applications`
- `workflow.events`
- `workflow.application_status_history`
- `workflow.application_tasks`
- `workflow.application_documents`
- `workflow.application_comments`
- `workflow.application_parties`
- `workflow.status_catalog`

Documents and billing:
- `docs.certificates`
- `docs.files`
- `docs.document_templates`
- `billing.invoices`
- `billing.invoice_items`
- `billing.payments`
- `billing.receipts`

Agent and auditability:
- `agent.threads`
- `agent.messages`
- `agent.tool_calls`
- `agent.actions`
- `agent.agent_profiles`
- `audit.audit_logs`

## Delta Vs Local SQL

Your local SQL already covers the BOCRA core fairly well. The live database adds these app-facing tables that are not in `000_core_platform_schema.sql` plus `003_supabase_catch_up.sql`:

- `audit.audit_logs`
- `cirt.incident_reports`
- `cyber.advisories`
- `cyber.incident_attachments`
- `cyber.incident_updates`
- `cyber.incidents`
- `domain.domain_zones`
- `domain.referral_requests`
- `domain.registrars`
- `domain.whois_snapshots`
- `iam.external_systems`
- `integration.external_records`
- `integration.external_systems`
- `integration.sync_jobs`
- `qos.ingest_runs`
- `qos.location_ancestors`
- `qos.locations`
- `qos.metric_definitions`
- `qos.observations`
- `qos.operators`
- `tariffs.plans`
- `tariffs.price_items`

## What This Means For The Current Backend

The live DB already has workflow support beyond the current Python models and controllers:
- richer workflow review tables
- richer device verification tables
- external integration tracking
- audit logging
- QoS and tariff domains

That means the backend can be expanded toward a stronger role-aware agent without inventing every table from scratch.

## Useful Anchors In The SQL Snapshot

- `agent.agent_profiles`
- `billing.invoice_items`
- `device.device_verification_batches`
- `device.device_verification_certificates`
- `device.exemption_applications`
- `device.type_approval_applications`
- `device.type_approval_records`
- `docs.files`
- `workflow.application_documents`
- `workflow.application_status_history`
- `workflow.application_tasks`

