-- Supabase catch-up migration for the partially initialized BOCRA database.
-- Safe to run after `000_core_platform_schema.sql` and a partial/failed
-- `001_audit_gap_extensions.sql`.

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

create table if not exists docs.certificate_links (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references docs.certificates(id) on delete cascade,
  application_id uuid references workflow.applications(id) on delete set null,
  licence_id uuid references licensing.records(id) on delete set null,
  type_approval_record_id uuid references device.type_approval_records(id) on delete set null,
  device_verification_batch_id uuid references device.device_verification_batches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (certificate_id, application_id, licence_id, type_approval_record_id)
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

create index if not exists idx_knowledge_consultations_status_window
  on knowledge.consultations (status_code, opens_at, closes_at);

create index if not exists idx_knowledge_consultation_submissions_consultation_id
  on knowledge.consultation_submissions (consultation_id, submitted_at desc);

create index if not exists idx_notify_notification_events_recipient
  on notify.notification_events (recipient_user_id, triggered_at desc);

create index if not exists idx_complaints_status_history_complaint_id
  on complaints.complaint_status_history (complaint_id, changed_at desc);

create index if not exists idx_complaints_assignments_owner
  on complaints.complaint_assignments (assigned_to_user_id, assigned_at desc);

create index if not exists idx_complaints_sla_events_due_at
  on complaints.complaint_sla_events (due_at, breached_at);

insert into complaints.categories (
  id,
  category_code,
  name,
  sector_code,
  default_sla_hours
)
values
  (gen_random_uuid(), 'billing', 'Billing Dispute', 'COMMUNICATIONS', 120),
  (gen_random_uuid(), 'coverage', 'Network Coverage', 'COMMUNICATIONS', 168),
  (gen_random_uuid(), 'service_quality', 'Service Quality', 'COMMUNICATIONS', 168),
  (gen_random_uuid(), 'broadcasting', 'Broadcasting', 'BROADCASTING', 240),
  (gen_random_uuid(), 'postal', 'Postal Services', 'POSTAL', 240),
  (gen_random_uuid(), 'other', 'Other', 'COMMUNICATIONS', 168)
on conflict (category_code) do update
set
  name = excluded.name,
  sector_code = excluded.sector_code,
  default_sla_hours = excluded.default_sla_hours;

insert into workflow.status_catalog (
  domain_code,
  status_code,
  label,
  description,
  sort_order,
  is_terminal,
  is_public
)
values
  ('APPLICATION', 'DRAFT', 'Draft', 'Application is being prepared and not yet submitted.', 10, false, true),
  ('APPLICATION', 'SUBMITTED', 'Submitted', 'Application has been submitted to BOCRA.', 20, false, true),
  ('APPLICATION', 'UNDER_REVIEW', 'Under Review', 'Application is currently under officer review.', 30, false, true),
  ('APPLICATION', 'PENDING_PAYMENT', 'Pending Payment', 'Application is waiting for payment before processing continues.', 40, false, true),
  ('APPLICATION', 'APPROVED', 'Approved', 'Application was approved.', 50, true, true),
  ('APPLICATION', 'REJECTED', 'Rejected', 'Application was rejected.', 60, true, true),
  ('COMPLAINT', 'NEW', 'New', 'Complaint was received and is awaiting triage.', 10, false, true),
  ('COMPLAINT', 'UNDER_REVIEW', 'Under Review', 'Complaint is being assessed by BOCRA.', 20, false, true),
  ('COMPLAINT', 'AWAITING_PROVIDER', 'Awaiting Provider', 'Complaint is awaiting a provider response.', 30, false, true),
  ('COMPLAINT', 'AWAITING_COMPLAINANT', 'Awaiting Complainant', 'Complaint is waiting for more information from the complainant.', 40, false, true),
  ('COMPLAINT', 'RESOLVED', 'Resolved', 'Complaint has been resolved.', 50, true, true),
  ('COMPLAINT', 'CLOSED', 'Closed', 'Complaint is closed.', 60, true, true),
  ('CYBER_INCIDENT', 'NEW', 'New', 'Incident has been reported and is awaiting triage.', 10, false, true),
  ('CYBER_INCIDENT', 'TRIAGED', 'Triaged', 'Incident has been assessed and categorized.', 20, false, true),
  ('CYBER_INCIDENT', 'INVESTIGATING', 'Investigating', 'Incident investigation is in progress.', 30, false, true),
  ('CYBER_INCIDENT', 'AWAITING_REPORTER', 'Awaiting Reporter', 'More information is required from the reporter.', 40, false, true),
  ('CYBER_INCIDENT', 'CONTAINED', 'Contained', 'Immediate impact has been contained.', 50, false, true),
  ('CYBER_INCIDENT', 'CLOSED', 'Closed', 'Incident handling is complete.', 60, true, true),
  ('CONSULTATION', 'DRAFT', 'Draft', 'Consultation is not yet public.', 10, false, false),
  ('CONSULTATION', 'PUBLISHED', 'Published', 'Consultation is open for comment.', 20, false, true),
  ('CONSULTATION', 'CLOSED', 'Closed', 'Consultation window has ended.', 30, true, true),
  ('CONSULTATION', 'ARCHIVED', 'Archived', 'Consultation is retained for historical reference.', 40, true, true),
  ('TARIFF', 'DRAFT', 'Draft', 'Tariff record is still being prepared.', 10, false, false),
  ('TARIFF', 'PUBLISHED', 'Published', 'Tariff record is visible to the public.', 20, false, true),
  ('TARIFF', 'EXPIRED', 'Expired', 'Tariff record is no longer current.', 30, true, true)
on conflict (domain_code, status_code) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_terminal = excluded.is_terminal,
  is_public = excluded.is_public,
  updated_at = now();

insert into qos.operators (
  operator_code,
  name,
  sector_code,
  brand_color,
  website_url,
  status_code
)
values
  ('MASCOM', 'Mascom Wireless', 'TELECOM', '#e53935', 'https://www.mascom.bw', 'ACTIVE'),
  ('ORANGE', 'Orange Botswana', 'TELECOM', '#ff7900', 'https://www.orange.co.bw', 'ACTIVE'),
  ('BTC', 'BTC Broadband', 'TELECOM', '#0b4f9c', 'https://www.btc.bw', 'ACTIVE')
on conflict (operator_code) do update
set
  name = excluded.name,
  sector_code = excluded.sector_code,
  brand_color = excluded.brand_color,
  website_url = excluded.website_url,
  status_code = excluded.status_code,
  updated_at = now();

insert into qos.metric_definitions (
  metric_code,
  name,
  service_code,
  network_code,
  unit,
  direction_code,
  description
)
values
  ('DL_TPUT_Mbps', 'Download Throughput', 'DATA', 'MOBILE', 'Mbps', 'DOWNLINK', 'Observed mobile download throughput.'),
  ('UL_TPUT_Mbps', 'Upload Throughput', 'DATA', 'MOBILE', 'Mbps', 'UPLINK', 'Observed mobile upload throughput.'),
  ('LATENCY_MS', 'Latency', 'DATA', 'MOBILE', 'ms', null, 'Observed end-to-end network latency.'),
  ('VOICE_SETUP_SR_PCT', 'Voice Setup Success Rate', 'VOICE', 'MOBILE', '%', null, 'Percentage of successful voice call setups.'),
  ('DATA_SESSION_SR_PCT', 'Data Session Success Rate', 'DATA', 'MOBILE', '%', null, 'Percentage of successful data session attempts.')
on conflict (metric_code) do update
set
  name = excluded.name,
  service_code = excluded.service_code,
  network_code = excluded.network_code,
  unit = excluded.unit,
  direction_code = excluded.direction_code,
  description = excluded.description;

insert into domain.domain_zones (
  zone_code,
  display_name,
  description,
  status_code
)
values
  ('bw', '.bw', 'Country code top-level domain for Botswana.', 'ACTIVE'),
  ('co.bw', '.co.bw', 'Commercial and general business registrations.', 'ACTIVE'),
  ('org.bw', '.org.bw', 'Non-profit organizations and associations.', 'ACTIVE'),
  ('gov.bw', '.gov.bw', 'Government institutions.', 'ACTIVE'),
  ('ac.bw', '.ac.bw', 'Academic and research institutions.', 'ACTIVE'),
  ('net.bw', '.net.bw', 'Network and infrastructure operators.', 'ACTIVE')
on conflict (zone_code) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  status_code = excluded.status_code,
  updated_at = now();

insert into licensing.licence_types (
  code,
  name,
  sector_code,
  category_code,
  description,
  processing_target_days
)
values
  ('INDIVIDUAL_COURIER', 'Individual Courier Licence', 'POSTAL', 'COURIER', 'Licence for individual courier operators.', 14),
  ('PUBLIC_TELECOMS_NETWORK', 'Public Telecommunications Network Licence', 'TELECOM', 'NETWORK', 'Licence for public telecom infrastructure and network operators.', 30),
  ('INTERNET_SERVICE_PROVIDER', 'Internet Service Provider Licence', 'INTERNET', 'ISP', 'Licence for internet service providers.', 21),
  ('BROADCASTING_SERVICE', 'Broadcasting Service Licence', 'BROADCASTING', 'CONTENT', 'Licence for radio and television broadcasting services.', 30)
on conflict (code) do update
set
  name = excluded.name,
  sector_code = excluded.sector_code,
  category_code = excluded.category_code,
  description = excluded.description,
  processing_target_days = excluded.processing_target_days,
  updated_at = now();

insert into agent.agent_profiles (
  agent_code,
  name,
  default_prompt,
  model_code,
  status_code
)
values
  (
    'BOCRA_COPILOT',
    'BOCRA Copilot',
    'Help users find BOCRA services, understand procedures, compare operator information, and prepare drafts without submitting anything without explicit confirmation.',
    'gemini-2.5-flash',
    'ACTIVE'
  )
on conflict (agent_code) do update
set
  name = excluded.name,
  default_prompt = excluded.default_prompt,
  model_code = excluded.model_code,
  status_code = excluded.status_code,
  updated_at = now();

insert into docs.document_templates (
  template_code,
  name,
  service_module_code,
  active_version,
  subject_template,
  body_template
)
values
  (
    'COMPLAINT_ACKNOWLEDGEMENT',
    'Complaint Acknowledgement',
    'COMPLAINTS',
    1,
    'Complaint {{complaint_number}} received',
    'This letter confirms BOCRA has received complaint {{complaint_number}} and will review it according to the applicable service standards.'
  ),
  (
    'LICENCE_APPROVAL_LETTER',
    'Licence Approval Letter',
    'LICENSING',
    1,
    'Licence approval for {{application_number}}',
    'BOCRA is pleased to confirm that application {{application_number}} has been approved, subject to the attached terms and conditions.'
  ),
  (
    'PAYMENT_RECEIPT',
    'Payment Receipt',
    'BILLING',
    1,
    'Receipt {{receipt_number}}',
    'This receipt confirms payment received against invoice {{invoice_number}}.'
  )
on conflict (template_code) do update
set
  name = excluded.name,
  service_module_code = excluded.service_module_code,
  active_version = excluded.active_version,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  updated_at = now();

insert into notify.notification_templates (
  template_code,
  channel_code,
  service_module_code,
  subject_template,
  body_template,
  locale_code,
  status_code
)
values
  (
    'COMPLAINT_CASE_CREATED_EMAIL',
    'EMAIL',
    'COMPLAINTS',
    'Complaint {{complaint_number}} received',
    'Your complaint {{complaint_number}} has been received by BOCRA and is now awaiting triage.',
    'en-BW',
    'ACTIVE'
  ),
  (
    'CYBER_INCIDENT_UPDATE_EMAIL',
    'EMAIL',
    'CYBER',
    'Cyber incident {{incident_number}} update',
    'There is a new update on cyber incident {{incident_number}}. Sign in to review the latest status and guidance.',
    'en-BW',
    'ACTIVE'
  ),
  (
    'LICENCE_APPROVED_SMS',
    'SMS',
    'LICENSING',
    null,
    'BOCRA: your application {{application_number}} has been approved. Please sign in to view next steps.',
    'en-BW',
    'ACTIVE'
  )
on conflict (template_code) do update
set
  channel_code = excluded.channel_code,
  service_module_code = excluded.service_module_code,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  locale_code = excluded.locale_code,
  status_code = excluded.status_code,
  updated_at = now();
