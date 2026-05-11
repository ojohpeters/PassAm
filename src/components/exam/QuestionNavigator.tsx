"use client"

import { cn } from "@/lib/utils"
import type { QuestionWithOptions } from "@/types"

type Props = {
  questions: QuestionWithOptions[]
  answers: Record<string, string | null>
  flagged: Set<string>
  current: number
  onSelect: (index: number) => void
}

export function QuestionNavigator({ questions, answers, flagged, current, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Questions
      </p>
      <div className="grid grid-cols-5 gap-1">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => onSelect(i)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors",
              i === current && "ring-2 ring-primary ring-offset-1",
              flagged.has(q.id) && "bg-yellow-100 text-yellow-700",
              !flagged.has(q.id) && answers[q.id] && "bg-green-100 text-green-700",
              !flagged.has(q.id) && !answers[q.id] && "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-green-100" /> Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-yellow-100" /> Flagged
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-muted" /> Unanswered
        </div>
      </div>
    </div>
  )
}
