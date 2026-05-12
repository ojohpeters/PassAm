"use client"

import { useTransition, useState } from "react"
import { saveExamConfig } from "@/actions/school.actions"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Loader2, Save } from "lucide-react"

type Subject = { id: string; name: string; questionCount: number }
type Props = {
  schoolId: string
  schoolName: string
  abbreviation: string
  totalQuestions: number
  subjects: Subject[]
  configuredSubjectCounts: Record<string, number>
}

export function ExamConfigForm({
  schoolId,
  schoolName,
  abbreviation,
  totalQuestions,
  subjects,
  configuredSubjectCounts,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Controlled state so values persist correctly after save
  const [total, setTotal] = useState(totalQuestions)
  const [subjectValues, setSubjectValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      subjects.map((s) => [s.id, configuredSubjectCounts[s.id]?.toString() ?? ""])
    )
  )

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("school_id", schoolId)
    fd.append("total_questions", total.toString())
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
              {total} questions per exam · {totalAvailable} available in DB
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {open && (
        <form onSubmit={handleSave} className="border-t px-5 py-4 space-y-5">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Questions in Exam
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

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Questions Per Subject
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Leave blank to split evenly. Type a number to fix that subject's count.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((s) => (
                <div key={s.id} className="rounded-xl border bg-muted/20 px-4 py-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.questionCount} questions in DB</p>
                  </div>
                  <input
                    type="number"
                    value={subjectValues[s.id] ?? ""}
                    onChange={(e) =>
                      setSubjectValues((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                    placeholder={`Auto (~${Math.floor(total / subjects.length)})`}
                    min={1}
                    max={s.questionCount}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2 placeholder:font-normal placeholder:text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

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
