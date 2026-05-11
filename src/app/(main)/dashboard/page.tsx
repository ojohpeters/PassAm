import { getDashboardStats } from "@/actions/analytics.actions"
import { getAttemptHistory } from "@/actions/exam.actions"
import { getStudentRank } from "@/actions/leaderboard.actions"
import { getAppUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDate, cn } from "@/lib/utils"

export default async function DashboardPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: schools } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .order("name")

  const [stats, history, rank] = await Promise.all([
    getDashboardStats(),
    getAttemptHistory(1, 5),
    getStudentRank(),
  ])

  const firstName = user.name.split(" ")[0]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        {(stats?.currentStreak ?? 0) > 0 && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
            🔥 {stats?.currentStreak} day streak
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Exams", value: stats?.totalAttempts ?? 0 },
          { label: "Avg. Score", value: `${stats?.averageScore ?? 0}%` },
          { label: "Best Streak", value: `${stats?.longestStreak ?? 0} days` },
          { label: "Weekly Rank", value: rank ? `#${rank.rank}` : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {stats?.dailyQuizReady && (
        <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-4">
          <div>
            <p className="font-semibold">Daily Quiz ready</p>
            <p className="text-sm text-muted-foreground">10 questions · ~5 mins</p>
          </div>
          <Link
            href="/daily-quiz"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Take Now
          </Link>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold">Start Practice Exam</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {(schools ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/exam/${s.abbreviation.toLowerCase()}`}
              className="rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              {s.name}
              <span className="ml-1 text-xs text-muted-foreground">({s.abbreviation})</span>
            </Link>
          ))}
        </div>
      </div>

      {history.success && history.data.attempts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Attempts</h2>
            <Link href="/analytics" className="text-sm text-primary">View all →</Link>
          </div>
          <div className="space-y-2">
            {history.data.attempts.map((a) => {
              const pct = Math.round((a.score / a.totalQuestions) * 100)
              return (
                <Link
                  key={a.id}
                  href={`/results/${a.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{a.school.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                  </div>
                  <span className={cn("font-bold", pct >= 50 ? "text-green-600" : "text-red-500")}>
                    {pct}%
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
