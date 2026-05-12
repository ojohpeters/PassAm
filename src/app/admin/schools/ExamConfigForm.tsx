"use client"

import { useTransition, useState } from "react"
import { saveExamConfig } from "@/actions/school.actions"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"

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

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await saveExamConfig(formData)
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
              {totalQuestions} questions · {totalAvailable} available in DB
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {open && (
        <form action={handleSave} className="border-t px-5 py-4 space-y-4">
          <input type="hidden" name="school_id" value={schoolId} />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Questions in Exam
            </label>
            <input
              type="number"
              name="total_questions"
              defaultValue={totalQuestions}
              min={1}
              max={200}
              required
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Questions Per Subject
            </p>
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-split evenly. Set a number to override for that subject.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.questionCount} in DB</p>
                  </div>
                  <input
                    type="number"
                    name={`subject_count_${s.id}`}
                    defaultValue={configuredSubjectCounts[s.id] ?? ""}
                    placeholder="Auto"
                    min={0}
                    max={s.questionCount}
                    className={cn(
                      "w-20 rounded-lg border bg-muted/50 px-2 py-1.5 text-center text-sm font-semibold outline-none",
                      "ring-primary/40 transition-all focus:border-primary focus:ring-2"
                    )}
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
