-- Core BOCRA platform schema bootstrap for PostgreSQL.
-- Run this first on a fresh database before the extension scripts.

create extension if not exists pgcrypto;

create schema if not exists iam;
create schema if not exists workflow;
create schema if not exists complaints;
create schema if not exists licensing;
create schema if not exists device;
create schema if not exists billing;
create schema if not exists docs;
create schema if not exists knowledge;
create schema if not exists agent;
create schema if not exists notify;

create table if not exists iam.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  org_type_code text not null default 'PRIVATE_COMPANY',
  registration_number text unique,
  tax_number text,
  status_code text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists iam.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  auth_provider text not null default 'local',
  first_name text not null,
  last_name text not null,
  phone_e164 text,
  national_id text,
  passport_number text,
  status_code text not null default 'ACTIVE',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists iam.roles (
  id uuid primary key default gen_random_uuid(),
  role_code text not null unique,
  name text not null,
  scope_code text not null default 'GLOBAL'
);

create table if not exists iam.permissions (
  id uuid primary key default gen_random_uuid(),
  permission_code text not null unique,
  name text not null,
  module_code text not null
);

create table if not exists iam.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references iam.roles(id) on delete cascade,
  permission_id uuid not null references iam.permissions(id) on delete cascade
);

create table if not exists iam.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(id) on delete cascade,
  role_id uuid not null references iam.roles(id) on delete cascade,
  organization_id uuid references iam.organizations(id) on delete set null,
  effective_from timestamptz not null default now(),
  effective_to timestamptz
);

