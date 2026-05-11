import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Returns "YYYY-MM-DD" in WAT (UTC+1) — matches the DailyQuiz.date column format */
export function todayWAT(): string {
  const now = new Date()
  // WAT = UTC+1
  const wat = new Date(now.getTime() + 60 * 60 * 1000)
  return wat.toISOString().split("T")[0]
}
