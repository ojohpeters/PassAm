"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ExternalLink, Pin, BookOpen } from "lucide-react"
import type { StudyTip } from "@/types/database"

const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  TIP:   { label: "Study Tip",     emoji: "📚", color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-100 dark:bg-blue-900/40"   },
  TRICK: { label: "Subject Trick", emoji: "🧪", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
  EXAM:  { label: "Exam Trick",    emoji: "⚡", color: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-100 dark:bg-amber-900/40"  },
}

function TipCard({ tip }: { tip: StudyTip }) {
  const cfg = TYPE_CONFIG[tip.type] ?? TYPE_CONFIG.TIP
  const date = new Date(tip.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className={cn(
      "group relative flex flex-col rounded-2xl border bg-background transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden",
      tip.pinned && "border-primary/30 shadow-sm shadow-primary/10"
    )}>
      {tip.pinned && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
          <Pin className="h-2.5 w-2.5" />
          Pinned
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold", cfg.bg, cfg.color)}>
            {cfg.emoji} {cfg.label}
          </span>
          <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {tip.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-black text-base leading-snug tracking-tight">{tip.title}</h3>

        {/* Content */}
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{tip.content}</p>

        {/* Image / Link */}
        {tip.image_url && (
          <a
            href={tip.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-all hover:border-primary/40 hover:bg-primary/10 active:scale-[0.98]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Image / Resource
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/20 px-5 py-2.5">
        <p className="text-[11px] text-muted-foreground">Posted {date} · by Ojochegbe</p>
      </div>
    </div>
  )
}

export function TipsClient({
  tips,
  categories,
}: {
  tips: StudyTip[]
  categories: string[]
}) {
  const [active, setActive] = useState("All")

  const filtered = active === "All" ? tips : tips.filter((t) => t.category === active)

  return (
    <div className="space-y-6">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
              active === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-background py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No tips in this category yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Check back soon — Ojochegbe is cooking something 🔥</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      )}
    </div>
  )
}
