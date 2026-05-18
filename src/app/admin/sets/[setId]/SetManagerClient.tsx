"use client"

import { useState, useTransition } from "react"
import {
  createAndAddQuestion, addExistingQuestion, removeQuestionFromSet,
  updateQuestionSet, searchBankQuestions, slugify,
} from "@/actions/question-sets.actions"
import { toast } from "sonner"
import { Plus, Trash2, Search, ChevronDown, ChevronUp, Eye, EyeOff, Database } from "lucide-react"
import { cn } from "@/lib/utils"

type School  = { id: string; name: string; abbreviation: string }
type Subject = { id: string; name: string }
type SetItem = {
  id: string; in_bank: boolean
  question: { id: string; text: string; explanation: string | null; is_bank_question: boolean
    subject: { name: string }
    options: { id: string; label: string; text: string; is_correct: boolean }[]
  }
}
type SetData = {
  id: string; title: string; slug: string; emoji: string; description: string | null
  is_published: boolean; school_id: string | null
  school: { name: string; abbreviation: string } | null
  items: SetItem[]
}

const LABELS = ["A", "B", "C", "D"]
const EMPTY_FORM = { text: "", explanation: "", schoolId: "", subjectId: "", correct: "A", inBank: false }
type FormState = typeof EMPTY_FORM & { opts: string[] }

