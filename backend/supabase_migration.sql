-- ====================================================
-- BOCRA Platform — PostgreSQL Schema Migration
-- Project: jivowhffzzwigakstobm (Supabase)
-- Generated: 2026-03-25
-- Paste this into the Supabase SQL Editor and run.
-- ====================================================

-- 1. Custom schemas
CREATE SCHEMA IF NOT EXISTS "iam";
CREATE SCHEMA IF NOT EXISTS "workflow";
CREATE SCHEMA IF NOT EXISTS "complaints";
CREATE SCHEMA IF NOT EXISTS "licensing";
CREATE SCHEMA IF NOT EXISTS "device";
CREATE SCHEMA IF NOT EXISTS "billing";
CREATE SCHEMA IF NOT EXISTS "docs";
CREATE SCHEMA IF NOT EXISTS "knowledge";
CREATE SCHEMA IF NOT EXISTS "agent";
CREATE SCHEMA IF NOT EXISTS "notify";
CREATE SCHEMA IF NOT EXISTS "cirt";

-- 2. Tables (topological / FK-safe order)
CREATE TABLE complaints.categories (
	id VARCHAR NOT NULL, 
	category_code TEXT NOT NULL, 
	name TEXT NOT NULL, 
	sector_code TEXT NOT NULL, 
	default_sla_hours INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (category_code)
);

