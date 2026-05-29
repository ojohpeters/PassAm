"use client"

import { useState, useMemo } from "react"
import { Search, Flag, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCommunityQuestions, reportCommunityQuestion, type CommunityQuestion } from "@/actions/user-questions.actions"

const OPTION_KEYS = ["opt_a", "opt_b", "opt_c", "opt_d"] as const
const OPTION_LABELS = ["A", "B", "C", "D"] as const

const REPORT_REASONS = [
  "Wrong answer",
  "Incorrect or misleading question",
  "Duplicate question",
  "Inappropriate content",
  "Not an exam question",
]

type Props = {
  initialData: CommunityQuestion[]
  initialTotal: number
  subjects: string[]
}

export function CommunityQuestionsClient({ initialData, initialTotal, subjects }: Props) {
  const [questions, setQuestions] = useState<CommunityQuestion[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  // Report modal state
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [reportCustom, setReportCustom] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportMsg, setReportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())

  const finalReason = reportReason === "Other" ? reportCustom : reportReason

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return questions
    return questions.filter(x => x.q_text.toLowerCase().includes(q) || (x.subject_label ?? "").toLowerCase().includes(q))
  }, [questions, search])

  async function applyFilter(subject: string | null) {
    setActiveSubject(subject)
    setLoading(true)
    const res = await getCommunityQuestions({ subject: subject ?? undefined, search: search || undefined })
    if (res.success) { setQuestions(res.data); setTotal(res.total) }
    setLoading(false)
  }

  async function handleSearch(value: string) {
    setSearch(value)
    if (value.length === 0 || value.length >= 3) {
      setLoading(true)
      const res = await getCommunityQuestions({ subject: activeSubject ?? undefined, search: value || undefined })
      if (res.success) { setQuestions(res.data); setTotal(res.total) }
      setLoading(false)
    }
  }

  function toggleReveal(id: string) {
    setRevealedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openReport(id: string) {
    setReportingId(id)
    setReportReason("")
    setReportCustom("")
    setReportMsg(null)
  }

  async function submitReport() {
    if (!reportingId || !finalReason.trim()) return
    setReportSubmitting(true)
    const res = await reportCommunityQuestion(reportingId, finalReason.trim())
    if (res.success) {
      setReportedIds(prev => new Set(prev).add(reportingId!))
      setReportMsg({ ok: true, text: "Report submitted. Thank you." })
      setTimeout(() => { setReportingId(null); setReportMsg(null) }, 1500)
    } else if (res.error === "ALREADY_REPORTED") {
      setReportMsg({ ok: false, text: "You already reported this question." })
    } else {
      setReportMsg({ ok: false, text: "Something went wrong. Try again." })
    }
    setReportSubmitting(false)
  }

  return (
    <>
      {/* Search + subject filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => applyFilter(null)}
              className={cn("rounded-full px-3 py-1 text-xs font-bold transition-colors",
                activeSubject === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
            >
              All
            </button>
            {subjects.map(s => (
              <button
                key={s}
                onClick={() => applyFilter(s)}
                className={cn("rounded-full px-3 py-1 text-xs font-bold transition-colors",
                  activeSubject === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{total.toLocaleString()} question{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Questions */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-12 text-center">
          <p className="font-bold text-muted-foreground">No questions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to share from your question bank.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const revealed = revealedIds.has(q.id)
            const alreadyReported = reportedIds.has(q.id)
            return (
              <div key={q.id} className="rounded-2xl border bg-background p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {q.subject_label && (
                      <span className="mb-1.5 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{q.subject_label}</span>
                    )}
                    <p className="text-sm font-semibold leading-snug">{q.q_text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleReveal(q.id)}
                      title={revealed ? "Hide answer" : "Show answer"}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => openReport(q.id)}
                      disabled={alreadyReported}
                      title={alreadyReported ? "Already reported" : "Report question"}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Options — always visible but answer only highlighted when revealed */}
                <div className="grid grid-cols-2 gap-1">
                  {OPTION_KEYS.map((key, i) => {
                    const isCorrect = q.correct === OPTION_LABELS[i]
                    const showCorrect = revealed && isCorrect
                    return (
                      <div key={key} className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                        showCorrect ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/40"
                      )}>
                        <span className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black",
                          showCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {OPTION_LABELS[i]}
                        </span>
                        <span className={cn("truncate", showCorrect ? "font-semibold text-emerald-800 dark:text-emerald-300" : "text-muted-foreground")}>
                          {q[key]}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {revealed && q.explanation && (
                  <p className="rounded-lg bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">{q.explanation}</p>
                )}

                {!revealed && (
                  <button
                    onClick={() => toggleReveal(q.id)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Tap to reveal answer
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Report modal */}
      {reportingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-background p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-black text-base">Report Question</p>
              <button onClick={() => setReportingId(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Help keep the community bank clean. What&apos;s wrong with this question?</p>

            <div className="space-y-2">
              {[...REPORT_REASONS, "Other"].map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                    reportReason === reason ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>

            {reportReason === "Other" && (
              <textarea
                value={reportCustom}
                onChange={e => setReportCustom(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                maxLength={500}
                className="w-full rounded-xl border bg-muted/20 p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            )}

            {reportMsg && (
              <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                reportMsg.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400")}>
                {reportMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {reportMsg.text}
              </div>
            )}

            <button
              onClick={submitReport}
              disabled={!finalReason.trim() || reportSubmitting}
              className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-40 transition-colors"
            >
              {reportSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Submit Report"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
