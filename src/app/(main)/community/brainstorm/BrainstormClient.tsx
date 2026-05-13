"use client"

import { useState, useEffect, useTransition, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Radio, Trophy, Loader2, Zap, CheckCircle2, XCircle, Clock } from "lucide-react"
import {
  getCurrentQuestion,
  getSessionLeaderboard,
  submitBrainstormAnswer,
  getLiveSession,
  getUserAnswerForPushedQuestion,
} from "@/actions/brainstorm.actions"
import type { PushedQuestion, LeaderboardEntry, MyBrainstormAnswer } from "@/actions/brainstorm.actions"
import { InlineText } from "@/lib/parseInline"

type LiveSession = { id: string; session_date: string; title: string | null; is_live: boolean; created_by: string | null }

const RANK_STYLES: Record<number, { bg: string; border: string; medal: string }> = {
  1: { bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-l-4 border-l-yellow-400", medal: "🥇" },
  2: { bg: "bg-slate-50 dark:bg-slate-900/30",   border: "border-l-4 border-l-slate-400",  medal: "🥈" },
  3: { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-l-4 border-l-orange-400", medal: "🥉" },
}

const OPTION_LABELS = ["A", "B", "C", "D", "E"]

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-black text-white">
      {url
        ? <img src={url} alt={name} className="h-full w-full object-cover" />
        : name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
      }
    </div>
  )
}

function PointsBadge({ points }: { points: number }) {
  if (points === 10) return <span className="rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-[11px] font-black text-yellow-700 dark:text-yellow-300">🥇 +10 pts</span>
  if (points === 5)  return <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">🥈 +5 pts</span>
  if (points === 2)  return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-black text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">🥉 +2 pts</span>
  return <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">0 pts</span>
}

