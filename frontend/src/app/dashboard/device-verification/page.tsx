'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldOff,
  UploadCloud,
  FileDown,
  Download,
  Loader2,
  Smartphone,
  Hash,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImeiStatus, VerificationResult } from '@/app/api/device-verification/route'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ImeiStatus, {
  label: string
  icon: React.ElementType
  badgeCls: string
  rowCls: string
}> = {
  VERIFIED: {
    label: 'Verified',
    icon: CheckCircle2,
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rowCls: 'bg-emerald-50/30',
  },
  FAILED_VERIFICATION: {
    label: 'Failed Verification',
    icon: XCircle,
    badgeCls: 'bg-red-50 text-red-700 border-red-200',
    rowCls: 'bg-red-50/20',
  },
  DUPLICATE: {
    label: 'Duplicate',
    icon: AlertTriangle,
    badgeCls: 'bg-orange-50 text-orange-700 border-orange-200',
    rowCls: 'bg-orange-50/20',
  },
  NOT_FOUND: {
    label: 'Not Found',
    icon: HelpCircle,
    badgeCls: 'bg-gray-100 text-gray-500 border-gray-200',
    rowCls: '',
  },
  BLOCKED: {
    label: 'Blocked',
    icon: ShieldOff,
    badgeCls: 'bg-red-100 text-red-800 border-red-300',
    rowCls: 'bg-red-50/30',
  },
  BLACKLISTED: {
    label: 'Blacklisted',
    icon: XCircle,
    badgeCls: 'bg-rose-100 text-rose-900 border-rose-400',
    rowCls: 'bg-rose-50/40',
  },
}

function StatusBadge({ status }: { status: ImeiStatus }) {
  const { label, icon: Icon, badgeCls } = STATUS_CONFIG[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      badgeCls,
    )}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCsvImeis(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  // Skip header row if non-numeric first cell
  const firstCell = lines[0].split(',')[0].trim()
  const startIdx  = /^\d+$/.test(firstCell) ? 0 : 1
  return lines.slice(startIdx).map((l) => l.split(',')[0].trim()).filter(Boolean)
}

function downloadBlob(content: string, filename: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const CSV_TEMPLATE = `imei,notes
353000000000000,Sample IMEI 1
353100000000001,Sample IMEI 2
350200000000002,
`

function generateResultsCsv(results: VerificationResult[]): string {
  const header = 'imei,brand,model,status,type_approval_number,remarks,checked_at'
  const rows   = results.map((r) =>
    [
      r.imei,
      r.brand  ?? '',
      r.model  ?? '',
      r.status,
      r.typeApprovalNumber ?? '',
      (r.remarks ?? '').replace(/,/g, ';'),
      r.checkedAt,
    ].join(','),
  )
  return [header, ...rows].join('\n')
}

function generateCertificateText(results: VerificationResult[]): string {
  const verified = results.filter((r) => r.status === 'VERIFIED')
  const date     = new Date().toLocaleDateString('en-BW', { day: '2-digit', month: 'long', year: 'numeric' })
  const lines = [
    '======================================================',
    '  BOTSWANA COMMUNICATIONS REGULATORY AUTHORITY',
    '  DEVICE VERIFICATION CERTIFICATE',
    '======================================================',
    `  Date issued: ${date}`,
    `  Total devices verified: ${verified.length}`,
    '------------------------------------------------------',
    ...verified.map((r, i) => [
      `  ${i + 1}. IMEI: ${r.imei}`,
      `     Device:  ${r.brand} ${r.model}`,
      `     TA No.:  ${r.typeApprovalNumber}`,
      `     Status:  VERIFIED ✓`,
    ].join('\n')),
    '------------------------------------------------------',
    '  This certificate confirms that the above devices',
    '  are approved for use in the Republic of Botswana.',
    '  Issued by: BOCRA Type Approval Department',
    '  Tel: +267 395 7755 | www.bocra.org.bw',
    '======================================================',
  ]
  return lines.join('\n')
}

// ─── Input component ──────────────────────────────────────────────────────────

function ImeiInput({
  value,
  onChange,
  onSubmit,
  loading,
  error,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
  error?: string
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSubmit()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits, cap at 15
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 15)
    onChange(cleaned)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter 15-digit IMEI number"
          maxLength={15}
          inputMode="numeric"
          className={cn(
            'w-full rounded-xl border-2 bg-white pl-9 pr-4 py-3 text-sm font-mono text-gray-800',
            'placeholder:text-gray-400 placeholder:font-sans',
            'focus:outline-none focus:ring-0 transition-colors',
            error
              ? 'border-red-300 focus:border-red-400'
              : 'border-gray-200 focus:border-[#003580]',
          )}
        />
        {value.length > 0 && (
          <span className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums',
            value.length === 15 ? 'text-emerald-500' : 'text-gray-400',
          )}>
            {value.length}/15
          </span>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}

      <p className="text-xs text-gray-400">
        Dial <code className="bg-gray-100 px-1 rounded">*#06#</code> on the device to find its IMEI.
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || value.length !== 15}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm',
          'bg-[#003580] text-white hover:bg-[#002a6b]',
          'disabled:opacity-40 disabled:pointer-events-none',
        )}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Checking…</>
        ) : (
          <><Search className="w-4 h-4" />Check IMEI</>
        )}
      </button>
    </div>
  )
}

