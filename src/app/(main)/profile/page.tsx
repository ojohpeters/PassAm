import { getAppUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { getDashboardStats } from "@/actions/analytics.actions"
import { getStudentRank } from "@/actions/leaderboard.actions"
import { ProfileEditForm } from "@/components/profile/ProfileEditForm"
import { CommunitySettingsForm } from "@/components/profile/CommunitySettingsForm"
import { redirect } from "next/navigation"
import { cn, todayWAT } from "@/lib/utils"
import { BookOpen, Flame, Target, Trophy, TrendingUp } from "lucide-react"

export const metadata = { title: "My Profile" }

// ── Helpers ──────────────────────────────────────────────────────────────────

function dayOfJourney(createdAt: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000) + 1)
}

function journeyLabel(day: number) {
  if (day === 1) return "Day 1 — welcome to the grind! 🎉"
  if (day <= 7)  return `Day ${day} — first week strong 💪`
  if (day <= 30) return `Day ${day} — building momentum 🚀`
  if (day <= 90) return `Day ${day} — you're consistent 🔥`
  return `Day ${day} — absolute legend 👑`
}

type CalDay = { date: string; hasExam: boolean; hasQuiz: boolean; isToday: boolean }

// ── Achievement definitions ───────────────────────────────────────────────────

type Achievement = {
  id: string
  emoji: string
  label: string
  desc: string
  earned: boolean
}

