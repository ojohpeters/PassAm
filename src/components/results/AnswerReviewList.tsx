"use client"

import { cn } from "@/lib/utils"
import { InlineText } from "@/lib/parseInline"
import { ErrorTagPicker } from "@/components/shared/ErrorTagPicker"

type Option = { id: string; label: string; text: string; isCorrect: boolean }
type Answer = {
  id: string
  isCorrect: boolean
  selectedOptionId: string | null
  question: { id: string; text: string; explanation?: string | null; options: Option[] }
}

export function AnswerReviewList({ answers }: { answers: Answer[] }) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Question Review</h2>
      {answers.map((a, i) => (
        <div
          key={a.id}
          className={cn(
            "rounded-lg border p-4",
            a.isCorrect ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                        : "border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
          )}
        >
          <p className="text-sm font-medium">
            Q{i + 1}. <InlineText text={a.question.text} />
          </p>

          <div className="mt-2 space-y-1 text-sm">
            {a.question.options.map((opt) => {
              const isUserAnswer = a.selectedOptionId === opt.id
              return (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-2",
                    opt.isCorrect && "font-semibold text-green-700 dark:text-green-400",
                    isUserAnswer && !opt.isCorrect && "text-red-600 line-through dark:text-red-400"
                  )}
                >
                  <span className="font-mono">{opt.label}.</span>
                  <span><InlineText text={opt.text} /></span>
                  {opt.isCorrect && (
                    <span className="ml-auto text-xs font-normal text-green-600 dark:text-green-400">✓ Correct</span>
                  )}
                  {isUserAnswer && !opt.isCorrect && (
                    <span className="ml-auto text-xs font-normal text-red-500">Your answer</span>
                  )}
                </div>
              )
            })}
          </div>

          {!a.selectedOptionId && (
            <p className="mt-2 text-xs text-muted-foreground">Skipped</p>
          )}

          {a.question.explanation && (
            <p className="mt-3 rounded-md bg-white/60 dark:bg-black/20 p-2 text-xs text-muted-foreground">
              💡 <InlineText text={a.question.explanation} />
            </p>
          )}

          {/* Error tag picker — only for wrong/skipped answers */}
          {!a.isCorrect && (
            <div className="mt-3 border-t pt-3">
              <ErrorTagPicker questionId={a.question.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
