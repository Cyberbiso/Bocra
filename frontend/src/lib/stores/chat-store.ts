import { create } from 'zustand'

interface ChatStore {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}))
