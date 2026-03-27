import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionUserFromRequest } from "@/lib/server-auth";
import {
  isAllowedComplaintAttachment,
  MAX_COMPLAINT_ATTACHMENTS,
  MAX_COMPLAINT_FILE_SIZE,
  normalizeComplaintDraft,
  type ComplaintDraft,
  validateComplaintDraft,
} from "@/lib/complaints";

export const runtime = "nodejs";

export type ComplaintStatus =
  | "NEW"
  | "ASSIGNED"
  | "PENDING"
  | "RESOLVED"
  | "ESCALATED"
  | "CLOSED";

export interface Complaint {
  id: string;
  caseNumber: string;
  subject: string;
  operator: string;
  category: string;
  status: ComplaintStatus;
  submittedDate: string;
  expectedResolution: string;
  assignedOfficer: string | null;
  submittedBy: string;
}

export interface ComplaintsResponse {
  data: Complaint[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

/** Map a raw Supabase row to the frontend Complaint shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToComplaint(row: any): Complaint {
  const isoDate = (v: string | null | undefined) =>
    v ? v.slice(0, 10) : "—";

  const status = (row.current_status_code ?? "NEW") as ComplaintStatus;

  return {
    id: String(row.id),
    caseNumber: row.complaint_number ?? `CMP-${row.id}`,
    subject: row.subject ?? "(no subject)",
    operator:
      row.service_provider_name ?? row.operator_code ?? "Unknown Operator",
    category: row.complaint_type_code ?? "General",
    status,
    submittedDate: isoDate(row.created_at),
    expectedResolution: isoDate(
      row.expected_resolution_at ?? row.sla_due_at,
    ),
    // assigned_to_user_id is a UUID — show it as-is until an iam schema join is available
    assignedOfficer: row.assigned_to_user_id ?? null,
    submittedBy: String(row.complainant_user_id ?? ""),
  };
}

// ─── GET /api/complaints ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const sessionUser = await getSessionUserFromRequest(request);
  const cookieHeader = request.headers.get("cookie") ?? "";
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `/api/complaints?${query}` : "/api/complaints";

  try {
    const upstream = await backendFetch(path, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (upstream.ok) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }
  } catch {
    // Fall back to direct Supabase reads below.
  }

  // Fall back to FastAPI proxy when Supabase is not configured
  if (!supabase) {
    try {
      const upstream = await backendFetch(path, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json(
        { error: "We could not load complaints right now." },
        { status: 502 },
      );
    }
  }

  // ── Supabase path ──────────────────────────────────────────────────────────
  const params = request.nextUrl.searchParams;
  const page     = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = 20;
  const from     = (page - 1) * pageSize;
  const to       = from + pageSize - 1;

  const statusFilter   = params.get("status");
  const operatorFilter = params.get("operator");
  const dateFrom       = params.get("dateFrom");
  const dateTo         = params.get("dateTo");

  if (!sessionUser) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 },
    );
  }

  try {
    // Supabase non-public schema: complaints.complaints
    // Attempt cross-schema join to iam.users for officer full name.
    // If the join column is unavailable the query falls back gracefully.
    let q = supabase
      .schema("complaints")
      .from("complaints")
      .select(
        `
        id,
        complaint_number,
        subject,
        service_provider_name,
        operator_code,
        complaint_type_code,
        current_status_code,
        created_at,
        expected_resolution_at,
        sla_due_at,
        assigned_to_user_id,
        complainant_user_id
        `,
        { count: "exact" },
      )
      .range(from, to)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "ALL") {
      q = q.eq("current_status_code", statusFilter);
    }
    if (sessionUser.role !== "officer" && sessionUser.role !== "admin") {
      q = q.eq("complainant_user_id", sessionUser.id);
    }
    if (operatorFilter && operatorFilter !== "ALL") {
      q = q.eq("service_provider_name", operatorFilter);
    }
    if (dateFrom) {
      q = q.gte("created_at", dateFrom);
    }
    if (dateTo) {
      q = q.lte("created_at", dateTo + "T23:59:59");
    }

    const { data: rows, count, error } = await q;

    if (error) {
      console.error("Supabase complaints query error", error);
      return NextResponse.json(
        { error: "We could not load complaints right now." },
        { status: 502 },
      );
    }

    const total      = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const data: Complaint[] = (rows ?? []).map(rowToComplaint);

    const response: ComplaintsResponse = {
      data,
      meta: { total, page, pageSize, totalPages },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Complaints GET error", err);
    return NextResponse.json(
      { error: "We could not load complaints right now." },
      { status: 500 },
    );
  }
}

// ─── POST /api/complaints ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const formData = await request.formData();

    const complaintDraft = normalizeComplaintDraft({
      category: getStringValue(formData.get("category")),
      operator: getStringValue(formData.get("operator")),
      subject: getStringValue(formData.get("subject")),
      description: getStringValue(formData.get("description")),
      incidentDate: getStringValue(formData.get("incidentDate")),
      location: getStringValue(formData.get("location")),
      reportedToProvider: getStringValue(
        formData.get("reportedToProvider"),
      ) as ComplaintDraft["reportedToProvider"],
      providerCaseNumber: getStringValue(formData.get("providerCaseNumber")),
      preferredContactMethod: getStringValue(
        formData.get("preferredContactMethod"),
      ) as ComplaintDraft["preferredContactMethod"],
      name: getStringValue(formData.get("name")),
      email: getStringValue(formData.get("email")),
      phone: getStringValue(formData.get("phone")),
      consentGiven: getStringValue(formData.get("consentGiven")) === "true",
    });

    const attachments = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const validationError = validateComplaintDraft(complaintDraft);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (attachments.length > MAX_COMPLAINT_ATTACHMENTS) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_COMPLAINT_ATTACHMENTS} supporting files.` },
        { status: 400 },
      );
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append("category", complaintDraft.category);
    upstreamFormData.append("operator", complaintDraft.operator);
    upstreamFormData.append("subject", complaintDraft.subject);
    upstreamFormData.append("description", complaintDraft.description);
    if (complaintDraft.incidentDate) {
      upstreamFormData.append("incidentDate", complaintDraft.incidentDate);
    }
    if (complaintDraft.location) {
      upstreamFormData.append("location", complaintDraft.location);
    }
    if (complaintDraft.reportedToProvider) {
      upstreamFormData.append("reportedToProvider", complaintDraft.reportedToProvider);
    }
    if (complaintDraft.providerCaseNumber) {
      upstreamFormData.append("providerCaseNumber", complaintDraft.providerCaseNumber);
    }
    if (complaintDraft.preferredContactMethod) {
      upstreamFormData.append(
        "preferredContactMethod",
        complaintDraft.preferredContactMethod,
      );
    }
    upstreamFormData.append("name", complaintDraft.name);
    upstreamFormData.append("email", complaintDraft.email);
    upstreamFormData.append("phone", complaintDraft.phone);
    upstreamFormData.append("consentGiven", String(complaintDraft.consentGiven));

    for (const file of attachments) {
      if (!isAllowedComplaintAttachment(file)) {
        return NextResponse.json(
          { error: `${file.name} is not a supported file type.` },
          { status: 400 },
        );
      }

      if (file.size > MAX_COMPLAINT_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} exceeds the 10 MB upload limit.` },
          { status: 400 },
        );
      }

      upstreamFormData.append("attachments", file, file.name);
    }

    const upstream = await backendFetch("/api/complaints", {
      method: "POST",
      headers: { cookie: cookieHeader },
      body: upstreamFormData,
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);
    return NextResponse.json(
      data ?? { error: "We could not process your complaint right now. Please try again." },
      { status: upstream.status || 500 },
    );
  } catch (error) {
    console.error("Complaint submission proxy error", error);
    return NextResponse.json(
      { error: "We could not process your complaint right now. Please try again." },
      { status: 500 },
    );
  }
}
