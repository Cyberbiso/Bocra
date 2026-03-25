import { NextRequest, NextResponse } from "next/server";
import {
  EMPTY_COMPLAINT_DRAFT,
  type ComplaintAttachmentMeta,
  type ComplaintDraft,
  type ConsentUpdate,
  hasComplaintDraftContent,
  listMissingComplaintFields,
  mergeComplaintDraft,
  normalizeComplaintDraft,
} from "@/lib/complaints";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are the BOCRA smart assistant for the Botswana Communications Regulatory Authority.

You help website visitors with:
- licensing and regulatory guidance
- consumer complaints and complaint tracking
- tariffs, telecom services, and BOCRA public information
- BOCRA contact channels, services, and mandate

Return valid JSON only using this exact shape:
{
  "reply": "string",
  "intent": "general" | "complaint_intake",
  "complaintUpdates": {
    "category": "billing | coverage | service_quality | broadcasting | postal | other | ''",
    "operator": "string",
    "subject": "string",
    "description": "string",
    "incidentDate": "YYYY-MM-DD or ''",
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "consentUpdate": "unknown" | "granted" | "declined",
  "wantsToSubmitComplaint": true | false
}

Instructions:
- Use "complaint_intake" if the user wants to file, report, or continue a complaint, or if the current draft already contains complaint details.
- For complaint intake, extract any details the user just provided and leave unknown fields as empty strings.
- Supporting files may already be attached. You may mention that they are noted, but never claim you opened or read their contents.
- You may infer the complaint category from the user's description using: billing, coverage, service_quality, broadcasting, postal, other.
- Create a short subject when the user describes the issue clearly enough.
- Set description to a concise complaint summary when enough detail is available.
- Set consentUpdate to "granted" only if the user clearly says BOCRA may use their information to process the complaint.
- Set consentUpdate to "declined" only if the user clearly refuses consent.
- Set wantsToSubmitComplaint to true only if the user clearly says to submit, proceed, file it now, or continue with submission.
- Keep replies concise, helpful, and suitable for the general public in Botswana.
- When details are missing during complaint intake, ask for only the single most useful next item.
- For general BOCRA questions, answer normally and keep complaintUpdates empty.
- Do not wrap the JSON in markdown fences.
`.trim();

type ChatHistoryMessage = {
  role: "user" | "bot";
  content: string;
};

type ChatRequestBody = {
  message?: string;
  history?: ChatHistoryMessage[];
  complaintDraft?: Partial<ComplaintDraft> | null;
  attachments?: ComplaintAttachmentMeta[];
};

type ModelReply = {
  reply?: unknown;
  intent?: unknown;
  complaintUpdates?: unknown;
  consentUpdate?: unknown;
  wantsToSubmitComplaint?: unknown;
};

function extractText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

function parseModelReply(text: string): ModelReply | null {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const candidates = [cleaned];
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    candidates.push(cleaned.slice(jsonStart, jsonEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return parsed as ModelReply;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildHistoryText(history: ChatHistoryMessage[]) {
  return history
    .slice(-8)
    .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`)
    .join("\n");
}

function getNextFieldPrompt(field: string) {
  switch (field) {
    case "category":
      return "Please tell me what type of complaint this is, for example billing, coverage, service quality, broadcasting, or postal.";
    case "operator":
      return "Which service provider or operator is this complaint about?";
    case "subject":
      return "Please give me a short title for the issue.";
    case "description":
      return "Please describe what happened in a little more detail so I can capture the complaint properly.";
    case "name":
      return "Please share your full name.";
    case "email":
      return "Please share the email address BOCRA should use for updates.";
    case "phone":
      return "Please share the phone number BOCRA should use for updates.";
    case "consentGiven":
      return "Do you consent to BOCRA using your information to process this complaint?";
    default:
      return "Please share the next complaint detail so I can continue.";
  }
}

