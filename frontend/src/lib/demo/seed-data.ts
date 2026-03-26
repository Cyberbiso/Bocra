/**
 * Demo-mode seed data for hackathon presentation.
 * All data uses realistic Botswana context.
 *
 * Current reference date: 2026-03-23
 */

import type { Notification } from '@/lib/store/slices/notificationsSlice'
import type {
  Complaint,
  ComplaintsResponse,
} from '@/app/api/complaints/route'
import type { SearchResponse } from '@/app/api/search/route'
import type { QoSLocation } from '@/components/dashboard/qos/QoSMap'

// ─── Shared date helpers ───────────────────────────────────────────────────────

export const DEMO_TODAY = '2026-03-23'

// ─── Licensing ─────────────────────────────────────────────────────────────────

export type LicenceStatus     = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED' | 'AWAITING_PAYMENT'

export interface DemoLicence {
  id: string
  licenceNumber: string
  licenceType: string
  category: string
  status: LicenceStatus
  issueDate: string
  expiryDate: string
}

export interface DemoLicenceApplication {
  id: string
  applicationNumber: string
  type: string
  category: string
  status: ApplicationStatus
  submittedDate: string
  lastUpdated: string
}

export interface DemoLicensingData {
  licences: DemoLicence[]
  applications: DemoLicenceApplication[]
}

export const DEMO_LICENSING_DATA: DemoLicensingData = {
  licences: [
    {
      id: 'l1',
      licenceNumber: 'ECN-2019-0031',
      licenceType: 'Electronic Communications Network',
      category: 'Telecommunications',
      status: 'ACTIVE',
      issueDate: '2019-07-01',
      expiryDate: '2028-06-30',
    },
    {
      id: 'l2',
      licenceNumber: 'ISP-2021-0012',
      licenceType: 'Internet Service Provider',
      category: 'Internet Services',
      status: 'EXPIRED',
      issueDate: '2021-03-15',
      expiryDate: '2025-03-14',
    },
    {
      id: 'l3',
      licenceNumber: 'BRD-2020-0008',
      licenceType: 'Broadcasting Service Licence',
      category: 'Broadcasting',
      status: 'ACTIVE',
      issueDate: '2020-09-01',
      expiryDate: '2026-04-12', // expiring in ~20 days — triggers renewal alert
    },
  ],
  applications: [
    {
      id: 'a1',
      applicationNumber: 'APP-2026-00041',
      type: 'New Licence',
      category: 'VSAT / Satellite',
      status: 'UNDER_REVIEW',
      submittedDate: '2026-02-10',
      lastUpdated: '2026-03-18',
    },
    {
      id: 'a2',
      applicationNumber: 'APP-2026-00017',
      type: 'Licence Renewal',
      category: 'Internet Services',
      status: 'AWAITING_PAYMENT',
      submittedDate: '2026-01-28',
      lastUpdated: '2026-03-05',
    },
    {
      id: 'a3',
      applicationNumber: 'APP-2025-00193',
      type: 'Licence Amendment',
      category: 'Telecommunications',
      status: 'APPROVED',
      submittedDate: '2025-11-12',
      lastUpdated: '2026-01-20',
    },
  ],
}

// ─── Complaints ────────────────────────────────────────────────────────────────

const DEMO_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp-001',
    caseNumber: 'CMP-2026-00084',
    subject: 'Persistent dropped calls in G-West, Gaborone',
    operator: 'Mascom Wireless',
    category: 'Voice Quality',
    status: 'NEW',
    submittedDate: '2026-03-22',
    expectedResolution: '2026-04-05',
    assignedOfficer: null,
    submittedBy: 'Kabo Sithole',
  },
  {
    id: 'cmp-002',
    caseNumber: 'CMP-2026-00061',
    subject: 'Unauthorized data charges — three billing cycles',
    operator: 'Orange Botswana',
    category: 'Billing Dispute',
    status: 'PENDING',
    submittedDate: '2026-03-10',
    expectedResolution: '2026-03-31',
    assignedOfficer: 'Refilwe Moagi',
    submittedBy: 'Tiny Lekgowe',
  },
  {
    id: 'cmp-003',
    caseNumber: 'CMP-2026-00043',
    subject: 'Broadband speeds significantly below advertised 50 Mbps plan',
    operator: 'BTC Broadband',
    category: 'Internet Quality',
    status: 'RESOLVED',
    submittedDate: '2026-02-28',
    expectedResolution: '2026-03-14',
    assignedOfficer: 'Mpho Tsheko',
    submittedBy: 'David Moalosi',
  },
  {
    id: 'cmp-004',
    caseNumber: 'CMP-2026-00019',
    subject: 'SIM swap fraud — account accessed without consent',
    operator: 'Mascom Wireless',
    category: 'Security / Fraud',
    status: 'ESCALATED',
    submittedDate: '2026-02-14',
    expectedResolution: '2026-03-01',
    assignedOfficer: 'Gaone Ntsie',
    submittedBy: 'Neo Ramokgopa',
  },
]

