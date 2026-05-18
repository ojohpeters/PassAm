"use server"

import { createClient } from "@/lib/supabase/server"
import { ERROR_TAGS } from "@/lib/error-tags"

export async function saveErrorTags(
  questionId: string,
  tags: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  if (tags.length === 0) {
    await db.from("question_error_tags")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId)
    return {}
  }

  const { error } = await db
    .from("question_error_tags")
    .upsert(
      { user_id: user.id, question_id: questionId, tags },
      { onConflict: "user_id,question_id" }
    )
  return error ? { error: error.message } : {}
}

export type ErrorStatRow = {
  question_id: string
  tags: string[]
  created_at: string
  questions: { text: string; subjects: { name: string } }
}

export async function getMyErrorStats(): Promise<ErrorStatRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("question_error_tags")
    .select("question_id, tags, created_at, questions!inner(text, subjects!inner(name))")
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
    for (const tag of row.tags) {
      tagMap[tag] = (tagMap[tag] ?? 0) + 1
    }
    const subject = row.questions?.subjects?.name ?? "Unknown"
    subjectMap[subject] = (subjectMap[subject] ?? 0) + 1
  }

  const tagCounts = ERROR_TAGS
    .map((t) => ({ ...t, count: tagMap[t.id] ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)

  const subjectCounts = Object.entries(subjectMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total: rows.length,
    tagCounts,
    subjectCounts,
    recent: rows.slice(0, 10),
  }
}
