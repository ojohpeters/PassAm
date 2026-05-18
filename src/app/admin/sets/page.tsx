import { getAdminSets } from "@/actions/question-sets.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { SetsAdminClient } from "./SetsAdminClient"
import { Layers } from "lucide-react"

export const metadata = { title: "Sets — Admin" }

export default async function AdminSetsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const admin = createAdminClient()
  const [sets, { data: schools }] = await Promise.all([
    getAdminSets(),
    admin.from("schools").select("id, name, abbreviation").order("name"),
  ])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Question Sets</h1>
            <p className="text-sm text-muted-foreground">Curated quiz pages for students</p>
          </div>
        </div>
      </div>

      <SetsAdminClient sets={sets as any} schools={schools ?? []} />
    </div>
  )
}
