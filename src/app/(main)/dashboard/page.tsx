import { getDashboardStats } from "@/actions/analytics.actions"
import { getAttemptHistory } from "@/actions/exam.actions"
import { getStudentRank } from "@/actions/leaderboard.actions"
import { getAppUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDate, cn } from "@/lib/utils"
import { BookOpen, TrendingUp, Flame, Trophy, ChevronRight } from "lucide-react"

const SCHOOL_CFG: Record<string, { grad: string; abbrevColor: string }> = {
  UNILAG:  { grad: "from-blue-600 to-blue-900",     abbrevColor: "text-blue-200"    },
  OAU:     { grad: "from-orange-500 to-orange-800", abbrevColor: "text-orange-200"  },
  UI:      { grad: "from-violet-600 to-violet-900", abbrevColor: "text-violet-200"  },
  UNIBEN:  { grad: "from-emerald-600 to-emerald-900", abbrevColor: "text-emerald-200" },
  UNIPORT: { grad: "from-cyan-600 to-cyan-900",     abbrevColor: "text-cyan-200"    },
  AFIT:    { grad: "from-rose-600 to-rose-900",     abbrevColor: "text-rose-200"    },
}
const DEFAULT_CFG = { grad: "from-slate-600 to-slate-900", abbrevColor: "text-slate-200" }

function greeting(name: string) {
  const h = (new Date().getUTCHours() + 1) % 24 // WAT
  if (h < 12) return `Good morning, ${name} 🌅`
  if (h < 17) return `Good afternoon, ${name} ☀️`
  return `Good evening, ${name} 🌙`
}

