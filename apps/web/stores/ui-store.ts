import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  composerOpen: boolean
  activeModal: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setComposerOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  composerOpen: false,
  activeModal: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setComposerOpen: (open) => set({ composerOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}))
