'use client'

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Building2,
  Smartphone,
  Download,
  FileText,
  Receipt,
  Loader2,
  Check,
  AlertCircle,
  Banknote,
  Search,
  X,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppSelector } from '@/lib/store/hooks'
import { isBocraStaff } from '@/lib/types/roles'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus  = 'UNPAID' | 'OVERDUE'
type PaymentStatus  = 'COMPLETED' | 'FAILED' | 'PENDING'
type PaymentMethod  = 'mobile_money' | 'bank_transfer' | 'card'

interface Invoice {
  id: string
  number: string
  application: string
  description: string
  amount: number
  vat: number
  dueDate: string
  status: InvoiceStatus
}

interface PaymentRecord {
  id: string
  date: string
  invoiceNumber: string
  service: string
  amount: number
  method: string
  reference: string
  status: PaymentStatus
}

interface Receipt {
  id: string
  number: string
  date: string
  service: string
  amount: number
  invoiceNumber: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// TODO: GET https://op-web.bocra.org.bw/api/invoices?userId={id}&status=unpaid
// TODO: GET https://op-web.bocra.org.bw/api/payments?userId={id}
// TODO: GET https://op-web.bocra.org.bw/api/receipts?userId={id}

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)
function addDays(d: Date, n: number) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10)
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    number: 'INV-2025-0019',
    application: 'APP-2025-00412',
    description: 'Spectrum Authorisation Application Fee',
    amount: 8_000,
    vat: 1_120,
    dueDate: addDays(TODAY, -5),
    status: 'OVERDUE',
  },
  {
    id: 'inv2',
    number: 'INV-2024-0187',
    application: 'LCN-2021-0056',
    description: 'Annual Spectrum Management Fee — 2024/25',
    amount: 3_200,
    vat: 448,
    dueDate: addDays(TODAY, -45),
    status: 'OVERDUE',
  },
  {
    id: 'inv3',
    number: 'INV-2025-0031',
    application: 'APP-2025-00098',
    description: 'Type Approval Application Fee (Xiaomi Redmi Note 13 Pro)',
    amount: 2_500,
    vat: 350,
    dueDate: addDays(TODAY, 3),
    status: 'UNPAID',
  },
  {
    id: 'inv4',
    number: 'INV-2025-0041',
    application: 'EX-2025-0023',
    description: 'Exemption Certificate — Gaborone City Council',
    amount: 1_500,
    vat: 210,
    dueDate: addDays(TODAY, 7),
    status: 'UNPAID',
  },
  {
    id: 'inv5',
    number: 'INV-2025-0028',
    application: 'LCN-2024-0031',
    description: 'Electronic Communications Licence Renewal Fee',
    amount: 5_000,
    vat: 700,
    dueDate: addDays(TODAY, 15),
    status: 'UNPAID',
  },
]

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay1',
    date: '2025-01-15',
    invoiceNumber: 'INV-2024-0150',
    service: 'Annual Licence Fee',
    amount: 2_850,
    method: 'Orange Money',
    reference: 'OM-20250115-7734',
    status: 'COMPLETED',
  },
  {
    id: 'pay2',
    date: '2025-02-03',
    invoiceNumber: 'INV-2025-0005',
    service: 'Type Approval Certificate Fee',
    amount: 1_710,
    method: 'Bank Transfer',
    reference: 'BTR-20250203-1192',
    status: 'COMPLETED',
  },
  {
    id: 'pay3',
    date: '2025-02-28',
    invoiceNumber: 'INV-2025-0011',
    service: 'Licence Renewal — ISP-2021-0012',
    amount: 5_700,
    method: 'Card',
    reference: 'CARD-20250228-4401',
    status: 'FAILED',
  },
  {
    id: 'pay4',
    date: '2025-03-05',
    invoiceNumber: 'INV-2025-0014',
    service: 'Device Verification Batch Fee',
    amount: 285,
    method: 'Smega',
    reference: 'SMG-20250305-9981',
    status: 'COMPLETED',
  },
  {
    id: 'pay5',
    date: '2025-03-10',
    invoiceNumber: 'INV-2025-0018',
    service: 'Spectrum Fee Deposit — Q1 2025',
    amount: 4_560,
    method: 'Bank Transfer',
    reference: 'BTR-20250310-2250',
    status: 'PENDING',
  },
]

