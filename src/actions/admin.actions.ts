"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { createQuestionSchema } from "@/lib/validations/question"
import { revalidatePath } from "next/cache"
import { subjectSimilarity } from "@/lib/subject-utils"
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

export async function getQuestion(id: string) {
  try { await requireAdmin() } catch { return null }
  const admin = createAdminClient()
  const { data } = await admin
    .from("questions")
    .select("id, text, explanation, year, school_id, subject_id, options(id, label, text, is_correct)")
    .eq("id", id)
    .single()
  return data ?? null
}

export async function updateQuestion(
  id: string,
  data: {
    text: string
    explanation?: string
    year?: number
    schoolId: string
    subjectId: string
    options: { label: "A" | "B" | "C" | "D"; text: string; isCorrect: boolean }[]
  }
): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch { return { success: false, error: "UNAUTHORIZED" } }

  const admin = createAdminClient()

  const { error: qErr } = await admin
    .from("questions")
    .update({
      text: data.text,
      explanation: data.explanation ?? null,
      year: data.year ?? null,
      school_id: data.schoolId,
      subject_id: data.subjectId,
    })
    .eq("id", id)

  if (qErr) return { success: false, error: "INTERNAL" }

  // Replace options — delete existing, re-insert with correct flags
  await admin.from("options").delete().eq("question_id", id)
  await admin.from("options").insert(
    data.options.map((opt) => ({
      question_id: id,
      label: opt.label,
      text: opt.text,
      is_correct: opt.isCorrect,
    }))
  )

  return { success: true, data: undefined }
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

export async function deleteQuestions(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  if (!ids.length) return { success: false, error: "No IDs provided" }

  const admin = createAdminClient()
  const { error } = await admin.from("questions").delete().in("id", ids)
  if (error) return { success: false, error: "INTERNAL" }
  return { success: true, data: { deleted: ids.length } }
}

export async function createSchool(name: string, abbreviation: string, location?: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const trimmedName = name.trim()
  const trimmedAbbr = abbreviation.trim().toUpperCase()
  if (!trimmedName || !trimmedAbbr) return { success: false, error: "Name and abbreviation are required" }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("schools")
    .insert({ name: trimmedName, abbreviation: trimmedAbbr, location: location?.trim() || null })
    .select("id")
    .single()

  if (error || !data) return { success: false, error: error?.message ?? "INTERNAL" }
  return { success: true, data: { id: data.id } }
}

export async function createSubject(name: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: "Name required" }

  const admin = createAdminClient()

  // Block exact normalized duplicates before hitting the DB
  const { data: existing } = await admin.from("subjects").select("name")
  const exactMatch = (existing ?? []).find(
    (s) => subjectSimilarity(trimmed, s.name) === "exact"
  )
  if (exactMatch) {
    return { success: false, error: `DUPLICATE:${exactMatch.name}` }
  }

  const { data, error } = await admin
    .from("subjects")
    .insert({ name: trimmed })
    .select("id")
    .single()

  if (error || !data) return { success: false, error: error?.message ?? "INTERNAL" }
  return { success: true, data: { id: data.id } }
}

