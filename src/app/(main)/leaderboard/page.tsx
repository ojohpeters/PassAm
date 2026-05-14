import { getLeaderboard, getDailyLeaderboard } from "@/actions/leaderboard.actions"
import { getDrillLeaderboard } from "@/actions/drill.actions"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata = { title: "Leaderboard — PrepIQ" }

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${s}s`
  return `${m}m ${sec.toString().padStart(2, "0")}s`
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { school?: string; tab?: string }
}) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const rawTab = searchParams.tab
  const tab = rawTab === "daily" ? "daily" : rawTab === "drill" ? "drill" : "weekly"

  const admin = createAdminClient()
  const { data: schools } = await admin.from("schools").select("id, name, abbreviation").order("name")

  const [weeklyBoard, dailyBoard, drillBoard] = await Promise.all([
    getLeaderboard(searchParams.school),
    getDailyLeaderboard(),
    getDrillLeaderboard(tab === "drill" ? searchParams.school : undefined),
  ])

  const MEDALS = ["🥇", "🥈", "🥉"]
  const todayLabel = new Date().toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" })

  function buildTabUrl(t: string, school?: string) {
    const p = new URLSearchParams()
    if (school) p.set("school", school)
    if (t !== "weekly") p.set("tab", t)
    return `/leaderboard${p.toString() ? `?${p}` : ""}`
  }

  return (
    <div className="space-y-6 p-4 pb-12 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            {tab === "daily"
              ? `Daily quiz · ${todayLabel}`
              : tab === "drill"
              ? `Timed drill · ${todayLabel}`
              : "Weekly exam rankings · resets every Monday"}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 w-fit">
        {(["weekly", "daily", "drill"] as const).map((t) => (
          <Link
            key={t}
            href={buildTabUrl(t, searchParams.school)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all capitalize",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "drill" && <Zap className="h-3.5 w-3.5 text-orange-500" />}
            {t === "weekly" ? "Weekly" : t === "daily" ? "Daily Quiz" : "Drill"}
          </Link>
        ))}
      </div>

      {/* School filter (weekly + drill) */}
      {(tab === "weekly" || tab === "drill") && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildTabUrl(tab)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              !searchParams.school ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
            )}
          >
            All schools
          </Link>
          {(schools ?? []).map((s) => (
            <Link
              key={s.id}
              href={buildTabUrl(tab, s.abbreviation)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                searchParams.school === s.abbreviation
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted"
              )}
            >
              {s.abbreviation}
            </Link>
          ))}
        </div>
      )}

      {/* ── Weekly / Daily board ── */}
      {tab !== "drill" && (() => {
        const board = tab === "daily" ? dailyBoard : weeklyBoard
        if (!board.success || board.data.length === 0) {
          return (
            <p className="py-12 text-center text-muted-foreground">
              {tab === "daily"
                ? "No daily quiz completions yet today. Be the first on the board!"
                : "No attempts this week yet. Be the first on the board!"}
            </p>
          )
        }
        return (
          <div className="rounded-xl border overflow-hidden">
            {board.data.map((entry) => (
              <div
                key={entry.userId}
                className={cn("flex items-center gap-4 border-b p-4 last:border-0", entry.isCurrentUser && "bg-primary/5")}
              >
                <span className={cn("w-8 shrink-0 text-center font-mono font-bold", entry.rank <= 3 && "text-lg")}>
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span className="flex-1 font-medium">
                  {entry.name}
                  {entry.isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                </span>
                <div className="text-right">
                  <span className="font-bold block">{entry.totalScore} pts</span>
                  {tab === "weekly" && (
                    <span className="text-xs text-muted-foreground">{entry.attempts} exam{entry.attempts !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* ── Drill board ── */}
      {tab === "drill" && (() => {
        if (!drillBoard.success || drillBoard.data.length === 0) {
          return (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Zap className="h-8 w-8 text-orange-400" />
              <p className="text-muted-foreground">No drill completions yet today. Be first!</p>
              <Link
                href="/drill"
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
              >
                Start Today&apos;s Drill
              </Link>
            </div>
          )
        }
        return (
          <div className="rounded-xl border overflow-hidden">
            {drillBoard.data.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 border-b p-4 last:border-0",
                  entry.isCurrentUser && "bg-orange-50/60 dark:bg-orange-950/10"
                )}
              >
                <span className={cn("w-8 shrink-0 text-center font-mono font-bold", entry.rank <= 3 && "text-lg")}>
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
                </span>

                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-xs font-black text-white">
                  {entry.avatarUrl
                    ? <img src={entry.avatarUrl} alt={entry.name} className="h-full w-full object-cover" />
                    : entry.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {entry.name}
                    {entry.isCurrentUser && <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.schoolKey} · {entry.totalAnswered} answered · {formatMs(entry.timeUsedMs)}
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-orange-100 px-3 py-1 dark:bg-orange-900/30">
                  <span className="text-sm font-black text-orange-700 dark:text-orange-300">{entry.score}</span>
                  <span className="text-[10px] font-semibold text-orange-600/60 dark:text-orange-400/60">pts</span>
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
