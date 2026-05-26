"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Bot, Key, ExternalLink, Send, Loader2, Paperclip,
  FileText, X, Info, AlertCircle, CheckCircle2, ChevronRight,
  Copy, Check, ArrowLeft, Trash2, History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  saveGroqApiKey, saveDeepseekApiKey, saveGeminiApiKey,
  saveChatHistoryDays, saveChatMessages, clearChatHistory,
  chatWithAI, bulkAddUserQuestions,
  type StoredMessage,
} from "@/actions/user-questions.actions"

// ─── Types ────────────────────────────────────────────────────────────────────

type ParsedRow = {
  valid: boolean; error?: string
  q_text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string
  correct: string; explanation?: string; subject_label?: string
}

type PdfAttachment = { name: string; text: string; pages: number }

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  provider?: "gemini" | "groq" | "deepseek"
  csvText?: string
  csvImported?: number
  isPdfNotice?: boolean
}

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
    if (!["A","B","C","D"].includes(correctUp)) return { valid: false, error: `Row ${n}: correct must be A/B/C/D`, q_text, opt_a, opt_b, opt_c, opt_d, correct: "" }
    return { valid: true, q_text, opt_a, opt_b, opt_c, opt_d, correct: correctUp, explanation: explanation || undefined, subject_label: subject_label || undefined }
  })
}

function extractCsvBlock(content: string): string | null {
  const m = content.match(/```csv\n([\s\S]*?)```/)
  return m ? m[1].trim() : null
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

async function extractPdfText(file: File): Promise<PdfAttachment> {
  const pdfjsLib = await import("pdfjs-dist")
  // Serve worker from same origin to avoid CDN/CORS issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const parts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const c = await page.getTextContent()
    parts.push(c.items.map(item => ("str" in item ? (item as { str: string }).str : "")).join(" "))
  }
  return { name: file.name, text: parts.join("\n").trim(), pages: pdf.numPages }
}

// ─── Markdown + LaTeX rendering ───────────────────────────────────────────────

function cleanLatex(s: string): string {
  return s
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\^2/g, "²").replace(/\^3/g, "³")
    .replace(/\^\{([^}]+)\}/g, "^$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function renderInline(text: string): React.ReactNode {
  const processed = text
    .replace(/\$\$([^$]+)\$\$/g, (_, m) => cleanLatex(m))
    .replace(/\$([^$\n]{1,200})\$/g, (_, m) => cleanLatex(m))
  const parts = processed.split(/(\*\*(?:[^*]|\*(?!\*))+\*\*|\*[^*\n]+\*)/)
  return (
    <>
      {parts.map((p, j) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={j}>{p.slice(2, -2)}</strong>
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={j}>{p.slice(1, -1)}</em>
        return <span key={j}>{p}</span>
      })}
    </>
  )
}

