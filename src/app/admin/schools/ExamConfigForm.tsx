"use client"

import { useTransition, useState } from "react"
import { saveExamConfig } from "@/actions/school.actions"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Clock, Loader2, Lock, Save } from "lucide-react"
import { cn } from "@/lib/utils"

type Subject = { id: string; name: string; questionCount: number }
type Props = {
  schoolId: string
  schoolName: string
  abbreviation: string
  totalQuestions: number
  durationMins: number
  requiredSubjectIds: string[]
  subjects: Subject[]
  configuredSubjectCounts: Record<string, number>
}

export function ExamConfigForm({
  schoolId,
  schoolName,
  abbreviation,
  totalQuestions,
  durationMins,
  requiredSubjectIds,
  subjects,
  configuredSubjectCounts,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [total, setTotal] = useState(totalQuestions)
  const [duration, setDuration] = useState(durationMins)
  const [required, setRequired] = useState<Set<string>>(new Set(requiredSubjectIds))
  const [subjectValues, setSubjectValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      subjects.map((s) => [s.id, configuredSubjectCounts[s.id]?.toString() ?? ""])
    )
  )

  function toggleRequired(id: string) {
    setRequired((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("school_id", schoolId)
    fd.append("total_questions", total.toString())
    fd.append("duration_mins", duration.toString())
    for (const id of required) {
      fd.append(`required_subject_${id}`, "1")
    }
    for (const [subjectId, val] of Object.entries(subjectValues)) {
      if (val.trim() !== "") fd.append(`subject_count_${subjectId}`, val)
    }

    startTransition(async () => {
      const result = await saveExamConfig(fd)
      if (result.success) {
        toast.success(`${abbreviation} exam config saved`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const totalAvailable = subjects.reduce((sum, s) => sum + s.questionCount, 0)
  const requiredSubjects = subjects.filter((s) => required.has(s.id))

  return (
    <div className="rounded-2xl border bg-background overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-xs font-black text-primary">{abbreviation}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{schoolName}</p>
            <p className="text-xs text-muted-foreground">
              {total} Qs · {duration} min · {required.size} required subject{required.size !== 1 ? "s" : ""}
              {" · "}{totalAvailable} in DB
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {open && (
        <form onSubmit={handleSave} className="border-t px-5 py-5 space-y-6">

          {/* Duration + Total in a row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Exam Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={360}
                required
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Questions
              </label>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                min={1}
                max={200}
                required
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
              />
            </div>
          </div>

          {/* Required subjects */}
          <div className="space-y-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Required Subjects for Mock Exam
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Students cannot change these — they are mandatory for this school's mock exam.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((s) => {
                const on = required.has(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleRequired(s.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                      on
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20 hover:border-primary/40"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                      on ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {on && <svg viewBox="0 0 10 8" className="h-3 w-3 fill-white"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-semibold truncate", on ? "text-primary" : "")}>{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.questionCount} in DB</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {required.size === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ No required subjects — students can freely pick subjects (legacy mode).
              </p>
            )}
          </div>

          {/* Per-subject question counts (only for required subjects) */}
          {requiredSubjects.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Questions Per Required Subject
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Leave blank to split the total evenly.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {requiredSubjects.map((s) => (
                  <div key={s.id} className="rounded-xl border bg-muted/20 px-4 py-3">
                    <div className="mb-2">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.questionCount} available</p>
                    </div>
                    <input
                      type="number"
                      value={subjectValues[s.id] ?? ""}
                      onChange={(e) =>
                        setSubjectValues((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      placeholder={`Auto (~${requiredSubjects.length > 0 ? Math.floor(total / requiredSubjects.length) : "–"})`}
                      min={1}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2 placeholder:font-normal placeholder:text-muted-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? "Saving…" : "Save Config"}
          </button>
        </form>
      )}
    </div>
  )
}
