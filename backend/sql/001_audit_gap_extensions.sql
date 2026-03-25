-- BOCRA portal extension migration
-- Run this after `backend/sql/000_core_platform_schema.sql`.

create extension if not exists pgcrypto;
create extension if not exists postgis;

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
create schema if not exists qos;
create schema if not exists domain;
create schema if not exists integration;
create schema if not exists audit;
create schema if not exists cyber;
create schema if not exists tariffs;

create table if not exists docs.files (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  checksum_sha256 text,
  uploaded_by_user_id uuid references iam.users(id),
  source_module_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists docs.document_templates (
  id uuid primary key default gen_random_uuid(),
  template_code text not null unique,
  name text not null,
  service_module_code text not null,
  active_version integer not null default 1,
  subject_template text,
  body_template text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docs.certificate_links (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references docs.certificates(id) on delete cascade,
  application_id uuid references workflow.applications(id) on delete set null,
  licence_id uuid references licensing.records(id) on delete set null,
  type_approval_record_id uuid references device.type_approval_records(id) on delete set null,
  device_verification_batch_id uuid,
  created_at timestamptz not null default now(),
  unique (certificate_id, application_id, licence_id, type_approval_record_id)
);

create table if not exists iam.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references iam.organizations(id) on delete cascade,
  user_id uuid not null references iam.users(id) on delete cascade,
  membership_role_code text not null default 'MEMBER',
  status_code text not null default 'ACTIVE',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists qos.operators (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references iam.organizations(id) on delete set null,
  operator_code text not null unique,
  name text not null,
  sector_code text not null default 'TELECOM',
  brand_color text,
  logo_url text,
  website_url text,
  status_code text not null default 'ACTIVE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists qos.locations (
  id uuid primary key default gen_random_uuid(),
  external_location_id text unique,
  name text not null,
  level integer not null,
  parent_id uuid references qos.locations(id) on delete set null,
  geom geometry(MultiPolygon, 4326),
  centroid geometry(Point, 4326),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists qos.location_ancestors (
  location_id uuid not null references qos.locations(id) on delete cascade,
  ancestor_location_id uuid not null references qos.locations(id) on delete cascade,
  ancestor_level integer not null,
  created_at timestamptz not null default now(),
  primary key (location_id, ancestor_location_id)
);

create table if not exists qos.metric_definitions (
  metric_code text primary key,
  name text not null,
  service_code text,
  network_code text,
  unit text not null,
  direction_code text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists qos.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_code text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status_code text not null default 'RUNNING',
  row_count integer,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists qos.observations (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references qos.operators(id) on delete cascade,
  location_id uuid not null references qos.locations(id) on delete cascade,
  metric_code text not null references qos.metric_definitions(metric_code),
  observed_on date not null,
  vendor_name text,
  value_numeric numeric(14, 4) not null,
  raw_payload jsonb not null default '{}'::jsonb,
  ingest_run_id uuid references qos.ingest_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (operator_id, location_id, metric_code, observed_on, vendor_name)
);

create table if not exists domain.registrars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status_code text not null default 'ACTIVE',
  website_url text,
  email text,
  phone text,
  accredited_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table if not exists domain.domain_zones (
  zone_code text primary key,
  display_name text not null,
  description text,
  status_code text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists domain.referral_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references iam.users(id) on delete set null,
  requested_domain text not null,
  zone_code text references domain.domain_zones(zone_code) on delete set null,
  registrar_id uuid references domain.registrars(id) on delete set null,
  status_code text not null default 'NEW',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists domain.whois_snapshots (
  id uuid primary key default gen_random_uuid(),
  domain_name text not null,
  snapshot_json jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create table if not exists integration.external_systems (
  id uuid primary key default gen_random_uuid(),
  system_code text not null unique,
  name text not null,
  base_url text,
  auth_type_code text not null default 'NONE',
  status_code text not null default 'ACTIVE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists integration.external_records (
  id uuid primary key default gen_random_uuid(),
  external_system_id uuid not null references integration.external_systems(id) on delete cascade,
  external_record_id text not null,
  local_table_name text not null,
  local_record_id text not null,
  payload_json jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (external_system_id, external_record_id, local_table_name, local_record_id)
);

create table if not exists integration.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  external_system_id uuid not null references integration.external_systems(id) on delete cascade,
  job_type_code text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status_code text not null default 'RUNNING',
  notes text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references iam.users(id) on delete set null,
  action_code text not null,
  entity_table text not null,
  entity_id text not null,
  before_json jsonb,
  after_json jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists knowledge.document_tags (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge.documents(id) on delete cascade,
  tag_code text not null,
  created_at timestamptz not null default now(),
  unique (document_id, tag_code)
);

create table if not exists knowledge.consultations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references knowledge.documents(id) on delete set null,
  title text not null,
  summary text,
  status_code text not null default 'DRAFT',
  owner_user_id uuid references iam.users(id) on delete set null,
  opens_at timestamptz,
  closes_at timestamptz,
  published_at timestamptz,
  submission_instructions text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists knowledge.consultation_submissions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references knowledge.consultations(id) on delete cascade,
  submitted_by_user_id uuid references iam.users(id) on delete set null,
  submitted_by_org_id uuid references iam.organizations(id) on delete set null,
  submitter_name text not null,
  submitter_email text,
  body text not null,
  attachment_file_id uuid references docs.files(id) on delete set null,
  status_code text not null default 'RECEIVED',
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists agent.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  agent_code text not null unique,
  name text not null,
  default_prompt text not null,
  model_code text not null,
  status_code text not null default 'ACTIVE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notify.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_code text not null,
  source_table text not null,
  source_id text not null,
  recipient_user_id uuid references iam.users(id) on delete set null,
  payload_json jsonb not null default '{}'::jsonb,
  triggered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists notify.notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_code text not null unique,
  channel_code text not null,
  service_module_code text not null,
  subject_template text,
  body_template text not null,
  locale_code text not null default 'en-BW',
  status_code text not null default 'ACTIVE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notify.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references iam.users(id) on delete cascade,
  event_code text not null,
  channel_code text not null,
  is_enabled boolean not null default true,
  quiet_hours_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_code, channel_code)
);

create table if not exists notify.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references notify.notifications(id) on delete cascade,
  provider_code text not null,
  provider_reference text,
  delivery_status_code text not null default 'PENDING',
  delivered_at timestamptz,
  failed_at timestamptz,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists workflow.status_catalog (
  id uuid primary key default gen_random_uuid(),
  domain_code text not null,
  status_code text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_terminal boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (domain_code, status_code)
);

create table if not exists workflow.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references workflow.applications(id) on delete cascade,
  from_status_code text,
  to_status_code text not null,
  changed_by_user_id uuid references iam.users(id) on delete set null,
  comment text,
  changed_at timestamptz not null default now()
);

create table if not exists workflow.application_tasks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references workflow.applications(id) on delete cascade,
  task_type_code text not null,
  title text not null,
  assigned_to_user_id uuid references iam.users(id) on delete set null,
  task_status_code text not null default 'OPEN',
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow.application_comments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references workflow.applications(id) on delete cascade,
  author_user_id uuid references iam.users(id) on delete set null,
  visibility_code text not null default 'INTERNAL',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists workflow.application_parties (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references workflow.applications(id) on delete cascade,
  party_type_code text not null,
  organization_id uuid references iam.organizations(id) on delete set null,
  contact_user_id uuid references iam.users(id) on delete set null,
  display_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists workflow.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references workflow.applications(id) on delete cascade,
  file_id uuid not null references docs.files(id) on delete cascade,
  document_type_code text not null,
  is_required boolean not null default false,
  review_status_code text not null default 'PENDING',
  uploaded_by_user_id uuid references iam.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (application_id, file_id)
);

create table if not exists licensing.licence_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sector_code text not null,
  category_code text not null,
  description text,
  application_fee numeric(12, 2),
  renewal_fee numeric(12, 2),
  processing_target_days integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists licensing.licence_status_history (
  id uuid primary key default gen_random_uuid(),
  licence_id uuid not null references licensing.records(id) on delete cascade,
  from_status_code text,
  to_status_code text not null,
  changed_by_user_id uuid references iam.users(id) on delete set null,
  comment text,
  changed_at timestamptz not null default now()
);

create table if not exists licensing.licence_renewal_alerts (
  id uuid primary key default gen_random_uuid(),
  licence_id uuid not null references licensing.records(id) on delete cascade,
  alert_type_code text not null,
  trigger_at timestamptz not null,
  display_until timestamptz,
  acknowledged_at timestamptz,
  notification_id uuid references notify.notifications(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists licensing.radio_equipments (
  id uuid primary key default gen_random_uuid(),
  licence_id uuid references licensing.records(id) on delete set null,
  licensee_org_id uuid references iam.organizations(id) on delete set null,
  equipment_type text not null,
  make text,
  model text,
  serial_number text,
  status_code text not null default 'ACTIVE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists licensing.frequency_assignments (
  id uuid primary key default gen_random_uuid(),
  licence_id uuid not null references licensing.records(id) on delete cascade,
  frequency_start_mhz numeric(12, 3) not null,
  frequency_end_mhz numeric(12, 3) not null,
  bandwidth_khz numeric(12, 3),
  location_text text,
  status_code text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists licensing.licence_documents (
  id uuid primary key default gen_random_uuid(),
  licence_id uuid not null references licensing.records(id) on delete cascade,
  file_id uuid not null references docs.files(id) on delete cascade,
  document_type_code text not null,
  created_at timestamptz not null default now(),
  unique (licence_id, file_id)
);

create table if not exists licensing.public_register_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references iam.organizations(id) on delete set null,
  licence_record_id uuid references licensing.records(id) on delete set null,
  service_sector_code text not null,
  service_name text not null,
  geographic_scope text,
  public_status_code text not null default 'ACTIVE',
  public_notes text,
  published_at timestamptz,
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists billing.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing.invoices(id) on delete cascade,
  line_no integer not null,
  item_code text,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_amount numeric(12, 2) not null,
  line_total_amount numeric(12, 2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (invoice_id, line_no)
);

create table if not exists device.accreditation_status_history (
  id uuid primary key default gen_random_uuid(),
  accreditation_id uuid not null references device.accreditations(id) on delete cascade,
  from_status_code text,
  to_status_code text not null,
  changed_by_user_id uuid references iam.users(id) on delete set null,
  comment text,
  changed_at timestamptz not null default now()
);

create table if not exists device.exemption_applications (
  id uuid primary key default gen_random_uuid(),
  workflow_application_id uuid not null references workflow.applications(id) on delete cascade,
  device_model_id uuid not null references device.catalog(id) on delete cascade,
  customer_accreditation_id uuid references device.accreditations(id) on delete set null,
  manufacturer_accreditation_id uuid references device.accreditations(id) on delete set null,
  reason_text text not null,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device.device_verification_batches (
  id uuid primary key default gen_random_uuid(),
  batch_reference text not null unique,
  applicant_user_id uuid references iam.users(id) on delete set null,
  applicant_org_id uuid references iam.organizations(id) on delete set null,
  device_model_id uuid references device.catalog(id) on delete set null,
  import_period_start date,
  import_period_end date,
  status_code text not null default 'UPLOADED',
  submitted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device.device_verification_certificates (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references device.device_verification_batches(id) on delete cascade,
  certificate_id uuid not null references docs.certificates(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (batch_id, certificate_id)
);

create table if not exists complaints.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints.complaints(id) on delete cascade,
  from_status_code text,
  to_status_code text not null,
  changed_by_user_id uuid references iam.users(id) on delete set null,
  comment text,
  changed_at timestamptz not null default now()
);

create table if not exists complaints.complaint_assignments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints.complaints(id) on delete cascade,
  assigned_to_user_id uuid not null references iam.users(id) on delete cascade,
  assigned_by_user_id uuid references iam.users(id) on delete set null,
  assignment_note text,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz
);

create table if not exists complaints.complaint_sla_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints.complaints(id) on delete cascade,
  sla_stage_code text not null,
  starts_at timestamptz not null,
  due_at timestamptz not null,
  breached_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists cyber.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number text not null unique,
  workflow_application_id uuid references workflow.applications(id) on delete set null,
  reporter_user_id uuid references iam.users(id) on delete set null,
  reporter_org_id uuid references iam.organizations(id) on delete set null,
  reporter_name text not null,
  reporter_email text,
  reporter_phone text,
  subject text not null,
  incident_type_code text not null,
  severity_code text not null default 'MEDIUM',
  current_status_code text not null default 'NEW',
  affected_systems_text text,
  incident_summary text not null,
  occurred_at timestamptz,
  discovered_at timestamptz,
  assigned_to_user_id uuid references iam.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  reported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cyber.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references cyber.incidents(id) on delete cascade,
  author_user_id uuid references iam.users(id) on delete set null,
  visibility_code text not null default 'INTERNAL',
  update_type_code text not null default 'NOTE',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists cyber.incident_attachments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references cyber.incidents(id) on delete cascade,
  file_id uuid not null references docs.files(id) on delete cascade,
  attachment_type_code text not null default 'EVIDENCE',
  uploaded_by_user_id uuid references iam.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (incident_id, file_id)
);

create table if not exists cyber.advisories (
  id uuid primary key default gen_random_uuid(),
  advisory_code text not null unique,
  title text not null,
  summary text,
  severity_code text not null default 'INFO',
  audience_code text not null default 'PUBLIC',
  status_code text not null default 'PUBLISHED',
  source_url text,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tariffs.plans (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references qos.operators(id) on delete cascade,
  plan_code text not null unique,
  plan_name text not null,
  service_code text not null,
  customer_type_code text not null default 'CONSUMER',
  currency_code text not null default 'BWP',
  status_code text not null default 'PUBLISHED',
  valid_from date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tariffs.price_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references tariffs.plans(id) on delete cascade,
  item_code text not null,
  charge_type_code text not null,
  unit_code text,
  included_units numeric(12, 2),
  price_amount numeric(12, 2) not null,
  overage_price_amount numeric(12, 2),
  billing_period_code text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, item_code)
);

alter table workflow.applications
  add column if not exists last_status_changed_at timestamptz;

alter table agent.threads
  add column if not exists agent_profile_id uuid references agent.agent_profiles(id);

alter table notify.notifications
  add column if not exists event_id uuid references notify.notification_events(id);

alter table device.verification_items
  add column if not exists batch_id uuid references device.device_verification_batches(id);

alter table complaints.complaints
  add column if not exists location_id uuid references qos.locations(id);

create index if not exists idx_docs_files_uploaded_by_user_id
  on docs.files (uploaded_by_user_id);

create index if not exists idx_qos_locations_parent_id
  on qos.locations (parent_id);

create index if not exists idx_qos_locations_geom
  on qos.locations using gist (geom);

create index if not exists idx_qos_locations_centroid
  on qos.locations using gist (centroid);

create index if not exists idx_qos_observations_lookup
  on qos.observations (operator_id, location_id, metric_code, observed_on desc);

create index if not exists idx_domain_referral_requests_status
  on domain.referral_requests (status_code, created_at desc);

create index if not exists idx_integration_sync_jobs_system_status
  on integration.sync_jobs (external_system_id, status_code, started_at desc);

create index if not exists idx_audit_logs_entity
  on audit.audit_logs (entity_table, entity_id, created_at desc);

create index if not exists idx_knowledge_consultations_status_window
  on knowledge.consultations (status_code, opens_at, closes_at);

create index if not exists idx_knowledge_consultation_submissions_consultation_id
  on knowledge.consultation_submissions (consultation_id, submitted_at desc);

create index if not exists idx_notify_notification_events_recipient
  on notify.notification_events (recipient_user_id, triggered_at desc);

create index if not exists idx_workflow_application_status_history_application_id
  on workflow.application_status_history (application_id, changed_at desc);

create index if not exists idx_workflow_application_tasks_assigned_to
  on workflow.application_tasks (assigned_to_user_id, task_status_code, due_at);

create index if not exists idx_workflow_application_documents_application_id
  on workflow.application_documents (application_id, review_status_code);

create index if not exists idx_licensing_public_register_entries_sector_status
  on licensing.public_register_entries (service_sector_code, public_status_code, published_at desc);

create index if not exists idx_billing_invoice_items_invoice_id
  on billing.invoice_items (invoice_id, line_no);

create index if not exists idx_device_verification_items_batch_id
  on device.verification_items (batch_id);

create index if not exists idx_complaints_status_history_complaint_id
  on complaints.complaint_status_history (complaint_id, changed_at desc);

create index if not exists idx_complaints_assignments_owner
  on complaints.complaint_assignments (assigned_to_user_id, assigned_at desc);

create index if not exists idx_complaints_sla_events_due_at
  on complaints.complaint_sla_events (due_at, breached_at);

create index if not exists idx_cyber_incidents_status_severity
  on cyber.incidents (current_status_code, severity_code, reported_at desc);

create index if not exists idx_cyber_advisories_published_at
  on cyber.advisories (status_code, published_at desc);

create index if not exists idx_tariffs_plans_operator_service
  on tariffs.plans (operator_id, service_code, customer_type_code);

create index if not exists idx_tariffs_price_items_plan_id
  on tariffs.price_items (plan_id, sort_order);
