import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { BookOpen, Plus, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function QuestionsPage() {
  const admin = createAdminClient()

  const [
    { data: schools },
    { data: subjects },
    { data: recentQuestions },
    { count: total },
  ] = await Promise.all([
    admin.from("schools").select("id, name, abbreviation").order("name"),
    admin.from("subjects").select("id, name").order("name"),
    admin
      .from("questions")
      .select("id, text, year, school:schools(abbreviation), subject:subjects(name)")
      .order("created_at", { ascending: false })
      .limit(20),
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Questions</h1>
          <p className="text-sm text-muted-foreground">{(total ?? 0).toLocaleString()} questions in the bank</p>
        </div>
        <Link
          href="/admin/questions/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Questions
        </Link>
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

      {/* Recent questions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recently Added</h2>
          <Link href="/admin/questions/new" className="text-xs font-semibold text-primary hover:underline">
            + Add more
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-background">
          {(recentQuestions ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No questions yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Add your first question to get started</p>
              <Link
                href="/admin/questions/new"
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Add Questions
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {(recentQuestions ?? []).map((q) => {
                const school = q.school as any
                const subject = q.subject as any
                return (
                  <div key={q.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Hash className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{q.text}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {school?.abbreviation && (
                          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            {school.abbreviation}
                          </span>
                        )}
                        {subject?.name && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {subject.name}
                          </span>
                        )}
                        {q.year && (
                          <span className="text-[10px] text-muted-foreground">{q.year}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
