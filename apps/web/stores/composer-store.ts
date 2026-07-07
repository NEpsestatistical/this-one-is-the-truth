import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DraftPost {
  title: string
  body: string
  direction: string | null
  confidence: number | null
  tags: string[]
  savedAt: number
}

interface ComposerState {
  draft: DraftPost | null
  setDraft: (draft: Partial<DraftPost>) => void
  clearDraft: () => void
}

export const useComposerStore = create<ComposerState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (partial) =>
        set((s) => ({
          draft: {
            title: '',
            body: '',
            direction: null,
            confidence: null,
            tags: [],
            savedAt: Date.now(),
            ...s.draft,
            ...partial,
          },
        })),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'statistical-composer-draft',
    },
  ),
)
