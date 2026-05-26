"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Trash2, Search, Upload, Bot, Database, ChevronRight,
  Download, AlertCircle, CheckCircle2, Key, ExternalLink,
  Send, RefreshCcw, Loader2, BookPlus, ClipboardCopy, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getUserQuestions,
  bulkAddUserQuestions,
  deleteUserQuestion,
  saveGroqApiKey,
  chatWithGroqAI,
  type UserQuestion as Question,
} from "@/actions/user-questions.actions"

type ParsedRow = {
  valid: boolean
  error?: string
  q_text: string
  opt_a: string; opt_b: string; opt_c: string; opt_d: string
  correct: string
  explanation?: string
  subject_label?: string
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  csvRows?: ParsedRow[]
}

const OPTION_KEYS = ["opt_a", "opt_b", "opt_c", "opt_d"] as const
const OPTION_LABELS = ["A", "B", "C", "D"] as const

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

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
      result.push(current.trim()); current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseAndValidateCsv(text: string): ParsedRow[] {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const cols = parseCsvLine(line)
      const lineNum = i + 1
      if (cols.length < 6) return { valid: false, error: `Row ${lineNum}: needs at least 6 columns`, q_text: line, opt_a: "", opt_b: "", opt_c: "", opt_d: "", correct: "" }
      const [q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label] = cols
      if (!q_text) return { valid: false, error: `Row ${lineNum}: question text is empty`, q_text: "", opt_a: "", opt_b: "", opt_c: "", opt_d: "", correct: "" }
      if (!opt_a || !opt_b || !opt_c || !opt_d) return { valid: false, error: `Row ${lineNum}: all 4 options are required`, q_text, opt_a: opt_a ?? "", opt_b: opt_b ?? "", opt_c: opt_c ?? "", opt_d: opt_d ?? "", correct: "" }
      const correctUp = (correct ?? "").trim().toUpperCase()
      if (!["A", "B", "C", "D"].includes(correctUp)) return { valid: false, error: `Row ${lineNum}: correct must be A, B, C, or D (got "${correct}")`, q_text, opt_a, opt_b, opt_c, opt_d, correct: "" }
      return { valid: true, q_text, opt_a, opt_b, opt_c, opt_d, correct: correctUp, explanation: explanation || undefined, subject_label: subject_label || undefined }
    })
}

function extractCsvBlock(content: string): string | null {
  const match = content.match(/```csv\n([\s\S]*?)```/)
  return match ? match[1].trim() : null
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  initialQuestions: Question[]
  initialApiKey: string | null
}

