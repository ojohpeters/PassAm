"use client"

import { useState, useTransition } from "react"
import {
  addBankQuestionToQuiz,
  addCustomQuestionToQuiz,
  removeQuizItem,
  moveQuizItem,
  toggleQuizActive,
  deleteQuiz,
  searchBankQuestions,
  updateQuizMeta,
} from "@/actions/custom-quiz.actions"
import { useRouter } from "next/navigation"
import { BookOpen, Link2, Copy, Check, ChevronUp, ChevronDown, Trash2, Plus, Search, ToggleLeft, ToggleRight, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"

type QuizItem = {
  id: string; order_index: number; source: string; bank_question_id: string | null
  q_text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string
  correct: string; explanation: string | null; subject_label: string | null
}
type School = { id: string; name: string; abbreviation: string }
type Subject = { id: string; name: string }

interface Props {
  quiz: { id: string; title: string; description: string | null; code: string; is_active: boolean }
  initialItems: QuizItem[]
  attemptCount: number
  schools: School[]
  subjects: Subject[]
}

export function QuizManagerClient({ quiz, initialItems, attemptCount, schools, subjects }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [items, setItems] = useState(initialItems)
  const [isActive, setIsActive] = useState(quiz.is_active)
  const [tab, setTab] = useState<"bank" | "custom">("bank")
  const [copied, setCopied] = useState(false)

  // Bank picker state
  const [bankSchool, setBankSchool] = useState("")
  const [bankSubject, setBankSubject] = useState("")
  const [bankQuery, setBankQuery] = useState("")
  const [bankResults, setBankResults] = useState<{ id: string; text: string; subject: { id: string; name: string } | null; school: { id: string; abbreviation: string } | null }[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankSearched, setBankSearched] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  // Custom question state
  const [cText, setCText] = useState("")
  const [cOptA, setCOptA] = useState("")
  const [cOptB, setCOptB] = useState("")
  const [cOptC, setCOptC] = useState("")
  const [cOptD, setCOptD] = useState("")
  const [cCorrect, setCCorrect] = useState("A")
  const [cExplanation, setCExplanation] = useState("")
  const [cSubject, setCSubject] = useState("")
  const [cLoading, setCLoading] = useState(false)

  // Edit title state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(quiz.title)
  const [descVal, setDescVal] = useState(quiz.description ?? "")

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz/${quiz.code}` : `/quiz/${quiz.code}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleBankSearch() {
    setBankLoading(true)
    const result = await searchBankQuestions(bankSchool || undefined, bankSubject || undefined, bankQuery || undefined)
    setBankLoading(false)
    setBankSearched(true)
    if (result.success) setBankResults(result.data as typeof bankResults)
  }

  async function handleAddBank(questionId: string) {
    setAddingId(questionId)
    const result = await addBankQuestionToQuiz(quiz.id, questionId)
    setAddingId(null)
    if (result.success) router.refresh()
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault()
    if (!cText.trim() || !cOptA.trim() || !cOptB.trim() || !cOptC.trim() || !cOptD.trim()) return
    setCLoading(true)
    const result = await addCustomQuestionToQuiz(quiz.id, {
      text: cText, optA: cOptA, optB: cOptB, optC: cOptC, optD: cOptD,
      correct: cCorrect, explanation: cExplanation || undefined, subjectLabel: cSubject || undefined,
    })
    setCLoading(false)
    if (result.success) {
      setCText(""); setCOptA(""); setCOptB(""); setCOptC(""); setCOptD(""); setCExplanation(""); setCSubject("")
      router.refresh()
    }
  }

  async function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeQuizItem(itemId, quiz.id)
      router.refresh()
    })
  }

  async function handleMove(itemId: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveQuizItem(itemId, quiz.id, direction)
      router.refresh()
    })
  }

  async function handleToggleActive() {
    const next = !isActive
    setIsActive(next)
    await toggleQuizActive(quiz.id, next)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return
    await deleteQuiz(quiz.id)
    router.push("/admin/quizzes")
  }

  async function handleSaveTitle() {
    if (!titleVal.trim()) return
    await updateQuizMeta(quiz.id, titleVal.trim(), descVal.trim() || undefined)
    setEditingTitle(false)
    router.refresh()
  }

  const currentIds = new Set(items.filter(i => i.bank_question_id).map(i => i.bank_question_id!))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          {editingTitle ? (
            <div className="space-y-2">
              <input
                value={titleVal}
                onChange={e => setTitleVal(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-lg font-black outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                value={descVal}
                onChange={e => setDescVal(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveTitle} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Save</button>
                <button onClick={() => setEditingTitle(false)} className="rounded-lg border px-3 py-1.5 text-xs font-bold"><X className="h-3 w-3" /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div>
                <h1 className="text-2xl font-black tracking-tight">{quiz.title}</h1>
                {quiz.description && <p className="mt-0.5 text-sm text-muted-foreground">{quiz.description}</p>}
              </div>
              <button onClick={() => setEditingTitle(true)} className="mt-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleActive}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors",
              isActive
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {isActive ? "Active" : "Paused"}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Share link */}
      <div className="rounded-2xl border bg-background p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold">Share Link</p>
          <span className="ml-auto text-xs text-muted-foreground">{attemptCount} completion{attemptCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-xl border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground truncate">{shareUrl}</code>
          <button
            onClick={copyLink}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors",
              copied
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Current questions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-bold">{items.length} Question{items.length !== 1 ? "s" : ""}</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">No questions yet — add some below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.sort((a, b) => a.order_index - b.order_index).map((item, idx) => (
              <div key={item.id} className="flex gap-3 rounded-xl border bg-background px-4 py-3">
                <div className="flex flex-col gap-1">
                  <button disabled={idx === 0 || isPending} onClick={() => handleMove(item.id, "up")} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button disabled={idx === items.length - 1 || isPending} onClick={() => handleMove(item.id, "down")} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{idx + 1}. {item.q_text}</p>
                    <button disabled={isPending} onClick={() => handleRemove(item.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.subject_label && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{item.subject_label}</span>}
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", item.source === "bank" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")}>
                      {item.source === "bank" ? "From Bank" : "Custom"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Answer: <strong className="text-foreground">{item.correct}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add questions */}
      <div className="rounded-2xl border bg-background">
        <div className="flex border-b">
          {(["bank", "custom"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-bold transition-colors",
                tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "bank" ? "Add from Bank" : "Add Custom Question"}
            </button>
          ))}
        </div>

        {tab === "bank" && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <select
                value={bankSchool}
                onChange={e => setBankSchool(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Schools</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.abbreviation}</option>)}
              </select>
              <select
                value={bankSubject}
                onChange={e => setBankSubject(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="relative col-span-2 sm:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={bankQuery}
                  onChange={e => setBankQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleBankSearch()}
                  placeholder="Search question text…"
                  className="w-full rounded-xl border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <button
              onClick={handleBankSearch}
              disabled={bankLoading}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {bankLoading ? "Searching…" : "Search"}
            </button>

            {bankSearched && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bankResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No questions found</p>
                ) : (
                  bankResults.map((q) => {
                    const alreadyAdded = currentIds.has(q.id)
                    return (
                      <div key={q.id} className="flex items-start gap-3 rounded-xl border px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug line-clamp-2">{q.text}</p>
                          <div className="mt-1 flex gap-2">
                            {q.subject && <span className="text-[10px] text-muted-foreground">{q.subject.name}</span>}
                            {q.school && <span className="text-[10px] font-bold text-primary/70">{q.school.abbreviation}</span>}
                          </div>
                        </div>
                        <button
                          disabled={alreadyAdded || addingId === q.id}
                          onClick={() => handleAddBank(q.id)}
                          className={cn(
                            "shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                            alreadyAdded
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                        >
                          {alreadyAdded ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          {alreadyAdded ? "Added" : addingId === q.id ? "Adding…" : "Add"}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}

        {tab === "custom" && (
          <form onSubmit={handleAddCustom} className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Question Text *</label>
              <textarea
                value={cText}
                onChange={e => setCText(e.target.value)}
                rows={3}
                placeholder="Enter the question…"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["A", "B", "C", "D"] as const).map(letter => {
                const val = letter === "A" ? cOptA : letter === "B" ? cOptB : letter === "C" ? cOptC : cOptD
                const setter = letter === "A" ? setCOptA : letter === "B" ? setCOptB : letter === "C" ? setCOptC : setCOptD
                return (
                  <div key={letter} className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Option {letter} *</label>
                    <input
                      type="text"
                      value={val}
                      onChange={e => setter(e.target.value)}
                      placeholder={`Option ${letter}`}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Correct Answer *</label>
                <select
                  value={cCorrect}
                  onChange={e => setCCorrect(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject Label</label>
                <input
                  type="text"
                  value={cSubject}
                  onChange={e => setCSubject(e.target.value)}
                  placeholder="e.g. Chemistry"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Explanation <span className="font-normal normal-case">(optional)</span></label>
              <textarea
                value={cExplanation}
                onChange={e => setCExplanation(e.target.value)}
                rows={2}
                placeholder="Why is this the correct answer?"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={cLoading}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {cLoading ? "Adding…" : "Add Question"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
