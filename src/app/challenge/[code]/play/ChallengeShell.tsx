"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/store/examStore"
import { submitChallengeAttempt } from "@/actions/challenge.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Flag, Loader2, Swords, ShieldAlert, AlertTriangle, Eye } from "lucide-react"
import type { QuestionWithOptions } from "@/types"

const MAX_VIOLATIONS    = 3
const ANTICHEAT_COUNTDOWN = 5

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

  const [showConfirm, setShowConfirm]   = useState(false)
  const [tabWarning, setTabWarning]     = useState(false)
  const [tabCountdown, setTabCountdown] = useState(ANTICHEAT_COUNTDOWN)
  const [violationCount, setViolationCount] = useState(0)

  const isSubmittingRef = useRef(false)
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const remainingRef    = useRef(ANTICHEAT_COUNTDOWN)
  const violationRef    = useRef(0)
  const doSubmitRef     = useRef<(timedOut?: boolean) => Promise<void>>()
  const originalTitle   = useRef(typeof document !== "undefined" ? document.title : "PrepIQ")

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

  // Keep ref fresh so event handlers always call latest version
  useEffect(() => { doSubmitRef.current = doSubmit }, [doSubmit])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) { doSubmit(true); return }
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [timeLeft]) // eslint-disable-line

  // beforeunload — warn on close/refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  // Back button interception
  useEffect(() => {
    window.history.pushState(null, "", window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href)
      if (!isSubmittingRef.current) setShowConfirm(true)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Anti-cheat: visibility change
  function clearAntiCheatTimer() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        remainingRef.current = ANTICHEAT_COUNTDOWN
        setTabCountdown(ANTICHEAT_COUNTDOWN)

        countdownRef.current = setInterval(() => {
          remainingRef.current -= 1
          const r = remainingRef.current
          document.title = `⚠️ Return in ${r}s — PrepIQ Challenge`
          setTabCountdown(r)

          if (r <= 0) {
            clearAntiCheatTimer()
            document.title = "Submitting… — PrepIQ"
            doSubmitRef.current?.()
          }
        }, 1000)

      } else {
        const wasCountingDown = countdownRef.current !== null
        clearAntiCheatTimer()
        document.title = originalTitle.current

        if (wasCountingDown) {
          violationRef.current += 1
          setViolationCount(violationRef.current)
          setTabWarning(true)

          if (violationRef.current >= MAX_VIOLATIONS) {
            doSubmitRef.current?.()
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      clearAntiCheatTimer()
      document.title = originalTitle.current
    }
  }, []) // eslint-disable-line

  function handleSelectAnswer(questionId: string, optId: string) {
    selectAnswer(questionId, optId)
    if (currentIndex < questions.length - 1) {
      setTimeout(() => goTo(currentIndex + 1), 350)
    }
  }

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

      {/* Anti-cheat countdown banner (shown while student is away) */}
      {tabCountdown < ANTICHEAT_COUNTDOWN && (
        <div className="sticky top-[57px] z-20 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-black text-white">
          <ShieldAlert className="h-4 w-4" />
          Auto-submitting in {tabCountdown}s — return to the tab!
        </div>
      )}

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
                  onClick={() => handleSelectAnswer(question.id, opt.id)}
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

          {/* Question pills */}
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

      {/* Anti-cheat warning overlay */}
      {tabWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-red-200 bg-background p-6 shadow-2xl dark:border-red-900/50">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50">
              <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-lg font-black text-red-600 dark:text-red-400">
              Anti-Cheat Warning
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              You left the challenge tab.{" "}
              <strong className="text-foreground">
                Violation {violationCount} of {MAX_VIOLATIONS} recorded.
              </strong>
            </p>

            {violationCount >= MAX_VIOLATIONS - 1 && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {violationCount >= MAX_VIOLATIONS
                  ? "Maximum violations reached. Your challenge is being submitted now."
                  : "One more violation will auto-submit your challenge immediately."}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              Tab switching is monitored. The countdown runs in your browser tab.
            </div>

            {violationCount < MAX_VIOLATIONS && (
              <button
                onClick={() => setTabWarning(false)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Return to Challenge
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
