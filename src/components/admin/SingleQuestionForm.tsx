"use client"

import { useState } from "react"
import { createQuestion } from "@/actions/admin.actions"
import { toast } from "sonner"

type School = { id: string; name: string }
type Subject = { id: string; name: string }

export function SingleQuestionForm({ schools, subjects }: { schools: School[]; subjects: Subject[] }) {
  const [loading, setLoading] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState<"A" | "B" | "C" | "D">("A")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    const data = {
      text: fd.get("text") as string,
      explanation: (fd.get("explanation") as string) || undefined,
      year: fd.get("year") ? Number(fd.get("year")) : undefined,
      schoolId: fd.get("schoolId") as string,
      subjectId: fd.get("subjectId") as string,
      options: (["A", "B", "C", "D"] as const).map((label) => ({
        label,
        text: fd.get(`opt${label}`) as string,
        isCorrect: label === correctAnswer,
      })),
    }

    const result = await createQuestion(data)
    if (result.success) {
      toast.success("Question created successfully.")
      ;(e.target as HTMLFormElement).reset()
      setCorrectAnswer("A")
    } else {
      toast.error("Failed to create question. Check all fields.")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">School</label>
          <select name="schoolId" required className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Select school…</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Subject</label>
          <select name="subjectId" required className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Select subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Year (optional)</label>
        <input name="year" type="number" min={1990} max={2030} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. 2023" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Question text</label>
        <textarea name="text" required rows={3} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Enter the question…" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Options — select the correct answer</label>
        {(["A", "B", "C", "D"] as const).map((label) => (
          <div key={label} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCorrectAnswer(label)}
              className={`h-7 w-7 shrink-0 rounded-full border-2 text-xs font-bold transition-colors ${
                correctAnswer === label
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {label}
            </button>
            <input
              name={`opt${label}`}
              required
              className="flex-1 rounded-md border px-3 py-1.5 text-sm"
              placeholder={`Option ${label}`}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Click the letter to mark it as correct.</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Explanation (optional)</label>
        <textarea name="explanation" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Shown to students after submission…" />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save Question"}
      </button>
    </form>
  )
}
