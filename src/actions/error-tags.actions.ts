"use server"

import { createClient } from "@/lib/supabase/server"
import { ERROR_TAGS } from "@/lib/error-tags"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

// SM-2 simplified: cap interval at 180 days, ease between 1.3–4.0
function sm2(intervalDays: number, ease: number, isCorrect: boolean) {
  if (isCorrect) {
    const newEase   = Math.min(4.0, ease + 0.1)
    const newInterval = Math.min(Math.round(intervalDays * newEase), 180)
    return { interval: newInterval, ease: newEase }
  }
  return { interval: 1, ease: Math.max(1.3, ease - 0.2) }
}

// ─── Auto-log wrong answer (called immediately on wrong answer) ───────────────

export async function logWrongAnswer(questionId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from("question_error_tags")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle()

  if (!existing) {
    await db.from("question_error_tags").insert({
      user_id: user.id,
      question_id: questionId,
      tags: [],
      next_review_at: daysFromNow(3),
      interval_days: 3,
      ease: 2.5,
      review_count: 0,
    })
  }
}

// ─── Tag saving ──────────────────────────────────────────────────────────────

export async function saveErrorTags(
  questionId: string,
  tags: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from("question_error_tags")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle()

  if (existing) {
    // Update only tags — preserve SR schedule
    await db.from("question_error_tags")
      .update({ tags })
      .eq("user_id", user.id)
      .eq("question_id", questionId)
  } else {
    // Create entry with tags and SR schedule
    await db.from("question_error_tags")
      .insert({
        user_id: user.id,
        question_id: questionId,
        tags,
        next_review_at: daysFromNow(3),
        interval_days: 3,
        ease: 2.5,
        review_count: 0,
      })
  }

  return {}
}

// ─── Error insights (for /error-log) ─────────────────────────────────────────

export type ErrorStatRow = {
  question_id: string
  tags: string[]
  created_at: string
  question: { text: string; subject: { name: string } | null } | null
}

export async function getMyErrorStats(): Promise<ErrorStatRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("question_error_tags")
    .select("question_id, tags, created_at, question:questions(text, subject:subjects(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []) as ErrorStatRow[]
}

export type ErrorInsights = {
  total: number
  tagCounts: { id: string; label: string; emoji: string; count: number }[]
  subjectCounts: { name: string; count: number }[]
  recent: ErrorStatRow[]
}

export async function getErrorInsights(): Promise<ErrorInsights> {
  const rows = await getMyErrorStats()

  const tagMap: Record<string, number> = {}
  const subjectMap: Record<string, number> = {}

  for (const row of rows) {
    for (const tag of row.tags) tagMap[tag] = (tagMap[tag] ?? 0) + 1
    const subject = row.question?.subject?.name ?? "Unknown"
    subjectMap[subject] = (subjectMap[subject] ?? 0) + 1
  }

  const tagCounts = ERROR_TAGS
    .map((t) => ({ ...t, count: tagMap[t.id] ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)

  const subjectCounts = Object.entries(subjectMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return { total: rows.length, tagCounts, subjectCounts, recent: rows.slice(0, 10) }
}

// ─── Spaced repetition (for /weak-spots) ─────────────────────────────────────

export type ReviewQuestion = {
  questionId: string
  text: string
  explanation: string | null
  subjectName: string
  intervalDays: number
  ease: number
  options: { id: string; label: string; text: string; isCorrect: boolean }[]
}

export type WeakSpotStats = {
  total: number
  dueCount: number
  mastered: number
  nextReviewAt: string | null
}

export async function getWeakSpotStats(): Promise<WeakSpotStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, dueCount: 0, mastered: 0, nextReviewAt: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: all } = await (supabase as any)
    .from("question_error_tags")
    .select("next_review_at, interval_days")
    .eq("user_id", user.id)

  const rows = (all ?? []) as { next_review_at: string | null; interval_days: number }[]
  const now = new Date()

  const due = rows.filter((r) => r.next_review_at && new Date(r.next_review_at) <= now)
  const mastered = rows.filter((r) => r.interval_days >= 21)
  const upcoming = rows
    .filter((r) => r.next_review_at && new Date(r.next_review_at) > now)
    .sort((a, b) => new Date(a.next_review_at!).getTime() - new Date(b.next_review_at!).getTime())

  return {
    total: rows.length,
    dueCount: due.length,
    mastered: mastered.length,
    nextReviewAt: upcoming[0]?.next_review_at ?? null,
  }
}

export async function getDueReviews(): Promise<ReviewQuestion[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("question_error_tags")
    .select(`
      question_id, interval_days, ease,
      questions!inner(
        id, text, explanation,
        subjects!inner(name),
        options(id, label, text, is_correct)
      )
    `)
    .eq("user_id", user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(20)

  return ((data ?? []) as any[]).map((r: any) => ({
    questionId: r.question_id,
    text: r.questions.text,
    explanation: r.questions.explanation ?? null,
    subjectName: r.questions.subjects.name,
    intervalDays: r.interval_days,
    ease: r.ease,
    options: (r.questions.options ?? []).map((o: any) => ({
      id: o.id,
      label: o.label,
      text: o.text,
      isCorrect: o.is_correct,
    })),
  }))
}

export async function submitReviewAnswer(
  questionId: string,
  isCorrect: boolean
): Promise<{ error?: string; newInterval?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: row } = await db
    .from("question_error_tags")
    .select("interval_days, ease, review_count")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .single()

  if (!row) return { error: "Not found" }

  const { interval, ease } = sm2(row.interval_days, row.ease, isCorrect)

  await db.from("question_error_tags").update({
    interval_days: interval,
    ease,
    next_review_at: daysFromNow(interval),
    review_count: row.review_count + 1,
  })
    .eq("user_id", user.id)
    .eq("question_id", questionId)

  return { newInterval: interval }
}
