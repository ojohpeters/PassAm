import { getAdminSet } from "@/actions/question-sets.actions"
import { getAppUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { SetManagerClient } from "./SetManagerClient"
import Link from "next/link"

export default async function AdminSetPage({ params }: { params: { setId: string } }) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const [set, admin] = [await getAdminSet(params.setId), createAdminClient()]
  if (!set) notFound()

  const [{ data: schools }, { data: subjects }] = await Promise.all([
    admin.from("schools").select("id, name, abbreviation").order("name"),
    admin.from("subjects").select("id, name").order("name"),
  ])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Link href="/admin/sets" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          ← Sets
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {set.emoji} {set.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          /{set.slug} · {set.items.length} questions ·{" "}
          <span className={set.is_published ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
            {set.is_published ? "Live" : "Draft"}
          </span>
        </p>
      </div>

      <SetManagerClient
        set={set as any}
        schools={schools ?? []}
        subjects={subjects ?? []}
      />
    </div>
  )
}