CREATE TABLE device.catalog (
	id VARCHAR NOT NULL, 
	brand_name TEXT NOT NULL, 
	marketing_name TEXT NOT NULL, 
	model_name TEXT NOT NULL, 
	device_type TEXT NOT NULL, 
	is_sim_enabled BOOLEAN NOT NULL, 
	technical_spec JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE iam.organizations (
	id VARCHAR NOT NULL, 
	legal_name TEXT NOT NULL, 
	trading_name TEXT, 
	org_type_code TEXT NOT NULL, 
	registration_number TEXT, 
	tax_number TEXT, 
	status_code TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (registration_number)
);

CREATE TABLE iam.permissions (
	id VARCHAR NOT NULL, 
	permission_code TEXT NOT NULL, 
	name TEXT NOT NULL, 
	module_code TEXT NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (permission_code)
);

CREATE TABLE iam.roles (
	id VARCHAR NOT NULL, 
	role_code TEXT NOT NULL, 
	name TEXT NOT NULL, 
	scope_code TEXT NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (role_code)
);

CREATE TABLE iam.users (
	id VARCHAR NOT NULL, 
	email TEXT NOT NULL, 
	password_hash TEXT, 
	auth_provider TEXT NOT NULL, 
	first_name TEXT NOT NULL, 
	last_name TEXT NOT NULL, 
	phone_e164 TEXT, 
	national_id TEXT, 
	passport_number TEXT, 
	status_code TEXT NOT NULL, 
	email_verified_at TIMESTAMP WITH TIME ZONE, 
	last_login_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (email)
);

CREATE TABLE knowledge.documents (
	id VARCHAR NOT NULL, 
	title TEXT NOT NULL, 
	document_type_code TEXT NOT NULL, 
	source_url TEXT, 
	file_path TEXT, 
	published_at TIMESTAMP WITH TIME ZONE, 
	status_code TEXT NOT NULL, 
	excerpt TEXT, 
	category TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE workflow.events (
	id VARCHAR NOT NULL, 
	resource_kind TEXT NOT NULL, 
	resource_id TEXT NOT NULL, 
	event_type_code TEXT NOT NULL, 
	label TEXT NOT NULL, 
	actor_name TEXT NOT NULL, 
	actor_role TEXT NOT NULL, 
	is_visible_to_applicant BOOLEAN NOT NULL, 
	comment TEXT, 
	occurred_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	metadata JSON NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE agent.threads (
	id VARCHAR NOT NULL, 
	external_thread_id TEXT NOT NULL, 
	user_id VARCHAR, 
	organization_id VARCHAR, 
	context_scope_code TEXT NOT NULL, 
	title TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (external_thread_id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id), 
	FOREIGN KEY(organization_id) REFERENCES iam.organizations (id)
);

CREATE TABLE billing.invoices (
	id VARCHAR NOT NULL, 
	invoice_number TEXT NOT NULL, 
	application_id TEXT, 
	payer_org_id VARCHAR, 
	owner_user_id VARCHAR, 
	description TEXT NOT NULL, 
	service_name TEXT NOT NULL, 
	currency_code TEXT NOT NULL, 
	subtotal_amount NUMERIC(12, 2) NOT NULL, 
	vat_amount NUMERIC(12, 2) NOT NULL, 
	total_amount NUMERIC(12, 2) NOT NULL, 
	due_date DATE NOT NULL, 
	status_code TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (invoice_number), 
	FOREIGN KEY(payer_org_id) REFERENCES iam.organizations (id), 
	FOREIGN KEY(owner_user_id) REFERENCES iam.users (id)
);

CREATE TABLE cirt.incident_reports (
	id VARCHAR NOT NULL, 
	reference_number TEXT NOT NULL, 
	reporter_user_id VARCHAR, 
	reporter_name TEXT NOT NULL, 
	reporter_email TEXT NOT NULL, 
	reporter_phone TEXT, 
	reporter_org TEXT, 
	incident_type_code TEXT NOT NULL, 
	severity_code TEXT NOT NULL, 
	title TEXT NOT NULL, 
	description TEXT NOT NULL, 
	affected_systems TEXT, 
	incident_date DATE, 
	status_code TEXT NOT NULL, 
	assigned_to_user_id VARCHAR, 
	resolution_notes TEXT, 
	resolved_at TIMESTAMP WITH TIME ZONE, 
	metadata JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (reference_number), 
	FOREIGN KEY(reporter_user_id) REFERENCES iam.users (id), 
	FOREIGN KEY(assigned_to_user_id) REFERENCES iam.users (id)
);

CREATE TABLE device.accreditations (
	id VARCHAR NOT NULL, 
	organization_id VARCHAR, 
	user_id VARCHAR, 
	accreditation_type_code TEXT NOT NULL, 
	reference_number TEXT, 
	status_code TEXT NOT NULL, 
	valid_from DATE, 
	valid_to DATE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(organization_id) REFERENCES iam.organizations (id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id)
);

CREATE TABLE device.verification_items (
	id VARCHAR NOT NULL, 
	imei TEXT NOT NULL, 
	serial_number TEXT, 
	device_model_id VARCHAR, 
	verification_source TEXT NOT NULL, 
	verification_status_code TEXT NOT NULL, 
	remarks TEXT, 
	response_payload JSON NOT NULL, 
	verified_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(device_model_id) REFERENCES device.catalog (id)
);

CREATE TABLE docs.certificates (
	id VARCHAR NOT NULL, 
	certificate_number TEXT NOT NULL, 
	certificate_type TEXT NOT NULL, 
	holder_name TEXT NOT NULL, 
	device_name TEXT, 
	issue_date DATE NOT NULL, 
	expiry_date DATE NOT NULL, 
	status_code TEXT NOT NULL, 
	qr_token TEXT NOT NULL, 
	application_id TEXT, 
	owner_user_id VARCHAR, 
	issued_by TEXT NOT NULL, 
	remarks TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (certificate_number), 
	UNIQUE (qr_token), 
	FOREIGN KEY(owner_user_id) REFERENCES iam.users (id)
);

CREATE TABLE iam.role_permissions (
	id VARCHAR NOT NULL, 
	role_id VARCHAR NOT NULL, 
	permission_id VARCHAR NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(role_id) REFERENCES iam.roles (id), 
	FOREIGN KEY(permission_id) REFERENCES iam.permissions (id)
);

CREATE TABLE iam.sessions (
	id VARCHAR NOT NULL, 
	token TEXT NOT NULL, 
	user_id VARCHAR NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id)
);

CREATE TABLE iam.user_roles (
	id VARCHAR NOT NULL, 
	user_id VARCHAR NOT NULL, 
	role_id VARCHAR NOT NULL, 
	organization_id VARCHAR, 
	effective_from TIMESTAMP WITH TIME ZONE NOT NULL, 
	effective_to TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id), 
	FOREIGN KEY(role_id) REFERENCES iam.roles (id), 
	FOREIGN KEY(organization_id) REFERENCES iam.organizations (id)
);

CREATE TABLE knowledge.document_chunks (
	id VARCHAR NOT NULL, 
	document_id VARCHAR NOT NULL, 
	chunk_index INTEGER NOT NULL, 
	source_url TEXT, 
	page_number INTEGER, 
	content TEXT NOT NULL, 
	token_count INTEGER, 
	embedding JSON, 
	metadata JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES knowledge.documents (id)
);

CREATE TABLE notify.notifications (
	id VARCHAR NOT NULL, 
	user_id VARCHAR, 
	channel_code TEXT NOT NULL, 
	title TEXT NOT NULL, 
	body TEXT NOT NULL, 
	status_code TEXT NOT NULL, 
	sent_at TIMESTAMP WITH TIME ZONE, 
	source_table TEXT, 
	source_id TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES iam.users (id)
);

CREATE TABLE workflow.applications (
	id VARCHAR NOT NULL, 
	application_number TEXT NOT NULL, 
	application_type_code TEXT NOT NULL, 
	service_module_code TEXT NOT NULL, 
	applicant_user_id VARCHAR, 
	applicant_org_id VARCHAR, 
	title TEXT NOT NULL, 
	description TEXT, 
	current_status_code TEXT NOT NULL, 
	current_stage_code TEXT, 
	public_tracker_token TEXT, 
	submitted_at TIMESTAMP WITH TIME ZONE, 
	expected_decision_at TIMESTAMP WITH TIME ZONE, 
	due_at TIMESTAMP WITH TIME ZONE, 
	priority_code TEXT NOT NULL, 
	source_channel TEXT NOT NULL, 
	external_system_code TEXT, 
	external_record_id TEXT, 
	metadata JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (application_number), 
	FOREIGN KEY(applicant_user_id) REFERENCES iam.users (id), 
	FOREIGN KEY(applicant_org_id) REFERENCES iam.organizations (id), 
	UNIQUE (public_tracker_token)
);

CREATE TABLE agent.actions (
	id VARCHAR NOT NULL, 
	thread_id VARCHAR NOT NULL, 
	action_type_code TEXT NOT NULL, 
	target_table TEXT NOT NULL, 
	target_id TEXT, 
	confirmation_state TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(thread_id) REFERENCES agent.threads (id)
);

CREATE TABLE agent.messages (
	id VARCHAR NOT NULL, 
	thread_id VARCHAR NOT NULL, 
	role_code TEXT NOT NULL, 
	content TEXT NOT NULL, 
	cited_document_ids JSON NOT NULL, 
	tool_invocations JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(thread_id) REFERENCES agent.threads (id)
);

CREATE TABLE agent.tool_calls (
	id VARCHAR NOT NULL, 
	thread_id VARCHAR NOT NULL, 
	tool_name TEXT NOT NULL, 
	request_json JSON NOT NULL, 
	response_json JSON NOT NULL, 
	result_status_code TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(thread_id) REFERENCES agent.threads (id)
);

CREATE TABLE billing.payments (
	id VARCHAR NOT NULL, 
	invoice_id VARCHAR NOT NULL, 
	gateway_code TEXT NOT NULL, 
	gateway_reference TEXT NOT NULL, 
	amount_paid NUMERIC(12, 2) NOT NULL, 
	status_code TEXT NOT NULL, 
	paid_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(invoice_id) REFERENCES billing.invoices (id)
);

CREATE TABLE complaints.complaints (
	id VARCHAR NOT NULL, 
	complaint_number TEXT NOT NULL, 
	application_id VARCHAR, 
	complainant_user_id VARCHAR, 
	complainant_org_id VARCHAR, 
	subject TEXT NOT NULL, 
	complaint_type_code TEXT NOT NULL, 
	service_provider_name TEXT, 
	operator_code TEXT, 
	location_text TEXT, 
	provider_contacted_first BOOLEAN NOT NULL, 
	narrative TEXT NOT NULL, 
	current_status_code TEXT NOT NULL, 
	assigned_to_user_id VARCHAR, 
	sla_due_at TIMESTAMP WITH TIME ZONE, 
	expected_resolution_at TIMESTAMP WITH TIME ZONE, 
	resolved_at TIMESTAMP WITH TIME ZONE, 
	resolution_summary TEXT, 
	metadata JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (complaint_number), 
	FOREIGN KEY(application_id) REFERENCES workflow.applications (id), 
	FOREIGN KEY(complainant_user_id) REFERENCES iam.users (id), 
	FOREIGN KEY(complainant_org_id) REFERENCES iam.organizations (id), 
	FOREIGN KEY(assigned_to_user_id) REFERENCES iam.users (id)
);

CREATE TABLE device.type_approval_applications (
	id VARCHAR NOT NULL, 
	workflow_application_id VARCHAR NOT NULL, 
	device_model_id VARCHAR NOT NULL, 
	accreditation_id VARCHAR, 
	sample_imei TEXT, 
	country_of_manufacture TEXT, 
	form_data JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_application_id) REFERENCES workflow.applications (id), 
	FOREIGN KEY(device_model_id) REFERENCES device.catalog (id), 
	FOREIGN KEY(accreditation_id) REFERENCES device.accreditations (id)
);

