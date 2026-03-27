import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Organisation } from '@/app/api/organisations/route'

interface OrganisationsMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface OrganisationsState {
  items: Organisation[]
  meta: OrganisationsMeta
  loading: boolean
  statusOverrides: Record<string, string>
}

const initialState: OrganisationsState = {
  items: [],
  meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
  loading: false,
  statusOverrides: {},
}

export const fetchOrganisations = createAsyncThunk(
  'organisations/fetch',
  async (params: { page?: number; status?: string; search?: string } = {}) => {
    const qs = new URLSearchParams()
    if (params.page)   qs.set('page',   String(params.page))
    if (params.status) qs.set('status', params.status)
    if (params.search) qs.set('search', params.search)
    const res = await fetch(`/api/organisations?${qs}`)
    if (!res.ok) throw new Error('Failed to fetch organisations')
    return res.json() as Promise<{ data: Organisation[]; meta: OrganisationsMeta }>
  }
)

export const patchOrganisationStatus = createAsyncThunk(
  'organisations/patchStatus',
  async ({ id, status_code }: { id: string; status_code: string }) => {
    const res = await fetch('/api/organisations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status_code }),
    })
    if (!res.ok) throw new Error('Status update failed')
    return { id, status_code }
  }
)

const organisationsSlice = createSlice({
  name: 'organisations',
  initialState,
  reducers: {
    setStatusOverride(state, action: { payload: { id: string; status_code: string } }) {
      state.statusOverrides[action.payload.id] = action.payload.status_code
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganisations.pending,   (state) => { state.loading = true })
      .addCase(fetchOrganisations.fulfilled, (state, action) => {
        state.loading = false
        state.items   = action.payload.data
        state.meta    = action.payload.meta
      })
      .addCase(fetchOrganisations.rejected,  (state) => { state.loading = false })
      .addCase(patchOrganisationStatus.fulfilled, (state, action) => {
        const { id, status_code } = action.payload
        const item = state.items.find((o) => o.id === id)
        if (item) item.status_code = status_code
        delete state.statusOverrides[id]
      })
  },
})

export const { setStatusOverride } = organisationsSlice.actions
export default organisationsSlice.reducer
