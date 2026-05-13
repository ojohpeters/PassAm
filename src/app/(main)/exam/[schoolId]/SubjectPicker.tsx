"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startExam } from "@/actions/exam.actions"
import { toast } from "sonner"
import {
  BookOpen, CalendarDays, Check, Clock, ChevronDown, ChevronLeft,
  Loader2, Lock, Zap, LayoutGrid, Minus, Plus, Timer, Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Subject = { id: string; name: string }
type Mode = "mock" | "study" | null

type Props = {
  school: { id: string; name: string; abbreviation: string }
  schoolSlug: string
  subjects: Subject[]
  subjectCounts: Record<string, number>
  availableYears: number[]
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
const TIME_OPTIONS = [20, 30, 45, 60]

export function SubjectPicker({
  school,
  schoolSlug,
  subjects,
  subjectCounts,
  availableYears,
  requiredSubjectIds,
  adminDurationMins,
  adminSubjectCounts,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(null)
  const [loading, setLoading] = useState(false)

  const isAdminConfigured = requiredSubjectIds.length > 0
  const requiredSubjects = subjects.filter((s) => requiredSubjectIds.includes(s.id))
  const adminTotalQuestions = isAdminConfigured
    ? requiredSubjects.reduce(
        (sum, s) => sum + (adminSubjectCounts[s.id] ?? Math.floor(40 / requiredSubjects.length)),
        0
      )
    : 0

  const gradient = SCHOOL_COLORS[school.abbreviation] ?? "from-slate-600 to-slate-900"

  // ── Mock exam state ─────────────────────────────────────────────────────────
  const englishSubject = subjects.find((s) => s.name === "English Language")
  const [selected, setSelected] = useState<Set<string>>(
    new Set(englishSubject ? [englishSubject.id] : [])
  )
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [durationMins, setDurationMins] = useState(30)
  const [year, setYear] = useState<number | null>(null)

  function toggleMock(id: string) {
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

  async function handleStartMock() {
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

    const result = await startExam(
      school.id, subjectIds, questionCount,
      perSubjectCounts,
      isAdminConfigured ? undefined : durationMins,
      year ?? undefined
    )
    if (!result.success) {
      const msg =
        result.error === "INSUFFICIENT_QUESTIONS"
          ? (year ? `No questions found for ${year} in one of your subjects. Try a different year or "All Years".` : "Not enough questions for one of the subjects.")
          : result.error === "NO_SUBJECTS"
          ? "Please select at least 1 subject."
          : "Failed to start exam — please try again."
      toast.error(msg)
      setLoading(false)
      return
    }
    router.push(`/exam/${schoolSlug}/session?attempt=${result.data.attemptId}&time=${result.data.timeLimitSecs}`)
  }

  // ── Study mode state ────────────────────────────────────────────────────────
  const [studySelected, setStudySelected] = useState<Set<string>>(new Set())
  const [studyCounts, setStudyCounts] = useState<Record<string, number>>({})
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerMins, setTimerMins] = useState(30)
  const [studyYear, setStudyYear] = useState<number | null>(null)

  function toggleStudy(id: string) {
    setStudySelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        if (!studyCounts[id]) setStudyCounts((c) => ({ ...c, [id]: 10 }))
      }
      return next
    })
  }
  function setStudyCount(id: string, val: number) {
    const available = subjectCounts[id] ?? 999
    setStudyCounts((prev) => ({ ...prev, [id]: Math.min(available, Math.max(1, val)) }))
  }

  function handleStartStudy() {
    if (studySelected.size < 1) return
    setLoading(true)
    const configs = subjects.filter(s => studySelected.has(s.id)).map(s => ({
      id: s.id,
      count: studyCounts[s.id] ?? 10,
    }))
    const encoded = btoa(JSON.stringify(configs))
    const duration = timerEnabled ? timerMins : 0
    const yearParam = studyYear ? `&year=${studyYear}` : ""
    router.push(`/study/session?school=${school.id}&config=${encodeURIComponent(encoded)}&duration=${duration}${yearParam}`)
  }

  const studySubjectList = subjects.filter(s => studySelected.has(s.id))
  const studyTotal = studySubjectList.reduce((sum, s) => sum + (studyCounts[s.id] ?? 10), 0)

  // ── Step 0: Mode chooser ────────────────────────────────────────────────────
  if (mode === null) {
    return (
      <div className="min-h-full bg-background">
        <div className={cn("bg-gradient-to-br px-5 py-8 text-white md:px-8", gradient)}>
          <div className="mx-auto max-w-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">PrepIQ</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{school.name}</h1>
            <p className="mt-2 text-sm text-white/70">Choose how you want to prepare today</p>
          </div>
        </div>

        <div className="mx-auto max-w-lg space-y-4 px-4 pt-6 pb-12 md:px-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Mode</p>

          {/* Mock Exam card */}
          <button
            onClick={() => setMode("mock")}
            className="group flex w-full items-start gap-4 rounded-2xl border-2 border-border bg-background p-5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/15">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base">Mock Exam</p>
              <p className="mt-1 text-sm text-muted-foreground leading-snug">
                Timed exam under real conditions. Score is saved to your history.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["⏱ Timed", "📊 Scored", "📋 Exam conditions"].map(tag => (
                  <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{tag}</span>
                ))}
              </div>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 -rotate-90 text-muted-foreground transition-transform group-hover:text-primary" />
          </button>

          {/* Study Mode card */}
          <button
            onClick={() => setMode("study")}
            className="group flex w-full items-start gap-4 rounded-2xl border-2 border-border bg-background p-5 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-50/50 active:scale-[0.99] dark:hover:bg-emerald-950/20"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/15">
              <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base">Study Mode</p>
              <p className="mt-1 text-sm text-muted-foreground leading-snug">
                Instant answer feedback after each question. No score saved — pure learning.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["✅ Instant feedback", "🕐 Optional timer", "💡 No pressure"].map(tag => (
                  <span key={tag} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{tag}</span>
                ))}
              </div>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 -rotate-90 text-muted-foreground transition-transform group-hover:text-emerald-500" />
          </button>
        </div>
      </div>
    )
  }

  // ── Back button shared header ───────────────────────────────────────────────
  function BackHeader({ subtitle }: { subtitle: string }) {
    return (
      <div className={cn("bg-gradient-to-br px-5 py-8 text-white md:px-8", gradient)}>
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => { setMode(null); setLoading(false) }}
            className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Change mode
          </button>
          <div className="flex items-center gap-3">
            {mode === "mock"
              ? <Trophy className="h-6 w-6 text-white/80" />
              : <BookOpen className="h-6 w-6 text-white/80" />
            }
            <div>
              <h1 className="text-xl font-black tracking-tight md:text-2xl">{school.name}</h1>
              <p className="text-sm text-white/70">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Study mode layout ───────────────────────────────────────────────────────
  if (mode === "study") {
    const canStart = studySelected.size >= 1

    return (
      <div className="min-h-full bg-background pb-12">
        <BackHeader subtitle="Study Mode — instant feedback, no score saved" />

        <div className="mx-auto max-w-lg space-y-6 px-4 pt-6 md:px-6">

          {/* Subjects */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Subjects</p>
              {studySelected.size > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {studySelected.size} selected · {studyTotal} Qs
                </span>
              )}
            </div>
            <div className="space-y-2">
              {subjects.map((s) => {
                const on = studySelected.has(s.id)
                const count = studyCounts[s.id] ?? 10
                const available = subjectCounts[s.id] ?? 0
                return (
                  <div key={s.id} className={cn(
                    "rounded-2xl border-2 transition-all duration-150",
                    on ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border bg-background"
                  )}>
                    <button onClick={() => toggleStudy(s.id)} className="flex w-full items-center gap-3 p-4 text-left">
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
                    {on && (
                      <div className="flex items-center justify-between border-t border-emerald-500/20 px-4 py-3">
                        <span className="text-xs font-semibold text-muted-foreground">Questions</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setStudyCount(s.id, count - 5)} disabled={count <= 1}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40 active:scale-95">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number" value={count}
                            onChange={(e) => setStudyCount(s.id, parseInt(e.target.value) || 1)}
                            min={1} max={Math.min(50, available)}
                            className="w-14 rounded-lg border bg-background px-2 py-1 text-center text-sm font-black outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-2"
                          />
                          <button onClick={() => setStudyCount(s.id, count + 5)} disabled={count >= Math.min(50, available)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40 active:scale-95">
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

          {/* Year filter */}
          {availableYears.length > 0 && (
            <YearSelect years={availableYears} value={studyYear} onChange={setStudyYear} />
          )}

          {/* Timer */}
          <div className="rounded-2xl border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Personal Timer</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">optional</span>
              </div>
              <button
                onClick={() => setTimerEnabled(v => !v)}
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
                  <button onClick={() => setTimerMins(Math.max(5, timerMins - 5))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-muted active:scale-95">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input type="number" value={timerMins}
                    onChange={e => setTimerMins(Math.min(180, Math.max(1, parseInt(e.target.value) || 1)))}
                    min={1} max={180}
                    className="w-16 rounded-lg border bg-background px-2 py-1.5 text-center text-sm font-black outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-2"
                  />
                  <button onClick={() => setTimerMins(Math.min(180, timerMins + 5))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-muted active:scale-95">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {timerEnabled ? "Counts down but won't stop your session — for your own awareness." : "No timer — take as long as you need."}
            </p>
          </div>

          <button
            onClick={handleStartStudy}
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
              <><Zap className="h-5 w-5" /> Start Study Session — {studyTotal} Qs</>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ── Mock exam: admin-configured layout ──────────────────────────────────────
  if (isAdminConfigured) {
    const durationLabel = adminDurationMins ? `${adminDurationMins} min` : `${Math.round((adminTotalQuestions * 90) / 60)} min`

    return (
      <div className="min-h-full bg-background pb-12">
        <BackHeader subtitle={`Mock Exam · ${adminTotalQuestions} questions · ${durationLabel}`} />

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
                      <p className="text-xs text-muted-foreground">{subjectCounts[s.id] ?? 0} available</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">{qCount} Qs</span>
                  </div>
                )
              })}
            </div>
          </div>

          {availableYears.length > 0 && (
            <YearSelect years={availableYears} value={year} onChange={setYear} />
          )}

          <div className="rounded-2xl border bg-amber-50/60 border-amber-200/60 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300">
            This is your school&apos;s official mock exam configuration. Subjects and question counts are set by your admin.
          </div>

          <button
            onClick={handleStartMock}
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-black transition-all",
              loading ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98]"
            )}
          >
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Building your paper…</> : <><Zap className="h-5 w-5" /> Start Mock Exam</>}
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{durationLabel}</span>
            <span className="flex items-center gap-1"><LayoutGrid className="h-3 w-3" />{adminTotalQuestions} questions</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Mock exam: free-pick layout ─────────────────────────────────────────────
  const selectedCount = selected.size
  const perSubject = selectedCount > 0 ? Math.floor(totalQuestions / selectedCount) : 0
  const canBegin = selectedCount >= 1
  const availablePresets = PRESETS.filter(p => p.match.every(name => subjects.some(s => s.name === name)))

  return (
    <div className="min-h-full bg-background pb-12">
      <BackHeader subtitle={`Mock Exam · ${totalQuestions} questions · ${durationMins} min`} />

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-6 md:px-6">

        {/* Question count */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Questions</p>
            <span className="text-xs text-muted-foreground">{perSubject > 0 ? `~${perSubject}/subject` : "select subjects first"}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Q_OPTIONS.map((n) => (
              <button key={n} onClick={() => setTotalQuestions(n)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-black transition-all active:scale-[0.96]",
                  totalQuestions === n
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Time limit */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time Limit</p>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {durationMins} min
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TIME_OPTIONS.map((t) => (
              <button key={t} onClick={() => setDurationMins(t)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-black transition-all active:scale-[0.96]",
                  durationMins === t
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}>
                {t}m
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Max 60 min — similar to actual POST-UTME.</p>
        </div>

        {/* Year */}
        {availableYears.length > 0 && (
          <YearSelect years={availableYears} value={year} onChange={setYear} />
        )}

        {/* Presets */}
        {availablePresets.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Presets</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {availablePresets.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p.match)}
                  className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 text-left text-sm font-semibold transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]">
                  <span className="text-base">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subjects */}
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
              return (
                <button key={s.id} onClick={() => toggleMock(s.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.99]",
                    on ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
                  )}>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
                    on ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"
                  )}>
                    {on && <Check className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold", on ? "text-primary" : "text-foreground")}>
                      {s.name}
                      {s.name === "English Language" && (
                        <span className="ml-2 text-[10px] font-semibold text-muted-foreground">(recommended)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{subjectCounts[s.id] ?? 0} questions available</p>
                  </div>
                  {on && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">~{perSubject} Qs</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleStartMock}
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
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{durationMins} min timer</span>
          <span className="flex items-center gap-1"><LayoutGrid className="h-3 w-3" />{totalQuestions} questions</span>
        </div>
      </div>
    </div>
  )
}

function YearSelect({
  years,
  value,
  onChange,
}: {
  years: number[]
  value: number | null
  onChange: (y: number | null) => void
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Year Filter</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">optional</span>
      </div>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="w-full appearance-none rounded-xl border bg-background px-3 py-2.5 pr-9 text-sm font-semibold text-foreground outline-none ring-primary/40 focus:border-primary focus:ring-2 transition-all"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">
        {value ? `Questions from ${value} only.` : "Questions from all available years."}
      </p>
    </div>
  )
}
