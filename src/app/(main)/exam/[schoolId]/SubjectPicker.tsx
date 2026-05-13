"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startExam } from "@/actions/exam.actions"
import { toast } from "sonner"
import { BookOpen, Check, Clock, Loader2, Lock, Zap, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type Subject = { id: string; name: string }

type Props = {
  school: { id: string; name: string; abbreviation: string }
  schoolSlug: string
  subjects: Subject[]
  subjectCounts: Record<string, number>
  requiredSubjectIds: string[]
  adminDurationMins: number | null
  adminSubjectCounts: Record<string, number>
}

const PRESETS = [
  { label: "Medicine / Pharmacy", icon: "🩺", match: ["English Language", "Biology", "Chemistry", "Physics"] },
  { label: "Engineering",         icon: "⚙️",  match: ["English Language", "Mathematics", "Physics", "Chemistry"] },
  { label: "Pure Sciences",       icon: "🔬", match: ["English Language", "Mathematics", "Biology", "Chemistry"] },
]

const SCHOOL_COLORS: Record<string, string> = {
  UNILAG:  "from-blue-600 to-blue-900",
  OAU:     "from-orange-500 to-orange-800",
  UI:      "from-violet-600 to-violet-900",
  UNIBEN:  "from-emerald-600 to-emerald-900",
  UNIPORT: "from-cyan-600 to-cyan-900",
  AFIT:    "from-rose-600 to-rose-900",
}

const Q_OPTIONS = [10, 20, 30, 40, 50]

export function SubjectPicker({
  school,
  schoolSlug,
  subjects,
  subjectCounts,
  requiredSubjectIds,
  adminDurationMins,
  adminSubjectCounts,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // ── Admin-configured mock exam mode ────────────────────────────────────────
  const isAdminConfigured = requiredSubjectIds.length > 0
  const requiredSubjects = subjects.filter((s) => requiredSubjectIds.includes(s.id))
  const adminTotalQuestions = isAdminConfigured
    ? requiredSubjects.reduce(
        (sum, s) => sum + (adminSubjectCounts[s.id] ?? Math.floor(40 / requiredSubjects.length)),
        0
      )
    : 0

  // ── Free-pick mode state ────────────────────────────────────────────────────
  const englishSubject = subjects.find((s) => s.name === "English Language")
  const [selected, setSelected] = useState<Set<string>>(
    new Set(englishSubject ? [englishSubject.id] : [])
  )
  const [totalQuestions, setTotalQuestions] = useState(10)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function applyPreset(matchNames: string[]) {
    const ids = subjects.filter((s) => matchNames.includes(s.name)).map((s) => s.id)
    setSelected(new Set(ids))
  }

  const gradient = SCHOOL_COLORS[school.abbreviation] ?? "from-slate-600 to-slate-900"

  // ── Start exam handler ──────────────────────────────────────────────────────
  async function handleStart() {
    setLoading(true)
    let subjectIds: string[]
    let questionCount: number

    let perSubjectCounts: Record<string, number> | undefined
    if (isAdminConfigured) {
      subjectIds = requiredSubjectIds
      questionCount = adminTotalQuestions
      perSubjectCounts = adminSubjectCounts
    } else {
      if (selected.size < 1) { setLoading(false); return }
      subjectIds = Array.from(selected)
      questionCount = totalQuestions
    }

    const result = await startExam(school.id, subjectIds, questionCount, perSubjectCounts)
    if (!result.success) {
      const msg =
        result.error === "INSUFFICIENT_QUESTIONS" ? "Not enough questions for one of the subjects. Try adjusting your selection." :
        result.error === "NO_SUBJECTS"            ? "Please select at least 1 subject." :
        "Failed to start exam — please try again."
      toast.error(msg)
      setLoading(false)
      return
    }
    router.push(`/exam/${schoolSlug}/session?attempt=${result.data.attemptId}&time=${result.data.timeLimitSecs}`)
  }

  const availablePresets = PRESETS.filter((p) =>
    p.match.every((name) => subjects.some((s) => s.name === name))
  )

  // ── Admin-configured layout ─────────────────────────────────────────────────
  if (isAdminConfigured) {
    const durationLabel = adminDurationMins ? `${adminDurationMins} min` : `${Math.round((adminTotalQuestions * 90) / 60)} min`

    return (
      <div className="min-h-full bg-background pb-12">
        <div className={cn("bg-gradient-to-br px-5 py-8 text-white md:px-8", gradient)}>
          <div className="mx-auto max-w-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">POST-UTME Mock Exam</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{school.name}</h1>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { icon: "📋", label: `${adminTotalQuestions} questions` },
                { icon: "⏱️", label: durationLabel },
                { icon: "📚", label: `${requiredSubjects.length} subjects` },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg space-y-5 px-4 pt-6 md:px-6">

          <div className="rounded-2xl border bg-background p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-bold">Exam subjects set by admin</p>
            </div>
            <div className="space-y-2">
              {requiredSubjects.map((s) => {
                const qCount = adminSubjectCounts[s.id] ?? Math.floor(adminTotalQuestions / requiredSubjects.length)
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{subjectCounts[s.id] ?? 0} available in DB</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                      {qCount} Qs
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-amber-50/60 border-amber-200/60 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300">
            This is your school&apos;s official mock exam configuration. Subjects and question counts are set by your admin and cannot be changed.
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-black transition-all",
              loading
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98]"
            )}
          >
            {loading
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Building your paper…</>
              : <><Zap className="h-5 w-5" /> Start Mock Exam</>
            }
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{durationLabel}</span>
            <span className="flex items-center gap-1"><LayoutGrid className="h-3 w-3" />{adminTotalQuestions} questions</span>
          </div>

          <div className="text-center">
            <Link
              href={`/study/${schoolSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Want to study instead? Try Study Mode →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Free-pick layout (no admin config) ─────────────────────────────────────
  const selectedCount = selected.size
  const perSubject = selectedCount > 0 ? Math.floor(totalQuestions / selectedCount) : 0
  const canBegin = selectedCount >= 1
  const timeMins = Math.round((totalQuestions * 90) / 60)

  return (
    <div className="min-h-full bg-background pb-12">
      <div className={cn("bg-gradient-to-br px-5 py-8 text-white md:px-8", gradient)}>
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">POST-UTME Practice</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{school.name}</h1>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { icon: "📋", label: `${totalQuestions} questions` },
              { icon: "⏱️", label: `${timeMins} minutes` },
              { icon: "📚", label: `${subjects.length} subjects available` },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-6 md:px-6">

        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Questions</p>
            <span className="text-xs text-muted-foreground">{timeMins} min · {perSubject > 0 ? `~${perSubject}/subject` : "select subjects"}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Q_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setTotalQuestions(n)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-black transition-all active:scale-[0.96]",
                  totalQuestions === n
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Default is 10. Max is 50.</p>
        </div>

        {availablePresets.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Presets</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {availablePresets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.match)}
                  className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 text-left text-sm font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
                >
                  <span className="text-base">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
            <><Zap className="h-5 w-5" /> Start {selectedCount}-Subject Exam</>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          {[
            { icon: Clock, text: `${timeMins} min timer` },
            { icon: LayoutGrid, text: `${totalQuestions} questions` },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1">
              <Icon className="h-3 w-3" /> {text}
            </span>
          ))}
        </div>

        <div className="text-center">
          <Link
            href={`/study/${schoolSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Want to study instead? Try Study Mode →
          </Link>
        </div>
      </div>
    </div>
  )
}
