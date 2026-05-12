"use client"

import { useState, useTransition } from "react"
import { createTip, updateTip, deleteTip, toggleTipPublished, toggleTipPinned } from "@/actions/tips.actions"
import { toast } from "sonner"
import { Plus, Loader2, Trash2, Pencil, Pin, Eye, EyeOff, X, Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { StudyTip } from "@/types/database"

const TYPES = [
  { value: "TIP",   label: "📚 Study Tip" },
  { value: "TRICK", label: "🧪 Subject Trick" },
  { value: "EXAM",  label: "⚡ Exam Trick" },
]

const TYPE_COLORS: Record<string, string> = {
  TIP:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  TRICK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  EXAM:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
}
const TYPE_EMOJI: Record<string, string> = { TIP: "📚", TRICK: "🧪", EXAM: "⚡" }

const SUGGESTED_CATEGORIES = [
  "General", "English Language", "Mathematics", "Biology", "Chemistry",
  "Physics", "Government", "Economics", "Literature", "Exam Strategy",
]

type FormState = {
  title: string
  content: string
  image_url: string
  category: string
  type: string
}

const EMPTY: FormState = { title: "", content: "", image_url: "", category: "General", type: "TIP" }

function TipForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: FormState
  onSave: (data: FormState) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY)

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-background p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title <span className="text-rose-500">*</span></label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. How to tackle Reading Comprehension in 5 minutes"
            maxLength={200}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 focus:border-primary focus:ring-2 placeholder:text-muted-foreground placeholder:font-normal"
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 focus:border-primary focus:ring-2"
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
          <input
            list="categories"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 focus:border-primary focus:ring-2 placeholder:font-normal placeholder:text-muted-foreground"
          />
          <datalist id="categories">
            {SUGGESTED_CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* Content */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content <span className="text-rose-500">*</span></label>
          <textarea
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            placeholder="Write the tip here. You can use line breaks for steps."
            maxLength={3000}
            rows={5}
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-primary/40 focus:border-primary focus:ring-2 placeholder:text-muted-foreground"
          />
          <p className="text-right text-[10px] text-muted-foreground">{form.content.length}/3000</p>
        </div>

        {/* Image URL */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image / Resource Link <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            placeholder="https://pinterest.com/pin/... or any image URL"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 focus:border-primary focus:ring-2 placeholder:font-normal placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Paste a Pinterest link, direct image URL, or any resource link.</p>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={isPending || !form.title.trim() || !form.content.trim()}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isPending ? "Saving…" : "Save Tip"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  )
}

export function TipsAdminClient({ tips }: { tips: StudyTip[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  function handleCreate(data: FormState) {
    startTransition(async () => {
      const result = await createTip({
        title: data.title,
        content: data.content,
        image_url: data.image_url || undefined,
        category: data.category,
        type: data.type,
      })
      if (result.success) {
        toast.success("Tip created — publish it when ready")
        setShowForm(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleEdit(id: string, data: FormState) {
    startTransition(async () => {
      const result = await updateTip(id, {
        title: data.title,
        content: data.content,
        image_url: data.image_url || undefined,
        category: data.category,
        type: data.type,
      })
      if (result.success) {
        toast.success("Tip updated")
        setEditId(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleTogglePublish(id: string, current: boolean) {
    startTransition(async () => {
      await toggleTipPublished(id, current)
      toast.success(current ? "Tip unpublished" : "Tip published — students can now see it")
      router.refresh()
    })
  }

  function handleTogglePin(id: string, current: boolean) {
    startTransition(async () => {
      await toggleTipPinned(id, current)
      toast.success(current ? "Tip unpinned" : "Tip pinned to top")
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this tip permanently?")) return
    startTransition(async () => {
      await deleteTip(id)
      toast.success("Tip deleted")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Add new tip */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> New Tip
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">New Tip</p>
          <TipForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            isPending={isPending}
          />
        </div>
      )}

      {/* Tips list */}
      {tips.length === 0 ? (
        <div className="rounded-2xl border bg-background py-16 text-center text-muted-foreground">
          <p className="text-4xl mb-3">✍️</p>
          <p className="font-semibold">No tips yet</p>
          <p className="text-sm mt-1">Create your first tip above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip) => (
            <div key={tip.id}>
              {editId === tip.id ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Editing tip</p>
                  <TipForm
                    initial={{ title: tip.title, content: tip.content, image_url: tip.image_url ?? "", category: tip.category, type: tip.type }}
                    onSave={(data) => handleEdit(tip.id, data)}
                    onCancel={() => setEditId(null)}
                    isPending={isPending}
                  />
                </div>
              ) : (
                <div className={cn("rounded-2xl border bg-background p-4 space-y-3", !tip.is_published && "opacity-70")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", TYPE_COLORS[tip.type] ?? TYPE_COLORS.TIP)}>
                          {TYPE_EMOJI[tip.type]} {TYPES.find(t => t.value === tip.type)?.label.split(" ").slice(1).join(" ")}
                        </span>
                        <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tip.category}</span>
                        {tip.pinned && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">📌 Pinned</span>}
                        {!tip.is_published && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Draft</span>}
                      </div>
                      <p className="font-bold text-sm leading-snug">{tip.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tip.content}</p>
                      {tip.image_url && (
                        <a href={tip.image_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary underline underline-offset-2 truncate max-w-xs">
                          🔗 {tip.image_url}
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePin(tip.id, tip.pinned)}
                        title={tip.pinned ? "Unpin" : "Pin to top"}
                        className={cn("rounded-lg p-2 transition-colors", tip.pinned ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:bg-muted")}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleTogglePublish(tip.id, tip.is_published)}
                        title={tip.is_published ? "Unpublish" : "Publish"}
                        className={cn("rounded-lg p-2 transition-colors", tip.is_published ? "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-950/40" : "text-muted-foreground hover:bg-muted")}
                      >
                        {tip.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditId(tip.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tip.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
