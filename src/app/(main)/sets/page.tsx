import { getPublishedSets } from "@/actions/question-sets.actions"
import { getAppUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Layers } from "lucide-react"

export const metadata = { title: "Practice Sets — PrepIQ" }

export default async function SetsPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sets = await getPublishedSets((profile as any)?.school_id ?? null)

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Practice Sets</h1>
          <p className="text-xs text-muted-foreground">Curated question packs for focused study</p>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">No sets available yet</p>
          <p className="text-sm text-muted-foreground">Check back soon — curated packs are on the way.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sets.map((s: any) => {
            const count = s.question_set_questions?.[0]?.count ?? 0
            return (
              <Link
                key={s.id}
                href={`/sets/${s.slug}`}
                className="flex items-center gap-4 rounded-2xl border bg-background p-5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <span className="text-3xl shrink-0">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-black leading-tight group-hover:text-primary transition-colors">{s.title}</p>
                  {s.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {count} question{count !== 1 ? "s" : ""}
                    {s.school && ` · ${s.school.name}`}
                  </p>
                </div>
                <span className="text-muted-foreground group-hover:text-primary transition-colors text-lg shrink-0">→</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
