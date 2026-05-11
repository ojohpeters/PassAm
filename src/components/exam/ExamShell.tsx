"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/store/examStore"
import { submitExam } from "@/actions/exam.actions"
import { QuestionCard } from "./QuestionCard"
import { QuestionNavigator } from "./QuestionNavigator"
import { ExamTimer } from "./ExamTimer"
import { toast } from "sonner"
import type { QuestionWithOptions } from "@/types"

type Props = {
  attemptId: string
  questions: QuestionWithOptions[]
  timeLimitSecs: number
}

export function ExamShell({ attemptId, questions, timeLimitSecs }: Props) {
  const router = useRouter()
  const {
    currentIndex,
    answers,
    flagged,
    timeLeft,
    isSubmitting,
    init,
    selectAnswer,
    toggleFlag,
    goTo,
    tick,
    setSubmitting,
    reset,
  } = useExamStore()

  useEffect(() => {
    init(attemptId, questions, timeLimitSecs)
    return () => reset()
  }, [attemptId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (timedOut = false) => {
      if (isSubmitting) return
      setSubmitting(true)

      const elapsed = timeLimitSecs - timeLeft

      const result = await submitExam({
        attemptId,
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
        timeTakenSecs: timedOut ? timeLimitSecs : elapsed,
      })

      if (!result.success) {
        toast.error("Failed to submit — please try again.")
        setSubmitting(false)
        return
      }

      router.push(`/results/${attemptId}`)
    },
    [attemptId, answers, isSubmitting, timeLeft, timeLimitSecs] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Countdown — fires every second; submits automatically when time is up
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(true)
      return
    }
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!questions.length) return null

  const q = questions[currentIndex]
  const answeredCount = Object.values(answers).filter(Boolean).length

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <span className="text-sm text-muted-foreground">
          {answeredCount} / {questions.length} answered
        </span>
        <ExamTimer timeLeft={timeLeft} />
        <button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Submit Exam"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <QuestionCard
            question={q}
            selected={answers[q.id] ?? null}
            flagged={flagged.has(q.id)}
            index={currentIndex}
            total={questions.length}
            onSelect={(optionId) => selectAnswer(q.id, optionId)}
            onFlag={() => toggleFlag(q.id)}
            onPrev={() => goTo(currentIndex - 1)}
            onNext={() => goTo(currentIndex + 1)}
          />
        </main>
        <aside className="w-60 overflow-y-auto border-l bg-background p-4">
          <QuestionNavigator
            questions={questions}
            answers={answers}
            flagged={flagged}
            current={currentIndex}
            onSelect={goTo}
          />
        </aside>
      </div>
    </div>
  )
}
