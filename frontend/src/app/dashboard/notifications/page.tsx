'use client'

import { useState, useMemo } from 'react'
import {
  FileText, MessageCircle, CreditCard, Award, RefreshCw,
  Settings, Check, CheckCheck, Bell, BellOff, X,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | 'APPLICATION_UPDATE'
  | 'COMPLAINT_UPDATE'
  | 'PAYMENT_DUE'
  | 'CERTIFICATE_READY'
  | 'LICENCE_RENEWAL'
  | 'SYSTEM'

type TabFilter = 'All' | 'Unread' | 'Applications' | 'Complaints' | 'Payments' | 'Renewals' | 'System'

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  timestamp: string   // relative display string
  ts: number          // for sorting
  read: boolean
}

interface PrefRow {
  type: NotifType
  label: string
  inApp: boolean
  email: boolean
  sms: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, {
  label: string
  Icon: React.ElementType
  iconBg: string
  iconColor: string
  dot: string
  tab: TabFilter
}> = {
  APPLICATION_UPDATE:  { label: 'Application Update',  Icon: FileText,       iconBg: 'bg-blue-100',   iconColor: 'text-blue-700',   dot: 'bg-blue-500',   tab: 'Applications' },
  COMPLAINT_UPDATE:    { label: 'Complaint Update',    Icon: MessageCircle,   iconBg: 'bg-orange-100', iconColor: 'text-orange-700', dot: 'bg-orange-500', tab: 'Complaints' },
  PAYMENT_DUE:         { label: 'Payment Due',         Icon: CreditCard,      iconBg: 'bg-amber-100',  iconColor: 'text-amber-700',  dot: 'bg-amber-500',  tab: 'Payments' },
  CERTIFICATE_READY:   { label: 'Certificate Ready',   Icon: Award,           iconBg: 'bg-green-100',  iconColor: 'text-green-700',  dot: 'bg-green-500',  tab: 'Applications' },
  LICENCE_RENEWAL:     { label: 'Licence Renewal',     Icon: RefreshCw,       iconBg: 'bg-red-100',    iconColor: 'text-red-700',    dot: 'bg-red-500',    tab: 'Renewals' },
  SYSTEM:              { label: 'System',              Icon: Settings,        iconBg: 'bg-gray-100',   iconColor: 'text-gray-700',   dot: 'bg-gray-400',   tab: 'System' },
}

const TABS: TabFilter[] = ['All', 'Unread', 'Applications', 'Complaints', 'Payments', 'Renewals', 'System']

// ─── Mock notifications ───────────────────────────────────────────────────────

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 'n01', type: 'APPLICATION_UPDATE', read: false, ts: Date.now() - 5 * 60_000,
    timestamp: '5 min ago',
    title: 'Application LCN-APP-2026-0041 Under Review',
    body: 'Your Licence Certificate application has been received and is currently being reviewed by a BOCRA licensing officer. You will be notified when a decision is made.',
  },
  {
    id: 'n02', type: 'PAYMENT_DUE', read: false, ts: Date.now() - 2 * 3_600_000,
    timestamp: '2 hrs ago',
    title: 'Invoice INV-2026-0308 Due in 3 Days',
    body: 'Payment of P 4,200.00 for your annual spectrum licence fee is due on 26 March 2026. Pay now to avoid a late payment penalty.',
  },
  {
    id: 'n03', type: 'CERTIFICATE_READY', read: false, ts: Date.now() - 4 * 3_600_000,
    timestamp: '4 hrs ago',
    title: 'Type Approval Certificate TA-2026-0098 Issued',
    body: 'Your type approval certificate for Xiaomi Redmi Note 13 Pro has been issued and is available for download in the Certificates section.',
  },
  {
    id: 'n04', type: 'COMPLAINT_UPDATE', read: false, ts: Date.now() - 24 * 3_600_000,
    timestamp: 'Yesterday',
    title: 'Complaint CMP-2026-1892 Assigned to Investigator',
    body: 'Your complaint regarding billing dispute with Mascom has been assigned to an investigator. Reference: CMP-2026-1892. Expected resolution within 30 working days.',
  },
  {
    id: 'n05', type: 'LICENCE_RENEWAL', read: false, ts: Date.now() - 2 * 86_400_000,
    timestamp: '2 days ago',
    title: 'Licence LCN-2024-0031 Expiring in 60 Days',
    body: 'Your Licence Certificate for BotswanaTel Communications expires on 15 May 2026. Submit a renewal application now to avoid service interruption.',
  },
  {
    id: 'n06', type: 'SYSTEM', read: true, ts: Date.now() - 3 * 86_400_000,
    timestamp: '3 days ago',
    title: 'Scheduled Maintenance — 22 Mar 2026 02:00–04:00',
    body: 'The BOCRA portal will be unavailable for scheduled maintenance between 02:00 and 04:00 on Saturday 22 March 2026. Plan accordingly.',
  },
  {
    id: 'n07', type: 'APPLICATION_UPDATE', read: true, ts: Date.now() - 5 * 86_400_000,
    timestamp: '5 days ago',
    title: 'Additional Documents Required — APP-2026-0039',
    body: 'Your type approval application for Samsung Galaxy A55 5G requires additional test documentation. Please upload the SAR test report within 14 days.',
  },
  {
    id: 'n08', type: 'PAYMENT_DUE', read: true, ts: Date.now() - 7 * 86_400_000,
    timestamp: '7 days ago',
    title: 'Payment Received — INV-2026-0291',
    body: 'Payment of P 12,500.00 for application fee INV-2026-0291 has been received and confirmed. Receipt RCP-2026-1041 is available in the Payments section.',
  },
  {
    id: 'n09', type: 'COMPLAINT_UPDATE', read: true, ts: Date.now() - 10 * 86_400_000,
    timestamp: '10 days ago',
    title: 'Complaint CMP-2026-1104 Resolved',
    body: 'Your complaint about network coverage has been resolved. Mascom has been directed to improve signal strength in the affected area. Case closed.',
  },
  {
    id: 'n10', type: 'SYSTEM', read: true, ts: Date.now() - 14 * 86_400_000,
    timestamp: '14 days ago',
    title: 'New Feature: Device Verification IMEI Batch Upload',
    body: 'You can now verify up to 500 IMEI numbers at once using the batch CSV upload feature in the Device Verification module.',
  },
]

