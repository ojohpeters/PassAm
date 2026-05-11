import { getFeedbacks, updateFeedbackStatus } from "@/actions/feedback.actions"
import { formatDate } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = (searchParams.status as "PENDING" | "REVIEWED" | "RESOLVED") ?? "PENDING"
  const data = await getFeedbacks(status)

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Feedback Review</h1>

      <div className="flex gap-2">
        {(["PENDING", "REVIEWED", "RESOLVED"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/feedback?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              status === s ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {data?.items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No {status.toLowerCase()} reports.</p>
        )}
        {data?.items.map((fb) => (
          <div key={fb.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{fb.type} · {formatDate(fb.createdAt)}</p>
                <p className="mt-1 text-sm font-medium">Q: {fb.question.text.slice(0, 100)}&hellip;</p>
                <p className="text-sm text-muted-foreground">"{fb.message}"</p>
                <p className="text-xs text-muted-foreground">— {fb.user.name} ({fb.user.email})</p>
              </div>
              {status === "PENDING" && (
                <form
                  action={async () => {
                    "use server"
                    await updateFeedbackStatus(fb.id, "RESOLVED")
                    revalidatePath("/admin/feedback")
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
                  >
                    Resolve
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
