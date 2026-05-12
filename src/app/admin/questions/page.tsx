import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { BookOpen, Plus, Hash, Upload } from "lucide-react"
import { QuestionsClient } from "./QuestionsClient"

export default async function QuestionsPage() {
  const admin = createAdminClient()

  const [
    { data: schools },
    { data: subjects },
    { count: total },
  ] = await Promise.all([
    admin.from("schools").select("id, name, abbreviation").order("name"),
    admin.from("subjects").select("id, name").order("name"),
    admin.from("questions").select("*", { count: "exact", head: true }),
  ])

  // Count questions per school
  const schoolCounts = await Promise.all(
    (schools ?? []).map(async (s) => {
      const { count } = await admin
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("school_id", s.id)
      return { ...s, count: count ?? 0 }
    })
  )

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Questions</h1>
          <p className="text-sm text-muted-foreground">{(total ?? 0).toLocaleString()} questions in the bank</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/questions/import"
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all hover:bg-muted active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Link>
          <Link
            href="/admin/questions/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Link>
        </div>
      </div>

      {/* By school */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Questions by School</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {schoolCounts.map((s) => {
            const pct = total ? Math.round((s.count / total) * 100) : 0
            return (
              <div key={s.id} className="rounded-2xl border bg-background p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-2xl leading-none">{s.count.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">{s.name}</p>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-black text-primary">{s.abbreviation}</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{pct}% of total</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive question list + bulk delete */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Browse & Manage</h2>
          <p className="text-xs text-muted-foreground">Select questions to bulk delete, or use CSV upload below</p>
        </div>
        <QuestionsClient
          schools={schools ?? []}
          subjects={subjects ?? []}
        />
      </div>
    </div>
  )
}