export const DEMO_COMPLAINTS_RESPONSE: ComplaintsResponse = {
  data: DEMO_COMPLAINTS,
  meta: {
    total: DEMO_COMPLAINTS.length,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  },
}

// ─── Type Approval ─────────────────────────────────────────────────────────────

export type TypeApprovalStatus = 'APPROVED' | 'REMANDED' | 'PENDING' | 'REJECTED'

export interface DemoTypeApprovalApplication {
  id: string
  applicationNumber: string
  device: string
  brand: string
  model: string
  category: string
  status: TypeApprovalStatus
  submittedDate: string
  lastUpdated: string
  certificateNumber?: string
  certificateIssuedDate?: string
  remandReason?: string
}

export const DEMO_TYPE_APPROVALS: DemoTypeApprovalApplication[] = [
  {
    id: 'ta1',
    applicationNumber: 'TA-2025-00217',
    device: 'LTE Cat-M1 IoT Module',
    brand: 'Quectel',
    model: 'BC660K-GL',
    category: 'IoT / M2M Module',
    status: 'APPROVED',
    submittedDate: '2025-10-05',
    lastUpdated: '2026-01-08',
    certificateNumber: 'TA-CERT-2026-00217',
    certificateIssuedDate: '2026-01-08',
  },
  {
    id: 'ta2',
    applicationNumber: 'TA-2026-00041',
    device: 'Dual-Band WiFi Router',
    brand: 'TP-Link',
    model: 'Archer AX55 Pro',
    category: 'CPE / Router',
    status: 'REMANDED',
    submittedDate: '2026-01-20',
    lastUpdated: '2026-03-12',
    remandReason:
      'SAR test report (IEC 62209-1:2016) missing. Resubmit with accredited lab certificate.',
  },
]

// ─── IMEI / Device Records ─────────────────────────────────────────────────────

export type ImeiStatus = 'Registered' | 'Unregistered' | 'Blacklisted' | 'Reported Stolen'

export interface DemoImeiRecord {
  id: string
  imei: string
  brand: string
  model: string
  verificationStatus: ImeiStatus
  registeredDate?: string
  flaggedDate?: string
  flagReason?: string
}

export const DEMO_IMEI_RECORDS: DemoImeiRecord[] = [
  {
    id: 'imei-1',
    imei: '356938035643809',
    brand: 'Samsung',
    model: 'Galaxy A54 5G',
    verificationStatus: 'Registered',
    registeredDate: '2024-08-15',
  },
  {
    id: 'imei-2',
    imei: '490154203237518',
    brand: 'Tecno',
    model: 'Camon 20 Pro',
    verificationStatus: 'Unregistered',
  },
  {
    id: 'imei-3',
    imei: '012345678901238',
    brand: 'iPhone',
    model: 'iPhone 15',
    verificationStatus: 'Reported Stolen',
    flaggedDate: '2026-02-01',
    flagReason: 'Reported stolen at Riverwalk Mall, Gaborone. Case ref: GPD-2026-00445.',
  },
  {
    id: 'imei-4',
    imei: '864691052793468',
    brand: 'Huawei',
    model: 'Y9 Prime 2019',
    verificationStatus: 'Blacklisted',
    flaggedDate: '2025-07-18',
    flagReason: 'Device associated with fraudulent financial transactions.',
  },
  {
    id: 'imei-5',
    imei: '352099001761481',
    brand: 'Nokia',
    model: 'G60 5G',
    verificationStatus: 'Registered',
    registeredDate: '2025-01-10',
  },
]

// ─── Invoices ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE'

export interface DemoInvoice {
  id: string
  invoiceNumber: string
  description: string
  amount: number
  currency: 'BWP'
  status: InvoiceStatus
  issuedDate: string
  dueDate: string
  paidDate?: string
}

