import { getReadinessData } from "@/actions/readiness.actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getAppUser } from "@/lib/auth"
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, BookOpen, Flame, Zap } from "lucide-react"

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = (size - 16) / 2
  const circumference = 2 * Math.PI * r
  const fill = (score / 100) * circumference
  const color =
    score >= 70 ? "#10b981"  // emerald
    : score >= 50 ? "#f59e0b" // amber
    : "#ef4444"               // red

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="currentColor"
        strokeWidth={12}
        className="text-muted/30"
      />
      {/* Fill */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circumference - fill}`}
        className="transition-all duration-700"
      />
    </svg>
  )
}

const STATUS_MAP = {
  strong:   { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", label: "Strong" },
  close:    { bar: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400",    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",    label: "Close"  },
  weak:     { bar: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400",      badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",        label: "Weak"   },
  untested: { bar: "bg-muted-foreground/30", text: "text-muted-foreground",          badge: "bg-muted text-muted-foreground",                                          label: "Untested"},
}

export default async function ReadinessPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const data = await getReadinessData()

  // No school set
  if (!data) {
    return (
      <div className="min-h-full p-4 pb-24 md:p-6 flex flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">🏫</div>
        <div className="space-y-2">
          <h1 className="text-xl font-black">No school set</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add your target school in your profile so we can track your readiness for that specific exam.
          </p>
        </div>
        <Link
          href="/profile"
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Update Profile
        </Link>
      </div>
    )
  }

  // No attempts
  if (!data.hasData) {
    return (
      <div className="min-h-full p-4 pb-24 md:p-6">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Readiness</p>
          <h1 className="text-2xl font-black">{data.schoolName}</h1>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-accent/20 px-6 py-14 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">📊</div>
          <div className="space-y-1.5">
            <p className="font-bold text-lg">No exam data yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Complete at least one practice exam for {data.schoolAbbreviation} to see your readiness score.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-1">
            <Link
              href={`/exam/${data.schoolAbbreviation.toLowerCase()}`}
              className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Take Practice Exam
            </Link>
            <Link
              href="/drill"
              className="rounded-2xl border px-5 py-2.5 text-sm font-bold hover:bg-accent transition-colors"
            >
              Start Drill
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const ringColor =
    data.overallScore >= 70 ? "text-emerald-500"
    : data.overallScore >= 50 ? "text-amber-500"
    : "text-rose-500"

  return (
    <div className="min-h-full space-y-5 p-4 pb-24 md:p-6">

      {/* Header */}
      <div className="space-y-0.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Readiness</p>
        <h1 className="text-2xl font-black">{data.schoolName}</h1>
      </div>

      {/* Score Hero */}
      <div className={cn(
        "rounded-2xl border-2 p-6",
        data.isOnTrack
          ? "border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20"
          : data.overallScore >= 50
            ? "border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20"
            : "border-rose-200 dark:border-rose-800/60 bg-gradient-to-br from-rose-50/80 to-red-50/40 dark:from-rose-950/30 dark:to-red-950/20"
      )}>
        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="relative shrink-0">
            <ScoreRing score={data.overallScore} size={120} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-black leading-none tabular-nums", ringColor)}>
                {data.overallScore}
              </span>
              <span className={cn("text-sm font-bold leading-none", ringColor)}>%</span>
            </div>
          </div>

          {/* Labels */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold",
              data.isOnTrack
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
            )}>
              {data.isOnTrack
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> On Track</>
                : <><AlertTriangle className="h-3.5 w-3.5" /> Needs Work</>
              }
            </div>
            <p className="text-sm text-muted-foreground leading-snug">
              {data.isOnTrack
                ? `You're above the ${data.threshold}% target — keep it up!`
                : `${data.threshold - data.overallScore}% more to hit the ${data.threshold}% target.`}
            </p>
            <p className="text-xs text-muted-foreground">
              Based on {data.totalAnswered.toLocaleString()} answered questions
            </p>
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Subject Breakdown</h2>
          <span className="text-xs text-muted-foreground">{data.subjects.length} subjects</span>
        </div>

        <div className="space-y-2">
          {data.subjects.map((s) => {
            const st = STATUS_MAP[s.status]
            return (
              <div
                key={s.subjectId}
                className="rounded-2xl border bg-background p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("text-xs font-bold rounded-lg px-2 py-0.5 shrink-0", st.badge)}>
                      {st.label}
                    </span>
                    <span className="text-sm font-semibold truncate">{s.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-sm font-black tabular-nums", st.text)}>
                      {s.accuracy}%
                    </span>
                    {(s.status === "weak" || s.status === "untested") && (
                      <Link
                        href="/drill"
                        className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                      >
                        Drill <Zap className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", st.bar)}
                    style={{ width: `${s.status === "untested" ? 5 : s.accuracy}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.correct}/{s.total} correct</span>
                  {s.status === "untested" && <span>Answer 5+ questions to unlock</span>}
                  {s.status !== "untested" && s.accuracy >= 70 && <span>Target reached ✓</span>}
                  {s.status !== "untested" && s.accuracy < 70 && (
                    <span>{70 - s.accuracy}% to target</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-2">
        {!data.isOnTrack && (
          <Link
            href="/drill"
            className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 p-4 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-sm">Boost your score</p>
              <p className="text-xs text-white/70">Drill weak subjects to close the gap</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        <Link
          href={`/exam/${data.schoolAbbreviation.toLowerCase()}`}
          className="group flex items-center gap-4 rounded-2xl border bg-background p-4 transition-all hover:border-primary/30 hover:bg-accent/30 active:scale-[0.98]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm">Take a full practice exam</p>
            <p className="text-xs text-muted-foreground">More attempts = more accurate score</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>

        <Link
          href="/error-log"
          className="group flex items-center gap-4 rounded-2xl border bg-background p-4 transition-all hover:border-primary/30 hover:bg-accent/30 active:scale-[0.98]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm">Review your mistakes</p>
            <p className="text-xs text-muted-foreground">Fix errors to lift accuracy per subject</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>
      </div>

    </div>
  )
}