function buildFallbackReply(
  complaintFlowActive: boolean,
  draft: ComplaintDraft,
  missingFields: string[],
  readyToSubmit: boolean,
) {
  if (!complaintFlowActive) {
    return "I can help with BOCRA services, complaints, licensing, tariffs, and contact information.";
  }

  if (readyToSubmit) {
    return "I have enough information to file your complaint. Tell me to submit it now, or tap Submit Complaint below.";
  }

  if (hasComplaintDraftContent(draft) && missingFields.length > 0) {
    return getNextFieldPrompt(missingFields[0]);
  }

  return "Please tell me what happened, who the operator is, and how BOCRA can contact you.";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Please enter a message first." }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini is not configured yet. Add GEMINI_API_KEY to frontend/.env.local." },
        { status: 500 },
      );
    }

    const complaintDraft = normalizeComplaintDraft(body.complaintDraft ?? EMPTY_COMPLAINT_DRAFT);
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.filter(
          (attachment): attachment is ComplaintAttachmentMeta =>
            Boolean(attachment) &&
            typeof attachment.name === "string" &&
            typeof attachment.size === "number" &&
            typeof attachment.type === "string",
        )
      : [];
    const history = Array.isArray(body.history)
      ? body.history.filter(
          (entry): entry is ChatHistoryMessage =>
            Boolean(entry) &&
            (entry.role === "user" || entry.role === "bot") &&
            typeof entry.content === "string" &&
            entry.content.trim().length > 0,
        )
      : [];

    const prompt = [
      SYSTEM_PROMPT,
      "",
      "Current complaint draft:",
      JSON.stringify(complaintDraft),
      "",
      "Supporting files already attached:",
      attachments.length > 0 ? JSON.stringify(attachments) : "None.",
      "",
      "Recent conversation:",
      buildHistoryText(history) || "No previous messages.",
      "",
      `Latest user message: ${message}`,
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 768,
          },
        }),
        cache: "no-store",
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      const apiMessage =
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : "Gemini request failed.";

      return NextResponse.json({ error: apiMessage }, { status: response.status });
    }

    const rawText = extractText(payload);

    if (!rawText) {
      return NextResponse.json(
        { error: "Gemini did not return a text response. Please try again." },
        { status: 502 },
      );
    }

    const parsed = parseModelReply(rawText);
    if (!parsed) {
      const complaintFlowActive = hasComplaintDraftContent(complaintDraft);
      const missingFields = complaintFlowActive
        ? listMissingComplaintFields(complaintDraft)
        : [];

      return NextResponse.json({
        reply: rawText,
        complaintFlowActive,
        complaintDraft,
        attachmentCount: attachments.length,
        missingFields,
        readyToSubmit: complaintFlowActive && missingFields.length === 0,
        shouldSubmitComplaint: false,
        submittedComplaint: null,
      });
    }

    const consentUpdate: ConsentUpdate =
      parsed.consentUpdate === "granted" || parsed.consentUpdate === "declined"
        ? parsed.consentUpdate
        : "unknown";

    const mergedComplaintDraft = mergeComplaintDraft(
      complaintDraft,
      parsed.complaintUpdates && typeof parsed.complaintUpdates === "object"
        ? (parsed.complaintUpdates as Partial<ComplaintDraft>)
        : null,
      consentUpdate,
    );

    const complaintFlowActive =
      parsed.intent === "complaint_intake" || hasComplaintDraftContent(mergedComplaintDraft);
    const missingFields = complaintFlowActive
      ? listMissingComplaintFields(mergedComplaintDraft)
      : [];
    const readyToSubmit = complaintFlowActive && missingFields.length === 0;
    const wantsToSubmitComplaint = parsed.wantsToSubmitComplaint === true;

    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : buildFallbackReply(
            complaintFlowActive,
            mergedComplaintDraft,
            missingFields,
            readyToSubmit,
          );

    return NextResponse.json({
      reply,
      complaintFlowActive,
      complaintDraft: mergedComplaintDraft,
      attachmentCount: attachments.length,
      missingFields,
      readyToSubmit,
      shouldSubmitComplaint: complaintFlowActive && wantsToSubmitComplaint && readyToSubmit,
      submittedComplaint: null,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while contacting Gemini. Please try again." },
      { status: 500 },
    );
  }
}
