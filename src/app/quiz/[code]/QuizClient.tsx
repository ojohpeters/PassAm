"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { startQuizAttempt, answerQuizItem, completeQuizAttempt } from "@/actions/custom-quiz.actions"
import { cn } from "@/lib/utils"
import { RichText } from "@/lib/question-format"
import { CheckCircle2, XCircle, Trophy, FileText, Timer, Calculator, Delete } from "lucide-react"
import Link from "next/link"

type QuizItem = {
  id: string; order_index: number; q_text: string
  opt_a: string; opt_b: string; opt_c: string; opt_d: string; subject_label: string | null
}

type ItemFeedback = { isCorrect: boolean; correct: string; explanation: string | null; selected: string }

interface Props {
  quizId: string
  code: string
  items: QuizItem[]
  prefillName: string
  timeLimitMinutes?: number | null
  showCalculator?: boolean
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const
const OPTION_KEYS = ["opt_a", "opt_b", "opt_c", "opt_d"] as const

// ── Calculator ────────────────────────────────────────────────────────────

function CalcButton({ label, onClick, wide, variant }: {
  label: string; onClick: () => void; wide?: boolean; variant?: "op" | "eq" | "clear" | "default"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-xl py-3 text-sm font-bold transition-all active:scale-95",
        wide && "col-span-2",
        variant === "eq" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "op" && "bg-primary/15 text-primary hover:bg-primary/25",
        variant === "clear" && "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
        (!variant || variant === "default") && "bg-muted hover:bg-muted/70",
      )}
    >
      {label}
    </button>
  )
}

