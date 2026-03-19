export type ComplaintField =
  | "category"
  | "operator"
  | "subject"
  | "description"
  | "incidentDate"
  | "name"
  | "email"
  | "phone"
  | "consentGiven";

export type ComplaintDraft = {
  category: string;
  operator: string;
  subject: string;
  description: string;
  incidentDate: string;
  name: string;
  email: string;
  phone: string;
  consentGiven: boolean;
};

export type ConsentUpdate = "unknown" | "granted" | "declined";

export type ComplaintAttachmentMeta = {
  name: string;
  size: number;
  type: string;
};

export const MAX_COMPLAINT_ATTACHMENTS = 5;
export const MAX_COMPLAINT_FILE_SIZE = 10 * 1024 * 1024;
export const COMPLAINT_FILE_INPUT_ACCEPT =
  "image/*,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp";

const ALLOWED_COMPLAINT_FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
];

const ALLOWED_COMPLAINT_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const EMPTY_COMPLAINT_DRAFT: ComplaintDraft = {
  category: "",
  operator: "",
  subject: "",
  description: "",
  incidentDate: "",
  name: "",
  email: "",
  phone: "",
  consentGiven: false,
};

export function formatComplaintFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getComplaintAttachmentKey(file: {
  name: string;
  size: number;
  lastModified?: number;
}) {
  return `${file.name}-${file.size}-${file.lastModified ?? 0}`;
}

export function isAllowedComplaintAttachment(file: {
  name: string;
  type?: string;
}) {
  const lowerName = file.name.toLowerCase();

  return (
    typeof file.type === "string" &&
    (file.type.startsWith("image/") ||
      ALLOWED_COMPLAINT_FILE_MIME_TYPES.has(file.type) ||
      ALLOWED_COMPLAINT_FILE_EXTENSIONS.some((extension) =>
        lowerName.endsWith(extension),
      ))
  );
}

export const COMPLAINT_FIELD_LABELS: Record<ComplaintField, string> = {
  category: "Category",
  operator: "Service provider",
  subject: "Issue title",
  description: "Complaint details",
  incidentDate: "Incident date",
  name: "Full name",
  email: "Email address",
  phone: "Phone number",
  consentGiven: "Privacy consent",
};

const REQUIRED_FIELDS: ComplaintField[] = [
  "category",
  "operator",
  "subject",
  "description",
  "name",
  "email",
  "phone",
  "consentGiven",
];

const ALLOWED_CATEGORIES = new Set([
  "billing",
  "coverage",
  "service_quality",
  "broadcasting",
  "postal",
  "other",
]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value: unknown) {
  const category = normalizeText(value).toLowerCase();

  if (!category) return "";
  if (ALLOWED_CATEGORIES.has(category)) return category;
  if (category.includes("bill")) return "billing";
  if (category.includes("cover") || category.includes("network")) return "coverage";
  if (category.includes("service") || category.includes("quality")) return "service_quality";
  if (category.includes("broadcast")) return "broadcasting";
  if (category.includes("postal") || category.includes("post")) return "postal";

  return "other";
}

export function normalizeComplaintDraft(
  draft?: Partial<ComplaintDraft> | null,
): ComplaintDraft {
  return {
    category: normalizeCategory(draft?.category),
    operator: normalizeText(draft?.operator),
    subject: normalizeText(draft?.subject),
    description: normalizeText(draft?.description),
    incidentDate: normalizeText(draft?.incidentDate),
    name: normalizeText(draft?.name),
    email: normalizeText(draft?.email),
    phone: normalizeText(draft?.phone),
    consentGiven: Boolean(draft?.consentGiven),
  };
}

export function mergeComplaintDraft(
  baseDraft: ComplaintDraft,
  updates?: Partial<ComplaintDraft> | null,
  consentUpdate: ConsentUpdate = "unknown",
) {
  const base = normalizeComplaintDraft(baseDraft);
  const incoming = normalizeComplaintDraft(updates);

  return {
    category: incoming.category || base.category,
    operator: incoming.operator || base.operator,
    subject: incoming.subject || base.subject,
    description: incoming.description || base.description,
    incidentDate: incoming.incidentDate || base.incidentDate,
    name: incoming.name || base.name,
    email: incoming.email || base.email,
    phone: incoming.phone || base.phone,
    consentGiven:
      consentUpdate === "granted"
        ? true
        : consentUpdate === "declined"
          ? false
          : base.consentGiven,
  };
}

export function hasComplaintDraftContent(draft: ComplaintDraft) {
  return (
    Boolean(draft.category) ||
    Boolean(draft.operator) ||
    Boolean(draft.subject) ||
    Boolean(draft.description) ||
    Boolean(draft.incidentDate) ||
    Boolean(draft.name) ||
    Boolean(draft.email) ||
    Boolean(draft.phone) ||
    draft.consentGiven
  );
}

export function listMissingComplaintFields(draft: ComplaintDraft): ComplaintField[] {
  const normalizedDraft = normalizeComplaintDraft(draft);

  return REQUIRED_FIELDS.filter((field) => {
    if (field === "consentGiven") {
      return !normalizedDraft.consentGiven;
    }

    if (field === "description") {
      return normalizedDraft.description.length < 20;
    }

    if (field === "email") {
      return !normalizedDraft.email || !normalizedDraft.email.includes("@");
    }

    return !normalizedDraft[field];
  });
}

export function validateComplaintDraft(draft: ComplaintDraft) {
  const normalizedDraft = normalizeComplaintDraft(draft);
  const missingFields = listMissingComplaintFields(normalizedDraft);

  if (missingFields.includes("category") || missingFields.includes("operator") || missingFields.includes("subject") || missingFields.includes("description")) {
    return "Please complete all complaint details before submitting.";
  }

  if (normalizedDraft.description.length < 20) {
    return "Please provide a fuller complaint description before submitting.";
  }

  if (missingFields.includes("name") || missingFields.includes("email") || missingFields.includes("phone")) {
    return "Please provide your full contact details before submitting.";
  }

  if (!normalizedDraft.email.includes("@")) {
    return "Please provide a valid email address before submitting.";
  }

  if (!normalizedDraft.consentGiven) {
    return "Please consent to the privacy notice before submitting your complaint.";
  }

  return null;
}

export function createComplaintReferenceNumber() {
  const year = new Date().getFullYear();
  const serial = Math.floor(100000 + Math.random() * 900000);
  return `BCR-${year}-${serial}`;
}

export function createComplaintSubmissionResponse(
  draft: ComplaintDraft,
  attachments: ComplaintAttachmentMeta[] = [],
) {
  return {
    message: "Complaint submitted successfully",
    id: createComplaintReferenceNumber(),
    status: "Received",
    complaint: normalizeComplaintDraft(draft),
    attachments,
  };
}
