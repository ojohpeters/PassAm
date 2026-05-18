"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden")
  return user
}

// New tables not in generated types — use any-cast helpers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyAdmin = (): any => createAdminClient()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = async (): Promise<any> => createClient()

// ─── Admin: Set CRUD ──────────────────────────────────────────────────────────

export async function createQuestionSet(data: {
  title: string; slug: string; description: string; emoji: string; schoolId: string | null
}): Promise<{ error?: string; id?: string }> {
  await requireAdmin()
  const db = anyAdmin()

  const { data: row, error } = await db
    .from("question_sets")
    .insert({
      title: data.title.trim(),
      slug: data.slug.trim(),
      description: data.description.trim() || null,
      emoji: data.emoji.trim() || "📚",
      school_id: data.schoolId || null,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/admin/sets")
  return { id: row.id }
}

export async function updateQuestionSet(
  setId: string,
  data: { title?: string; slug?: string; description?: string; emoji?: string; schoolId?: string | null; isPublished?: boolean }
): Promise<{ error?: string }> {
  await requireAdmin()
  const db = anyAdmin()

  const update: Record<string, unknown> = {}
  if (data.title       !== undefined) update.title        = data.title.trim()
  if (data.slug        !== undefined) update.slug         = data.slug.trim()
  if (data.description !== undefined) update.description  = data.description?.trim() || null
  if (data.emoji       !== undefined) update.emoji        = data.emoji.trim() || "📚"
  if (data.schoolId    !== undefined) update.school_id    = data.schoolId || null
  if (data.isPublished !== undefined) update.is_published = data.isPublished

  const { error } = await db.from("question_sets").update(update).eq("id", setId)
  if (error) return { error: error.message }
  revalidatePath("/admin/sets")
  revalidatePath(`/admin/sets/${setId}`)
  revalidatePath("/sets")
  return {}
}

export async function deleteQuestionSet(setId: string): Promise<{ error?: string }> {
  await requireAdmin()
  const { error } = await anyAdmin().from("question_sets").delete().eq("id", setId)
  if (error) return { error: error.message }
  revalidatePath("/admin/sets")
  revalidatePath("/sets")
  return {}
}

export async function getAdminSets() {
  await requireAdmin()
  const { data } = await anyAdmin()
    .from("question_sets")
    .select(`id, title, slug, description, emoji, is_published, created_at,
      school:schools(name, abbreviation),
      question_set_questions(count)`)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getAdminSet(setId: string) {
  await requireAdmin()
  const db = anyAdmin()

  const { data: set } = await db
    .from("question_sets")
    .select("id, title, slug, description, emoji, is_published, school_id, school:schools(name, abbreviation)")
    .eq("id", setId)
    .single()

  if (!set) return null

  const { data: items } = await db
    .from("question_set_questions")
    .select(`id, sort_order, in_bank,
      question:questions(id, text, explanation, year, is_bank_question,
        subject:subjects(name),
        options(id, label, text, is_correct))`)
    .eq("set_id", setId)
    .order("sort_order", { ascending: true })

  return { ...set, items: items ?? [] }
}

// ─── Admin: Question management ───────────────────────────────────────────────

export async function createAndAddQuestion(
  setId: string,
  q: {
    text: string; schoolId: string; subjectId: string; explanation: string
    options: { label: string; text: string; isCorrect: boolean }[]
    inBank: boolean
  }
): Promise<{ error?: string }> {
  await requireAdmin()
  const db = anyAdmin()

  const { data: question, error: qErr } = await db
    .from("questions")
    .insert({
      text: q.text.trim(),
      school_id: q.schoolId,
      subject_id: q.subjectId,
      explanation: q.explanation?.trim() || null,
      is_bank_question: q.inBank,
    })
    .select("id")
    .single()

  if (qErr || !question) return { error: qErr?.message ?? "Failed to create question" }

  await db.from("options").insert(
    q.options.map((o, i) => ({
      question_id: question.id,
      label: o.label,
      text: o.text.trim(),
      is_correct: o.isCorrect,
      sort_order: i,
    }))
  )

  const { data: last } = await db
    .from("question_set_questions")
    .select("sort_order")
    .eq("set_id", setId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  await db.from("question_set_questions").insert({
    set_id: setId,
    question_id: question.id,
    sort_order: (last?.sort_order ?? 0) + 1,
    in_bank: q.inBank,
  })

  revalidatePath(`/admin/sets/${setId}`)
  return {}
}

export async function addExistingQuestion(setId: string, questionId: string): Promise<{ error?: string }> {
  await requireAdmin()
  const { error } = await anyAdmin().from("question_set_questions").insert({
    set_id: setId, question_id: questionId, in_bank: true,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/sets/${setId}`)
  return {}
}

export async function removeQuestionFromSet(setId: string, questionId: string): Promise<{ error?: string }> {
  await requireAdmin()
  const { error } = await anyAdmin()
    .from("question_set_questions")
    .delete()
    .eq("set_id", setId)
    .eq("question_id", questionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/sets/${setId}`)
  return {}
}

export async function searchBankQuestions(params: {
  schoolId?: string; subjectId?: string; q?: string; setId: string
}) {
  await requireAdmin()
  const db = anyAdmin()

  let query = db
    .from("questions")
    .select("id, text, year, subject:subjects(name)")
    .eq("is_bank_question", true)
    .order("created_at", { ascending: false })
    .limit(50)

  if (params.schoolId)  query = query.eq("school_id", params.schoolId)
  if (params.subjectId) query = query.eq("subject_id", params.subjectId)
  if (params.q)         query = query.ilike("text", `%${params.q}%`)

  const { data: questions } = await query

  const { data: already } = await db
    .from("question_set_questions")
    .select("question_id")
    .eq("set_id", params.setId)

  const alreadyIds = new Set((already ?? []).map((r: { question_id: string }) => r.question_id))
  return (questions ?? []).map((q: { id: string; text: string; year: number | null; subject: { name: string } }) => ({
    ...q, alreadyInSet: alreadyIds.has(q.id),
  }))
}

// ─── Student: published sets ───────────────────────────────────────────────────

export async function getPublishedSets(userSchoolId?: string | null) {
  const supabase = await anyClient()
  const { data } = await supabase
    .from("question_sets")
    .select(`id, title, slug, description, emoji, school_id,
      school:schools(name, abbreviation),
      question_set_questions(count)`)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
  return (data ?? []).filter((s: { school_id: string | null }) => !s.school_id || s.school_id === userSchoolId)
}

export async function getSetBySlug(slug: string) {
  const supabase = await anyClient()

  const { data: set } = await supabase
    .from("question_sets")
    .select("id, title, description, emoji, school_id, school:schools(name)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!set) return null

  const { data: items } = await supabase
    .from("question_set_questions")
    .select(`sort_order,
      question:questions(id, text, explanation,
        subject:subjects(name),
        options(id, label, text, is_correct))`)
    .eq("set_id", set.id)
    .order("sort_order", { ascending: true })

  return {
    ...set,
    questions: (items ?? [])
      .filter((i: { question: unknown }) => i.question)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((i: any) => ({
        id: i.question.id,
        text: i.question.text,
        explanation: i.question.explanation ?? null,
        subjectName: i.question.subject?.name ?? "",
        options: (i.question.options ?? []).map((o: { id: string; label: string; text: string; is_correct: boolean }) => ({
          id: o.id, label: o.label, text: o.text, isCorrect: o.is_correct,
        })),
      })),
  }
}
