"use client"

import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

export function ExamTimer({ timeLeft, totalSecs }: { timeLeft: number; totalSecs: number }) {
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const pct  = totalSecs > 0 ? timeLeft / totalSecs : 1

  const critical = timeLeft <= 60
  const warning  = timeLeft <= 300

  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 tabular-nums transition-colors",
      critical ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
               : warning  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
               : "border-border bg-muted/40 text-foreground"
    )}>
      <Clock className={cn("h-3.5 w-3.5 shrink-0", critical && "animate-pulse")} />
      <span className="text-sm font-black leading-none">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  )
}