function renderContent(content: string): React.ReactNode {
  const lines = content.split("\n")
  const out: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const t = lines[i].trim()

    // Fenced block
    if (t.startsWith("```")) {
      const lang = t.slice(3).trim().toLowerCase()
      i++
      if (lang === "csv") {
        while (i < lines.length && !lines[i].trim().startsWith("```")) i++
        out.push(<p key={`csv-${i}`} className="my-1 text-xs italic text-muted-foreground">[CSV questions ready to import ↑]</p>)
      } else {
        const cLines: string[] = []
        while (i < lines.length && !lines[i].trim().startsWith("```")) { cLines.push(lines[i]); i++ }
        out.push(
          <pre key={`code-${i}`} className="my-2 overflow-x-auto rounded-lg bg-muted/80 p-3 text-xs font-mono whitespace-pre-wrap">
            {cLines.join("\n")}
          </pre>
        )
      }
      i++; continue
    }

    // Display math $$...$$
    if (t.startsWith("$$")) {
      const parts: string[] = []
      let inner = t.slice(2)
      if (inner.endsWith("$$")) { inner = inner.slice(0, -2) }
      else {
        i++
        while (i < lines.length && !lines[i].trim().endsWith("$$")) { parts.push(lines[i].trim()); i++ }
        if (i < lines.length) parts.push(lines[i].trim().replace(/\$\$$/, ""))
      }
      out.push(
        <div key={`math-${i}`} className="my-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-sm font-mono">
          {cleanLatex((inner + " " + parts.join(" ")).trim())}
        </div>
      )
      i++; continue
    }

    // Headings
    const h4m = t.match(/^#{4,}\s+(.+)/)
    if (h4m) { out.push(<p key={i} className="mt-3 mb-0.5 text-[11px] font-black uppercase tracking-wide text-foreground/75">{renderInline(h4m[1])}</p>); i++; continue }
    const h3m = t.match(/^#{3}\s+(.+)/)
    if (h3m) { out.push(<p key={i} className="mt-2 mb-0.5 text-sm font-bold">{renderInline(h3m[1])}</p>); i++; continue }
    const h2m = t.match(/^#{2}\s+(.+)/)
    if (h2m) { out.push(<p key={i} className="mt-2 mb-0.5 text-sm font-black">{renderInline(h2m[1])}</p>); i++; continue }
    const h1m = t.match(/^#\s+(.+)/)
    if (h1m) { out.push(<p key={i} className="mt-2 mb-1 font-black">{renderInline(h1m[1])}</p>); i++; continue }

    // Bullet list
    if (t.match(/^[-*]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(lines[i].trim().replace(/^[-*]\s/, "")); i++
      }
      out.push(
        <ul key={`ul-${i}`} className="my-1 list-disc space-y-0.5 pl-4">
          {items.map((item, j) => <li key={j} className="text-sm leading-snug">{renderInline(item)}</li>)}
        </ul>
      )
      continue
    }

    // Numbered list
    if (t.match(/^\d+\.\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, "")); i++
      }
      out.push(
        <ol key={`ol-${i}`} className="my-1 list-decimal space-y-0.5 pl-4">
          {items.map((item, j) => <li key={j} className="text-sm leading-snug">{renderInline(item)}</li>)}
        </ol>
      )
      continue
    }

    if (!t) { i++; continue }

    out.push(<p key={i} className="text-sm leading-relaxed">{renderInline(t)}</p>)
    i++
  }

  return <div className="space-y-1">{out}</div>
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  initialGeminiKey: string | null
  initialGroqKey: string | null
  initialDeepseekKey: string | null
  initialHistoryDays: number | null
  initialHistory: StoredMessage[]
}

const HISTORY_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Off", value: null },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
]

const WELCOME: ChatMessage = {
  id: "welcome", role: "assistant",
  content: "Hi! I'm **PrepAI**, your study assistant built for PrepIQ by Ojochegbe.\n\nI can explain any concept, quiz you, and generate questions for your bank.\n\nYou can *attach a PDF* (past question papers, study notes) and ask me about it — or let me extract all MCQs into your bank.\n\nTry: *\"Explain Newton's laws\"* or *\"Generate 5 Biology questions as CSV\"*",
}

