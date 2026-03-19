"use client";

import { ChangeEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Wifi,
  PhoneCall,
  Tv,
  Package,
  CreditCard,
  AlertTriangle,
  FileText,
  User,
  Mail,
  Phone,
  Upload,
  Loader2,
  X,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "billing",
    label: "Billing Dispute",
    icon: CreditCard,
    color: "bg-red-50 border-red-200 text-red-700",
    selected: "bg-red-600 border-red-600 text-white",
  },
  {
    id: "coverage",
    label: "Poor Coverage",
    icon: Wifi,
    color: "bg-orange-50 border-orange-200 text-orange-700",
    selected: "bg-orange-600 border-orange-600 text-white",
  },
  {
    id: "service_quality",
    label: "Service Quality",
    icon: AlertTriangle,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    selected: "bg-yellow-600 border-yellow-600 text-white",
  },
  {
    id: "broadcasting",
    label: "Broadcasting",
    icon: Tv,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    selected: "bg-purple-600 border-purple-600 text-white",
  },
  {
    id: "postal",
    label: "Postal Services",
    icon: Package,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    selected: "bg-blue-600 border-blue-600 text-white",
  },
  {
    id: "other",
    label: "Other",
    icon: FileText,
    color: "bg-gray-50 border-gray-200 text-gray-700",
    selected: "bg-gray-700 border-gray-700 text-white",
  },
];

