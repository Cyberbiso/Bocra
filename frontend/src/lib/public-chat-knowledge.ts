export type PublicChatAction = {
  label: string;
  href: string;
};

type PublicChatKnowledgeEntry = {
  title: string;
  summary: string;
  keywords: string[];
  actions: PublicChatAction[];
};

type ChatHistoryMessage = {
  role: "user" | "bot";
  content: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "do",
  "i",
  "is",
  "me",
  "my",
  "please",
  "the",
  "there",
  "to",
  "where",
  "would",
  "you",
]);

const KNOWLEDGE_ENTRIES: PublicChatKnowledgeEntry[] = [
  {
    title: "About BOCRA",
    summary:
      "The About section covers BOCRA's profile, history, Board of Directors, executive management, projects, and careers.",
    keywords: ["about", "about us", "about bocra", "profile", "who is bocra"],
    actions: [
      { label: "Open About BOCRA", href: "/about" },
      { label: "Open Profile", href: "/about/profile" },
    ],
  },
  {
    title: "Documents and Annual Reports",
    summary:
      "You can find BOCRA's annual reports and publications in the Documents section of the website.",
    keywords: [
      "annual report",
      "annual reports",
      "publications",
      "documents",
      "bocra annual report",
      "reports",
    ],
    actions: [
      { label: "Open Annual Reports", href: "/documents#annual-reports" },
      { label: "Open Documents", href: "/documents" },
    ],
  },
  {
    title: "Board of Directors",
    summary:
      "You can view BOCRA's Board of Directors under the About section of the website.",
    keywords: ["board of directors", "board", "directors", "governance", "bocra board"],
    actions: [
      { label: "Open Board of Directors", href: "/about/board" },
      { label: "Open About BOCRA", href: "/about" },
    ],
  },
  {
    title: "Chief Executive Message",
    summary:
      "You can read the Chief Executive's message in the About section.",
    keywords: [
      "word from the ceo",
      "chief executive",
      "ceo message",
      "word from chief executive",
      "ceo speech",
      "chief executive speech",
    ],
    actions: [
      { label: "Open CEO Message", href: "/about/chief-executive" },
      { label: "Open About BOCRA", href: "/about" },
    ],
  },
  {
    title: "Executive Management",
    summary:
      "You can view BOCRA's Executive Management team from the About section.",
    keywords: ["executive management", "executives", "management team", "senior leadership"],
    actions: [
      { label: "Open Executive Management", href: "/about/executive" },
      { label: "Open About BOCRA", href: "/about" },
    ],
  },
  {
    title: "History of BOCRA",
    summary:
      "You can view the history of communication regulation and BOCRA's evolution in the History page.",
    keywords: ["history", "history of bocra", "history of communication regulation"],
    actions: [
      { label: "Open History", href: "/about/history" },
      { label: "Open About BOCRA", href: "/about" },
    ],
  },
  {
    title: "Careers at BOCRA",
    summary:
      "You can find BOCRA job and careers information on the Careers page.",
    keywords: ["careers", "jobs", "work at bocra", "vacancies"],
    actions: [
      { label: "Open Careers", href: "/about/careers" },
      { label: "Open About BOCRA", href: "/about" },
    ],
  },
  {
    title: "Projects",
    summary:
      "You can view BOCRA's current and strategic projects on the Projects page.",
    keywords: ["projects", "current projects", "bocra projects"],
    actions: [
      { label: "Open Projects", href: "/projects" },
      { label: "Open About BOCRA", href: "/about" },
    ],
  },
  {
    title: "Mandate",
    summary:
      "The Mandate section covers BOCRA's legislation, telecommunications, broadcasting, postal, internet and ICT, and licensing responsibilities.",
    keywords: ["mandate", "what does bocra regulate", "responsibilities", "what is your mandate"],
    actions: [
      { label: "Open Mandate", href: "/mandate" },
      { label: "Open Legislation", href: "/mandate/legislation" },
    ],
  },
  {
    title: "Legislation",
    summary:
      "You can view the legislation that governs BOCRA in the Legislation page under Mandate.",
    keywords: ["legislation", "laws", "acts", "regulations"],
    actions: [
      { label: "Open Legislation", href: "/mandate/legislation" },
      { label: "Open Mandate", href: "/mandate" },
    ],
  },
  {
    title: "Telecommunications Regulation",
    summary:
      "You can find BOCRA's telecommunications regulatory role under the Telecommunications page in the Mandate section.",
    keywords: ["telecommunications", "telecom regulation", "spectrum", "telecom"],
    actions: [
      { label: "Open Telecommunications", href: "/mandate/telecommunications" },
      { label: "Open Mandate", href: "/mandate" },
    ],
  },
  {
    title: "Broadcasting Regulation",
    summary:
      "You can find BOCRA's broadcasting regulatory role under the Broadcasting page in the Mandate section.",
    keywords: ["broadcasting", "radio", "tv regulation", "broadcast"],
    actions: [
      { label: "Open Broadcasting", href: "/mandate/broadcasting" },
      { label: "Open Mandate", href: "/mandate" },
    ],
  },
  {
    title: "Postal Services",
    summary:
      "You can find BOCRA's postal services oversight under the Postal Services page in the Mandate section.",
    keywords: ["postal", "postal services", "mail", "courier regulation"],
    actions: [
      { label: "Open Postal Services", href: "/mandate/postal" },
      { label: "Open Mandate", href: "/mandate" },
    ],
  },
  {
    title: "Internet and ICT",
    summary:
      "You can find BOCRA's internet and ICT responsibilities under the Internet and ICT page in the Mandate section.",
    keywords: ["internet", "ict", "internet and ict", "digital", "cyber"],
    actions: [
      { label: "Open Internet and ICT", href: "/mandate/internet" },
      { label: "Open Mandate", href: "/mandate" },
    ],
  },
  {
    title: "Licensing Mandate",
    summary:
      "You can find BOCRA's licensing framework and regulatory licensing mandate under the Licensing page in the Mandate section.",
    keywords: ["licensing framework", "licensing mandate", "licensing rules", "licensing"],
    actions: [
      { label: "Open Licensing Mandate", href: "/mandate/licensing" },
      { label: "Open Licence Verification", href: "/services/licence-verification" },
    ],
  },
  {
    title: "Licence Verification",
    summary:
      "You can verify a BOCRA-issued licence through the licence verification service.",
    keywords: [
      "verify a licence",
      "verify licence",
      "verify license",
      "licence verification",
      "license verification",
    ],
    actions: [{ label: "Open Licence Verification", href: "/services/licence-verification" }],
  },
  {
    title: "Type Approval",
    summary:
      "You can search BOCRA type approval information and approved device records through the Type Approval service page.",
    keywords: ["type approval", "approved devices", "device approval", "type approval certificates"],
    actions: [{ label: "Open Type Approval", href: "/services/type-approval" }],
  },
  {
    title: "Domain Registration",
    summary:
      "You can find .bw domain registration guidance on the Domain Registration service page.",
    keywords: ["domain registration", ".bw domain", "register domain", "domain"],
    actions: [{ label: "Open Domain Registration", href: "/services/domain-registration" }],
  },
  {
    title: "Complaints",
    summary:
      "You can file a complaint, track an existing complaint, and learn about the complaint process from the complaints section.",
    keywords: ["complaint", "complaints", "file complaint", "track complaint"],
    actions: [
      { label: "Open Complaints", href: "/complaints" },
      { label: "Track Complaint", href: "/complaints/track" },
    ],
  },
  {
    title: "Complaint Process",
    summary:
      "You can learn how BOCRA handles complaints on the Complaint Process page.",
    keywords: ["complaint process", "how complaints are handled", "how do you handle complaints"],
    actions: [
      { label: "Open Complaint Process", href: "/complaints/process" },
      { label: "Open Complaints", href: "/complaints" },
    ],
  },
  {
    title: "Consumer Education",
    summary:
      "You can find complaint-related consumer education and rights guidance on the Consumer Education page.",
    keywords: ["consumer education", "consumer rights", "know your rights"],
    actions: [
      { label: "Open Consumer Education", href: "/complaints/education" },
      { label: "Open Complaints", href: "/complaints" },
    ],
  },
  {
    title: "Track Complaint",
    summary:
      "You can track an existing complaint from the Track Complaint page.",
    keywords: ["track complaint", "check complaint status", "complaint status"],
    actions: [
      { label: "Track Complaint", href: "/complaints/track" },
      { label: "Open Complaints", href: "/complaints" },
    ],
  },
  {
    title: "Consultations",
    summary:
      "You can view BOCRA public consultations and draft documents on the Consultations page.",
    keywords: ["consultations", "public consultations", "draft documents", "public comment"],
    actions: [{ label: "Open Consultations", href: "/consultations" }],
  },
  {
    title: "Media Centre",
    summary:
      "You can find BOCRA news, press releases, speeches, and announcements in the Media Centre.",
    keywords: ["media", "news", "media centre", "announcements"],
    actions: [
      { label: "Open Media Centre", href: "/media" },
      { label: "Open Press Releases", href: "/media#press-releases" },
    ],
  },
  {
    title: "Press Releases",
    summary:
      "You can find BOCRA press releases and announcements in the Press Releases section of the Media Centre.",
    keywords: ["press releases", "press release", "official statements"],
    actions: [
      { label: "Open Press Releases", href: "/media#press-releases" },
      { label: "Open Media Centre", href: "/media" },
    ],
  },
  {
    title: "Speeches",
    summary:
      "You can find BOCRA speeches and addresses in the Speeches section of the Media Centre.",
    keywords: [
      "speeches",
      "speech",
      "addresses",
      "ceo speeches",
      "ceo speech",
      "board speeches",
      "show me the ceo speech",
      "show me your ceo speech",
    ],
    actions: [
      { label: "Open Speeches", href: "/media#speeches" },
      { label: "Open Media Centre", href: "/media" },
    ],
  },
  {
    title: "Tenders and Procurement",
    summary:
      "You can view BOCRA tenders and procurement opportunities on the Tenders page.",
    keywords: ["tenders", "procurement", "rfp", "open tenders"],
    actions: [{ label: "Open Tenders", href: "/tenders" }],
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/speach/g, "speech")
    .replace(/licence/g, "license")
    .replace(/[^a-z0-9./\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      score += normalizedKeyword.includes(" ") ? 4 : 2;
    }
  }

  if (normalizedQuery.includes(normalizeText(entry.title))) {
    score += 5;
  }

  return score;
}

