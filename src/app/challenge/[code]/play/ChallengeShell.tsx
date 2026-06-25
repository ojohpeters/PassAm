"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/store/examStore"
import { submitChallengeAttempt } from "@/actions/challenge.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Flag, Loader2, Swords } from "lucide-react"
import type { QuestionWithOptions } from "@/types"

type Props = {
  code: string
  participantId: string
  questions: QuestionWithOptions[]
  timeLimitSecs: number
  subjectName: string
  opponentName?: string
}

export function ChallengeShell({ code, participantId, questions, timeLimitSecs, subjectName, opponentName }: Props) {
  const router = useRouter()
  const {
    currentIndex, answers, flagged, timeLeft,
    isSubmitting, init, selectAnswer, toggleFlag,
    goTo, tick, setSubmitting, reset,
  } = useExamStore()

  const [showConfirm, setShowConfirm] = useState(false)
  const isSubmittingRef = useRef(false)
  useEffect(() => { isSubmittingRef.current = isSubmitting }, [isSubmitting])

  useEffect(() => {
    init(participantId, questions, timeLimitSecs)
    return () => reset()
  }, [participantId]) // eslint-disable-line

  const doSubmit = useCallback(async (timedOut = false) => {
    if (isSubmittingRef.current) return
    setSubmitting(true)
    setShowConfirm(false)
    try {
      const result = await submitChallengeAttempt(
        code,
        participantId,
        // convert Record<string, string|null> to Record<string, string|null>
        Object.fromEntries(Object.entries(answers)),
        timedOut ? timeLimitSecs : timeLimitSecs - timeLeft
      )
      if (!result.success) {
        toast.error("Failed to submit — please try again.")
        setSubmitting(false)
        return
      }
      reset()
      router.push(`/challenge/${code}/results?p=${participantId}`)
    } catch {
      toast.error("Connection error — please try again.")
      setSubmitting(false)
    }
  }, [code, participantId, answers, timeLeft, timeLimitSecs]) // eslint-disable-line

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) { doSubmit(true); return }
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [timeLeft]) // eslint-disable-line

  const question = questions[currentIndex]
  const answeredCount = Object.values(answers).filter((v) => v !== null).length
  const totalSecs = timeLeft % 60
  const totalMins = Math.floor(timeLeft / 60)
  const isLowTime = timeLeft <= 60
  const isUnanswered = answers[question?.id ?? ""] === null || answers[question?.id ?? ""] === undefined
  const isFlagged = flagged.has(question?.id ?? "")

  if (!question) return null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          {/* Timer */}
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-black tabular-nums",
            isLowTime ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 animate-pulse" : "bg-muted text-foreground"
          )}>
            {String(totalMins).padStart(2, "0")}:{String(totalSecs).padStart(2, "0")}
          </div>

          {/* Progress */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-muted-foreground">{subjectName}</span>
            </div>
            <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</span>
          </div>

          {/* Submit */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-4 py-1.5 text-xs font-black text-primary-foreground shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">

          {/* Q number + flag */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <button
              onClick={() => toggleFlag(question.id)}
              className={cn(
                "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                isFlagged ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
              )}
            >
              <Flag className="h-3.5 w-3.5" />
              {isFlagged ? "Flagged" : "Flag"}
            </button>
          </div>

          {/* Question text */}
          <p className="text-base font-semibold leading-relaxed md:text-lg">{question.text}</p>

          {/* Options */}
          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const selected = answers[question.id] === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => selectAnswer(question.id, opt.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.99]",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-black transition-all",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {opt.label}
                  </span>
                  <span className={cn("text-sm leading-relaxed", selected ? "font-semibold text-foreground" : "text-foreground/80")}>
                    {opt.text}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Explanation (shown when answered) */}
          {!isUnanswered && question.explanation && (
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 leading-relaxed">
              <span className="font-bold">Explanation: </span>{question.explanation}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <button
            onClick={() => goTo(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Question pills (scrollable) */}
          <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none py-1">
            {questions.map((q, i) => {
              const ans = answers[q.id]
              const done = ans !== null && ans !== undefined
              const flag = flagged.has(q.id)
              const active = i === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
                    active ? "bg-primary text-primary-foreground scale-110" :
                    flag ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    done ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => goTo(Math.min(questions.length - 1, currentIndex + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Submit confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black">Submit challenge?</h3>
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm space-y-1">
              <p><span className="font-semibold">Answered:</span> {answeredCount}/{questions.length}</p>
              <p><span className="font-semibold">Unanswered:</span> {questions.length - answeredCount}</p>
              {opponentName && <p className="text-muted-foreground text-xs">vs. {opponentName}</p>}
            </div>
            <p className="text-sm text-muted-foreground">You can&apos;t change your answers after submitting.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-2xl border py-3 text-sm font-bold hover:bg-muted"
              >
                Keep going
              </button>
              <button
                onClick={() => doSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-sm shadow-primary/30 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
