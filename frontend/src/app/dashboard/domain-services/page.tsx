'use client'

import { useState, useRef } from 'react'
import {
  Search, CheckCircle2, XCircle, ExternalLink, Download,
  Globe, ChevronDown, Building2, Phone, Mail, FileText,
  ShieldCheck, User, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Zone = '.co.bw' | '.org.bw' | '.ac.bw' | '.net.bw' | '.gov.bw'

interface WhoisInfo {
  registrant: string
  registrar: string
  registered: string
  expiry: string
  dnssec: 'Enabled' | 'Disabled' | 'Unsigned'
  status: string
}

interface CheckResult {
  domain: string
  available: boolean
  whois?: WhoisInfo
}

interface Registrar {
  id: string
  name: string
  website: string
  phone: string
  email: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ZONES: Zone[] = ['.co.bw', '.org.bw', '.ac.bw', '.net.bw', '.gov.bw']

// Deterministic mock: domains containing these keywords are "taken"
const TAKEN_KEYWORDS = [
  'bocra', 'gov', 'mascom', 'orange', 'btc', 'ub', 'bofinet',
  'fnb', 'stanchart', 'standard', 'barclays', 'debswana', 'botswana',
  'news', 'daily', 'media', 'post', 'mail', 'bobs', 'bdc', 'sbbc',
]

const MOCK_WHOIS: Record<string, WhoisInfo> = {
  default: {
    registrant: 'Botswana Corporate Holdings (Pty) Ltd',
    registrar: 'Domain Basket Botswana',
    registered: '2019-03-14',
    expiry: '2026-03-14',
    dnssec: 'Enabled',
    status: 'Active',
  },
  gov: {
    registrant: 'Government of Botswana — DCEC',
    registrar: 'BTC Internet Services',
    registered: '2015-07-01',
    expiry: '2027-07-01',
    dnssec: 'Enabled',
    status: 'Active',
  },
  bocra: {
    registrant: 'Botswana Communications Regulatory Authority',
    registrar: 'BTC Internet Services',
    registered: '2012-11-22',
    expiry: '2026-11-22',
    dnssec: 'Enabled',
    status: 'Active',
  },
  mascom: {
    registrant: 'Mascom Wireless Botswana (Pty) Ltd',
    registrar: 'Domain Basket Botswana',
    registered: '2010-05-18',
    expiry: '2025-05-18',
    dnssec: 'Disabled',
    status: 'Active',
  },
  botswana: {
    registrant: 'Department of Information Technology',
    registrar: 'BTC Internet Services',
    registered: '2008-01-10',
    expiry: '2026-01-10',
    dnssec: 'Enabled',
    status: 'Active',
  },
}

const REGISTRARS: Registrar[] = [
  {
    id: 'r1',
    name: 'Domain Basket Botswana',
    website: 'https://www.domainbasket.co.bw',
    phone: '+267 3180 100',
    email: 'domains@domainbasket.co.bw',
  },
  {
    id: 'r2',
    name: 'BTC Internet Services',
    website: 'https://www.btc.bw',
    phone: '+267 3900 111',
    email: 'domains@btc.bw',
  },
  {
    id: 'r3',
    name: 'Bofinet Registry Solutions',
    website: 'https://www.bofinet.co.bw',
    phone: '+267 3180 900',
    email: 'registry@bofinet.co.bw',
  },
  {
    id: 'r4',
    name: 'Datalink Systems Botswana',
    website: 'https://www.datalink.co.bw',
    phone: '+267 3190 450',
    email: 'support@datalink.co.bw',
  },
  {
    id: 'r5',
    name: 'NetVision Hosting & Domains',
    website: 'https://www.netvision.co.bw',
    phone: '+267 3111 700',
    email: 'info@netvision.co.bw',
  },
]

const POLICY_DOCS = [
  {
    id: 'reg-policy',
    title: '.bw Domain Registration Policy',
    description:
      'Rules governing registration eligibility, naming conventions, and registrant obligations for all .bw second-level and third-level domains.',
    file: 'bw-domain-registration-policy-v3.pdf',
  },
  {
    id: 'dispute',
    title: 'Dispute Resolution Policy',
    description:
      'Procedures for resolving disputes over .bw domain name registrations, including the Uniform Domain-Name Dispute-Resolution Policy (UDRP) adaptation.',
    file: 'bw-domain-dispute-resolution-policy.pdf',
  },
  {
    id: 'accred',
    title: 'Registrar Accreditation Guidelines',
    description:
      'Technical and operational requirements that organisations must meet to become accredited .bw registrars under BOCRA oversight.',
    file: 'registrar-accreditation-guidelines-2023.pdf',
  },
  {
    id: 'kyc',
    title: 'KYC Requirements for Registrants',
    description:
      'Know-Your-Customer documentation requirements for individuals and entities registering .bw domains, including company registration and ID requirements.',
    file: 'kyc-requirements-domain-registration.pdf',
  },
]

// ─── Mock availability check ──────────────────────────────────────────────────

function checkMockAvailability(name: string, zone: Zone): CheckResult {
  const lower = name.toLowerCase().trim()
  const domain = `${lower}${zone}`

  const isTaken = TAKEN_KEYWORDS.some((kw) => lower.includes(kw))

  if (!isTaken) {
    return { domain, available: true }
  }

  // pick whois entry
  const key = TAKEN_KEYWORDS.find((kw) => lower.includes(kw)) ?? 'default'
  const whois = MOCK_WHOIS[key] ?? MOCK_WHOIS.default

  return { domain, available: false, whois }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DomainServicesPage() {
  // ── Section 1: availability search ──────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState<Zone>('.co.bw')
  const [zoneOpen, setZoneOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const zoneRef = useRef<HTMLDivElement>(null)

  function handleCheck() {
    const trimmed = query.trim().replace(/\..*$/, '') // strip any TLD user typed
    if (!trimmed) return
    setChecking(true)
    setResult(null)
    setTimeout(() => {
      setResult(checkMockAvailability(trimmed, zone))
      setChecking(false)
    }, 600)
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Domain Services &amp; Internet Governance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search .bw domain availability, find accredited registrars, and access domain policy resources.
        </p>
      </div>

      {/* ── Section 1: Domain availability ── */}
      <SectionCard
        title="Domain Availability Search"
        subtitle="Check if a .bw domain name is available for registration"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Domain input */}
          <label htmlFor="domain-query" className="sr-only">Domain name to search</label>
          <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#003580] focus-within:ring-2 focus-within:ring-[#003580]/20 transition-all bg-white">
            <Globe className="size-4 text-gray-400 ml-3 flex-none" aria-hidden />
            <input
              id="domain-query"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value.replace(/\s/g, '').toLowerCase())
                setResult(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="yourdomain"
              className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
            />
            <span className="text-sm text-gray-400 pr-1 select-none" aria-hidden>{zone}</span>
          </div>

          {/* Zone picker */}
          <div className="relative" ref={zoneRef}>
            <button
              onClick={() => setZoneOpen((o) => !o)}
              aria-label={`Select domain zone, currently ${zone}`}
              aria-expanded={zoneOpen}
              aria-haspopup="listbox"
              className="h-full min-h-[44px] px-4 flex items-center gap-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-400 transition-colors bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50"
            >
              <span>{zone}</span>
              <ChevronDown className={cn('size-3.5 text-gray-400 transition-transform', zoneOpen && 'rotate-180')} />
            </button>
            {zoneOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-md py-1 min-w-[120px]">
                {ZONES.map((z) => (
                  <button
                    key={z}
                    onClick={() => { setZone(z); setZoneOpen(false); setResult(null) }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                      z === zone ? 'text-[#003580] font-medium' : 'text-gray-700',
                    )}
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Check button */}
          <button
            onClick={handleCheck}
            disabled={!query.trim() || checking}
            className="px-5 py-2.5 bg-[#003580] text-white text-sm font-medium rounded-lg hover:bg-[#002a6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Search className="size-4" />
            {checking ? 'Checking…' : 'Check Availability'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={cn(
              'mt-5 rounded-xl border p-4',
              result.available
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200',
            )}
          >
            {result.available ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-5 text-green-600 flex-none" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">
                      <span className="font-bold text-base">{result.domain}</span> is available!
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Register this domain through an accredited .bw registrar.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    document.getElementById('registrar-directory')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="size-3.5" />
                  Register via a Registrar
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <XCircle className="size-5 text-red-500 flex-none" />
                  <p className="font-semibold text-red-800 text-sm">
                    <span className="font-bold text-base">{result.domain}</span> is already taken.
                  </p>
                </div>
                {result.whois && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-3 border-t border-red-200">
                    {[
                      { label: 'Registrant', value: result.whois.registrant, icon: User },
                      { label: 'Registrar', value: result.whois.registrar, icon: Building2 },
                      { label: 'Registered', value: result.whois.registered, icon: null },
                      { label: 'Expiry', value: result.whois.expiry, icon: null },
                      { label: 'DNSSEC', value: result.whois.dnssec, icon: ShieldCheck },
                      { label: 'Status', value: result.whois.status, icon: null },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label}>
                        <p className="text-[11px] text-red-400 uppercase tracking-wide font-medium mb-0.5">
                          {Icon && <Icon className="inline size-2.5 mr-0.5" />}
                          {label}
                        </p>
                        <p className="text-sm text-gray-800 font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Section 2: Registrar directory ── */}
      <div id="registrar-directory">
      <SectionCard
        title="Accredited Registrar Directory"
        subtitle="These organisations are authorised by BOCRA to register .bw domain names"
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Registrar', 'Phone', 'Email', 'Status', 'Action'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {REGISTRARS.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-[#003580]/10 flex items-center justify-center flex-none">
                        <Globe className="size-3.5 text-[#003580]" />
                      </div>
                      <span className="font-medium text-gray-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-gray-400" />
                      {r.phone}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-gray-400" />
                      <a
                        href={`mailto:${r.email}`}
                        className="hover:text-[#003580] transition-colors"
                      >
                        {r.email}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle2 className="size-3" />
                      ACCREDITED
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <a
                      href={r.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors"
                    >
                      <ExternalLink className="size-3" />
                      Visit Website
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      </div>

      {/* ── Section 3: Policy resources ── */}
      <SectionCard
        title="Domain Policy Resources"
        subtitle="Official BOCRA documents governing the .bw namespace"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {POLICY_DOCS.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#003580]/40 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex gap-3">
                <div className="size-9 rounded-lg bg-[#003580]/10 flex items-center justify-center flex-none mt-0.5">
                  <FileText className="size-4 text-[#003580]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{doc.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{doc.description}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob(
                    [`BOCRA Document: ${doc.title}\n\nThis is a mock PDF placeholder.\nFile: ${doc.file}`],
                    { type: 'application/pdf' },
                  )
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = doc.file
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors"
              >
                <Download className="size-3.5" />
                Download PDF
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Section 4: How .bw registration works ── */}
      <SectionCard
        title="How .bw Registration Works"
        subtitle="Three simple steps to register your .bw domain"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
          {[
            {
              step: 1,
              icon: Globe,
              title: 'Choose a Registrar',
              desc: 'Select an accredited registrar from the directory above. Each registrar offers different pricing and support options.',
            },
            {
              step: 2,
              icon: Search,
              title: 'Check Availability',
              desc: 'Use the registrar\'s portal — or the search tool above — to confirm your desired .bw domain name is available.',
            },
            {
              step: 3,
              icon: ShieldCheck,
              title: 'Register with KYC',
              desc: 'Submit your application with required KYC documents (national ID or company registration) through your chosen registrar.',
            },
          ].map(({ step, icon: Icon, title, desc }, idx, arr) => (
            <div key={step} className="flex sm:flex-col flex-row flex-1 items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
              <div className="flex sm:flex-col items-center sm:w-full">
                {/* Circle + icon */}
                <div className="size-14 rounded-full bg-[#003580] flex items-center justify-center flex-none shadow-md">
                  <Icon className="size-6 text-white" />
                </div>
                {/* Connector line (desktop) */}
                {idx < arr.length - 1 && (
                  <div className="hidden sm:flex flex-1 w-full items-center justify-center mt-[-28px] mx-2 relative">
                    <div className="h-0.5 w-full bg-gray-200" />
                    <ArrowRight className="size-4 text-gray-400 absolute right-0 -mt-px" />
                  </div>
                )}
              </div>
              <div className="sm:mt-4 sm:px-3 flex-1 sm:flex-none">
                <p className="text-xs font-bold text-[#003580] uppercase tracking-widest mb-1">
                  Step {step}
                </p>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Governance note */}
        <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <ShieldCheck className="size-4 text-[#003580] flex-none mt-0.5" />
          <p className="text-xs text-gray-700 leading-relaxed">
            <span className="font-semibold text-[#003580]">Registry Governance:</span>{' '}
            BOCRA governs the .bw registry but registrations are processed through accredited
            registrars. For policy enquiries, contact BOCRA directly at{' '}
            <a href="mailto:dns@bocra.org.bw" className="text-[#003580] underline underline-offset-2">
              dns@bocra.org.bw
            </a>
            .
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
