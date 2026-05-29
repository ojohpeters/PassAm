"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startGeneralExam } from "@/actions/exam.actions"
import { toast } from "sonner"
import { Check, Loader2, Zap, Globe, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type Subject = { id: string; name: string }

export function GeneralSubjectPicker({
  subjects,
  subjectCounts,
  personalCountsBySubject,
  communityCountsBySubject,
}: {
  subjects: Subject[]
  subjectCounts: Record<string, number>
  personalCountsBySubject: Record<string, number>
  communityCountsBySubject: Record<string, number>
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [includePersonal, setIncludePersonal] = useState(false)
  const [includeCommunity, setIncludeCommunity] = useState(false)

  const englishSubject = subjects.find((s) => s.name === "English Language")
  const [selected, setSelected] = useState<Set<string>>(
    new Set(englishSubject ? [englishSubject.id] : [])
  )
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [qInput, setQInput] = useState("10")

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedCount = selected.size
  const totalAvailable = Array.from(selected).reduce((sum, id) => sum + (subjectCounts[id] ?? 0), 0)
  const effectiveQ = selectedCount > 0 && totalAvailable > 0 ? Math.min(totalQuestions, totalAvailable) : totalQuestions
  const perSubject = selectedCount > 0 ? Math.floor(effectiveQ / selectedCount) : 0
  const canBegin = selectedCount >= 1
  const timeMins = Math.round((effectiveQ * 90) / 60)

  const matchingPersonal = Array.from(selected).reduce((sum, id) => {
    const name = subjects.find(s => s.id === id)?.name?.toLowerCase() ?? ""
    return sum + (personalCountsBySubject[name] ?? 0)
  }, 0)
  const matchingCommunity = Array.from(selected).reduce((sum, id) => {
    const name = subjects.find(s => s.id === id)?.name?.toLowerCase() ?? ""
    return sum + (communityCountsBySubject[name] ?? 0)
  }, 0)
  const hasPersonal = Object.values(personalCountsBySubject).some(v => v > 0)
  const hasCommunity = Object.values(communityCountsBySubject).some(v => v > 0)

  async function handleStart() {
    if (!canBegin) return
    setLoading(true)
    const result = await startGeneralExam(Array.from(selected), totalQuestions, includePersonal, includeCommunity)
    if (!result.success) {
      const msg =
        result.error === "INSUFFICIENT_QUESTIONS"
          ? "Not enough questions for a subject you selected. Try a different combo."
          : result.error === "GENERAL_NOT_SETUP"
          ? "General practice is not yet configured. Please contact support."
          : "Failed to start exam. Please try again."
      toast.error(msg)
      setLoading(false)
      return
    }
    router.push(`/exam/general/session?attempt=${result.data.attemptId}`)
  }

  return (
    <div className="min-h-full bg-background pb-12">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-5 py-8 text-white md:px-8">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/80">
            <Globe className="h-3.5 w-3.5" />
            Cross-school practice
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">General Practice Exam</h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Questions sourced from across all schools — great for general prep while your school is being added.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { icon: "📋", label: `${effectiveQ} question${effectiveQ !== 1 ? "s" : ""}` },
              { icon: "⏱️", label: `${timeMins} minutes` },
              { icon: "🌐", label: "All schools combined" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-6 md:px-6">

        {/* "School coming soon" nudge */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="font-semibold text-primary">Your school not listed yet?</span>
          <span className="text-muted-foreground ml-1">
            Use this general exam to keep practising.{" "}
          </span>
          <Link href="/request-school" className="font-bold text-primary underline underline-offset-2">
            Let us know your school →
          </Link>
        </div>

        {/* Question count selector */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Questions</p>
            <span className="text-xs text-muted-foreground">{timeMins} min · {perSubject > 0 ? `~${perSubject}/subject` : "select subjects"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const n = Math.max(1, totalQuestions - 5); setTotalQuestions(n); setQInput(String(n)) }}
              disabled={totalQuestions <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40 active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={qInput}
              onChange={(e) => {
                setQInput(e.target.value)
                const n = parseInt(e.target.value)
                if (!isNaN(n) && n >= 1) setTotalQuestions(n)
              }}
              onBlur={() => {
                const n = parseInt(qInput)
                const clamped = !isNaN(n) && n >= 1 ? n : 1
                setTotalQuestions(clamped)
                setQInput(String(clamped))
              }}
              className="w-20 rounded-xl border bg-background px-3 py-2 text-center text-sm font-black outline-none ring-primary/40 focus:border-primary focus:ring-2"
            />
            <button
              onClick={() => { const n = totalQuestions + 5; setTotalQuestions(n); setQInput(String(n)) }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-muted active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {selectedCount > 0 && totalAvailable > 0 && totalQuestions > totalAvailable ? (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-amber-950/20">
              <span className="text-sm shrink-0">ℹ️</span>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Only <strong>{totalAvailable}</strong> question{totalAvailable !== 1 ? "s" : ""} available for your selected subjects — you&apos;ll get all {totalAvailable}.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Any number of questions — as many as are available.</p>
          )}
        </div>

        {/* Subject selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Subjects</p>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {selectedCount} selected
            </span>
          </div>

          <div className="space-y-2">
            {subjects.map((s) => {
              const on = selected.has(s.id)
              const isEnglish = s.name === "English Language"
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.99]",
                    on
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
                    on ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"
                  )}>
                    {on && <Check className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold", on ? "text-primary" : "text-foreground")}>
                      {s.name}
                      {isEnglish && (
                        <span className="ml-2 text-[10px] font-semibold text-muted-foreground">(recommended)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{subjectCounts[s.id] ?? 0} questions available</p>
                  </div>
                  {on && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                      ~{perSubject} Qs
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Include personal/community questions */}
        {(hasPersonal || hasCommunity) && (
          <div className="rounded-2xl border bg-background p-4 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Also Include</p>
            {hasPersonal && (
              <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">My personal questions</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount > 0 ? `${matchingPersonal} matching your selected subjects` : `${Object.values(personalCountsBySubject).reduce((a, b) => a + b, 0)} in your bank`}
                  </p>
                </div>
                <div onClick={() => setIncludePersonal(v => !v)}
                  className={cn("relative h-5 w-9 rounded-full shrink-0 transition-colors cursor-pointer", includePersonal ? "bg-primary" : "bg-muted-foreground/30")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", includePersonal ? "translate-x-4" : "translate-x-0.5")} />
                </div>
              </label>
            )}
            {hasCommunity && (
              <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Community questions</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount > 0 ? `${matchingCommunity} matching your selected subjects` : `${Object.values(communityCountsBySubject).reduce((a, b) => a + b, 0)} approved questions`}
                  </p>
                </div>
                <div onClick={() => setIncludeCommunity(v => !v)}
                  className={cn("relative h-5 w-9 rounded-full shrink-0 transition-colors cursor-pointer", includeCommunity ? "bg-primary" : "bg-muted-foreground/30")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", includeCommunity ? "translate-x-4" : "translate-x-0.5")} />
                </div>
              </label>
            )}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canBegin || loading}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-black transition-all duration-150",
            canBegin && !loading
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98]"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Building your paper…</>
          ) : selectedCount < 1 ? (
            "Select at least 1 subject"
          ) : (
            <><Zap className="h-5 w-5" /> Start General Exam</>
          )}
        </button>

      </div>
    </div>
  )
}