export const DEMO_INVOICES: DemoInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-00318',
    description: 'Annual Licence Fee — Broadcasting Service Licence BRD-2020-0008',
    amount: 48500,
    currency: 'BWP',
    status: 'UNPAID',
    issuedDate: '2026-03-01',
    dueDate: '2026-04-01',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2025-01142',
    description: 'Type Approval Application Fee — TA-2025-00217',
    amount: 3750,
    currency: 'BWP',
    status: 'PAID',
    issuedDate: '2025-10-05',
    dueDate: '2025-10-19',
    paidDate: '2025-10-12',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-00201',
    description: 'ISP Licence Renewal Fee — ISP-2021-0012',
    amount: 22000,
    currency: 'BWP',
    status: 'OVERDUE',
    issuedDate: '2026-01-15',
    dueDate: '2026-02-15',
  },
]

// ─── Cybersecurity Advisories ──────────────────────────────────────────────────

export type AdvisoryLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM'

export interface DemoCyberAdvisory {
  id: string
  title: string
  level: AdvisoryLevel
  publishedDate: string
  summary: string
  affectedSystems: string[]
  mitigation: string
}

export const DEMO_CYBER_ADVISORIES: DemoCyberAdvisory[] = [
  {
    id: 'adv-1',
    title: 'Critical RCE Vulnerability in Fortinet FortiOS (CVE-2024-21762)',
    level: 'CRITICAL',
    publishedDate: '2026-03-14',
    summary:
      'An out-of-bounds write vulnerability in FortiOS SSL-VPN allows remote unauthenticated attackers to execute arbitrary code or commands. Active exploitation confirmed in the Southern Africa region.',
    affectedSystems: ['FortiOS 6.0–7.4', 'FortiProxy 2.0–7.4'],
    mitigation:
      'Upgrade to FortiOS 7.4.3 or later immediately. Disable SSL-VPN if upgrade is not possible.',
  },
  {
    id: 'adv-2',
    title: 'SIM Swap Fraud Campaign Targeting Botswana Mobile Users',
    level: 'HIGH',
    publishedDate: '2026-03-05',
    summary:
      'BOCRA CIRT has identified a coordinated SIM swap campaign using social engineering to defraud mobile banking customers. Operators are advised to enforce strict identity verification for SIM replacements.',
    affectedSystems: ['Mobile operator subscriber databases', 'Mobile banking apps'],
    mitigation:
      'Operators must require in-person ID verification for SIM swaps. Banks should enforce SMS OTP step-up for transfers above BWP 1,000.',
  },
  {
    id: 'adv-3',
    title: 'DNS Cache Poisoning Risk in Unpatched BIND 9.x Deployments',
    level: 'MEDIUM',
    publishedDate: '2026-02-20',
    summary:
      'A cache poisoning vulnerability in BIND 9.11–9.18 could allow attackers to redirect users to malicious websites. ISPs running unpatched recursive resolvers are at risk.',
    affectedSystems: ['BIND 9.11–9.18 recursive resolvers'],
    mitigation:
      'Upgrade to BIND 9.18.24 or 9.19.26. Enable DNS response rate limiting (RRL) and DNSSEC validation.',
  },
]

// ─── Documents / Policies ─────────────────────────────────────────────────────

export type DocCategory = 'Legislation' | 'Guidelines' | 'Forms' | 'Consultations' | 'Reports' | 'Notices'
export type DocModule    = 'Licensing' | 'Type Approval' | 'Complaints' | 'Spectrum' | 'Cybersecurity' | 'Domain Services'

export interface DemoDocument {
  id: string
  title: string
  category: DocCategory
  module: DocModule
  year: number
  date: string
  description: string
  file: string
  consultationCloses?: string
}

