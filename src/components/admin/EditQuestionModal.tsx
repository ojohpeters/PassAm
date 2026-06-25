"use client"

import { useState, useEffect } from "react"
import { getQuestion, updateQuestion } from "@/actions/admin.actions"
import { toast } from "sonner"
import { X, Loader2 } from "lucide-react"

type School  = { id: string; name: string }
type Subject = { id: string; name: string }

type Props = {
  questionId: string
  schools: School[]
  subjects: Subject[]
  onClose: () => void
  onSaved: () => void
}

export function EditQuestionModal({ questionId, schools, subjects, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [text, setText]               = useState("")
  const [explanation, setExplanation] = useState("")
  const [year, setYear]               = useState("")
  const [schoolId, setSchoolId]       = useState("")
  const [subjectId, setSubjectId]     = useState("")
  const [opts, setOpts]               = useState<Record<"A"|"B"|"C"|"D", string>>({ A: "", B: "", C: "", D: "" })
  const [correct, setCorrect]         = useState<"A"|"B"|"C"|"D">("A")

  useEffect(() => {
    getQuestion(questionId).then((q) => {
      if (!q) { toast.error("Question not found"); onClose(); return }
      setText(q.text ?? "")
      setExplanation(q.explanation ?? "")
      setYear(q.year ? String(q.year) : "")
      setSchoolId(q.school_id ?? "")
      setSubjectId(q.subject_id ?? "")
      const optMap: Record<string, string> = {}
      let correctLabel: "A"|"B"|"C"|"D" = "A"
      for (const o of (q.options ?? []) as { label: string; text: string; is_correct: boolean }[]) {
        optMap[o.label] = o.text
        if (o.is_correct) correctLabel = o.label as "A"|"B"|"C"|"D"
      }
      setOpts({ A: optMap.A ?? "", B: optMap.B ?? "", C: optMap.C ?? "", D: optMap.D ?? "" })
      setCorrect(correctLabel)
      setLoading(false)
    })
  }, [questionId]) // eslint-disable-line

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !schoolId || !subjectId) { toast.error("Fill in all required fields"); return }
    const labels = ["A","B","C","D"] as const
    if (labels.some(l => !opts[l].trim())) { toast.error("All four options are required"); return }

    setSaving(true)
    const result = await updateQuestion(questionId, {
      text: text.trim(),
      explanation: explanation.trim() || undefined,
      year: year ? Number(year) : undefined,
      schoolId,
      subjectId,
      options: labels.map(l => ({ label: l, text: opts[l].trim(), isCorrect: l === correct })),
    })
    setSaving(false)

    if (!result.success) { toast.error("Failed to save — please try again."); return }
    toast.success("Question updated.")
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="relative mx-auto my-6 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-black">Edit Question</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 p-5">
            {/* School + Subject */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">School *</label>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  required
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select school…</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Subject *</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Year */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Year (optional)</label>
              <input
                type="number"
                min={1990}
                max={2030}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. 2023"
              />
            </div>

            {/* Question text */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Question text *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={3}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Options — click letter to mark correct</label>
              {(["A","B","C","D"] as const).map((l) => (
                <div key={l} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCorrect(l)}
                    className={`h-8 w-8 shrink-0 rounded-full border-2 text-xs font-black transition-colors ${
                      correct === l
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground/40 text-muted-foreground hover:border-green-400"
                    }`}
                  >
                    {l}
                  </button>
                  <input
                    value={opts[l]}
                    onChange={(e) => setOpts(prev => ({ ...prev, [l]: e.target.value }))}
                    required
                    className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={`Option ${l}`}
                  />
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Explanation (optional)</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Shown to students after they submit…"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border py-2.5 text-sm font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
