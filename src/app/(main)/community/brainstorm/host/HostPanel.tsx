"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Radio, Square, ChevronLeft, Search, Loader2, Zap,
  CheckCircle2, XCircle, Trophy, Users, BookOpen,
} from "lucide-react"
import {
  startLiveSession, endLiveSession,
  pushQuestion, getBrainstormQuestions,
  getSessionLeaderboard, getQuestionAnswers, getPushedQuestionById,
} from "@/actions/brainstorm.actions"
import type { PushedQuestion, LeaderboardEntry, GeneralQuestion } from "@/actions/brainstorm.actions"
import { InlineText } from "@/lib/parseInline"

type Session = { id: string; session_date: string; title: string | null; is_live?: boolean }
type Subject = { id: string; name: string }
type Answer = { id: string; is_correct: boolean; points_awarded: number; answered_at: string; user: { name: string; avatar_url: string | null } }

const PER_PAGE = 15
const MEDAL = ["🥇", "🥈", "🥉"]

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-[11px] font-black text-white">
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
}: {
  session: Session
  initialQuestion: PushedQuestion | null
  subjects: Subject[]
  initialLeaderboard: LeaderboardEntry[]
  initialAnswers: Answer[]
  userId: string
}) {
  const [isPending, startTransition] = useTransition()

  const [isLive, setIsLive] = useState(initialSession.is_live ?? false)
  const [currentQuestion, setCurrentQuestion] = useState<PushedQuestion | null>(initialQuestion)
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [answers, setAnswers] = useState(initialAnswers)

  // ── Subject selection ──────────────────────────────────────────────────────
  // Pre-select the subject of the current question if there is one
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => {
    if (initialQuestion) {
      const subj = subjects.find(s => s.id === initialQuestion.question.subject.id)
      return subj ?? null
    }
    return null
  })

  // ── Question browser ───────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [questions, setQuestions] = useState<GeneralQuestion[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchQuestions = useCallback(async (subjectId: string, q: string, p: number) => {
    setLoadingQ(true)
    const res = await getBrainstormQuestions(subjectId, q || undefined, p, PER_PAGE)
    setQuestions(res.questions)
    setTotal(res.total)
    setPage(p)
    setLoadingQ(false)
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions(selectedSubject.id, search, 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject?.id, fetchQuestions])

  // Debounce search
  useEffect(() => {
    if (!selectedSubject) return
    const t = setTimeout(() => fetchQuestions(selectedSubject.id, search, 1), 300)
    return () => clearTimeout(t)
  }, [search, selectedSubject, fetchQuestions])

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
        toast.error(res.error === "ALREADY_PUSHED" ? "Already used in this session" : "Failed to broadcast")
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

  function handleSelectSubject(subject: Subject) {
    setSelectedSubject(subject)
    setSearch("")
    setQuestions([])
    setPage(1)
  }

  // ── Shared header ──────────────────────────────────────────────────────────
  const sessionDate = new Date(initialSession.session_date + "T00:00:00")
    .toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })

  return (
    <div className="min-h-full bg-background pb-16">

      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 px-5 py-5 text-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Radio className="h-3.5 w-3.5 opacity-80" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Host Panel · {sessionDate}</span>
            </div>
            {selectedSubject && (
              <p className="text-lg font-black tracking-tight">{selectedSubject.name}</p>
            )}
          </div>
          <button
            onClick={handleToggleLive}
            disabled={isPending}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition-all active:scale-95",
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
          <div className="mx-auto max-w-5xl mt-2 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Session is live — students see each question the moment you broadcast it
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">

        {/* ── Step 1: Subject picker ── */}
        {!selectedSubject ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="font-bold">Pick today&apos;s subject</p>
              <span className="text-xs text-muted-foreground">— one subject per session</span>
            </div>

            {subjects.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                <p className="font-semibold text-muted-foreground">No subjects found</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Questions need to be added to the database before you can host a session.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSubject(s)}
                    className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-border bg-background p-4 text-left transition-all hover:border-amber-400/60 hover:bg-amber-50/50 active:scale-[0.98] dark:hover:bg-amber-950/20"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-sm font-bold leading-snug">{s.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

        ) : (
          /* ── Step 2: Question browser + right panel ── */
          <div className="grid gap-5 md:grid-cols-[1fr_300px]">

            {/* Left: question browser */}
            <div className="space-y-4">

              {/* Subject + back */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedSubject(null); setSearch(""); setQuestions([]) }}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Change subject
                </button>
                <span className="font-bold text-sm">{selectedSubject.name}</span>
                {total > 0 && <span className="text-xs text-muted-foreground">{total} questions</span>}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm outline-none ring-primary/40 focus:border-primary focus:ring-2"
                />
              </div>

              {/* Question list */}
              {loadingQ ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500/60" />
                </div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
                  <Search className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-muted-foreground">No questions found</p>
                  {search && <p className="text-xs text-muted-foreground">Try a different search term</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q) => {
                    const isCurrentQ = currentQuestion?.question.id === q.id
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "rounded-2xl border p-4 transition-colors",
                          isCurrentQ ? "border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20" : "bg-background hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0 space-y-2">
                            {q.year && (
                              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{q.year}</span>
                            )}
                            {isCurrentQ && (
                              <span className="ml-1.5 inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Live</span>
                            )}
                            <p className="text-sm leading-snug">
                              <InlineText text={q.text} />
                            </p>
                            {/* Show options preview */}
                            <div className="space-y-1 pt-1">
                              {q.options.sort((a, b) => a.label.localeCompare(b.label)).map((opt) => (
                                <div key={opt.id} className={cn(
                                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
                                  opt.is_correct
                                    ? "bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "text-muted-foreground"
                                )}>
                                  <span className="font-black w-3.5 shrink-0">{opt.label}.</span>
                                  <span className="flex-1 leading-snug"><InlineText text={opt.text} /></span>
                                  {opt.is_correct && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleBroadcast(q)}
                            disabled={isPending || isCurrentQ}
                            className={cn(
                              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 mt-1",
                              isCurrentQ
                                ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 cursor-default"
                                : isLive
                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                          >
                            {isCurrentQ
                              ? "Live"
                              : isPending
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <><Zap className="h-3 w-3" /> Push</>
                            }
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
                  <span>Page {page} of {Math.ceil(total / PER_PAGE)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchQuestions(selectedSubject.id, search, page - 1)}
                      disabled={page <= 1 || loadingQ}
                      className="rounded-xl border px-3 py-1.5 font-semibold hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => fetchQuestions(selectedSubject.id, search, page + 1)}
                      disabled={page >= Math.ceil(total / PER_PAGE) || loadingQ}
                      className="rounded-xl border px-3 py-1.5 font-semibold hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: current Q + answers + leaderboard */}
            <div className="space-y-4">

              {/* Current question */}
              <div className="rounded-2xl border bg-background p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Broadcasting Now</p>
                {currentQuestion ? (
                  <>
                    <p className="text-sm font-medium leading-relaxed">
                      <InlineText text={currentQuestion.question.text} />
                    </p>
                    <div className="space-y-1.5">
                      {currentQuestion.question.options.sort((a, b) => a.label.localeCompare(b.label)).map((opt) => (
                        <div key={opt.id} className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                          opt.is_correct
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-muted/50 text-muted-foreground"
                        )}>
                          <span className="font-black w-4 shrink-0">{opt.label}.</span>
                          <span className="flex-1 leading-snug"><InlineText text={opt.text} /></span>
                          {opt.is_correct && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    {isLive ? "Pick a question from the left and push it →" : "Go live first, then push a question."}
                  </p>
                )}
              </div>

              {/* Live answers */}
              {currentQuestion && (
                <div className="rounded-2xl border bg-background p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Answers</p>
                    <span className="text-xs text-muted-foreground">{answers.length}</span>
                  </div>
                  {answers.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">Waiting…</p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {answers.map((a) => (
                        <div key={a.id} className="flex items-center gap-2">
                          <Avatar name={a.user.name} url={a.user.avatar_url} />
                          <span className="flex-1 text-xs font-semibold truncate">{a.user.name}</span>
                          {a.is_correct
                            ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">+{a.points_awarded}pts</span>
                            : <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard */}
              <div className="rounded-2xl border bg-background p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leaderboard</p>
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
        )}
      </div>
    </div>
  )
}
