"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Check, Clock, Loader2, Minus, Plus, Timer, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type Subject = { id: string; name: string }

type Props = {
  schoolId: string
  schoolName: string
  schoolAbbr: string
  subjects: Subject[]
  subjectCounts: Record<string, number>
}

const SCHOOL_COLORS: Record<string, string> = {
  UNILAG:  "from-blue-600 to-blue-900",
  OAU:     "from-orange-500 to-orange-800",
  UI:      "from-violet-600 to-violet-900",
  UNIBEN:  "from-emerald-600 to-emerald-900",
  UNIPORT: "from-cyan-600 to-cyan-900",
  AFIT:    "from-rose-600 to-rose-900",
  GENERAL: "from-teal-600 to-emerald-900",
}

export function StudyPicker({ schoolId, schoolName, schoolAbbr, subjects, subjectCounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerMins, setTimerMins] = useState(30)

  const gradient = SCHOOL_COLORS[schoolAbbr] ?? "from-slate-600 to-slate-900"

  function toggleSubject(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        if (!questionCounts[id]) {
          setQuestionCounts((c) => ({ ...c, [id]: 10 }))
        }
      }
      return next
    })
  }

  function setCount(id: string, val: number) {
    const clamped = Math.min(50, Math.max(1, val))
    setQuestionCounts((prev) => ({ ...prev, [id]: clamped }))
  }

  const selectedSubjects = subjects.filter((s) => selected.has(s.id))
  const totalQuestions = selectedSubjects.reduce((sum, s) => sum + (questionCounts[s.id] ?? 10), 0)
  const canStart = selected.size >= 1

  function handleStart() {
    if (!canStart) return
    setLoading(true)

    const configs = selectedSubjects.map((s) => ({
      id: s.id,
      count: questionCounts[s.id] ?? 10,
    }))
    const encoded = btoa(JSON.stringify(configs))
    const duration = timerEnabled ? timerMins : 0

    router.push(
      `/study/session?school=${schoolId}&config=${encodeURIComponent(encoded)}&duration=${duration}`
    )
  }

  return (
    <div className="min-h-full bg-background pb-12">

      {/* Hero */}
      <div className={cn("bg-gradient-to-br px-5 py-8 text-white md:px-8", gradient)}>
        <div className="mx-auto max-w-lg">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-sm">
            <BookOpen className="h-3 w-3" /> Study Mode
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{schoolName}</h1>
          <p className="mt-2 text-sm text-white/75">
            Choose subjects, set question counts, and study at your own pace.
          </p>
          {canStart && (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                📚 {selected.size} subject{selected.size !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                📋 {totalQuestions} questions
              </div>
              {timerEnabled && (
                <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                  ⏱️ {timerMins} min timer
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-6 md:px-6">

        {/* Subject selection */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Subjects
            </p>
            {selected.size > 0 && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {selected.size} selected
              </span>
            )}
          </div>

          <div className="space-y-2">
            {subjects.map((s) => {
              const on = selected.has(s.id)
              const count = questionCounts[s.id] ?? 10
              const available = subjectCounts[s.id] ?? 0

              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-2xl border-2 transition-all duration-150",
                    on
                      ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border bg-background"
                  )}
                >
                  {/* Subject row */}
                  <button
                    onClick={() => toggleSubject(s.id)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
                      on ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30 bg-background"
                    )}>
                      {on && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold", on ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>
                        {s.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{available} questions available</p>
                    </div>
                  </button>

                  {/* Question count stepper (only when selected) */}
                  {on && (
                    <div className="flex items-center justify-between border-t border-emerald-500/20 px-4 py-3">
                      <span className="text-xs font-semibold text-muted-foreground">Questions from this subject</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCount(s.id, count - 5)}
                          disabled={count <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-all hover:bg-muted disabled:opacity-40 active:scale-95"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          value={count}
                          onChange={(e) => setCount(s.id, parseInt(e.target.value) || 1)}
                          min={1}
                          max={Math.min(50, available)}
                          className="w-14 rounded-lg border bg-background px-2 py-1 text-center text-sm font-black outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-2"
                        />
                        <button
                          onClick={() => setCount(s.id, count + 5)}
                          disabled={count >= Math.min(50, available)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-all hover:bg-muted disabled:opacity-40 active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Timer option */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Personal Timer</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">optional</span>
            </div>
            <button
              onClick={() => setTimerEnabled((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors",
                timerEnabled ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30 bg-muted"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                timerEnabled ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>

          {timerEnabled && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setTimerMins(Math.max(5, timerMins - 5))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-muted active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={timerMins}
                  onChange={(e) => setTimerMins(Math.min(180, Math.max(1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={180}
                  className="w-16 rounded-lg border bg-background px-2 py-1.5 text-center text-sm font-black outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-2"
                />
                <button
                  onClick={() => setTimerMins(Math.min(180, timerMins + 5))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-muted active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {timerEnabled
              ? "Timer counts down but won't stop your session — it's just for your own awareness."
              : "No timer — take as long as you need."
            }
          </p>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canStart || loading}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-black transition-all",
            canStart && !loading
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-[0.98]"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Loading questions…</>
          ) : !canStart ? (
            "Select at least 1 subject"
          ) : (
            <><Zap className="h-5 w-5" /> Start Study Session — {totalQuestions} Qs</>
          )}
        </button>

      </div>
    </div>
  )
}