export function MyQuestionsClient({ initialQuestions, initialApiKey }: Props) {
  const [tab, setTab] = useState<"questions" | "upload" | "ai">("questions")

  // Questions tab
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Upload tab
  const [csvText, setCsvText] = useState("")
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // AI tab
  const [apiKey, setApiKey] = useState(initialApiKey ?? "")
  const [savedKey, setSavedKey] = useState(initialApiKey ?? "")
  const [savingKey, setSavingKey] = useState(false)
  const [keyMsg, setKeyMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showKeyPanel, setShowKeyPanel] = useState(!initialApiKey)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hi! I'm PrepAI, your study assistant built for PrepIQ by Ojochegbe.\n\nI can explain any concept, help you practice, and generate questions for your personal bank.\n\nTry: *\"Explain Newton's laws\"* or *\"Generate 5 Chemistry questions about atomic structure\"*"
  }])
  const [aiInput, setAiInput] = useState("")
  const [sending, setSending] = useState(false)
  const [importingAiId, setImportingAiId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Questions tab helpers ────────────────────────────────────────────────────

  const filteredQuestions = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return questions
    return questions.filter(
      x => x.q_text.toLowerCase().includes(q) || (x.subject_label ?? "").toLowerCase().includes(q)
    )
  }, [questions, search])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await deleteUserQuestion(id)
    if (res.success) setQuestions(prev => prev.filter(q => q.id !== id))
    setDeletingId(null)
  }

  async function refetchQuestions() {
    const res = await getUserQuestions()
    if (res.success) setQuestions(res.data as Question[])
  }

  // ── Upload tab helpers ───────────────────────────────────────────────────────

  function handlePreview() {
    if (!csvText.trim()) return
    setPreview(parseAndValidateCsv(csvText))
    setImportMsg(null)
  }

  async function handleImport() {
    if (!preview) return
    const valid = preview.filter(r => r.valid)
    if (!valid.length) return
    setImporting(true)
    const res = await bulkAddUserQuestions(valid)
    if (res.success) {
      setImportMsg({ ok: true, text: `${res.count} question${res.count !== 1 ? "s" : ""} added to your bank.` })
      setCsvText("")
      setPreview(null)
      await refetchQuestions()
    } else {
      setImportMsg({ ok: false, text: res.error ?? "Import failed." })
    }
    setImporting(false)
  }

  function downloadExample() {
    const csv = [
      `What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Golgi body,B,Mitochondria generates ATP via cellular respiration.,Biology`,
      `What is the chemical formula for water?,H2O2,CO2,H2O,NaCl,C,Water is two hydrogen atoms bonded to one oxygen atom.,Chemistry`,
      `Who wrote Things Fall Apart?,Wole Soyinka,Chinua Achebe,Ngugi wa Thiong'o,Ben Okri,B,Chinua Achebe published this novel in 1958.,Literature`,
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "prepiq_example_questions.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  // ── AI tab helpers ───────────────────────────────────────────────────────────

  async function handleSaveKey() {
    setSavingKey(true); setKeyMsg(null)
    const res = await saveGroqApiKey(apiKey)
    if (res.success) {
      setSavedKey(apiKey)
      setKeyMsg({ ok: true, text: "API key saved." })
      if (apiKey.trim()) setShowKeyPanel(false)
    } else {
      setKeyMsg({ ok: false, text: res.error ?? "Failed to save key." })
    }
    setSavingKey(false)
  }

  async function handleSend() {
    const text = aiInput.trim()
    if (!text || sending) return

    if (!savedKey.trim()) {
      setShowKeyPanel(true)
      setKeyMsg({ ok: false, text: "Add your Groq API key first." })
      return
    }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text }
    const history = [...messages, userMsg].filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setAiInput("")
    setSending(true)

    const res = await chatWithGroqAI(history, savedKey)

    if (!res.success) {
      const errMap: Record<string, string> = {
        expired: "Your Groq API key has expired or is invalid. Please update it below.",
        rate_limit: "Rate limit reached. Please wait a moment and try again.",
        no_key: "Please add your Groq API key first.",
        network: "Network error. Please check your connection.",
        api_error: "Groq API returned an error. Please try again.",
      }
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(), role: "assistant",
        content: `⚠️ ${errMap[res.error] ?? "Something went wrong. Please try again."}`
      }
      if (res.error === "expired") { setSavedKey(""); setShowKeyPanel(true) }
      setMessages(prev => [...prev, errMsg])
    } else {
      const csvBlock = extractCsvBlock(res.content)
      const csvRows = csvBlock ? parseAndValidateCsv(csvBlock) : undefined
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(), role: "assistant",
        content: res.content,
        csvRows: csvRows?.some(r => r.valid) ? csvRows : undefined,
      }
      setMessages(prev => [...prev, aiMsg])
    }
    setSending(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function handleImportFromAi(msgId: string, rows: ParsedRow[]) {
    const valid = rows.filter(r => r.valid)
    if (!valid.length) return
    setImportingAiId(msgId)
    const res = await bulkAddUserQuestions(valid)
    if (res.success) {
      await refetchQuestions()
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, csvRows: undefined } : m))
    }
    setImportingAiId(null)
  }

  function renderMessageContent(content: string) {
    // Convert *bold* and strip csv blocks for display (they're shown as import button)
    const withoutCsv = content.replace(/```csv\n[\s\S]*?```/g, "[CSV questions ready to import]")
    return withoutCsv.split("\n").map((line, i) => {
      const parts = line.split(/(\*[^*]+\*)/)
      return (
        <p key={i} className={cn("leading-relaxed", i > 0 && "mt-1")}>
          {parts.map((p, j) =>
            p.startsWith("*") && p.endsWith("*")
              ? <strong key={j}>{p.slice(1, -1)}</strong>
              : p
          )}
        </p>
      )
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const validPreview = preview?.filter(r => r.valid) ?? []
  const invalidPreview = preview?.filter(r => !r.valid) ?? []

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-muted p-1">
        {([
          { key: "questions" as const, label: "My Questions", icon: Database, badge: questions.length || null },
          { key: "upload"    as const, label: "Upload CSV",   icon: Upload,   badge: null },
          { key: "ai"        as const, label: "PrepAI",       icon: Bot,      badge: null },
        ]).map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {badge ? <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-black text-primary">{badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ── My Questions Tab ──────────────────────────────────────────────────── */}
      {tab === "questions" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your questions..."
              className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-12 text-center">
              <BookPlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-bold text-muted-foreground">
                {search ? "No matching questions" : "Your bank is empty"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? "Try a different search." : "Use the Upload CSV or PrepAI tab to add questions."}
              </p>
              {!search && (
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => setTab("upload")}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
                  >
                    Upload CSV
                  </button>
                  <button
                    onClick={() => setTab("ai")}
                    className="rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted"
                  >
                    Ask PrepAI
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">{filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}</p>
              {filteredQuestions.map(q => (
                <div key={q.id} className="rounded-2xl border bg-background p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {q.subject_label && (
                        <span className="mb-1.5 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {q.subject_label}
                        </span>
                      )}
                      <p className="text-sm font-semibold leading-snug">{q.q_text}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={deletingId === q.id}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/30"
                    >
                      {deletingId === q.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {OPTION_KEYS.map((key, i) => {
                      const isCorrect = q.correct === OPTION_LABELS[i]
                      return (
                        <div key={key} className={cn(
                          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
                          isCorrect ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/40"
                        )}>
                          <span className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black",
                            isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {OPTION_LABELS[i]}
                          </span>
                          <span className={cn("truncate", isCorrect ? "font-semibold text-emerald-800 dark:text-emerald-300" : "text-muted-foreground")}>
                            {q[key]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5">{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Upload CSV Tab ────────────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
            <p className="text-sm font-bold">CSV Format</p>
            <p className="text-xs text-muted-foreground">
              Each row is one question with <strong>8 columns</strong> separated by commas.
              Fields containing commas must be wrapped in double quotes.
            </p>
            <div className="overflow-x-auto rounded-xl border bg-background">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {["#", "Column", "Required", "Example"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["1", "Question text", "✓", "What is the powerhouse of the cell?"],
                    ["2", "Option A", "✓", "Nucleus"],
                    ["3", "Option B", "✓", "Mitochondria"],
                    ["4", "Option C", "✓", "Ribosome"],
                    ["5", "Option D", "✓", "Golgi body"],
                    ["6", "Correct (A/B/C/D)", "✓", "B"],
                    ["7", "Explanation", "—", "Mitochondria generates ATP."],
                    ["8", "Subject label", "—", "Biology"],
                  ].map(([num, col, req, ex]) => (
                    <tr key={num} className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{num}</td>
                      <td className="px-3 py-1.5 font-semibold">{col}</td>
                      <td className="px-3 py-1.5 text-center">{req}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5">
              <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> Switch to the PrepAI tab and ask it to generate questions. It will produce CSV you can import directly.
              </p>
            </div>
            <button
              onClick={downloadExample}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Example CSV
            </button>
          </div>

          {/* Paste area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Paste CSV here</label>
            <textarea
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setPreview(null); setImportMsg(null) }}
              rows={8}
              placeholder={"What is H2O?, Hydrogen, Water, Acid, Salt, B, Water has two H and one O., Chemistry\n..."}
              className="w-full rounded-2xl border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              disabled={!csvText.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Preview
            </button>
            {csvText.trim() && (
              <button
                onClick={() => { setCsvText(""); setPreview(null); setImportMsg(null) }}
                className="rounded-xl border px-4 py-2.5 text-xs font-bold hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>

          {/* Import success/error */}
          {importMsg && (
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold",
              importMsg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
            )}>
              {importMsg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {importMsg.text}
            </div>
          )}

          {/* Preview results */}
          {preview && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preview</p>
                {validPreview.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {validPreview.length} valid
                  </span>
                )}
                {invalidPreview.length > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                    {invalidPreview.length} invalid
                  </span>
                )}
              </div>

              <div className="rounded-2xl border overflow-hidden divide-y">
                {preview.map((row, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-3 px-4 py-2.5",
                    row.valid ? "bg-emerald-50/50 dark:bg-emerald-950/10" : "bg-rose-50/50 dark:bg-rose-950/10"
                  )}>
                    {row.valid
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      : <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      {row.valid
                        ? <p className="text-xs truncate">{row.q_text} {row.subject_label && <span className="text-muted-foreground">· {row.subject_label}</span>}</p>
                        : <p className="text-xs text-rose-600 dark:text-rose-400">{row.error}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {validPreview.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Import {validPreview.length} question{validPreview.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PrepAI Tab ────────────────────────────────────────────────────────── */}
      {tab === "ai" && (
        <div className="space-y-3">
          {/* API Key Panel */}
          <div className="rounded-2xl border bg-muted/20 overflow-hidden">
            <button
              onClick={() => setShowKeyPanel(v => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Groq API Key</span>
                {savedKey
                  ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Saved</span>
                  : <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Not set</span>}
              </div>
              <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showKeyPanel && "rotate-90")} />
            </button>

            {showKeyPanel && (
              <div className="border-t px-4 pb-4 pt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  PrepAI is powered by Groq. Each user uses their own free API key — your key is stored securely and only used on our server to call Groq on your behalf.
                </p>

                <div className="rounded-xl border bg-background/60 p-3 space-y-2 text-xs">
                  <p className="font-bold">How to get your free Groq API key:</p>
                  <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                    <li>Visit <strong>console.groq.com</strong> and sign up (free)</li>
                    <li>Go to <strong>API Keys</strong> in the left sidebar</li>
                    <li>Click <strong>Create API Key</strong> and copy it</li>
                    <li>Paste it below and save</li>
                  </ol>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    Open console.groq.com/keys <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={savingKey}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {savingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                  </button>
                </div>

                {keyMsg && (
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    keyMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}>
                    {keyMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {keyMsg.text}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  If PrepAI stops responding, your key may have expired. Return here to update it.
                </p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="rounded-2xl border bg-background overflow-hidden">
            {/* Header */}
            <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black">PrepAI</p>
                  <p className="text-[10px] text-muted-foreground">Built for PrepIQ by Ojochegbe</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[380px] overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] space-y-2"
                  )}>
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    )}>
                      {renderMessageContent(msg.content)}
                    </div>

                    {msg.csvRows && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleImportFromAi(msg.id, msg.csvRows!)}
                          disabled={importingAiId === msg.id}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                        >
                          {importingAiId === msg.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <BookPlus className="h-3.5 w-3.5" />}
                          Import {msg.csvRows.filter(r => r.valid).length} questions to My Bank
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-muted/20 p-3 flex gap-2">
              <textarea
                ref={inputRef}
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={savedKey ? "Ask PrepAI anything... (Enter to send)" : "Save your API key above to start chatting"}
                disabled={sending || !savedKey}
                rows={1}
                className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={sending || !aiInput.trim() || !savedKey}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity self-end"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!savedKey && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs dark:border-amber-800/40 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-amber-700 dark:text-amber-400">
                Add your free Groq API key above to unlock PrepAI. No subscription needed.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
