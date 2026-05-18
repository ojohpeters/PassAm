"use client"

import { useState, useTransition, useRef } from "react"
import { bulkImportQuestions, type CsvImportRow } from "@/actions/admin.actions"
import { cn } from "@/lib/utils"
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, Trash2, ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type School = { id: string; name: string; abbreviation: string }

// ── CSV parser ────────────────────────────────────────────────────────────────
// Handles quoted fields (including commas and newlines inside quotes)
function parseCSV(raw: string): string[][] {
  const rows: string[][] = []
  let cur = ""
  let inQuotes = false
  const fields: string[] = []

  const pushField = () => {
    fields.push(cur.trim())
    cur = ""
  }

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    const next = raw[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') { cur += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { cur += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { pushField() }
      else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++
        pushField()
        if (fields.some((f) => f)) rows.push([...fields])
        fields.length = 0
      } else { cur += ch }
    }
  }
  pushField()
  if (fields.some((f) => f)) rows.push([...fields])

  return rows
}

const CORRECT_COL = ["a", "b", "c", "d"]
const HEADER_PATTERNS = ["text", "question", "option_a", "option a", "correct"]

function rowsToCsvImport(rows: string[][]): { valid: CsvImportRow[]; invalid: number } {
  let data = rows
  // Skip header if detected
  if (data[0] && data[0].some((c) => HEADER_PATTERNS.includes(c.toLowerCase().trim()))) {
    data = data.slice(1)
  }

  let invalid = 0
  const valid: CsvImportRow[] = []

  for (const row of data) {
    if (row.length < 7) { invalid++; continue }
    const [text, option_a, option_b, option_c, option_d, correct, explanation, subject = "", year = ""] = row
    if (!text?.trim() || !option_a?.trim() || !option_b?.trim() || !option_c?.trim() || !option_d?.trim()) {
      invalid++; continue
    }
    if (!CORRECT_COL.includes(correct?.trim().toLowerCase())) { invalid++; continue }

    valid.push({
      text: text.trim(),
      option_a: option_a.trim(),
      option_b: option_b.trim(),
      option_c: option_c.trim(),
      option_d: option_d.trim(),
      correct: correct.trim().toUpperCase(),
      explanation: explanation?.trim() ?? "",
      subject: subject.trim(),
      year: year.trim(),
    })
  }

  return { valid, invalid }
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ImportClient({ schools }: { schools: School[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [schoolId, setSchoolId] = useState("")
  const [csvText, setCsvText]   = useState("")
  const [parsed, setParsed]     = useState<{ valid: CsvImportRow[]; invalid: number } | null>(null)
  const [result, setResult]     = useState<{ created: number; failed: number; skipped: number; newSubjects: string[] } | null>(null)
  const [error, setError]       = useState("")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  function handleParse() {
    setError("")
    setResult(null)
    if (!csvText.trim()) { setError("Paste some CSV text first."); return }
    const rows = parseCSV(csvText.trim())
    const res = rowsToCsvImport(rows)
    if (!res.valid.length) { setError("No valid rows found. Check your CSV format."); return }
    setParsed(res)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvText(text)
      setResult(null)
      setParsed(null)
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (!schoolId) { setError("Select a school first."); return }
    if (!parsed?.valid.length) return
    setError("")

    startTransition(async () => {
      const res = await bulkImportQuestions(schoolId, parsed.valid)
      if (!res.success) { setError(res.error); return }
      setResult(res.data)
      setParsed(null)
      setCsvText("")
    })
  }

  function reset() {
    setCsvText(""); setParsed(null); setResult(null); setError(""); setExpandedRow(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  // ── Result screen ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-3xl font-black">{result.created.toLocaleString()} imported</p>
          {result.skipped > 0 && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 font-medium">{result.skipped} duplicate{result.skipped !== 1 ? "s" : ""} skipped (already in bank)</p>
          )}
          {result.failed > 0 && (
            <p className="mt-1 text-sm text-destructive font-medium">{result.failed} rows skipped (bad format)</p>
          )}
          {result.newSubjects.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              New subjects auto-created: <span className="font-semibold text-foreground">{result.newSubjects.join(", ")}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
          >
            Import more
          </button>
          <Link
            href="/admin/questions"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
          >
            View questions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/questions"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Questions
      </Link>

      {/* Step 1 — School */}
      <div className="rounded-2xl border bg-background p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step 1 — Select School</p>
        <select
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Choose a school…</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.abbreviation})</option>
          ))}
        </select>
      </div>

      {/* Step 2 — Paste or Upload */}
      <div className="rounded-2xl border bg-background p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step 2 — Paste CSV or Upload File</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload .csv
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </div>

        <textarea
          value={csvText}
          onChange={(e) => { setCsvText(e.target.value); setParsed(null); setResult(null) }}
          placeholder={`Paste CSV rows here — no header needed.\nStandard: "What is the symbol for water?","H2O","CO2","NaCl","O2",A,"Explanation",Chemistry,2021\nPassage: "[PASSAGE: Read the following text...] Which of the following...","Option A","Option B","Option C","Option D",B,"Explanation",English Language,2022`}
          rows={10}
          className="w-full resize-y rounded-xl border bg-muted/30 px-4 py-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
          spellCheck={false}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={!csvText.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
          >
            <FileText className="h-4 w-4" />
            Parse &amp; Preview
          </button>
          {csvText && (
            <button onClick={reset} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 3 — Preview */}
      {parsed && (
        <div className="rounded-2xl border bg-background space-y-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step 3 — Preview</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm font-bold text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                {parsed.valid.length} valid
              </span>
              {parsed.invalid > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  {parsed.invalid} skipped
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left min-w-[280px]">Question</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left w-16">Answer</th>
                  <th className="px-4 py-3 text-left w-12">Year</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {parsed.valid.map((row, i) => (
                  <>
                    <tr
                      key={i}
                      className={cn(
                        "border-b transition-colors cursor-pointer hover:bg-muted/30",
                        expandedRow === i && "bg-muted/20"
                      )}
                      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                    >
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium leading-snug">
                        {row.text.startsWith("[PASSAGE:") && (
                          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                            📖 Passage
                          </span>
                        )}
                        <span className="line-clamp-2 block">
                          {row.text.startsWith("[PASSAGE:")
                            ? row.text.replace(/^\[PASSAGE:\s*[\s\S]+?\]\s*/, "") || row.text
                            : row.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {row.subject || <span className="text-destructive">missing</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-black text-green-700 dark:text-green-400">
                          {row.correct}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.year || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {expandedRow === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                    </tr>
                    {expandedRow === i && (
                      <tr key={`${i}-exp`} className="border-b bg-muted/10">
                        <td />
                        <td colSpan={5} className="px-4 pb-4 pt-1 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {(["A", "B", "C", "D"] as const).map((label) => {
                              const text = row[`option_${label.toLowerCase()}` as keyof CsvImportRow]
                              return (
                                <div
                                  key={label}
                                  className={cn(
                                    "flex items-start gap-2 rounded-lg px-3 py-2 border",
                                    row.correct === label
                                      ? "border-green-400/40 bg-green-50 dark:bg-green-900/20 font-semibold text-green-700 dark:text-green-400"
                                      : "border-border bg-background text-muted-foreground"
                                  )}
                                >
                                  <span className="font-black shrink-0">{label}.</span>
                                  <span>{text}</span>
                                </div>
                              )
                            })}
                          </div>
                          {row.explanation && (
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                              <span className="font-bold">Explanation: </span>{row.explanation}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import button */}
          <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-4">
            {!schoolId && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <AlertTriangle className="h-4 w-4" /> Select a school above before importing
              </p>
            )}
            {schoolId && <p className="text-sm text-muted-foreground">Ready to import {parsed.valid.length} questions</p>}
            <button
              onClick={handleImport}
              disabled={isPending || !schoolId}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-40 active:scale-[0.98]"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isPending ? "Importing…" : `Import ${parsed.valid.length} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
