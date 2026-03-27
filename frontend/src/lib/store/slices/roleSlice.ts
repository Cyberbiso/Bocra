import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Role } from '@/lib/types/roles'

// Re-export so consumers can import DashboardRole from here instead of role-store
export type { Role as DashboardRole }

interface RoleState {
  role: Role
}

const initialState: RoleState = {
  role: 'applicant',
}

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<Role>) {
      state.role = action.payload
    },
  },
})

export const { setRole } = roleSlice.actions
export default roleSlice.reducer
