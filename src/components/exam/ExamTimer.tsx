"use client"

import { cn } from "@/lib/utils"

export function ExamTimer({ timeLeft }: { timeLeft: number }) {
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <div
      className={cn(
        "font-mono text-lg font-bold tabular-nums",
        timeLeft <= 300 && "animate-pulse text-red-600"
      )}
    >
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  )
}
