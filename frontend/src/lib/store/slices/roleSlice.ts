import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Role } from '@/lib/types/roles'

interface RoleState {
  role: Role
}

const initialState: RoleState = {
  role: 'public',
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
