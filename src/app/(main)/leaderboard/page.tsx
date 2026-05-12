import { getLeaderboard, getDailyLeaderboard } from "@/actions/leaderboard.actions"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { school?: string; tab?: string }
}) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const tab = searchParams.tab === "daily" ? "daily" : "weekly"

  const admin = createAdminClient()
  const { data: schools } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .order("name")

  const [weeklyBoard, dailyBoard] = await Promise.all([
    getLeaderboard(searchParams.school),
    getDailyLeaderboard(),
  ])

  const board = tab === "daily" ? dailyBoard : weeklyBoard
  const MEDALS = ["🥇", "🥈", "🥉"]

  const todayLabel = new Date().toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" })

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            {tab === "daily"
              ? `Daily quiz rankings · ${todayLabel}`
              : "Weekly rankings · resets every Monday"}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 w-fit">
        {(["weekly", "daily"] as const).map((t) => {
          const params = new URLSearchParams()
          if (searchParams.school) params.set("school", searchParams.school)
          if (t !== "weekly") params.set("tab", t)
          return (
            <Link
              key={t}
              href={`/leaderboard${params.toString() ? `?${params}` : ""}`}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-all",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "weekly" ? "Weekly" : "Daily Quiz"}
            </Link>
          )
        })}
      </div>

      {/* School filter (weekly only) */}
      {tab === "weekly" && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/leaderboard"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              !searchParams.school ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
            )}
          >
            All schools
          </Link>
          {(schools ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/leaderboard?school=${s.id}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                searchParams.school === s.id
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted"
              )}
            >
              {s.abbreviation}
            </Link>
          ))}
        </div>
      )}

      {board.success && board.data.length > 0 ? (
        <div className="rounded-xl border overflow-hidden">
          {board.data.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center gap-4 border-b p-4 last:border-0",
                entry.isCurrentUser && "bg-primary/5"
              )}
            >
              <span className={cn("w-8 shrink-0 text-center font-mono font-bold", entry.rank <= 3 && "text-lg")}>
                {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
              </span>
              <span className="flex-1 font-medium">
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </span>
              <div className="text-right">
                <span className="font-bold block">{entry.totalScore} pts</span>
                {tab === "weekly" && (
                  <span className="text-xs text-muted-foreground">
                    {entry.attempts} exam{entry.attempts !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {tab === "daily"
            ? "No daily quiz completions yet today. Be the first on the board!"
            : "No attempts this week yet. Be the first on the board!"}
        </p>
      )}
    </div>
  )
}
