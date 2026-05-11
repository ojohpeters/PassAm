"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { createQuestionSchema } from "@/lib/validations/question"
import type { ActionResult } from "@/types"

async function requireAdmin() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") throw new Error("UNAUTHORIZED")
  return user
}

export async function getAdminStats() {
  try {
    await requireAdmin()
  } catch {
    return null
  }

  const admin = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: totalQuestions },
    { count: attemptsToday },
    { count: pendingFeedback },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    admin.from("questions").select("*", { count: "exact", head: true }),
    admin
      .from("exam_attempts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    admin.from("feedback").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    totalQuestions: totalQuestions ?? 0,
    attemptsToday: attemptsToday ?? 0,
    pendingFeedback: pendingFeedback ?? 0,
  }
}

export async function createQuestion(data: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const parsed = createQuestionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "VALIDATION_ERROR" }

  const { options, ...questionData } = parsed.data
  const admin = createAdminClient()

  const { data: question, error: qErr } = await admin
    .from("questions")
    .insert({
      text: questionData.text,
      explanation: questionData.explanation ?? null,
      year: questionData.year ?? null,
      school_id: questionData.schoolId,
      subject_id: questionData.subjectId,
      image_url: null,
    })
    .select("id")
    .single()

  if (qErr || !question) return { success: false, error: "INTERNAL" }

  await admin.from("options").insert(
    options.map((opt) => ({
      question_id: question.id,
      label: opt.label,
      text: opt.text,
      is_correct: opt.isCorrect,
    }))
  )

  return { success: true, data: { id: question.id } }
}

export async function parseImportedQuestions(
  rows: unknown[]
): Promise<ActionResult<{ created: number; failed: number }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const admin = createAdminClient()
  let created = 0
  let failed = 0

  for (const row of rows) {
    const parsed = createQuestionSchema.safeParse(row)
    if (!parsed.success) {
      failed++
      continue
    }
    const { options, ...q } = parsed.data
    const { data: question, error } = await admin
      .from("questions")
      .insert({
        text: q.text,
        explanation: q.explanation ?? null,
        year: q.year ?? null,
        school_id: q.schoolId,
        subject_id: q.subjectId,
        image_url: null,
      })
      .select("id")
      .single()

    if (error || !question) {
      failed++
      continue
    }

    await admin.from("options").insert(
      options.map((opt) => ({
        question_id: question.id,
        label: opt.label,
        text: opt.text,
        is_correct: opt.isCorrect,
      }))
    )
    created++
  }

  return { success: true, data: { created, failed } }
}

export async function getQuestions(
  filters: { schoolId?: string; subjectId?: string; year?: number } = {},
  page = 1,
  limit = 20
) {
  try {
    await requireAdmin()
  } catch {
    return null
  }

  const admin = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = admin
    .from("questions")
    .select(`
      id, text, year, created_at,
      school:schools(name, abbreviation),
      subject:subjects(name),
      options(id, label, text, is_correct)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (filters.schoolId) query = query.eq("school_id", filters.schoolId)
  if (filters.subjectId) query = query.eq("subject_id", filters.subjectId)
  if (filters.year) query = query.eq("year", filters.year)

  const { data: questions, count } = await query

  return { questions: questions ?? [], total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) }
}

export async function deleteQuestion(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const admin = createAdminClient()
  await admin.from("questions").delete().eq("id", id)
  return { success: true, data: undefined }
}

// ── Student management ────────────────────────────────────────────────────────

export async function getStudents(page = 1, search = "") {
  try {
    await requireAdmin()
  } catch {
    return null
  }

  const admin = createAdminClient()
  const limit = 30
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  let query = admin
    .from("profiles")
    .select("id, name, email, is_banned, target_school, created_at, avatar_url", { count: "exact" })
    .eq("role", "STUDENT")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
  }

  const { data: students, count } = await query

  // Exam count per student (batch)
  const ids = (students ?? []).map((s) => s.id)
  const { data: examCounts } = ids.length
    ? await admin
        .from("exam_attempts")
        .select("user_id")
        .in("user_id", ids)
        .not("completed_at", "is", null)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const row of examCounts ?? []) {
    countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1
  }

  return {
    students: (students ?? []).map((s) => ({ ...s, examCount: countMap[s.id] ?? 0 })),
    total: count ?? 0,
    pages: Math.ceil((count ?? 0) / limit),
  }
}

export async function banStudent(userId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("profiles").update({ is_banned: true }).eq("id", userId)
  if (error) return { success: false, error: "Failed to ban student" }
  return { success: true, data: undefined }
}

export async function unbanStudent(userId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("profiles").update({ is_banned: false }).eq("id", userId)
  if (error) return { success: false, error: "Failed to unban student" }
  return { success: true, data: undefined }
}

// ── Broadcast notifications ───────────────────────────────────────────────────

export async function broadcastNotification(
  title: string,
  body: string
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  if (!title.trim() || !body.trim()) return { success: false, error: "Title and message required" }

  const admin = createAdminClient()

  // Fetch all active, non-admin students
  const { data: students } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "STUDENT")
    .eq("is_banned", false)

  if (!students || students.length === 0) {
    return { success: true, data: { count: 0 } }
  }

  const rows = students.map((s) => ({
    user_id: s.id,
    type: "GENERAL" as const,
    title: title.trim(),
    body: body.trim(),
    is_read: false,
  }))

  // Insert in chunks of 500 to stay within Supabase payload limits
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    await admin.from("notifications").insert(rows.slice(i, i + CHUNK))
  }

  return { success: true, data: { count: students.length } }
}
