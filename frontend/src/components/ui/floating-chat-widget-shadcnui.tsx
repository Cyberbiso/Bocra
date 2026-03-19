"use client";

import {
  COMPLAINT_FILE_INPUT_ACCEPT,
  COMPLAINT_FIELD_LABELS,
  EMPTY_COMPLAINT_DRAFT,
  formatComplaintFileSize,
  getComplaintAttachmentKey,
  hasComplaintDraftContent,
  isAllowedComplaintAttachment,
  listMissingComplaintFields,
  MAX_COMPLAINT_ATTACHMENTS,
  MAX_COMPLAINT_FILE_SIZE,
  normalizeComplaintDraft,
  type ComplaintAttachmentMeta,
  type ComplaintDraft,
  type ComplaintField,
} from "@/lib/complaints";
import { MessageLoading } from "@/components/ui/message-loading";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Bot,
  MessageSquare,
  Paperclip,
  Send,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, Fragment, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

type SubmittedComplaint = {
  id: string;
  status: string;
  attachmentCount: number;
};

const QUICK_PROMPTS = [
  "What services does BOCRA regulate?",
  "How do I contact BOCRA?",
  "How do I submit a complaint?",
];

const OPEN_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.96,
    transformOrigin: "bottom right",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 24,
      stiffness: 260,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.97,
    transition: { duration: 0.18 },
  },
};

const MESSAGE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 28 },
  },
};

type MessageBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseMessageBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length === 0) return;
    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" ").trim(),
    });
    paragraphLines.length = 0;
  }

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push({
      type: "list",
      items: [...listItems],
    });
    listItems = [];
  }

  for (const rawLine of content.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      listItems.push(line.replace(/^[-*]\s+/, "").trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: content }];
}

function renderInlineFormatting(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={`${part}-${index}`} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
    });
}

function FormattedMessage({
  content,
  role,
}: {
  content: string;
  role: Message["role"];
}) {
  const blocks = parseMessageBlocks(content);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className={cn(
                "space-y-2 pl-5",
                role === "user" ? "list-disc marker:text-white/80" : "list-disc marker:text-[#027ac6]",
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`item-${itemIndex}`}>{renderInlineFormatting(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
            {renderInlineFormatting(block.text)}
          </p>
        );
      })}
    </div>
  );
}

const COMPLAINT_SUMMARY_FIELDS: ComplaintField[] = [
  "category",
  "operator",
  "subject",
  "name",
  "email",
  "phone",
  "consentGiven",
];

function formatComplaintValue(field: ComplaintField, draft: ComplaintDraft) {
  if (field === "consentGiven") {
    return draft.consentGiven ? "Given" : "";
  }

  if (field === "category") {
    return draft.category
      ? draft.category
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "";
  }

  return draft[field];
}

function isComplaintField(value: unknown): value is ComplaintField {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(COMPLAINT_FIELD_LABELS, value)
  );
}

function getAttachmentMetadata(files: File[]): ComplaintAttachmentMeta[] {
  return files.map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
  }));
}

