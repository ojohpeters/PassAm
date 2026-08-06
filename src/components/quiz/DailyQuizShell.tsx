"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { answerDailyQuizItem, submitDailyQuiz } from "@/actions/quiz.actions"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { InlineText } from "@/lib/parseInline"

type Option = { id: string; label: string; text: string }
type QuizItem = {
  id: string
  questionId: string
  isCorrect: boolean | null
  question: {
    id: string
    text: string
    explanation: string | null
    subject: { name: string }
    options: Option[]
  }
}
type Quiz = { id: string; questions: QuizItem[] }

export function DailyQuizShell({ quiz }: { quiz: Quiz }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState<{ isCorrect: boolean; correctOptionId: string } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const item = quiz.questions[index]
  const isLast = index === quiz.questions.length - 1

  async function handleSelect(optionId: string) {
    if (revealed || submitting) return
    setSelectedId(optionId)

    const result = await answerDailyQuizItem(quiz.id, item.question.id, optionId)
    if (!result.success) {
      toast.error("Failed to record answer.")
      return
    }
    setRevealed(result.data)
  }

  async function handleNext() {
    if (isLast) {
      setSubmitting(true)
      const result = await submitDailyQuiz(quiz.id)
      if (!result.success) {
        toast.error("Failed to submit quiz.")
        setSubmitting(false)
        return
      }
      router.refresh()
      return
    }
    setIndex((i) => i + 1)
    setRevealed(null)
    setSelectedId(null)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold">Daily Quiz</h1>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {quiz.questions.length}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${((index + (revealed ? 1 : 0)) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <div>
        <span className="text-xs font-medium text-muted-foreground">
          {item.question.subject.name}
        </span>
        <p className="mt-1 leading-relaxed"><InlineText text={item.question.text} /></p>
      </div>

      <div className="space-y-3">
        {item.question.options.map((opt) => {
          const isCorrectOpt = revealed?.correctOptionId === opt.id
          const isSelectedWrong = selectedId === opt.id && revealed && !revealed.isCorrect && opt.id !== revealed.correctOptionId

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={!!revealed}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                !revealed && "hover:bg-muted",
                isCorrectOpt && "border-green-500 bg-green-50 font-medium",
                isSelectedWrong && "border-red-400 bg-red-50",
                selectedId === opt.id && !revealed && "border-primary bg-primary/10"
              )}
            >
              <span className="font-mono font-bold">{opt.label}.</span>
              <span><InlineText text={opt.text} kind="option" /></span>
              {isCorrectOpt && <span className="ml-auto text-green-700">✓</span>}
              {isSelectedWrong && <span className="ml-auto text-red-600">✗</span>}
            </button>
          )
        })}
      </div>

      {revealed && item.question.explanation && (
        <div className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          revealed.isCorrect
            ? "border-green-200 bg-green-50 text-green-900 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-100"
            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100"
        )}>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide opacity-70">Explanation</p>
          <p className="leading-relaxed"><InlineText text={item.question.explanation!} /></p>
        </div>
      )}

      {revealed && (
        <button
          onClick={handleNext}
          disabled={submitting}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isLast ? (submitting ? "Saving…" : "Finish Quiz") : "Next Question →"}
        </button>
      )}
    </div>
  )
}
