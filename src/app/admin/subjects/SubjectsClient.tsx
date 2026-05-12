"use client"

import { useState, useTransition, useMemo } from "react"
import { createSubject, mergeSubjects } from "@/actions/admin.actions"
import { subjectSimilarity } from "@/lib/subject-utils"
import { toast } from "sonner"
import {
  AlertTriangle,
  BookOpen,
  Check,
  GitMerge,
  Hash,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type Subject = { id: string; name: string; questionCount: number }

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")

  // Merge state
  const [mergingId, setMergingId] = useState<string | null>(null)   // source (to be deleted)
  const [confirmMerge, setConfirmMerge] = useState<{ targetId: string; targetName: string } | null>(null)

  // ── Live similarity check ───────────────────────────────────────────────
  const similarities = useMemo(() => {
    if (!name.trim()) return []
    return subjects
      .map((s) => ({ subject: s, level: subjectSimilarity(name.trim(), s.name) }))
      .filter((r) => r.level !== "different")
  }, [name, subjects])

  const hasExact   = similarities.some((r) => r.level === "exact")
  const hasSimilar = similarities.some((r) => r.level === "similar")

  // ── Create ──────────────────────────────────────────────────────────────
  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || hasExact) return
    startTransition(async () => {
      const result = await createSubject(name.trim())
      if (result.success) {
        toast.success(`Subject "${name.trim()}" created`)
        setName("")
        router.refresh()
      } else if (result.error?.startsWith("DUPLICATE:")) {
        const existing = result.error.replace("DUPLICATE:", "")
        toast.error(`"${existing}" already exists`)
      } else {
        toast.error("Failed to create subject")
      }
    })
  }

  // ── Merge ───────────────────────────────────────────────────────────────
  const mergingSubject = subjects.find((s) => s.id === mergingId)

  function handleMergeConfirm() {
    if (!mergingId || !confirmMerge) return
    startTransition(async () => {
      const res = await mergeSubjects(confirmMerge.targetId, mergingId)
      if (res.success) {
        toast.success(
          `Merged into "${confirmMerge.targetName}" — ${res.data.moved} question${res.data.moved !== 1 ? "s" : ""} moved`
        )
        setMergingId(null)
        setConfirmMerge(null)
        router.refresh()
      } else {
        toast.error("Merge failed — please try again")
      }
    })
  }

  return (
    <div className="space-y-8">

      {/* ── Merge mode banner ──────────────────────────────────────────────── */}
      {mergingId && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 dark:border-amber-700 dark:bg-amber-950/30">
          <GitMerge className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              Merging &ldquo;{mergingSubject?.name}&rdquo;
            </p>
            <p className="text-xs text-amber-700/70 dark:text-amber-300/70">
              Select a subject below to merge into — all its questions will move there
            </p>
          </div>
          <button
            onClick={() => { setMergingId(null); setConfirmMerge(null) }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-900/30"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      )}

      {/* ── Confirm merge dialog ───────────────────────────────────────────── */}
      {confirmMerge && mergingSubject && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmMerge(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-background p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
              <GitMerge className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-black">Confirm Merge</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              All <strong className="text-foreground">{mergingSubject.questionCount} question{mergingSubject.questionCount !== 1 ? "s" : ""}</strong> from{" "}
              <strong className="text-foreground">&ldquo;{mergingSubject.name}&rdquo;</strong> will move to{" "}
              <strong className="text-foreground">&ldquo;{confirmMerge.targetName}&rdquo;</strong>.
              The subject <strong className="text-destructive">&ldquo;{mergingSubject.name}&rdquo;</strong> will be permanently deleted.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmMerge(null)}
                className="flex-1 rounded-2xl border py-3 text-sm font-bold transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeConfirm}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
                Merge
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Add subject form ───────────────────────────────────────────────── */}
      {!mergingId && (
        <div className="rounded-2xl border bg-background p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Add New Subject</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Subjects are shared across all schools</p>
          </div>
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Further Mathematics"
              maxLength={100}
              required
              className={cn(
                "flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 transition-all focus:ring-2 placeholder:text-muted-foreground placeholder:font-normal",
                hasExact ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                  : hasSimilar ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400/20"
                  : "focus:border-primary"
              )}
            />
            <button
              type="submit"
              disabled={isPending || !name.trim() || hasExact}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </form>

          {/* Similarity warnings */}
          {similarities.length > 0 && (
            <div className={cn(
              "rounded-xl border px-4 py-3 text-xs",
              hasExact
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-amber-300/50 bg-amber-50 text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-300"
            )}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="space-y-1">
                  {hasExact ? (
                    <p className="font-bold">This subject already exists — cannot create a duplicate.</p>
                  ) : (
                    <p className="font-bold">Similar subject{similarities.length > 1 ? "s" : ""} already exist — are you sure?</p>
                  )}
                  {similarities.map(({ subject, level }) => (
                    <p key={subject.id} className="font-medium">
                      {level === "exact" ? "⛔" : "⚠️"}{" "}
                      &ldquo;{subject.name}&rdquo; — {subject.questionCount.toLocaleString()} question{subject.questionCount !== 1 ? "s" : ""}
                      {level === "similar" && (
                        <span className="ml-2 font-normal opacity-70">
                          (use Merge below to combine them instead)
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Subject list ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          All Subjects ({subjects.length})
        </h2>
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-background py-16 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No subjects yet</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => {
              const isMergingSource = s.id === mergingId
              const isMergeTarget = mergingId && s.id !== mergingId

              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 transition-all",
                    isMergingSource && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
                    isMergeTarget && "hover:border-primary/40 hover:shadow-sm cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isMergingSource ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"
                  )}>
                    {isMergingSource
                      ? <GitMerge className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      : <Hash className="h-4 w-4 text-primary" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.questionCount.toLocaleString()} question{s.questionCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Merge target button */}
                  {isMergeTarget && (
                    <button
                      onClick={() => setConfirmMerge({ targetId: s.id, targetName: s.name })}
                      className="flex shrink-0 items-center gap-1 rounded-xl border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[11px] font-bold text-primary transition-all hover:bg-primary/10 active:scale-[0.97]"
                    >
                      <Check className="h-3 w-3" /> Merge here
                    </button>
                  )}

                  {/* Merge source button (only when not in merge mode) */}
                  {!mergingId && (
                    <button
                      onClick={() => setMergingId(s.id)}
                      title={`Merge "${s.name}" into another subject`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 transition-all hover:bg-muted hover:text-muted-foreground"
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
