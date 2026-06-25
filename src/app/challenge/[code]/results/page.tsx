import { getChallengeResults } from "@/actions/challenge.actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Trophy, Clock, Swords, CheckCircle2, Hourglass, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const creator = participants.find((p) => p.is_creator)
  const challenger = participants.find((p) => !p.is_creator)
  const myParticipantId = searchParams.p

  const bothDone = creator?.completed_at && challenger?.completed_at
  let winner: typeof creator = undefined
  if (bothDone && creator && challenger) {
    if ((creator.score ?? 0) > (challenger.score ?? 0)) winner = creator
    else if ((challenger.score ?? 0) > (creator.score ?? 0)) winner = challenger
    // null = tie
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/challenge/${params.code}`

  return (
    <div className="min-h-screen bg-background pb-12">
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
            {bothDone ? (winner ? `${winner.display_name} wins! 🏆` : "It's a tie! 🤝") : "Results"}
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
            const isWinner = winner?.id === p.id
            const pct = p.score != null ? Math.round((p.score / challenge.num_questions) * 100) : null
            return (
              <div key={p.id} className={cn(
                "flex flex-col items-center rounded-2xl border-2 p-4 text-center",
                isWinner ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-background"
              )}>
                {isWinner && <Trophy className="mb-1 h-5 w-5 text-amber-500" />}
                <p className="text-xs font-bold text-muted-foreground truncate w-full text-center">
                  {p.display_name}
                  {p.is_creator && <span className="ml-1 text-amber-500">(you)</span>}
                </p>
                {p.completed_at ? (
                  <>
                    <p className="mt-2 text-3xl font-black text-foreground">{pct}%</p>
                    <p className="text-xs text-muted-foreground">{p.score}/{challenge.num_questions}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{fmtTime(p.time_taken_secs)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">
                      {p.started_at ? "In progress…" : "Not started"}
                    </p>
                  </>
                )}
                {p.completed_at && <CheckCircle2 className="mt-2 h-4 w-4 text-green-500" />}
              </div>
            )
          })}
        </div>

        {/* Not both done notice */}
        {!bothDone && (
          <div className="rounded-2xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground text-center">
            {!challenger
              ? "Waiting for your opponent to accept the challenge."
              : `Waiting for ${(!creator?.completed_at ? creator?.display_name : challenger?.display_name) ?? "opponent"} to finish.`}
          </div>
        )}

        {/* Question breakdown */}
        {bothDone && questions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Breakdown</p>
            <div className="space-y-2">
              {questions.map((q, i) => {
                const creatorAns = (creator?.answers as Record<string, string> | null)?.[q.id]
                const challengerAns = (challenger?.answers as Record<string, string> | null)?.[q.id]
                const creatorCorrect = creatorAns === q.correct_option_id
                const challengerCorrect = challengerAns === q.correct_option_id
                return (
                  <div key={q.id} className="rounded-xl border bg-background p-3 space-y-1.5">
                    <p className="text-xs text-muted-foreground font-semibold">Q{i + 1}</p>
                    <p className="text-xs leading-relaxed line-clamp-2">{q.text}</p>
                    <div className="flex gap-4 text-xs">
                      <span className={cn("font-semibold", creatorCorrect ? "text-green-600" : "text-red-500")}>
                        {creator?.display_name?.split(" ")[0]}: {creatorAns ? q.options.find(o => o.id === creatorAns)?.label ?? "—" : "—"} {creatorCorrect ? "✓" : "✗"}
                      </span>
                      {challenger && (
                        <span className={cn("font-semibold", challengerCorrect ? "text-green-600" : "text-red-500")}>
                          {challenger.display_name?.split(" ")[0]}: {challengerAns ? q.options.find(o => o.id === challengerAns)?.label ?? "—" : "—"} {challengerCorrect ? "✓" : "✗"}
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
            <Link
              href="/dashboard"
              className="text-center text-xs text-muted-foreground underline underline-offset-2"
            >
              Back to dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