const INITIAL_PREFS: PrefRow[] = [
  { type: 'APPLICATION_UPDATE', label: 'Application Updates', inApp: true,  email: true,  sms: false },
  { type: 'COMPLAINT_UPDATE',   label: 'Complaint Updates',   inApp: true,  email: true,  sms: true  },
  { type: 'PAYMENT_DUE',        label: 'Payment Reminders',   inApp: true,  email: true,  sms: true  },
  { type: 'CERTIFICATE_READY',  label: 'Certificate Ready',   inApp: true,  email: true,  sms: false },
  { type: 'LICENCE_RENEWAL',    label: 'Licence Renewal',     inApp: true,  email: true,  sms: true  },
  { type: 'SYSTEM',             label: 'System Alerts',       inApp: true,  email: false, sms: false },
]

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 flex-none cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/40',
        checked ? 'bg-[#003580]' : 'bg-gray-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS)
  const [activeTab, setActiveTab] = useState<TabFilter>('All')
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState<PrefRow[]>(INITIAL_PREFS)
  const [prefsSaved, setPrefsSaved] = useState(false)

  // ── Notification helpers ──────────────────────────────────────────────────

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const filtered = useMemo(() => {
    return notifs.filter((n) => {
      if (activeTab === 'All') return true
      if (activeTab === 'Unread') return !n.read
      return TYPE_CONFIG[n.type].tab === activeTab
    })
  }, [notifs, activeTab])

  const unreadCount = notifs.filter((n) => !n.read).length

  const tabCount = (tab: TabFilter): number => {
    if (tab === 'All') return notifs.length
    if (tab === 'Unread') return unreadCount
    return notifs.filter((n) => TYPE_CONFIG[n.type].tab === tab).length
  }

  // ── Preferences helpers ───────────────────────────────────────────────────

  function togglePref(idx: number, channel: 'inApp' | 'email' | 'sms') {
    setPrefs((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [channel]: !p[channel] } : p)),
    )
    setPrefsSaved(false)
  }

  function savePrefs() {
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2500)
  }

  // ─── Preferences panel (shared between desktop sidebar + mobile drawer) ───

  const PrefsPanel = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Notification Preferences</h2>
          <p className="text-xs text-gray-500 mt-0.5">Choose how you receive notifications</p>
        </div>
        {/* Mobile close */}
        <button
          onClick={() => setShowPrefs(false)}
          aria-label="Close preferences panel"
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Type</span>
          {(['In-App', 'Email', 'SMS'] as const).map((ch) => (
            <span key={ch} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-center w-12">
              {ch}
            </span>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          {prefs.map((pref, idx) => {
            const c = TYPE_CONFIG[pref.type]
            return (
              <div key={pref.type} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={cn('size-7 rounded-lg flex items-center justify-center flex-none', c.iconBg)}>
                    <c.Icon className={cn('size-3.5', c.iconColor)} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{pref.label}</span>
                </div>
                <div className="w-12 flex justify-center">
                  <Toggle checked={pref.inApp} onChange={() => togglePref(idx, 'inApp')} />
                </div>
                <div className="w-12 flex justify-center">
                  <Toggle checked={pref.email} onChange={() => togglePref(idx, 'email')} />
                </div>
                <div className="w-12 flex justify-center">
                  <Toggle checked={pref.sms} onChange={() => togglePref(idx, 'sms')} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100">
        <button
          onClick={savePrefs}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50 focus-visible:ring-offset-1',
            prefsSaved
              ? 'bg-green-500 text-white'
              : 'bg-[#003580] hover:bg-[#002a6e] text-white',
          )}
        >
          {prefsSaved ? (
            <><CheckCheck className="size-4" /> Preferences Saved</>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications &amp; Communications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay up to date with your applications, payments, and BOCRA announcements.
          </p>
        </div>
        {/* Mobile Preferences button */}
        <button
          onClick={() => setShowPrefs(true)}
          aria-label="Open notification preferences"
          className="md:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl bg-white text-gray-700 hover:border-gray-400 transition-colors shadow-sm flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Preferences
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* ── Left: Notification feed ── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab bar + mark all */}
          <div className="flex items-center justify-between border-b border-gray-100 px-1 overflow-x-auto">
            <div className="flex">
              {TABS.map((tab) => {
                const count = tabCount(tab)
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    aria-pressed={activeTab === tab}
                    className={cn(
                      'flex items-center gap-1.5 px-4 h-12 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003580]/40',
                      activeTab === tab
                        ? 'border-[#003580] text-[#003580]'
                        : 'border-transparent text-gray-500 hover:text-gray-700',
                    )}
                  >
                    {tab}
                    {count > 0 && (
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1',
                          activeTab === tab
                            ? 'bg-[#003580] text-white'
                            : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium text-[#003580] border border-[#003580]/30 rounded-lg hover:bg-[#003580] hover:text-white transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <BellOff className="size-9 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">No notifications here</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map((n) => {
                const c = TYPE_CONFIG[n.type]
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'group relative flex items-start gap-4 px-5 py-4 transition-colors',
                      n.read ? 'hover:bg-gray-50/60' : 'bg-blue-50/30 hover:bg-blue-50/50',
                    )}
                  >
                    {/* Unread dot */}
                    {!n.read && (
                      <span className={cn('absolute left-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full flex-none', c.dot)} />
                    )}

                    {/* Icon */}
                    <div className={cn('size-9 rounded-xl flex items-center justify-center flex-none mt-0.5', c.iconBg)}>
                      <c.Icon className={cn('size-4', c.iconColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm leading-snug', n.read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900')}>
                          {n.title}
                        </p>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap flex-none mt-0.5">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', c.iconBg, c.iconColor)}>
                          {c.label}
                        </span>
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            aria-label={`Mark "${n.title}" as read`}
                            className="text-[11px] text-gray-400 hover:text-[#003580] flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/50 rounded"
                          >
                            <Check className="size-3" aria-hidden />
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Right: Preferences (desktop) ── */}
        <div className="hidden md:flex flex-col w-[340px] flex-none bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ minHeight: 480 }}>
          {PrefsPanel}
        </div>
      </div>

      {/* ── Mobile Preferences drawer ── */}
      {showPrefs && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowPrefs(false)}
          />
          {/* Panel */}
          <div className="relative flex flex-col w-[320px] max-w-full h-full bg-white shadow-2xl overflow-hidden">
            {PrefsPanel}
          </div>
        </div>
      )}
    </div>
  )
}