export const DEMO_DOCUMENTS: DemoDocument[] = [
  {
    id: 'dd1',
    title: 'Communications Regulatory Authority Act (Cap. 72:04)',
    category: 'Legislation',
    module: 'Licensing',
    year: 2022,
    date: '1 Mar 2022',
    description: 'Principal legislation establishing BOCRA, defining its mandate and powers for regulating communications in Botswana.',
    file: 'cra-act-cap-72-04-2022.pdf',
  },
  {
    id: 'dd2',
    title: 'Type Approval Guidelines for Telecommunications Equipment v3',
    category: 'Guidelines',
    module: 'Type Approval',
    year: 2023,
    date: '20 Jun 2023',
    description: 'Technical requirements and test standards for telecoms equipment before approval for sale or use in Botswana.',
    file: 'type-approval-guidelines-v3-2023.pdf',
  },
  {
    id: 'dd3',
    title: 'Consumer Complaint Handling Procedure v2',
    category: 'Guidelines',
    module: 'Complaints',
    year: 2024,
    date: '12 Aug 2024',
    description: 'Updated procedure for handling consumer complaints including timelines, escalation paths, and resolution standards.',
    file: 'complaint-handling-procedure-v2-2024.pdf',
  },
  {
    id: 'dd4',
    title: 'Draft Spectrum Management Framework 2026 — Public Consultation',
    category: 'Consultations',
    module: 'Spectrum',
    year: 2026,
    date: '3 Mar 2026',
    description: 'BOCRA invites comments on the proposed national spectrum framework for 5G, satellite, and IoT through 2030.',
    file: 'draft-spectrum-framework-2026.pdf',
    consultationCloses: '30 Apr 2026',
  },
  {
    id: 'dd5',
    title: 'National Cybersecurity Incident Reporting Guidelines',
    category: 'Guidelines',
    module: 'Cybersecurity',
    year: 2025,
    date: '10 Jan 2025',
    description: 'Mandatory reporting obligations for telecoms operators on cyber incidents affecting subscriber data or network availability.',
    file: 'cyber-incident-reporting-2025.pdf',
  },
  {
    id: 'dd6',
    title: '.bw Domain Registration Policy v4',
    category: 'Guidelines',
    module: 'Domain Services',
    year: 2024,
    date: '1 Jul 2024',
    description: 'Eligibility, registration, transfer, and dispute resolution rules for .bw second-level domain names.',
    file: 'bw-domain-policy-v4-2024.pdf',
  },
  {
    id: 'dd7',
    title: 'Q3 2025 QoS Monitoring Report — Mobile Operators',
    category: 'Reports',
    module: 'Complaints',
    year: 2025,
    date: '15 Nov 2025',
    description: 'Quarterly network quality metrics for Mascom, Orange, and BTC. Includes voice, data, and SMS KPIs across 8 regions.',
    file: 'qos-report-q3-2025.pdf',
  },
  {
    id: 'dd8',
    title: 'Licence Application Form — Internet Service Provider',
    category: 'Forms',
    module: 'Licensing',
    year: 2024,
    date: '5 Feb 2024',
    description: 'Official form and supporting document checklist for applying for a new ISP licence under the CRA Act.',
    file: 'isp-licence-application-2024.pdf',
  },
]

