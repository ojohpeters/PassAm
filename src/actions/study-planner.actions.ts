"use server"

import { createClient } from "@/lib/supabase/server"

export type PlanItem = {
  subjectId: string
  subjectName: string
  overdueCount: number
  totalCount: number
  priority: "urgent" | "soon" | "maintain"
  taskText: string
}

export type SessionPlan = {
  items: PlanItem[]
  suggestedPomodoros: number
  hasData: boolean
}

export async function getSessionPlan(): Promise<SessionPlan> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { items: [], suggestedPomodoros: 2, hasData: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("question_error_tags")
    .select("next_review_at, interval_days, question:questions(subject_id, subject:subjects(name))")
    .eq("user_id", user.id)

  if (!data?.length) return { items: [], suggestedPomodoros: 2, hasData: false }

  const now = new Date()
  const subjectMap = new Map<string, { name: string; overdueCount: number; totalCount: number }>()

  for (const row of data) {
    const subjectId = row.question?.subject_id
    const subjectName = row.question?.subject?.name
    if (!subjectId || !subjectName) continue

    const entry = subjectMap.get(subjectId) ?? { name: subjectName, overdueCount: 0, totalCount: 0 }
    entry.totalCount++
    if (row.next_review_at && new Date(row.next_review_at) <= now) {
      entry.overdueCount++
    }
    subjectMap.set(subjectId, entry)
  }

  const items: PlanItem[] = [...subjectMap.entries()]
    .map(([subjectId, s]) => {
      const priority: PlanItem["priority"] =
        s.overdueCount >= 3 ? "urgent"
        : s.overdueCount >= 1 ? "soon"
        : "maintain"

      const taskText =
        priority === "urgent" ? `⚡ Review ${s.overdueCount} overdue ${s.name} questions`
        : priority === "soon" ? `📝 Review ${s.overdueCount} ${s.name} question${s.overdueCount > 1 ? "s" : ""} due`
        : `📖 Practice ${s.name} — ${s.totalCount} mistake${s.totalCount > 1 ? "s" : ""} logged`

      return { subjectId, subjectName: s.name, overdueCount: s.overdueCount, totalCount: s.totalCount, priority, taskText }
    })
    .sort((a, b) => {
      const priorityScore = { urgent: 3, soon: 2, maintain: 1 }
      return (priorityScore[b.priority] - priorityScore[a.priority]) || (b.overdueCount - a.overdueCount) || (b.totalCount - a.totalCount)
    })
    .slice(0, 5)

  const urgentCount  = items.filter((i) => i.priority === "urgent").length
  const soonCount    = items.filter((i) => i.priority === "soon").length
  const suggestedPomodoros = Math.min(4, urgentCount * 2 + soonCount * 1 + (items.length > 0 ? 1 : 0))

  return { items, suggestedPomodoros: Math.max(1, suggestedPomodoros), hasData: true }
}
