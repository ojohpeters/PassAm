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

export function getDrillTimeLimitMs(subjectName: string): number {
  const n = subjectName.toLowerCase()
  if (n.includes("chemistry")) return 15_000
  if (n.includes("physics") || n.includes("mathematics") || n.includes("math")) return 20_000
  return 10_000
}

/**
 * Seeded Fisher-Yates shuffle. Seed is derived from schoolKey + date so the
 * same pair always produces the same order, but different days produce
 * completely different orderings (unlike the previous XOR-sort which barely
 * changed day-to-day because dateInt << UUID prefix values).
 */
export function seededShuffle<T>(arr: T[], schoolKey: string, date: string): T[] {
  const str = `${schoolKey}:${date}`
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
    h >>>= 0
  }
  // mulberry32 PRNG
  const rng = () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

/** Returns "YYYY-MM-DD" in WAT (UTC+1) — matches the DailyQuiz.date column format */
export function todayWAT(): string {
  const now = new Date()
  // WAT = UTC+1
  const wat = new Date(now.getTime() + 60 * 60 * 1000)
  return wat.toISOString().split("T")[0]
}