export async function mergeSubjects(
  keepId: string,
  deleteId: string
): Promise<ActionResult<{ moved: number }>> {
  try {
    await requireAdmin()
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
  if (keepId === deleteId) return { success: false, error: "Same subject" }

  const admin = createAdminClient()

  // 1. Count then migrate questions
  const { count: qCount } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", deleteId)

  await admin
    .from("questions")
    .update({ subject_id: keepId })
    .eq("subject_id", deleteId)

  // 2. Migrate attempt_answers
  await admin
    .from("attempt_answers")
    .update({ subject_id: keepId })
    .eq("subject_id", deleteId)

  // 3. Migrate profiles.student_subject_ids (array field)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, student_subject_ids")
    .contains("student_subject_ids", [deleteId])

  for (const p of profiles ?? []) {
    const updated = [...new Set(
      (p.student_subject_ids ?? []).map((id: string) => id === deleteId ? keepId : id)
    )]
    await admin.from("profiles").update({ student_subject_ids: updated }).eq("id", p.id)
  }

  // 4. Delete the merged-away subject
  await admin.from("subjects").delete().eq("id", deleteId)

  revalidatePath("/admin/subjects")
  return { success: true, data: { moved: qCount ?? 0 } }
}

export async function getSubjects() {
  try {
    await requireAdmin()
  } catch {
    return null
  }

  const admin = createAdminClient()
  const { data: subjects } = await admin
    .from("subjects")
    .select("id, name")
    .order("name")

  if (!subjects) return []

  const { data: counts } = await admin
    .from("questions")
    .select("subject_id")

  const countMap: Record<string, number> = {}
  for (const q of counts ?? []) {
    countMap[q.subject_id] = (countMap[q.subject_id] ?? 0) + 1
  }

  return subjects.map((s) => ({ ...s, questionCount: countMap[s.id] ?? 0 }))
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()
}

export type CsvImportRow = {
  text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct: string
  explanation: string
  subject: string
  year?: string
}

export async function bulkImportQuestions(
  schoolId: string,
  rows: CsvImportRow[]
): Promise<ActionResult<{ created: number; failed: number; skipped: number; newSubjects: string[] }>> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, error: "UNAUTHORIZED" }
  }

  if (!schoolId) return { success: false, error: "School is required" }
  if (!rows.length) return { success: false, error: "No rows to import" }

  const admin = createAdminClient()

  // Load existing subjects
  const { data: existingSubjects } = await admin.from("subjects").select("id, name")
  const subjectMap = new Map<string, string>() // name.lower → id
  for (const s of existingSubjects ?? []) {
    subjectMap.set(s.name.toLowerCase().trim(), s.id)
  }

  // Find subjects that need to be created
  const newSubjectNames: string[] = []
  const uniqueSubjectNames = [...new Set(rows.map((r) => r.subject.trim()).filter(Boolean))]
  for (const name of uniqueSubjectNames) {
    if (!subjectMap.has(name.toLowerCase())) {
      newSubjectNames.push(name)
    }
  }

  // Create missing subjects
  for (const name of newSubjectNames) {
    const { data } = await admin.from("subjects").insert({ name }).select("id").single()
    if (data) subjectMap.set(name.toLowerCase(), data.id)
  }

  // Build a set of normalized existing question texts for this school to skip duplicates
  const { data: existingQuestions } = await admin
    .from("questions")
    .select("text")
    .eq("school_id", schoolId)
  const existingNorm = new Set(
    (existingQuestions ?? []).map((q) => normalizeText(q.text))
  )

  let created = 0
  let failed = 0
  let skipped = 0

  // Passage tracking — reuse the same passage record for consecutive rows that share identical text
  let currentPassageId: string | null = null
  let lastSeenPassageText = ""

  for (const row of rows) {
    const subjectId = subjectMap.get(row.subject.trim().toLowerCase())
    if (!subjectId) { failed++; continue }

    const correctLabel = row.correct.trim().toUpperCase() as "A" | "B" | "C" | "D"
    if (!["A", "B", "C", "D"].includes(correctLabel)) { failed++; continue }
    if (!row.text?.trim() || !row.option_a?.trim() || !row.option_b?.trim() || !row.option_c?.trim() || !row.option_d?.trim()) {
      failed++
      continue
    }

    // ── Passage detection ─────────────────────────────────────────────────────
    // CSV format: [PASSAGE: <passage text>] <actual question text>
    let questionText = row.text.trim()
    let passageId: string | null = null

    const passageMatch = questionText.match(/^\[PASSAGE:\s*([\s\S]+?)\]\s*([\s\S]*)$/)
    if (passageMatch) {
      const extractedPassage = passageMatch[1].trim()
      questionText = passageMatch[2].trim() || questionText // fallback to raw if capture empty

      if (extractedPassage !== lastSeenPassageText) {
        // New passage — create a record
        const { data: newPassage } = await (admin as any).from("passages").insert({
          text: extractedPassage,
          subject_id: subjectId,
          school_id: schoolId,
          year: row.year ? parseInt(row.year, 10) : null,
        }).select("id").single()

        currentPassageId = newPassage?.id ?? null
        lastSeenPassageText = extractedPassage
      }

      passageId = currentPassageId
    } else {
      // Non-passage row — reset tracker
      currentPassageId = null
      lastSeenPassageText = ""
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Skip if this question already exists in the bank for this school
    const norm = normalizeText(questionText)
    if (existingNorm.has(norm)) { skipped++; continue }
    existingNorm.add(norm)

    const yearNum = row.year ? parseInt(row.year, 10) : null
    const year = yearNum && yearNum >= 1990 && yearNum <= new Date().getFullYear() ? yearNum : null

    const qPayload: Record<string, unknown> = {
      text: questionText,
      explanation: row.explanation?.trim() || null,
      year,
      school_id: schoolId,
      subject_id: subjectId,
      image_url: null,
    }
    // Only include passage_id when a passage was actually created; omitting it
    // keeps the import working on DBs where the passages migration hasn't run yet.
    if (passageId) qPayload.passage_id = passageId

    const { data: question, error } = await (admin as any)
      .from("questions")
      .insert(qPayload)
      .select("id")
      .single()

    if (error || !question) { failed++; continue }

    await admin.from("options").insert([
      { question_id: question.id, label: "A" as const, text: row.option_a.trim(), is_correct: correctLabel === "A" },
      { question_id: question.id, label: "B" as const, text: row.option_b.trim(), is_correct: correctLabel === "B" },
      { question_id: question.id, label: "C" as const, text: row.option_c.trim(), is_correct: correctLabel === "C" },
      { question_id: question.id, label: "D" as const, text: row.option_d.trim(), is_correct: correctLabel === "D" },
    ])
    created++
  }

  return { success: true, data: { created, failed, skipped, newSubjects: newSubjectNames } }
}

