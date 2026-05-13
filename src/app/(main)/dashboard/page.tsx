import { getDashboardStats } from "@/actions/analytics.actions"
import { getAttemptHistory } from "@/actions/exam.actions"
import { getStudentRank } from "@/actions/leaderboard.actions"
import { getLatestTips } from "@/actions/tips.actions"
import { isBrainstormHost } from "@/actions/brainstorm.actions"
import { getAppUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDate, cn } from "@/lib/utils"
import { BookOpen, TrendingUp, Flame, Trophy, ChevronRight, Globe, Lightbulb, ExternalLink, Radio } from "lucide-react"
import { NotificationBanner } from "@/components/dashboard/NotificationBanner"

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
  if (user.role === "ADMIN") redirect("/admin")

  const admin = createAdminClient()
  const { data: schools } = await admin.from("schools").select("id, name, abbreviation").order("name")

  const [stats, history, rank, { data: unreadNotifs }, latestTips, isHost] = await Promise.all([
    getDashboardStats(),
    getAttemptHistory(1, 5),
    getStudentRank(),
    admin
      .from("notifications")
      .select("id, title, body")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(3),
    getLatestTips(2),
    isBrainstormHost(),
  ])

  const firstName = user.name.split(" ")[0]
  const streak    = stats?.currentStreak  ?? 0
  const avgScore  = stats?.averageScore   ?? 0
  const totalAttempts  = stats?.totalAttempts ?? 0
  const longestStreak  = stats?.longestStreak ?? 0

  return (
    <div className="min-h-full space-y-5 p-4 pb-10 md:p-6 md:pb-10">

      {/* ── Admin broadcast notifications ── */}
      {(unreadNotifs ?? []).length > 0 && (
        <div className="dash-in" style={{ animationDelay: "0ms" }}>
          <NotificationBanner notifications={unreadNotifs ?? []} />
        </div>
      )}

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

      {/* ── Brainstorm Host widget ── */}
      {isHost && (
        <div className="dash-in" style={{ animationDelay: "60ms" }}>
          <Link
            href="/community/brainstorm/host"
            className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Radio className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-sm">You&apos;re a Brainstorm Host</p>
              <p className="text-xs text-white/70">Open your host panel to run today&apos;s session</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}

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
          {(schools ?? []).filter((s) => s.abbreviation !== "GENERAL").map((s, i) => {
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

          {/* General Practice card */}
          <Link
            href="/exam/general"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 p-px shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
          >
            <div className="flex h-[88px] flex-col justify-between rounded-[calc(1rem-1px)] bg-gradient-to-br from-black/20 to-black/55 p-3">
              <Globe className="h-5 w-5 text-slate-300" />
              <span className="text-[11px] font-semibold leading-tight text-white/80">
                General Practice
              </span>
            </div>
          </Link>
        </div>

        {/* School not listed callout */}
        <Link
          href="/request-school"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 transition-all hover:border-primary/50 hover:bg-primary/10 active:scale-[0.99]"
        >
          <span className="text-xl">🏫</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary">Your school not listed?</p>
            <p className="text-xs text-muted-foreground">Don&apos;t panic — tell us your school and we&apos;ll add it. Use General Practice in the meantime.</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>
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

      {/* ── Study Tips widget ── */}
      {latestTips.length > 0 && (
        <div className="dash-in space-y-3" style={{ animationDelay: "360ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Latest Tips from PrepIQ
            </h2>
            <Link href="/tips" className="flex items-center gap-0.5 text-xs font-semibold text-primary">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {latestTips.map((tip) => {
              const typeEmoji = tip.type === "TIP" ? "📚" : tip.type === "TRICK" ? "🧪" : "⚡"
              return (
                <Link
                  key={tip.id}
                  href="/tips"
                  className="group flex items-start gap-3 rounded-2xl border bg-background p-3.5 transition-all hover:border-primary/30 hover:bg-accent/30 active:scale-[0.99]"
                >
                  <span className="shrink-0 text-xl">{typeEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm leading-snug line-clamp-1">{tip.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{tip.content}</p>
                    {tip.image_url && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                        <ExternalLink className="h-2.5 w-2.5" /> Resource attached
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{tip.category}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WhatsApp help card ── */}
      <div className="dash-in" style={{ animationDelay: "380ms" }}>
        <a
          href="https://wa.me/2348139479853?text=Hi%2C+I%27m+a+PrepIQ+student.+A+topic+is+stressing+me+and+I+need+it+broken+down+%F0%9F%93%9A"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 transition-all duration-200 hover:border-[#25D366]/60 hover:bg-[#25D366]/10 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] shadow-md shadow-[#25D366]/30">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm">Got a topic that won&apos;t budge? 💡</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Demystify with PrepIQ on WhatsApp — personal, fast, free.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#25D366] transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>

    </div>
  )
}