function findMatches(query: string) {
  return KNOWLEDGE_ENTRIES
    .map((entry) => ({ entry, score: scoreEntry(query, entry) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.entry);
}

function isNavigationRequest(query: string) {
  const normalized = normalizeText(query);
  return [
    "navigate",
    "take me there",
    "open it",
    "open that",
    "go there",
    "go to",
    "show me",
    "take me to",
    "where do i",
    "where is",
  ].some((phrase) => normalized.includes(phrase));
}

function isAffirmativeFollowUp(query: string) {
  const normalized = normalizeText(query);
  return ["yes", "yeah", "yep", "sure", "okay", "ok", "please do"].includes(normalized);
}

function resolveMatches(query: string, history: ChatHistoryMessage[] = []) {
  const directMatches = findMatches(query);
  if (directMatches.length > 0) {
    return directMatches;
  }

  if (!isNavigationRequest(query) && !isAffirmativeFollowUp(query)) {
    return [];
  }

  const orderedHistory = [
    ...history.filter((entry) => entry.role === "user"),
    ...history.filter((entry) => entry.role === "bot"),
  ];

  for (let index = orderedHistory.length - 1; index >= 0; index -= 1) {
    const matches = findMatches(orderedHistory[index].content);
    if (matches.length > 0) {
      return matches;
    }
  }

  return [];
}

export function findPublicChatKnowledge(query: string, limit = 3): PublicChatKnowledgeEntry[] {
  return findMatches(query).slice(0, limit);
}

export function buildStructuredPublicChatReply(
  query: string,
  history: ChatHistoryMessage[] = [],
): {
  reply: string;
  actions: PublicChatAction[];
} | null {
  const matches = resolveMatches(query, history);
  if (matches.length === 0) return null;

  const topMatch = matches[0];
  const actions = topMatch.actions.slice(0, 3);

  if (isNavigationRequest(query) || isAffirmativeFollowUp(query)) {
    return {
      reply: `${topMatch.summary} I can take you straight there using the button below.`,
      actions,
    };
  }

  return {
    reply: `${topMatch.summary} If you want, I can take you there directly.`,
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
