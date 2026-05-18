"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { InlineText } from "@/lib/parseInline"
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Trophy } from "lucide-react"

type Option  = { id: string; label: string; text: string; isCorrect: boolean }
type Question = { id: string; text: string; explanation: string | null; subjectName: string; options: Option[] }

const LABELS = ["A", "B", "C", "D", "E"]

export function SetQuiz({ questions }: { questions: Question[] }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase]  = useState<"quiz" | "result" | "done">("quiz")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scores, setScores] = useState({ correct: 0, wrong: 0 })

  const current = questions[idx]
  const progress = ((idx + (phase === "done" ? 1 : 0)) / questions.length) * 100
  const correctId = current?.options.find((o) => o.isCorrect)?.id

  function handleSelect(optionId: string) {
    if (phase !== "quiz") return
    const correct = optionId === correctId
    setSelectedId(optionId)
    setPhase("result")
    setScores((s) => ({ correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }))
  }

  function handleNext() {
    const next = idx + 1
    if (next >= questions.length) {
      setPhase("done")
    } else {
      setIdx(next)
      setSelectedId(null)
      setPhase("quiz")
    }
  }

  function restart() {
    setIdx(0); setSelectedId(null); setPhase("quiz"); setScores({ correct: 0, wrong: 0 })
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const total = scores.correct + scores.wrong
    const pct   = Math.round((scores.correct / total) * 100)
    const passed = pct >= 50
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className={cn(
          "flex h-20 w-20 items-center justify-center rounded-3xl",
          passed ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-amber-100 dark:bg-amber-950/40"
        )}>
          <Trophy className={cn("h-10 w-10", passed ? "text-emerald-600" : "text-amber-600")} />
        </div>
        <div>
          <p className={cn("text-5xl font-black", passed ? "text-emerald-600" : "text-red-500")}>{pct}%</p>
          <p className="mt-1 font-bold text-lg">{passed ? "Well done!" : "Keep practising!"}</p>
          <p className="text-sm text-muted-foreground">{scores.correct} correct out of {total}</p>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{current.subjectName}</span>
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
        phase === "result" && selectedId === correctId   && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
        phase === "result" && selectedId !== correctId   && "border-red-400 bg-red-50 dark:bg-red-950/20"
      )}>
        <p className="text-base font-medium leading-relaxed md:text-lg">
          <InlineText text={current.text} />
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {current.options.map((opt, i) => {
          const isSelected = selectedId === opt.id
          const isRight    = opt.id === correctId
          const isRes      = phase === "result"

          let style = "border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer active:scale-[0.99]"
          let badge = "bg-muted text-muted-foreground"

          if (isRes) {
            if (isRight)           { style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"; badge = "bg-emerald-500 text-white" }
            else if (isSelected)   { style = "border-red-500 bg-red-50 dark:bg-red-950/30";             badge = "bg-red-500 text-white"     }
            else                   { style = "border-border bg-background opacity-40" }
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
                <InlineText text={opt.text} />
              </span>
              {isRes && isRight   && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />}
              {isRes && isSelected && !isRight && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>

      {/* Result panel */}
      {phase === "result" && (
        <div className={cn(
          "rounded-2xl border p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200",
          selectedId === correctId
            ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"
            : "border-red-200 bg-red-50 dark:bg-red-950/20"
        )}>
          <div className="flex items-center gap-2">
            {selectedId === correctId
              ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Correct!</span></>
              : <><XCircle className="h-4 w-4 text-red-500" /><span className="text-sm font-bold text-red-600 dark:text-red-400">Wrong — see the correct answer above.</span></>
            }
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
            {idx + 1 < questions.length ? <>Next <ArrowRight className="h-4 w-4" /></> : "See Results"}
          </button>
        </div>
      )}
    </div>
  )
}