// ─── Notifications ─────────────────────────────────────────────────────────────

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'LICENCE_RENEWAL',
    title: 'Licence Expiring in 20 Days',
    body: 'Broadcasting Service Licence BRD-2020-0008 expires on 12 Apr 2026. Renew now to avoid service interruption.',
    isRead: false,
    timestamp: '2026-03-23T08:00:00.000Z',
    moduleLink: '/dashboard/licensing',
  },
  {
    id: 'notif-2',
    type: 'PAYMENT_DUE',
    title: 'Invoice Overdue — BWP 22,000',
    body: 'Invoice INV-2026-00201 for ISP Licence Renewal was due on 15 Feb 2026. Pay immediately to avoid licence suspension.',
    isRead: false,
    timestamp: '2026-03-20T09:15:00.000Z',
    moduleLink: '/dashboard/payments',
  },
  {
    id: 'notif-3',
    type: 'COMPLAINT_UPDATE',
    title: 'Complaint Escalated',
    body: 'Case CMP-2026-00019 (SIM swap fraud) has been escalated to senior management. Expected resolution by 28 Mar 2026.',
    isRead: false,
    timestamp: '2026-03-18T14:30:00.000Z',
    moduleLink: '/dashboard/complaints/cmp-004',
  },
  {
    id: 'notif-4',
    type: 'APPLICATION_UPDATE',
    title: 'Application Under Review',
    body: 'Your VSAT licence application APP-2026-00041 has moved to the technical review stage.',
    isRead: false,
    timestamp: '2026-03-18T11:00:00.000Z',
    moduleLink: '/dashboard/licensing',
  },
  {
    id: 'notif-5',
    type: 'CERTIFICATE_READY',
    title: 'Type Approval Certificate Issued',
    body: 'Certificate TA-CERT-2026-00217 for the Quectel BC660K-GL IoT Module is ready for download.',
    isRead: true,
    timestamp: '2026-01-08T10:00:00.000Z',
    moduleLink: '/dashboard/type-approval',
  },
  {
    id: 'notif-6',
    type: 'COMPLAINT_UPDATE',
    title: 'Complaint Resolved',
    body: 'Case CMP-2026-00043 regarding BTC Broadband speeds has been resolved. Please rate your experience.',
    isRead: true,
    timestamp: '2026-03-14T16:00:00.000Z',
    moduleLink: '/dashboard/complaints/cmp-003',
  },
  {
    id: 'notif-7',
    type: 'SYSTEM',
    title: 'Scheduled Maintenance — 25 Mar 2026',
    body: 'The operator portal will be unavailable from 02:00–04:00 SAST on 25 Mar 2026 for planned infrastructure upgrades.',
    isRead: true,
    timestamp: '2026-03-17T08:00:00.000Z',
  },
  {
    id: 'notif-8',
    type: 'PAYMENT_DUE',
    title: 'Invoice Due in 9 Days',
    body: 'Invoice INV-2026-00318 for Broadcasting Licence annual fee (BWP 48,500) is due on 1 Apr 2026.',
    isRead: false,
    timestamp: '2026-03-22T08:00:00.000Z',
    moduleLink: '/dashboard/payments',
  },
  {
    id: 'notif-9',
    type: 'APPLICATION_UPDATE',
    title: 'Amendment Approved',
    body: 'Licence amendment application APP-2025-00193 has been approved. Updated licence conditions attached.',
    isRead: true,
    timestamp: '2026-01-20T13:45:00.000Z',
    moduleLink: '/dashboard/licensing',
  },
  {
    id: 'notif-10',
    type: 'SYSTEM',
    title: 'New Cybersecurity Advisory Published',
    body: 'BOCRA CIRT has published a CRITICAL advisory on FortiOS CVE-2024-21762. Review and apply patches immediately.',
    isRead: false,
    timestamp: '2026-03-14T09:00:00.000Z',
    moduleLink: '/dashboard/cybersecurity',
  },
]

// ─── QoS Providers ────────────────────────────────────────────────────────────

export interface DemoProvider {
  id: string
  name: string
  color: string
  primaryMetric: { id: string; label: string; value: number | null }
  secondaryMetrics: { id: string; label: string; value: number | null }[]
}

export const DEMO_QOS_PROVIDERS: DemoProvider[] = [
  {
    id: 'mascom',
    name: 'Mascom',
    color: '#204079',
    primaryMetric: { id: 'voice_na', label: '3G Voice NA', value: 1.82 },
    secondaryMetrics: [
      { id: 'voice_sa', label: 'Voice SA', value: 97.2 },
      { id: 'voice_sr', label: 'Voice SR', value: 94.5 },
    ],
  },
  {
    id: 'orange',
    name: 'Orange',
    color: '#fa6403',
    primaryMetric: { id: 'voice_na', label: '3G Voice NA', value: 2.14 },
    secondaryMetrics: [
      { id: 'voice_sa', label: 'Voice SA', value: 96.8 },
      { id: 'voice_sr', label: 'Voice SR', value: 93.1 },
    ],
  },
  {
    id: 'btc',
    name: 'BTC',
    color: '#46a33e',
    primaryMetric: { id: 'voice_na', label: '3G Voice NA', value: 1.55 },
    secondaryMetrics: [
      { id: 'voice_sa', label: 'Voice SA', value: 98.1 },
      { id: 'voice_sr', label: 'Voice SR', value: 95.8 },
    ],
  },
]

export const DEMO_NMS_SUMMARY = { providers: DEMO_QOS_PROVIDERS }

// ─── QoS Locations ────────────────────────────────────────────────────────────

