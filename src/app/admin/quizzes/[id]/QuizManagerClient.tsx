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
  updateQuizSettings,
  bulkAddCustomQuestionsToQuiz,
} from "@/actions/custom-quiz.actions"
import { useRouter } from "next/navigation"
import {
  BookOpen, Link2, Copy, Check, ChevronUp, ChevronDown, Trash2, Plus,
  Search, ToggleLeft, ToggleRight, Pencil, X, Timer, Calculator, Upload,
  AlertTriangle, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type QuizItem = {
  id: string; order_index: number; source: string; bank_question_id: string | null
  q_text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string
  correct: string; explanation: string | null; subject_label: string | null
}
type School = { id: string; name: string; abbreviation: string }
type Subject = { id: string; name: string }

interface Props {
  quiz: {
    id: string; title: string; description: string | null; code: string
    is_active: boolean; time_limit_minutes: number | null; show_calculator: boolean
  }
  initialItems: QuizItem[]
  attemptCount: number
  schools: School[]
  subjects: Subject[]
}

// ── CSV parser ──────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

type CsvRow = {
  text: string; optA: string; optB: string; optC: string; optD: string
  correct: string; explanation: string; subjectLabel: string
  error?: string
}

function parseCsvText(raw: string): CsvRow[] {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean)
  return lines.map((line, idx) => {
    const cols = parseCsvLine(line)
    const [text = "", optA = "", optB = "", optC = "", optD = "", correct = "", explanation = "", subjectLabel = ""] = cols
    const c = correct.trim().toUpperCase()
    if (!text) return { text, optA, optB, optC, optD, correct: c, explanation, subjectLabel, error: `Row ${idx + 1}: question text is empty` }
    if (!optA || !optB || !optC || !optD) return { text, optA, optB, optC, optD, correct: c, explanation, subjectLabel, error: `Row ${idx + 1}: all 4 options required` }
    if (!["A", "B", "C", "D"].includes(c)) return { text, optA, optB, optC, optD, correct: c, explanation, subjectLabel, error: `Row ${idx + 1}: correct must be A, B, C, or D` }
    return { text, optA, optB, optC, optD, correct: c, explanation, subjectLabel }
  })
}

// ── Component ───────────────────────────────────────────────────────────────