create table if not exists iam.sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  user_id uuid not null references iam.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists workflow.applications (
  id uuid primary key default gen_random_uuid(),
  application_number text not null unique,
  application_type_code text not null,
  service_module_code text not null,
  applicant_user_id uuid references iam.users(id) on delete set null,
  applicant_org_id uuid references iam.organizations(id) on delete set null,
  title text not null,
  description text,
  current_status_code text not null,
  current_stage_code text,
  public_tracker_token text unique,
  submitted_at timestamptz,
  expected_decision_at timestamptz,
  due_at timestamptz,
  priority_code text not null default 'NORMAL',
  source_channel text not null default 'PORTAL',
  external_system_code text,
  external_record_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow.events (
  id uuid primary key default gen_random_uuid(),
  resource_kind text not null,
  resource_id text not null,
  event_type_code text not null,
  label text not null,
  actor_name text not null,
  actor_role text not null,
  is_visible_to_applicant boolean not null default true,
  comment text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists complaints.categories (
  id uuid primary key default gen_random_uuid(),
  category_code text not null unique,
  name text not null,
  sector_code text not null default 'COMMUNICATIONS',
  default_sla_hours integer not null default 168
);

create table if not exists complaints.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_number text not null unique,
  application_id uuid references workflow.applications(id) on delete set null,
  complainant_user_id uuid references iam.users(id) on delete set null,
  complainant_org_id uuid references iam.organizations(id) on delete set null,
  subject text not null,
  complaint_type_code text not null,
  service_provider_name text,
  operator_code text,
  location_text text,
  provider_contacted_first boolean not null default false,
  narrative text not null,
  current_status_code text not null default 'NEW',
  assigned_to_user_id uuid references iam.users(id) on delete set null,
  sla_due_at timestamptz,
  expected_resolution_at timestamptz,
  resolved_at timestamptz,
  resolution_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists complaints.messages (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints.complaints(id) on delete cascade,
  author_user_id uuid references iam.users(id) on delete set null,
  author_name text not null,
  author_role text not null,
  visibility_code text not null default 'PUBLIC',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists complaints.attachments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints.complaints(id) on delete cascade,
  file_name text not null,
  content_type text not null,
  size_bytes integer not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists licensing.records (
  id uuid primary key default gen_random_uuid(),
  workflow_application_id uuid references workflow.applications(id) on delete set null,
  licence_number text not null unique,
  licence_type text not null,
  category text not null,
  sub_category text,
  status_code text not null,
  issue_date date not null,
  expiry_date date not null,
  holder_name text not null,
  holder_address text,
  coverage_area text,
  frequency_band text,
  assigned_officer_name text,
  assigned_officer_dept text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists licensing.applications (
  id uuid primary key default gen_random_uuid(),
  workflow_application_id uuid not null references workflow.applications(id) on delete cascade,
  category_code text not null,
  licence_type_name text not null,
  applicant_name text not null,
  applicant_email text not null,
  coverage_area text,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device.accreditations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references iam.organizations(id) on delete set null,
  user_id uuid references iam.users(id) on delete set null,
  accreditation_type_code text not null,
  reference_number text,
  status_code text not null,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device.catalog (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  marketing_name text not null,
  model_name text not null,
  device_type text not null default 'Smartphone',
  is_sim_enabled boolean not null default true,
  technical_spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device.type_approval_applications (
  id uuid primary key default gen_random_uuid(),
  workflow_application_id uuid not null references workflow.applications(id) on delete cascade,
  device_model_id uuid not null references device.catalog(id) on delete cascade,
  accreditation_id uuid references device.accreditations(id) on delete set null,
  sample_imei text,
  country_of_manufacture text,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device.type_approval_records (
  id uuid primary key default gen_random_uuid(),
  device_model_id uuid not null references device.catalog(id) on delete cascade,
  certificate_id text,
  application_id uuid references device.type_approval_applications(id) on delete set null,
  status_code text not null,
  approval_date date,
  applicant_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device.verification_items (
  id uuid primary key default gen_random_uuid(),
  imei text not null,
  serial_number text,
  device_model_id uuid references device.catalog(id) on delete set null,
  verification_source text not null default 'BOCRA',
  verification_status_code text not null,
  remarks text,
  response_payload jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists docs.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  certificate_type text not null,
  holder_name text not null,
  device_name text,
  issue_date date not null,
  expiry_date date not null,
  status_code text not null,
  qr_token text not null unique,
  application_id text,
  owner_user_id uuid references iam.users(id) on delete set null,
  issued_by text not null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists billing.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  application_id text,
  payer_org_id uuid references iam.organizations(id) on delete set null,
  owner_user_id uuid references iam.users(id) on delete set null,
  description text not null,
  service_name text not null,
  currency_code text not null default 'BWP',
  subtotal_amount numeric(12, 2) not null,
  vat_amount numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  due_date date not null,
  status_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists billing.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing.invoices(id) on delete cascade,
  gateway_code text not null,
  gateway_reference text not null,
  amount_paid numeric(12, 2) not null,
  status_code text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists billing.receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references billing.payments(id) on delete cascade,
  receipt_number text not null unique,
  file_path text,
  issued_at timestamptz not null default now()
);

create table if not exists knowledge.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  document_type_code text not null,
  source_url text,
  file_path text,
  published_at timestamptz,
  status_code text not null default 'PUBLISHED',
  excerpt text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists knowledge.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge.documents(id) on delete cascade,
  chunk_index integer not null,
  source_url text,
  page_number integer,
  content text not null,
  token_count integer,
  embedding jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notify.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references iam.users(id) on delete set null,
  channel_code text not null,
  title text not null,
  body text not null,
  status_code text not null default 'PENDING',
  sent_at timestamptz,
  source_table text,
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent.threads (
  id uuid primary key default gen_random_uuid(),
  external_thread_id text not null unique,
  user_id uuid references iam.users(id) on delete set null,
  organization_id uuid references iam.organizations(id) on delete set null,
  context_scope_code text not null default 'PUBLIC',
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references agent.threads(id) on delete cascade,
  role_code text not null,
  content text not null,
  cited_document_ids jsonb not null default '[]'::jsonb,
  tool_invocations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent.tool_calls (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references agent.threads(id) on delete cascade,
  tool_name text not null,
  request_json jsonb not null default '{}'::jsonb,
  response_json jsonb not null default '{}'::jsonb,
  result_status_code text not null default 'SUCCESS',
  created_at timestamptz not null default now()
);

create table if not exists agent.actions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references agent.threads(id) on delete cascade,
  action_type_code text not null,
  target_table text not null,
  target_id text,
  confirmation_state text not null default 'EXECUTED',
  created_at timestamptz not null default now()
);

create index if not exists idx_iam_sessions_token
  on iam.sessions (token);

create index if not exists idx_workflow_events_resource_id
  on workflow.events (resource_id);

create index if not exists idx_device_verification_items_imei
  on device.verification_items (imei);

create unique index if not exists uq_knowledge_document_chunks_document_chunk
  on knowledge.document_chunks (document_id, chunk_index);
