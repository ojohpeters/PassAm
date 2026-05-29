"use client"

import { useState } from "react"
import { Check, X, AlertTriangle, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { moderateQuestion, type ModerationItem } from "@/actions/user-questions.actions"

const OPTION_KEYS = ["opt_a", "opt_b", "opt_c", "opt_d"] as const
const OPTION_LABELS = ["A", "B", "C", "D"] as const

export function CommunityQueueClient({ items: initialItems }: { items: ModerationItem[] }) {
  const [items, setItems] = useState<ModerationItem[]>(initialItems)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})

  async function handleModerate(id: string, action: "approve" | "reject") {
    const note = rejectNotes[id] || undefined
    if (action === "reject" && !note?.trim()) {
      setRejectNotes(prev => ({ ...prev, [id]: prev[id] ?? "" }))
      setExpandedId(id)
      return
    }
    setProcessingId(id)
    const res = await moderateQuestion(id, action, note)
    if (res.success) setItems(prev => prev.filter(i => i.id !== id))
    setProcessingId(null)
  }

  const flagged = items.filter(i => i.moderation_status === "flagged")
  const pending  = items.filter(i => i.moderation_status === "pending")

  function Section({ title, list, icon }: { title: string; list: ModerationItem[]; icon: React.ReactNode }) {
    if (list.length === 0) return null
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">{list.length}</span>
        </div>
        {list.map(item => {
          const expanded = expandedId === item.id
          const busy = processingId === item.id
          return (
            <div key={item.id} className={cn(
              "rounded-2xl border bg-background p-4 space-y-3",
              item.moderation_status === "flagged" && "border-orange-200 dark:border-orange-800/50"
            )}>
              {/* Question */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {item.subject_label && (
                    <span className="mb-1.5 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{item.subject_label}</span>
                  )}
                  {item.moderation_status === "flagged" && item.report_count > 0 && (
                    <span className="mb-1.5 ml-1 inline-block rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                      {item.report_count} report{item.report_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  <p className="text-sm font-semibold leading-snug">{item.q_text}</p>
                </div>
                <button
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Options (always visible) */}
              <div className="grid grid-cols-2 gap-1">
                {OPTION_KEYS.map((key, i) => {
                  const isCorrect = item.correct === OPTION_LABELS[i]
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
                        {item[key]}
                      </span>
                    </div>
                  )
                })}
              </div>

              {item.explanation && (
                <p className="rounded-lg bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">{item.explanation}</p>
              )}

              {/* Reject note input (shown when expanded or when rejecting) */}
              {expanded && (
                <textarea
                  value={rejectNotes[item.id] ?? ""}
                  onChange={e => setRejectNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Rejection reason (required to reject)..."
                  rows={2}
                  maxLength={300}
                  className="w-full rounded-xl border bg-muted/20 p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleModerate(item.id, "approve")}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(item.id, "reject")}
                  disabled={busy}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors disabled:opacity-40",
                    rejectNotes[item.id]?.trim()
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30"
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                  {rejectNotes[item.id]?.trim() ? "Reject" : "Reject (add reason)"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Section
        title="Flagged by students"
        list={flagged}
        icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
      />
      <Section
        title="Awaiting review"
        list={pending}
        icon={<Clock className="h-4 w-4 text-amber-500" />}
      />
    </div>
  )
}
