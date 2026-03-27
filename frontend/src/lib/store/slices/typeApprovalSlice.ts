import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface TARegistration {
  registered: boolean
  status: string
  reference: string
  organisation: string
  accreditationTypes: string[]
}

export interface TAAccreditation {
  id: string
  accreditation_type: string
  accreditation_ref: string
  org_name?: string
  organisation_id?: string
  status_code: string
  issued_at: string | null
}

export interface TAApplication {
  id: string
  application_number: string
  brand?: string
  model?: string
  accreditation_type?: string
  submitted_at: string
  current_status_code: string
  applicant_org?: { legal_name: string }
  requestor?: string
}

export interface TACertificate {
  id: string
  certificate_number: string
  certificate_type_code: string
  issued_at: string
  status_code: string
  qr_token: string
  file_id: string | null
  device_catalog: {
    brand_name: string
    marketing_name: string
    model_name: string
    is_sim_enabled: boolean
  } | null
  application: { application_number: string } | null
  issued_to: string
}

export interface ReviewApplication {
  id: string
  application_number: string
  submitted_at: string
  current_status_code: string
  current_stage_code: string
  priority_code: string
  expected_decision_at: string
  applicant_org: { legal_name: string }
  device_catalog: { brand_name: string; model_name: string }
  assigned_to: { id: string; name: string } | null
}

interface TypeApprovalState {
  registration: TARegistration | null
  registrationLoading: boolean
  accreditations: TAAccreditation[]
  accreditationsLoading: boolean
  applications: TAApplication[]
  applicationsLoading: boolean
  certificates: TACertificate[]
  certificatesLoading: boolean
  reviewQueue: ReviewApplication[]
  reviewQueueLoading: boolean
  error: string | null
}

export const DEMO_REGISTRATION: TARegistration = {
  registered: true,
  status: 'APPROVED',
  reference: 'TAR-2026-00183',
  organisation: 'TeleCo BW (Pty) Ltd',
  accreditationTypes: ['Customer', 'Manufacturer'],
}

const initialState: TypeApprovalState = {
  registration: null,
  registrationLoading: false,
  accreditations: [],
  accreditationsLoading: false,
  applications: [],
  applicationsLoading: false,
  certificates: [],
  certificatesLoading: false,
  reviewQueue: [],
  reviewQueueLoading: false,
  error: null,
}

// Thunks
export const fetchAccreditations = createAsyncThunk('typeApproval/fetchAccreditations', async () => {
  const res = await fetch('/api/type-approval/accreditations')
  if (!res.ok) throw new Error('Failed to fetch accreditations')
  return res.json() as Promise<TAAccreditation[]>
})

export const fetchApplications = createAsyncThunk(
  'typeApproval/fetchApplications',
  async ({ status, page = 1 }: { status?: string; page?: number } = {}) => {
    const params = new URLSearchParams({ page: String(page) })
    if (status && status !== 'ALL') params.set('status', status)
    const res = await fetch(`/api/type-approval/applications?${params}`)
    if (!res.ok) throw new Error('Failed to fetch applications')
    return res.json()
  }
)

export const submitApplication = createAsyncThunk(
  'typeApproval/submitApplication',
  async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/type-approval/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to submit application')
    return res.json()
  }
)

export const submitRegistration = createAsyncThunk(
  'typeApproval/submitRegistration',
  async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/type-approval/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to submit registration')
    const data = await res.json()
    return data as { success: boolean; referenceNumber: string }
  }
)

export const fetchCertificates = createAsyncThunk('typeApproval/fetchCertificates', async () => {
  const res = await fetch('/api/type-approval/certificates')
  if (!res.ok) throw new Error('Failed to fetch certificates')
  return res.json() as Promise<TACertificate[]>
})

