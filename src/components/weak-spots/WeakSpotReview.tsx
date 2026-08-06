"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { InlineText } from "@/lib/parseInline"
import { submitReviewAnswer } from "@/actions/error-tags.actions"
import type { ReviewQuestion } from "@/actions/error-tags.actions"
import { CheckCircle2, XCircle, Target, RotateCcw, ArrowRight } from "lucide-react"

type Phase = "question" | "result" | "done"

const LABELS = ["A", "B", "C", "D", "E"]

export function WeakSpotReview({ questions }: { questions: ReviewQuestion[] }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>("question")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [newInterval, setNewInterval] = useState<number | null>(null)
  const [results, setResults] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 })
  const [, startTransition] = useTransition()

  const current = questions[idx]
  const progress = ((idx + (phase === "done" ? 1 : 0)) / questions.length) * 100

  function handleSelect(optionId: string) {
    if (phase !== "question" || !current) return
    const correct = current.options.find((o) => o.isCorrect)?.id === optionId
    setSelectedId(optionId)
    setIsCorrect(correct)
    setPhase("result")
    setResults((r) => ({ correct: r.correct + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1) }))
    startTransition(async () => {
      const res = await submitReviewAnswer(current.questionId, correct)
      setNewInterval(res.newInterval ?? null)
    })
  }

  function handleNext() {
    const next = idx + 1
    if (next >= questions.length) {
      setPhase("done")
    } else {
      setIdx(next)
      setSelectedId(null)
      setIsCorrect(false)
      setNewInterval(null)
      setPhase("question")
    }
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (phase === "done") {
    const all = results.correct + results.wrong
    const pct = Math.round((results.correct / all) * 100)
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          <Target className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Review complete!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {results.correct === all
              ? "Perfect run! These are moving further out."
              : "Keep going — repetition builds mastery."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-2xl font-black text-emerald-600">{results.correct}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Correct</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-2xl font-black text-red-500">{results.wrong}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Wrong</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-2xl font-black">{pct}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Score</p>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href="/weak-spots"
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Back
          </a>
          <a
            href="/drill"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Start Drill <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    )
  }

  const correctOptId = current.options.find((o) => o.isCorrect)?.id

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-medium">{current.subjectName}</span>
          <span>{idx + 1} / {questions.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className={cn(
        "rounded-2xl border p-5 transition-all",
        phase === "result" && isCorrect  && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
        phase === "result" && !isCorrect && "border-red-400 bg-red-50 dark:bg-red-950/20"
      )}>
        <p className="text-base font-medium leading-relaxed md:text-lg">
          <InlineText text={current.text} />
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {current.options.map((opt, i) => {
          const selected   = selectedId === opt.id
          const isRight    = opt.id === correctOptId
          const isRes      = phase === "result"

          let style = "border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer active:scale-[0.99]"
          let badge = "bg-muted text-muted-foreground"

          if (isRes) {
            if (isRight)         { style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"; badge = "bg-emerald-500 text-white" }
            else if (selected)   { style = "border-red-500 bg-red-50 dark:bg-red-950/30";             badge = "bg-red-500 text-white"     }
            else                 { style = "border-border bg-background opacity-40" }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isRes}
              className={cn("flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all", style)}
            >
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black", badge)}>
                {LABELS[i] ?? String.fromCharCode(65 + i)}
              </div>
              <span className="flex-1 pt-0.5 text-sm font-medium leading-relaxed">
                <InlineText text={opt.text} kind="option" />
              </span>
              {isRes && isRight   && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />}
              {isRes && selected && !isRight && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>

      {/* Result panel */}
      {phase === "result" && (
        <div className={cn(
          "rounded-2xl border p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200",
          isCorrect ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50 dark:bg-red-950/20"
        )}>
          <div className="flex items-center gap-2">
            {isCorrect
              ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Correct!</span></>
              : <><XCircle className="h-4 w-4 text-red-500" /><span className="text-sm font-bold text-red-600 dark:text-red-400">Wrong — check the green option.</span></>
            }
            {newInterval !== null && (
              <span className="ml-auto text-xs text-muted-foreground">
                {isCorrect
                  ? newInterval >= 21 ? "🏆 Mastered!" : `Next in ${newInterval}d`
                  : "Reset to 1 day"}
              </span>
            )}
          </div>

          {current.explanation && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 <InlineText text={current.explanation} />
            </p>
          )}

          <button
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {idx + 1 < questions.length ? <>Next <ArrowRight className="h-4 w-4" /></> : "Finish"}
          </button>
        </div>
      )}
    </div>
  )
}