const OPERATORS = [
  "Mascom Wireless",
  "Orange Botswana",
  "Botswana Telecommunications Corporation (BTC)",
  "BoFiNet",
  "Botswana Post",
  "Other / Unknown",
];

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
];
const ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file: File) {
  const lowerName = file.name.toLowerCase();

  return (
    file.type.startsWith("image/") ||
    ALLOWED_FILE_MIME_TYPES.has(file.type) ||
    ALLOWED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  );
}

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function ComplaintSection() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [operator, setOperator] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submittedAttachmentCount, setSubmittedAttachmentCount] = useState(0);

  const canStep2 = category !== "";
  const canStep3 = operator !== "" && subject.trim() !== "" && description.trim().length >= 20;
  const canSubmitComplaint =
    name.trim() !== "" && email.trim().includes("@") && phone.trim() !== "" && consentGiven;

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...attachments];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      if (!isAllowedFile(file)) {
        errors.push(`${file.name} is not a supported file type.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds the 10 MB upload limit.`);
        continue;
      }

      if (nextFiles.some((existingFile) => getFileKey(existingFile) === getFileKey(file))) {
        continue;
      }

      if (nextFiles.length >= MAX_ATTACHMENTS) {
        errors.push(`You can attach up to ${MAX_ATTACHMENTS} files.`);
        break;
      }

      nextFiles.push(file);
    }

    setAttachments(nextFiles);
    setUploadError(errors.join(" "));
    event.target.value = "";
  }

  function handleRemoveAttachment(fileToRemove: File) {
    setAttachments((currentFiles) =>
      currentFiles.filter((file) => getFileKey(file) !== getFileKey(fileToRemove)),
    );
    setUploadError("");
  }

  async function handleSubmit() {
    if (!canSubmitComplaint || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();

      formData.append("category", category);
      formData.append("operator", operator);
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("incidentDate", incidentDate);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("consentGiven", String(consentGiven));

      for (const file of attachments) {
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
            attachments?: Array<{ name: string }>;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || "We could not submit your complaint right now. Please try again.",
        );
      }

      setRefNumber(payload?.id ?? "");
      setSubmittedAttachmentCount(payload?.attachments?.length ?? attachments.length);
      setStep(4);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not submit your complaint right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="complaints" className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Explainer */}
          <div className="lg:sticky lg:top-28">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest mb-4"
            >
              Consumer Protection
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-bold text-[#06193e] font-[family-name:var(--font-outfit)] mb-4"
            >
              File a Complaint
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 leading-relaxed mb-8"
            >
              BOCRA protects your rights as a consumer of communications
              services. If you have an unresolved issue with a licensed operator,
              submit your complaint here and we will investigate.
            </motion.p>

            <div className="space-y-4">
              {[
                { icon: CheckCircle2, title: "Instant Reference Number", desc: "Receive a unique tracking ID immediately after submission." },
                { icon: CheckCircle2, title: "24-Hour Acknowledgement", desc: "Our team will acknowledge your complaint within one business day." },
                { icon: CheckCircle2, title: "SMS & Email Updates", desc: "Track your complaint status in real-time via notifications." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#06193e] text-sm">{item.title}</p>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Step indicator */}
            {step < 4 && (
              <div className="mt-10 flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                        step >= s
                          ? "bg-[#027ac6] border-[#027ac6] text-white"
                          : "bg-white border-gray-200 text-gray-400"
                      }`}
                    >
                      {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    {s < 3 && (
                      <div className={`w-10 h-0.5 ${step > s ? "bg-[#027ac6]" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
                <span className="ml-2 text-sm text-gray-500 font-medium">
                  Step {step} of 3
                </span>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Step 1: Category */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <h3 className="text-xl font-bold text-[#06193e] mb-2">
                    What is your complaint about?
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Select the category that best describes your issue.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                          category === cat.id ? cat.selected : cat.color
                        }`}
                      >
                        <cat.icon className="w-6 h-6" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!canStep2}
                    onClick={() => setStep(2)}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#06193e] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#027ac6] transition-colors"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <h3 className="text-xl font-bold text-[#06193e] mb-2">
                    Complaint Details
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Provide as much detail as possible to help our team investigate.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Service Provider *
                      </label>
                      <select
                        value={operator}
                        onChange={(e) => setOperator(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#027ac6] focus:ring-2 focus:ring-[#027ac6]/10 bg-gray-50 focus:bg-white transition-all"
                      >
                        <option value="">Select operator...</option>
                        {OPERATORS.map((op) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Subject / Issue Title *
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Charged for services not rendered"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#027ac6] focus:ring-2 focus:ring-[#027ac6]/10 bg-gray-50 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Describe your complaint * <span className="text-gray-400 font-normal">(min. 20 characters)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Describe what happened, when it occurred, and what resolution you have already attempted..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#027ac6] focus:ring-2 focus:ring-[#027ac6]/10 bg-gray-50 focus:bg-white transition-all resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">{description.length} characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Date of Incident
                      </label>
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#027ac6] focus:ring-2 focus:ring-[#027ac6]/10 bg-gray-50 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Supporting Evidence
                      </label>
                      <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#027ac6] hover:bg-blue-50/30 transition-all">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-400">Upload screenshots, bills, or documents</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                          multiple
                          onChange={handleAttachmentChange}
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-400">
                        Optional. Up to {MAX_ATTACHMENTS} files, 10 MB each.
                      </p>
                      {uploadError && (
                        <p className="mt-2 text-xs font-medium text-red-600">{uploadError}</p>
                      )}
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {attachments.map((file) => (
                            <div
                              key={getFileKey(file)}
                              className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#06193e]">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(file)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
                                aria-label={`Remove ${file.name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      disabled={!canStep3}
                      onClick={() => setStep(3)}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#06193e] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#027ac6] transition-colors"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Contact */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8"
                >
                  <h3 className="text-xl font-bold text-[#06193e] mb-2">
                    Your Contact Details
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    We&apos;ll use these to send you updates and a reference number.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#027ac6] focus:ring-2 focus:ring-[#027ac6]/10 bg-gray-50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#027ac6] focus:ring-2 focus:ring-[#027ac6]/10 bg-gray-50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+267 7X XXX XXX"
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#027ac6] focus:ring-2 focus:ring-[#027ac6]/10 bg-gray-50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(event) => setConsentGiven(event.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#027ac6]"
                      />
                      <span className="text-xs text-gray-500 leading-relaxed">
                        I consent to BOCRA collecting and processing my personal information for the
                        purpose of investigating this complaint, in accordance with the{" "}
                        <a href="/privacy-notice" className="text-[#027ac6] underline">
                          BOCRA Privacy Notice
                        </a>{" "}
                        and the Botswana Data Protection Act 2024.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      disabled={!canSubmitComplaint || submitting}
                      onClick={handleSubmit}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#027ac6] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#005ea6] transition-colors"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>Submit Complaint</>
                      )}
                    </button>
                  </div>
                  {submitError && (
                    <p className="mt-3 text-sm font-medium text-red-600">{submitError}</p>
                  )}
                </motion.div>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#06193e] mb-3">
                    Complaint Submitted!
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
                    Your complaint has been received. You will receive a confirmation email and SMS within 24 hours.
                  </p>

                  <div className="w-full bg-[#06193e] rounded-2xl p-6 mb-6">
                    <p className="text-blue-200 text-sm font-medium mb-2">
                      Your Reference Number
                    </p>
                    <p className="text-3xl font-black text-white tracking-widest font-[family-name:var(--font-outfit)]">
                      {refNumber}
                    </p>
                    <p className="text-blue-300 text-xs mt-2">
                      Keep this number to track the status of your complaint
                    </p>
                  </div>

                  <div className="w-full space-y-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-4 text-left">
                    <p>✓ Complaint submitted for: <strong className="text-gray-800">{operator}</strong></p>
                    <p>✓ Category: <strong className="text-gray-800">{CATEGORIES.find(c => c.id === category)?.label}</strong></p>
                    <p>✓ Updates will be sent to: <strong className="text-gray-800">{email}</strong></p>
                    {submittedAttachmentCount > 0 && (
                      <p>✓ Supporting files attached: <strong className="text-gray-800">{submittedAttachmentCount}</strong></p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setStep(1);
                      setCategory("");
                      setOperator("");
                      setSubject("");
                      setDescription("");
                      setName("");
                      setEmail("");
                      setPhone("");
                      setIncidentDate("");
                      setAttachments([]);
                      setConsentGiven(false);
                      setUploadError("");
                      setSubmitError("");
                      setSubmittedAttachmentCount(0);
                      setRefNumber("");
                    }}
                    className="mt-6 w-full py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                  >
                    Submit Another Complaint
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
