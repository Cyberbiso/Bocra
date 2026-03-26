import { create } from 'zustand'

interface ChatStore {
  isOpen: boolean
  open: () => void
  toggle: () => void
  close: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}))