const MOCK_RECEIPTS: Receipt[] = [
  {
    id: 'rcp1',
    number: 'RCP-2025-0001',
    date: '2025-01-15',
    service: 'Annual Licence Fee',
    amount: 2_850,
    invoiceNumber: 'INV-2024-0150',
  },
  {
    id: 'rcp2',
    number: 'RCP-2025-0002',
    date: '2025-02-03',
    service: 'Type Approval Certificate Fee',
    amount: 1_710,
    invoiceNumber: 'INV-2025-0005',
  },
  {
    id: 'rcp3',
    number: 'RCP-2025-0003',
    date: '2025-03-05',
    service: 'Device Verification Batch Fee',
    amount: 285,
    invoiceNumber: 'INV-2025-0014',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bwp(amount: number): string {
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `P ${formatted}`
}

function daysOverdue(dateStr: string): number {
  const t = new Date(dateStr); t.setHours(0, 0, 0, 0)
  return Math.ceil((TODAY.getTime() - t.getTime()) / 86_400_000)
}

function daysUntil(dateStr: string): number {
  const t = new Date(dateStr); t.setHours(0, 0, 0, 0)
  return Math.ceil((t.getTime() - TODAY.getTime()) / 86_400_000)
}

function makeReceiptNumber(): string {
  const year = new Date().getFullYear()
  return `RCP-${year}-${String(Math.floor(Math.random() * 90000) + 10000)}`
}

function downloadReceiptText(receipt: Receipt) {
  const date = new Date().toLocaleDateString('en-BW', { day: '2-digit', month: 'long', year: 'numeric' })
  const content = [
    '======================================================',
    '  BOTSWANA COMMUNICATIONS REGULATORY AUTHORITY',
    '  OFFICIAL PAYMENT RECEIPT',
    '======================================================',
    `  Receipt No:     ${receipt.number}`,
    `  Invoice No:     ${receipt.invoiceNumber}`,
    `  Date:           ${receipt.date}`,
    `  Service:        ${receipt.service}`,
    `  Amount Paid:    ${bwp(receipt.amount)}`,
    `  Downloaded:     ${date}`,
    '------------------------------------------------------',
    '  Payment received by BOCRA.',
    '  Tel: +267 395 7755 | www.bocra.org.bw',
    '======================================================',
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `BOCRA_${receipt.number}.txt`; a.click()
  URL.revokeObjectURL(url)
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500',
      'border-b border-gray-200 whitespace-nowrap',
      className,
    )}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3.5 text-sm border-b border-gray-100 align-top', className)}>
      {children}
    </td>
  )
}

// ─── Payment method cards ─────────────────────────────────────────────────────

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub: string; icon: React.ElementType }[] = [
  { id: 'mobile_money',  label: 'Mobile Money',   sub: 'Orange Money or Smega', icon: Smartphone  },
  { id: 'bank_transfer', label: 'Bank Transfer',  sub: 'EFT or branch deposit', icon: Building2   },
  { id: 'card',          label: 'Card Payment',   sub: 'Visa or Mastercard',    icon: CreditCard  },
]

// ─── Pay Now Dialog ───────────────────────────────────────────────────────────