// ─── Single result card ───────────────────────────────────────────────────────

function ResultCard({ result }: { result: VerificationResult }) {
  const { rowCls } = STATUS_CONFIG[result.status]

  const handleDownloadCert = () => {
    downloadBlob(
      generateCertificateText([result]),
      `BOCRA_CERT_${result.imei}.txt`,
      'text/plain',
    )
  }

  return (
    <div className={cn(
      'rounded-xl border-2 overflow-hidden transition-all',
      result.status === 'VERIFIED'
        ? 'border-emerald-200'
        : result.status === 'BLACKLISTED' || result.status === 'BLOCKED'
          ? 'border-red-200'
          : result.status === 'DUPLICATE'
            ? 'border-orange-200'
            : 'border-gray-200',
    )}>
      {/* Colour stripe */}
      <div className={cn(
        'h-1',
        result.status === 'VERIFIED'     && 'bg-emerald-400',
        result.status === 'BLACKLISTED'  && 'bg-rose-600',
        result.status === 'BLOCKED'      && 'bg-red-500',
        result.status === 'DUPLICATE'    && 'bg-orange-400',
        result.status === 'NOT_FOUND'    && 'bg-gray-300',
        result.status === 'FAILED_VERIFICATION' && 'bg-red-400',
      )} />

      <div className={cn('px-4 py-4 space-y-3', rowCls)}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">IMEI</p>
            <p className="font-mono text-base font-bold text-gray-900 tracking-wide">{result.imei}</p>
          </div>
          <StatusBadge status={result.status} />
        </div>

        {/* Device info */}
        {result.brand && (
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-800">
              {result.brand} {result.model}
            </span>
          </div>
        )}

        {/* Type approval number */}
        {result.typeApprovalNumber && (
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500">
              Type Approval: <code className="text-gray-700 font-mono">{result.typeApprovalNumber}</code>
            </span>
          </div>
        )}

        {/* Remarks */}
        {result.remarks && (
          <p className="text-xs text-gray-600 bg-white/60 rounded-lg border border-current/10 px-3 py-2 leading-relaxed">
            {result.remarks}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-300">
          Checked {new Date(result.checkedAt).toLocaleTimeString()}
        </p>

        {/* Certificate download */}
        {result.status === 'VERIFIED' && (
          <button
            onClick={handleDownloadCert}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Verification Certificate
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Recent history (single lookups this session) ─────────────────────────────

function HistoryChip({
  result,
  onClick,
}: {
  result: VerificationResult
  onClick: () => void
}) {
  const { badgeCls, icon: Icon } = STATUS_CONFIG[result.status]
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
    >
      <Icon className={cn('w-3 h-3', badgeCls.split(' ').find((c) => c.startsWith('text-')))} />
      <code className="font-mono">{result.imei.slice(0, 8)}…</code>
      <ChevronRight className="w-3 h-3 text-gray-300" />
    </button>
  )
}

// ─── Left panel — Single IMEI lookup ─────────────────────────────────────────

function SingleLookupPanel() {
  const [imei, setImei]       = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<VerificationResult | null>(null)
  const [error, setError]     = useState<string | undefined>()
  const [history, setHistory] = useState<VerificationResult[]>([])

  const handleCheck = async () => {
    if (imei.length !== 15) {
      setError('Please enter a complete 15-digit IMEI.')
      return
    }
    setError(undefined)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/device-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imei }),
      })
      const data: VerificationResult = await res.json()
      setResult(data)
      setHistory((prev) => [data, ...prev.filter((h) => h.imei !== data.imei)].slice(0, 8))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Single IMEI Lookup</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Check whether a device is approved for use in Botswana.
        </p>
      </div>

      <ImeiInput
        value={imei}
        onChange={setImei}
        onSubmit={handleCheck}
        loading={loading}
        error={error}
      />

      {/* Result */}
      {result && <ResultCard result={result} />}

      {/* Session history */}
      {history.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Recent lookups this session</p>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h) => (
              <HistoryChip
                key={h.imei}
                result={h}
                onClick={() => { setImei(h.imei); setResult(h); setError(undefined) }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Drag-and-drop upload area ────────────────────────────────────────────────

function DropZone({
  onFile,
  fileName,
  rowCount,
}: {
  onFile: (file: File) => void
  fileName: string | null
  rowCount: number
}) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv')) {
        alert('Only .csv files are accepted.')
        return
      }
      onFile(file)
    },
    [onFile],
  )

  const onDragEnter  = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true)  }
  const onDragLeave  = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false) }
  const onDragOver   = (e: React.DragEvent) => { e.preventDefault() }
  const onDrop       = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all',
        dragActive
          ? 'border-[#003580] bg-blue-50/40'
          : fileName
            ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/60'
            : 'border-gray-200 bg-gray-50/40 hover:border-gray-300 hover:bg-gray-50',
      )}
    >
      <div className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
        dragActive   ? 'bg-[#003580]/10 text-[#003580]' :
        fileName     ? 'bg-emerald-100 text-emerald-600' :
                       'bg-gray-100 text-gray-400',
      )}>
        {fileName
          ? <FileSpreadsheet className="w-5 h-5" />
          : <UploadCloud className="w-5 h-5" />
        }
      </div>

      {fileName ? (
        <>
          <p className="text-sm font-semibold text-emerald-700">{fileName}</p>
          <p className="text-xs text-emerald-600">{rowCount} IMEI{rowCount !== 1 ? 's' : ''} found</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-600">
            {dragActive ? 'Drop CSV here' : 'Drag & drop a CSV file, or click to browse'}
          </p>
          <p className="text-xs text-gray-400">Accepts .csv files only</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
      />
    </div>
  )
}

