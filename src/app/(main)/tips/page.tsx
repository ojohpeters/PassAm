import { getPublishedTips, getTipCategories } from "@/actions/tips.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TipsClient } from "./TipsClient"
import { Lightbulb } from "lucide-react"

export default async function TipsPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const [tips, categories] = await Promise.all([
    getPublishedTips(),
    getTipCategories(),
  ])

  const pinnedCount = tips.filter((t) => t.pinned).length

  return (
    <div className="min-h-full bg-background">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#0d2254] via-[#1a3a7c] to-[#0d4a2f] px-5 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1.5 text-xs font-bold text-green-300">
            <Lightbulb className="h-3.5 w-3.5" />
            From PrepIQ — active until late September
          </div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Study Tips & Exam Tricks 🎯
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
            PrepIQ is dedicated to sharing curated study tips, subject-based tricks,
            and exam strategies to help you walk into that hall with confidence.
            New content drops regularly — come back often!
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { emoji: "📚", label: "Study Tips" },
              { emoji: "🧪", label: "Subject Tricks" },
              { emoji: "⚡", label: "Exam Tactics" },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <span>{emoji}</span>
                <span>{label}</span>
              </div>
            ))}
            {tips.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <span>✨</span>
                <span>{tips.length} tip{tips.length !== 1 ? "s" : ""} so far</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {tips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-background py-20 text-center">
            <span className="text-5xl mb-4">🔥</span>
            <h2 className="text-xl font-black">Tips dropping soon!</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              PrepIQ is preparing study tips, subject tricks and exam tactics for you.
              Check back very soon — this page is about to be loaded! 💪
            </p>
          </div>
        ) : (
          <TipsClient tips={tips} categories={categories} />
        )}
      </div>

    </div>
  )
}