export const fetchReviewQueue = createAsyncThunk('typeApproval/fetchReviewQueue', async () => {
  const res = await fetch('/api/type-approval/review')
  if (!res.ok) throw new Error('Failed to fetch review queue')
  return res.json() as Promise<ReviewApplication[]>
})

export const patchApplicationStatus = createAsyncThunk(
  'typeApproval/patchApplicationStatus',
  async ({ id, status, stage, remarks }: { id: string; status: string; stage?: string; remarks?: string }) => {
    const res = await fetch(`/api/type-approval/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, stage, remarks }),
    })
    if (!res.ok) throw new Error('Failed to update application status')
    return { id, status, stage }
  }
)

const typeApprovalSlice = createSlice({
  name: 'typeApproval',
  initialState,
  reducers: {
    setRegistration(state, action: PayloadAction<TARegistration>) {
      state.registration = action.payload
    },
    updateReviewAppStatus(state, action: PayloadAction<{ id: string; status: string; stage?: string }>) {
      const app = state.reviewQueue.find(a => a.id === action.payload.id)
      if (app) {
        app.current_status_code = action.payload.status
        if (action.payload.stage) app.current_stage_code = action.payload.stage
      }
      const taApp = state.applications.find(a => a.id === action.payload.id)
      if (taApp) taApp.current_status_code = action.payload.status
    },
  },
  extraReducers: (builder) => {
    builder
      // accreditations
      .addCase(fetchAccreditations.pending, (state) => { state.accreditationsLoading = true })
      .addCase(fetchAccreditations.fulfilled, (state, action) => { state.accreditationsLoading = false; state.accreditations = action.payload })
      .addCase(fetchAccreditations.rejected, (state) => { state.accreditationsLoading = false })
      // applications
      .addCase(fetchApplications.pending, (state) => { state.applicationsLoading = true })
      .addCase(fetchApplications.fulfilled, (state, action) => { state.applicationsLoading = false; state.applications = action.payload.data ?? action.payload })
      .addCase(fetchApplications.rejected, (state) => { state.applicationsLoading = false })
      // submitApplication
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.applications.unshift({
          id: action.payload.id,
          application_number: action.payload.applicationNumber,
          current_status_code: 'PENDING',
          submitted_at: new Date().toISOString(),
        })
      })
      // submitRegistration
      .addCase(submitRegistration.pending, (state) => { state.registrationLoading = true })
      .addCase(submitRegistration.fulfilled, (state, action) => {
        state.registrationLoading = false
        state.registration = {
          registered: true,
          status: 'PENDING_REVIEW',
          reference: action.payload.referenceNumber,
          organisation: '',
          accreditationTypes: [],
        }
      })
      .addCase(submitRegistration.rejected, (state) => { state.registrationLoading = false })
      // certificates
      .addCase(fetchCertificates.pending, (state) => { state.certificatesLoading = true })
      .addCase(fetchCertificates.fulfilled, (state, action) => { state.certificatesLoading = false; state.certificates = action.payload })
      .addCase(fetchCertificates.rejected, (state) => { state.certificatesLoading = false })
      // reviewQueue
      .addCase(fetchReviewQueue.pending, (state) => { state.reviewQueueLoading = true })
      .addCase(fetchReviewQueue.fulfilled, (state, action) => { state.reviewQueueLoading = false; state.reviewQueue = action.payload })
      .addCase(fetchReviewQueue.rejected, (state) => { state.reviewQueueLoading = false })
      // patchApplicationStatus
      .addCase(patchApplicationStatus.fulfilled, (state, action) => {
        const { id, status, stage } = action.payload
        const rApp = state.reviewQueue.find(a => a.id === id)
        if (rApp) { rApp.current_status_code = status; if (stage) rApp.current_stage_code = stage }
        const tApp = state.applications.find(a => a.id === id)
        if (tApp) tApp.current_status_code = status
      })
  },
})

export const { setRegistration, updateReviewAppStatus } = typeApprovalSlice.actions
export default typeApprovalSlice.reducer
