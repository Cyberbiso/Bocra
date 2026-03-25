--
-- PostgreSQL database dump
--

\restrict u2BUYZ31Vn78nqSGMLrog1nNU9tf2JwxpQ1zmS4Ow2rEjOI3eXHNNVXSewbKgOE

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: agent; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA agent;


--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA audit;


--
-- Name: billing; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA billing;


--
-- Name: cirt; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA cirt;


--
-- Name: complaints; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA complaints;


--
-- Name: cyber; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA cyber;


--
-- Name: device; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA device;


--
-- Name: docs; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA docs;


--
-- Name: domain; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA domain;


--
-- Name: iam; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA iam;


--
-- Name: integration; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA integration;


--
-- Name: knowledge; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA knowledge;


--
-- Name: licensing; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA licensing;


--
-- Name: notify; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA notify;


--
-- Name: qos; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA qos;


--
-- Name: tariffs; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tariffs;


--
-- Name: workflow; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA workflow;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actions; Type: TABLE; Schema: agent; Owner: -
--

CREATE TABLE agent.actions (
    id uuid NOT NULL,
    thread_id uuid NOT NULL,
    action_type_code text NOT NULL,
    target_table text NOT NULL,
    target_id text,
    confirmation_state text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: agent_profiles; Type: TABLE; Schema: agent; Owner: -
--

CREATE TABLE agent.agent_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_code text NOT NULL,
    name text NOT NULL,
    default_prompt text NOT NULL,
    model_code text NOT NULL,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: agent; Owner: -
--

CREATE TABLE agent.messages (
    id uuid NOT NULL,
    thread_id uuid NOT NULL,
    role_code text NOT NULL,
    content text NOT NULL,
    cited_document_ids json NOT NULL,
    tool_invocations json NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: threads; Type: TABLE; Schema: agent; Owner: -
--

CREATE TABLE agent.threads (
    id uuid NOT NULL,
    external_thread_id text NOT NULL,
    user_id uuid,
    organization_id uuid,
    context_scope_code text NOT NULL,
    title text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    agent_profile_id uuid
);


--
-- Name: tool_calls; Type: TABLE; Schema: agent; Owner: -
--

CREATE TABLE agent.tool_calls (
    id uuid NOT NULL,
    thread_id uuid NOT NULL,
    tool_name text NOT NULL,
    request_json json NOT NULL,
    response_json json NOT NULL,
    result_status_code text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: audit; Owner: -
--

CREATE TABLE audit.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action_code text NOT NULL,
    entity_table text NOT NULL,
    entity_id text NOT NULL,
    before_json jsonb,
    after_json jsonb,
    ip_address text,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoice_items; Type: TABLE; Schema: billing; Owner: -
--

CREATE TABLE billing.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    line_no integer NOT NULL,
    item_code text,
    description text NOT NULL,
    quantity numeric(12,2) DEFAULT 1 NOT NULL,
    unit_amount numeric(12,2) NOT NULL,
    line_total_amount numeric(12,2) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: billing; Owner: -
--

CREATE TABLE billing.invoices (
    id uuid NOT NULL,
    invoice_number text NOT NULL,
    application_id text,
    payer_org_id uuid,
    owner_user_id uuid,
    description text NOT NULL,
    service_name text NOT NULL,
    currency_code text NOT NULL,
    subtotal_amount numeric(12,2) NOT NULL,
    vat_amount numeric(12,2) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    due_date date NOT NULL,
    status_code text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: billing; Owner: -
--

CREATE TABLE billing.payments (
    id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    gateway_code text NOT NULL,
    gateway_reference text NOT NULL,
    amount_paid numeric(12,2) NOT NULL,
    status_code text NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: receipts; Type: TABLE; Schema: billing; Owner: -
--

CREATE TABLE billing.receipts (
    id uuid NOT NULL,
    payment_id uuid NOT NULL,
    receipt_number text NOT NULL,
    file_path text,
    issued_at timestamp with time zone NOT NULL
);


--
-- Name: incident_reports; Type: TABLE; Schema: cirt; Owner: -
--

CREATE TABLE cirt.incident_reports (
    id uuid NOT NULL,
    reference_number text NOT NULL,
    reporter_user_id uuid,
    reporter_name text NOT NULL,
    reporter_email text NOT NULL,
    reporter_phone text,
    reporter_org text,
    incident_type_code text NOT NULL,
    severity_code text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    affected_systems text,
    incident_date date,
    status_code text NOT NULL,
    assigned_to_user_id uuid,
    resolution_notes text,
    resolved_at timestamp with time zone,
    metadata json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: attachments; Type: TABLE; Schema: complaints; Owner: -
--

CREATE TABLE complaints.attachments (
    id uuid NOT NULL,
    complaint_id uuid NOT NULL,
    file_name text NOT NULL,
    content_type text NOT NULL,
    size_bytes integer NOT NULL,
    storage_path text NOT NULL,
    uploaded_at timestamp with time zone NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: complaints; Owner: -
--

CREATE TABLE complaints.categories (
    id uuid NOT NULL,
    category_code text NOT NULL,
    name text NOT NULL,
    sector_code text NOT NULL,
    default_sla_hours integer NOT NULL
);


--
-- Name: complaint_assignments; Type: TABLE; Schema: complaints; Owner: -
--

CREATE TABLE complaints.complaint_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    complaint_id uuid NOT NULL,
    assigned_to_user_id uuid NOT NULL,
    assigned_by_user_id uuid,
    assignment_note text,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    unassigned_at timestamp with time zone
);


--
-- Name: complaint_sla_events; Type: TABLE; Schema: complaints; Owner: -
--

CREATE TABLE complaints.complaint_sla_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    complaint_id uuid NOT NULL,
    sla_stage_code text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    due_at timestamp with time zone NOT NULL,
    breached_at timestamp with time zone,
    resolved_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: complaint_status_history; Type: TABLE; Schema: complaints; Owner: -
--

CREATE TABLE complaints.complaint_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    complaint_id uuid NOT NULL,
    from_status_code text,
    to_status_code text NOT NULL,
    changed_by_user_id uuid,
    comment text,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: complaints; Type: TABLE; Schema: complaints; Owner: -
--

CREATE TABLE complaints.complaints (
    id uuid NOT NULL,
    complaint_number text NOT NULL,
    application_id uuid,
    complainant_user_id uuid,
    complainant_org_id uuid,
    subject text NOT NULL,
    complaint_type_code text NOT NULL,
    service_provider_name text,
    operator_code text,
    location_text text,
    provider_contacted_first boolean NOT NULL,
    narrative text NOT NULL,
    current_status_code text NOT NULL,
    assigned_to_user_id uuid,
    sla_due_at timestamp with time zone,
    expected_resolution_at timestamp with time zone,
    resolved_at timestamp with time zone,
    resolution_summary text,
    metadata json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    location_id uuid
);


--
-- Name: messages; Type: TABLE; Schema: complaints; Owner: -
--

CREATE TABLE complaints.messages (
    id uuid NOT NULL,
    complaint_id uuid NOT NULL,
    author_user_id uuid,
    author_name text NOT NULL,
    author_role text NOT NULL,
    visibility_code text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: advisories; Type: TABLE; Schema: cyber; Owner: -
--

CREATE TABLE cyber.advisories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    advisory_code text NOT NULL,
    title text NOT NULL,
    summary text,
    severity_code text DEFAULT 'INFO'::text NOT NULL,
    audience_code text DEFAULT 'PUBLIC'::text NOT NULL,
    status_code text DEFAULT 'PUBLISHED'::text NOT NULL,
    source_url text,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: incident_attachments; Type: TABLE; Schema: cyber; Owner: -
--

CREATE TABLE cyber.incident_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid NOT NULL,
    file_id uuid NOT NULL,
    attachment_type_code text DEFAULT 'EVIDENCE'::text NOT NULL,
    uploaded_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: incident_updates; Type: TABLE; Schema: cyber; Owner: -
--

CREATE TABLE cyber.incident_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid NOT NULL,
    author_user_id uuid,
    visibility_code text DEFAULT 'INTERNAL'::text NOT NULL,
    update_type_code text DEFAULT 'NOTE'::text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: incidents; Type: TABLE; Schema: cyber; Owner: -
--

CREATE TABLE cyber.incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_number text NOT NULL,
    workflow_application_id uuid,
    reporter_user_id uuid,
    reporter_org_id uuid,
    reporter_name text NOT NULL,
    reporter_email text,
    reporter_phone text,
    subject text NOT NULL,
    incident_type_code text NOT NULL,
    severity_code text DEFAULT 'MEDIUM'::text NOT NULL,
    current_status_code text DEFAULT 'NEW'::text NOT NULL,
    affected_systems_text text,
    incident_summary text NOT NULL,
    occurred_at timestamp with time zone,
    discovered_at timestamp with time zone,
    assigned_to_user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    reported_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: accreditation_status_history; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.accreditation_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    accreditation_id uuid NOT NULL,
    from_status_code text,
    to_status_code text NOT NULL,
    changed_by_user_id uuid,
    comment text,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: accreditations; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.accreditations (
    id uuid NOT NULL,
    organization_id uuid,
    user_id uuid,
    accreditation_type_code text NOT NULL,
    reference_number text,
    status_code text NOT NULL,
    valid_from date,
    valid_to date,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: catalog; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.catalog (
    id uuid NOT NULL,
    brand_name text NOT NULL,
    marketing_name text NOT NULL,
    model_name text NOT NULL,
    device_type text NOT NULL,
    is_sim_enabled boolean NOT NULL,
    technical_spec json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: device_verification_batches; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.device_verification_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_reference text NOT NULL,
    applicant_user_id uuid,
    applicant_org_id uuid,
    device_model_id uuid,
    import_period_start date,
    import_period_end date,
    status_code text DEFAULT 'UPLOADED'::text NOT NULL,
    submitted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: device_verification_certificates; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.device_verification_certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid NOT NULL,
    certificate_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exemption_applications; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.exemption_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_application_id uuid NOT NULL,
    device_model_id uuid NOT NULL,
    customer_accreditation_id uuid,
    manufacturer_accreditation_id uuid,
    reason_text text NOT NULL,
    form_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: type_approval_applications; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.type_approval_applications (
    id uuid NOT NULL,
    workflow_application_id uuid NOT NULL,
    device_model_id uuid NOT NULL,
    accreditation_id uuid,
    sample_imei text,
    country_of_manufacture text,
    form_data json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: type_approval_records; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.type_approval_records (
    id uuid NOT NULL,
    device_model_id uuid NOT NULL,
    certificate_id text,
    application_id uuid,
    status_code text NOT NULL,
    approval_date date,
    applicant_name text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: verification_items; Type: TABLE; Schema: device; Owner: -
--

CREATE TABLE device.verification_items (
    id uuid NOT NULL,
    imei text NOT NULL,
    serial_number text,
    device_model_id uuid,
    verification_source text NOT NULL,
    verification_status_code text NOT NULL,
    remarks text,
    response_payload json NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    batch_id uuid
);


--
-- Name: certificate_links; Type: TABLE; Schema: docs; Owner: -
--

CREATE TABLE docs.certificate_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    certificate_id uuid NOT NULL,
    application_id uuid,
    licence_id uuid,
    type_approval_record_id uuid,
    device_verification_batch_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: certificates; Type: TABLE; Schema: docs; Owner: -
--

CREATE TABLE docs.certificates (
    id uuid NOT NULL,
    certificate_number text NOT NULL,
    certificate_type text NOT NULL,
    holder_name text NOT NULL,
    device_name text,
    issue_date date NOT NULL,
    expiry_date date NOT NULL,
    status_code text NOT NULL,
    qr_token text NOT NULL,
    application_id text,
    owner_user_id uuid,
    issued_by text NOT NULL,
    remarks text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: document_templates; Type: TABLE; Schema: docs; Owner: -
--

CREATE TABLE docs.document_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_code text NOT NULL,
    name text NOT NULL,
    service_module_code text NOT NULL,
    active_version integer DEFAULT 1 NOT NULL,
    subject_template text,
    body_template text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: files; Type: TABLE; Schema: docs; Owner: -
--

CREATE TABLE docs.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    storage_key text NOT NULL,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    file_size_bytes bigint NOT NULL,
    checksum_sha256 text,
    uploaded_by_user_id uuid,
    source_module_code text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT files_file_size_bytes_check CHECK ((file_size_bytes >= 0))
);


--
-- Name: domain_zones; Type: TABLE; Schema: domain; Owner: -
--

CREATE TABLE domain.domain_zones (
    zone_code text NOT NULL,
    display_name text NOT NULL,
    description text,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_requests; Type: TABLE; Schema: domain; Owner: -
--

CREATE TABLE domain.referral_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    requested_domain text NOT NULL,
    zone_code text,
    registrar_id uuid,
    status_code text DEFAULT 'NEW'::text NOT NULL,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: registrars; Type: TABLE; Schema: domain; Owner: -
--

CREATE TABLE domain.registrars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    website_url text,
    email text,
    phone text,
    accredited_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: whois_snapshots; Type: TABLE; Schema: domain; Owner: -
--

CREATE TABLE domain.whois_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    domain_name text NOT NULL,
    snapshot_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    captured_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: external_systems; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.external_systems (
    id uuid NOT NULL,
    system_code text NOT NULL,
    name text NOT NULL,
    description text,
    base_url text NOT NULL,
    health_endpoint text NOT NULL,
    api_key text NOT NULL,
    contact_email text,
    status_code text NOT NULL,
    last_response_ms integer,
    last_checked_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.organizations (
    id uuid NOT NULL,
    legal_name text NOT NULL,
    trading_name text,
    org_type_code text NOT NULL,
    registration_number text,
    tax_number text,
    status_code text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.permissions (
    id uuid NOT NULL,
    permission_code text NOT NULL,
    name text NOT NULL,
    module_code text NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.role_permissions (
    id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.roles (
    id uuid NOT NULL,
    role_code text NOT NULL,
    name text NOT NULL,
    scope_code text NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.sessions (
    id uuid NOT NULL,
    token text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.user_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    organization_id uuid,
    effective_from timestamp with time zone NOT NULL,
    effective_to timestamp with time zone
);


--
-- Name: users; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.users (
    id uuid NOT NULL,
    email text NOT NULL,
    password_hash text,
    auth_provider text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone_e164 text,
    national_id text,
    passport_number text,
    status_code text NOT NULL,
    email_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: external_records; Type: TABLE; Schema: integration; Owner: -
--

CREATE TABLE integration.external_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_system_id uuid NOT NULL,
    external_record_id text NOT NULL,
    local_table_name text NOT NULL,
    local_record_id text NOT NULL,
    payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    synced_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: external_systems; Type: TABLE; Schema: integration; Owner: -
--

CREATE TABLE integration.external_systems (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    system_code text NOT NULL,
    name text NOT NULL,
    base_url text,
    auth_type_code text DEFAULT 'NONE'::text NOT NULL,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sync_jobs; Type: TABLE; Schema: integration; Owner: -
--

CREATE TABLE integration.sync_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_system_id uuid NOT NULL,
    job_type_code text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    status_code text DEFAULT 'RUNNING'::text NOT NULL,
    notes text,
    payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: consultation_submissions; Type: TABLE; Schema: knowledge; Owner: -
--

CREATE TABLE knowledge.consultation_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultation_id uuid NOT NULL,
    submitted_by_user_id uuid,
    submitted_by_org_id uuid,
    submitter_name text NOT NULL,
    submitter_email text,
    body text NOT NULL,
    attachment_file_id uuid,
    status_code text DEFAULT 'RECEIVED'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: consultations; Type: TABLE; Schema: knowledge; Owner: -
--

CREATE TABLE knowledge.consultations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid,
    title text NOT NULL,
    summary text,
    status_code text DEFAULT 'DRAFT'::text NOT NULL,
    owner_user_id uuid,
    opens_at timestamp with time zone,
    closes_at timestamp with time zone,
    published_at timestamp with time zone,
    submission_instructions text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_chunks; Type: TABLE; Schema: knowledge; Owner: -
--

CREATE TABLE knowledge.document_chunks (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    chunk_index integer NOT NULL,
    source_url text,
    page_number integer,
    content text NOT NULL,
    token_count integer,
    embedding json,
    metadata json NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: document_tags; Type: TABLE; Schema: knowledge; Owner: -
--

CREATE TABLE knowledge.document_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    tag_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: documents; Type: TABLE; Schema: knowledge; Owner: -
--

CREATE TABLE knowledge.documents (
    id uuid NOT NULL,
    title text NOT NULL,
    document_type_code text NOT NULL,
    source_url text,
    file_path text,
    published_at timestamp with time zone,
    status_code text NOT NULL,
    excerpt text,
    category text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: applications; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.applications (
    id uuid NOT NULL,
    workflow_application_id uuid NOT NULL,
    category_code text NOT NULL,
    licence_type_name text NOT NULL,
    applicant_name text NOT NULL,
    applicant_email text NOT NULL,
    coverage_area text,
    form_data json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: frequency_assignments; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.frequency_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    licence_id uuid NOT NULL,
    frequency_start_mhz numeric(12,3) NOT NULL,
    frequency_end_mhz numeric(12,3) NOT NULL,
    bandwidth_khz numeric(12,3),
    location_text text,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: licence_documents; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.licence_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    licence_id uuid NOT NULL,
    file_id uuid NOT NULL,
    document_type_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: licence_renewal_alerts; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.licence_renewal_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    licence_id uuid NOT NULL,
    alert_type_code text NOT NULL,
    trigger_at timestamp with time zone NOT NULL,
    display_until timestamp with time zone,
    acknowledged_at timestamp with time zone,
    notification_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: licence_status_history; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.licence_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    licence_id uuid NOT NULL,
    from_status_code text,
    to_status_code text NOT NULL,
    changed_by_user_id uuid,
    comment text,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: licence_types; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.licence_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    sector_code text NOT NULL,
    category_code text NOT NULL,
    description text,
    application_fee numeric(12,2),
    renewal_fee numeric(12,2),
    processing_target_days integer,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: public_register_entries; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.public_register_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    licence_record_id uuid,
    service_sector_code text NOT NULL,
    service_name text NOT NULL,
    geographic_scope text,
    public_status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    public_notes text,
    published_at timestamp with time zone,
    last_verified_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: radio_equipments; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.radio_equipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    licence_id uuid,
    licensee_org_id uuid,
    equipment_type text NOT NULL,
    make text,
    model text,
    serial_number text,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: records; Type: TABLE; Schema: licensing; Owner: -
--

CREATE TABLE licensing.records (
    id uuid NOT NULL,
    workflow_application_id uuid,
    licence_number text NOT NULL,
    licence_type text NOT NULL,
    category text NOT NULL,
    sub_category text,
    status_code text NOT NULL,
    issue_date date NOT NULL,
    expiry_date date NOT NULL,
    holder_name text NOT NULL,
    holder_address text,
    coverage_area text,
    frequency_band text,
    assigned_officer_name text,
    assigned_officer_dept text,
    metadata json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: notification_deliveries; Type: TABLE; Schema: notify; Owner: -
--

CREATE TABLE notify.notification_deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_id uuid NOT NULL,
    provider_code text NOT NULL,
    provider_reference text,
    delivery_status_code text DEFAULT 'PENDING'::text NOT NULL,
    delivered_at timestamp with time zone,
    failed_at timestamp with time zone,
    response_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_events; Type: TABLE; Schema: notify; Owner: -
--

CREATE TABLE notify.notification_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_code text NOT NULL,
    source_table text NOT NULL,
    source_id text NOT NULL,
    recipient_user_id uuid,
    payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_preferences; Type: TABLE; Schema: notify; Owner: -
--

CREATE TABLE notify.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_code text NOT NULL,
    channel_code text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    quiet_hours_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_templates; Type: TABLE; Schema: notify; Owner: -
--

CREATE TABLE notify.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_code text NOT NULL,
    channel_code text NOT NULL,
    service_module_code text NOT NULL,
    subject_template text,
    body_template text NOT NULL,
    locale_code text DEFAULT 'en-BW'::text NOT NULL,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: notify; Owner: -
--

CREATE TABLE notify.notifications (
    id uuid NOT NULL,
    user_id uuid,
    channel_code text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    status_code text NOT NULL,
    sent_at timestamp with time zone,
    source_table text,
    source_id text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    event_id uuid
);


--
-- Name: ingest_runs; Type: TABLE; Schema: qos; Owner: -
--

CREATE TABLE qos.ingest_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_code text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    status_code text DEFAULT 'RUNNING'::text NOT NULL,
    row_count integer,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: location_ancestors; Type: TABLE; Schema: qos; Owner: -
--

CREATE TABLE qos.location_ancestors (
    location_id uuid NOT NULL,
    ancestor_location_id uuid NOT NULL,
    ancestor_level integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: locations; Type: TABLE; Schema: qos; Owner: -
--

CREATE TABLE qos.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_location_id text,
    name text NOT NULL,
    level integer NOT NULL,
    parent_id uuid,
    geom public.geometry(MultiPolygon,4326),
    centroid public.geometry(Point,4326),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: metric_definitions; Type: TABLE; Schema: qos; Owner: -
--

CREATE TABLE qos.metric_definitions (
    metric_code text NOT NULL,
    name text NOT NULL,
    service_code text,
    network_code text,
    unit text NOT NULL,
    direction_code text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: observations; Type: TABLE; Schema: qos; Owner: -
--

CREATE TABLE qos.observations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operator_id uuid NOT NULL,
    location_id uuid NOT NULL,
    metric_code text NOT NULL,
    observed_on date NOT NULL,
    vendor_name text,
    value_numeric numeric(14,4) NOT NULL,
    raw_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    ingest_run_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: operators; Type: TABLE; Schema: qos; Owner: -
--

CREATE TABLE qos.operators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    operator_code text NOT NULL,
    name text NOT NULL,
    sector_code text DEFAULT 'TELECOM'::text NOT NULL,
    brand_color text,
    logo_url text,
    website_url text,
    status_code text DEFAULT 'ACTIVE'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: plans; Type: TABLE; Schema: tariffs; Owner: -
--

CREATE TABLE tariffs.plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operator_id uuid NOT NULL,
    plan_code text NOT NULL,
    plan_name text NOT NULL,
    service_code text NOT NULL,
    customer_type_code text DEFAULT 'CONSUMER'::text NOT NULL,
    currency_code text DEFAULT 'BWP'::text NOT NULL,
    status_code text DEFAULT 'PUBLISHED'::text NOT NULL,
    valid_from date,
    valid_to date,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_items; Type: TABLE; Schema: tariffs; Owner: -
--

CREATE TABLE tariffs.price_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    item_code text NOT NULL,
    charge_type_code text NOT NULL,
    unit_code text,
    included_units numeric(12,2),
    price_amount numeric(12,2) NOT NULL,
    overage_price_amount numeric(12,2),
    billing_period_code text,
    sort_order integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: application_comments; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.application_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    author_user_id uuid,
    visibility_code text DEFAULT 'INTERNAL'::text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: application_documents; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.application_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    file_id uuid NOT NULL,
    document_type_code text NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    review_status_code text DEFAULT 'PENDING'::text NOT NULL,
    uploaded_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: application_parties; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.application_parties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    party_type_code text NOT NULL,
    organization_id uuid,
    contact_user_id uuid,
    display_name text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: application_status_history; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.application_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    from_status_code text,
    to_status_code text NOT NULL,
    changed_by_user_id uuid,
    comment text,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: application_tasks; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.application_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    task_type_code text NOT NULL,
    title text NOT NULL,
    assigned_to_user_id uuid,
    task_status_code text DEFAULT 'OPEN'::text NOT NULL,
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: applications; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.applications (
    id uuid NOT NULL,
    application_number text NOT NULL,
    application_type_code text NOT NULL,
    service_module_code text NOT NULL,
    applicant_user_id uuid,
    applicant_org_id uuid,
    title text NOT NULL,
    description text,
    current_status_code text NOT NULL,
    current_stage_code text,
    public_tracker_token text,
    submitted_at timestamp with time zone,
    expected_decision_at timestamp with time zone,
    due_at timestamp with time zone,
    priority_code text NOT NULL,
    source_channel text NOT NULL,
    external_system_code text,
    external_record_id text,
    metadata json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    last_status_changed_at timestamp with time zone
);


--
-- Name: events; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.events (
    id uuid NOT NULL,
    resource_kind text NOT NULL,
    resource_id text NOT NULL,
    event_type_code text NOT NULL,
    label text NOT NULL,
    actor_name text NOT NULL,
    actor_role text NOT NULL,
    is_visible_to_applicant boolean NOT NULL,
    comment text,
    occurred_at timestamp with time zone NOT NULL,
    metadata json NOT NULL
);


--
-- Name: status_catalog; Type: TABLE; Schema: workflow; Owner: -
--

CREATE TABLE workflow.status_catalog (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    domain_code text NOT NULL,
    status_code text NOT NULL,
    label text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_terminal boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


--
-- Name: agent_profiles agent_profiles_agent_code_key; Type: CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.agent_profiles
    ADD CONSTRAINT agent_profiles_agent_code_key UNIQUE (agent_code);


--
-- Name: agent_profiles agent_profiles_pkey; Type: CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.agent_profiles
    ADD CONSTRAINT agent_profiles_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: threads threads_external_thread_id_key; Type: CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.threads
    ADD CONSTRAINT threads_external_thread_id_key UNIQUE (external_thread_id);


--
-- Name: threads threads_pkey; Type: CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);


--
-- Name: tool_calls tool_calls_pkey; Type: CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.tool_calls
    ADD CONSTRAINT tool_calls_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_invoice_id_line_no_key; Type: CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_line_no_key UNIQUE (invoice_id, line_no);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_receipt_number_key; Type: CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.receipts
    ADD CONSTRAINT receipts_receipt_number_key UNIQUE (receipt_number);


--
-- Name: incident_reports incident_reports_pkey; Type: CONSTRAINT; Schema: cirt; Owner: -
--

ALTER TABLE ONLY cirt.incident_reports
    ADD CONSTRAINT incident_reports_pkey PRIMARY KEY (id);


--
-- Name: incident_reports incident_reports_reference_number_key; Type: CONSTRAINT; Schema: cirt; Owner: -
--

ALTER TABLE ONLY cirt.incident_reports
    ADD CONSTRAINT incident_reports_reference_number_key UNIQUE (reference_number);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: categories categories_category_code_key; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.categories
    ADD CONSTRAINT categories_category_code_key UNIQUE (category_code);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: complaint_assignments complaint_assignments_pkey; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_assignments
    ADD CONSTRAINT complaint_assignments_pkey PRIMARY KEY (id);


--
-- Name: complaint_sla_events complaint_sla_events_pkey; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_sla_events
    ADD CONSTRAINT complaint_sla_events_pkey PRIMARY KEY (id);


--
-- Name: complaint_status_history complaint_status_history_pkey; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_status_history
    ADD CONSTRAINT complaint_status_history_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_complaint_number_key; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaints
    ADD CONSTRAINT complaints_complaint_number_key UNIQUE (complaint_number);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: advisories advisories_advisory_code_key; Type: CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.advisories
    ADD CONSTRAINT advisories_advisory_code_key UNIQUE (advisory_code);


--
-- Name: advisories advisories_pkey; Type: CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.advisories
    ADD CONSTRAINT advisories_pkey PRIMARY KEY (id);


--
-- Name: incident_attachments incident_attachments_incident_id_file_id_key; Type: CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.incident_attachments
    ADD CONSTRAINT incident_attachments_incident_id_file_id_key UNIQUE (incident_id, file_id);


--
-- Name: incident_attachments incident_attachments_pkey; Type: CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.incident_attachments
    ADD CONSTRAINT incident_attachments_pkey PRIMARY KEY (id);


--
-- Name: incident_updates incident_updates_pkey; Type: CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.incident_updates
    ADD CONSTRAINT incident_updates_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_incident_number_key; Type: CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.incidents
    ADD CONSTRAINT incidents_incident_number_key UNIQUE (incident_number);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: accreditation_status_history accreditation_status_history_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.accreditation_status_history
    ADD CONSTRAINT accreditation_status_history_pkey PRIMARY KEY (id);


--
-- Name: accreditations accreditations_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.accreditations
    ADD CONSTRAINT accreditations_pkey PRIMARY KEY (id);


--
-- Name: catalog catalog_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.catalog
    ADD CONSTRAINT catalog_pkey PRIMARY KEY (id);


--
-- Name: device_verification_batches device_verification_batches_batch_reference_key; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_batches
    ADD CONSTRAINT device_verification_batches_batch_reference_key UNIQUE (batch_reference);


--
-- Name: device_verification_batches device_verification_batches_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_batches
    ADD CONSTRAINT device_verification_batches_pkey PRIMARY KEY (id);


--
-- Name: device_verification_certificates device_verification_certificates_batch_id_certificate_id_key; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_certificates
    ADD CONSTRAINT device_verification_certificates_batch_id_certificate_id_key UNIQUE (batch_id, certificate_id);


--
-- Name: device_verification_certificates device_verification_certificates_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_certificates
    ADD CONSTRAINT device_verification_certificates_pkey PRIMARY KEY (id);


--
-- Name: exemption_applications exemption_applications_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.exemption_applications
    ADD CONSTRAINT exemption_applications_pkey PRIMARY KEY (id);


--
-- Name: type_approval_applications type_approval_applications_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.type_approval_applications
    ADD CONSTRAINT type_approval_applications_pkey PRIMARY KEY (id);


--
-- Name: type_approval_records type_approval_records_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.type_approval_records
    ADD CONSTRAINT type_approval_records_pkey PRIMARY KEY (id);


--
-- Name: verification_items verification_items_pkey; Type: CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.verification_items
    ADD CONSTRAINT verification_items_pkey PRIMARY KEY (id);


--
-- Name: certificate_links certificate_links_certificate_id_application_id_licence_id__key; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificate_links
    ADD CONSTRAINT certificate_links_certificate_id_application_id_licence_id__key UNIQUE (certificate_id, application_id, licence_id, type_approval_record_id);


--
-- Name: certificate_links certificate_links_pkey; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificate_links
    ADD CONSTRAINT certificate_links_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_certificate_number_key; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificates
    ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_qr_token_key; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificates
    ADD CONSTRAINT certificates_qr_token_key UNIQUE (qr_token);


--
-- Name: document_templates document_templates_pkey; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.document_templates
    ADD CONSTRAINT document_templates_pkey PRIMARY KEY (id);


--
-- Name: document_templates document_templates_template_code_key; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.document_templates
    ADD CONSTRAINT document_templates_template_code_key UNIQUE (template_code);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: files files_storage_key_key; Type: CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.files
    ADD CONSTRAINT files_storage_key_key UNIQUE (storage_key);


--
-- Name: domain_zones domain_zones_pkey; Type: CONSTRAINT; Schema: domain; Owner: -
--

ALTER TABLE ONLY domain.domain_zones
    ADD CONSTRAINT domain_zones_pkey PRIMARY KEY (zone_code);


--
-- Name: referral_requests referral_requests_pkey; Type: CONSTRAINT; Schema: domain; Owner: -
--

ALTER TABLE ONLY domain.referral_requests
    ADD CONSTRAINT referral_requests_pkey PRIMARY KEY (id);


--
-- Name: registrars registrars_name_key; Type: CONSTRAINT; Schema: domain; Owner: -
--

ALTER TABLE ONLY domain.registrars
    ADD CONSTRAINT registrars_name_key UNIQUE (name);


--
-- Name: registrars registrars_pkey; Type: CONSTRAINT; Schema: domain; Owner: -
--

ALTER TABLE ONLY domain.registrars
    ADD CONSTRAINT registrars_pkey PRIMARY KEY (id);


--
-- Name: whois_snapshots whois_snapshots_pkey; Type: CONSTRAINT; Schema: domain; Owner: -
--

ALTER TABLE ONLY domain.whois_snapshots
    ADD CONSTRAINT whois_snapshots_pkey PRIMARY KEY (id);


--
-- Name: external_systems external_systems_api_key_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.external_systems
    ADD CONSTRAINT external_systems_api_key_key UNIQUE (api_key);


--
-- Name: external_systems external_systems_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.external_systems
    ADD CONSTRAINT external_systems_pkey PRIMARY KEY (id);


--
-- Name: external_systems external_systems_system_code_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.external_systems
    ADD CONSTRAINT external_systems_system_code_key UNIQUE (system_code);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_registration_number_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.organizations
    ADD CONSTRAINT organizations_registration_number_key UNIQUE (registration_number);


--
-- Name: permissions permissions_permission_code_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.permissions
    ADD CONSTRAINT permissions_permission_code_key UNIQUE (permission_code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_role_code_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.roles
    ADD CONSTRAINT roles_role_code_key UNIQUE (role_code);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: external_records external_records_external_system_id_external_record_id_loca_key; Type: CONSTRAINT; Schema: integration; Owner: -
--

ALTER TABLE ONLY integration.external_records
    ADD CONSTRAINT external_records_external_system_id_external_record_id_loca_key UNIQUE (external_system_id, external_record_id, local_table_name, local_record_id);


--
-- Name: external_records external_records_pkey; Type: CONSTRAINT; Schema: integration; Owner: -
--

ALTER TABLE ONLY integration.external_records
    ADD CONSTRAINT external_records_pkey PRIMARY KEY (id);


--
-- Name: external_systems external_systems_pkey; Type: CONSTRAINT; Schema: integration; Owner: -
--

ALTER TABLE ONLY integration.external_systems
    ADD CONSTRAINT external_systems_pkey PRIMARY KEY (id);


--
-- Name: external_systems external_systems_system_code_key; Type: CONSTRAINT; Schema: integration; Owner: -
--

ALTER TABLE ONLY integration.external_systems
    ADD CONSTRAINT external_systems_system_code_key UNIQUE (system_code);


--
-- Name: sync_jobs sync_jobs_pkey; Type: CONSTRAINT; Schema: integration; Owner: -
--

ALTER TABLE ONLY integration.sync_jobs
    ADD CONSTRAINT sync_jobs_pkey PRIMARY KEY (id);


--
-- Name: consultation_submissions consultation_submissions_pkey; Type: CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultation_submissions
    ADD CONSTRAINT consultation_submissions_pkey PRIMARY KEY (id);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- Name: document_tags document_tags_document_id_tag_code_key; Type: CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.document_tags
    ADD CONSTRAINT document_tags_document_id_tag_code_key UNIQUE (document_id, tag_code);


--
-- Name: document_tags document_tags_pkey; Type: CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.document_tags
    ADD CONSTRAINT document_tags_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: frequency_assignments frequency_assignments_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.frequency_assignments
    ADD CONSTRAINT frequency_assignments_pkey PRIMARY KEY (id);


--
-- Name: licence_documents licence_documents_licence_id_file_id_key; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_documents
    ADD CONSTRAINT licence_documents_licence_id_file_id_key UNIQUE (licence_id, file_id);


--
-- Name: licence_documents licence_documents_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_documents
    ADD CONSTRAINT licence_documents_pkey PRIMARY KEY (id);


--
-- Name: licence_renewal_alerts licence_renewal_alerts_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_renewal_alerts
    ADD CONSTRAINT licence_renewal_alerts_pkey PRIMARY KEY (id);


--
-- Name: licence_status_history licence_status_history_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_status_history
    ADD CONSTRAINT licence_status_history_pkey PRIMARY KEY (id);


--
-- Name: licence_types licence_types_code_key; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_types
    ADD CONSTRAINT licence_types_code_key UNIQUE (code);


--
-- Name: licence_types licence_types_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_types
    ADD CONSTRAINT licence_types_pkey PRIMARY KEY (id);


--
-- Name: public_register_entries public_register_entries_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.public_register_entries
    ADD CONSTRAINT public_register_entries_pkey PRIMARY KEY (id);


--
-- Name: radio_equipments radio_equipments_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.radio_equipments
    ADD CONSTRAINT radio_equipments_pkey PRIMARY KEY (id);


--
-- Name: records records_licence_number_key; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.records
    ADD CONSTRAINT records_licence_number_key UNIQUE (licence_number);


--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (id);


--
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);


--
-- Name: notification_events notification_events_pkey; Type: CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_events
    ADD CONSTRAINT notification_events_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_event_code_channel_code_key; Type: CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_event_code_channel_code_key UNIQUE (user_id, event_code, channel_code);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_template_code_key; Type: CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_templates
    ADD CONSTRAINT notification_templates_template_code_key UNIQUE (template_code);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: ingest_runs ingest_runs_pkey; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.ingest_runs
    ADD CONSTRAINT ingest_runs_pkey PRIMARY KEY (id);


--
-- Name: location_ancestors location_ancestors_pkey; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.location_ancestors
    ADD CONSTRAINT location_ancestors_pkey PRIMARY KEY (location_id, ancestor_location_id);


--
-- Name: locations locations_external_location_id_key; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.locations
    ADD CONSTRAINT locations_external_location_id_key UNIQUE (external_location_id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: metric_definitions metric_definitions_pkey; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.metric_definitions
    ADD CONSTRAINT metric_definitions_pkey PRIMARY KEY (metric_code);


--
-- Name: observations observations_operator_id_location_id_metric_code_observed_o_key; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.observations
    ADD CONSTRAINT observations_operator_id_location_id_metric_code_observed_o_key UNIQUE (operator_id, location_id, metric_code, observed_on, vendor_name);


--
-- Name: observations observations_pkey; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.observations
    ADD CONSTRAINT observations_pkey PRIMARY KEY (id);


--
-- Name: operators operators_operator_code_key; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.operators
    ADD CONSTRAINT operators_operator_code_key UNIQUE (operator_code);


--
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: tariffs; Owner: -
--

ALTER TABLE ONLY tariffs.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: plans plans_plan_code_key; Type: CONSTRAINT; Schema: tariffs; Owner: -
--

ALTER TABLE ONLY tariffs.plans
    ADD CONSTRAINT plans_plan_code_key UNIQUE (plan_code);


--
-- Name: price_items price_items_pkey; Type: CONSTRAINT; Schema: tariffs; Owner: -
--

ALTER TABLE ONLY tariffs.price_items
    ADD CONSTRAINT price_items_pkey PRIMARY KEY (id);


--
-- Name: price_items price_items_plan_id_item_code_key; Type: CONSTRAINT; Schema: tariffs; Owner: -
--

ALTER TABLE ONLY tariffs.price_items
    ADD CONSTRAINT price_items_plan_id_item_code_key UNIQUE (plan_id, item_code);


--
-- Name: application_comments application_comments_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_comments
    ADD CONSTRAINT application_comments_pkey PRIMARY KEY (id);


--
-- Name: application_documents application_documents_application_id_file_id_key; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_documents
    ADD CONSTRAINT application_documents_application_id_file_id_key UNIQUE (application_id, file_id);


--
-- Name: application_documents application_documents_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_documents
    ADD CONSTRAINT application_documents_pkey PRIMARY KEY (id);


--
-- Name: application_parties application_parties_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_parties
    ADD CONSTRAINT application_parties_pkey PRIMARY KEY (id);


--
-- Name: application_status_history application_status_history_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_status_history
    ADD CONSTRAINT application_status_history_pkey PRIMARY KEY (id);


--
-- Name: application_tasks application_tasks_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_tasks
    ADD CONSTRAINT application_tasks_pkey PRIMARY KEY (id);


--
-- Name: applications applications_application_number_key; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.applications
    ADD CONSTRAINT applications_application_number_key UNIQUE (application_number);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: applications applications_public_tracker_token_key; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.applications
    ADD CONSTRAINT applications_public_tracker_token_key UNIQUE (public_tracker_token);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: status_catalog status_catalog_domain_code_status_code_key; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.status_catalog
    ADD CONSTRAINT status_catalog_domain_code_status_code_key UNIQUE (domain_code, status_code);


--
-- Name: status_catalog status_catalog_pkey; Type: CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.status_catalog
    ADD CONSTRAINT status_catalog_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON audit.audit_logs USING btree (entity_table, entity_id, created_at DESC);


--
-- Name: idx_billing_invoice_items_invoice_id; Type: INDEX; Schema: billing; Owner: -
--

CREATE INDEX idx_billing_invoice_items_invoice_id ON billing.invoice_items USING btree (invoice_id, line_no);


--
-- Name: idx_complaints_assignments_owner; Type: INDEX; Schema: complaints; Owner: -
--

CREATE INDEX idx_complaints_assignments_owner ON complaints.complaint_assignments USING btree (assigned_to_user_id, assigned_at DESC);


--
-- Name: idx_complaints_sla_events_due_at; Type: INDEX; Schema: complaints; Owner: -
--

CREATE INDEX idx_complaints_sla_events_due_at ON complaints.complaint_sla_events USING btree (due_at, breached_at);


--
-- Name: idx_complaints_status_history_complaint_id; Type: INDEX; Schema: complaints; Owner: -
--

CREATE INDEX idx_complaints_status_history_complaint_id ON complaints.complaint_status_history USING btree (complaint_id, changed_at DESC);


--
-- Name: idx_cyber_advisories_published_at; Type: INDEX; Schema: cyber; Owner: -
--

CREATE INDEX idx_cyber_advisories_published_at ON cyber.advisories USING btree (status_code, published_at DESC);


--
-- Name: idx_cyber_incidents_status_severity; Type: INDEX; Schema: cyber; Owner: -
--

CREATE INDEX idx_cyber_incidents_status_severity ON cyber.incidents USING btree (current_status_code, severity_code, reported_at DESC);


--
-- Name: idx_device_verification_items_batch_id; Type: INDEX; Schema: device; Owner: -
--

CREATE INDEX idx_device_verification_items_batch_id ON device.verification_items USING btree (batch_id);


--
-- Name: ix_device_verification_items_imei; Type: INDEX; Schema: device; Owner: -
--

CREATE INDEX ix_device_verification_items_imei ON device.verification_items USING btree (imei);


--
-- Name: idx_docs_files_uploaded_by_user_id; Type: INDEX; Schema: docs; Owner: -
--

CREATE INDEX idx_docs_files_uploaded_by_user_id ON docs.files USING btree (uploaded_by_user_id);


--
-- Name: idx_domain_referral_requests_status; Type: INDEX; Schema: domain; Owner: -
--

CREATE INDEX idx_domain_referral_requests_status ON domain.referral_requests USING btree (status_code, created_at DESC);


--
-- Name: ix_iam_sessions_token; Type: INDEX; Schema: iam; Owner: -
--

CREATE UNIQUE INDEX ix_iam_sessions_token ON iam.sessions USING btree (token);


--
-- Name: idx_integration_sync_jobs_system_status; Type: INDEX; Schema: integration; Owner: -
--

CREATE INDEX idx_integration_sync_jobs_system_status ON integration.sync_jobs USING btree (external_system_id, status_code, started_at DESC);


--
-- Name: idx_knowledge_consultation_submissions_consultation_id; Type: INDEX; Schema: knowledge; Owner: -
--

CREATE INDEX idx_knowledge_consultation_submissions_consultation_id ON knowledge.consultation_submissions USING btree (consultation_id, submitted_at DESC);


--
-- Name: idx_knowledge_consultations_status_window; Type: INDEX; Schema: knowledge; Owner: -
--

CREATE INDEX idx_knowledge_consultations_status_window ON knowledge.consultations USING btree (status_code, opens_at, closes_at);


--
-- Name: idx_licensing_public_register_entries_sector_status; Type: INDEX; Schema: licensing; Owner: -
--

CREATE INDEX idx_licensing_public_register_entries_sector_status ON licensing.public_register_entries USING btree (service_sector_code, public_status_code, published_at DESC);


--
-- Name: idx_notify_notification_events_recipient; Type: INDEX; Schema: notify; Owner: -
--

CREATE INDEX idx_notify_notification_events_recipient ON notify.notification_events USING btree (recipient_user_id, triggered_at DESC);


--
-- Name: idx_qos_locations_centroid; Type: INDEX; Schema: qos; Owner: -
--

CREATE INDEX idx_qos_locations_centroid ON qos.locations USING gist (centroid);


--
-- Name: idx_qos_locations_geom; Type: INDEX; Schema: qos; Owner: -
--

CREATE INDEX idx_qos_locations_geom ON qos.locations USING gist (geom);


--
-- Name: idx_qos_locations_parent_id; Type: INDEX; Schema: qos; Owner: -
--

CREATE INDEX idx_qos_locations_parent_id ON qos.locations USING btree (parent_id);


--
-- Name: idx_qos_observations_lookup; Type: INDEX; Schema: qos; Owner: -
--

CREATE INDEX idx_qos_observations_lookup ON qos.observations USING btree (operator_id, location_id, metric_code, observed_on DESC);


--
-- Name: idx_tariffs_plans_operator_service; Type: INDEX; Schema: tariffs; Owner: -
--

CREATE INDEX idx_tariffs_plans_operator_service ON tariffs.plans USING btree (operator_id, service_code, customer_type_code);


--
-- Name: idx_tariffs_price_items_plan_id; Type: INDEX; Schema: tariffs; Owner: -
--

CREATE INDEX idx_tariffs_price_items_plan_id ON tariffs.price_items USING btree (plan_id, sort_order);


--
-- Name: idx_workflow_application_documents_application_id; Type: INDEX; Schema: workflow; Owner: -
--

CREATE INDEX idx_workflow_application_documents_application_id ON workflow.application_documents USING btree (application_id, review_status_code);


--
-- Name: idx_workflow_application_status_history_application_id; Type: INDEX; Schema: workflow; Owner: -
--

CREATE INDEX idx_workflow_application_status_history_application_id ON workflow.application_status_history USING btree (application_id, changed_at DESC);


--
-- Name: idx_workflow_application_tasks_assigned_to; Type: INDEX; Schema: workflow; Owner: -
--

CREATE INDEX idx_workflow_application_tasks_assigned_to ON workflow.application_tasks USING btree (assigned_to_user_id, task_status_code, due_at);


--
-- Name: ix_workflow_events_resource_id; Type: INDEX; Schema: workflow; Owner: -
--

CREATE INDEX ix_workflow_events_resource_id ON workflow.events USING btree (resource_id);


--
-- Name: actions actions_thread_id_fkey; Type: FK CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.actions
    ADD CONSTRAINT actions_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES agent.threads(id);


--
-- Name: messages messages_thread_id_fkey; Type: FK CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.messages
    ADD CONSTRAINT messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES agent.threads(id);


--
-- Name: threads threads_agent_profile_id_fkey; Type: FK CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.threads
    ADD CONSTRAINT threads_agent_profile_id_fkey FOREIGN KEY (agent_profile_id) REFERENCES agent.agent_profiles(id);


--
-- Name: threads threads_organization_id_fkey; Type: FK CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.threads
    ADD CONSTRAINT threads_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES iam.organizations(id);


--
-- Name: threads threads_user_id_fkey; Type: FK CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.threads
    ADD CONSTRAINT threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id);


--
-- Name: tool_calls tool_calls_thread_id_fkey; Type: FK CONSTRAINT; Schema: agent; Owner: -
--

ALTER TABLE ONLY agent.tool_calls
    ADD CONSTRAINT tool_calls_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES agent.threads(id);


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES billing.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.invoices
    ADD CONSTRAINT invoices_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES iam.users(id);


--
-- Name: invoices invoices_payer_org_id_fkey; Type: FK CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.invoices
    ADD CONSTRAINT invoices_payer_org_id_fkey FOREIGN KEY (payer_org_id) REFERENCES iam.organizations(id);


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES billing.invoices(id);


--
-- Name: receipts receipts_payment_id_fkey; Type: FK CONSTRAINT; Schema: billing; Owner: -
--

ALTER TABLE ONLY billing.receipts
    ADD CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES billing.payments(id);


--
-- Name: incident_reports incident_reports_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: cirt; Owner: -
--

ALTER TABLE ONLY cirt.incident_reports
    ADD CONSTRAINT incident_reports_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES iam.users(id);


--
-- Name: incident_reports incident_reports_reporter_user_id_fkey; Type: FK CONSTRAINT; Schema: cirt; Owner: -
--

ALTER TABLE ONLY cirt.incident_reports
    ADD CONSTRAINT incident_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES iam.users(id);


--
-- Name: attachments attachments_complaint_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.attachments
    ADD CONSTRAINT attachments_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES complaints.complaints(id);


--
-- Name: complaint_assignments complaint_assignments_assigned_by_user_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_assignments
    ADD CONSTRAINT complaint_assignments_assigned_by_user_id_fkey FOREIGN KEY (assigned_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: complaint_assignments complaint_assignments_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_assignments
    ADD CONSTRAINT complaint_assignments_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES iam.users(id) ON DELETE CASCADE;


--
-- Name: complaint_assignments complaint_assignments_complaint_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_assignments
    ADD CONSTRAINT complaint_assignments_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES complaints.complaints(id) ON DELETE CASCADE;


--
-- Name: complaint_sla_events complaint_sla_events_complaint_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_sla_events
    ADD CONSTRAINT complaint_sla_events_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES complaints.complaints(id) ON DELETE CASCADE;


--
-- Name: complaint_status_history complaint_status_history_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_status_history
    ADD CONSTRAINT complaint_status_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: complaint_status_history complaint_status_history_complaint_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaint_status_history
    ADD CONSTRAINT complaint_status_history_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES complaints.complaints(id) ON DELETE CASCADE;


--
-- Name: complaints complaints_application_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaints
    ADD CONSTRAINT complaints_application_id_fkey FOREIGN KEY (application_id) REFERENCES workflow.applications(id);


--
-- Name: complaints complaints_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaints
    ADD CONSTRAINT complaints_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES iam.users(id);


--
-- Name: complaints complaints_complainant_org_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaints
    ADD CONSTRAINT complaints_complainant_org_id_fkey FOREIGN KEY (complainant_org_id) REFERENCES iam.organizations(id);


--
-- Name: complaints complaints_complainant_user_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaints
    ADD CONSTRAINT complaints_complainant_user_id_fkey FOREIGN KEY (complainant_user_id) REFERENCES iam.users(id);


--
-- Name: complaints complaints_location_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.complaints
    ADD CONSTRAINT complaints_location_id_fkey FOREIGN KEY (location_id) REFERENCES qos.locations(id);


--
-- Name: messages messages_author_user_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.messages
    ADD CONSTRAINT messages_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES iam.users(id);


--
-- Name: messages messages_complaint_id_fkey; Type: FK CONSTRAINT; Schema: complaints; Owner: -
--

ALTER TABLE ONLY complaints.messages
    ADD CONSTRAINT messages_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES complaints.complaints(id);


--
-- Name: incident_attachments incident_attachments_incident_id_fkey; Type: FK CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.incident_attachments
    ADD CONSTRAINT incident_attachments_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES cyber.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_updates incident_updates_incident_id_fkey; Type: FK CONSTRAINT; Schema: cyber; Owner: -
--

ALTER TABLE ONLY cyber.incident_updates
    ADD CONSTRAINT incident_updates_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES cyber.incidents(id) ON DELETE CASCADE;


--
-- Name: accreditation_status_history accreditation_status_history_accreditation_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.accreditation_status_history
    ADD CONSTRAINT accreditation_status_history_accreditation_id_fkey FOREIGN KEY (accreditation_id) REFERENCES device.accreditations(id) ON DELETE CASCADE;


--
-- Name: accreditation_status_history accreditation_status_history_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.accreditation_status_history
    ADD CONSTRAINT accreditation_status_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: accreditations accreditations_organization_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.accreditations
    ADD CONSTRAINT accreditations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES iam.organizations(id);


--
-- Name: accreditations accreditations_user_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.accreditations
    ADD CONSTRAINT accreditations_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id);


--
-- Name: device_verification_batches device_verification_batches_applicant_org_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_batches
    ADD CONSTRAINT device_verification_batches_applicant_org_id_fkey FOREIGN KEY (applicant_org_id) REFERENCES iam.organizations(id) ON DELETE SET NULL;


--
-- Name: device_verification_batches device_verification_batches_applicant_user_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_batches
    ADD CONSTRAINT device_verification_batches_applicant_user_id_fkey FOREIGN KEY (applicant_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: device_verification_batches device_verification_batches_device_model_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_batches
    ADD CONSTRAINT device_verification_batches_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES device.catalog(id) ON DELETE SET NULL;


--
-- Name: device_verification_certificates device_verification_certificates_batch_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_certificates
    ADD CONSTRAINT device_verification_certificates_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES device.device_verification_batches(id) ON DELETE CASCADE;


--
-- Name: device_verification_certificates device_verification_certificates_certificate_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.device_verification_certificates
    ADD CONSTRAINT device_verification_certificates_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES docs.certificates(id) ON DELETE CASCADE;


--
-- Name: exemption_applications exemption_applications_customer_accreditation_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.exemption_applications
    ADD CONSTRAINT exemption_applications_customer_accreditation_id_fkey FOREIGN KEY (customer_accreditation_id) REFERENCES device.accreditations(id) ON DELETE SET NULL;


--
-- Name: exemption_applications exemption_applications_device_model_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.exemption_applications
    ADD CONSTRAINT exemption_applications_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES device.catalog(id) ON DELETE CASCADE;


--
-- Name: exemption_applications exemption_applications_manufacturer_accreditation_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.exemption_applications
    ADD CONSTRAINT exemption_applications_manufacturer_accreditation_id_fkey FOREIGN KEY (manufacturer_accreditation_id) REFERENCES device.accreditations(id) ON DELETE SET NULL;


--
-- Name: exemption_applications exemption_applications_workflow_application_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.exemption_applications
    ADD CONSTRAINT exemption_applications_workflow_application_id_fkey FOREIGN KEY (workflow_application_id) REFERENCES workflow.applications(id) ON DELETE CASCADE;


--
-- Name: type_approval_applications type_approval_applications_accreditation_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.type_approval_applications
    ADD CONSTRAINT type_approval_applications_accreditation_id_fkey FOREIGN KEY (accreditation_id) REFERENCES device.accreditations(id);


--
-- Name: type_approval_applications type_approval_applications_device_model_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.type_approval_applications
    ADD CONSTRAINT type_approval_applications_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES device.catalog(id);


--
-- Name: type_approval_applications type_approval_applications_workflow_application_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.type_approval_applications
    ADD CONSTRAINT type_approval_applications_workflow_application_id_fkey FOREIGN KEY (workflow_application_id) REFERENCES workflow.applications(id);


--
-- Name: type_approval_records type_approval_records_application_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.type_approval_records
    ADD CONSTRAINT type_approval_records_application_id_fkey FOREIGN KEY (application_id) REFERENCES device.type_approval_applications(id);


--
-- Name: type_approval_records type_approval_records_device_model_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.type_approval_records
    ADD CONSTRAINT type_approval_records_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES device.catalog(id);


--
-- Name: verification_items verification_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.verification_items
    ADD CONSTRAINT verification_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES device.device_verification_batches(id);


--
-- Name: verification_items verification_items_device_model_id_fkey; Type: FK CONSTRAINT; Schema: device; Owner: -
--

ALTER TABLE ONLY device.verification_items
    ADD CONSTRAINT verification_items_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES device.catalog(id);


--
-- Name: certificate_links certificate_links_application_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificate_links
    ADD CONSTRAINT certificate_links_application_id_fkey FOREIGN KEY (application_id) REFERENCES workflow.applications(id) ON DELETE SET NULL;


--
-- Name: certificate_links certificate_links_certificate_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificate_links
    ADD CONSTRAINT certificate_links_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES docs.certificates(id) ON DELETE CASCADE;


--
-- Name: certificate_links certificate_links_device_verification_batch_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificate_links
    ADD CONSTRAINT certificate_links_device_verification_batch_id_fkey FOREIGN KEY (device_verification_batch_id) REFERENCES device.device_verification_batches(id) ON DELETE SET NULL;


--
-- Name: certificate_links certificate_links_licence_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificate_links
    ADD CONSTRAINT certificate_links_licence_id_fkey FOREIGN KEY (licence_id) REFERENCES licensing.records(id) ON DELETE SET NULL;


--
-- Name: certificate_links certificate_links_type_approval_record_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificate_links
    ADD CONSTRAINT certificate_links_type_approval_record_id_fkey FOREIGN KEY (type_approval_record_id) REFERENCES device.type_approval_records(id) ON DELETE SET NULL;


--
-- Name: certificates certificates_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.certificates
    ADD CONSTRAINT certificates_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES iam.users(id);


--
-- Name: files files_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: -
--

ALTER TABLE ONLY docs.files
    ADD CONSTRAINT files_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES iam.users(id);


--
-- Name: referral_requests referral_requests_registrar_id_fkey; Type: FK CONSTRAINT; Schema: domain; Owner: -
--

ALTER TABLE ONLY domain.referral_requests
    ADD CONSTRAINT referral_requests_registrar_id_fkey FOREIGN KEY (registrar_id) REFERENCES domain.registrars(id) ON DELETE SET NULL;


--
-- Name: referral_requests referral_requests_zone_code_fkey; Type: FK CONSTRAINT; Schema: domain; Owner: -
--

ALTER TABLE ONLY domain.referral_requests
    ADD CONSTRAINT referral_requests_zone_code_fkey FOREIGN KEY (zone_code) REFERENCES domain.domain_zones(zone_code) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES iam.permissions(id);


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES iam.roles(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id);


--
-- Name: user_roles user_roles_organization_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT user_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES iam.organizations(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES iam.roles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id);


--
-- Name: external_records external_records_external_system_id_fkey; Type: FK CONSTRAINT; Schema: integration; Owner: -
--

ALTER TABLE ONLY integration.external_records
    ADD CONSTRAINT external_records_external_system_id_fkey FOREIGN KEY (external_system_id) REFERENCES integration.external_systems(id) ON DELETE CASCADE;


--
-- Name: sync_jobs sync_jobs_external_system_id_fkey; Type: FK CONSTRAINT; Schema: integration; Owner: -
--

ALTER TABLE ONLY integration.sync_jobs
    ADD CONSTRAINT sync_jobs_external_system_id_fkey FOREIGN KEY (external_system_id) REFERENCES integration.external_systems(id) ON DELETE CASCADE;


--
-- Name: consultation_submissions consultation_submissions_attachment_file_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultation_submissions
    ADD CONSTRAINT consultation_submissions_attachment_file_id_fkey FOREIGN KEY (attachment_file_id) REFERENCES docs.files(id) ON DELETE SET NULL;


--
-- Name: consultation_submissions consultation_submissions_consultation_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultation_submissions
    ADD CONSTRAINT consultation_submissions_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES knowledge.consultations(id) ON DELETE CASCADE;


--
-- Name: consultation_submissions consultation_submissions_submitted_by_org_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultation_submissions
    ADD CONSTRAINT consultation_submissions_submitted_by_org_id_fkey FOREIGN KEY (submitted_by_org_id) REFERENCES iam.organizations(id) ON DELETE SET NULL;


--
-- Name: consultation_submissions consultation_submissions_submitted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultation_submissions
    ADD CONSTRAINT consultation_submissions_submitted_by_user_id_fkey FOREIGN KEY (submitted_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: consultations consultations_document_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultations
    ADD CONSTRAINT consultations_document_id_fkey FOREIGN KEY (document_id) REFERENCES knowledge.documents(id) ON DELETE SET NULL;


--
-- Name: consultations consultations_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.consultations
    ADD CONSTRAINT consultations_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: document_chunks document_chunks_document_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.document_chunks
    ADD CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES knowledge.documents(id);


--
-- Name: document_tags document_tags_document_id_fkey; Type: FK CONSTRAINT; Schema: knowledge; Owner: -
--

ALTER TABLE ONLY knowledge.document_tags
    ADD CONSTRAINT document_tags_document_id_fkey FOREIGN KEY (document_id) REFERENCES knowledge.documents(id) ON DELETE CASCADE;


--
-- Name: applications applications_workflow_application_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.applications
    ADD CONSTRAINT applications_workflow_application_id_fkey FOREIGN KEY (workflow_application_id) REFERENCES workflow.applications(id);


--
-- Name: frequency_assignments frequency_assignments_licence_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.frequency_assignments
    ADD CONSTRAINT frequency_assignments_licence_id_fkey FOREIGN KEY (licence_id) REFERENCES licensing.records(id) ON DELETE CASCADE;


--
-- Name: licence_documents licence_documents_file_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_documents
    ADD CONSTRAINT licence_documents_file_id_fkey FOREIGN KEY (file_id) REFERENCES docs.files(id) ON DELETE CASCADE;


--
-- Name: licence_documents licence_documents_licence_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_documents
    ADD CONSTRAINT licence_documents_licence_id_fkey FOREIGN KEY (licence_id) REFERENCES licensing.records(id) ON DELETE CASCADE;


--
-- Name: licence_renewal_alerts licence_renewal_alerts_licence_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_renewal_alerts
    ADD CONSTRAINT licence_renewal_alerts_licence_id_fkey FOREIGN KEY (licence_id) REFERENCES licensing.records(id) ON DELETE CASCADE;


--
-- Name: licence_renewal_alerts licence_renewal_alerts_notification_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_renewal_alerts
    ADD CONSTRAINT licence_renewal_alerts_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notify.notifications(id) ON DELETE SET NULL;


--
-- Name: licence_status_history licence_status_history_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_status_history
    ADD CONSTRAINT licence_status_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: licence_status_history licence_status_history_licence_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.licence_status_history
    ADD CONSTRAINT licence_status_history_licence_id_fkey FOREIGN KEY (licence_id) REFERENCES licensing.records(id) ON DELETE CASCADE;


--
-- Name: public_register_entries public_register_entries_licence_record_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.public_register_entries
    ADD CONSTRAINT public_register_entries_licence_record_id_fkey FOREIGN KEY (licence_record_id) REFERENCES licensing.records(id) ON DELETE SET NULL;


--
-- Name: public_register_entries public_register_entries_organization_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.public_register_entries
    ADD CONSTRAINT public_register_entries_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES iam.organizations(id) ON DELETE SET NULL;


--
-- Name: radio_equipments radio_equipments_licence_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.radio_equipments
    ADD CONSTRAINT radio_equipments_licence_id_fkey FOREIGN KEY (licence_id) REFERENCES licensing.records(id) ON DELETE SET NULL;


--
-- Name: radio_equipments radio_equipments_licensee_org_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.radio_equipments
    ADD CONSTRAINT radio_equipments_licensee_org_id_fkey FOREIGN KEY (licensee_org_id) REFERENCES iam.organizations(id) ON DELETE SET NULL;


--
-- Name: records records_workflow_application_id_fkey; Type: FK CONSTRAINT; Schema: licensing; Owner: -
--

ALTER TABLE ONLY licensing.records
    ADD CONSTRAINT records_workflow_application_id_fkey FOREIGN KEY (workflow_application_id) REFERENCES workflow.applications(id);


--
-- Name: notification_deliveries notification_deliveries_notification_id_fkey; Type: FK CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_deliveries
    ADD CONSTRAINT notification_deliveries_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notify.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_events notification_events_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_events
    ADD CONSTRAINT notification_events_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_event_id_fkey; Type: FK CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notifications
    ADD CONSTRAINT notifications_event_id_fkey FOREIGN KEY (event_id) REFERENCES notify.notification_events(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: notify; Owner: -
--

ALTER TABLE ONLY notify.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES iam.users(id);


--
-- Name: location_ancestors location_ancestors_ancestor_location_id_fkey; Type: FK CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.location_ancestors
    ADD CONSTRAINT location_ancestors_ancestor_location_id_fkey FOREIGN KEY (ancestor_location_id) REFERENCES qos.locations(id) ON DELETE CASCADE;


--
-- Name: location_ancestors location_ancestors_location_id_fkey; Type: FK CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.location_ancestors
    ADD CONSTRAINT location_ancestors_location_id_fkey FOREIGN KEY (location_id) REFERENCES qos.locations(id) ON DELETE CASCADE;


--
-- Name: locations locations_parent_id_fkey; Type: FK CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.locations
    ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES qos.locations(id) ON DELETE SET NULL;


--
-- Name: observations observations_ingest_run_id_fkey; Type: FK CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.observations
    ADD CONSTRAINT observations_ingest_run_id_fkey FOREIGN KEY (ingest_run_id) REFERENCES qos.ingest_runs(id) ON DELETE SET NULL;


--
-- Name: observations observations_location_id_fkey; Type: FK CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.observations
    ADD CONSTRAINT observations_location_id_fkey FOREIGN KEY (location_id) REFERENCES qos.locations(id) ON DELETE CASCADE;


--
-- Name: observations observations_metric_code_fkey; Type: FK CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.observations
    ADD CONSTRAINT observations_metric_code_fkey FOREIGN KEY (metric_code) REFERENCES qos.metric_definitions(metric_code);


--
-- Name: observations observations_operator_id_fkey; Type: FK CONSTRAINT; Schema: qos; Owner: -
--

ALTER TABLE ONLY qos.observations
    ADD CONSTRAINT observations_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES qos.operators(id) ON DELETE CASCADE;


--
-- Name: plans plans_operator_id_fkey; Type: FK CONSTRAINT; Schema: tariffs; Owner: -
--

ALTER TABLE ONLY tariffs.plans
    ADD CONSTRAINT plans_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES qos.operators(id) ON DELETE CASCADE;


--
-- Name: price_items price_items_plan_id_fkey; Type: FK CONSTRAINT; Schema: tariffs; Owner: -
--

ALTER TABLE ONLY tariffs.price_items
    ADD CONSTRAINT price_items_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES tariffs.plans(id) ON DELETE CASCADE;


--
-- Name: application_comments application_comments_application_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_comments
    ADD CONSTRAINT application_comments_application_id_fkey FOREIGN KEY (application_id) REFERENCES workflow.applications(id) ON DELETE CASCADE;


--
-- Name: application_comments application_comments_author_user_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_comments
    ADD CONSTRAINT application_comments_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: application_documents application_documents_application_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_documents
    ADD CONSTRAINT application_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES workflow.applications(id) ON DELETE CASCADE;


--
-- Name: application_documents application_documents_file_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_documents
    ADD CONSTRAINT application_documents_file_id_fkey FOREIGN KEY (file_id) REFERENCES docs.files(id) ON DELETE CASCADE;


--
-- Name: application_documents application_documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_documents
    ADD CONSTRAINT application_documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: application_parties application_parties_application_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_parties
    ADD CONSTRAINT application_parties_application_id_fkey FOREIGN KEY (application_id) REFERENCES workflow.applications(id) ON DELETE CASCADE;


--
-- Name: application_parties application_parties_contact_user_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_parties
    ADD CONSTRAINT application_parties_contact_user_id_fkey FOREIGN KEY (contact_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: application_parties application_parties_organization_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_parties
    ADD CONSTRAINT application_parties_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES iam.organizations(id) ON DELETE SET NULL;


--
-- Name: application_status_history application_status_history_application_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_status_history
    ADD CONSTRAINT application_status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES workflow.applications(id) ON DELETE CASCADE;


--
-- Name: application_status_history application_status_history_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_status_history
    ADD CONSTRAINT application_status_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: application_tasks application_tasks_application_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_tasks
    ADD CONSTRAINT application_tasks_application_id_fkey FOREIGN KEY (application_id) REFERENCES workflow.applications(id) ON DELETE CASCADE;


--
-- Name: application_tasks application_tasks_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.application_tasks
    ADD CONSTRAINT application_tasks_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES iam.users(id) ON DELETE SET NULL;


--
-- Name: applications applications_applicant_org_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.applications
    ADD CONSTRAINT applications_applicant_org_id_fkey FOREIGN KEY (applicant_org_id) REFERENCES iam.organizations(id);


--
-- Name: applications applications_applicant_user_id_fkey; Type: FK CONSTRAINT; Schema: workflow; Owner: -
--

ALTER TABLE ONLY workflow.applications
    ADD CONSTRAINT applications_applicant_user_id_fkey FOREIGN KEY (applicant_user_id) REFERENCES iam.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict u2BUYZ31Vn78nqSGMLrog1nNU9tf2JwxpQ1zmS4Ow2rEjOI3eXHNNVXSewbKgOE