function buildAttachmentOnlyMessage(files: File[]) {
  return [
    "I have attached supporting evidence for my complaint.",
    "",
    ...files.map((file) => `- ${file.name}`),
  ].join("\n");
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Dumela. I am the BOCRA smart assistant. Ask me about licensing, complaints, tariffs, or BOCRA services and I will guide you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [complaintDraft, setComplaintDraft] = useState<ComplaintDraft>(EMPTY_COMPLAINT_DRAFT);
  const [complaintFlowActive, setComplaintFlowActive] = useState(false);
  const [complaintMissingFields, setComplaintMissingFields] = useState<ComplaintField[]>([]);
  const [complaintReadyToSubmit, setComplaintReadyToSubmit] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<SubmittedComplaint | null>(null);
  const [chatAttachments, setChatAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasUserMessages = messages.some((message) => message.role === "user");
  const effectiveComplaintFlowActive = complaintFlowActive || chatAttachments.length > 0;
  const effectiveComplaintMissingFields = effectiveComplaintFlowActive
    ? complaintMissingFields.length > 0
      ? complaintMissingFields
      : listMissingComplaintFields(complaintDraft)
    : [];
  const readyForComplaintSubmit =
    (complaintReadyToSubmit || effectiveComplaintMissingFields.length === 0) &&
    (effectiveComplaintFlowActive || hasComplaintDraftContent(complaintDraft));
  const complaintProgress = Math.round(
    ((COMPLAINT_SUMMARY_FIELDS.length - effectiveComplaintMissingFields.length) /
      COMPLAINT_SUMMARY_FIELDS.length) *
      100,
  );
  const capturedComplaintItems = COMPLAINT_SUMMARY_FIELDS.map((field) => ({
    label: COMPLAINT_FIELD_LABELS[field],
    value: formatComplaintValue(field, complaintDraft),
  })).filter((item) => Boolean(item.value));
  const missingFieldPreview = effectiveComplaintMissingFields.slice(0, 3);
  const showQuickPrompts =
    !hasUserMessages && input.trim().length === 0 && chatAttachments.length === 0;
  const showComplaintCard =
    effectiveComplaintFlowActive ||
    hasComplaintDraftContent(complaintDraft) ||
    submittedComplaint !== null ||
    chatAttachments.length > 0;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading, isOpen]);

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...chatAttachments];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      if (!isAllowedComplaintAttachment(file)) {
        errors.push(`${file.name} is not a supported file type.`);
        continue;
      }

      if (file.size > MAX_COMPLAINT_FILE_SIZE) {
        errors.push(`${file.name} exceeds the 10 MB upload limit.`);
        continue;
      }

      if (
        nextFiles.some(
          (existingFile) =>
            getComplaintAttachmentKey(existingFile) === getComplaintAttachmentKey(file),
        )
      ) {
        continue;
      }

      if (nextFiles.length >= MAX_COMPLAINT_ATTACHMENTS) {
        errors.push(`You can attach up to ${MAX_COMPLAINT_ATTACHMENTS} files.`);
        break;
      }

      nextFiles.push(file);
    }

    setChatAttachments(nextFiles);
    setAttachmentError(errors.join(" "));
    setComplaintFlowActive(true);
    setComplaintMissingFields(listMissingComplaintFields(complaintDraft));
    setSubmittedComplaint(null);
    event.target.value = "";
  }

  function handleRemoveAttachment(fileToRemove: File) {
    const nextAttachments = chatAttachments.filter(
      (file) =>
        getComplaintAttachmentKey(file) !== getComplaintAttachmentKey(fileToRemove),
    );

    setChatAttachments(nextAttachments);
    if (nextAttachments.length === 0 && !hasComplaintDraftContent(complaintDraft)) {
      setComplaintFlowActive(false);
      setComplaintMissingFields([]);
      setComplaintReadyToSubmit(false);
    }
    setAttachmentError("");
  }

  async function submitComplaintFromChat(draft: ComplaintDraft) {
    const formData = new FormData();

    formData.append("category", draft.category);
    formData.append("operator", draft.operator);
    formData.append("subject", draft.subject);
    formData.append("description", draft.description);
    formData.append("incidentDate", draft.incidentDate);
    formData.append("name", draft.name);
    formData.append("email", draft.email);
    formData.append("phone", draft.phone);
    formData.append("consentGiven", String(draft.consentGiven));

    for (const file of chatAttachments) {
      formData.append("attachments", file);
    }

    const response = await fetch("/api/complaints", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          id?: string;
          status?: string;
          attachments?: ComplaintAttachmentMeta[];
        }
      | null;

    if (!response.ok) {
      throw new Error(
        payload?.error || "We could not submit your complaint right now. Please try again.",
      );
    }

    const attachmentCount = Array.isArray(payload?.attachments)
      ? payload.attachments.length
      : chatAttachments.length;
    const submitted = {
      id: payload?.id || "BCR-PENDING",
      status: payload?.status || "Received",
      attachmentCount,
    };

    setSubmittedComplaint(submitted);
    setComplaintDraft(EMPTY_COMPLAINT_DRAFT);
    setComplaintFlowActive(false);
    setComplaintMissingFields([]);
    setComplaintReadyToSubmit(false);
    setChatAttachments([]);
    setAttachmentError("");
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-submitted`,
        role: "bot",
        content: [
          "Your complaint has been submitted successfully.",
          "",
          `- **Reference Number:** ${submitted.id}`,
          `- **Status:** ${submitted.status}`,
          `- **Supporting Files:** ${submitted.attachmentCount}`,
        ].join("\n"),
      },
    ]);
  }

  async function sendMessage(rawMessage?: string) {
    const typedContent = (rawMessage ?? input).trim();
    const attachmentMessage = chatAttachments.length > 0
      ? buildAttachmentOnlyMessage(chatAttachments)
      : "";
    const content = typedContent || attachmentMessage;
    const requestMessage =
      typedContent || "I have attached supporting evidence for my complaint.";

    if (!content || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content,
    };

    setSubmittedComplaint(null);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = [...messages, userMessage].map(({ role, content: historyContent }) => ({
        role,
        content: historyContent,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: requestMessage,
          history,
          complaintDraft,
          attachments: getAttachmentMetadata(chatAttachments),
        }),
      });

      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error || "Failed to fetch assistant response",
        );
      }

      const data = await res.json();
      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply
          : "I could not generate a response just now. Please try again.";
      const nextComplaintDraft = normalizeComplaintDraft(
        data?.complaintDraft ?? EMPTY_COMPLAINT_DRAFT,
      );
      const nextComplaintFlowActive = Boolean(data?.complaintFlowActive);
      const nextMissingFields = Array.isArray(data?.missingFields)
        ? data.missingFields.filter(isComplaintField)
        : [];

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot`,
          role: "bot",
          content: reply,
        },
      ]);
      setComplaintDraft(nextComplaintDraft);
      setComplaintFlowActive(nextComplaintFlowActive);
      setComplaintMissingFields(nextMissingFields);
      setComplaintReadyToSubmit(Boolean(data?.readyToSubmit));

      if (data?.shouldSubmitComplaint) {
        await submitComplaintFromChat(nextComplaintDraft);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "bot",
          content:
            error instanceof Error
              ? error.message
              : "I hit a network error. Please try again shortly.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-4 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="floating-chat-window"
            variants={OPEN_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[min(88vw,21rem)] overflow-hidden rounded-[2rem] border border-white/55 bg-white/88 shadow-[0_28px_80px_-24px_rgba(6,25,62,0.55)] backdrop-blur-2xl"
          >
            <div className="relative overflow-hidden border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(117,170,219,0.45),_transparent_42%),linear-gradient(135deg,_rgba(6,25,62,0.98),_rgba(2,122,198,0.95))] p-5 text-white">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#D4921A]/15 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] border border-white/15 bg-white/12 shadow-lg shadow-black/10 backdrop-blur-md">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold tracking-tight">
                        BOCRA Assistant
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/16 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/90 transition-colors hover:bg-white/20"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex justify-start">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-2 text-[11px] text-blue-50/90">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  BOCRA guidance
                </div>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex h-[18rem] flex-col gap-4 overflow-y-auto bg-[linear-gradient(180deg,_rgba(250,252,255,0.96),_rgba(237,245,255,0.76))] px-4 py-5"
            >
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isWelcome = message.id === "welcome" && !isUser;

                if (isUser) {
                  return (
                    <motion.div
                      key={message.id}
                      variants={MESSAGE_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      className="flex items-end justify-end gap-3"
                    >
                      <div className="max-w-[82%] rounded-[1.5rem] rounded-br-md bg-[#027ac6] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                        <FormattedMessage content={message.content} role={message.role} />
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                        <User className="h-4 w-4 text-[#027ac6]" />
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={message.id}
                    variants={MESSAGE_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-start gap-3"
                  >
                    <div className="flex items-end gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#75AADB]/20 bg-white shadow-sm">
                        <Bot className="h-4 w-4 text-[#06193e]" />
                      </div>

                      <div className="max-w-[82%] rounded-[1.5rem] rounded-bl-md border border-slate-200/80 bg-white/92 px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                        <FormattedMessage content={message.content} role={message.role} />
                      </div>
                    </div>

                    {isWelcome && showQuickPrompts && (
                      <div className="ml-12 flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => void sendMessage(prompt)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#75AADB] hover:bg-[#75AADB]/10 hover:text-[#06193e]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#75AADB]/20 bg-white shadow-sm">
                    <Bot className="h-4 w-4 text-[#06193e]" />
                  </div>
                  <div className="rounded-[1.5rem] rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-[#027ac6] shadow-sm">
                    <MessageLoading />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="border-t border-slate-200/70 bg-white/88 p-4 backdrop-blur-xl">
              {showComplaintCard && (
                <div
                  className={cn(
                    "mb-4 rounded-[1.4rem] border px-4 py-3 shadow-sm",
                    submittedComplaint
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-[#75AADB]/20 bg-white/92",
                  )}
                >
                  {submittedComplaint ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Complaint Submitted
                      </p>
                      <p className="text-lg font-black tracking-wide text-[#06193e]">
                        {submittedComplaint.id}
                      </p>
                      <p className="text-xs text-emerald-700">
                        Status: {submittedComplaint.status}
                      </p>
                      {submittedComplaint.attachmentCount > 0 && (
                        <p className="text-xs text-emerald-700">
                          Supporting files: {submittedComplaint.attachmentCount}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#027ac6]">
                            Complaint Intake
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#06193e]">
                            {readyForComplaintSubmit
                              ? "Everything needed is ready"
                              : `${COMPLAINT_SUMMARY_FIELDS.length - effectiveComplaintMissingFields.length}/${COMPLAINT_SUMMARY_FIELDS.length} details captured`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            I&apos;ll keep the complaint details and contact info together while you chat.
                          </p>
                        </div>
                        {readyForComplaintSubmit && (
                          <button
                            type="button"
                            onClick={() => void sendMessage("Please submit my complaint now.")}
                            disabled={isLoading}
                            className="shrink-0 rounded-full bg-[#06193e] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#027ac6] disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Submit Complaint
                          </button>
                        )}
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,_#06193e,_#027ac6)] transition-all"
                          style={{ width: `${Math.max(10, complaintProgress)}%` }}
                        />
                      </div>

                      {capturedComplaintItems.length > 0 || chatAttachments.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {capturedComplaintItems.map((item) => (
                            <div
                              key={item.label}
                              className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600"
                            >
                              <span className="text-slate-400">{item.label}:</span>
                              <span className="max-w-[8.5rem] truncate font-semibold text-[#06193e]">
                                {item.value}
                              </span>
                            </div>
                          ))}
                          {chatAttachments.length > 0 && (
                            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                              <span className="text-slate-400">Files:</span>
                              <span className="font-semibold text-[#06193e]">
                                {chatAttachments.length} attached
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">
                          Start by describing the problem, the operator involved, or your contact details.
                        </p>
                      )}

                      {!readyForComplaintSubmit && effectiveComplaintMissingFields.length > 0 && (
                        <>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {missingFieldPreview.map((field) => (
                              <span
                                key={field}
                                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
                              >
                                {COMPLAINT_FIELD_LABELS[field]}
                              </span>
                            ))}
                            {effectiveComplaintMissingFields.length > missingFieldPreview.length && (
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">
                                +{effectiveComplaintMissingFields.length - missingFieldPreview.length} more
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-xs text-slate-500">
                            Next up: {COMPLAINT_FIELD_LABELS[effectiveComplaintMissingFields[0]]}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {chatAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {chatAttachments.map((file) => (
                    <div
                      key={getComplaintAttachmentKey(file)}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
                    >
                      <span className="max-w-[9rem] truncate text-[11px] font-medium text-slate-600">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatComplaintFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file)}
                        className="rounded-full text-slate-400 transition-colors hover:text-red-500"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {attachmentError && (
                <p className="mb-3 text-xs font-medium text-red-600">{attachmentError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={COMPLAINT_FILE_INPUT_ACCEPT}
                  multiple
                  onChange={handleAttachmentChange}
                />
                <label className="sr-only" htmlFor="bocra-chat-input">
                  Message BOCRA Assistant
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || chatAttachments.length >= MAX_COMPLAINT_ATTACHMENTS}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors",
                    isLoading || chatAttachments.length >= MAX_COMPLAINT_ATTACHMENTS
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-[#027ac6]/40 hover:bg-white hover:text-[#027ac6]",
                  )}
                  aria-label="Attach supporting files"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  id="bocra-chat-input"
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    effectiveComplaintFlowActive
                      ? "Next complaint detail..."
                      : "Ask BOCRA anything..."
                  }
                  className="h-12 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#027ac6]/40 focus:bg-white focus:ring-4 focus:ring-[#027ac6]/10"
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && chatAttachments.length === 0) || isLoading}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all",
                    (!input.trim() && chatAttachments.length === 0) || isLoading
                      ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                      : "bg-[#06193e] hover:-translate-y-0.5 hover:bg-[#027ac6] hover:shadow-[0_12px_28px_-14px_rgba(2,122,198,0.75)]",
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span>Powered by AfroNative Solutions</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 shadow-[0_22px_55px_-18px_rgba(6,25,62,0.65)] transition-all duration-300",
          isOpen
            ? "bg-[#872030] text-white"
            : "bg-[linear-gradient(135deg,_#06193e,_#027ac6)] text-white",
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-inherit opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-45" />
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}
