import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DashboardRole = 'public' | 'applicant' | 'officer' | 'admin'

interface RoleStore {
  role: DashboardRole
  setRole: (role: DashboardRole) => void
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      role: 'public',
      setRole: (role) => set({ role }),
    }),
    { name: 'bocra-role' }
  )
)