CREATE TABLE licensing.applications (
	id VARCHAR NOT NULL, 
	workflow_application_id VARCHAR NOT NULL, 
	category_code TEXT NOT NULL, 
	licence_type_name TEXT NOT NULL, 
	applicant_name TEXT NOT NULL, 
	applicant_email TEXT NOT NULL, 
	coverage_area TEXT, 
	form_data JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_application_id) REFERENCES workflow.applications (id)
);

CREATE TABLE licensing.records (
	id VARCHAR NOT NULL, 
	workflow_application_id VARCHAR, 
	licence_number TEXT NOT NULL, 
	licence_type TEXT NOT NULL, 
	category TEXT NOT NULL, 
	sub_category TEXT, 
	status_code TEXT NOT NULL, 
	issue_date DATE NOT NULL, 
	expiry_date DATE NOT NULL, 
	holder_name TEXT NOT NULL, 
	holder_address TEXT, 
	coverage_area TEXT, 
	frequency_band TEXT, 
	assigned_officer_name TEXT, 
	assigned_officer_dept TEXT, 
	metadata JSON NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_application_id) REFERENCES workflow.applications (id), 
	UNIQUE (licence_number)
);

CREATE TABLE billing.receipts (
	id VARCHAR NOT NULL, 
	payment_id VARCHAR NOT NULL, 
	receipt_number TEXT NOT NULL, 
	file_path TEXT, 
	issued_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(payment_id) REFERENCES billing.payments (id), 
	UNIQUE (receipt_number)
);

