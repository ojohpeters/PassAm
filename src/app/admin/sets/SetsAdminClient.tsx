"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createQuestionSet, deleteQuestionSet, updateQuestionSet, slugify } from "@/actions/question-sets.actions"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type School = { id: string; name: string; abbreviation: string }
type SetRow = {
  id: string; title: string; slug: string; emoji: string; is_published: boolean
  school: { name: string; abbreviation: string } | null
  question_set_questions: { count: number }[]
}

const EMOJIS = ["📚", "🎯", "🧠", "⚡", "🔥", "🌟", "📝", "🏆", "🎓", "💡"]

export function SetsAdminClient({ sets, schools }: { sets: SetRow[]; schools: School[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: "", slug: "", description: "", emoji: "📚", schoolId: "" })

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: slugify(title) }))
  }

  function handleCreate() {
    if (!form.title.trim() || !form.slug.trim()) { toast.error("Title and slug required"); return }
    startTransition(async () => {
      const res = await createQuestionSet({ ...form, schoolId: form.schoolId || null })
      if (res.error) { toast.error(res.error); return }
      toast.success("Set created")
      router.push(`/admin/sets/${res.id}`)
    })
  }

  function handleTogglePublish(set: SetRow) {
    startTransition(async () => {
      await updateQuestionSet(set.id, { isPublished: !set.is_published })
      toast.success(set.is_published ? "Unpublished" : "Published")
    })
  }

  function handleDelete(set: SetRow) {
    if (!confirm(`Delete "${set.title}"? This also removes all its questions from the set.`)) return
    startTransition(async () => {
      await deleteQuestionSet(set.id)
      toast.success("Set deleted")
    })
  }

  return (
    <div className="space-y-5">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New Set
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-2xl border bg-background p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <h2 className="font-bold">Create new set</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Title *</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="UNILAG General Knowledge"
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Slug (URL) *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="unilag-general-knowledge"
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What students will practice in this set…"
                rows={2}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">School (leave blank for all)</label>
              <select
                value={form.schoolId}
                onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All schools</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-all",
                      form.emoji === e ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Create Set
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sets list */}
      {sets.length === 0 && !creating ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">No sets yet</p>
          <p className="text-sm text-muted-foreground">Create your first curated question set above.</p>
        </div>
      ) : (
        <div className="divide-y rounded-2xl border bg-background overflow-hidden">
          {sets.map((set) => {
            const count = set.question_set_questions?.[0]?.count ?? 0
            return (
              <div key={set.id} className="flex items-center gap-3 px-5 py-4">
                <span className="text-2xl shrink-0">{set.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold truncate">{set.title}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      set.is_published
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {set.is_published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {count} question{count !== 1 ? "s" : ""} · /{set.slug}
                    {set.school && ` · ${set.school.abbreviation}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/admin/sets/${set.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                    title="Manage"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(set)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                    title={set.is_published ? "Unpublish" : "Publish"}
                  >
                    {set.is_published
                      ? <EyeOff className="h-3.5 w-3.5" />
                      : <Eye className="h-3.5 w-3.5" />
                    }
                  </button>
                  {set.is_published && (
                    <Link
                      href={`/sets/${set.slug}`}
                      target="_blank"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                      title="View live"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(set)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors dark:hover:bg-red-950/20"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
