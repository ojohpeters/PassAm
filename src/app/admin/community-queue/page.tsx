import { getModerationQueue } from "@/actions/user-questions.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CommunityQueueClient } from "./CommunityQueueClient"
import { ShieldCheck } from "lucide-react"

export const metadata = { title: "Community Queue" }

export default async function CommunityQueuePage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const result = await getModerationQueue()
  const items = result.success ? result.data : []

  const pending = items.filter(i => i.moderation_status === "pending").length
  const flagged = items.filter(i => i.moderation_status === "flagged").length

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Community Queue</h1>
            <p className="text-sm text-muted-foreground">
              {pending} pending · {flagged} flagged
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-16 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <p className="font-bold text-lg">All clear</p>
          <p className="mt-1 text-sm text-muted-foreground">No questions waiting for review.</p>
        </div>
      ) : (
        <CommunityQueueClient items={items} />
      )}
    </div>
  )
}