function PayNowDialog({
  invoice,
  open,
  onClose,
  onPaid,
  isStaff = false,
}: {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  onPaid: (invoiceId: string, receiptNumber: string) => void
  isStaff?: boolean
}) {
  const [method,    setMethod]    = useState<PaymentMethod>('mobile_money')
  const [reference, setReference] = useState('')
  const [paying,    setPaying]    = useState(false)
  const [receipt,   setReceipt]   = useState<string | null>(null)
  const [refError,  setRefError]  = useState('')

  const handleClose = () => {
    onClose()
    // Reset after animation
    setTimeout(() => { setReceipt(null); setReference(''); setRefError(''); setPaying(false) }, 200)
  }

  const handlePay = async () => {
    if (!reference.trim()) { setRefError('Please enter a payment reference.'); return }
    setRefError('')
    setPaying(true)
    // TODO: POST /api/payments { invoiceId, method, reference }
    await new Promise((r) => setTimeout(r, 1500))
    const rcpNum = makeReceiptNumber()
    setReceipt(rcpNum)
    setPaying(false)
    if (invoice) onPaid(invoice.id, rcpNum)
  }

  const refPlaceholder =
    method === 'mobile_money'  ? 'e.g. OM-20250323-7890 or SMG-20250323-1234' :
    method === 'bank_transfer' ? 'e.g. BTR-20250323-4567 or deposit slip no.' :
                                  'e.g. CARD-20250323-8901'

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogTitle className="sr-only">Pay Invoice {invoice.number}</DialogTitle>

        {receipt ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {isStaff ? 'Payment Recorded' : 'Payment Confirmed'}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {isStaff
                  ? `The payment for ${invoice.number} has been captured and a receipt entry has been issued.`
                  : `Your payment for ${invoice.number} has been received. A receipt has been issued.`}
              </p>
            </div>
            <div className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 space-y-0.5">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Receipt Number</p>
              <p className="text-xl font-bold text-emerald-700 font-mono">{receipt}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-gray-400">Invoice</p>
                <p className="font-medium text-gray-700 font-mono">{invoice.number}</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-gray-400">Amount Paid</p>
                <p className="font-semibold text-gray-800">{bwp(invoice.amount + invoice.vat)}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full rounded-xl bg-[#003580] text-white py-2.5 text-sm font-semibold hover:bg-[#002a6b] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Payment form ── */
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-gray-900">
                {isStaff ? 'Record Payment' : 'Pay Invoice'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isStaff
                  ? 'Capture payment details against the selected invoice and issue the receipt entry below.'
                  : 'Complete payment for the invoice below.'}
              </p>
            </div>

            {/* Invoice summary */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <code className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-700">
                    {invoice.number}
                  </code>
                  <p className="text-sm font-medium text-gray-800 mt-1 leading-snug">{invoice.description}</p>
                </div>
                {invoice.status === 'OVERDUE' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </div>
              <div className="h-px bg-gray-200" />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Amount</p>
                  <p className="font-medium text-gray-700">{bwp(invoice.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400">VAT (14%)</p>
                  <p className="font-medium text-gray-700">{bwp(invoice.vat)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Total Due</p>
                  <p className="font-bold text-[#003580] text-sm">{bwp(invoice.amount + invoice.vat)}</p>
                </div>
              </div>
            </div>

            {/* Payment method selection */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon
                  const active = method === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all focus:outline-none',
                        active
                          ? 'border-[#003580] bg-blue-50/40 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300',
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        active ? 'bg-[#003580]/10 text-[#003580]' : 'bg-gray-100 text-gray-400',
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={cn('text-xs font-semibold leading-tight', active ? 'text-[#003580]' : 'text-gray-600')}>
                        {m.label}
                      </span>
                      <span className="text-[10px] text-gray-400 leading-tight">{m.sub}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bank details (bank transfer only) */}
            {method === 'bank_transfer' && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3 space-y-2 text-xs">
                <p className="font-semibold text-[#003580] text-xs uppercase tracking-wide">Bank Details</p>
                {[
                  ['Bank',       'First National Bank Botswana'],
                  ['Account',    'BOCRA Revenue Account'],
                  ['Acc. No.',   '62012345678'],
                  ['Branch',     'Main Mall Branch (282672)'],
                  ['Reference',  invoice.number],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <span className="w-16 text-gray-400 shrink-0">{k}</span>
                    <span className="font-medium text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reference input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Payment Reference <span className="text-red-500">*</span>
              </label>
              <input
                value={reference}
                onChange={(e) => { setReference(e.target.value); setRefError('') }}
                placeholder={refPlaceholder}
                className={cn(
                  'w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm text-gray-800',
                  'placeholder:text-gray-400 focus:outline-none transition-colors',
                  refError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#003580]',
                )}
              />
              {refError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {refError}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {isStaff
                  ? 'Enter the payer transaction reference from the bank, card, or mobile money confirmation.'
                  : 'Enter the transaction reference from your bank or mobile money confirmation.'}
              </p>
            </div>

            {/* Confirm button */}
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#003580] text-white py-3 text-sm font-semibold hover:bg-[#002a6b] transition-colors shadow-sm disabled:opacity-60"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{isStaff ? 'Recording payment…' : 'Processing payment…'}</>
              ) : (
                <><Check className="w-4 h-4" />{isStaff ? 'Record Payment' : 'Confirm Payment'} — {bwp(invoice.amount + invoice.vat)}</>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Tab 1 — Outstanding Invoices ─────────────────────────────────────────────

function InvoicesTab({
  invoices,
  paidIds,
  onPay,
  isStaff = false,
}: {
  invoices: Invoice[]
  paidIds: Set<string>
  onPay: (invoice: Invoice) => void
  isStaff?: boolean
}) {
  const [query, setQuery] = useState('')
  const outstanding = useMemo(() => {
    const base = invoices.filter((inv) => !paidIds.has(inv.id))
    if (!query.trim()) return base
    const q = query.toLowerCase()
    return base.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.application.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q),
    )
  }, [invoices, paidIds, query])
  const allOutstanding = invoices.filter((inv) => !paidIds.has(inv.id))
  const overdue = allOutstanding.filter((i) => i.status === 'OVERDUE')
  const totalOwing = allOutstanding.reduce((s, i) => s + i.amount + i.vat, 0)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isStaff ? 'Search by invoice number, application, service, or debtor…' : 'Search by invoice number, application, or description…'}
          className="w-full h-9 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Summary strip */}
      {allOutstanding.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Total Outstanding</p>
              {isStaff && <p className="text-[10px] text-gray-400">Open billing queue</p>}
              <p className="text-sm font-bold text-gray-800">{bwp(totalOwing)}</p>
            </div>
          </div>
          {overdue.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs text-red-600">{isStaff ? 'Requires Follow-up' : 'Overdue'}</p>
                <p className="text-sm font-bold text-red-700">
                  {overdue.length} invoice{overdue.length !== 1 ? 's' : ''} — {bwp(overdue.reduce((s, i) => s + i.amount + i.vat, 0))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {allOutstanding.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          <p className="text-sm font-medium text-emerald-600">
            {isStaff ? 'Billing queue is clear' : 'All invoices paid'}
          </p>
          <p className="text-xs">
            {isStaff ? 'No outstanding invoices require settlement right now.' : 'No outstanding amounts. Check Payment History for records.'}
          </p>
        </div>
      ) : outstanding.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-400">
          <Search className="w-8 h-8" />
          <p className="text-sm">{isStaff ? 'No billing items match your search.' : 'No invoices match your search.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr>
                <Th>Invoice No.</Th>
                <Th>Application / Service</Th>
                <Th className="min-w-[200px]">Description</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">VAT</Th>
                <Th className="text-right font-bold">Total (BWP)</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {outstanding.map((inv) => {
                const isOverdue = inv.status === 'OVERDUE'
                const days = isOverdue ? daysOverdue(inv.dueDate) : daysUntil(inv.dueDate)
                return (
                  <tr
                    key={inv.id}
                    className={cn(
                      'transition-colors',
                      isOverdue ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-gray-50/60',
                    )}
                  >
                    <Td>
                      <code className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-700">
                        {inv.number}
                      </code>
                    </Td>
                    <Td>
                      <code className="text-xs text-gray-500 font-mono">{inv.application}</code>
                    </Td>
                    <Td className="text-gray-700 leading-snug">{inv.description}</Td>
                    <Td className="text-right text-gray-600 whitespace-nowrap tabular-nums">{bwp(inv.amount)}</Td>
                    <Td className="text-right text-gray-500 whitespace-nowrap tabular-nums">{bwp(inv.vat)}</Td>
                    <Td className="text-right font-bold text-gray-900 whitespace-nowrap tabular-nums">
                      {bwp(inv.amount + inv.vat)}
                    </Td>
                    <Td>
                      <span className={cn('text-sm', isOverdue ? 'text-red-600 font-semibold' : days <= 7 ? 'text-amber-600 font-medium' : 'text-gray-500')}>
                        {inv.dueDate}
                      </span>
                      <p className={cn('text-xs mt-0.5', isOverdue ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-gray-400')}>
                        {isOverdue ? `${days}d overdue` : `${days}d remaining`}
                      </p>
                    </Td>
                    <Td>
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          <Clock className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => onPay(inv)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm',
                          isOverdue
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-[#003580] text-white hover:bg-[#002a6b]',
                        )}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {isStaff ? 'Record Payment' : 'Pay Now'}
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab 2 — Payment History ──────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  COMPLETED: { label: 'Completed', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED:    { label: 'Failed',    icon: XCircle,      cls: 'bg-red-50 text-red-700 border-red-200'             },
  PENDING:   { label: 'Pending',   icon: Clock,        cls: 'bg-amber-50 text-amber-700 border-amber-200'       },
}

function PaymentHistoryTab({ payments, isStaff = false }: { payments: PaymentRecord[]; isStaff?: boolean }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query.trim()) return payments
    const q = query.toLowerCase()
    return payments.filter(
      (p) =>
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.service.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q),
    )
  }, [payments, query])

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-400">
        <Receipt className="w-8 h-8" />
        <p className="text-sm">{isStaff ? 'No payment ledger entries yet.' : 'No payment history yet.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isStaff ? 'Search the payment ledger by invoice, service, or reference…' : 'Search by invoice number, service, or reference…'}
          className="w-full h-9 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr>
            <Th>Payment Date</Th>
            <Th>Invoice No.</Th>
            <Th className="min-w-[180px]">Service</Th>
            <Th className="text-right">Amount Paid</Th>
            <Th>Method</Th>
            <Th>Reference</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                No payments match your search.
              </td>
            </tr>
          ) : filtered.map((pay) => {
            const { label, icon: Icon, cls } = PAYMENT_STATUS_CONFIG[pay.status]
            return (
              <tr key={pay.id} className={cn(
                'hover:bg-gray-50/60 transition-colors',
                pay.status === 'FAILED' && 'bg-red-50/20',
              )}>
                <Td className="text-gray-600 whitespace-nowrap">{pay.date}</Td>
                <Td>
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">
                    {pay.invoiceNumber}
                  </code>
                </Td>
                <Td className="text-gray-700 leading-snug">{pay.service}</Td>
                <Td className="text-right font-semibold text-gray-800 whitespace-nowrap tabular-nums">
                  {bwp(pay.amount)}
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {pay.method === 'Orange Money' || pay.method === 'Smega'
                      ? <Smartphone className="w-3 h-3" />
                      : pay.method === 'Bank Transfer'
                        ? <Building2 className="w-3 h-3" />
                        : <CreditCard className="w-3 h-3" />
                    }
                    {pay.method}
                  </span>
                </Td>
                <Td>
                  <code className="text-xs text-gray-500 font-mono">{pay.reference}</code>
                </Td>
                <Td>
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', cls)}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}

// ─── Tab 3 — Receipts ─────────────────────────────────────────────────────────

function ReceiptsTab({ receipts, isStaff = false }: { receipts: Receipt[]; isStaff?: boolean }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query.trim()) return receipts
    const q = query.toLowerCase()
    return receipts.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q),
    )
  }, [receipts, query])

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-400">
        <FileText className="w-8 h-8" />
        <p className="text-sm">{isStaff ? 'No receipts have been issued yet.' : 'No receipts yet.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isStaff ? 'Search the receipt register by receipt, invoice, or service…' : 'Search by receipt number, invoice number, or service…'}
          className="w-full h-9 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr>
              <Th>Receipt No.</Th>
              <Th>Invoice No.</Th>
              <Th>Date</Th>
              <Th className="min-w-[200px]">Service</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Download</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                  No receipts match your search.
                </td>
              </tr>
            ) : filtered.map((rcp) => (
              <tr key={rcp.id} className="hover:bg-gray-50/60 transition-colors">
                <Td>
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
                    {rcp.number}
                  </code>
                </Td>
                <Td>
                  <code className="text-xs text-gray-500 font-mono">{rcp.invoiceNumber}</code>
                </Td>
                <Td className="text-gray-500 whitespace-nowrap">{rcp.date}</Td>
                <Td className="text-gray-700">{rcp.service}</Td>
                <Td className="text-right font-semibold text-gray-800 whitespace-nowrap tabular-nums">
                  {bwp(rcp.amount)}
                </Td>
                <Td className="text-right">
                  <button
                    onClick={() => downloadReceiptText(rcp)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isStaff ? 'Open Receipt' : 'Download PDF'}
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const role = useAppSelector((s) => s.role.role)
  const isStaff = isBocraStaff(role)
  const [paidIds, setPaidIds]         = useState<Set<string>>(new Set())
  const [payingInvoice, setPayInv]    = useState<Invoice | null>(null)
  const [dialogOpen, setDialogOpen]   = useState(false)

  // Receipts include both mock + newly paid this session
  const [sessionReceipts, setSessionReceipts] = useState<Receipt[]>([])
  const allReceipts = [...MOCK_RECEIPTS, ...sessionReceipts]
  const outstandingInvoices = MOCK_INVOICES.filter((i) => !paidIds.has(i.id))
  const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => sum + invoice.amount + invoice.vat, 0)
  const completedPayments = MOCK_PAYMENTS.filter((payment) => payment.status === 'COMPLETED').length
  const pendingLedger = MOCK_PAYMENTS.filter((payment) => payment.status === 'PENDING').length

  const overdueCount = MOCK_INVOICES.filter(
    (i) => i.status === 'OVERDUE' && !paidIds.has(i.id),
  ).length

  const handlePay = (invoice: Invoice) => {
    setPayInv(invoice)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setTimeout(() => setPayInv(null), 200)
  }

  const handlePaid = (invoiceId: string, receiptNumber: string) => {
    setPaidIds((prev) => new Set([...prev, invoiceId]))
    const inv = MOCK_INVOICES.find((i) => i.id === invoiceId)
    if (inv) {
      setSessionReceipts((prev) => [...prev, {
        id: `session-${invoiceId}`,
        number: receiptNumber,
        date: new Date().toISOString().slice(0, 10),
        service: inv.description,
        amount: inv.amount + inv.vat,
        invoiceNumber: inv.number,
      }])
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments & Billing</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isStaff
            ? 'Monitor open invoices, record incoming payments, and manage the BOCRA receipt register.'
            : 'Manage invoices, track payments, and download receipts.'}
        </p>
      </div>

      <div className={cn(
        'rounded-xl border px-5 py-4 flex items-start gap-3',
        isStaff ? 'border-[#003580]/15 bg-[#003580]/5' : 'border-gray-200 bg-white shadow-sm',
      )}>
        <Receipt className={cn('w-5 h-5 shrink-0 mt-0.5', isStaff ? 'text-[#003580]' : 'text-gray-400')} />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {isStaff ? 'BOCRA Revenue Desk Workspace' : 'Applicant Billing Workspace'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isStaff
              ? 'Staff use this page to reconcile invoices, capture payment references, and keep the receipt register current.'
              : 'Use this page to settle invoices, follow your payment history, and retrieve BOCRA receipts.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(isStaff
          ? [
              { label: 'Billing Queue', value: outstandingInvoices.length, accent: 'border-blue-200 bg-blue-50 text-blue-800' },
              { label: 'Overdue Follow-up', value: overdueCount, accent: overdueCount > 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-600' },
              { label: 'Pending Ledger Items', value: pendingLedger, accent: pendingLedger > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-gray-600' },
              { label: 'Receipts Issued', value: allReceipts.length, accent: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
            ]
          : [
              { label: 'Outstanding Total', value: bwp(totalOutstanding), accent: 'border-blue-200 bg-blue-50 text-blue-800' },
              { label: 'Overdue Invoices', value: overdueCount, accent: overdueCount > 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-600' },
              { label: 'Completed Payments', value: completedPayments, accent: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
              { label: 'Receipts Available', value: allReceipts.length, accent: 'border-amber-200 bg-amber-50 text-amber-800' },
            ]).map((card) => (
          <div key={card.label} className={cn('rounded-xl border px-4 py-3.5', card.accent)}>
            <p className="text-[11px] font-semibold uppercase tracking-wide">{card.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Overdue alert ────────────────────────────────────────────────── */}
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {isStaff
                ? `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''} requiring billing follow-up`
                : `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''} requiring immediate payment`}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {isStaff ? (
                <>
                  Review the queue, capture settlements, or escalate debtor follow-up before the related service is suspended.
                </>
              ) : (
                <>
                  Overdue payments may result in licence suspension or regulatory action.
                  Contact BOCRA on <strong>+267 395 7755</strong> if you need a payment extension.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Tabs defaultValue="invoices">
          {/* Tab bar */}
          <TabsList
            variant="line"
            className="w-full h-auto rounded-none p-0 bg-transparent border-b border-gray-200 gap-0"
          >
            <TabsTrigger
              value="invoices"
              className="rounded-none h-12 px-5 text-sm flex-none after:bg-[#003580] data-active:text-[#003580] data-active:font-semibold"
            >
              {isStaff ? 'Billing Queue' : 'Outstanding Invoices'}
              {overdueCount > 0 && (
                <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[11px] font-bold text-red-700">
                  {overdueCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none h-12 px-5 text-sm flex-none after:bg-[#003580] data-active:text-[#003580] data-active:font-semibold"
            >
              {isStaff ? 'Payment Ledger' : 'Payment History'}
            </TabsTrigger>
            <TabsTrigger
              value="receipts"
              className="rounded-none h-12 px-5 text-sm flex-none after:bg-[#003580] data-active:text-[#003580] data-active:font-semibold"
            >
              {isStaff ? 'Receipt Register' : 'Receipts'}
              {allReceipts.length > 0 && (
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  ({allReceipts.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab panels */}
          <TabsContent value="invoices" className="p-5">
            <InvoicesTab invoices={MOCK_INVOICES} paidIds={paidIds} onPay={handlePay} isStaff={isStaff} />
          </TabsContent>

          <TabsContent value="history" className="p-5">
            <PaymentHistoryTab payments={MOCK_PAYMENTS} isStaff={isStaff} />
          </TabsContent>

          <TabsContent value="receipts" className="p-5">
            <ReceiptsTab receipts={allReceipts} isStaff={isStaff} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Pay Now Dialog */}
      <PayNowDialog
        invoice={payingInvoice}
        open={dialogOpen}
        onClose={handleCloseDialog}
        onPaid={handlePaid}
        isStaff={isStaff}
      />
    </div>
  )
}
