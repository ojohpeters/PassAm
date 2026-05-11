import { getAdminStats } from "@/actions/admin.actions"
import Link from "next/link"

export default async function AdminPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Students", value: stats?.totalUsers ?? 0 },
          { label: "Questions", value: stats?.totalQuestions ?? 0 },
          { label: "Attempts Today", value: stats?.attemptsToday ?? 0 },
          { label: "Pending Reports", value: stats?.pendingFeedback ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/questions/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add Question
        </Link>
        <Link
          href="/admin/questions"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          All Questions
        </Link>
        <Link
          href="/admin/feedback"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Review Feedback {stats?.pendingFeedback ? `(${stats.pendingFeedback})` : ""}
        </Link>
      </div>
    </div>
  )
}
