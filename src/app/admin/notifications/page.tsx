import { BroadcastForm } from "@/components/admin/BroadcastForm"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate } from "@/lib/utils"
import { Bell } from "lucide-react"

export default async function NotificationsPage() {
  const admin = createAdminClient()

  // Recent broadcasts (GENERAL type, ordered by most recent)
  const { data: recent } = await admin
    .from("notifications")
    .select("id, title, body, created_at")
    .eq("type", "GENERAL")
    .order("created_at", { ascending: false })
    .limit(10)

  // De-duplicate by title+created_at (one per broadcast)
  const seen = new Set<string>()
  const broadcasts = (recent ?? []).filter((n) => {
    const key = `${n.title}|${n.created_at.slice(0, 16)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="space-y-8 p-6">

      <div>
        <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Send a message to all students — they'll see it on their dashboard
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">

        {/* Send form */}
        <div className="space-y-3">
          <h2 className="font-bold">New Broadcast</h2>
          <div className="rounded-2xl border bg-background p-5">
            <BroadcastForm />
          </div>
        </div>

        {/* Sent history */}
        <div className="space-y-3">
          <h2 className="font-bold">Recent Broadcasts</h2>
          <div className="space-y-2">
            {broadcasts.length === 0 && (
              <div className="rounded-2xl border bg-background px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm text-muted-foreground">No broadcasts yet</p>
              </div>
            )}
            {broadcasts.map((b) => (
              <div key={b.id} className="rounded-2xl border bg-background px-4 py-3">
                <p className="font-semibold text-sm">{b.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{b.body}</p>
                <p className="mt-1.5 text-[10px] text-muted-foreground">{formatDate(b.created_at)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
