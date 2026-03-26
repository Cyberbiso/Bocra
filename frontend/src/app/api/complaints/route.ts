import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
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

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `/api/complaints?${query}` : "/api/complaints";

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