export function PrepAIClient({ initialGeminiKey, initialGroqKey, initialDeepseekKey, initialHistoryDays, initialHistory }: Props) {
  // Keys
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey ?? "")
  const [savedGeminiKey, setSavedGeminiKey] = useState(initialGeminiKey ?? "")
  const [savingGeminiKey, setSavingGeminiKey] = useState(false)
  const [groqKey, setGroqKey] = useState(initialGroqKey ?? "")
  const [savedGroqKey, setSavedGroqKey] = useState(initialGroqKey ?? "")
  const [savingGroqKey, setSavingGroqKey] = useState(false)
  const [deepseekKey, setDeepseekKey] = useState(initialDeepseekKey ?? "")
  const [savedDeepseekKey, setSavedDeepseekKey] = useState(initialDeepseekKey ?? "")
  const [savingDsKey, setSavingDsKey] = useState(false)
  const [keyMsg, setKeyMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showKeyPanel, setShowKeyPanel] = useState(!initialGeminiKey && !initialGroqKey && !initialDeepseekKey)

  // History
  const [historyDays, setHistoryDays] = useState<number | null>(initialHistoryDays)
  const [savingHistoryDays, setSavingHistoryDays] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false)

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialHistory.length > 0
      ? initialHistory.map(m => ({
          id: m.id, role: m.role, content: m.content,
          provider: (m.provider as "gemini" | "groq" | "deepseek" | null) ?? undefined,
        }))
      : [WELCOME]
  )
  const [aiInput, setAiInput] = useState("")
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // PDF
  const [pdfAttachment, setPdfAttachment] = useState<PdfAttachment | null>(null)
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasAnyKey = !!(savedGeminiKey.trim() || savedGroqKey.trim() || savedDeepseekKey.trim())

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Key handlers ──────────────────────────────────────────────────────────

  async function handleSaveGemini() {
    setSavingGeminiKey(true); setKeyMsg(null)
    const res = await saveGeminiApiKey(geminiKey)
    if (res.success) { setSavedGeminiKey(geminiKey); setKeyMsg({ ok: true, text: "Gemini key saved." }); if (geminiKey.trim()) setShowKeyPanel(false) }
    else setKeyMsg({ ok: false, text: res.error ?? "Failed." })
    setSavingGeminiKey(false)
  }

  async function handleSaveGroq() {
    setSavingGroqKey(true); setKeyMsg(null)
    const res = await saveGroqApiKey(groqKey)
    if (res.success) { setSavedGroqKey(groqKey); setKeyMsg({ ok: true, text: "Groq key saved." }) }
    else setKeyMsg({ ok: false, text: res.error ?? "Failed." })
    setSavingGroqKey(false)
  }

  async function handleSaveDeepseek() {
    setSavingDsKey(true); setKeyMsg(null)
    const res = await saveDeepseekApiKey(deepseekKey)
    if (res.success) { setSavedDeepseekKey(deepseekKey); setKeyMsg({ ok: true, text: "DeepSeek key saved." }) }
    else setKeyMsg({ ok: false, text: res.error ?? "Failed." })
    setSavingDsKey(false)
  }

  // ── History handlers ──────────────────────────────────────────────────────

  async function handleChangeHistoryDays(val: number | null) {
    setSavingHistoryDays(true)
    setHistoryDays(val)
    await saveChatHistoryDays(val)
    setSavingHistoryDays(false)
  }

  async function handleClearHistory() {
    setClearingHistory(true)
    const res = await clearChatHistory()
    if (res.success) setMessages([WELCOME])
    setClearingHistory(false)
  }

  // ── PDF handlers ──────────────────────────────────────────────────────────

  async function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setPdfError("Only PDF files are supported. Please select a .pdf file.")
      return
    }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    if (file.size > 20 * 1024 * 1024) {
      setPdfError(`This PDF is ${sizeMB} MB — too large. Please keep it under 20 MB. Use ilovepdf.com to split or compress it first.`)
      return
    }
    setPdfError(null); setExtractingPdf(true); setPdfAttachment(null)
    try {
      const att = await extractPdfText(file)
      if (!att.text.trim()) {
        setPdfError("No readable text found in this PDF. It may be a scanned image — PrepAI can only read text-based PDFs. Try converting it with ilovepdf.com (OCR PDF tool).")
        setExtractingPdf(false)
        return
      }
      if (att.text.length < 50) {
        setPdfError("Very little text was extracted. This PDF may be mostly images. PrepAI works best with text-based PDFs.")
        setExtractingPdf(false)
        return
      }
      setPdfAttachment(att)
      const wc = att.text.split(/\s+/).length
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant", isPdfNotice: true,
        content: `PDF attached: **${att.name}** (${att.pages} page${att.pages !== 1 ? "s" : ""}, ~${wc.toLocaleString()} words).\n\nAsk me anything about this document, or tap **Extract all questions** to pull every MCQ into your bank.`,
      }])
    } catch (err) {
      console.error("[PrepAI] PDF error:", err)
      setPdfError("Failed to read this PDF. Make sure it's a valid, non-password-protected PDF. If the file is large, try splitting it at ilovepdf.com.")
    }
    setExtractingPdf(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  async function doSend(text: string) {
    if (!hasAnyKey) { setShowKeyPanel(true); return }
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text }
    const history = [...messages, userMsg]
      .filter(m => m.id !== "welcome" && !m.isPdfNotice)
      .map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setAiInput("")
    setSending(true)

    const res = await chatWithAI(history, savedGeminiKey || null, savedGroqKey || null, savedDeepseekKey || null, pdfAttachment?.text)

    if (!res.success) {
      const errMap: Record<string, string> = {
        expired_gemini: "Your Gemini key is invalid. Check it in the key panel.",
        expired_groq: "Your Groq key is invalid. Update it in the key panel.",
        expired_deepseek: "Your DeepSeek key is invalid. Update it in the key panel.",
        no_balance: "Your DeepSeek account has no credits. Use the free Gemini or Groq keys instead.",
        rate_limit: "Rate limit reached. Please wait a moment and try again.",
        no_key: "Add a free Gemini or Groq API key to get started.",
        network: "Network error. Check your connection.",
        api_error: "The AI API returned an error. Please try again.",
      }
      if (["expired_gemini", "expired_groq", "expired_deepseek", "no_balance"].includes(res.error)) setShowKeyPanel(true)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `⚠️ ${errMap[res.error] ?? "Something went wrong."}` }])
    } else {
      const csvBlock = extractCsvBlock(res.content)
      const validCsvRows = csvBlock ? parseAndValidateCsv(csvBlock).filter(r => r.valid) : []
      const msgId = crypto.randomUUID()
      const aiMsg: ChatMessage = {
        id: msgId, role: "assistant",
        content: res.content, provider: res.provider,
        csvText: csvBlock ?? undefined,
      }
      setMessages(prev => [...prev, aiMsg])

      // Auto-import CSV questions immediately
      if (validCsvRows.length > 0) {
        bulkAddUserQuestions(validCsvRows).then(r => {
          if (r.success) setMessages(prev => prev.map(m => m.id === msgId ? { ...m, csvImported: r.count } : m))
        }).catch(() => {})
      }

      if (historyDays && historyDays > 0) {
        saveChatMessages(
          [{ role: "user", content: text }, { role: "assistant", content: res.content, provider: res.provider }],
          historyDays,
        ).catch(() => {})
      }
    }
    setSending(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function handleSend() {
    const text = aiInput.trim()
    if (!text || sending) return
    await doSend(text)
  }

  async function handleCopyCSV(msgId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(msgId)
      setTimeout(() => setCopiedId(null), 2500)
    } catch { /* clipboard unavailable */ }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b bg-background px-4 py-3 flex items-center gap-3">
        <Link href="/my-questions"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black leading-tight">PrepAI</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Built for PrepIQ by Ojochegbe</p>
        </div>
        {pdfAttachment && (
          <div className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1.5 max-w-[140px]">
            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-semibold text-primary truncate">{pdfAttachment.name}</span>
            <button onClick={() => setPdfAttachment(null)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <button onClick={() => setShowKeyPanel(v => !v)}
          className={cn("flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors shrink-0",
            showKeyPanel ? "bg-muted" : "hover:bg-muted")}>
          <Key className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={cn("hidden sm:inline", savedGeminiKey || savedGroqKey ? "text-emerald-600" : "text-amber-600")}>
            {savedGeminiKey || savedGroqKey ? "Keys ✓" : "Add keys"}
          </span>
        </button>
      </div>

      {/* ── Key + Settings panel ────────────────────────────────────────────── */}
      {showKeyPanel && (
        <div className="shrink-0 border-b overflow-y-auto max-h-[55vh]">
          <div className="p-4 space-y-4">
            {/* Banners */}
            <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-2">
              <div className="flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Gemini and Groq are completely free</strong> — no credit card needed. Gemini tries first, Groq is the backup.
                </p>
              </div>
              <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 px-2.5 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                <p className="text-amber-800 dark:text-amber-400">
                  <strong>Security:</strong> Only paste the <strong>free tier</strong> key. Never use a paid/production key here.
                </p>
              </div>
              <div className="flex items-start gap-1.5 rounded-lg bg-[#25D366]/10 px-2.5 py-2">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 mt-0.5 fill-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <p className="text-muted-foreground"><strong className="text-foreground">Confused?</strong> Tap the green WhatsApp button at the bottom-right to DM Ojochegbe — he&apos;ll help you set it up.</p>
              </div>
            </div>

            {/* Gemini */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Google Gemini <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">FREE · Primary</span></p>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[10px] text-primary hover:underline">Get key <ExternalLink className="h-2.5 w-2.5" /></a>
              </div>
              <div className="flex gap-2">
                <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIza..."
                  className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={handleSaveGemini} disabled={savingGeminiKey}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  {savingGeminiKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground"><strong>aistudio.google.com</strong> → Get API key. No card needed.</p>
            </div>

            {/* Groq */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Groq <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-black text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">FREE · Backup</span></p>
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[10px] text-primary hover:underline">Get key <ExternalLink className="h-2.5 w-2.5" /></a>
              </div>
              <div className="flex gap-2">
                <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..."
                  className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={handleSaveGroq} disabled={savingGroqKey}
                  className="rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-60">
                  {savingGroqKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground"><strong>console.groq.com</strong> → API Keys → Create. No card needed.</p>
            </div>

            {/* DeepSeek */}
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                DeepSeek (optional, paid)
              </summary>
              <div className="mt-2 pl-4 space-y-1.5">
                <div className="flex gap-2">
                  <input type="password" value={deepseekKey} onChange={e => setDeepseekKey(e.target.value)} placeholder="sk-..."
                    className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={handleSaveDeepseek} disabled={savingDsKey}
                    className="rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-60">
                    {savingDsKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">platform.deepseek.com — requires credits.</p>
              </div>
            </details>

            {keyMsg && (
              <div className={cn("flex items-center gap-1.5 text-xs font-semibold", keyMsg.ok ? "text-emerald-600" : "text-rose-600")}>
                {keyMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {keyMsg.text}
              </div>
            )}

            {/* Chat History */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-bold">Chat History</p>
                  {savingHistoryDays && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                {messages.filter(m => m.id !== "welcome").length > 0 && (
                  <button onClick={handleClearHistory} disabled={clearingHistory}
                    className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50">
                    {clearingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Clear history
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HISTORY_OPTIONS.map(opt => (
                  <button key={String(opt.value)} onClick={() => handleChangeHistoryDays(opt.value)} disabled={savingHistoryDays}
                    className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      historyDays === opt.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted text-muted-foreground")}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {historyDays ? `Conversations saved for ${historyDays} days then auto-deleted.` : "History is off — conversations are not saved."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className="max-w-[90%] space-y-2">
              <div className={cn("rounded-2xl px-4 py-3",
                msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                {renderContent(msg.content)}
              </div>
              {msg.provider && (
                <p className="text-[10px] text-muted-foreground px-1">
                  via {msg.provider === "gemini" ? "Gemini" : msg.provider === "groq" ? "Groq" : "DeepSeek"}
                </p>
              )}
              {(msg.csvImported !== undefined || msg.csvText) && (
                <div className="flex flex-wrap gap-2 items-center">
                  {msg.csvImported !== undefined && (
                    <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {msg.csvImported} question{msg.csvImported !== 1 ? "s" : ""} added to your bank
                    </div>
                  )}
                  {msg.csvText && (
                    <button onClick={() => handleCopyCSV(msg.id, msg.csvText!)}
                      className="flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-bold hover:bg-muted transition-colors">
                      {copiedId === msg.id
                        ? <><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-600">Copied!</span></>
                        : <><Copy className="h-3.5 w-3.5" />Copy CSV</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── PDF action row ───────────────────────────────────────────────────── */}
      {pdfAttachment && hasAnyKey && (
        <div className="shrink-0 border-t bg-emerald-50/50 dark:bg-emerald-950/10 px-4 py-2 flex items-center gap-3">
          <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1 truncate">{pdfAttachment.name} ({pdfAttachment.pages}p)</p>
          <button onClick={() => doSend("Extract ALL multiple choice questions from the attached document into CSV format. Make sure each correct answer letter (A/B/C/D) is accurate.")}
            disabled={sending}
            className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-60 whitespace-nowrap">
            Extract all questions →
          </button>
        </div>
      )}

      {/* ── Input row ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t bg-muted/20 p-3 flex gap-2 items-end mb-8 sm:mb-0">
        <input ref={fileInputRef as React.RefObject<HTMLInputElement>} type="file" accept="application/pdf" onChange={handlePdfSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={extractingPdf} title="Attach PDF"
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-muted disabled:opacity-40",
            pdfAttachment ? "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/20" : "text-muted-foreground")}>
          {extractingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </button>
        <textarea ref={inputRef} value={aiInput}
          onChange={e => setAiInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={hasAnyKey ? "Ask PrepAI anything... (Enter to send)" : "Save an API key above to start chatting"}
          disabled={sending || !hasAnyKey}
          rows={1}
          className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
        <button onClick={handleSend} disabled={sending || !aiInput.trim() || !hasAnyKey}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {pdfError && (
        <div className="shrink-0 mx-3 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/20 dark:text-rose-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{pdfError}</p>
              <a href="https://www.ilovepdf.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2">
                Open ilovepdf.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PDF tips — shown when no PDF is attached */}
      {!pdfAttachment && (
        <div className="shrink-0 mx-3 mb-2 flex items-start gap-2 rounded-xl border border-dashed bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            <strong className="text-foreground">Attach a PDF</strong> to analyse past questions or study notes.
            {" "}Text-based PDFs only · max 20 MB · large files?{" "}
            <a href="https://www.ilovepdf.com/split_pdf" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline">
              Split at ilovepdf.com
            </a>
          </p>
        </div>
      )}

      {!hasAnyKey && (
        <div className="shrink-0 mx-3 mb-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs dark:border-amber-800/40 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400">Add a <strong>free</strong> Gemini or Groq API key above to unlock PrepAI.</span>
        </div>
      )}
    </div>
  )
}