// ── Duplicate detection ───────────────────────────────────────────────────────

export type DuplicateGroup = {
  normalizedText: string
  questions: Array<{
    id: string
    text: string
    year: number | null
    created_at: string
    school: { id: string; name: string; abbreviation: string } | null
    subject: { name: string } | null
  }>
}

export async function findDuplicateQuestions(
  schoolId?: string,
  page = 1,
  pageSize = 20
): Promise<{ groups: DuplicateGroup[]; total: number }> {
  try {
    await requireAdmin()
  } catch {
    return { groups: [], total: 0 }
  }

  const admin = createAdminClient()

  let q = admin
    .from("questions")
    .select("id, text, year, created_at, school:schools(id, name, abbreviation), subject:subjects(name)")
    .order("created_at", { ascending: true })

  // When filtering by school, only load questions from that school
  if (schoolId) q = q.eq("school_id", schoolId)

  const { data: questions } = await q
  if (!questions) return { groups: [], total: 0 }

  const map = new Map<string, DuplicateGroup["questions"]>()
  for (const raw of questions) {
    const key = normalizeText(raw.text)
    const existing = map.get(key) ?? []
    existing.push(raw as unknown as DuplicateGroup["questions"][0])
    map.set(key, existing)
  }

  const allGroups = [...map.entries()]
    .filter(([, qs]) => qs.length > 1)
    .map(([normalizedText, qs]) => ({ normalizedText, questions: qs }))
    .sort((a, b) => b.questions.length - a.questions.length)

  const total = allGroups.length
  const start = (page - 1) * pageSize
  const groups = allGroups.slice(start, start + pageSize)

  return { groups, total }
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