export function QuizManagerClient({ quiz, initialItems, attemptCount, schools, subjects }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [items, setItems] = useState(initialItems)
  const [isActive, setIsActive] = useState(quiz.is_active)
  const [tab, setTab] = useState<"bank" | "custom" | "csv">("bank")
  const [copied, setCopied] = useState(false)

  // Settings state
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(quiz.time_limit_minutes)
  const [showCalculator, setShowCalculator] = useState(quiz.show_calculator)
  const [settingsSaved, setSettingsSaved] = useState(false)

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

  // CSV state
  const [csvText, setCsvText] = useState("")
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [csvParsed, setCsvParsed] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvDone, setCsvDone] = useState<number | null>(null)

  // Edit title state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(quiz.title)
  const [descVal, setDescVal] = useState(quiz.description ?? "")

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz/${quiz.code}` : `/quiz/${quiz.code}`
  const validCsvRows = csvRows.filter(r => !r.error)
  const invalidCsvRows = csvRows.filter(r => r.error)

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveSettings() {
    await updateQuizSettings(quiz.id, timeLimitMinutes, showCalculator)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
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

  function handleParseCsv() {
    if (!csvText.trim()) return
    const rows = parseCsvText(csvText)
    setCsvRows(rows)
    setCsvParsed(true)
    setCsvDone(null)
  }

  async function handleCsvImport() {
    if (validCsvRows.length === 0) return
    setCsvImporting(true)
    const result = await bulkAddCustomQuestionsToQuiz(quiz.id, validCsvRows.map(r => ({
      text: r.text, optA: r.optA, optB: r.optB, optC: r.optC, optD: r.optD,
      correct: r.correct, explanation: r.explanation || undefined, subjectLabel: r.subjectLabel || undefined,
    })))
    setCsvImporting(false)
    if (result.success) {
      setCsvDone(result.data.count)
      setCsvText("")
      setCsvRows([])
      setCsvParsed(false)
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
                <h1 className="text-2xl font-black tracking-tight">{titleVal}</h1>
                {descVal && <p className="mt-0.5 text-sm text-muted-foreground">{descVal}</p>}
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
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors shrink-0",
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

      {/* Settings */}
      <div className="rounded-2xl border bg-background p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quiz Settings</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Time limit */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Timer className="h-3.5 w-3.5" /> Time Limit
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={300}
                value={timeLimitMinutes ?? ""}
                onChange={e => setTimeLimitMinutes(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="No limit"
                className="w-28 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">minutes (0 or blank = no timer)</span>
            </div>
          </div>

          {/* Calculator */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Calculator className="h-3.5 w-3.5" /> Calculator
            </label>
            <button
              type="button"
              onClick={() => setShowCalculator(v => !v)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                showCalculator
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {showCalculator ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {showCalculator ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors",
            settingsSaved
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {settingsSaved ? <Check className="h-3.5 w-3.5" /> : null}
          {settingsSaved ? "Saved!" : "Save Settings"}
        </button>
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
            {[...items].sort((a, b) => a.order_index - b.order_index).map((item, idx) => (
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

      {/* Add questions tabs */}
      <div className="rounded-2xl border bg-background">
        <div className="flex border-b overflow-x-auto">
          {(["bank", "custom", "csv"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap",
                tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "bank" ? "Add from Bank" : t === "custom" ? "Add Custom" : "Bulk CSV Import"}
            </button>
          ))}
        </div>

        {/* Bank tab */}
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

        {/* Custom question tab */}
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
                  {["A","B","C","D"].map(l => <option key={l} value={l}>{l}</option>)}
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

        {/* CSV import tab */}
        {tab === "csv" && (
          <div className="p-4 space-y-4">
            {/* Format reference */}
            <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">CSV Format (one question per row, no header)</p>
              <code className="block text-xs font-mono text-muted-foreground bg-background rounded-lg px-3 py-2 border">
                question text, optA, optB, optC, optD, correct, explanation, subject
              </code>
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                <li>• <strong>correct</strong>: must be A, B, C, or D</li>
                <li>• <strong>explanation</strong> and <strong>subject</strong>: optional (leave blank)</li>
                <li>• Wrap text containing commas in double quotes</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Paste CSV</label>
              <textarea
                value={csvText}
                onChange={e => { setCsvText(e.target.value); setCsvParsed(false); setCsvDone(null) }}
                rows={8}
                placeholder={"What is H2O?, Oxygen, Water, Hydrogen, Carbon, B, H2O is the chemical formula for water, Chemistry\nNewton's first law is about?, Gravity, Inertia, Force, Speed, B,,Physics"}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>

            <button
              onClick={handleParseCsv}
              disabled={!csvText.trim()}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-muted disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Preview ({csvText.trim().split("\n").filter(Boolean).length} rows)
            </button>

            {csvParsed && csvRows.length > 0 && (
              <div className="space-y-3">
                {invalidCsvRows.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/40 dark:bg-rose-950/20 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> {invalidCsvRows.length} row{invalidCsvRows.length !== 1 ? "s" : ""} with errors (will be skipped)
                    </div>
                    {invalidCsvRows.map((r, i) => <p key={i} className="text-[11px] text-rose-600 dark:text-rose-400">{r.error}</p>)}
                  </div>
                )}

                {validCsvRows.length > 0 && (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <p className="text-xs font-bold">{validCsvRows.length} valid question{validCsvRows.length !== 1 ? "s" : ""} ready to import</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y">
                      {validCsvRows.map((r, i) => (
                        <div key={i} className="px-4 py-2">
                          <p className="text-xs font-semibold line-clamp-1">{i + 1}. {r.text}</p>
                          <p className="text-[11px] text-muted-foreground">Answer: {r.correct}{r.subjectLabel ? ` · ${r.subjectLabel}` : ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {csvDone !== null && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> {csvDone} question{csvDone !== 1 ? "s" : ""} imported successfully!
                  </div>
                )}

                {validCsvRows.length > 0 && (
                  <button
                    onClick={handleCsvImport}
                    disabled={csvImporting}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {csvImporting ? "Importing…" : `Import ${validCsvRows.length} Question${validCsvRows.length !== 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