export function SetManagerClient({
  set, schools, subjects,
}: {
  set: SetData; schools: School[]; subjects: Subject[]
}) {
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<"questions" | "create" | "from-bank" | "settings">("questions")

  // Create new question form
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM, opts: ["", "", "", ""],
    schoolId: set.school_id ?? "",
    subjectId: "",
  })

  // From-bank search
  const [bankSearch, setBankSearch] = useState({ q: "", schoolId: set.school_id ?? "", subjectId: "" })
  const [bankResults, setBankResults] = useState<{ id: string; text: string; alreadyInSet: boolean; year: number | null; subject: { name: string } }[]>([])
  const [searching, setSearching] = useState(false)

  // Settings form
  const [settings, setSettings] = useState({
    title: set.title, slug: set.slug, description: set.description ?? "",
    emoji: set.emoji, schoolId: set.school_id ?? "", isPublished: set.is_published,
  })

  function handleRemove(questionId: string) {
    if (!confirm("Remove this question from the set?")) return
    startTransition(async () => {
      const res = await removeQuestionFromSet(set.id, questionId)
      if (res.error) toast.error(res.error)
      else toast.success("Removed")
    })
  }

  function handleCreate() {
    if (!form.text.trim()) { toast.error("Question text required"); return }
    if (!form.subjectId)   { toast.error("Subject required"); return }
    if (!form.schoolId)    { toast.error("School required"); return }
    if (form.opts.some((o) => !o.trim())) { toast.error("All options required"); return }

    startTransition(async () => {
      const res = await createAndAddQuestion(set.id, {
        text: form.text,
        schoolId: form.schoolId,
        subjectId: form.subjectId,
        explanation: form.explanation,
        inBank: form.inBank,
        options: LABELS.map((l, i) => ({
          label: l, text: form.opts[i], isCorrect: form.correct === l,
        })),
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Question added")
      setForm({ ...EMPTY_FORM, opts: ["", "", "", ""], schoolId: set.school_id ?? "", subjectId: "" })
      setTab("questions")
    })
  }

  function handleBankSearch() {
    setSearching(true)
    startTransition(async () => {
      const results = await searchBankQuestions({ ...bankSearch, setId: set.id })
      setBankResults(results as any)
      setSearching(false)
    })
  }

  function handleAddExisting(questionId: string) {
    startTransition(async () => {
      const res = await addExistingQuestion(set.id, questionId)
      if (res.error) { toast.error(res.error); return }
      toast.success("Added to set")
      setBankResults((prev) => prev.map((r) => r.id === questionId ? { ...r, alreadyInSet: true } : r))
    })
  }

  function handleSaveSettings() {
    startTransition(async () => {
      const res = await updateQuestionSet(set.id, {
        title: settings.title, slug: settings.slug, description: settings.description,
        emoji: settings.emoji, schoolId: settings.schoolId || null, isPublished: settings.isPublished,
      })
      if (res.error) toast.error(res.error)
      else toast.success("Settings saved")
    })
  }

  const TABS = [
    { id: "questions",  label: `Questions (${set.items.length})` },
    { id: "create",     label: "Create New" },
    { id: "from-bank",  label: "Add from Bank" },
    { id: "settings",   label: "Settings" },
  ] as const

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
              tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Questions tab ── */}
      {tab === "questions" && (
        <div className="space-y-3">
          {set.items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No questions yet — use "Create New" or "Add from Bank".
            </div>
          ) : set.items.map((item, i) => (
            <QuestionRow key={item.id} item={item} index={i} onRemove={handleRemove} />
          ))}
          <button
            onClick={() => setTab("create")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" /> Add question
          </button>
        </div>
      )}

      {/* ── Create new tab ── */}
      {tab === "create" && (
        <div className="rounded-2xl border bg-background p-5 space-y-4">
          <h2 className="font-bold">Create new question</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Question text *</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                rows={3}
                placeholder="Enter question…"
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">School *</label>
              <select
                value={form.schoolId}
                onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select school</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Subject *</label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {LABELS.map((l, i) => (
              <div key={l} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Option {l} *</label>
                <input
                  value={form.opts[i]}
                  onChange={(e) => {
                    const opts = [...form.opts]; opts[i] = e.target.value
                    setForm((f) => ({ ...f, opts }))
                  }}
                  placeholder={`Option ${l}`}
                  className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Correct answer *</label>
              <select
                value={form.correct}
                onChange={(e) => setForm((f) => ({ ...f, correct: e.target.value }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {LABELS.map((l) => <option key={l} value={l}>Option {l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Explanation (optional)</label>
              <textarea
                value={form.explanation}
                onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                rows={2}
                placeholder="Why is this the correct answer?"
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inBank}
                  onChange={(e) => setForm((f) => ({ ...f, inBank: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-primary" /> Also add to question bank
                  </span>
                  <span className="text-xs text-muted-foreground">
                    If checked, this question will also appear in drills and exams
                  </span>
                </div>
              </label>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Add to Set
          </button>
        </div>
      )}

      {/* ── Add from bank tab ── */}
      {tab === "from-bank" && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-background p-5 space-y-3">
            <h2 className="font-bold">Search bank questions</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={bankSearch.schoolId}
                onChange={(e) => setBankSearch((s) => ({ ...s, schoolId: e.target.value }))}
                className="rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">All schools</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.abbreviation}</option>)}
              </select>
              <select
                value={bankSearch.subjectId}
                onChange={(e) => setBankSearch((s) => ({ ...s, subjectId: e.target.value }))}
                className="rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  value={bankSearch.q}
                  onChange={(e) => setBankSearch((s) => ({ ...s, q: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleBankSearch()}
                  placeholder="Search text…"
                  className="flex-1 rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={handleBankSearch}
                  disabled={searching}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {bankResults.length > 0 && (
            <div className="divide-y rounded-2xl border bg-background overflow-hidden">
              {bankResults.map((q) => (
                <div key={q.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm line-clamp-2">{q.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{q.subject?.name}{q.year ? ` · ${q.year}` : ""}</p>
                  </div>
                  {q.alreadyInSet ? (
                    <span className="text-xs font-semibold text-emerald-600 shrink-0">In set ✓</span>
                  ) : (
                    <button
                      onClick={() => handleAddExisting(q.id)}
                      className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === "settings" && (
        <div className="rounded-2xl border bg-background p-5 space-y-4">
          <h2 className="font-bold">Set settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <input
                value={settings.title}
                onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value, slug: slugify(e.target.value) }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Slug</label>
              <input
                value={settings.slug}
                onChange={(e) => setSettings((s) => ({ ...s, slug: slugify(e.target.value) }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Emoji</label>
              <input
                value={settings.emoji}
                onChange={(e) => setSettings((s) => ({ ...s, emoji: e.target.value }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">School filter</label>
              <select
                value={settings.schoolId}
                onChange={(e) => setSettings((s) => ({ ...s, schoolId: e.target.value }))}
                className="w-full rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All schools</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={settings.isPublished}
              onChange={(e) => setSettings((s) => ({ ...s, isPublished: e.target.checked }))}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-semibold">
              {settings.isPublished ? <><Eye className="inline h-3.5 w-3.5 mr-1" />Published — visible to students</> : <><EyeOff className="inline h-3.5 w-3.5 mr-1" />Draft — hidden from students</>}
            </span>
          </label>
          <button
            onClick={handleSaveSettings}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  )
}

function QuestionRow({ item, index, onRemove }: { item: SetItem; index: number; onRemove: (qId: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const q = item.question

  return (
    <div className="rounded-2xl border bg-background overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="text-xs font-bold text-muted-foreground pt-0.5 w-6 shrink-0">Q{index + 1}</span>
        <p className="flex-1 text-sm leading-snug line-clamp-2">{q.text}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.in_bank && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Bank</span>
          )}
          <span className="text-xs text-muted-foreground">{q.subject?.name}</span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onRemove(q.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 py-3 space-y-1.5 bg-muted/20">
          {q.options.map((o) => (
            <div key={o.id} className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1 text-sm",
              o.is_correct && "bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/20 dark:text-emerald-400"
            )}>
              <span className="font-mono text-xs w-4">{o.label}.</span>
              <span>{o.text}</span>
              {o.is_correct && <span className="ml-auto text-xs">✓</span>}
            </div>
          ))}
          {q.explanation && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">💡 {q.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}