function QuizCalculator() {
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState<string | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [waitNext, setWaitNext] = useState(false)

  function input(digit: string) {
    if (waitNext) { setDisplay(digit); setWaitNext(false) }
    else setDisplay(d => d === "0" ? digit : d + digit)
  }

  function inputDot() {
    if (waitNext) { setDisplay("0."); setWaitNext(false); return }
    if (!display.includes(".")) setDisplay(d => d + ".")
  }

  function handleOp(o: string) {
    setPrev(display); setOp(o); setWaitNext(true)
  }

  function calculate() {
    if (!prev || !op) return
    const a = parseFloat(prev), b = parseFloat(display)
    let result: number
    switch (op) {
      case "+": result = a + b; break
      case "−": result = a - b; break
      case "×": result = a * b; break
      case "÷": result = b !== 0 ? a / b : 0; break
      default: return
    }
    const str = Number.isInteger(result) ? String(result) : result.toFixed(6).replace(/\.?0+$/, "")
    setDisplay(str); setPrev(null); setOp(null); setWaitNext(true)
  }

  function backspace() {
    setDisplay(d => (d.length > 1 ? d.slice(0, -1) : "0"))
  }

  function clear() { setDisplay("0"); setPrev(null); setOp(null); setWaitNext(false) }
  function toggleSign() { setDisplay(d => d.startsWith("-") ? d.slice(1) : "-" + d) }

  return (
    <div className="w-64 rounded-2xl border bg-background shadow-xl p-3 space-y-2">
      {/* Display */}
      <div className="rounded-xl bg-muted px-3 py-3 text-right">
        {prev && op && <p className="text-[10px] text-muted-foreground">{prev} {op}</p>}
        <p className="text-2xl font-black tabular-nums truncate">{display}</p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <CalcButton label="C" onClick={clear} variant="clear" />
        <CalcButton label="+/−" onClick={toggleSign} variant="op" />
        <CalcButton label="⌫" onClick={backspace} variant="op" />
        <CalcButton label="÷" onClick={() => handleOp("÷")} variant="op" />

        <CalcButton label="7" onClick={() => input("7")} />
        <CalcButton label="8" onClick={() => input("8")} />
        <CalcButton label="9" onClick={() => input("9")} />
        <CalcButton label="×" onClick={() => handleOp("×")} variant="op" />

        <CalcButton label="4" onClick={() => input("4")} />
        <CalcButton label="5" onClick={() => input("5")} />
        <CalcButton label="6" onClick={() => input("6")} />
        <CalcButton label="−" onClick={() => handleOp("−")} variant="op" />

        <CalcButton label="1" onClick={() => input("1")} />
        <CalcButton label="2" onClick={() => input("2")} />
        <CalcButton label="3" onClick={() => input("3")} />
        <CalcButton label="+" onClick={() => handleOp("+")} variant="op" />

        <CalcButton label="0" onClick={() => input("0")} wide />
        <CalcButton label="." onClick={inputDot} />
        <CalcButton label="=" onClick={calculate} variant="eq" />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export function QuizClient({ quizId, code, items, prefillName, timeLimitMinutes, showCalculator }: Props) {
  const [phase, setPhase] = useState<"landing" | "taking" | "done">("landing")
  const [name, setName] = useState(prefillName)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [activeSubject, setActiveSubject] = useState<string | null>(null) // null = All
  const [currentIdx, setCurrentIdx] = useState(0)
  const [feedbacks, setFeedbacks] = useState<Record<string, ItemFeedback>>({})
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [startLoading, setStartLoading] = useState(false)
  const [answerLoading, setAnswerLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [showCalc, setShowCalc] = useState(false)
  const completingRef = useRef(false)

  // Compute unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.subject_label) set.add(i.subject_label) })
    return Array.from(set).sort()
  }, [items])
  const hasSubjectTabs = subjects.length > 1

  // Items filtered by active subject
  const filteredItems = useMemo(() => {
    if (!activeSubject) return items
    return items.filter(i => i.subject_label === activeSubject)
  }, [items, activeSubject])

  function switchSubject(subject: string | null) {
    setActiveSubject(subject)
    const filtered = subject ? items.filter(i => i.subject_label === subject) : items
    const firstUnanswered = filtered.findIndex(i => !feedbacks[i.id])
    setCurrentIdx(Math.max(0, firstUnanswered !== -1 ? firstUnanswered : 0))
  }

  // Timer
  useEffect(() => {
    if (phase !== "taking" || !timeLimitMinutes) return
    if (secondsLeft === null) { setSecondsLeft(timeLimitMinutes * 60); return }
    if (secondsLeft <= 0) {
      if (!completingRef.current && attemptId) {
        completingRef.current = true
        completeQuizAttempt(attemptId).then(r => {
          if (r.success) { setScore(r.data.score); setTotal(r.data.total); setPhase("done") }
        })
      }
      return
    }
    const t = setTimeout(() => setSecondsLeft(s => (s ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLimitMinutes, secondsLeft, attemptId])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || items.length === 0) return
    setStartLoading(true)
    const result = await startQuizAttempt(code, name.trim())
    setStartLoading(false)
    if (result.success) {
      setAttemptId(result.data.attemptId)
      setPhase("taking")
    }
  }

  async function handleAnswer(letter: string) {
    if (!attemptId || answerLoading) return
    const item = filteredItems[currentIdx]
    setAnswerLoading(true)
    const result = await answerQuizItem(attemptId, item.id, letter)
    setAnswerLoading(false)
    if (result.success) {
      setFeedbacks(prev => ({
        ...prev,
        [item.id]: { isCorrect: result.data.isCorrect, correct: result.data.correct, explanation: result.data.explanation, selected: letter },
      }))
    }
  }

  async function handleNext() {
    const allAnswered = Object.keys(feedbacks).length + 1 >= items.length
    // +1 because we just answered the current item (it's in feedbacks already at this point)
    if (currentIdx < filteredItems.length - 1) {
      setCurrentIdx(prev => prev + 1)
    } else if (allAnswered || Object.keys(feedbacks).length >= items.length) {
      if (!attemptId) return
      const result = await completeQuizAttempt(attemptId)
      if (result.success) { setScore(result.data.score); setTotal(result.data.total); setPhase("done") }
    } else {
      // Done with this subject, switch to next with unanswered items
      const nextSubject = subjects.find(s => {
        const subItems = items.filter(i => i.subject_label === s)
        return subItems.some(i => !feedbacks[i.id])
      })
      if (nextSubject) switchSubject(nextSubject)
      else {
        // Switch to All and find next unanswered
        setActiveSubject(null)
        const firstUnanswered = items.findIndex(i => !feedbacks[i.id])
        if (firstUnanswered !== -1) setCurrentIdx(firstUnanswered)
      }
    }
  }

  // ── Landing ───────────────────────────────────────────────────────────────
  if (phase === "landing") {
    return (
      <form onSubmit={handleStart} className="rounded-2xl border bg-background p-6 space-y-5">
        <h2 className="font-black text-lg">Enter your name to start</h2>
        <p className="text-sm text-muted-foreground">Your name will appear on the leaderboard when you finish.</p>
        {timeLimitMinutes && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 dark:bg-amber-950/30 dark:border-amber-700">
            <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              This quiz has a <strong>{timeLimitMinutes}-minute</strong> time limit. The timer starts when you begin.
            </p>
          </div>
        )}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name…"
          maxLength={60}
          required
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-1"
        />
        <button
          type="submit"
          disabled={startLoading || !name.trim() || items.length === 0}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {startLoading ? "Starting…" : items.length === 0 ? "No questions yet" : `Start Quiz (${items.length} questions) →`}
        </button>
      </form>
    )
  }

  // ── Taking ────────────────────────────────────────────────────────────────
  if (phase === "taking") {
    const item = filteredItems[currentIdx]
    const feedback = item ? feedbacks[item.id] : undefined
    const answered = !!feedback
    const allAnswered = Object.keys(feedbacks).length >= items.length
    const isLastInView = currentIdx >= filteredItems.length - 1
    const isTimeLow = secondsLeft !== null && secondsLeft <= 60

    return (
      <div className="space-y-4 relative">
        {/* Timer + progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {activeSubject ? `${activeSubject} — ` : ""}Q{currentIdx + 1}/{filteredItems.length}
            </span>
            <span className="text-xs text-muted-foreground">{Object.keys(feedbacks).length}/{items.length} answered</span>
            {secondsLeft !== null && (
              <span className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-black tabular-nums",
                isTimeLow ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" : "bg-muted text-muted-foreground"
              )}>
                <Timer className="h-3 w-3" />
                {formatTime(secondsLeft)}
              </span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(Object.keys(feedbacks).length / items.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Subject tabs */}
        {hasSubjectTabs && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => switchSubject(null)}
              className={cn(
                "shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
                !activeSubject ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              All ({Object.keys(feedbacks).length}/{items.length})
            </button>
            {subjects.map(s => {
              const subItems = items.filter(i => i.subject_label === s)
              const subAnswered = subItems.filter(i => feedbacks[i.id]).length
              return (
                <button
                  key={s}
                  onClick={() => switchSubject(s)}
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
                    activeSubject === s ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s} ({subAnswered}/{subItems.length})
                </button>
              )
            })}
          </div>
        )}

        {/* Question card */}
        {item && (
          <div className="rounded-2xl border bg-background p-5 space-y-5">
            {item.subject_label && !hasSubjectTabs && (
              <span className="inline-block rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                {item.subject_label}
              </span>
            )}
            <p className="text-base font-semibold leading-relaxed">
              <RichText text={item.q_text} />
            </p>

            <div className="space-y-2.5">
              {OPTION_LABELS.map((letter, i) => {
                const text = item[OPTION_KEYS[i]]
                const isSelected = feedback?.selected === letter
                const isCorrect = feedback?.correct === letter
                const isWrong = isSelected && !isCorrect

                return (
                  <button
                    key={letter}
                    onClick={() => !answered && handleAnswer(letter)}
                    disabled={answered || answerLoading}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                      !answered && "hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99]",
                      answered && isCorrect && "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30",
                      answered && isWrong && "border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30",
                      answered && !isSelected && !isCorrect && "opacity-50",
                      !answered && answerLoading && "opacity-50"
                    )}
                  >
                    <span className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                      answered && isCorrect ? "bg-emerald-500 text-white" :
                      answered && isWrong ? "bg-rose-500 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {letter}
                    </span>
                    <RichText text={text} kind="option" className="flex-1 leading-snug" />
                    {answered && isCorrect && <CheckCircle2 className="shrink-0 h-4 w-4 text-emerald-500 mt-0.5" />}
                    {answered && isWrong && <XCircle className="shrink-0 h-4 w-4 text-rose-500 mt-0.5" />}
                  </button>
                )
              })}
            </div>

            {answered && (
              <div className={cn(
                "rounded-xl px-4 py-3 text-sm space-y-1",
                feedback!.isCorrect
                  ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40"
                  : "bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40"
              )}>
                <p className={cn("font-bold", feedback!.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
                  {feedback!.isCorrect ? "Correct!" : `Incorrect — the answer is ${feedback!.correct}`}
                </p>
                {feedback!.explanation && (
                  <p className="text-muted-foreground text-xs">
                    <RichText text={feedback!.explanation} kind="explanation" />
                  </p>
                )}
              </div>
            )}

            {answered && (
              <button
                onClick={handleNext}
                className="w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99]"
              >
                {allAnswered || (isLastInView && Object.keys(feedbacks).length + 1 >= items.length)
                  ? "Finish Quiz →"
                  : isLastInView
                  ? "Next Subject →"
                  : "Next Question →"
                }
              </button>
            )}
          </div>
        )}

        {/* Calculator floating button */}
        {showCalculator && (
          <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
            {showCalc && <QuizCalculator />}
            <button
              type="button"
              onClick={() => setShowCalc(v => !v)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95",
                showCalc ? "bg-primary text-primary-foreground" : "bg-background border-2 border-primary text-primary hover:bg-primary/5"
              )}
            >
              <Calculator className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const msg = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good job!" : pct >= 40 ? "Keep practicing!" : "Keep going!"

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-background p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <p className="text-3xl font-black text-primary">{pct}%</p>
          </div>
        </div>
        <div>
          <p className="text-2xl font-black">{msg}</p>
          <p className="text-muted-foreground text-sm mt-1">You got <strong>{score}</strong> out of <strong>{total}</strong> correct</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {attemptId && (
          <Link
            href={`/quiz/${code}/results/${attemptId}`}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            Full Review
          </Link>
        )}
        <Link
          href={`/quiz/${code}/leaderboard`}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
        >
          <Trophy className="h-4 w-4" />
          Leaderboard
        </Link>
      </div>
    </div>
  )
}