export default async function DashboardPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: schools } = await admin.from("schools").select("id, name, abbreviation").order("name")

  const [stats, history, rank] = await Promise.all([
    getDashboardStats(),
    getAttemptHistory(1, 5),
    getStudentRank(),
  ])

  const firstName = user.name.split(" ")[0]
  const streak    = stats?.currentStreak  ?? 0
  const avgScore  = stats?.averageScore   ?? 0
  const totalAttempts  = stats?.totalAttempts ?? 0
  const longestStreak  = stats?.longestStreak ?? 0

  return (
    <div className="min-h-full space-y-5 p-4 pb-10 md:p-6 md:pb-10">

      {/* ── Greeting ── */}
      <div className="dash-in" style={{ animationDelay: "0ms" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm text-muted-foreground">{greeting(firstName)}</p>
            <h1 className="text-2xl font-black tracking-tight leading-tight md:text-3xl">
              {totalAttempts > 0
                ? `${totalAttempts} exam${totalAttempts !== 1 ? "s" : ""} done. Keep pushing.`
                : "Ready to start practicing?"}
            </h1>
          </div>

          {streak > 0 && (
            <div className="shrink-0 flex flex-col items-center rounded-2xl border border-orange-200/60 bg-orange-50 px-3 py-2 dark:border-orange-800/40 dark:bg-orange-950/40">
              <span className="text-2xl leading-none">🔥</span>
              <span className="mt-0.5 text-lg font-black leading-none text-orange-600 dark:text-orange-400">{streak}</span>
              <span className="text-[10px] font-semibold text-orange-500">day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Quiz CTA ── */}
      {stats?.dailyQuizReady && (
        <div className="dash-in" style={{ animationDelay: "80ms" }}>
          <Link
            href="/daily-quiz"
            className="group block overflow-hidden rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform duration-150"
          >
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl shrink-0">
                  ⚡
                </div>
                <div>
                  <p className="font-bold text-white text-sm md:text-base">Daily Quiz ready!</p>
                  <p className="text-xs text-white/70">10 questions · ~5 mins</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white transition-colors group-hover:bg-white/30">
                Start <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="dash-in" style={{ animationDelay: "150ms" }}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              label: "Total Exams",
              value: totalAttempts,
              Icon: BookOpen,
              iconColor: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-950/40",
              border: "border-blue-100 dark:border-blue-900/40",
              iconBg: "bg-blue-100 dark:bg-blue-900/50",
            },
            {
              label: "Avg Score",
              value: `${avgScore}%`,
              Icon: TrendingUp,
              iconColor: avgScore >= 50 ? "text-emerald-500" : "text-rose-500",
              bg: avgScore >= 50 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40",
              border: avgScore >= 50 ? "border-emerald-100 dark:border-emerald-900/40" : "border-rose-100 dark:border-rose-900/40",
              iconBg: avgScore >= 50 ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-rose-100 dark:bg-rose-900/50",
            },
            {
              label: "Best Streak",
              value: `${longestStreak}d`,
              Icon: Flame,
              iconColor: "text-orange-500",
              bg: "bg-orange-50 dark:bg-orange-950/40",
              border: "border-orange-100 dark:border-orange-900/40",
              iconBg: "bg-orange-100 dark:bg-orange-900/50",
            },
            {
              label: "Weekly Rank",
              value: rank ? `#${rank.rank}` : "—",
              Icon: Trophy,
              iconColor: "text-yellow-500",
              bg: "bg-yellow-50 dark:bg-yellow-950/40",
              border: "border-yellow-100 dark:border-yellow-900/40",
              iconBg: "bg-yellow-100 dark:bg-yellow-900/50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-2xl border p-4 transition-all duration-200 hover:shadow-md active:scale-[0.97]",
                s.bg, s.border
              )}
            >
              <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", s.iconBg)}>
                <s.Icon className={cn("h-4 w-4", s.iconColor)} />
              </div>
              <p className="text-2xl font-black tracking-tight">{s.value}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Practice Exam ── */}
      <div className="dash-in space-y-3" style={{ animationDelay: "220ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Practice Exam</h2>
          <span className="text-xs text-muted-foreground">{schools?.length ?? 0} schools</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(schools ?? []).map((s, i) => {
            const cfg = SCHOOL_CFG[s.abbreviation] ?? DEFAULT_CFG
            return (
              <Link
                key={s.id}
                href={`/exam/${s.abbreviation.toLowerCase()}`}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-px shadow-sm",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]",
                  cfg.grad
                )}
                style={{ animationDelay: `${220 + i * 40}ms` }}
              >
                <div className="flex h-[88px] flex-col justify-between rounded-[calc(1rem-1px)] bg-gradient-to-br from-black/20 to-black/55 p-3">
                  <span className={cn("text-2xl font-black tracking-tighter leading-none", cfg.abbrevColor)}>
                    {s.abbreviation}
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-white/80 line-clamp-2">
                    {s.name}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Recent Attempts ── */}
      {history.success && history.data.attempts.length > 0 ? (
        <div className="dash-in space-y-3" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Recent Attempts</h2>
            <Link href="/analytics" className="flex items-center gap-0.5 text-xs font-semibold text-primary">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {history.data.attempts.map((a, i) => {
              const pct  = Math.round((a.score / a.totalQuestions) * 100)
              const pass = pct >= 50
              return (
                <Link
                  key={a.id}
                  href={`/results/${a.id}`}
                  className="group flex items-center gap-3 rounded-2xl border bg-background p-3 transition-all duration-200 hover:border-primary/30 hover:bg-accent/30 active:scale-[0.99]"
                  style={{ animationDelay: `${300 + i * 50}ms` }}
                >
                  {/* Score badge */}
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl",
                      pass
                        ? "bg-emerald-50 dark:bg-emerald-950/50"
                        : "bg-rose-50 dark:bg-rose-950/50"
                    )}
                  >
                    <span className={cn("text-base font-black leading-none", pass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {pct}
                    </span>
                    <span className={cn("text-[9px] font-bold leading-none opacity-60", pass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      %
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.school.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        pass
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                      )}
                    >
                      {pass ? "PASS" : "FAIL"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="dash-in" style={{ animationDelay: "300ms" }}>
          <div className="rounded-2xl border-2 border-dashed border-border/60 bg-accent/20 px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
              📚
            </div>
            <p className="font-bold">No exams yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Pick a school above to start your first practice</p>
          </div>
        </div>
      )}

    </div>
  )
}
