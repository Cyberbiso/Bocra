'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { DEMO_COMPLAINTS_RESPONSE } from '@/lib/demo/seed-data'
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  AlertCircle,
  Search,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import {
  fetchComplaints,
  patchComplaintStatus,
  setStatusOverride,
} from '@/lib/store/slices/complaintsSlice'
import { cn } from '@/lib/utils'
import ComplaintDialog from '@/components/dashboard/complaints/ComplaintDialog'
import type {
  ComplaintStatus,
  Complaint,
} from '@/app/api/complaints/route'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: { value: ComplaintStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'CLOSED', label: 'Closed' },
]

const OPERATORS = [
  'ALL',
  'Mascom Wireless',
  'Orange Botswana',
  'BTC Broadband',
  'Botswana Postal Services',
]

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-orange-50 text-orange-700 border-orange-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ESCALATED: 'bg-red-50 text-red-700 border-red-200',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide',
        STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  )
}

// ─── Status label map ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
}

// Status transitions available to officers (from → available to)
const STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  NEW:       ['ASSIGNED', 'PENDING', 'ESCALATED', 'CLOSED'],
  ASSIGNED:  ['PENDING', 'RESOLVED', 'ESCALATED', 'CLOSED'],
  PENDING:   ['ASSIGNED', 'RESOLVED', 'ESCALATED', 'CLOSED'],
  ESCALATED: ['ASSIGNED', 'RESOLVED', 'CLOSED'],
  RESOLVED:  ['CLOSED', 'NEW'],
  CLOSED:    ['NEW'],
}

// ─── Status Change Dialog ─────────────────────────────────────────────────────

interface StatusChangeDialogProps {
  complaint: Complaint | null
  onClose: () => void
  onChanged: (id: string, status: ComplaintStatus) => void
}

