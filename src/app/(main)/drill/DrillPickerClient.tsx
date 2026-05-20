"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type Subject = { id: string; name: string }

export function DrillPickerClient({
  subjects,
  inProgress,
  defaultSchoolKey,
}: {
  subjects: Subject[]
  inProgress: boolean
  defaultSchoolKey: string | null
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(subjects.map((s) => s.id)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  function handleStart() {
    if (selected.size > 0) {
      const subjectParam = Array.from(selected).join(",")
      router.push(`/drill/session?subjects=${encodeURIComponent(subjectParam)}`)
    } else {
      router.push("/drill/session")
    }
  }

  return (
    <div className="space-y-4">
      {/* Subject picker */}
      <div className="rounded-2xl border bg-background p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Choose Subjects
          </p>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                {selected.size} selected
              </span>
            )}
            <button
              onClick={selected.size === subjects.length ? clearAll : selectAll}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {selected.size === subjects.length ? "Clear all" : "Select all"}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {selected.size === 0
            ? `Leave blank to use your school default (${defaultSchoolKey ?? "general pool"})`
            : `Drill questions will be pulled from your ${selected.size} selected subject${selected.size !== 1 ? "s" : ""}`
          }
        </p>

        <div className="grid grid-cols-2 gap-2">
          {subjects.map((s) => {
            const on = selected.has(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition-all active:scale-[0.97]",
                  on
                    ? "border-orange-500/50 bg-orange-50/60 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300"
                    : "border-border bg-background text-muted-foreground hover:border-orange-400/40 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                  on ? "border-orange-500 bg-orange-500" : "border-muted-foreground/30"
                )}>
                  {on && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="truncate">{s.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleStart}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-400 active:scale-[0.98]"
      >
        <Zap className="h-4 w-4" />
        {inProgress
          ? "Continue Drill"
          : selected.size > 0
          ? `Start Drill — ${selected.size} subject${selected.size !== 1 ? "s" : ""}`
          : "Start Today's Drill"
        }
      </button>
    </div>
  )
}
