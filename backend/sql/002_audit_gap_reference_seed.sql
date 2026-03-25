-- Reference data seed for the BOCRA portal extension tables.
-- This intentionally seeds only foundational lookup/demo data and avoids
-- asserting live tariff or licence facts that still need BOCRA verification.

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