export const DEMO_QOS_LOCATIONS: QoSLocation[] = [
  {
    id: 1,
    name: 'Gaborone',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Gaborone' },
      geometry: { type: 'Polygon', coordinates: [[[25.85, -24.72], [25.98, -24.72], [25.98, -24.60], [25.85, -24.60], [25.85, -24.72]]] },
    },
  },
  {
    id: 2,
    name: 'Francistown',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Francistown' },
      geometry: { type: 'Polygon', coordinates: [[[27.43, -21.22], [27.56, -21.22], [27.56, -21.12], [27.43, -21.12], [27.43, -21.22]]] },
    },
  },
  {
    id: 3,
    name: 'Maun',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Maun' },
      geometry: { type: 'Polygon', coordinates: [[[23.37, -20.02], [23.49, -20.02], [23.49, -19.93], [23.37, -19.93], [23.37, -20.02]]] },
    },
  },
  {
    id: 4,
    name: 'Serowe',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Serowe' },
      geometry: { type: 'Polygon', coordinates: [[[26.65, -22.45], [26.76, -22.45], [26.76, -22.37], [26.65, -22.37], [26.65, -22.45]]] },
    },
  },
  {
    id: 5,
    name: 'Lobatse',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Lobatse' },
      geometry: { type: 'Polygon', coordinates: [[[25.62, -25.27], [25.72, -25.27], [25.72, -25.20], [25.62, -25.20], [25.62, -25.27]]] },
    },
  },
  {
    id: 6,
    name: 'Kasane',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Kasane' },
      geometry: { type: 'Polygon', coordinates: [[[25.14, -17.85], [25.25, -17.85], [25.25, -17.78], [25.14, -17.78], [25.14, -17.85]]] },
    },
  },
  {
    id: 7,
    name: 'Palapye',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Palapye' },
      geometry: { type: 'Polygon', coordinates: [[[27.10, -22.58], [27.21, -22.58], [27.21, -22.50], [27.10, -22.50], [27.10, -22.58]]] },
    },
  },
  {
    id: 8,
    name: 'Kanye',
    area_feature: {
      type: 'Feature',
      properties: { name: 'Kanye' },
      geometry: { type: 'Polygon', coordinates: [[[25.32, -25.00], [25.43, -25.00], [25.43, -24.93], [25.32, -24.93], [25.32, -25.00]]] },
    },
  },
]

export const DEMO_LOCATIONS_RESPONSE = { locations: DEMO_QOS_LOCATIONS, source: 'mock' as const }

// ─── Search Results ────────────────────────────────────────────────────────────

export const DEMO_SEARCH_RESPONSE: SearchResponse = {
  licences: [
    { id: 'l1', clientName: 'Demo Corp (Pty) Ltd', licenceNumber: 'ECN-2019-0031', licenceType: 'Electronic Communications Network', status: 'Active', expiryDate: '2028-06-30' },
    { id: 'l3', clientName: 'Demo Corp (Pty) Ltd', licenceNumber: 'BRD-2020-0008', licenceType: 'Broadcasting Service Licence', status: 'Active', expiryDate: '2026-04-12' },
    { id: 'l2', clientName: 'Demo Corp (Pty) Ltd', licenceNumber: 'ISP-2021-0012', licenceType: 'Internet Service Provider', status: 'Expired', expiryDate: '2025-03-14' },
  ],
  certificates: [
    { id: 'c1', certificateNumber: 'TA-CERT-2026-00217', type: 'Type Approval Certificate', issuedDate: '2026-01-08', status: 'Valid' },
  ],
  typeApprovals: [
    { id: 'ta1', device: 'LTE Cat-M1 IoT Module', brand: 'Quectel', model: 'BC660K-GL', approvalDate: '2026-01-08', status: 'Approved' },
    { id: 'ta2', device: 'Dual-Band WiFi Router', brand: 'TP-Link', model: 'Archer AX55 Pro', approvalDate: '', status: 'Pending' },
  ],
  devices: [
    { id: 'imei-1', imei: '356938035643809', brand: 'Samsung', model: 'Galaxy A54 5G', verificationStatus: 'Registered' },
    { id: 'imei-3', imei: '012345678901238', brand: 'Apple', model: 'iPhone 15', verificationStatus: 'Reported Stolen' },
    { id: 'imei-4', imei: '864691052793468', brand: 'Huawei', model: 'Y9 Prime 2019', verificationStatus: 'Blacklisted' },
  ],
  organizations: [
    { id: 'org-1', name: 'Demo Corp (Pty) Ltd', registrationNumber: 'BW-2018-004421', type: 'Private Company', status: 'Active' },
  ],
  meta: { query: 'demo', category: 'all', totalResults: 9 },
}
