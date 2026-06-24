import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { QuestionWithOptions } from "@/types"

type ExamStore = {
  attemptId: string | null
  questions: QuestionWithOptions[]
  currentIndex: number
  answers: Record<string, string | null> // questionId → optionId | null (null = skipped)
  flagged: Set<string>
  timeLeft: number
  isSubmitting: boolean

  init: (attemptId: string, questions: QuestionWithOptions[], timeLimitSecs: number) => void
  selectAnswer: (questionId: string, optionId: string) => void
  toggleFlag: (questionId: string) => void
  goTo: (index: number) => void
  tick: () => void
  setSubmitting: (v: boolean) => void
  reset: () => void
}

type PersistedState = {
  attemptId: string | null
  answers: Record<string, string | null>
  flagged: string[]
  timeLeft: number
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      attemptId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      flagged: new Set(),
      timeLeft: 3600,
      isSubmitting: false,

      init: (attemptId, questions, timeLimitSecs) => {
        const current = get()
        if (current.attemptId === attemptId) {
          // Same exam resumed (e.g. after crash) — restore persisted answers and time
          set({ questions, isSubmitting: false })
          return
        }
        set({
          attemptId,
          questions,
          timeLeft: timeLimitSecs,
          answers: Object.fromEntries(questions.map((q) => [q.id, null])),
          currentIndex: 0,
          flagged: new Set(),
          isSubmitting: false,
        })
      },

      selectAnswer: (questionId, optionId) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: optionId } })),

      toggleFlag: (questionId) =>
        set((s) => {
          const flagged = new Set(s.flagged)
          flagged.has(questionId) ? flagged.delete(questionId) : flagged.add(questionId)
          return { flagged }
        }),

      goTo: (index) => set({ currentIndex: index }),

      tick: () => set((s) => ({ timeLeft: Math.max(0, s.timeLeft - 1) })),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      reset: () =>
        set({
          attemptId: null,
          questions: [],
          currentIndex: 0,
          answers: {},
          flagged: new Set(),
          timeLeft: 3600,
          isSubmitting: false,
        }),
    }),
    {
      name: "prepiq-exam",
      // Only persist the fields needed to resume an exam
      partialize: (state): PersistedState => ({
        attemptId: state.attemptId,
        answers: state.answers,
        flagged: Array.from(state.flagged), // Set isn't JSON-serializable
        timeLeft: state.timeLeft,
      }),
      // Rehydrate: convert flagged array back to Set
      merge: (persisted, current) => {
        const p = persisted as PersistedState
        return {
          ...current,
          attemptId: p.attemptId ?? null,
          answers: p.answers ?? {},
          flagged: new Set(p.flagged ?? []),
          timeLeft: p.timeLeft ?? 3600,
        }
      },
    }
  )
)
