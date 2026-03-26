export type PublicChatAction = {
  label: string;
  href: string;
};

type PublicChatKnowledgeEntry = {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  actions: PublicChatAction[];
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "do",
  "for",
  "i",
  "is",
  "me",
  "my",
  "of",
  "please",
  "the",
  "to",
  "where",
]);

const KNOWLEDGE_ENTRIES: PublicChatKnowledgeEntry[] = [
  {
    id: "services-overview",
    title: "BOCRA services overview",
    summary:
      "BOCRA helps the public with consumer complaints, licence verification, type approval information, .bw domain guidance, public documents, consultations, tenders, and general regulatory information.",
    keywords: ["services", "help", "offer", "regulate", "what does bocra do", "bocra services"],
    actions: [
      { label: "Open services hub", href: "/services" },
      { label: "File a complaint", href: "/complaints" },
      { label: "View documents", href: "/documents" },
    ],
  },
  {
    id: "complaints",
    title: "Complaints and consumer help",
    summary:
      "Customers can submit complaints to BOCRA, learn the complaint process, track an existing complaint, and get consumer guidance before escalating an issue.",
    keywords: ["complaint", "report issue", "consumer", "track complaint", "file complaint", "complain"],
    actions: [
      { label: "Open complaints", href: "/complaints" },
      { label: "Track complaint", href: "/complaints/track" },
      { label: "Complaint process", href: "/complaints/process" },
    ],
  },
  {
    id: "licence-verification",
    title: "Licence verification",
    summary:
      "Visitors can verify BOCRA-issued licences and check licensing-related guidance through the licence verification service.",
    keywords: ["licence verification", "license verification", "verify licence", "verify license", "licensing"],
    actions: [
      { label: "Open licence verification", href: "/services/licence-verification" },
      { label: "Open services", href: "/services" },
    ],
  },
  {
    id: "type-approval",
    title: "Type approval",
    summary:
      "The type approval service helps users search approved devices, understand certificate status, and begin type approval workflows through the portal.",
    keywords: ["type approval", "approved devices", "certificate", "device approval"],
    actions: [
      { label: "Open type approval", href: "/services/type-approval" },
      { label: "Register on portal", href: "/register" },
    ],
  },
  {
    id: "domain-registration",
    title: ".bw domain registration",
    summary:
      "BOCRA provides guidance on .bw domain registration, accredited registrars, and domain-related requirements.",
    keywords: ["domain", ".bw", "register domain", "domain registration", "registrar"],
    actions: [
      { label: "Open domain registration", href: "/services/domain-registration" },
      { label: "View services", href: "/services" },
    ],
  },
  {
    id: "documents",
    title: "Documents and consultations",
    summary:
      "Users can browse public documents, legislation, consultations, and annual reports from the BOCRA website.",
    keywords: ["documents", "legislation", "reports", "consultation", "consultations", "public documents"],
    actions: [
      { label: "Open documents", href: "/documents" },
      { label: "Open consultations", href: "/consultations" },
    ],
  },
  {
    id: "tenders",
    title: "Tenders and procurement",
    summary:
      "The tenders section publishes current procurement opportunities and tender results for public review.",
    keywords: ["tender", "procurement", "rfp", "tender results"],
    actions: [
      { label: "Open tenders", href: "/tenders" },
      { label: "Open tender results", href: "/tenders/results" },
    ],
  },
  {
    id: "contact",
    title: "BOCRA contact channels",
    summary:
      "BOCRA can be reached through the public website, the complaints process, and the general office contact channels listed on the site.",
    keywords: ["contact", "phone", "email", "reach bocra", "call bocra"],
    actions: [
      { label: "Open home page", href: "/" },
      { label: "Open complaints", href: "/complaints" },
    ],
  },
  {
    id: "register-portal",
    title: "Portal registration and login",
    summary:
      "Visitors can create a BOCRA portal account through the registration page and sign in through the portal login page.",
    keywords: ["register", "portal", "login", "sign in", "create account"],
    actions: [
      { label: "Open registration", href: "/register" },
      { label: "Open portal login", href: "/login" },
    ],
  },
  {
    id: "site-navigation",
    title: "Website navigation",
    summary:
      "The main public sections are About, Mandate, Services, Documents, Complaints, Media, Tenders, Register, and Portal login.",
    keywords: ["navigate", "website", "where is", "find page", "take me to", "open page"],
    actions: [
      { label: "Open services", href: "/services" },
      { label: "Open complaints", href: "/complaints" },
      { label: "Open documents", href: "/documents" },
    ],
  },
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9./\s-]+/g, " ").replace(/\s+/g, " ").trim();
}

function stripStopWords(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token))
    .join(" ");
}

function scoreEntry(query: string, entry: PublicChatKnowledgeEntry) {
  const normalizedQuery = normalizeText(query);
  const simplifiedQuery = stripStopWords(query);
  let score = 0;

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    const simplifiedKeyword = stripStopWords(keyword);

    if (
      normalizedQuery.includes(normalizedKeyword) ||
      (simplifiedKeyword && simplifiedQuery.includes(simplifiedKeyword))
    ) {
      score += keyword.split(" ").length > 1 ? 4 : 2;
    }
  }

  if (
    normalizedQuery.includes(normalizeText(entry.title)) ||
    simplifiedQuery.includes(stripStopWords(entry.title))
  ) {
    score += 5;
  }

  return score;
}

export function findPublicChatKnowledge(
  query: string,
  limit = 3,
): PublicChatKnowledgeEntry[] {
  return KNOWLEDGE_ENTRIES
    .map((entry) => ({ entry, score: scoreEntry(query, entry) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.entry);
}

function isNavigationQuery(query: string) {
  const normalizedQuery = normalizeText(query);
  return [
    "open ",
    "how do i get to",
    "how do i verify",
    "take me to",
    "go to",
    "navigate",
    "verify ",
    "show me",
    "where do i",
    "where can i find",
    "where is",
  ].some((phrase) => normalizedQuery.includes(phrase));
}

export function buildStructuredPublicChatReply(query: string): {
  reply: string;
  actions: PublicChatAction[];
} | null {
  const matches = findPublicChatKnowledge(query);
  if (matches.length === 0) return null;

  const [topMatch] = matches;
  const actions = topMatch.actions.slice(0, 3);

  if (isNavigationQuery(query)) {
    return {
      reply: `${topMatch.summary} I can take you straight there using the button below.`,
      actions,
    };
  }

  return {
    reply:
      matches.length === 1
        ? `${topMatch.summary}`
        : `${topMatch.summary} You may also want: ${matches
            .slice(1)
            .map((entry) => entry.title)
            .join(", ")}.`,
    actions,
  };
}

export function buildKnowledgeContext(query: string) {
  const matches = findPublicChatKnowledge(query);
  if (matches.length === 0) return "No structured BOCRA knowledge match found.";

  return matches
    .map(
      (entry) =>
        `${entry.title}: ${entry.summary} Routes: ${entry.actions
          .map((action) => `${action.label} -> ${action.href}`)
          .join("; ")}`,
    )
    .join("\n");
}
