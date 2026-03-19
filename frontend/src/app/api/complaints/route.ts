import { NextResponse } from "next/server";
import {
  createComplaintSubmissionResponse,
  isAllowedComplaintAttachment,
  MAX_COMPLAINT_ATTACHMENTS,
  MAX_COMPLAINT_FILE_SIZE,
  normalizeComplaintDraft,
  validateComplaintDraft,
} from "@/lib/complaints";

export const runtime = "nodejs";

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