CREATE TABLE complaints.attachments (
	id VARCHAR NOT NULL, 
	complaint_id VARCHAR NOT NULL, 
	file_name TEXT NOT NULL, 
	content_type TEXT NOT NULL, 
	size_bytes INTEGER NOT NULL, 
	storage_path TEXT NOT NULL, 
	uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(complaint_id) REFERENCES complaints.complaints (id)
);

CREATE TABLE complaints.messages (
	id VARCHAR NOT NULL, 
	complaint_id VARCHAR NOT NULL, 
	author_user_id VARCHAR, 
	author_name TEXT NOT NULL, 
	author_role TEXT NOT NULL, 
	visibility_code TEXT NOT NULL, 
	body TEXT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(complaint_id) REFERENCES complaints.complaints (id), 
	FOREIGN KEY(author_user_id) REFERENCES iam.users (id)
);

CREATE TABLE device.type_approval_records (
	id VARCHAR NOT NULL, 
	device_model_id VARCHAR NOT NULL, 
	certificate_id TEXT, 
	application_id VARCHAR, 
	status_code TEXT NOT NULL, 
	approval_date DATE, 
	applicant_name TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(device_model_id) REFERENCES device.catalog (id), 
	FOREIGN KEY(application_id) REFERENCES device.type_approval_applications (id)
);

-- 3. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sessions_token ON iam.sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON iam.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON iam.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints.complaints (complainant_user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints.complaints (current_status_code);
CREATE INDEX IF NOT EXISTS idx_workflow_apps_user ON workflow.applications (applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_apps_status ON workflow.applications (current_status_code);
CREATE INDEX IF NOT EXISTS idx_workflow_events_resource ON workflow.events (resource_kind, resource_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notify.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON billing.invoices (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_verification_imei ON device.verification_items (imei);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_document ON knowledge.document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_cirt_reporter ON cirt.incident_reports (reporter_user_id);

-- Done.