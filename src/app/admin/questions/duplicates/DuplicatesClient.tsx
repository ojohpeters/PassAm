"use client"

import { useState, useTransition } from "react"
import { deleteQuestions, type DuplicateGroup } from "@/actions/admin.actions"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type School = { id: string; name: string; abbreviation: string }

type Props = {
  groups: DuplicateGroup[]
  schools: School[]
  currentSchoolId: string | undefined
  currentPage: number
  totalPages: number
  total: number
}

export function DuplicatesClient({
  groups,
  schools,
  currentSchoolId,
  currentPage,
  totalPages,
  total,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [confirmAll, setConfirmAll] = useState(false)

  // Navigate with updated search params (resets to page 1 on filter change)
  function navigate(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) p.delete(k)
      else p.set(k, v)
    }
    router.push(`/admin/questions/duplicates?${p.toString()}`)
  }

  // Which question IDs to delete for a group.
  // When a school filter is active, only delete duplicates from that school
  // (keeping the oldest copy within that school).
  function idsToDelete(group: DuplicateGroup): string[] {
    if (currentSchoolId) {
      const schoolQs = group.questions.filter(
        (q) => q.school?.id === currentSchoolId
      )
      return schoolQs.slice(1).map((q) => q.id)
    }
    return group.questions.slice(1).map((q) => q.id)
  }

  function handleCleanGroup(idx: number, group: DuplicateGroup) {
    const ids = idsToDelete(group)
    if (!ids.length) return
    startTransition(async () => {
      await deleteQuestions(ids)
      setDone((prev) => new Set([...prev, idx]))
      router.refresh()
    })
  }

  function handleCleanAll() {
    const allIds = active.flatMap((g) => idsToDelete(g))
    startTransition(async () => {
      await deleteQuestions(allIds)
      router.refresh()
    })
    setConfirmAll(false)
  }

  const active = groups.filter((_, i) => !done.has(i))
  const activeDeleteCount = active.reduce((s, g) => s + idsToDelete(g).length, 0)

  return (
    <div className="space-y-4">

      {/* ── Filter + pagination header ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* School filter */}
        <div className="flex-1 min-w-[180px]">
          <select
            value={currentSchoolId ?? ""}
            onChange={(e) =>
              navigate({ school: e.target.value || undefined, page: undefined })
            }
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All schools (including cross-school)</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.abbreviation})
              </option>
            ))}
          </select>
        </div>

        {currentSchoolId && (
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Intra-school duplicates only
          </span>
        )}
      </div>

      {/* ── Bulk clean ── */}
      {active.length > 1 && activeDeleteCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background px-5 py-4">
          <div>
            <p className="text-sm font-bold">
              Clean {currentSchoolId ? "this school's " : "all "}duplicates at once
            </p>
            <p className="text-xs text-muted-foreground">
              Keep the oldest copy in each group, delete {activeDeleteCount} duplicate{activeDeleteCount !== 1 ? "s" : ""} across {active.length} groups
            </p>
          </div>
          {!confirmAll ? (
            <button
              onClick={() => setConfirmAll(true)}
              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition-all hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
              Clean {currentSchoolId ? "school" : "all"}
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
              <button
                onClick={() => setConfirmAll(false)}
                className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Group cards ── */}
      {groups.map((group, idx) => {
        if (done.has(idx)) return null
        const isExpanded = expandedIdx === idx
        const toDelete = idsToDelete(group)

        return (
          <div key={idx} className="overflow-hidden rounded-2xl border bg-background">
            <button
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {group.questions.length}×
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="line-clamp-2 text-sm font-bold leading-snug">
                  {group.questions[0].text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[...new Set(group.questions.map((q) => q.school?.abbreviation ?? "?"))].join(", ")}
                  {" · "}
                  {toDelete.length > 0
                    ? `${toDelete.length} to remove`
                    : <span className="text-emerald-600">nothing to clean here</span>}
                </p>
              </div>
              {isExpanded
                ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <div className="border-t">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-2.5 text-left">School</th>
                        <th className="px-5 py-2.5 text-left">Subject</th>
                        <th className="px-5 py-2.5 text-left">Year</th>
                        <th className="px-5 py-2.5 text-left">Added</th>
                        <th className="px-5 py-2.5 text-left w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.questions.map((q, qi) => {
                        const isKept = currentSchoolId
                          ? q.school?.id === currentSchoolId && group.questions.filter(x => x.school?.id === currentSchoolId).indexOf(q) === 0
                          : qi === 0
                        const isTarget = currentSchoolId
                          ? q.school?.id === currentSchoolId && !isKept
                          : qi > 0
                        const isCrossSchool = currentSchoolId && q.school?.id !== currentSchoolId

                        return (
                          <tr
                            key={q.id}
                            className={cn(
                              "border-b last:border-0",
                              isKept && "bg-green-50/50 dark:bg-green-950/20",
                              isCrossSchool && "opacity-50"
                            )}
                          >
                            <td className="px-5 py-3 font-medium">
                              {q.school?.abbreviation ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {q.subject?.name ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {q.year ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-xs text-muted-foreground">
                              {new Date(q.created_at).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-5 py-3">
                              {isKept ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <CheckCircle2 className="h-3 w-3" /> Keep
                                </span>
                              ) : isTarget ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
                                  <AlertTriangle className="h-3 w-3" /> Delete
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Other school</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end border-t px-5 py-3">
                  {toDelete.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No same-school duplicates to clean
                    </p>
                  ) : (
                    <button
                      onClick={() => handleCleanGroup(idx, group)}
                      disabled={isPending}
                      className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                      Keep oldest · delete {toDelete.length}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border bg-background px-5 py-4">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} · {total} group{total !== 1 ? "s" : ""} total
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => navigate({ page: String(currentPage - 1) })}
              className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm font-bold">{currentPage}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => navigate({ page: String(currentPage + 1) })}
              className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