export function BrainstormClient({
  userId,
  initialSession,
  initialQuestion,
  initialLeaderboard,
  initialMyAnswer,
}: {
  userId: string
  initialSession: LiveSession | null
  initialQuestion: PushedQuestion | null
  initialLeaderboard: LeaderboardEntry[]
  initialMyAnswer: MyBrainstormAnswer | null
}) {
  const [session, setSession] = useState<LiveSession | null>(initialSession)
  const [currentQuestion, setCurrentQuestion] = useState<PushedQuestion | null>(initialQuestion)
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [myAnswer, setMyAnswer] = useState<MyBrainstormAnswer | null>(initialMyAnswer)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Ref to the broadcast channel so handleSubmit can send without re-renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  const refreshLeaderboard = useCallback(async (sessionId: string) => {
    const lb = await getSessionLeaderboard(sessionId)
    setLeaderboard(lb)
  }, [])

  // ── Broadcast channel — primary realtime mechanism ─────────────────────────
  // Subscribe whenever we have a live session ID
  useEffect(() => {
    if (!session?.id) return

    const supabase = createClient()
    const ch = supabase.channel(`brainstorm:${session.id}`)

    ch
      // Host pushed a new question
      .on("broadcast", { event: "question_pushed" }, async () => {
        const q = await getCurrentQuestion(session.id)
        if (q) {
          setCurrentQuestion(q)
          setMyAnswer(null)
          setSelectedOption(null)
        }
      })
      // Someone answered — refresh leaderboard
      .on("broadcast", { event: "answer_submitted" }, async () => {
        await refreshLeaderboard(session.id)
      })
      // Host ended the session
      .on("broadcast", { event: "session_ended" }, () => {
        setSession(prev => prev ? { ...prev, is_live: false } : prev)
      })
      .subscribe()

    channelRef.current = ch
    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [session?.id, refreshLeaderboard])

  // ── Poll for a live session when there isn't one yet ──────────────────────
  useEffect(() => {
    if (session?.is_live) return
    const interval = setInterval(async () => {
      const live = await getLiveSession()
      if (live) {
        setSession(live)
        const [q, lb] = await Promise.all([
          getCurrentQuestion(live.id),
          getSessionLeaderboard(live.id),
        ])
        setCurrentQuestion(q)
        setLeaderboard(lb)
        setMyAnswer(null)
        setSelectedOption(null)
      }
    }, 6000)
    return () => clearInterval(interval)
  }, [session?.is_live])

  // ── Answer submission ──────────────────────────────────────────────────────
  function handleSubmit(optionId: string) {
    if (myAnswer || isPending) return
    setSelectedOption(optionId)
    startTransition(async () => {
      if (!currentQuestion) return
      const res = await submitBrainstormAnswer(currentQuestion.id, optionId)
      if (!res.success) {
        if (res.error === "ALREADY_ANSWERED") {
          const existing = await getUserAnswerForPushedQuestion(currentQuestion.id)
          setMyAnswer(existing)
        } else {
          toast.error("Failed to submit — try again")
          setSelectedOption(null)
        }
        return
      }
      setMyAnswer({
        id: "pending",
        selected_option_id: optionId,
        is_correct: res.data.isCorrect,
        points_awarded: res.data.pointsAwarded,
      })
      // Broadcast so host + other students refresh leaderboard instantly
      channelRef.current?.send({
        type: "broadcast",
        event: "answer_submitted",
        payload: {},
      })
      if (res.data.isCorrect) {
        toast.success(res.data.pointsAwarded > 0 ? `Correct! +${res.data.pointsAwarded} pts` : "Correct!")
      } else {
        toast.error("Wrong answer")
      }
    })
  }

  // ── No live session ────────────────────────────────────────────────────────
  if (!session?.is_live) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-5 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h2 className="font-black text-lg">No live session right now</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            When a host starts a session, questions will appear here instantly.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 dark:bg-amber-950/20">
          <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Checking every 6 seconds…</span>
        </div>
      </div>
    )
  }

  const options = currentQuestion?.question.options ?? []
  const answered = myAnswer !== null

  return (
    <div className="space-y-4 p-4 pb-8 md:p-6">

      {/* Session live badge */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          LIVE
        </span>
        {session.title && <span className="text-sm font-semibold text-muted-foreground">{session.title}</span>}
        <span className="ml-auto text-xs text-muted-foreground">{leaderboard.length} participant{leaderboard.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Question card */}
      {!currentQuestion ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/20 py-12 text-center">
          <Zap className="h-8 w-8 text-amber-400 animate-bounce" />
          <p className="font-bold">Waiting for the first question…</p>
          <p className="text-sm text-muted-foreground">It will appear here the moment the host pushes it.</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-background shadow-sm">
          {/* Question header */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {currentQuestion.question.subject.name}
            </span>
            {currentQuestion.question.year && (
              <span className="text-xs text-muted-foreground">{currentQuestion.question.year}</span>
            )}
            <span className="ml-auto text-xs font-semibold text-muted-foreground">Q{currentQuestion.push_order}</span>
          </div>

          {/* Question text */}
          <div className="px-4 py-4">
            <p className="font-semibold leading-relaxed">
              <InlineText text={currentQuestion.question.text} />
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2 px-4 pb-4">
            {options.map((opt, i) => {
              const isSelected = selectedOption === opt.id || myAnswer?.selected_option_id === opt.id
              const isCorrect = opt.is_correct
              const showResult = answered

              let optStyle = "border bg-background hover:bg-muted/50 active:scale-[0.99]"
              if (showResult) {
                if (isCorrect) optStyle = "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                else if (isSelected) optStyle = "border-2 border-rose-400 bg-rose-50 dark:bg-rose-950/30"
                else optStyle = "border bg-muted/30 opacity-50"
              } else if (isSelected) {
                optStyle = "border-2 border-primary bg-primary/5"
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSubmit(opt.id)}
                  disabled={answered || isPending}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all",
                    optStyle,
                    !answered && !isPending && "cursor-pointer"
                  )}
                >
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors",
                    showResult && isCorrect ? "bg-emerald-500 text-white" :
                    showResult && isSelected && !isCorrect ? "bg-rose-400 text-white" :
                    isSelected ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="flex-1 text-sm font-medium leading-snug">
                    <InlineText text={opt.text} />
                  </span>
                  {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0 text-rose-400" />}
                  {isPending && isSelected && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
                </button>
              )
            })}
          </div>

          {/* Result feedback */}
          {myAnswer && (
            <div className={cn(
              "mx-4 mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3",
              myAnswer.is_correct ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"
            )}>
              <div className="flex items-center gap-2">
                {myAnswer.is_correct
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : <XCircle className="h-5 w-5 text-rose-400" />
                }
                <span className={cn(
                  "text-sm font-bold",
                  myAnswer.is_correct ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"
                )}>
                  {myAnswer.is_correct ? "Correct!" : "Wrong answer"}
                </span>
              </div>
              <PointsBadge points={myAnswer.points_awarded} />
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="rounded-2xl border bg-background">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-sm">Session Leaderboard</span>
          </div>
          <div className="divide-y">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1
              const style = RANK_STYLES[rank]
              const isMe = entry.user_id === userId
              return (
                <div key={entry.user_id} className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  style?.bg, style?.border,
                  isMe && !style?.bg && "bg-amber-50/40 dark:bg-amber-950/10"
                )}>
                  <div className="flex w-7 shrink-0 items-center justify-center">
                    {style ? <span className="text-lg leading-none">{style.medal}</span> : <span className="text-xs font-black text-muted-foreground">#{rank}</span>}
                  </div>
                  <Avatar name={entry.user.name} url={entry.user.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {entry.user.name}
                      {isMe && <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">(you)</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{entry.correct_answers} correct</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-1 dark:bg-amber-900/30">
                    <span className="text-sm font-black text-amber-700 dark:text-amber-300">{entry.total_points}</span>
                    <span className="text-[10px] font-semibold text-amber-600/60 dark:text-amber-400/60">pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {leaderboard.length === 0 && currentQuestion && !answered && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
          Be the first to answer correctly — earn <strong className="text-foreground">10 points!</strong>
        </div>
      )}
    </div>
  )
}
