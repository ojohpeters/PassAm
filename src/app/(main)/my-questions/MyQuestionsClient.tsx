"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Trash2, Search, Upload, Bot, Database, ChevronRight,
  Download, AlertCircle, CheckCircle2, Loader2, BookPlus, Globe, Lock, Clock, Flag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RichText } from "@/lib/question-format"
import {
  getUserQuestions,
  bulkAddUserQuestions,
  deleteUserQuestion,
  submitForCommunity,
  withdrawFromCommunity,
  type UserQuestion as Question,
} from "@/actions/user-questions.actions"

// ─── Types ────────────────────────────────────────────────────────────────────

type ParsedRow = {
  valid: boolean; error?: string
  q_text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string
  correct: string; explanation?: string; subject_label?: string
}

const OPTION_KEYS = ["opt_a", "opt_b", "opt_c", "opt_d"] as const
const OPTION_LABELS = ["A", "B", "C", "D"] as const

// ─── CSV helpers ──────────────────────────────────────────────────────────────

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
    } else { current += ch }
  }
  result.push(current.trim())
  return result
}

function parseAndValidateCsv(text: string): ParsedRow[] {
  return text.split("\n").map(l => l.trim()).filter(Boolean).map((line, i) => {
    const cols = parseCsvLine(line)
    const n = i + 1
    if (cols.length < 6) return { valid: false, error: `Row ${n}: needs at least 6 columns`, q_text: line, opt_a: "", opt_b: "", opt_c: "", opt_d: "", correct: "" }
    const [q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label] = cols
    if (!q_text) return { valid: false, error: `Row ${n}: question text empty`, q_text: "", opt_a: "", opt_b: "", opt_c: "", opt_d: "", correct: "" }
    if (!opt_a || !opt_b || !opt_c || !opt_d) return { valid: false, error: `Row ${n}: all 4 options required`, q_text, opt_a: opt_a ?? "", opt_b: opt_b ?? "", opt_c: opt_c ?? "", opt_d: opt_d ?? "", correct: "" }
    const correctUp = (correct ?? "").trim().toUpperCase()
    if (!["A", "B", "C", "D"].includes(correctUp)) return { valid: false, error: `Row ${n}: correct must be A/B/C/D`, q_text, opt_a, opt_b, opt_c, opt_d, correct: "" }
    return { valid: true, q_text, opt_a, opt_b, opt_c, opt_d, correct: correctUp, explanation: explanation || undefined, subject_label: subject_label || undefined }
  })
}

