import { create } from "zustand"
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

export const useExamStore = create<ExamStore>((set) => ({
  attemptId: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  flagged: new Set(),
  timeLeft: 3600,
  isSubmitting: false,

  init: (attemptId, questions, timeLimitSecs) =>
    set({
      attemptId,
      questions,
      timeLeft: timeLimitSecs,
      answers: Object.fromEntries(questions.map((q) => [q.id, null])),
      currentIndex: 0,
      flagged: new Set(),
      isSubmitting: false,
    }),

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
}))
