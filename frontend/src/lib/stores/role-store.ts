import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/lib/types/roles'

export type DashboardRole = Role

interface RoleStore {
  role: DashboardRole
  setRole: (role: DashboardRole) => void
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      role: 'applicant',
      setRole: (role) => set({ role }),
    }),
    { name: 'bocra-role' }
  )
)
