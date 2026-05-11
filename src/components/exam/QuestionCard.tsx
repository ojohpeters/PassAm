"use client"

import { cn } from "@/lib/utils"
import { Flag } from "lucide-react"
import type { QuestionWithOptions } from "@/types"

type Props = {
  question: QuestionWithOptions
  selected: string | null
  flagged: boolean
  index: number
  total: number
  onSelect: (optionId: string) => void
  onFlag: () => void
  onPrev: () => void
  onNext: () => void
}

export function QuestionCard({
  question,
  selected,
  flagged,
  index,
  total,
  onSelect,
  onFlag,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
            {question.subject.name}
          </span>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {total}
          </p>
        </div>
        <button
          onClick={onFlag}
          className={cn(
            "rounded-md p-2 transition-colors hover:bg-muted",
            flagged ? "text-yellow-500" : "text-muted-foreground"
          )}
          title={flagged ? "Unflag question" : "Flag for review"}
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>

      <p className="text-base leading-relaxed">{question.text}</p>

      <div className="space-y-3">
        {question.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted",
              selected === opt.id && "border-primary bg-primary/10 font-medium"
            )}
          >
            <span className="shrink-0 font-mono font-bold">{opt.label}.</span>
            <span>{opt.text}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={index === total - 1}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
