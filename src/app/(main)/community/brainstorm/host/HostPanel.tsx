"use client"

import { useState, useEffect, useTransition, useCallback, useRef } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Radio, Square, ChevronLeft, ChevronRight, Search, Loader2, Zap,
  CheckCircle2, XCircle, Trophy, Users, BookOpen,
} from "lucide-react"
import {
  startLiveSession, endLiveSession,
  pushQuestion, getBrainstormQuestions,
  getSessionLeaderboard, getQuestionAnswers, getPushedQuestionById,
} from "@/actions/brainstorm.actions"
import type { PushedQuestion, LeaderboardEntry, GeneralQuestion } from "@/actions/brainstorm.actions"
import { InlineText } from "@/lib/parseInline"

type Session = { id: string; session_date: string; title: string | null; is_live: boolean }
type Subject = { id: string; name: string }
type Answer = {
  id: string; is_correct: boolean; points_awarded: number; answered_at: string
  user: { name: string; avatar_url: string | null }
}

const BATCH = 20
const MEDAL = ["🥇", "🥈", "🥉"]
const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-[11px] font-black text-white">
      {url
        ? <img src={url} alt={name} className="h-full w-full object-cover" />
        : name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
      }
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

  const [isLive, setIsLive] = useState(initialSession.is_live)
  const [currentQuestion, setCurrentQuestion] = useState<PushedQuestion | null>(initialQuestion)
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [answers, setAnswers] = useState(initialAnswers)

  // Ref so realtime callback always sees latest currentQuestion without re-subscribing
  const currentQuestionRef = useRef(currentQuestion)
  useEffect(() => { currentQuestionRef.current = currentQuestion }, [currentQuestion])

  // Broadcast channel ref so action handlers can send without depending on the effect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  // ── Subject selection ──────────────────────────────────────────────────────
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => {
    if (initialQuestion) {
      return subjects.find(s => s.id === initialQuestion.question.subject.id) ?? null
    }
    return null
  })

  // ── Question navigator ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [batch, setBatch] = useState<GeneralQuestion[]>([])
  const [batchPage, setBatchPage] = useState(1)
  const [totalQ, setTotalQ] = useState(0)
  const [localIdx, setLocalIdx] = useState(0)
  const [loadingQ, setLoadingQ] = useState(false)

  const fetchBatch = useCallback(async (subjectId: string, q: string, bPage: number, goToLast = false) => {
    setLoadingQ(true)
    const res = await getBrainstormQuestions(subjectId, q || undefined, bPage, BATCH)
    setBatch(res.questions)
    setTotalQ(res.total)
    setBatchPage(bPage)
    setLocalIdx(goToLast ? Math.max(0, res.questions.length - 1) : 0)
    setLoadingQ(false)
  }, [])

  useEffect(() => {
    if (!selectedSubject) return
    const t = setTimeout(() => fetchBatch(selectedSubject.id, search, 1, false), search ? 300 : 0)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject?.id, search, fetchBatch])

  const globalIndex = (batchPage - 1) * BATCH + localIdx
  const currentQ = batch[localIdx] ?? null

  function handlePrev() {
    if (loadingQ) return
    if (localIdx > 0) setLocalIdx(localIdx - 1)
    else if (batchPage > 1 && selectedSubject) fetchBatch(selectedSubject.id, search, batchPage - 1, true)
  }

  function handleNext() {
    if (loadingQ) return
    if (localIdx < batch.length - 1) setLocalIdx(localIdx + 1)
    else if (globalIndex + 1 < totalQ && selectedSubject) fetchBatch(selectedSubject.id, search, batchPage + 1, false)
  }

  // ── Broadcast channel — set up once, stable for the session ───────────────
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
    const ch = supabase.channel(`brainstorm:${initialSession.id}`)

    ch
      // Student submitted an answer — refresh leaderboard + answers feed
      .on("broadcast", { event: "answer_submitted" }, async () => {
        await refreshLeaderboard()
        const cq = currentQuestionRef.current
        if (cq) await refreshAnswers(cq.id)
      })
      .subscribe()

    channelRef.current = ch
    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [initialSession.id, refreshLeaderboard, refreshAnswers])

  // ── Session actions ────────────────────────────────────────────────────────
  function handleToggleLive() {
    startTransition(async () => {
      if (isLive) {
        const res = await endLiveSession(initialSession.id)
        if (!res.success) { toast.error("Failed to end session"); return }
        setIsLive(false)
        // Notify students the session ended
        channelRef.current?.send({ type: "broadcast", event: "session_ended", payload: {} })
        toast.success("Session ended")
      } else {
        const res = await startLiveSession(initialSession.id)
        if (!res.success) { toast.error("Failed to start session"); return }
        setIsLive(true)
        toast.success("Session is now live!")
      }
    })
  }

  function handleBroadcast() {
    if (!currentQ) return
    if (!isLive) { toast.error("Start the session first"); return }
    startTransition(async () => {
      const res = await pushQuestion(initialSession.id, currentQ.id)
      if (!res.success) {
        toast.error(res.error === "ALREADY_PUSHED" ? "Already used in this session" : "Failed to broadcast")
        return
      }
      const pushed = await getPushedQuestionById(res.data.id)
      if (pushed) {
        setCurrentQuestion(pushed)
        setAnswers([])
        // Notify all students a new question is live
        channelRef.current?.send({ type: "broadcast", event: "question_pushed", payload: {} })
      }
      toast.success("Question pushed to students!")
    })
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  const sessionDate = new Date(initialSession.session_date + "T00:00:00")
    .toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })
  const isCurrentQ = currentQuestion?.question.id === currentQ?.id

  return (
    <div className="min-h-full bg-background pb-16">

      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 px-5 py-5 text-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Radio className="h-3.5 w-3.5 opacity-80" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                Host Panel · {sessionDate}
              </span>
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
            Live — students see questions the moment you push them
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
            </div>
            {subjects.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                <p className="font-semibold text-muted-foreground">No subjects found</p>
                <p className="text-sm text-muted-foreground">Add questions to the database first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSubject(s); setSearch(""); setBatch([]); setLocalIdx(0) }}
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

            {/* Left: question navigator */}
            <div className="space-y-4">

              {/* Subject + search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => { setSelectedSubject(null); setBatch([]); setSearch("") }}
                  className="flex w-fit items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Change subject
                </button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search in ${selectedSubject.name}…`}
                    className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-primary/40 focus:border-primary focus:ring-2"
                  />
                </div>
              </div>

              {totalQ > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold">{selectedSubject.name}</span>
                  <span>{globalIndex + 1} of {totalQ}</span>
                </div>
              )}

              {/* Single question card */}
              {loadingQ ? (
                <div className="flex items-center justify-center rounded-2xl border bg-background py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500/60" />
                </div>
              ) : !currentQ ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
                  <Search className="h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-muted-foreground">No questions found</p>
                  {search && <p className="text-xs text-muted-foreground">Try a different search</p>}
                </div>
              ) : (
                <div className={cn(
                  "rounded-2xl border bg-background p-5 space-y-4 transition-colors",
                  isCurrentQ && "border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/10"
                )}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentQ.year && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{currentQ.year}</span>
                    )}
                    {isCurrentQ && (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">Currently Live</span>
                    )}
                  </div>

                  <p className="text-sm font-semibold leading-relaxed">
                    <InlineText text={currentQ.text} />
                  </p>

                  <div className="space-y-1.5">
                    {currentQ.options.sort((a, b) => a.label.localeCompare(b.label)).map((opt, i) => (
                      <div key={opt.id} className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm",
                        opt.is_correct
                          ? "bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-muted/40 text-muted-foreground"
                      )}>
                        <span className="font-black w-5 shrink-0 text-xs">{OPTION_LABELS[i]}.</span>
                        <span className="flex-1 leading-snug"><InlineText text={opt.text} /></span>
                        {opt.is_correct && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleBroadcast}
                    disabled={isPending || isCurrentQ || !isLive}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98]",
                      isCurrentQ
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 cursor-default"
                        : isLive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Pushing…</>
                      : isCurrentQ ? "Currently Live"
                      : isLive ? <><Zap className="h-4 w-4" /> Push to Students</>
                      : "Go Live first"
                    }
                  </button>
                </div>
              )}

              {/* Prev / Next */}
              {totalQ > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={loadingQ || globalIndex === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{globalIndex + 1} / {totalQ}</span>
                  <button
                    onClick={handleNext}
                    disabled={loadingQ || globalIndex + 1 >= totalQ}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: live status + answers + leaderboard */}
            <div className="space-y-4">

              {/* Broadcasting now */}
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
                    {isLive ? "Navigate to a question and push it →" : "Go live, then push a question."}
                  </p>
                )}
              </div>

              {/* Live answers feed */}
              {currentQuestion && (
                <div className="rounded-2xl border bg-background p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Answers</p>
                    <span className="text-xs text-muted-foreground">{answers.length} answered</span>
                  </div>
                  {answers.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">Waiting for answers…</p>
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
                        <span className="w-5 shrink-0 text-center text-sm">{MEDAL[i] ?? `${i + 1}.`}</span>
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