function buildAchievements(
  totalAttempts: number,
  avgScore: number,
  longestStreak: number,
  quizCount: number
): Achievement[] {
  return [
    { id: "first_exam",  emoji: "🎓", label: "First Step",    desc: "Completed your first exam",       earned: totalAttempts >= 1  },
    { id: "five_exams",  emoji: "📚", label: "Getting Serious", desc: "Completed 5 exams",              earned: totalAttempts >= 5  },
    { id: "ten_exams",   emoji: "💪", label: "Grind Mode",    desc: "Completed 10 exams",               earned: totalAttempts >= 10 },
    { id: "streak_3",    emoji: "🔥", label: "On Fire",       desc: "Kept a 3-day streak",              earned: longestStreak >= 3  },
    { id: "streak_7",    emoji: "⚡", label: "Week Warrior",  desc: "Kept a 7-day streak",              earned: longestStreak >= 7  },
    { id: "score_60",    emoji: "🎯", label: "Sharp",         desc: "Average score above 60%",          earned: avgScore >= 60      },
    { id: "score_80",    emoji: "🏆", label: "Excellence",    desc: "Average score above 80%",          earned: avgScore >= 80      },
    { id: "quiz_5",      emoji: "✅", label: "Quiz Devotee",  desc: "Completed 5 daily quizzes",        earned: quizCount >= 5      },
  ]
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const today = todayWAT()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const thirtyDaysAgoDate = thirtyDaysAgo.split("T")[0]

  const [
    { data: profile },
    { data: schools },
    { data: subjects },
    stats,
    rank,
    { count: studentCount },
    { data: examDays },
    { data: quizDays },
    { count: quizCount },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("schools").select("id, name, abbreviation").order("name"),
    admin.from("subjects").select("id, name").order("name"),
    getDashboardStats(),
    getStudentRank(),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("exam_attempts")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo),
    admin
      .from("daily_quizzes")
      .select("date")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .gte("date", thirtyDaysAgoDate),
    admin
      .from("daily_quizzes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
  ])

  const totalAttempts = stats?.totalAttempts ?? 0
  const avgScore      = stats?.averageScore  ?? 0
  const curStreak     = stats?.currentStreak ?? 0
  const longestStreak = stats?.longestStreak ?? 0
  const day           = dayOfJourney(profile?.created_at ?? new Date().toISOString())

  const initials = user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  // Build 30-day calendar
  const examDateSet = new Set((examDays ?? []).map(e => e.created_at.split("T")[0]))
  const quizDateSet = new Set((quizDays ?? []).map(q => q.date))
  const calDays: CalDay[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000)
    const date = d.toISOString().split("T")[0]
    return { date, hasExam: examDateSet.has(date), hasQuiz: quizDateSet.has(date), isToday: date === today }
  })

  const achievements = buildAchievements(totalAttempts, avgScore, longestStreak, quizCount ?? 0)
  const earnedCount  = achievements.filter(a => a.earned).length
  const otherStudents = Math.max(0, (studentCount ?? 0) - 1)

  return (
    <div className="min-h-full space-y-6 p-4 pb-12 md:p-6">

      {/* ── Hero card ── */}
      <div className="dash-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-indigo-700 p-6 text-white shadow-xl shadow-primary/20" style={{ animationDelay: "0ms" }}>
        {/* Background blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-2xl font-black shadow-inner ring-2 ring-white/30">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white">{initials}</span>
            )}
          </div>

          {/* Name + journey */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-black leading-tight">{user.name}</h1>

            {/* Day badge */}
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
              📅 {journeyLabel(day)}
            </div>

            {/* Target school */}
            {profile?.target_school && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                <Target className="h-3 w-3" /> Targeting {profile.target_school}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="relative mt-4 text-sm leading-relaxed text-white/85">
            &ldquo;{profile.bio}&rdquo;
          </p>
        )}

        {/* Social proof pill */}
        {otherStudents > 0 && (
          <div className="relative mt-4 flex items-center gap-2 rounded-2xl bg-black/20 px-4 py-3 backdrop-blur-sm">
            <span className="text-base">👀</span>
            <p className="text-xs font-semibold leading-snug text-white/90">
              <span className="font-black text-white">{otherStudents.toLocaleString()} other students</span> are on this platform — your results are public. Make them count.
            </p>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="dash-in grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "80ms" }}>
        {[
          { label: "Exams Done",   value: totalAttempts,              Icon: BookOpen,    color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/40",    border: "border-blue-100 dark:border-blue-900/40",    iconBg: "bg-blue-100 dark:bg-blue-900/50" },
          { label: "Avg Score",    value: `${avgScore}%`,             Icon: TrendingUp,  color: avgScore >= 50 ? "text-emerald-500" : "text-rose-500",    bg: avgScore >= 50 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40",    border: avgScore >= 50 ? "border-emerald-100 dark:border-emerald-900/40" : "border-rose-100 dark:border-rose-900/40", iconBg: avgScore >= 50 ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-rose-100 dark:bg-rose-900/50" },
          { label: "Best Streak",  value: `${longestStreak}d`,        Icon: Flame,       color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-100 dark:border-orange-900/40", iconBg: "bg-orange-100 dark:bg-orange-900/50" },
          { label: "Weekly Rank",  value: rank ? `#${rank.rank}` : "—", Icon: Trophy,   color: "text-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-950/40", border: "border-yellow-100 dark:border-yellow-900/40", iconBg: "bg-yellow-100 dark:bg-yellow-900/50" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4 transition-all duration-200 hover:shadow-md", s.bg, s.border)}>
            <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", s.iconBg)}>
              <s.Icon className={cn("h-4 w-4", s.color)} />
            </div>
            <p className="text-2xl font-black tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Achievements ── */}
      <div className="dash-in space-y-3" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Achievements</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {earnedCount}/{achievements.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all duration-200",
                a.earned
                  ? "border-primary/20 bg-primary/5 hover:border-primary/40 hover:shadow-md"
                  : "border-border/60 bg-muted/30 opacity-50"
              )}
            >
              <span className={cn("text-2xl", !a.earned && "grayscale")}>{a.emoji}</span>
              <div>
                <p className={cn("text-xs font-bold leading-tight", a.earned ? "text-foreground" : "text-muted-foreground")}>
                  {a.label}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{a.desc}</p>
              </div>
              {a.earned && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Earned
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 30-day activity calendar ── */}
      <div className="dash-in space-y-3" style={{ animationDelay: "220ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">30-Day Activity</h2>
          {curStreak > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
              🔥 {curStreak} day streak
            </span>
          )}
        </div>
        <div className="rounded-2xl border bg-background p-4">
          <div className="grid grid-cols-10 gap-1.5">
            {calDays.map((d) => {
              const active = d.hasExam || d.hasQuiz
              return (
                <div
                  key={d.date}
                  title={d.date}
                  className={cn(
                    "aspect-square rounded-md transition-all duration-150",
                    d.isToday && "ring-2 ring-primary ring-offset-1",
                    d.hasExam && d.hasQuiz ? "bg-primary"
                      : d.hasExam ? "bg-orange-400"
                      : d.hasQuiz ? "bg-blue-400"
                      : "bg-muted"
                  )}
                />
              )
            })}
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-primary inline-block" /> Exam + Quiz</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400 inline-block" /> Exam only</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400 inline-block" /> Quiz only</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-muted inline-block border" /> Inactive</span>
          </div>
        </div>

        {/* Motivational nudge */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 px-4 py-3 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-900/40">
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
            {curStreak === 0
              ? "🎯 Start a streak today — take a quiz or sit an exam!"
              : curStreak < 3
              ? `🔥 ${curStreak}-day streak! Keep going — 3 days unlocks the "On Fire" badge!`
              : curStreak < 7
              ? `🔥 ${curStreak} days strong! 7 days unlocks "Week Warrior" — you're close!`
              : `🏆 Incredible — ${curStreak}-day streak! You're top-tier material.`}
          </p>
        </div>
      </div>

      {/* ── Community / WhatsApp ── */}
      <div className="dash-in space-y-3" style={{ animationDelay: "270ms" }}>
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Community</h2>
        <div className="rounded-2xl border bg-background p-5">
          <CommunitySettingsForm
            initialNumber={profile?.whatsapp_number ?? null}
            initialVisible={profile?.show_whatsapp ?? false}
          />
        </div>
      </div>

      {/* ── Edit profile ── */}
      <div className="dash-in space-y-3" style={{ animationDelay: "290ms" }}>
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Edit Profile</h2>
        <div className="rounded-2xl border bg-background p-5">
          <ProfileEditForm
            userId={user.id}
            name={user.name}
            bio={profile?.bio ?? null}
            targetSchool={profile?.target_school ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            schools={schools ?? []}
            subjects={subjects ?? []}
            aspiringCourse={user.aspiringCourse}
            subjectIds={user.studentSubjectIds}
            initials={initials}
          />
        </div>
      </div>

    </div>
  )
}
