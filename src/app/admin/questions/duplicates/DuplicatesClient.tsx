"use client"

import { useState, useTransition } from "react"
import { deleteQuestions, type DuplicateGroup } from "@/actions/admin.actions"
import { useRouter } from "next/navigation"
import { Trash2, ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function DuplicatesClient({ groups }: { groups: DuplicateGroup[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [confirmAll, setConfirmAll] = useState(false)

  // Keep oldest (first by created_at, already sorted) — delete the rest
  function idsToDelete(group: DuplicateGroup): string[] {
    return group.questions.slice(1).map((q) => q.id)
  }

  function handleCleanGroup(idx: number, group: DuplicateGroup) {
    startTransition(async () => {
      await deleteQuestions(idsToDelete(group))
      setDone((prev) => new Set([...prev, idx]))
      router.refresh()
    })
  }

  function handleCleanAll() {
    const allIds = groups.flatMap((g) => idsToDelete(g))
    startTransition(async () => {
      await deleteQuestions(allIds)
      router.refresh()
    })
    setConfirmAll(false)
  }

  const active = groups.filter((_, i) => !done.has(i))

  return (
    <div className="space-y-4">
      {/* Bulk clean */}
      {active.length > 1 && (
        <div className="flex items-center justify-between rounded-2xl border bg-background px-5 py-4">
          <div>
            <p className="text-sm font-bold">Clean all duplicates at once</p>
            <p className="text-xs text-muted-foreground">
              Keep the oldest copy of each question, delete {active.reduce((s, g) => s + idsToDelete(g).length, 0)} duplicates across {active.length} groups
            </p>
          </div>
          {!confirmAll ? (
            <button
              onClick={() => setConfirmAll(true)}
              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition-all hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
              Clean all
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-destructive">Are you sure?</span>
              <button
                onClick={handleCleanAll}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Yes, delete
              </button>
              <button onClick={() => setConfirmAll(false)} className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-muted">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Per-group cards */}
      {groups.map((group, idx) => {
        if (done.has(idx)) return null
        const isExpanded = expandedIdx === idx
        const toDelete = idsToDelete(group)

        return (
          <div key={idx} className="overflow-hidden rounded-2xl border bg-background">
            {/* Header */}
            <button
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-xs font-black text-amber-700 dark:text-amber-400">
                {group.questions.length}×
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-bold leading-snug line-clamp-2">{group.questions[0].text}</p>
                <p className="text-xs text-muted-foreground">
                  {group.questions.map((q) => q.school?.abbreviation ?? "?").join(", ")} · {toDelete.length} duplicate{toDelete.length !== 1 ? "s" : ""} to remove
                </p>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5 text-left">School</th>
                      <th className="px-5 py-2.5 text-left">Subject</th>
                      <th className="px-5 py-2.5 text-left">Year</th>
                      <th className="px-5 py-2.5 text-left">Added</th>
                      <th className="px-5 py-2.5 text-left w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.questions.map((q, qi) => (
                      <tr key={q.id} className={cn("border-b last:border-0", qi === 0 && "bg-green-50/50 dark:bg-green-950/20")}>
                        <td className="px-5 py-3 font-medium">
                          {q.school?.abbreviation ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{q.subject?.name ?? "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{q.year ?? "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {new Date(q.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-3">
                          {qi === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-[11px] font-bold text-green-700 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" /> Keep
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
                              <AlertTriangle className="h-3 w-3" /> Delete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end border-t px-5 py-3">
                  <button
                    onClick={() => handleCleanGroup(idx, group)}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Keep oldest · delete {toDelete.length}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
