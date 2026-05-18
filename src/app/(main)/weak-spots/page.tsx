import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDueReviews, getWeakSpotStats } from "@/actions/error-tags.actions"
import { WeakSpotReview } from "@/components/weak-spots/WeakSpotReview"
import { Target, CheckCircle2, Clock, BookX, Flame } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = { title: "Weak Spots — PrepIQ" }

function formatNextReview(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (diff <= 0) return "now"
  if (diff === 1) return "tomorrow"
  return `in ${diff} days`
}

export default async function WeakSpotsPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const [stats, due] = await Promise.all([getWeakSpotStats(), getDueReviews()])

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/40">
          <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Weak Spots</h1>
          <p className="text-xs text-muted-foreground">Spaced repetition for your mistakes</p>
        </div>
      </div>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<BookX className="h-4 w-4 text-red-500" />}
            iconBg="bg-red-100 dark:bg-red-950/40"
            value={stats.total}
            label="In queue"
          />
          <StatCard
            icon={<Flame className="h-4 w-4 text-amber-500" />}
            iconBg="bg-amber-100 dark:bg-amber-950/40"
            value={stats.dueCount}
            label="Due today"
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            iconBg="bg-emerald-100 dark:bg-emerald-950/40"
            value={stats.mastered}
            label="Mastered"
          />
        </div>
      )}

      {/* No questions tagged yet */}
      {stats.total === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Your queue is empty</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              When you tag a wrong answer in a drill or exam, it lands here for spaced review.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/drill" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
              Start a Drill
            </Link>
            <Link href="/error-log" className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
              Error Log
            </Link>
          </div>
        </div>
      )}

      {/* All caught up */}
      {stats.total > 0 && stats.dueCount === 0 && (
        <div className="rounded-2xl border bg-emerald-50 dark:bg-emerald-950/20 p-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="font-black text-lg text-emerald-800 dark:text-emerald-200">All caught up!</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              {stats.nextReviewAt
                ? <>Next review <strong>{formatNextReview(stats.nextReviewAt)}</strong>.</>
                : "Check back later."}
            </p>
          </div>
          {stats.mastered > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              🏆 {stats.mastered} question{stats.mastered !== 1 ? "s" : ""} mastered (≥21 day interval)
            </p>
          )}
          <div className="flex gap-3 justify-center pt-1">
            <Link href="/drill" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
              Start a Drill
            </Link>
            <Link href="/error-log" className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
              Error Log
            </Link>
          </div>
        </div>
      )}

      {/* Review session */}
      {due.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {due.length} question{due.length !== 1 ? "s" : ""} due for review
            </p>
            <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Clock className="h-3 w-3" /> Due now
            </span>
          </div>

          <div className="rounded-2xl border bg-background p-5">
            <WeakSpotReview questions={due} />
          </div>

          {/* How it works */}
          <details className="rounded-xl border p-4 text-sm">
            <summary className="cursor-pointer font-semibold text-muted-foreground select-none">
              How does spaced repetition work?
            </summary>
            <div className="mt-3 space-y-2 text-muted-foreground leading-relaxed">
              <p>Questions you got wrong are scheduled for review at increasing intervals.</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li><strong>First wrong</strong> → review in 3 days</li>
                <li><strong>Correct in review</strong> → interval multiplies (7d, 17d, 40d…)</li>
                <li><strong>Wrong in review</strong> → resets to 1 day</li>
                <li><strong>Mastered</strong> → interval reaches 21+ days</li>
              </ul>
            </div>
          </details>
        </>
      )}
    </div>
  )
}

function StatCard({
  icon, iconBg, value, label,
}: {
  icon: React.ReactNode
  iconBg: string
  value: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border bg-background p-4">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  )
}