// ─── Moderation status badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: Question["moderation_status"] }) {
  if (status === "private") return null
  const cfg = {
    pending:  { icon: Clock,        label: "Pending review", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
    approved: { icon: Globe,        label: "Public",         cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
    rejected: { icon: Flag,         label: "Not approved",   cls: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
    flagged:  { icon: AlertCircle,  label: "Under review",   cls: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400" },
  }[status]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold", cfg.cls)}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { initialQuestions: Question[] }

export function MyQuestionsClient({ initialQuestions }: Props) {
  const [tab, setTab] = useState<"questions" | "upload">("questions")
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)

  const [csvText, setCsvText] = useState("")
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [submitAfterImport, setSubmitAfterImport] = useState(false)

  const filteredQuestions = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return questions
    return questions.filter(x => x.q_text.toLowerCase().includes(q) || (x.subject_label ?? "").toLowerCase().includes(q))
  }, [questions, search])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await deleteUserQuestion(id)
    if (res.success) setQuestions(prev => prev.filter(q => q.id !== id))
    setDeletingId(null)
  }

  async function handleShare(q: Question) {
    setSharingId(q.id)
    const isShared = q.moderation_status !== "private"
    const res = isShared ? await withdrawFromCommunity(q.id) : await submitForCommunity(q.id)
    if (res.success) {
      setQuestions(prev => prev.map(x => x.id === q.id
        ? { ...x,
            is_public: !isShared,
            moderation_status: isShared ? "private" : "pending",
            moderation_note: null,
          }
        : x
      ))
    }
    setSharingId(null)
  }

  async function refetchQuestions() {
    const res = await getUserQuestions()
    if (res.success) setQuestions(res.data as Question[])
  }

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
      setCsvText(""); setPreview(null)
      await refetchQuestions()

      // If user opted in, submit all freshly added questions for review
      if (submitAfterImport) {
        const fresh = await getUserQuestions()
        if (fresh.success) {
          const newest = (fresh.data as Question[]).slice(0, res.count)
          await Promise.all(newest.map(q => submitForCommunity(q.id)))
          await refetchQuestions()
          setImportMsg({ ok: true, text: `${res.count} question${res.count !== 1 ? "s" : ""} added and submitted for community review.` })
        }
      }
    } else {
      setImportMsg({ ok: false, text: res.error ?? "Import failed." })
    }
    setImporting(false)
  }

  function downloadExample() {
    const csv = [
      `What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Golgi body,B,Mitochondria generates ATP via cellular respiration.,Biology`,
      `What is the chemical formula for water?,H2O2,CO2,H2O,NaCl,C,Water is two hydrogen bonded to one oxygen.,Chemistry`,
      `Who wrote Things Fall Apart?,Wole Soyinka,Chinua Achebe,Ngugi wa Thiong'o,Ben Okri,B,Chinua Achebe published this novel in 1958.,Literature`,
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "prepiq_example_questions.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const validPreview = preview?.filter(r => r.valid) ?? []
  const invalidPreview = preview?.filter(r => !r.valid) ?? []

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-muted p-1">
        {([
          { key: "questions" as const, label: "My Questions", icon: Database, badge: questions.length || null },
          { key: "upload"    as const, label: "Upload CSV",   icon: Upload,   badge: null },
        ]).map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {badge ? <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-black text-primary">{badge}</span> : null}
          </button>
        ))}
        {/* PrepAI tab — navigates to /prepai */}
        <Link href="/prepai"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all">
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PrepAI</span>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </Link>
      </div>

      {/* ── My Questions ──────────────────────────────────────────────────────── */}
      {tab === "questions" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your questions..."
              className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Community questions link */}
          <Link href="/community/questions"
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            Browse questions shared by other students
            <ChevronRight className="h-3 w-3 ml-auto opacity-60" />
          </Link>

          {filteredQuestions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-12 text-center">
              <BookPlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-bold text-muted-foreground">{search ? "No matching questions" : "Your bank is empty"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? "Try a different search." : "Use Upload CSV or PrepAI to add questions."}
              </p>
              {!search && (
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => setTab("upload")} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">Upload CSV</button>
                  <Link href="/prepai" className="rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted">Ask PrepAI</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="px-1 text-xs text-muted-foreground">{filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}</p>
              {filteredQuestions.map(q => (
                <div key={q.id} className="rounded-2xl border bg-background p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {q.subject_label && <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{q.subject_label}</span>}
                        <StatusBadge status={q.moderation_status} />
                      </div>
                      <p className="text-sm font-semibold leading-snug"><RichText text={q.q_text} /></p>
                      {q.moderation_note && q.moderation_status === "rejected" && (
                        <p className="rounded-lg bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1.5 text-[11px] text-rose-700 dark:text-rose-400">
                          <span className="font-bold">Reason:</span> {q.moderation_note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Share / Withdraw button */}
                      {(q.moderation_status === "private" || q.moderation_status === "rejected") && (
                        <button
                          onClick={() => handleShare(q)}
                          disabled={sharingId === q.id}
                          title="Share with community"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-40 transition-colors"
                        >
                          {sharingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      {(q.moderation_status === "pending" || q.moderation_status === "approved" || q.moderation_status === "flagged") && (
                        <button
                          onClick={() => handleShare(q)}
                          disabled={sharingId === q.id}
                          title="Make private"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
                        >
                          {sharingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <button onClick={() => handleDelete(q.id)} disabled={deletingId === q.id}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/30">
                        {deletingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {OPTION_KEYS.map((key, i) => {
                      const isCorrect = q.correct === OPTION_LABELS[i]
                      return (
                        <div key={key} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
                          isCorrect ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/40")}>
                          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black",
                            isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                            {OPTION_LABELS[i]}
                          </span>
                          <RichText text={q[key]} kind="option" className={cn("truncate", isCorrect ? "font-semibold text-emerald-800 dark:text-emerald-300" : "text-muted-foreground")} />
                        </div>
                      )
                    })}
                  </div>
                  {q.explanation && <p className="rounded-lg bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">{q.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Upload CSV ────────────────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
            <p className="text-sm font-bold">CSV Format — 8 columns per row</p>
            <div className="overflow-x-auto rounded-xl border bg-background">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">{["#","Column","Req","Example"].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["1","Question text","✓","What is the powerhouse of the cell?"],
                    ["2","Option A","✓","Nucleus"],["3","Option B","✓","Mitochondria"],
                    ["4","Option C","✓","Ribosome"],["5","Option D","✓","Golgi body"],
                    ["6","Correct (A/B/C/D)","✓","B"],
                    ["7","Explanation","—","Mitochondria generates ATP."],
                    ["8","Subject label","—","Biology"],
                  ].map(([n,col,req,ex]) => (
                    <tr key={n} className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{n}</td>
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
                <strong className="text-foreground">Tip:</strong>{" "}
                <Link href="/prepai" className="text-primary hover:underline">Open PrepAI</Link> and ask it to generate questions — it can output them as CSV you can paste here.
              </p>
            </div>
            <button onClick={downloadExample} className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted">
              <Download className="h-3.5 w-3.5" /> Download Example CSV
            </button>
          </div>

          <textarea value={csvText}
            onChange={e => { setCsvText(e.target.value); setPreview(null); setImportMsg(null) }}
            rows={8}
            placeholder={"What is H2O?, Hydrogen, Water, Acid, Salt, B, Water has 2H and 1O., Chemistry\n..."}
            className="w-full rounded-2xl border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />

          {/* Community share toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setSubmitAfterImport(v => !v)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                submitAfterImport ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                submitAfterImport ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
            <span className="text-xs font-semibold text-foreground">Submit for community review after importing</span>
          </label>
          {submitAfterImport && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Questions will go into a pending queue. Once approved they&apos;ll be visible to all PrepIQ students.
            </p>
          )}

          <div className="flex gap-2">
            <button onClick={handlePreview} disabled={!csvText.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40">
              Preview
            </button>
            {csvText.trim() && (
              <button onClick={() => { setCsvText(""); setPreview(null); setImportMsg(null) }}
                className="rounded-xl border px-4 py-2.5 text-xs font-bold hover:bg-muted">
                Clear
              </button>
            )}
          </div>

          {importMsg && (
            <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold",
              importMsg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400")}>
              {importMsg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {importMsg.text}
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preview</p>
                {validPreview.length > 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{validPreview.length} valid</span>}
                {invalidPreview.length > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">{invalidPreview.length} invalid</span>}
              </div>
              <div className="rounded-2xl border overflow-hidden divide-y">
                {preview.map((row, i) => (
                  <div key={i} className={cn("flex items-start gap-3 px-4 py-2.5",
                    row.valid ? "bg-emerald-50/50 dark:bg-emerald-950/10" : "bg-rose-50/50 dark:bg-rose-950/10")}>
                    {row.valid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />}
                    <p className="text-xs truncate">
                      {row.valid
                        ? <>{row.q_text} {row.subject_label && <span className="text-muted-foreground">· {row.subject_label}</span>}</>
                        : <span className="text-rose-600 dark:text-rose-400">{row.error}</span>}
                    </p>
                  </div>
                ))}
              </div>
              {validPreview.length > 0 && (
                <button onClick={handleImport} disabled={importing}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Import {validPreview.length} question{validPreview.length !== 1 ? "s" : ""}
                  {submitAfterImport && " + submit for review"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
