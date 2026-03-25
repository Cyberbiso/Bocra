import { NextRequest, NextResponse } from "next/server";
import {
  createComplaintSubmissionResponse,
  isAllowedComplaintAttachment,
  MAX_COMPLAINT_ATTACHMENTS,
  MAX_COMPLAINT_FILE_SIZE,
  normalizeComplaintDraft,
  validateComplaintDraft,
} from "@/lib/complaints";

export const runtime = "nodejs";

// ─── Shared types ─────────────────────────────────────────────────────────────

// TODO: Replace mock GET handler with real BOCRA portal API calls:
//  - List (own):  GET https://customerportal.bocra.org.bw/api/complaints?userId={id}&status={s}&page={n}
//  - List (all):  GET https://customerportal.bocra.org.bw/api/complaints?status={s}&page={n}  (officer only)
//  - Detail:      GET https://customerportal.bocra.org.bw/api/complaints/{caseNumber}
//  Map portal response fields (e.g. "complaintStatus") to ComplaintStatus below.

export type ComplaintStatus = "NEW" | "ASSIGNED" | "PENDING" | "RESOLVED" | "ESCALATED" | "CLOSED";

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

// ─── Mock data ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export const OPERATORS = [
  "Mascom Wireless",
  "Orange Botswana",
  "BTC Broadband",
  "Botswana Postal Services",
];

const MOCK_COMPLAINTS: Complaint[] = [
  { id: "c01", caseNumber: "CMP-2025-00841", subject: "No network signal for 3 days in Gaborone West", operator: "Mascom Wireless", category: "Network Coverage", status: "ASSIGNED", submittedDate: "2025-03-18", expectedResolution: "2025-03-25", assignedOfficer: "Officer T. Kgosi", submittedBy: "user_001" },
  { id: "c02", caseNumber: "CMP-2025-00839", subject: "Overcharged on data bundle — BWP 120 deducted incorrectly", operator: "Orange Botswana", category: "Billing Dispute", status: "PENDING", submittedDate: "2025-03-17", expectedResolution: "2025-03-24", assignedOfficer: "Officer B. Seretse", submittedBy: "user_001" },
  { id: "c03", caseNumber: "CMP-2025-00831", subject: "International call rates not disclosed before purchase", operator: "BTC Broadband", category: "Consumer Rights", status: "ESCALATED", submittedDate: "2025-03-14", expectedResolution: "2025-03-21", assignedOfficer: "Officer T. Kgosi", submittedBy: "user_002" },
  { id: "c04", caseNumber: "CMP-2025-00810", subject: "Broadband speeds consistently below contracted 20 Mbps", operator: "BTC Broadband", category: "Quality of Service", status: "RESOLVED", submittedDate: "2025-03-10", expectedResolution: "2025-03-17", assignedOfficer: "Officer M. Dube", submittedBy: "user_002" },
  { id: "c05", caseNumber: "CMP-2025-00798", subject: "SIM card swap without customer consent", operator: "Mascom Wireless", category: "Security / Fraud", status: "ESCALATED", submittedDate: "2025-03-08", expectedResolution: "2025-03-15", assignedOfficer: "Officer B. Seretse", submittedBy: "user_003" },
  { id: "c06", caseNumber: "CMP-2025-00774", subject: "Postal parcel lost in transit — tracking shows delivered", operator: "Botswana Postal Services", category: "Postal Services", status: "NEW", submittedDate: "2025-03-05", expectedResolution: "2025-03-19", assignedOfficer: null, submittedBy: "user_001" },
  { id: "c07", caseNumber: "CMP-2025-00751", subject: "Unintelligible bill statement — no itemised breakdown", operator: "Orange Botswana", category: "Billing Dispute", status: "CLOSED", submittedDate: "2025-02-28", expectedResolution: "2025-03-07", assignedOfficer: "Officer M. Dube", submittedBy: "user_003" },
  { id: "c08", caseNumber: "CMP-2025-00730", subject: "Number portability transfer delayed beyond 24-hour SLA", operator: "Mascom Wireless", category: "Number Portability", status: "RESOLVED", submittedDate: "2025-02-24", expectedResolution: "2025-03-03", assignedOfficer: "Officer T. Kgosi", submittedBy: "user_002" },
  { id: "c09", caseNumber: "CMP-2025-00714", subject: "Premium SMS subscription activated without consent", operator: "Orange Botswana", category: "Unsolicited Services", status: "ASSIGNED", submittedDate: "2025-02-20", expectedResolution: "2025-02-27", assignedOfficer: "Officer B. Seretse", submittedBy: "user_001" },
  { id: "c10", caseNumber: "CMP-2025-00690", subject: "Roaming charges applied while physically in Botswana", operator: "BTC Broadband", category: "Billing Dispute", status: "CLOSED", submittedDate: "2025-02-15", expectedResolution: "2025-02-22", assignedOfficer: "Officer M. Dube", submittedBy: "user_003" },
  { id: "c11", caseNumber: "CMP-2025-00671", subject: "Repeated dropped calls during peak hours in Francistown", operator: "Mascom Wireless", category: "Network Coverage", status: "PENDING", submittedDate: "2025-02-11", expectedResolution: "2025-02-18", assignedOfficer: "Officer T. Kgosi", submittedBy: "user_002" },
  { id: "c12", caseNumber: "CMP-2025-00655", subject: "Internet service suspended before contract end date", operator: "BTC Broadband", category: "Consumer Rights", status: "NEW", submittedDate: "2025-02-08", expectedResolution: "2025-02-22", assignedOfficer: null, submittedBy: "user_001" },
];

// ─── GET — list complaints ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role") ?? "public";
  const userId = searchParams.get("userId") ?? "user_001";
  const status = searchParams.get("status") ?? "ALL";
  const operator = searchParams.get("operator") ?? "ALL";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  await new Promise((r) => setTimeout(r, 200));

  let results = [...MOCK_COMPLAINTS];

  if (role !== "officer") {
    results = results.filter((c) => c.submittedBy === userId);
  }
  if (status !== "ALL") {
    results = results.filter((c) => c.status === status);
  }
  if (operator !== "ALL") {
    results = results.filter((c) => c.operator === operator);
  }
  if (dateFrom) results = results.filter((c) => c.submittedDate >= dateFrom);
  if (dateTo) results = results.filter((c) => c.submittedDate <= dateTo);

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const data = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return NextResponse.json<ComplaintsResponse>({
    data,
    meta: { total, page: safePage, pageSize: PAGE_SIZE, totalPages },
  });
}

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const complaintDraft = normalizeComplaintDraft({
      category: getStringValue(formData.get("category")),
      operator: getStringValue(formData.get("operator")),
      subject: getStringValue(formData.get("subject")),
      description: getStringValue(formData.get("description")),
      incidentDate: getStringValue(formData.get("incidentDate")),
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
      return NextResponse.json(
        { error: validationError },
        { status: 400 },
      );
    }

    if (attachments.length > MAX_COMPLAINT_ATTACHMENTS) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_COMPLAINT_ATTACHMENTS} supporting files.` },
        { status: 400 },
      );
    }

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

      // Read each file once so the upload is fully received and validated server-side.
      await file.arrayBuffer();
    }

    return NextResponse.json(
      createComplaintSubmissionResponse(
        complaintDraft,
        attachments.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
        })),
      ),
    );
  } catch (error) {
    console.error("Complaint submission error", error);

    return NextResponse.json(
      { error: "We could not process your complaint right now. Please try again." },
      { status: 500 },
    );
  }
}
