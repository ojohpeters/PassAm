"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Radio, Square, ChevronRight, Search, Loader2, Zap,
  CheckCircle2, XCircle, Trophy, Users, Lightbulb
} from "lucide-react"
import {
  startLiveSession, endLiveSession,
  pushQuestion, getGeneralQuestions,
  getSessionLeaderboard, getQuestionAnswers, getPushedQuestionById,
} from "@/actions/brainstorm.actions"
import type { PushedQuestion, LeaderboardEntry, GeneralQuestion } from "@/actions/brainstorm.actions"
import { parseInline } from "@/lib/parseInline"

type Session = { id: string; session_date: string; title: string | null; is_live?: boolean }
type Subject = { id: string; name: string }
type Answer = { id: string; is_correct: boolean; points_awarded: number; answered_at: string; user: { name: string; avatar_url: string | null } }

function Avatar({ name, url, size = "sm" }: { name: string; url: string | null; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs"
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 font-black text-white", s)}>
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  )
}

export function HostPanel({
  session: initialSession,
  initialQuestion,
  subjects,
  initialLeaderboard,
  initialAnswers,
  userId,
}: {
  session: Session
  initialQuestion: PushedQuestion | null
  subjects: Subject[]
  initialLeaderboard: LeaderboardEntry[]
  initialAnswers: Answer[]
  userId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [isLive, setIsLive] = useState(initialSession.is_live ?? false)
  const [currentQuestion, setCurrentQuestion] = useState<PushedQuestion | null>(initialQuestion)
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [answers, setAnswers] = useState(initialAnswers)

  // Question browser state
  const [subjectFilter, setSubjectFilter] = useState("")
  const [search, setSearch] = useState("")
  const [questions, setQuestions] = useState<GeneralQuestion[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PER_PAGE = 10

  // ── Fetch question list ─────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async (p = 1) => {
    setLoadingQ(true)
    const res = await getGeneralQuestions(subjectFilter || undefined, search || undefined, p, PER_PAGE)
    setQuestions(res.questions)
    setTotal(res.total)
    setPage(p)
    setLoadingQ(false)
  }, [subjectFilter, search])

  useEffect(() => { fetchQuestions(1) }, [fetchQuestions])

  // ── Realtime ───────────────────────────────────────────────────────────────
  const refreshLeaderboard = useCallback(async () => {
    const lb = await getSessionLeaderboard(initialSession.id)
    setLeaderboard(lb)
  }, [initialSession.id])

  const refreshAnswers = useCallback(async (pushedId: string) => {
    const ans = await getQuestionAnswers(pushedId)
    setAnswers(ans)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`host-${initialSession.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "brainstorm_answers" },
        async (payload) => {
          await refreshLeaderboard()
          if (currentQuestion && payload.new.pushed_question_id === currentQuestion.id) {
            await refreshAnswers(currentQuestion.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialSession.id, currentQuestion?.id, refreshLeaderboard, refreshAnswers])

  // ── Actions ────────────────────────────────────────────────────────────────
  function handleToggleLive() {
    startTransition(async () => {
      if (isLive) {
        const res = await endLiveSession(initialSession.id)
        if (!res.success) { toast.error("Failed to end session"); return }
        setIsLive(false)
        toast.success("Session ended")
      } else {
        const res = await startLiveSession(initialSession.id)
        if (!res.success) { toast.error("Failed to start session"); return }
        setIsLive(true)
        toast.success("Session is now live!")
      }
    })
  }

  function handleBroadcast(question: GeneralQuestion) {
    if (!isLive) { toast.error("Start the session first"); return }
    startTransition(async () => {
      const res = await pushQuestion(initialSession.id, question.id)
      if (!res.success) {
        toast.error(res.error === "ALREADY_PUSHED" ? "This question was already used in this session" : "Failed to broadcast")
        return
      }
      const pushed = await getPushedQuestionById(res.data.id)
      if (pushed) {
        setCurrentQuestion(pushed)
        setAnswers([])
      }
      toast.success("Question broadcast!")
    })
  }

  const MEDAL = ["🥇", "🥈", "🥉"]

  return (
    <div className="min-h-full bg-background pb-16">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 px-5 py-6 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Radio className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Host Panel</span>
              </div>
              <h1 className="text-xl font-black tracking-tight md:text-2xl">
                Brainstorm Session — {new Date(initialSession.session_date + "T00:00:00").toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
              </h1>
            </div>
            <button
              onClick={handleToggleLive}
              disabled={isPending}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition-all active:scale-95",
                isLive
                  ? "bg-white/20 hover:bg-white/30 border border-white/30"
                  : "bg-white text-orange-600 shadow-lg hover:shadow-xl"
              )}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isLive ? <Square className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
              {isLive ? "End Session" : "Go Live"}
            </button>
          </div>

          {isLive && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-sm">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
              Session is live — students can see questions as you broadcast them
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">

          {/* ── Left: question browser ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-bold">Question Bank — General Pool</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full rounded-xl border bg-background py-2 pl-8 pr-3 text-sm outline-none ring-primary/40 focus:border-primary focus:ring-2"
                />
              </div>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 text-sm font-semibold outline-none ring-primary/40 focus:border-primary focus:ring-2"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Question list */}
            {loadingQ ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : questions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No questions found.</p>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => {
                  const isCurrentQ = currentQuestion?.question.id === q.id
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "rounded-2xl border p-4 transition-colors",
                        isCurrentQ ? "border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20" : "bg-background"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">{q.subject.name}</span>
                            {q.year && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{q.year}</span>}
                            {isCurrentQ && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Current</span>}
                          </div>
                          <p className="text-sm leading-snug line-clamp-2">{parseInline(q.text)}</p>
                        </div>
                        <button
                          onClick={() => handleBroadcast(q)}
                          disabled={isPending || !isLive || isCurrentQ}
                          className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                            isCurrentQ
                              ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 cursor-default"
                              : isLive
                              ? "bg-primary text-primary-foreground hover:opacity-90"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          )}
                        >
                          {isCurrentQ ? "Live" : <><Zap className="h-3 w-3" /> Broadcast</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {total > PER_PAGE && (
              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>{total} questions · page {page} of {Math.ceil(total / PER_PAGE)}</span>
                <div className="flex gap-2">
                  <button onClick={() => fetchQuestions(page - 1)} disabled={page <= 1 || loadingQ} className="rounded-lg border px-3 py-1.5 font-semibold hover:bg-muted disabled:opacity-40">
                    Prev
                  </button>
                  <button onClick={() => fetchQuestions(page + 1)} disabled={page >= Math.ceil(total / PER_PAGE) || loadingQ} className="rounded-lg border px-3 py-1.5 font-semibold hover:bg-muted disabled:opacity-40">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: current question + leaderboard ── */}
          <div className="space-y-4">

            {/* Current question */}
            <div className="rounded-2xl border bg-background p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Question</p>
              {currentQuestion ? (
                <>
                  <p className="text-sm leading-relaxed font-medium">{parseInline(currentQuestion.question.text)}</p>
                  <div className="space-y-1.5">
                    {currentQuestion.question.options.sort((a, b) => a.label.localeCompare(b.label)).map((opt) => (
                      <div key={opt.id} className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                        opt.is_correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-muted/50 text-muted-foreground"
                      )}>
                        <span className="font-black w-4">{opt.label}</span>
                        <span className="flex-1 truncate">{parseInline(opt.text)}</span>
                        {opt.is_correct && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No question broadcast yet.</p>
              )}
            </div>

            {/* Live answer feed */}
            {currentQuestion && (
              <div className="rounded-2xl border bg-background p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Answers</p>
                  <span className="text-xs text-muted-foreground">{answers.length} answered</span>
                </div>
                {answers.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">Waiting for students to answer…</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {answers.slice(0, 20).map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Avatar name={a.user.name} url={a.user.avatar_url} />
                        <span className="flex-1 text-xs font-semibold truncate">{a.user.name}</span>
                        {a.is_correct ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">+{a.points_awarded}pts</span>
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Session leaderboard */}
            <div className="rounded-2xl border bg-background p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Leaderboard</p>
              </div>
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Users className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No answers yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.slice(0, 10).map((e, i) => (
                    <div key={e.user_id} className="flex items-center gap-2">
                      <span className="w-5 text-center text-sm">{MEDAL[i] ?? `${i + 1}.`}</span>
                      <Avatar name={e.user.name} url={e.user.avatar_url} />
                      <span className="flex-1 text-xs font-semibold truncate">{e.user.name}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        {e.total_points}pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
