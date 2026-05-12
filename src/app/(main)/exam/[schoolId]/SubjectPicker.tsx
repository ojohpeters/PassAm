"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startExam } from "@/actions/exam.actions"
import { toast } from "sonner"
import { BookOpen, Lock, Check, Loader2, Zap, Clock, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

type Subject = { id: string; name: string }

type Props = {
  school: { id: string; name: string; abbreviation: string }
  schoolSlug: string
  subjects: Subject[]
  subjectCounts: Record<string, number>
  quotaLeft: number | null  // null = unlimited (Pro)
  canStart: boolean
}

// Presets for common course combinations
const PRESETS = [
  { label: "Medicine / Pharmacy", match: ["English Language", "Biology", "Chemistry", "Physics"] },
  { label: "Engineering",         match: ["English Language", "Mathematics", "Physics", "Chemistry"] },
  { label: "Pure Sciences",       match: ["English Language", "Mathematics", "Biology", "Chemistry"] },
]

export function SubjectPicker({ school, schoolSlug, subjects, subjectCounts, quotaLeft, canStart }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const englishSubject = subjects.find((s) => s.name === "English Language")
  const otherSubjects  = subjects.filter((s) => s.name !== "English Language")

  // English is always pre-selected
  const [selected, setSelected] = useState<Set<string>>(
    new Set(englishSubject ? [englishSubject.id] : [])
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function applyPreset(matchNames: string[]) {
    const ids = subjects
      .filter((s) => matchNames.includes(s.name))
      .map((s) => s.id)
    setSelected(new Set(ids))
  }

  const selectedCount = selected.size
  const totalQuestions = 40
  const perSubject = selectedCount > 0 ? Math.floor(totalQuestions / selectedCount) : 0
  const canBegin = canStart && selectedCount >= 2

  async function handleStart() {
    if (!canBegin) return
    setLoading(true)

    const result = await startExam(school.id, Array.from(selected))

    if (!result.success) {
      const msg =
        result.error === "QUOTA_EXCEEDED"           ? "You've used your 3 free exams this month." :
        result.error === "INSUFFICIENT_QUESTIONS"   ? "Not enough questions for one of the subjects you selected. Try a different combination." :
        result.error === "NO_SUBJECTS"              ? "Please select at least 2 subjects." :
        "Failed to start exam. Please try again."
      toast.error(msg)
      setLoading(false)
      return
    }

    router.push(`/exam/${schoolSlug}/session?attempt=${result.data.attemptId}`)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{school.abbreviation} POST-UTME</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{school.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose your subjects to build a personalised 40-question paper</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: LayoutGrid, label: "Questions", value: totalQuestions },
          { icon: Clock,      label: "Minutes",   value: 60 },
          { icon: BookOpen,   label: "Per subject", value: perSubject || "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border bg-muted/30 p-3 text-center">
            <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-xl font-black leading-none">{value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Presets */}
      {PRESETS.some((p) => p.match.every((name) => subjects.some((s) => s.name === name))) && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS
              .filter((p) => p.match.every((name) => subjects.some((s) => s.name === name)))
              .map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.match)}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  {p.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Subject list */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Subjects — <span className="text-primary">{selectedCount} selected</span>
        </p>

        {/* English — always locked */}
        {englishSubject && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
              <Lock className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{englishSubject.name}</p>
              <p className="text-[11px] text-muted-foreground">{subjectCounts[englishSubject.id] ?? 0} questions · compulsory</p>
            </div>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">FIXED</span>
          </div>
        )}

        {/* Elective subjects */}
        {otherSubjects.map((s) => {
          const on = selected.has(s.id)
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                on
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                on ? "border-primary bg-primary" : "border-muted-foreground/30"
              )}>
                {on && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <p className={cn("font-bold text-sm", on && "text-primary")}>{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{subjectCounts[s.id] ?? 0} questions available</p>
              </div>
              {on && (
                <span className="text-[11px] font-bold text-primary">{perSubject} Qs</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quota info */}
      {quotaLeft !== null && (
        <p className="text-center text-xs text-muted-foreground">
          {canStart
            ? <><span className="font-bold text-foreground">{quotaLeft}</span> of 3 free exams remaining this month</>
            : "You've used all 3 free exams this month — upgrade for unlimited access"
          }
        </p>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!canBegin || loading}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all",
          canBegin && !loading
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98]"
            : "cursor-not-allowed bg-muted text-muted-foreground"
        )}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Building your paper…</>
        ) : !canStart ? (
          "Quota Reached — Upgrade to Pro"
        ) : selectedCount < 2 ? (
          "Select at least 2 subjects"
        ) : (
          <><Zap className="h-4 w-4" /> Start {selectedCount}-Subject Exam</>
        )}
      </button>
    </div>
  )
}
