import { getErrorInsights } from "@/actions/error-tags.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ERROR_TAGS } from "@/lib/error-tags"
import { cn } from "@/lib/utils"
import { BookX, TrendingDown, Tag, Clock } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Error Log — PrepIQ" }

export default async function ErrorLogPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const insights = await getErrorInsights()

  const maxTagCount = insights.tagCounts[0]?.count ?? 1
  const maxSubjectCount = insights.subjectCounts[0]?.count ?? 1

  if (insights.total === 0) {
    return (
      <div className="mx-auto max-w-lg p-4 pb-24 md:p-6">
        <Header />
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BookX className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No errors logged yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              After you get a question wrong in a drill or exam, you can tag why. Your patterns will appear here.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/drill" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Start a Drill
            </Link>
            <Link href="/exam/general" className="rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">
              Take an Exam
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-6 space-y-6">
      <Header />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Tag className="h-4 w-4 text-red-500" />}
          iconBg="bg-red-100 dark:bg-red-950/40"
          value={insights.total}
          label="Tagged mistakes"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-amber-500" />}
          iconBg="bg-amber-100 dark:bg-amber-950/40"
          value={insights.tagCounts[0]?.label ?? "—"}
          label="Top mistake"
          small
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-violet-500" />}
          iconBg="bg-violet-100 dark:bg-violet-950/40"
          value={insights.subjectCounts[0]?.name ?? "—"}
          label="Weakest subject"
          small
        />
      </div>

      {/* Error type breakdown */}
      {insights.tagCounts.length > 0 && (
        <div className="rounded-2xl border bg-background p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Error types
          </h2>
          <div className="space-y-3">
            {insights.tagCounts.map((tag) => (
              <div key={tag.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span>{tag.emoji}</span>
                    {tag.label}
                  </span>
                  <span className="tabular-nums font-bold text-muted-foreground">{tag.count}×</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(tag.count / maxTagCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Show any untagged categories as empty */}
          {ERROR_TAGS.filter((t) => !insights.tagCounts.find((c) => c.id === t.id)).length > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              No errors tagged yet for:{" "}
              {ERROR_TAGS
                .filter((t) => !insights.tagCounts.find((c) => c.id === t.id))
                .map((t) => t.label)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Subject breakdown */}
      {insights.subjectCounts.length > 0 && (
        <div className="rounded-2xl border bg-background p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            By subject
          </h2>
          <div className="space-y-3">
            {insights.subjectCounts.map((s) => (
              <div key={s.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="tabular-nums font-bold text-muted-foreground">{s.count}×</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(s.count / maxSubjectCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent mistakes */}
      {insights.recent.length > 0 && (
        <div className="rounded-2xl border bg-background p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recent mistakes
          </h2>
          <div className="space-y-3">
            {insights.recent.map((row) => (
              <div key={row.question_id} className="rounded-xl border bg-muted/20 p-3 space-y-1.5">
                <p className="text-sm leading-snug line-clamp-2">{row.questions?.text}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{row.questions?.subjects?.name}</span>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  {row.tags.map((tagId) => {
                    const info = ERROR_TAGS.find((t) => t.id === tagId)
                    return info ? (
                      <span
                        key={tagId}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {info.emoji} {info.label}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Link href="/drill" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
          Start a Drill
        </Link>
        <Link href="/analytics" className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
          Analytics
        </Link>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
        <BookX className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h1 className="text-xl font-black tracking-tight">Error Log</h1>
        <p className="text-xs text-muted-foreground">Track your mistake patterns</p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  iconBg,
  value,
  label,
  small = false,
}: {
  icon: React.ReactNode
  iconBg: string
  value: string | number
  label: string
  small?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border bg-background p-4">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <p className={cn("font-black tabular-nums text-center leading-tight", small ? "text-sm" : "text-xl")}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  )
}
