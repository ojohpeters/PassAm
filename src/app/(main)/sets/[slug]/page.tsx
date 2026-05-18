import { getSetBySlug } from "@/actions/question-sets.actions"
import { getAppUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { SetQuiz } from "@/components/sets/SetQuiz"
import Link from "next/link"

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const set = await getSetBySlug(params.slug)
  return { title: set ? `${set.emoji} ${set.title} — PrepIQ` : "Set — PrepIQ" }
}

export default async function SetPage({ params }: { params: { slug: string } }) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const set = await getSetBySlug(params.slug)
  if (!set) notFound()

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/sets" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          ← Practice Sets
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-4xl">{set.emoji}</span>
          <div>
            <h1 className="text-xl font-black tracking-tight">{set.title}</h1>
            {set.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{set.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {set.questions.length} question{set.questions.length !== 1 ? "s" : ""}
              {(set.school as any)?.name ? ` · ${(set.school as any).name}` : ""}
            </p>
          </div>
        </div>
      </div>

      {set.questions.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          This set has no questions yet. Check back soon!
        </div>
      ) : (
        <div className="rounded-2xl border bg-background p-5">
          <SetQuiz questions={set.questions} />
        </div>
      )}
    </div>
  )
}
