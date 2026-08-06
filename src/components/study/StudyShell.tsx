"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Eye,
  Lightbulb,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react"
import type { StudyQuestion } from "@/types"
import { Calculator } from "@/components/shared/Calculator"
import { parseInline, InlineText } from "@/lib/parseInline"

type Props = {
  questions: StudyQuestion[]
  durationMins: number | null
}

type Answer = {
  selectedId: string
  correct: boolean
}

function groupBySubject(questions: StudyQuestion[]) {
  const order: string[] = []
  const groups: Record<string, { name: string; indices: number[] }> = {}
  for (let i = 0; i < questions.length; i++) {
    const { subject_id, subject } = questions[i]
    if (!groups[subject_id]) {
      groups[subject_id] = { name: subject.name, indices: [] }
      order.push(subject_id)
    }
    groups[subject_id].indices.push(i)
  }
  return { order, groups }
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

const HINT_DELAY = 10_000

export function StudyShell({ questions, durationMins }: Props) {
  const router = useRouter()
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [answers, setAnswers]           = useState<Record<string, Answer>>({})
  const [showEndModal, setShowEndModal] = useState(false)
  const [ended, setEnded]               = useState(false)

  // "Show Answer" hint state
  const [showHint, setShowHint]       = useState(false)
  const [revealed, setRevealed]       = useState<Set<string>>(new Set())
  const hintTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Per-selection animation state
  const [animatingId, setAnimatingId]         = useState<string | null>(null)
  const [animatingCorrect, setAnimatingCorrect] = useState(false)

  // Timer
  const [timeLeft, setTimeLeft] = useState(durationMins ? durationMins * 60 : null)
  const [timesUp, setTimesUp]   = useState(false)
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!)
          setTimesUp(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, []) // eslint-disable-line

  // Reset hint timer whenever the current question changes
  useEffect(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    const q = questions[currentIdx]
    setShowHint(false)
    if (q && !answers[q.id] && !revealed.has(q.id)) {
      hintTimerRef.current = setTimeout(() => setShowHint(true), HINT_DELAY)
    }
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current) }
  }, [currentIdx]) // eslint-disable-line

  const { order, groups } = groupBySubject(questions)
  const currentQuestion  = questions[currentIdx]
  const currentAnswer    = answers[currentQuestion.id]
  const isRevealed       = revealed.has(currentQuestion.id)
  const showResult       = !!currentAnswer || isRevealed

  const activeSubjectId = order.find((sid) =>
    groups[sid].indices.includes(currentIdx)
  ) ?? order[0]

  function selectOption(optionId: string) {
    if (showResult) return
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    setShowHint(false)

    const isCorrect = currentQuestion.options.some((o) => o.id === optionId && o.is_correct)

    // Trigger animation
    setAnimatingId(optionId)
    setAnimatingCorrect(isCorrect)
    setTimeout(() => setAnimatingId(null), 700)

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { selectedId: optionId, correct: isCorrect },
    }))
  }

  function revealAnswer() {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    setShowHint(false)
    setRevealed((prev) => new Set([...prev, currentQuestion.id]))
  }

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < questions.length) setCurrentIdx(idx)
  }, [questions.length])

  const answeredCount = Object.keys(answers).length
  const correctCount  = Object.values(answers).filter((a) => a.correct).length

  function handleEnd() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    setEnded(true)
    setShowEndModal(false)
  }

  // ── End screen ───────────────────────────────────────────────────────────
  if (ended) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-16 text-center">
        <div className="mx-auto max-w-sm space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-950/50">
              <BookOpen className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Study session complete!</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              You answered {answeredCount} of {questions.length} question{questions.length !== 1 ? "s" : ""}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{correctCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Answered correctly</p>
            </div>
            <div className="rounded-2xl border bg-red-50/60 dark:bg-red-950/20 p-4">
              <p className="text-2xl font-black text-red-600 dark:text-red-400">{answeredCount - correctCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Got wrong</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep going — every question you study makes you sharper. 💪
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setAnswers({})
                setCurrentIdx(0)
                setEnded(false)
                setTimesUp(false)
                setRevealed(new Set())
                setShowHint(false)
                setTimeLeft(durationMins ? durationMins * 60 : null)
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Study Again
            </button>
            <button
              onClick={() => router.push("/study")}
              className="rounded-2xl border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Back to Study Mode
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Session layout ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col bg-background">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl">
        <button
          onClick={() => setShowEndModal(true)}
          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> End Session
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{questions.length} answered
          </span>
          {timeLeft !== null && (
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tabular-nums",
              timesUp
                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                : timeLeft <= 30
                ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                : timeLeft <= 60
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            )}>
              <Clock className="h-3.5 w-3.5" />
              {timesUp ? "Time's up!" : formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {/* ── Subject tabs ── */}
      {order.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b bg-background/80 px-4 py-2 scrollbar-none">
          {order.map((sid) => {
            const g = groups[sid]
            const subjectAnswered = g.indices.filter((i) => answers[questions[i].id]).length
            const isActive = sid === activeSubjectId
            return (
              <button
                key={sid}
                onClick={() => goTo(g.indices[0])}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {g.name}
                <span className="ml-1.5 opacity-60">{subjectAnswered}/{g.indices.length}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Question dots ── */}
      {groups[activeSubjectId] && (
        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 scrollbar-none border-b">
          {groups[activeSubjectId].indices.map((qi, dotIdx) => {
            const q   = questions[qi]
            const ans = answers[q.id]
            const rev = revealed.has(q.id)
            const isCurrent = qi === currentIdx
            return (
              <button
                key={qi}
                onClick={() => goTo(qi)}
                title={`Question ${dotIdx + 1}`}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-all",
                  isCurrent && "ring-2 ring-primary ring-offset-1",
                  rev
                    ? "bg-amber-400 text-white"
                    : ans
                    ? ans.correct
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                    : isCurrent
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                )}
              >
                {dotIdx + 1}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Question body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-5">

          {/* Question header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {currentQuestion.subject.name}
                {currentQuestion.year && <span className="ml-2 font-normal normal-case">· {currentQuestion.year}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                Question {currentIdx + 1} of {questions.length}
              </p>
            </div>
            {currentAnswer && (
              <div className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                currentAnswer.correct
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              )}>
                {currentAnswer.correct
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Correct!</>
                  : <><XCircle className="h-3.5 w-3.5" /> Wrong</>
                }
              </div>
            )}
            {isRevealed && !currentAnswer && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <Eye className="h-3.5 w-3.5" /> Answer shown
              </div>
            )}
          </div>

          {/* Question text */}
          <div className="rounded-2xl border bg-muted/20 p-5">
            <p className="text-base leading-relaxed font-medium md:text-lg">
              {parseInline(currentQuestion.text)}
            </p>

            {/* 10-second hint countdown bar — resets on each question */}
            {!showResult && (
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  key={currentIdx}
                  className="h-full origin-left rounded-full bg-amber-400"
                  style={{ animation: `hint-drain ${HINT_DELAY}ms linear forwards` }}
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQuestion.options
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((option) => {
                const isSelected   = currentAnswer?.selectedId === option.id
                const isCorrect    = option.is_correct
                const isAnimating  = animatingId === option.id

                let optionStyle = "border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer active:scale-[0.99]"
                if (showResult) {
                  if (isCorrect) {
                    optionStyle = isRevealed && !currentAnswer
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                      : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  } else if (isSelected && !isCorrect) {
                    optionStyle = "border-red-500 bg-red-50 dark:bg-red-950/30"
                  } else {
                    optionStyle = "border-border bg-background opacity-50"
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => selectOption(option.id)}
                    disabled={showResult}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                      optionStyle,
                      isAnimating && (animatingCorrect ? "study-correct-anim" : "study-wrong-anim")
                    )}
                  >
                    {/* Label badge */}
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-all",
                      showResult && isCorrect && !isRevealed
                        ? "bg-emerald-500 text-white"
                        : showResult && isCorrect && isRevealed
                        ? "bg-amber-400 text-white"
                        : showResult && isSelected && !isCorrect
                        ? "bg-red-500 text-white"
                        : isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {option.label}
                    </div>

                    <InlineText
                      text={option.text}
                      kind="option"
                      className="flex-1 pt-0.5 text-sm font-medium leading-relaxed"
                    />

                    {showResult && isCorrect && !isRevealed && (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    )}
                    {showResult && isCorrect && isRevealed && !currentAnswer && (
                      <Eye className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                  </button>
                )
              })}
          </div>

          {/* "Show Answer" hint button — appears after 10 seconds */}
          {showHint && !showResult && (
            <div className="hint-appear flex justify-center">
              <button
                onClick={revealAnswer}
                className="flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 shadow-sm transition-all hover:bg-amber-100 hover:border-amber-400 active:scale-[0.97] dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
              >
                <Eye className="h-4 w-4" />
                Show Answer
              </button>
            </div>
          )}

          {/* Explanation — shown after answering */}
          {showResult && currentQuestion.explanation && (
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs font-bold text-primary uppercase tracking-wide">Explanation</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {showResult && !currentQuestion.explanation && (
            <p className="text-xs text-muted-foreground text-center">No explanation available for this question.</p>
          )}

        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div className="sticky bottom-0 border-t bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <button
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted disabled:opacity-40 active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" /> Prev
          </button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">{currentIdx + 1} / {questions.length}</p>
          </div>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => goTo(currentIdx + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.97]"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.97]"
            >
              Finish <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Calculator />

      {/* ── End session modal ── */}
      {showEndModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowEndModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowEndModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
              <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-black">End Study Session?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;ve answered <strong className="text-foreground">{answeredCount}</strong> of{" "}
              <strong className="text-foreground">{questions.length}</strong> questions.
              {answeredCount < questions.length && " You can still go back and answer the rest."}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 rounded-2xl border py-3 text-sm font-bold transition-colors hover:bg-muted"
              >
                Keep Studying
              </button>
              <button
                onClick={handleEnd}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                End Session
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
