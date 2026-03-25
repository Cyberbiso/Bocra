'use client'

import { useState, useMemo } from 'react'
import {
  Search, FileText, ScrollText, BookOpen, ClipboardList,
  BarChart2, Bell, HelpCircle, Download, ExternalLink,
  MessageSquare, ChevronDown, Filter, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'Legislation' | 'Guidelines' | 'Forms' | 'Consultations' | 'Reports' | 'Notices' | 'FAQs'
type Module = 'Licensing' | 'Type Approval' | 'Complaints' | 'Spectrum' | 'Cybersecurity' | 'Domain Services'

interface Doc {
  id: string
  title: string
  category: Category
  module: Module
  year: number
  date: string          // e.g. "15 Jan 2025"
  description: string
  file: string          // filename for mock download
  consultationCloses?: string   // only for Consultations
}

interface Faq {
  q: string
  a: string
}

// ─── Mock documents ───────────────────────────────────────────────────────────

const DOCS: Doc[] = [
  {
    id: 'd01',
    title: 'Communications Regulatory Authority Act (Cap. 72:04)',
    category: 'Legislation',
    module: 'Licensing',
    year: 2022,
    date: '1 Mar 2022',
    description: 'The principal legislation establishing BOCRA and defining its mandate, powers, and governance framework for regulating the communications sector in Botswana.',
    file: 'cra-act-cap-72-04-2022.pdf',
  },
  {
    id: 'd02',
    title: 'Type Approval Guidelines for Telecommunications Equipment v3',
    category: 'Guidelines',
    module: 'Type Approval',
    year: 2023,
    date: '20 Jun 2023',
    description: 'Technical requirements and test standards that telecommunications equipment must meet before being approved for sale or use in Botswana. Covers radio, terminal, and CPE devices.',
    file: 'type-approval-guidelines-v3-2023.pdf',
  },
  {
    id: 'd03',
    title: 'Licence Application Form — Broadcasting Service',
    category: 'Forms',
    module: 'Licensing',
    year: 2024,
    date: '5 Feb 2024',
    description: 'Official form for applying for a broadcasting service licence. Includes schedules for community, commercial, and subscription broadcasting categories.',
    file: 'licence-application-broadcasting-2024.pdf',
  },
  {
    id: 'd04',
    title: 'Draft Spectrum Management Framework 2026 — Public Consultation',
    category: 'Consultations',
    module: 'Spectrum',
    year: 2026,
    date: '3 Mar 2026',
    description: 'BOCRA invites comments on the proposed national spectrum management framework, including frequency allocation plans for 5G, satellite, and IoT services through 2030.',
    file: 'draft-spectrum-framework-2026-consultation.pdf',
    consultationCloses: '30 Apr 2026',
  },
  {
    id: 'd05',
    title: 'Consumer Complaint Handling Procedure v2',
    category: 'Guidelines',
    module: 'Complaints',
    year: 2024,
    date: '12 Sep 2024',
    description: 'Sets out BOCRA\'s procedures for receiving, investigating, and resolving consumer complaints against licensed telecommunications and postal operators.',
    file: 'complaint-handling-procedure-v2-2024.pdf',
  },
  {
    id: 'd06',
    title: 'Annual Telecommunications Market Report 2025',
    category: 'Reports',
    module: 'Licensing',
    year: 2025,
    date: '28 Feb 2025',
    description: 'Comprehensive analysis of Botswana\'s telecommunications market including subscriber data, operator performance, coverage statistics, and regulatory activity for 2024.',
    file: 'telecom-market-report-2025.pdf',
  },
  {
    id: 'd07',
    title: 'Notice: New IMEI Type Approval Submission Portal',
    category: 'Notices',
    module: 'Type Approval',
    year: 2025,
    date: '14 Nov 2025',
    description: 'BOCRA announces the launch of the new online type approval submission portal. All applications submitted after 1 January 2026 must use the new portal.',
    file: 'notice-imei-portal-launch-2025.pdf',
  },
  {
    id: 'd08',
    title: 'Cybersecurity Incident Reporting Obligations — Critical Infrastructure',
    category: 'Guidelines',
    module: 'Cybersecurity',
    year: 2025,
    date: '7 Jul 2025',
    description: 'Mandatory reporting timelines and procedures for critical infrastructure operators to notify bwCIRT of cybersecurity incidents under the Cybercrime and Cybersecurity Act.',
    file: 'cii-reporting-obligations-2025.pdf',
  },
  {
    id: 'd09',
    title: '.bw Domain Registration Policy v4',
    category: 'Guidelines',
    module: 'Domain Services',
    year: 2024,
    date: '1 Aug 2024',
    description: 'Rules governing the registration, management, and dispute resolution of .bw ccTLD domain names including eligibility requirements for each second-level zone.',
    file: 'bw-domain-registration-policy-v4-2024.pdf',
  },
  {
    id: 'd10',
    title: 'Draft Consumer Protection Regulations 2026 — Public Consultation',
    category: 'Consultations',
    module: 'Complaints',
    year: 2026,
    date: '10 Feb 2026',
    description: 'Proposed regulations enhancing consumer rights in telecommunications services, including minimum service level standards, transparent billing requirements, and compensation frameworks.',
    file: 'draft-consumer-protection-regulations-2026.pdf',
    consultationCloses: '10 Apr 2026',
  },
  {
    id: 'd11',
    title: 'Spectrum Licence Application Form — Fixed Wireless',
    category: 'Forms',
    module: 'Spectrum',
    year: 2023,
    date: '20 Mar 2023',
    description: 'Application form for fixed wireless spectrum assignments, including technical annexures for frequency coordination and interference analysis.',
    file: 'spectrum-licence-fixed-wireless-form-2023.pdf',
  },
  {
    id: 'd12',
    title: 'Registrar Accreditation Guidelines — .bw Registry v2',
    category: 'Guidelines',
    module: 'Domain Services',
    year: 2023,
    date: '1 Sep 2023',
    description: 'Technical and operational requirements that applicants must satisfy to be accredited as a .bw domain name registrar under BOCRA oversight.',
    file: 'registrar-accreditation-guidelines-v2-2023.pdf',
  },
  {
    id: 'd13',
    title: 'QoS Minimum Standards for Mobile Network Operators',
    category: 'Legislation',
    module: 'Licensing',
    year: 2023,
    date: '15 Apr 2023',
    description: 'Legally binding minimum quality of service standards for voice, data, and SMS services provided by licensed mobile network operators in Botswana.',
    file: 'qos-minimum-standards-mno-2023.pdf',
  },
  {
    id: 'd14',
    title: 'Complaint Form — Consumer Dispute with Operator',
    category: 'Forms',
    module: 'Complaints',
    year: 2025,
    date: '1 Jan 2025',
    description: 'Standard form for consumers to formally lodge a complaint against a licensed telecommunications or postal operator with BOCRA.',
    file: 'consumer-complaint-form-2025.pdf',
  },
]

// ─── Mock FAQs ────────────────────────────────────────────────────────────────

const FAQS: Record<Module, Faq[]> = {
  Licensing: [
    {
      q: 'What types of licences does BOCRA issue?',
      a: 'BOCRA issues several licence categories under the Communications Regulatory Authority Act: (1) Network Service Licences for operators building communications infrastructure; (2) Application Service Licences for service providers using existing networks; (3) Broadcasting Service Licences for TV and radio; and (4) Postal Service Licences. Each category has sub-tiers depending on coverage scope and service type.',
    },
    {
      q: 'How long does the licence application process take?',
      a: 'Processing times vary by licence category. Standard individual licences typically take 60–90 working days from submission of a complete application. Class licences are generally processed within 30 working days. BOCRA will contact you if additional information or clarification is required, which may extend the processing period.',
    },
    {
      q: 'Can a licence be transferred to another entity?',
      a: 'Yes, licences may be transferred subject to BOCRA approval. The transferee must demonstrate compliance with all eligibility requirements applicable to the original licence. A transfer application must be submitted at least 60 days before the intended transfer date and is subject to the prescribed transfer fee.',
    },
    {
      q: 'What happens if a licence expires and I have not renewed it?',
      a: 'Operating a communications service without a valid licence is a criminal offence under the CRA Act. If your licence lapses you must immediately cease operations and apply for renewal. BOCRA may consider reinstatement with a penalty fee, but continued unlicensed operation will result in enforcement action including fines and equipment seizure.',
    },
  ],
  'Type Approval': [
    {
      q: 'Which equipment requires type approval before it can be sold in Botswana?',
      a: 'All radio communications equipment, terminal equipment that connects to a public electronic communications network, and devices emitting radio frequency energy require BOCRA type approval. This includes mobile phones, routers, modems, Wi-Fi access points, IoT devices, and any equipment that uses licensed spectrum. Pure software applications do not require type approval.',
    },
    {
      q: 'Can I import a small number of devices for personal use without type approval?',
      a: 'Yes. An individual importing a single device for personal use that is not intended for resale may do so without formal type approval. However, the device must still comply with applicable technical standards. Commercial importation or sale of unapproved devices — including by online retailers — is prohibited regardless of quantity.',
    },
    {
      q: 'How do I check if a device already has BOCRA type approval?',
      a: 'You can use the Device Verification tool in this portal to search by IMEI number or check the public type approval register. Each approved device is assigned a Type Approval Number (TA-YYYY-XXXXX) which must be displayed on the device or its packaging.',
    },
    {
      q: 'What test reports are accepted for type approval applications?',
      a: 'BOCRA accepts test reports from accredited laboratories recognised under the SADC mutual recognition agreements, IECEE member test laboratories, and other laboratories approved by BOCRA on a case-by-case basis. Reports must be no more than three years old at the time of application. BOCRA reserves the right to conduct its own post-market surveillance testing.',
    },
  ],
  Complaints: [
    {
      q: 'What types of complaints can I submit to BOCRA?',
      a: 'BOCRA handles complaints related to: billing disputes with telecommunications operators, service outages or poor quality of service, unlawful interception or privacy breaches by operators, misleading advertising by licensed operators, postal delivery failures, and broadcasting content that violates regulatory standards. BOCRA does not handle commercial disputes between businesses that are unrelated to regulatory compliance.',
    },
    {
      q: 'Must I complain to my operator before contacting BOCRA?',
      a: 'Yes. BOCRA requires complainants to first lodge a complaint directly with the service provider and allow a reasonable time (typically 14–21 days) for resolution. If the provider fails to resolve the complaint satisfactorily, you may escalate to BOCRA with evidence of your prior attempt. BOCRA may waive this requirement in cases of repeated non-response or urgent matters.',
    },
    {
      q: 'How long will BOCRA take to investigate my complaint?',
      a: 'BOCRA aims to acknowledge all complaints within 5 working days. Simple complaints are typically resolved within 30 working days. Complex investigations involving multiple parties, technical analysis, or enforcement proceedings may take up to 90 working days. You will receive updates via your registered email and can check status through the Incident Tracker in this portal.',
    },
  ],
  'Domain Services': [
    {
      q: 'Who is eligible to register a .co.bw domain?',
      a: 'Any individual or entity with a legitimate presence in Botswana may register a .co.bw domain. Commercial entities must provide their company registration number. Individuals must provide a valid national ID or passport. The domain name must correspond to the registrant\'s trading name, brand, or personal name — domain squatting and abusive registrations are prohibited under the .bw Dispute Resolution Policy.',
    },
    {
      q: 'Can a foreign company register a .bw domain?',
      a: 'Yes, foreign entities may register .bw domains provided they have a demonstrable connection to Botswana such as a registered branch, ongoing business operations, or a locally resident authorised representative. The foreign entity must comply with KYC requirements and appoint a local administrative contact.',
    },
    {
      q: 'What happens when a .bw domain name is disputed?',
      a: 'BOCRA administers the .bw Dispute Resolution Policy (DRP) for domain disputes. A complainant alleging abusive registration may file a DRP complaint. An independent panel will review the evidence and determine whether the domain should be transferred or cancelled. The DRP is a faster and less costly alternative to court proceedings for domain disputes.',
    },
  ],
  Spectrum: [],
  Cybersecurity: [],
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<Category, React.ElementType> = {
  Legislation:   ScrollText,
  Guidelines:    BookOpen,
  Forms:         ClipboardList,
  Consultations: MessageSquare,
  Reports:       BarChart2,
  Notices:       Bell,
  FAQs:          HelpCircle,
}

const CATEGORY_COLOR: Record<Category, string> = {
  Legislation:   'bg-purple-100 text-purple-700',
  Guidelines:    'bg-blue-100 text-blue-700',
  Forms:         'bg-teal-100 text-teal-700',
  Consultations: 'bg-amber-100 text-amber-700',
  Reports:       'bg-indigo-100 text-indigo-700',
  Notices:       'bg-red-100 text-red-700',
  FAQs:          'bg-gray-100 text-gray-600',
}

const CATEGORIES: ('All' | Category)[] = [
  'All', 'Legislation', 'Guidelines', 'Forms', 'Consultations', 'Reports', 'Notices', 'FAQs',
]
const MODULES: ('All' | Module)[] = [
  'All', 'Licensing', 'Type Approval', 'Complaints', 'Spectrum', 'Cybersecurity', 'Domain Services',
]
const FAQ_MODULES: Module[] = ['Licensing', 'Type Approval', 'Complaints', 'Domain Services']

const YEARS = ['All', '2026', '2025', '2024', '2023', '2022']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockDownload(file: string, title: string) {
  const blob = new Blob([`BOCRA Document: ${title}\n\nMock content for: ${file}`], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3 py-1.5 text-xs rounded-full border transition-colors whitespace-nowrap font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50 focus-visible:ring-offset-1',
        active
          ? 'bg-[#003580] text-white border-[#003580]'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
      )}
    >
      {children}
    </button>
  )
}

