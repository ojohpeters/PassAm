import { getAllTips } from "@/actions/tips.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TipsAdminClient } from "./TipsAdminClient"

export default async function AdminTipsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const tips = await getAllTips()
  const published = (tips ?? []).filter((t) => t.is_published).length
  const drafts    = (tips ?? []).length - published

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Study Tips</h1>
          <p className="text-sm text-muted-foreground">
            {(tips ?? []).length} tip{(tips ?? []).length !== 1 ? "s" : ""} total
            {published > 0 && ` · ${published} published`}
            {drafts > 0 && ` · ${drafts} draft${drafts !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">How it works:</strong> Create a tip, then publish it when ready.
        Pin important tips to keep them at the top. Students see published tips on the <strong>/tips</strong> page.
        Drafts are invisible to students.
      </div>

      <TipsAdminClient tips={tips ?? []} />
    </div>
  )
}