function StatusChangeDialog({ complaint, onClose, onChanged }: StatusChangeDialogProps) {
  const [newStatus, setNewStatus] = useState<ComplaintStatus | ''>('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Reset state when complaint changes
  useEffect(() => {
    if (complaint) {
      setNewStatus('')
      setNote('')
      setDone(false)
    }
  }, [complaint])

  if (!complaint) return null

  const options = STATUS_TRANSITIONS[complaint.status] ?? []

  async function handleSubmit() {
    if (!newStatus) return
    setSubmitting(true)
    try {
      await fetch(`/api/complaints/${complaint!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      })
      onChanged(complaint!.id, newStatus)
      setDone(true)
      setTimeout(() => { onClose(); setDone(false) }, 800)
    } finally {
      setSubmitting(false)
    }
  }

  const selectCls = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors bg-white'
  const textCls   = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] transition-colors resize-none'

  return (
    <Dialog open={!!complaint} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Update Complaint Status
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{complaint.caseNumber}</code>
            {' '}— {complaint.subject.length > 60 ? complaint.subject.slice(0, 60) + '…' : complaint.subject}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-6 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
            <p className="text-sm font-semibold">Status updated successfully</p>
          </div>
        ) : (
          <div className="space-y-4 mt-1">
            {/* Current status */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 shrink-0">Current Status</span>
              <StatusBadge status={complaint.status} />
            </div>

            {/* New status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as ComplaintStatus)}
                className={selectCls}
              >
                <option value="">— Select new status —</option>
                {options.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {newStatus && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <StatusBadge status={complaint.status} />
                  <span>→</span>
                  <StatusBadge status={newStatus as ComplaintStatus} />
                </div>
              )}
            </div>

            {/* Officer note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Officer Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Add context or rationale for this status change…"
                className={textCls}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newStatus || submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#003580] rounded-lg hover:bg-[#002a6e] transition-colors disabled:opacity-50"
              >
                {submitting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Updating…</>
                  : <><RefreshCw className="w-3.5 h-3.5" />Update Status</>
                }
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200 whitespace-nowrap',
        className
      )}
    >
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3.5 text-sm border-b border-gray-100', className)}>
      {children}
    </td>
  )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5 border-b border-gray-100">
              <Skeleton className={cn('h-4', j === 0 ? 'w-28' : j === 1 ? 'w-48' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={99} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No complaints found</p>
          <p className="text-xs text-gray-400">Try adjusting your filters or submit a new complaint.</p>
        </div>
      </td>
    </tr>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}

function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pageWindow = (() => {
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  })()

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <p className="text-xs text-gray-500">
        Showing {from}–{to} of {total} complaint{total !== 1 ? 's' : ''}
      </p>

      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onChange(1)} disabled={page === 1} title="First page">
          <ChevronsLeft className="w-3.5 h-3.5" />
        </PagBtn>
        <PagBtn onClick={() => onChange(page - 1)} disabled={page === 1} title="Previous page">
          <ChevronLeft className="w-3.5 h-3.5" />
        </PagBtn>

        {pageWindow[0] > 1 && (
          <span className="px-1 text-xs text-gray-400">…</span>
        )}

        {pageWindow.map((p) => (
          <PagBtn
            key={p}
            onClick={() => onChange(p)}
            active={p === page}
          >
            {p}
          </PagBtn>
        ))}

        {pageWindow[pageWindow.length - 1] < totalPages && (
          <span className="px-1 text-xs text-gray-400">…</span>
        )}

        <PagBtn onClick={() => onChange(page + 1)} disabled={page === totalPages} title="Next page">
          <ChevronRight className="w-3.5 h-3.5" />
        </PagBtn>
        <PagBtn onClick={() => onChange(totalPages)} disabled={page === totalPages} title="Last page">
          <ChevronsRight className="w-3.5 h-3.5" />
        </PagBtn>
      </div>
    </div>
  )
}

function PagBtn({
  children,
  onClick,
  disabled,
  active,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-[#003580] text-white'
          : 'text-gray-600 hover:bg-gray-100',
        disabled && 'opacity-30 pointer-events-none'
      )}
    >
      {children}
    </button>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  status: string
  operator: string
  dateFrom: string
  dateTo: string
  query: string
  onStatus: (v: string) => void
  onOperator: (v: string) => void
  onDateFrom: (v: string) => void
  onDateTo: (v: string) => void
  onQuery: (v: string) => void
}

function FilterBar({
  status,
  operator,
  dateFrom,
  dateTo,
  query,
  onStatus,
  onOperator,
  onDateFrom,
  onDateTo,
  onQuery,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by case number, subject, or operator…"
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580]/40"
        />
        {query && (
          <button
            onClick={() => onQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <Filter className="w-4 h-4 text-gray-400 shrink-0" />

      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatus(s.value)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all border',
              status === s.value
                ? 'bg-[#003580] text-white border-[#003580]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#003580]/40 hover:text-[#003580]'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-gray-200" />

      {/* Operator */}
      <select
        value={operator}
        onChange={(e) => onOperator(e.target.value)}
        className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op}>
            {op === 'ALL' ? 'All Operators' : op}
          </option>
        ))}
      </select>

      {/* Date range */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFrom(e.target.value)}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
          title="From date"
        />
        <span className="text-xs text-gray-400">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateTo(e.target.value)}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
          title="To date"
        />
      </div>

      {/* Clear */}
      {(status !== 'ALL' || operator !== 'ALL' || dateFrom || dateTo) && (
        <button
          onClick={() => {
            onStatus('ALL')
            onOperator('ALL')
            onDateFrom('')
            onDateTo('')
          }}
          className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto"
        >
          Clear filters
        </button>
      )}
    </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComplaintsPage() {
  const role = useAppSelector((s) => s.role.role)
  const isOfficer = role === 'officer' || role === 'admin'

  const dispatch = useAppDispatch()
  const isDemo = useAppSelector((s) => s.demo.isDemo)
  const { items: rawComplaints, meta, loading, statusOverrides } = useAppSelector(
    (s) => s.complaints,
  )

  // Filter state
  const [status, setStatus] = useState<string>('ALL')
  const [operator, setOperator] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // Dialog state for status changes
  const [statusTarget, setStatusTarget] = useState<Complaint | null>(null)

  // Reset to page 1 whenever a filter changes
  const handleFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  // Fetch on mount and whenever filters / page change
  useEffect(() => {
    dispatch(
      fetchComplaints({
        role,
        status,
        operator,
        dateFrom,
        dateTo,
        page,
        isDemo,
        demoFallback: DEMO_COMPLAINTS_RESPONSE,
      }),
    )
  }, [dispatch, role, status, operator, dateFrom, dateTo, page, isDemo])

  // Client-side search filter (on top of server-filtered results)
  const complaints = useMemo(() => {
    if (!query.trim()) return rawComplaints
    const q = query.toLowerCase()
    return rawComplaints.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.operator.toLowerCase().includes(q),
    )
  }, [rawComplaints, query])

  // Merge optimistic status overrides onto displayed rows
  const displayComplaints = useMemo(
    () =>
      complaints.map((c) =>
        statusOverrides[c.id] ? { ...c, status: statusOverrides[c.id] } : c,
      ),
    [complaints, statusOverrides],
  )

  const colCount = isOfficer ? 8 : 7

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints &amp; Enquiries</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isOfficer
              ? 'All submitted complaints across all users.'
              : 'Track and manage your submitted complaints.'}
          </p>
        </div>
        <ComplaintDialog />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <FilterBar
        status={status}
        operator={operator}
        dateFrom={dateFrom}
        dateTo={dateTo}
        query={query}
        onStatus={handleFilter(setStatus)}
        onOperator={handleFilter(setOperator)}
        onDateFrom={handleFilter(setDateFrom)}
        onDateTo={handleFilter(setDateTo)}
        onQuery={(v) => { setQuery(v); setPage(1) }}
      />

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Case Number</Th>
                <Th className="min-w-[260px]">Subject</Th>
                <Th>Operator</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
                <Th>Exp. Resolution</Th>
                {isOfficer && <Th>Assigned Officer</Th>}
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <SkeletonRows cols={colCount} />
              ) : displayComplaints.length === 0 ? (
                <EmptyState />
              ) : (
                displayComplaints.map((c: Complaint) => (
                  <ComplaintRow
                    key={c.id}
                    complaint={c}
                    isOfficer={isOfficer}
                    onChangeStatus={isOfficer ? () => setStatusTarget(c) : undefined}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.pageSize}
            onChange={setPage}
          />
        )}
      </div>

      {/* Status change dialog — officer/admin only */}
      <StatusChangeDialog
        complaint={statusTarget}
        onClose={() => setStatusTarget(null)}
        onChanged={(id, newStatus) => {
          // Optimistic update in Redux store
          dispatch(setStatusOverride({ id, status: newStatus }))
          // Fire PATCH to backend
          dispatch(patchComplaintStatus({ id, status: newStatus }))
          setStatusTarget(null)
        }}
      />
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ComplaintRow({
  complaint: c,
  isOfficer,
  onChangeStatus,
}: {
  complaint: Complaint
  isOfficer: boolean
  onChangeStatus?: () => void
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <Td>
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
          {c.caseNumber}
        </code>
      </Td>
      <Td className="text-gray-800 font-medium">
        <span className="line-clamp-2 leading-snug">{c.subject}</span>
        <span className="mt-0.5 block text-xs text-gray-400 font-normal">{c.category}</span>
      </Td>
      <Td className="text-gray-500 whitespace-nowrap">{c.operator}</Td>
      <Td>
        <StatusBadge status={c.status} />
      </Td>
      <Td className="text-gray-500 whitespace-nowrap">{c.submittedDate}</Td>
      <Td className="whitespace-nowrap">
        <ExpectedResolution date={c.expectedResolution} status={c.status} />
      </Td>
      {isOfficer && (
        <Td className="text-gray-500 whitespace-nowrap">
          {c.assignedOfficer ?? (
            <span className="text-gray-300 italic text-xs">Unassigned</span>
          )}
        </Td>
      )}
      <Td className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isOfficer && onChangeStatus && (
            <button
              onClick={onChangeStatus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Status
            </button>
          )}
          <Link
            href={`/dashboard/complaints/${c.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003580] border border-[#003580]/25 rounded-lg hover:bg-[#003580]/5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Link>
        </div>
      </Td>
    </tr>
  )
}

// ─── Expected resolution cell with overdue highlight ─────────────────────────

function ExpectedResolution({
  date,
  status,
}: {
  date: string
  status: ComplaintStatus
}) {
  const isActive = status !== 'RESOLVED' && status !== 'CLOSED'
  const isOverdue = isActive && date < new Date().toISOString().slice(0, 10)

  return (
    <span
      className={cn(
        'text-sm',
        isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
      )}
      title={isOverdue ? 'Overdue' : undefined}
    >
      {isOverdue && <span className="mr-1">⚠</span>}
      {date}
    </span>
  )
}
