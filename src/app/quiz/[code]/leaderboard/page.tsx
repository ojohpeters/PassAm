import { getQuizLeaderboard, getPublicQuiz } from "@/actions/custom-quiz.actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Trophy, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props { params: { code: string } }

export default async function QuizLeaderboardPage({ params }: Props) {
  const [quizResult, lbResult] = await Promise.all([
    getPublicQuiz(params.code),
    getQuizLeaderboard(params.code),
  ])

  if (!lbResult.success) notFound()

  const { title, entries } = lbResult.data
  const itemCount = quizResult.success ? quizResult.data.items.length : 0

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-background p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-black">Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <Link
          href={`/quiz/${params.code}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          Take the Quiz →
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-12 text-center">
          <p className="font-bold text-muted-foreground">No completions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to finish!</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-background overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top {entries.length}</p>
          </div>
          <div className="divide-y">
            {(entries as { id: string; display_name: string; score: number; total: number; completed_at: string }[]).map((entry, idx) => {
              const rank = idx + 1
              const pct = itemCount > 0 ? Math.round((entry.score / itemCount) * 100) : 0
              return (
                <div key={entry.id} className={cn(
                  "flex items-center gap-4 px-4 py-3",
                  rank === 1 && "bg-amber-50/50 dark:bg-amber-950/10",
                  rank === 2 && "bg-muted/20",
                  rank === 3 && "bg-orange-50/30 dark:bg-orange-950/10",
                )}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {rank <= 3 ? (
                      <Medal className={cn(
                        "h-5 w-5",
                        rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-orange-600"
                      )} />
                    ) : (
                      <span className="text-sm font-black text-muted-foreground">{rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{entry.display_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.completed_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{entry.score}<span className="text-sm font-normal text-muted-foreground">/{entry.total}</span></p>
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
