"use client"

import { useState, useEffect, useTransition } from "react"
import { cn } from "@/lib/utils"
import { getSessionPlan, type SessionPlan } from "@/actions/study-planner.actions"
import { Target, RefreshCw, ChevronDown, ChevronUp, ClipboardList, Zap, BookOpen, Flame } from "lucide-react"
import Link from "next/link"

const PRIORITY_STYLES = {
  urgent:   { dot: "bg-red-500",   bg: "bg-red-50 dark:bg-red-950/20",    border: "border-red-200 dark:border-red-800/50",   text: "text-red-700 dark:text-red-300",   badge: "🔴" },
  soon:     { dot: "bg-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/50", text: "text-amber-700 dark:text-amber-300", badge: "🟡" },
  maintain: { dot: "bg-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/50", text: "text-emerald-700 dark:text-emerald-300", badge: "🟢" },
}

const PRIORITY_LABEL = { urgent: "Overdue", soon: "Due today", maintain: "Weak spot" }

export function SessionPlanner({ onInject }: { onInject: (tasks: string[]) => void }) {
  const [plan, setPlan]       = useState<SessionPlan | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [injected, setInjected]   = useState(false)
  const [isPending, startTransition] = useTransition()

  function load() {
    startTransition(async () => {
      const data = await getSessionPlan()
      setPlan(data)
      setInjected(false)
    })
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function handleStartPlan() {
    if (!plan?.items.length) return
    const tasks = plan.items.map((i) => i.taskText)
    onInject(tasks)
    setInjected(true)
  }

  return (
    <div className={cn(
      "rounded-2xl border-2 border-violet-200 dark:border-violet-800/60 overflow-hidden transition-all",
      "bg-gradient-to-br from-violet-50/80 to-indigo-50/40 dark:from-violet-950/30 dark:to-indigo-950/20"
    )}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <Target className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-black text-violet-900 dark:text-violet-100 leading-none">Session Planner</p>
            <p className="text-[10px] text-violet-600/70 dark:text-violet-400/70 mt-0.5">Based on your weak spots & overdue reviews</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={load}
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">

          {/* Loading */}
          {isPending && !plan && (
            <div className="space-y-2 py-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-violet-100/60 dark:bg-violet-900/20 animate-pulse" />
              ))}
            </div>
          )}

          {/* No data yet */}
          {plan && !plan.hasData && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-white/60 dark:bg-violet-950/20 p-4 space-y-2 text-center">
              <p className="text-2xl">📭</p>
              <p className="text-sm font-bold text-violet-900 dark:text-violet-100">No study data yet</p>
              <p className="text-xs text-muted-foreground">
                Complete a drill or exam, then tag your mistakes — your personalised plan will appear here.
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <Link href="/drill" className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity">
                  Start Drill
                </Link>
                <Link href="/weak-spots" className="rounded-xl border border-violet-200 dark:border-violet-700 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                  Weak Spots
                </Link>
              </div>
            </div>
          )}

          {/* Plan items */}
          {plan?.hasData && plan.items.length > 0 && (
            <>
              <div className="space-y-2">
                {plan.items.map((item) => {
                  const s = PRIORITY_STYLES[item.priority]
                  return (
                    <div
                      key={item.subjectId}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                        s.bg, s.border
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", s.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-tight text-foreground">{item.subjectName}</p>
                        <p className={cn("text-[11px] mt-0.5", s.text)}>
                          {PRIORITY_LABEL[item.priority]}
                          {item.overdueCount > 0 && ` · ${item.overdueCount} review${item.overdueCount > 1 ? "s" : ""}`}
                          {item.priority === "maintain" && ` · ${item.totalCount} logged`}
                        </p>
                      </div>
                      {item.priority === "urgent" && <Flame className="h-4 w-4 text-red-500 shrink-0" />}
                      {item.priority === "soon"   && <Zap   className="h-4 w-4 text-amber-500 shrink-0" />}
                      {item.priority === "maintain" && <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />}
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-violet-600/80 dark:text-violet-400/80 font-medium">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/50">
                    <Target className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                  </div>
                  Suggested: {plan.suggestedPomodoros} Pomodoro{plan.suggestedPomodoros > 1 ? "s" : ""}
                </div>

                {injected ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Added to tasks
                  </span>
                ) : (
                  <button
                    onClick={handleStartPlan}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity active:scale-95"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Add to Tasks →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
