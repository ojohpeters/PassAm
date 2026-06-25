export const dynamic = "force-dynamic"

import { getChallengeResults } from "@/actions/challenge.actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Trophy, Clock, Swords, CheckCircle2, Hourglass, Share2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResultsPoller } from "./ResultsPoller"

function fmtTime(secs: number | null) {
  if (secs == null) return "—"
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

export default async function ChallengeResultsPage({
  params,
  searchParams,
}: {
  params: { code: string }
  searchParams: { p?: string }
}) {
  const result = await getChallengeResults(params.code)
  if (!result.success) notFound()

  const { challenge, participants, questions } = result.data
  const creator    = participants.find((p) => p.is_creator)
  const challenger = participants.find((p) => !p.is_creator)
  const myParticipantId = searchParams.p

  // Use challenge.status as the authoritative "both done" signal
  // to avoid race conditions where one player's completed_at was cached
  const bothDone =
    challenge.status === "completed" ||
    !!(creator?.completed_at && challenger?.completed_at)

  let winner: typeof creator = undefined
  if (bothDone && creator && challenger) {
    if ((creator.score ?? 0) > (challenger.score ?? 0)) winner = creator
    else if ((challenger.score ?? 0) > (creator.score ?? 0)) winner = challenger
  }

  const mySlot = participants.find((p) => p.id === myParticipantId)

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Auto-refresh until both done */}
      <ResultsPoller bothDone={bothDone} />

      {/* Header */}
      <div className={cn(
        "px-5 py-8 text-white",
        bothDone
          ? "bg-gradient-to-br from-green-600 to-emerald-700"
          : "bg-gradient-to-br from-amber-500 to-orange-600"
      )}>
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            <Swords className="h-3.5 w-3.5" />
            1v1 Challenge · {params.code.toUpperCase()}
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {bothDone
              ? winner
                ? mySlot?.id === winner.id ? "You win! 🏆" : `${winner.display_name} wins! 🏆`
                : "It's a tie! 🤝"
              : mySlot?.completed_at
                ? "Your score is in!"
                : "Results"}
          </h1>
          <p className="mt-1 text-sm text-white/80">{challenge.subject_name}</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-6">

        {/* Score cards */}
        <div className="grid grid-cols-2 gap-3">
          {[creator, challenger].map((p, i) => {
            if (!p && i === 1) return (
              <div key="empty" className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-4 text-center">
                <Hourglass className="mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Waiting for opponent</p>
              </div>
            )
            if (!p) return null
            const isWinner  = bothDone && winner?.id === p.id
            const isMe      = p.id === myParticipantId
            const pct       = p.score != null ? Math.round((p.score / challenge.num_questions) * 100) : null
            return (
              <div key={p.id} className={cn(
                "flex flex-col items-center rounded-2xl border-2 p-4 text-center",
                isWinner
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                  : isMe && p.completed_at
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-background"
              )}>
                {isWinner && <Trophy className="mb-1 h-5 w-5 text-amber-500" />}
                <p className="text-xs font-bold text-muted-foreground truncate w-full text-center">
                  {isMe ? "You" : p.display_name}
                </p>
                {p.completed_at ? (
                  <>
                    <p className="mt-2 text-3xl font-black text-foreground">{pct}%</p>
                    <p className="text-xs text-muted-foreground">{p.score}/{challenge.num_questions}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{fmtTime(p.time_taken_secs)}
                    </p>
                    <CheckCircle2 className="mt-2 h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <div className="mt-3 flex flex-col items-center gap-1.5">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {p.started_at ? "Playing…" : "Not started"}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Status notice */}
        {!bothDone && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            {!challenger
              ? "Waiting for your opponent to join."
              : mySlot?.completed_at
                ? `Waiting for ${(!creator?.completed_at ? creator?.display_name : challenger?.display_name) ?? "opponent"} to finish…`
                : "Finish your game to see the final result."}
          </div>
        )}

        {/* Question breakdown — only show when both done */}
        {bothDone && questions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Breakdown</p>
            <div className="space-y-2">
              {questions.map((q, i) => {
                const creatorAns    = (creator?.answers as Record<string, string> | null)?.[q.id]
                const challengerAns = (challenger?.answers as Record<string, string> | null)?.[q.id]
                const creatorCorrect    = creatorAns === q.correct_option_id
                const challengerCorrect = challengerAns === q.correct_option_id
                return (
                  <div key={q.id} className="rounded-xl border bg-background p-3 space-y-1.5">
                    <p className="text-xs text-muted-foreground font-semibold">Q{i + 1}</p>
                    <p className="text-xs leading-relaxed line-clamp-2">{q.text}</p>
                    <div className="flex gap-4 text-xs">
                      <span className={cn("font-semibold", creatorCorrect ? "text-green-600" : "text-red-500")}>
                        {creator?.id === myParticipantId ? "You" : creator?.display_name?.split(" ")[0]}: {creatorAns ? q.options.find(o => o.id === creatorAns)?.label ?? "—" : "—"} {creatorCorrect ? "✓" : "✗"}
                      </span>
                      {challenger && (
                        <span className={cn("font-semibold", challengerCorrect ? "text-green-600" : "text-red-500")}>
                          {challenger.id === myParticipantId ? "You" : challenger.display_name?.split(" ")[0]}: {challengerAns ? q.options.find(o => o.id === challengerAns)?.label ?? "—" : "—"} {challengerCorrect ? "✓" : "✗"}
                        </span>
                      )}
                      <span className="ml-auto text-muted-foreground">Ans: {q.correct_label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/challenge/${params.code}`}
            className="flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold text-foreground hover:bg-muted"
          >
            <Share2 className="h-4 w-4" />
            Share this challenge
          </Link>
          <Link
            href="/challenge/create"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-sm shadow-primary/30 hover:opacity-90"
          >
            <Swords className="h-4 w-4" />
            Create your own challenge
          </Link>
          {myParticipantId && (
            <Link href="/dashboard" className="text-center text-xs text-muted-foreground underline underline-offset-2">
              Back to dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
