"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { ERROR_TAGS } from "@/lib/error-tags"
import { saveErrorTags } from "@/actions/error-tags.actions"
import { Check } from "lucide-react"

export function ErrorTagPicker({
  questionId,
  compact = false,
}: {
  questionId: string
  compact?: boolean
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [, startTransition] = useTransition()

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((t) => t !== id)
      : [...selected, id]
    setSelected(next)
    setSaved(false)
    startTransition(async () => {
      await saveErrorTags(questionId, next)
      setSaved(true)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          Why did you get this wrong?
        </p>
        {saved && selected.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" /> Logged
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ERROR_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggle(tag.id)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-all",
              compact ? "text-xs" : "text-sm",
              selected.includes(tag.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <span>{tag.emoji}</span>
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  )
}