function DocCard({ doc }: { doc: Doc }) {
  const Icon = CATEGORY_ICON[doc.category]
  const isConsultation = doc.category === 'Consultations'

  return (
    <div className={cn(
      'flex flex-col bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden',
      isConsultation ? 'border-amber-300' : 'border-gray-200',
    )}>
      {/* Consultation banner */}
      {isConsultation && doc.consultationCloses && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <MessageSquare className="size-3.5" />
            Open for Public Comment — Closes {doc.consultationCloses}
          </p>
          <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <MessageSquare className="size-3" />
            Submit Comment
          </button>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Icon + meta */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'size-9 rounded-lg flex items-center justify-center flex-none',
            isConsultation ? 'bg-amber-100' : 'bg-[#003580]/10',
          )}>
            <Icon className={cn('size-4', isConsultation ? 'text-amber-700' : 'text-[#003580]')} />
          </div>
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', CATEGORY_COLOR[doc.category])}>
              {doc.category}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {doc.module}
            </span>
          </div>
        </div>

        {/* Title + description */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{doc.title}</p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-3">{doc.description}</p>
        </div>

        {/* Date + actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
          <span className="text-[11px] text-gray-400">{doc.date}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => mockDownload(doc.file, doc.title)}
              aria-label={`Download ${doc.title}`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50"
            >
              <Download className="size-3" aria-hidden />
              Download
            </button>
            <button
              onClick={() => mockDownload(doc.file, doc.title)}
              aria-label={`Open ${doc.title}`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50"
            >
              <ExternalLink className="size-3" aria-hidden />
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqAccordion({ module, faqs }: { module: Module; faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null)

  if (!faqs.length) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
        <HelpCircle className="size-4 text-[#003580]" />
        <span className="text-sm font-semibold text-gray-800">{module}</span>
        <span className="text-xs text-gray-400 ml-auto">{faqs.length} questions</span>
      </div>
      <div className="divide-y divide-gray-50">
        {faqs.map((faq, idx) => (
          <div key={idx}>
            <button
              onClick={() => setOpen(open === idx ? null : idx)}
              aria-expanded={open === idx}
              className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003580]/40"
            >
              <ChevronDown
                className={cn(
                  'size-4 text-gray-400 flex-none mt-0.5 transition-transform duration-200',
                  open === idx && 'rotate-180',
                )}
              />
              <span className="text-sm font-medium text-gray-800 leading-snug">{faq.q}</span>
            </button>
            {open === idx && (
              <div className="px-5 pb-4 pt-0 ml-7">
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState<'All' | Category>('All')
  const [modFilter, setModFilter] = useState<'All' | Module>('All')
  const [yearFilter, setYearFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return DOCS.filter((d) => {
      if (catFilter !== 'All' && d.category !== catFilter) return false
      if (modFilter !== 'All' && d.module !== modFilter) return false
      if (yearFilter !== 'All' && String(d.year) !== yearFilter) return false
      if (q && !d.title.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, catFilter, modFilter, yearFilter])

  const hasActiveFilters = catFilter !== 'All' || modFilter !== 'All' || yearFilter !== 'All' || query

  function clearAll() {
    setQuery('')
    setCatFilter('All')
    setModFilter('All')
    setYearFilter('All')
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents, Policies &amp; Consultations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search BOCRA's regulatory library — legislation, guidelines, application forms, consultations, and reports.
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center border border-gray-200 rounded-xl bg-white px-4 gap-2 focus-within:border-[#003580] focus-within:ring-2 focus-within:ring-[#003580]/20 transition-all shadow-sm">
            <label htmlFor="doc-search" className="sr-only">Search documents</label>
            <Search className="size-4 text-gray-400 flex-none" aria-hidden />
            <input
              id="doc-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search regulations, forms, FAQs…"
              className="flex-1 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50 rounded"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((p) => !p)}
            aria-expanded={showFilters}
            aria-controls="doc-filters"
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border rounded-xl transition-colors shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50',
              showFilters || hasActiveFilters
                ? 'bg-[#003580] text-white border-[#003580]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
            )}
          >
            <Filter className="size-4" />
            Filters
            {hasActiveFilters && (
              <span className="size-4 rounded-full bg-white/30 text-white text-[10px] font-bold flex items-center justify-center">
                {[catFilter !== 'All', modFilter !== 'All', yearFilter !== 'All'].filter(Boolean).length || ''}
              </span>
            )}
          </button>
        </div>

        {/* Filter rows */}
        {showFilters && (
          <div id="doc-filters" className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <FilterPill key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
                    {c}
                  </FilterPill>
                ))}
              </div>
            </div>
            {/* Module */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Module</p>
              <div className="flex flex-wrap gap-1.5">
                {MODULES.map((m) => (
                  <FilterPill key={m} active={modFilter === m} onClick={() => setModFilter(m)}>
                    {m}
                  </FilterPill>
                ))}
              </div>
            </div>
            {/* Year */}
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Year</p>
                <div className="flex flex-wrap gap-1.5">
                  {YEARS.map((y) => (
                    <FilterPill key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>
                      {y}
                    </FilterPill>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="ml-auto self-end text-xs text-red-500 hover:text-red-700 flex items-center gap-1 underline underline-offset-2"
                >
                  <X className="size-3" />
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length === DOCS.length
            ? `All ${DOCS.length} documents`
            : `${filtered.length} of ${DOCS.length} documents`}
        </p>
        {hasActiveFilters && !showFilters && (
          <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 underline underline-offset-2">
            <X className="size-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Document grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => <DocCard key={doc.id} doc={doc} />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center text-center shadow-sm">
          <FileText className="size-10 text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">No documents match your search</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search terms</p>
          <button onClick={clearAll} className="mt-4 text-xs text-[#003580] underline underline-offset-2">
            Clear all filters
          </button>
        </div>
      )}

      {/* FAQ section */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-2 px-3">
            <HelpCircle className="size-4 text-[#003580]" />
            <span className="text-sm font-semibold text-gray-700">Frequently Asked Questions</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {FAQ_MODULES.map((mod) => (
            <FaqAccordion key={mod} module={mod} faqs={FAQS[mod]} />
          ))}
        </div>
      </div>
    </div>
  )
}