// ─── Batch results table ──────────────────────────────────────────────────────

function BatchTable({
  rows,
  label,
  emptyText,
  maxRows,
}: {
  rows: Array<{ imei: string; status?: ImeiStatus; brand?: string; model?: string; remarks?: string }>
  label: string
  emptyText: string
  maxRows?: number
}) {
  const visible = maxRows ? rows.slice(0, maxRows) : rows
  const hidden  = rows.length - visible.length

  if (rows.length === 0) {
    return <p className="text-xs text-gray-400 py-4 text-center">{emptyText}</p>
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-500">{label} ({rows.length})</p>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">#</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">IMEI</th>
                {'status' in (rows[0] ?? {}) && (
                  <>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Device</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide min-w-[160px]">Remarks</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    'border-b border-gray-100 last:border-0',
                    row.status ? STATUS_CONFIG[row.status].rowCls : '',
                  )}
                >
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-gray-800 whitespace-nowrap">{row.imei}</td>
                  {row.status !== undefined && (
                    <>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {row.brand && row.model ? `${row.brand} ${row.model}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2 text-gray-500 leading-snug max-w-[220px]">
                        {row.remarks ?? <span className="text-gray-300">—</span>}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hidden > 0 && (
          <p className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
            + {hidden} more row{hidden !== 1 ? 's' : ''} not shown in preview
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Right panel — Batch CSV ──────────────────────────────────────────────────

function BatchPanel() {
  const [fileName, setFileName]       = useState<string | null>(null)
  const [parsedImeis, setParsed]      = useState<string[]>([])
  const [results, setResults]         = useState<VerificationResult[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [batchDone, setBatchDone]     = useState(false)

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    setResults([])
    setBatchDone(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const imeis = parseCsvImeis(text)
      setParsed(imeis)
    }
    reader.readAsText(file)
  }, [])

  const handleSubmitBatch = async () => {
    if (parsedImeis.length === 0) return
    setSubmitting(true)
    setResults([])

    try {
      const res = await fetch('/api/device-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imeis: parsedImeis }),
      })
      const data: { results: VerificationResult[] } = await res.json()
      setResults(data.results)
      setBatchDone(true)
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadResults = () => {
    downloadBlob(generateResultsCsv(results), 'BOCRA_IMEI_Results.csv')
  }

  const handleDownloadCerts = () => {
    const verified = results.filter((r) => r.status === 'VERIFIED')
    if (verified.length === 0) {
      alert('No verified devices in this batch to certify.')
      return
    }
    downloadBlob(
      generateCertificateText(verified),
      'BOCRA_Batch_Certificate.txt',
      'text/plain',
    )
  }

  // Batch stats
  const stats = batchDone
    ? {
        total:      results.length,
        verified:   results.filter((r) => r.status === 'VERIFIED').length,
        issues:     results.filter((r) => r.status !== 'VERIFIED').length,
      }
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Batch CSV Upload</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Verify up to 500 IMEIs at once from a CSV file.
          </p>
        </div>
        <button
          onClick={() => downloadBlob(CSV_TEMPLATE, 'BOCRA_IMEI_Template.csv')}
          className="flex items-center gap-1.5 text-xs font-medium text-[#003580] hover:text-[#002a6b] transition-colors whitespace-nowrap shrink-0"
        >
          <FileDown className="w-3.5 h-3.5" />
          Download template
        </button>
      </div>

      {/* Drop zone */}
      <DropZone onFile={handleFile} fileName={fileName} rowCount={parsedImeis.length} />

      {/* CSV preview */}
      {parsedImeis.length > 0 && !batchDone && (
        <BatchTable
          rows={parsedImeis.map((imei) => ({ imei }))}
          label="Preview"
          emptyText=""
          maxRows={10}
        />
      )}

      {/* Submit batch button */}
      {parsedImeis.length > 0 && !batchDone && (
        <button
          type="button"
          onClick={handleSubmitBatch}
          disabled={submitting}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm',
            'bg-[#003580] text-white hover:bg-[#002a6b]',
            'disabled:opacity-50 disabled:pointer-events-none',
          )}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Processing {parsedImeis.length} IMEI{parsedImeis.length !== 1 ? 's' : ''}…</>
          ) : (
            <>Submit Batch ({parsedImeis.length} IMEI{parsedImeis.length !== 1 ? 's' : ''})</>
          )}
        </button>
      )}

      {/* Batch results */}
      {batchDone && stats && (
        <div className="space-y-3">
          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
              <p className="text-lg font-bold text-gray-800">{stats.total}</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total</p>
            </div>
            <div className={cn(
              'rounded-xl border px-3 py-2 text-center',
              stats.verified > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50',
            )}>
              <p className={cn('text-lg font-bold', stats.verified > 0 ? 'text-emerald-700' : 'text-gray-400')}>
                {stats.verified}
              </p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Verified</p>
            </div>
            <div className={cn(
              'rounded-xl border px-3 py-2 text-center',
              stats.issues > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50',
            )}>
              <p className={cn('text-lg font-bold', stats.issues > 0 ? 'text-red-600' : 'text-gray-400')}>
                {stats.issues}
              </p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Issues</p>
            </div>
          </div>

          {/* Results table */}
          <BatchTable
            rows={results}
            label="Batch results"
            emptyText="No results."
          />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDownloadResults}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download Results CSV
            </button>
            <button
              onClick={handleDownloadCerts}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors',
                stats.verified > 0
                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  : 'border-gray-200 text-gray-300 pointer-events-none',
              )}
            >
              <Download className="w-3.5 h-3.5" />
              Download Certificate ({stats.verified})
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setFileName(null)
              setParsed([])
              setResults([])
              setBatchDone(false)
            }}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Clear and upload another file
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeviceVerificationPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Device Verification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verify device IMEI numbers against the BOCRA Type Approval registry.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#003580]/15 bg-[#003580]/4 px-4 py-3.5">
        <AlertCircle className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong className="text-[#003580]">How to test:</strong>
          {' '}IMEIs starting with <code className="bg-white border border-gray-200 px-1 rounded font-mono">35</code> return <strong>VERIFIED</strong> &nbsp;·&nbsp;
          <code className="bg-white border border-gray-200 px-1 rounded font-mono">52</code> → <strong>BLACKLISTED</strong> &nbsp;·&nbsp;
          <code className="bg-white border border-gray-200 px-1 rounded font-mono">01</code> → <strong>BLOCKED</strong> &nbsp;·&nbsp;
          <code className="bg-white border border-gray-200 px-1 rounded font-mono">99</code> → <strong>DUPLICATE</strong> &nbsp;·&nbsp;
          <code className="bg-white border border-gray-200 px-1 rounded font-mono">77</code> → <strong>FAILED</strong>
        </p>
      </div>

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Single lookup */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <SingleLookupPanel />
        </div>

        {/* Right — Batch */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <BatchPanel />
        </div>

      </div>
    </div>
  )
}
