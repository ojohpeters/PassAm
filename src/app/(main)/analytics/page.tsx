import { getSubjectAccuracy, getScoreHistory, calculateWeakSubjects } from "@/actions/analytics.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"

export default async function AnalyticsPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const isPro = user.subscriptionStatus === "PRO"

  const [history, accuracy, weak] = await Promise.all([
    getScoreHistory(),
    isPro ? getSubjectAccuracy() : null,
    isPro ? calculateWeakSubjects() : null,
  ])

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Score History</h2>
          {!isPro && (
            <span className="text-xs text-muted-foreground">Last 5 exams</span>
          )}
        </div>
        {history.success && history.data.length > 0 ? (
          <div className="space-y-2">
            {history.data.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">
                  {new Date(r.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                </span>
                <div className="flex-1 rounded-full bg-muted" style={{ height: 8 }}>
                  <div
                    className={cn("h-2 rounded-full", r.percentage >= 50 ? "bg-green-500" : "bg-red-400")}
                    style={{ width: `${r.percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold">{r.percentage}%</span>
                <span className="hidden w-20 text-right text-xs text-muted-foreground md:block">
                  {r.schoolName}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No completed exams yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Subject Accuracy</h2>
        {!isPro ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-semibold">Coming soon for Pro users</p>
            <p className="mt-1 text-sm text-muted-foreground">
              See your accuracy per subject and identify your weak areas.
            </p>
          </div>
        ) : (
          <>
            {accuracy?.success && accuracy.data.length > 0 ? (
              <div className="space-y-2">
                {accuracy.data
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .map((s) => (
                    <div key={s.subjectId} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className="w-36 shrink-0 text-sm">{s.subjectName}</span>
                      <div className="flex-1 rounded-full bg-muted" style={{ height: 8 }}>
                        <div
                          className={cn("h-2 rounded-full", s.isWeak ? "bg-red-400" : "bg-green-500")}
                          style={{ width: `${s.accuracy}%` }}
                        />
                      </div>
                      <span className={cn("w-12 text-right text-sm font-bold", s.isWeak ? "text-red-500" : "text-green-600")}>
                        {s.accuracy}%
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Complete some exams to see subject accuracy.</p>
            )}

            {weak?.success && weak.data.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">Focus Areas</p>
                <ul className="mt-2 space-y-1">
                  {weak.data.map((w) => (
                    <li key={w.subjectId} className="text-sm text-red-700">
                      • {w.insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
