import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  orgId: string | null
  orgName: string | null
  org: {
    id: string
    legal_name: string
    trading_name: string | null
    org_type_code: string | null
    registration_number: string | null
    status_code: string
  } | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  loaded: boolean
}

const initialState: AuthState = {
  user: null,
  loading: false,
  loaded: false,
}

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const res = await fetch('/api/auth/me')
  if (!res.ok) throw new Error('Not authenticated')
  const data = await res.json()
  return data.user as AuthUser
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth(state) {
      state.user = null
      state.loaded = true
    },
    setUser(state, action) {
      state.user = action.payload
      state.loaded = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => { state.loading = true })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false
        state.loaded = true
        state.user = null
      })
  },
})

export const { clearAuth, setUser } = authSlice.actions
export default authSlice.reducer
