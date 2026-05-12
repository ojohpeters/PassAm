import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, ChevronRight, Globe } from "lucide-react"

const SCHOOL_COLORS: Record<string, string> = {
  UNILAG:  "from-blue-500/20 to-blue-600/10 border-blue-500/20",
  OAU:     "from-orange-500/20 to-orange-600/10 border-orange-500/20",
  UI:      "from-violet-500/20 to-violet-600/10 border-violet-500/20",
  UNIBEN:  "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
  UNIPORT: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20",
  AFIT:    "from-rose-500/20 to-rose-600/10 border-rose-500/20",
}

const SCHOOL_TEXT: Record<string, string> = {
  UNILAG: "text-blue-600 dark:text-blue-400",
  OAU:    "text-orange-600 dark:text-orange-400",
  UI:     "text-violet-600 dark:text-violet-400",
  UNIBEN: "text-emerald-600 dark:text-emerald-400",
  UNIPORT:"text-cyan-600 dark:text-cyan-400",
  AFIT:   "text-rose-600 dark:text-rose-400",
}

export const metadata = { title: "Study Mode" }

export default async function StudyPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: schools } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .neq("abbreviation", "GENERAL")
    .order("name")

  // Count questions per school
  const { data: counts } = await admin
    .from("questions")
    .select("school_id")

  const countMap: Record<string, number> = {}
  for (const q of counts ?? []) {
    countMap[q.school_id] = (countMap[q.school_id] ?? 0) + 1
  }

  return (
    <div className="min-h-full bg-background">

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 px-5 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5" />
            Study Mode — No pressure
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Study at Your Own Pace 📖
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/75 max-w-lg">
            Pick any subjects, choose how many questions per subject, and get instant feedback
            as you answer — no timer pressure, no scoring. Pure learning.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { emoji: "✅", label: "Instant right/wrong feedback" },
              { emoji: "💡", label: "Explanations shown immediately" },
              { emoji: "🕐", label: "Optional personal timer" },
              { emoji: "📊", label: "No score saved" },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <span>{emoji}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 space-y-6">

        {/* General */}
        <Link
          href="/study/general"
          className="flex items-center gap-4 rounded-2xl border-2 bg-background p-5 transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">General Pool</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Questions from all schools — great for broad practice
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </Link>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Study by School
          </p>
          {(schools ?? []).map((school) => {
            const colorClass = SCHOOL_COLORS[school.abbreviation] ?? "from-slate-500/20 to-slate-600/10 border-slate-500/20"
            const textClass = SCHOOL_TEXT[school.abbreviation] ?? "text-primary"
            const qCount = countMap[school.id] ?? 0

            return (
              <Link
                key={school.id}
                href={`/study/${school.abbreviation.toLowerCase()}`}
                className={`flex items-center gap-4 rounded-2xl border-2 bg-gradient-to-br p-5 transition-all hover:shadow-sm active:scale-[0.99] ${colorClass}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background/80 font-black text-sm ${textClass}`}>
                  {school.abbreviation}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{school.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {qCount.toLocaleString()} question{qCount !== 1 ? "s" : ""} available
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}
