"use client"

import { cn } from "@/lib/utils"
import type { QuestionWithOptions } from "@/types"

type SubjectGroup = {
  id: string
  name: string
  questions: QuestionWithOptions[]
}

type Props = {
  subjects: SubjectGroup[]
  questions: QuestionWithOptions[]
  answers: Record<string, string | null>
  flagged: Set<string>
  currentQuestionId: string
  onSelect: (globalIndex: number) => void
}

export function QuestionNavigator({ subjects, questions, answers, flagged, currentQuestionId, onSelect }: Props) {
  return (
    <div className="space-y-4">
      {subjects.map((s) => {
        const answered = s.questions.filter(q => answers[q.id]).length
        return (
          <div key={s.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">{s.name}</p>
              <span className={cn(
                "text-[10px] font-semibold tabular-nums",
                answered === s.questions.length ? "text-emerald-500" : "text-muted-foreground"
              )}>
                {answered}/{s.questions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {s.questions.map((q) => {
                const globalIdx = questions.findIndex(gq => gq.id === q.id)
                const isCurrent = q.id === currentQuestionId
                const isAnswered = !!answers[q.id]
                const isFlagged = flagged.has(q.id)

                return (
                  <button
                    key={q.id}
                    onClick={() => onSelect(globalIdx)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg text-[11px] font-bold transition-all active:scale-95",
                      isCurrent && "ring-2 ring-primary ring-offset-1",
                      isFlagged
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                        : isAnswered
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {s.questions.indexOf(q) + 1}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="space-y-1.5 border-t pt-3">
        {[
          { color: "bg-emerald-100 dark:bg-emerald-900/50", label: "Answered" },
          { color: "bg-amber-100 dark:bg-amber-900/50",   label: "Flagged" },
          { color: "bg-muted",                             label: "Unanswered" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-sm", color)} />
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
