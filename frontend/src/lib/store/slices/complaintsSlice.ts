import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Complaint, ComplaintStatus, ComplaintsResponse } from '@/app/api/complaints/route'

// ─── Async thunks ─────────────────────────────────────────────────────────────

export interface FetchComplaintsParams {
  role: string
  status: string
  operator: string
  dateFrom: string
  dateTo: string
  page: number
  /** When true, return demo seed data without hitting the network */
  isDemo: boolean
  demoFallback: ComplaintsResponse
}

export const fetchComplaints = createAsyncThunk<
  ComplaintsResponse,
  FetchComplaintsParams
>('complaints/fetch', async (args) => {
  if (args.isDemo) return args.demoFallback

  const params = new URLSearchParams({
    role: args.role,
    status: args.status,
    operator: args.operator,
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    page: String(args.page),
  })

  const res = await fetch(`/api/complaints?${params}`)
  if (!res.ok) throw new Error('Failed to fetch complaints')
  return res.json() as Promise<ComplaintsResponse>
})

export interface PatchComplaintStatusParams {
  id: string
  status: ComplaintStatus
  note?: string
}

export const patchComplaintStatus = createAsyncThunk<
  { id: string; status: ComplaintStatus },
  PatchComplaintStatusParams
>('complaints/patchStatus', async ({ id, status, note }) => {
  const res = await fetch(`/api/complaints/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  })
  if (!res.ok) throw new Error('Failed to update complaint status')
  return { id, status }
})

// ─── State ────────────────────────────────────────────────────────────────────

interface ComplaintsState {
  items: Complaint[]
  meta: ComplaintsResponse['meta'] | null
  /** Loading state for the list fetch */
  loading: boolean
  /** Error message for the list fetch */
  error: string | null
  /** Per-complaint optimistic status overrides keyed by complaint id */
  statusOverrides: Record<string, ComplaintStatus>
  /** Loading state for individual status PATCH calls */
  patchLoading: Record<string, boolean>
}

const initialState: ComplaintsState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  statusOverrides: {},
  patchLoading: {},
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    /** Apply an optimistic status override immediately (before PATCH confirms) */
    setStatusOverride(
      state,
      action: PayloadAction<{ id: string; status: ComplaintStatus }>,
    ) {
      state.statusOverrides[action.payload.id] = action.payload.status
    },
    /** Clear all overrides (e.g. after a re-fetch) */
    clearStatusOverrides(state) {
      state.statusOverrides = {}
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchComplaints
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.meta = action.payload.meta
        // Clear overrides — server data is now fresh
        state.statusOverrides = {}
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load complaints'
      })

      // patchComplaintStatus
      .addCase(patchComplaintStatus.pending, (state, action) => {
        state.patchLoading[action.meta.arg.id] = true
      })
      .addCase(patchComplaintStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload
        delete state.patchLoading[id]
        // Apply confirmed status to the item in place
        const item = state.items.find((c) => c.id === id)
        if (item) item.status = status
        // Remove optimistic override — item is now correct
        delete state.statusOverrides[id]
      })
      .addCase(patchComplaintStatus.rejected, (state, action) => {
        delete state.patchLoading[action.meta.arg.id]
      })
  },
})

export const { setStatusOverride, clearStatusOverrides } = complaintsSlice.actions
export default complaintsSlice.reducer
