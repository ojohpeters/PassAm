"use client"

import { useState } from "react"
import { startQuizAttempt, answerQuizItem, completeQuizAttempt } from "@/actions/custom-quiz.actions"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Trophy, RotateCcw, FileText } from "lucide-react"
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
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const
const OPTION_KEYS = ["opt_a", "opt_b", "opt_c", "opt_d"] as const

export function QuizClient({ quizId, code, items, prefillName }: Props) {
  const [phase, setPhase] = useState<"landing" | "taking" | "done">("landing")
  const [name, setName] = useState(prefillName)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [feedbacks, setFeedbacks] = useState<Record<string, ItemFeedback>>({})
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [startLoading, setStartLoading] = useState(false)
  const [answerLoading, setAnswerLoading] = useState(false)

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
    const item = items[currentIdx]
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
    if (currentIdx < items.length - 1) {
      setCurrentIdx(prev => prev + 1)
    } else {
      // Complete
      if (!attemptId) return
      const result = await completeQuizAttempt(attemptId)
      if (result.success) {
        setScore(result.data.score)
        setTotal(result.data.total)
        setPhase("done")
      }
    }
  }

  // ── Landing ───────────────────────────────────────────────────────────────
  if (phase === "landing") {
    return (
      <form onSubmit={handleStart} className="rounded-2xl border bg-background p-6 space-y-5">
        <h2 className="font-black text-lg">Enter your name to start</h2>
        <p className="text-sm text-muted-foreground">Your name will appear on the leaderboard when you finish.</p>
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
    const item = items[currentIdx]
    const feedback = feedbacks[item.id]
    const answered = !!feedback
    const isLast = currentIdx === items.length - 1

    return (
      <div className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question {currentIdx + 1} of {items.length}</span>
            <span>{Object.keys(feedbacks).length} answered</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((currentIdx + (answered ? 1 : 0)) / items.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl border bg-background p-5 space-y-5">
          {item.subject_label && (
            <span className="inline-block rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {item.subject_label}
            </span>
          )}
          <p className="text-base font-semibold leading-relaxed">{item.q_text}</p>

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
                  <span className="flex-1 leading-snug">{text}</span>
                  {answered && isCorrect && <CheckCircle2 className="shrink-0 h-4 w-4 text-emerald-500 mt-0.5" />}
                  {answered && isWrong && <XCircle className="shrink-0 h-4 w-4 text-rose-500 mt-0.5" />}
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <div className={cn(
              "rounded-xl px-4 py-3 text-sm space-y-1",
              feedback.isCorrect
                ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40"
                : "bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40"
            )}>
              <p className={cn("font-bold", feedback.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
                {feedback.isCorrect ? "Correct!" : `Incorrect — the answer is ${feedback.correct}`}
              </p>
              {feedback.explanation && <p className="text-muted-foreground text-xs">{feedback.explanation}</p>}
            </div>
          )}

          {answered && (
            <button
              onClick={handleNext}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99]"
            >
              {isLast ? "Finish Quiz →" : "Next Question →"}
            </button>
          )}
        </div>
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
