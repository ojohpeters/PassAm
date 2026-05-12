"use client"

import { useState, useTransition } from "react"
import { createSubject } from "@/actions/admin.actions"
import { toast } from "sonner"
import { Plus, Loader2, BookOpen, Hash } from "lucide-react"
import { useRouter } from "next/navigation"

type Subject = { id: string; name: string; questionCount: number }

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createSubject(name.trim())
      if (result.success) {
        toast.success(`Subject "${name.trim()}" created`)
        setName("")
        router.refresh()
      } else {
        toast.error(result.error === "Name required" ? "Please enter a subject name" : "Subject already exists or failed to create")
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Add subject form */}
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
            className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2 placeholder:text-muted-foreground placeholder:font-normal"
          />
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Subject
          </button>
        </form>
      </div>

      {/* Subject list */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          All Subjects ({subjects.length})
        </h2>
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-background py-16 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No subjects yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Add your first subject above</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border bg-background px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.questionCount.toLocaleString()} question{s.questionCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
