"use client"

import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Zap, X, Clock, Trophy } from "lucide-react"
import { submitDrillAnswer, completeDrillSession } from "@/actions/drill.actions"
import type { DrillQuestion, DrillSessionData } from "@/actions/drill.actions"

import { InlineText } from "@/lib/parseInline"
import { Calculator } from "@/components/shared/Calculator"
import { ErrorTagPicker } from "@/components/shared/ErrorTagPicker"
import { logWrongAnswer } from "@/actions/error-tags.actions"
import { toast } from "sonner"

const RESULT_DISPLAY_MS = 1_200

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${s}s`
  return `${m}m ${sec.toString().padStart(2, "0")}s`
}

type Phase = "question" | "result" | "done"

export function DrillShell({ drill }: { drill: DrillSessionData }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // unanswered questions for this session
  const pending = drill.questions.filter((q) => !drill.answeredIds.includes(q.id))

  const [queueIdx, setQueueIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>(pending.length === 0 ? "done" : "question")
  const [score, setScore] = useState(drill.score)
  const [totalAnswered, setTotalAnswered] = useState(drill.totalAnswered)
  const [timeUsedMs, setTimeUsedMs] = useState(drill.timeUsedMs)

  // per-question timer
  const [msLeft, setMsLeft] = useState(pending[0]?.timeLimitMs ?? 10_000)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(Date.now())

  // result state
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctId: string; selectedId: string | null } | null>(null)

  const currentQ: DrillQuestion | undefined = pending[queueIdx]

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback((limitMs: number) => {
    stopTimer()
    setMsLeft(limitMs)
    startedAtRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setMsLeft((prev) => {
        if (prev <= 100) { stopTimer(); return 0 }
        return prev - 100
      })
    }, 100)
  }, [stopTimer])

  // Start timer when question changes
  useEffect(() => {
    if (phase !== "question" || !currentQ) return
    startTimer(currentQ.timeLimitMs)
    return stopTimer
  }, [queueIdx, phase]) // eslint-disable-line

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (phase !== "question" || msLeft > 0) return
    handleAnswer(null)
  }, [msLeft]) // eslint-disable-line

  async function handleAnswer(selectedOptionId: string | null) {
    if (phase !== "question" || !currentQ) return
    stopTimer()

    const timeTakenMs = Math.min(Date.now() - startedAtRef.current, currentQ.timeLimitMs)

    setPhase("result")

    const res = await submitDrillAnswer(drill.sessionId, currentQ.id, selectedOptionId, timeTakenMs)
    if (!res.success) {
      toast.error("Failed to record answer")
      setPhase("question")
      startTimer(currentQ.timeLimitMs)
      return
    }

    const { isCorrect, correctOptionId } = res.data
    setLastResult({ isCorrect, correctId: correctOptionId, selectedId: selectedOptionId })
    if (isCorrect) setScore((s) => s + 1)
    setTotalAnswered((t) => t + 1)
    setTimeUsedMs((t) => t + timeTakenMs)

    // Correct: auto-advance after brief feedback. Wrong: log + pause for error tagging.
    if (isCorrect) {
      setTimeout(advance, RESULT_DISPLAY_MS)
    } else {
      startTransition(async () => { await logWrongAnswer(currentQ.id) })
    }
  }

  function advance() {
    const next = queueIdx + 1
    if (next >= pending.length) {
      setPhase("done")
      startTransition(async () => { await completeDrillSession(drill.sessionId) })
    } else {
      setQueueIdx(next)
      setPhase("question")
    }
  }

  async function handleEnd() {
    stopTimer()
    setPhase("done")
    await completeDrillSession(drill.sessionId)
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (phase === "done" || pending.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-16 text-center">
        <div className="mx-auto max-w-sm space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 dark:bg-orange-950/40">
              <Zap className="h-10 w-10 text-orange-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Drill complete!</h1>
            <p className="mt-1 text-sm text-muted-foreground">Great hustle today 💪</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border bg-orange-50/60 dark:bg-orange-950/20 p-4">
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{score}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Correct</p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="text-2xl font-black">{totalAnswered}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Answered</p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="text-xl font-black tabular-nums">{formatMs(timeUsedMs)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Time used</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/leaderboard?tab=drill")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
            >
              <Trophy className="h-4 w-4" /> View Leaderboard
            </button>
            <button
              onClick={() => router.push("/drill")}
              className="rounded-2xl border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Back to Drill
            </button>
          </div>
        </div>
      </div>
    )
  }

  const timerPercent = currentQ ? (msLeft / currentQ.timeLimitMs) * 100 : 100
  const timerColor = timerPercent > 50 ? "bg-emerald-500" : timerPercent > 25 ? "bg-amber-500" : "bg-red-500"

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col bg-background">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl">
        <button
          onClick={handleEnd}
          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" /> End
        </button>

        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 dark:bg-orange-950/40">
            <Zap className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-black text-orange-700 dark:text-orange-300 tabular-nums">{score}</span>
          </div>
          {/* Progress */}
          <span className="text-xs text-muted-foreground tabular-nums">
            {queueIdx + 1}/{pending.length}
          </span>
        </div>
      </div>

      {/* ── Timer bar ── */}
      <div className="h-1.5 w-full bg-muted">
        <div
          className={cn("h-full rounded-r-full transition-all", timerColor)}
          style={{ width: `${timerPercent}%`, transition: "width 100ms linear" }}
        />
      </div>

      {/* ── Question body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-5">

          {/* Subject + timer */}
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {currentQ.subject.name}
            </span>
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tabular-nums",
              timerPercent > 50 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : timerPercent > 25 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
            )}>
              <Clock className="h-3.5 w-3.5" />
              {(msLeft / 1000).toFixed(1)}s
            </div>
          </div>

          {/* Question text */}
          <div className={cn(
            "rounded-2xl border p-5 transition-all",
            phase === "result" && lastResult?.isCorrect && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
            phase === "result" && lastResult && !lastResult.isCorrect && "border-red-400 bg-red-50 dark:bg-red-950/20"
          )}>
            <p className="text-base leading-relaxed font-medium md:text-lg">
              <InlineText text={currentQ.text} />
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => {
              const LABELS = ["A", "B", "C", "D", "E"]
              const isSelected = lastResult?.selectedId === opt.id
              const isCorrect = lastResult?.correctId === opt.id
              const isResult = phase === "result"

              let style = "border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer active:scale-[0.99]"
              let badgeStyle = "bg-muted text-muted-foreground"

              if (isResult) {
                if (isCorrect) {
                  style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 study-correct-anim"
                  badgeStyle = "bg-emerald-500 text-white"
                } else if (isSelected) {
                  style = "border-red-500 bg-red-50 dark:bg-red-950/30 study-wrong-anim"
                  badgeStyle = "bg-red-500 text-white"
                } else {
                  style = "border-border bg-background opacity-40"
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => phase === "question" && handleAnswer(opt.id)}
                  disabled={phase !== "question"}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                    style
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black",
                    badgeStyle
                  )}>
                    {LABELS[i] ?? String.fromCharCode(65 + i)}
                  </div>
                  <span className="flex-1 pt-0.5 text-sm font-medium leading-relaxed">
                    <InlineText text={opt.text} />
                  </span>
                  {isResult && isCorrect && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />}
                  {isResult && isSelected && !isCorrect && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
                </button>
              )
            })}
          </div>

          {/* Timeout notice */}
          {phase === "result" && lastResult?.selectedId === null && (
            <p className="text-center text-sm font-semibold text-muted-foreground animate-in fade-in">
              ⏰ Time&apos;s up!
            </p>
          )}

          {/* Error tag picker + Next button for wrong answers */}
          {phase === "result" && lastResult && !lastResult.isCorrect && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <ErrorTagPicker questionId={currentQ.id} compact />
              <button
                onClick={advance}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Got it — Next Question →
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Calculator — positioned top-right to avoid covering options */}
      <Calculator triggerClassName="bottom-4 right-4 md:bottom-4 md:right-6" />
    </div>
  )
}
