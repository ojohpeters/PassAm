"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCustomQuiz } from "@/actions/custom-quiz.actions"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export default function NewQuizPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError("")
    const result = await createCustomQuiz(title.trim(), description.trim() || undefined)
    setLoading(false)
    if (result.success) {
      router.push(`/admin/quizzes/${result.data.quizId}`)
    } else {
      setError("Failed to create quiz. Please try again.")
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
      <div>
        <Link href="/admin/quizzes" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          ← Quizzes
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight">New Quiz</h1>
        <p className="text-sm text-muted-foreground">Give your quiz a title, then add questions on the next screen.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-background p-5 space-y-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-bold">Quiz Details</h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. UNILAG 2024 Chemistry Revision"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-1"
            required
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description <span className="font-normal normal-case">(optional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this quiz about? Who should take it?"
            rows={3}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-1 resize-none"
            maxLength={300}
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Quiz & Add Questions →"}
        </button>
      </form>
    </div>
  )
}
