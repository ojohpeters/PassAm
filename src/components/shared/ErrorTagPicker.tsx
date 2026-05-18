"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { ERROR_TAGS } from "@/lib/error-tags"
import { saveErrorTags } from "@/actions/error-tags.actions"
import { Check, Brain } from "lucide-react"

export function ErrorTagPicker({
  questionId,
  compact = false,
}: {
  questionId: string
  compact?: boolean
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  if (compact) {
    // ── Drill version ─────────────────────────────────────────────────────────
    return (
      <div className="rounded-2xl border-2 border-amber-300/70 bg-amber-50/90 dark:border-amber-600/50 dark:bg-amber-950/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🧠</span>
            <div>
              <p className="text-xs font-black text-amber-800 dark:text-amber-200 leading-tight">
                Why did you miss this?
              </p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                Tap one — helps schedule your review
              </p>
            </div>
          </div>
          {saved && selected.length > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0">
              <Check className="h-2.5 w-2.5" /> Saved
            </span>
          ) : (
            <span className="rounded-full bg-amber-200/60 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-800/40 dark:text-amber-300 shrink-0">
              optional
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ERROR_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggle(tag.id)}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all duration-150 active:scale-95",
                selected.includes(tag.id)
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-amber-300 bg-white text-amber-800 hover:border-primary/50 hover:bg-primary/5 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200"
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

  // ── Full version (exam review) ────────────────────────────────────────────
  return (
    <div className={cn(
      "rounded-2xl border-2 p-4 space-y-3 transition-all",
      saved && selected.length > 0
        ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/60 dark:bg-emerald-950/20"
        : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/30 dark:border-amber-800/60 dark:from-amber-950/30 dark:to-orange-950/10"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            saved && selected.length > 0
              ? "bg-emerald-100 dark:bg-emerald-950/50"
              : "bg-amber-100 dark:bg-amber-900/50"
          )}>
            {saved && selected.length > 0
              ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              : <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            }
          </div>
          <div>
            <p className={cn(
              "text-sm font-black leading-tight",
              saved && selected.length > 0
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-amber-900 dark:text-amber-100"
            )}>
              {saved && selected.length > 0 ? "Mistake logged ✓" : "Pin this to your review queue"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {saved && selected.length > 0
                ? "We'll resurface this question at the right time"
                : "Tag why — we'll schedule smarter repeats"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ERROR_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggle(tag.id)}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95",
              selected.includes(tag.id)
                ? "border-primary bg-primary text-primary-foreground shadow-sm scale-105"
                : "border-amber-200 bg-white text-amber-900 hover:border-primary/40 hover:bg-primary/5 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200"
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
