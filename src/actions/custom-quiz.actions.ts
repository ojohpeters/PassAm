"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── Admin: create quiz ──────────────────────────────────────────────────────

export async function createCustomQuiz(title: string, description?: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  let code = generateCode()

  // retry once on collision
  const { data: existing } = await admin.from("custom_quizzes").select("id").eq("code", code).maybeSingle()
  if (existing) code = generateCode()

  const { data, error } = await admin
    .from("custom_quizzes")
    .insert({ title, description: description || null, code, created_by: user.id })
    .select("id, code")
    .single()

  if (error || !data) return { success: false, error: "INTERNAL" } as const
  revalidatePath("/admin/quizzes")
  return { success: true, data: { quizId: data.id as string, code: data.code as string } } as const
}

// ── Admin: list quizzes ─────────────────────────────────────────────────────

export async function getAdminQuizzes() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  const { data, error } = await admin
    .from("custom_quizzes")
    .select("id, title, description, code, is_active, created_at")
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: "INTERNAL" } as const

  // get item + attempt counts
  const quizzes = await Promise.all(
    (data ?? []).map(async (q: { id: string; title: string; description: string | null; code: string; is_active: boolean; created_at: string }) => {
      const [{ count: itemCount }, { count: attemptCount }] = await Promise.all([
        admin.from("custom_quiz_items").select("*", { count: "exact", head: true }).eq("quiz_id", q.id),
        admin.from("custom_quiz_attempts").select("*", { count: "exact", head: true }).eq("quiz_id", q.id).not("completed_at", "is", null),
      ])
      return { ...q, itemCount: itemCount ?? 0, attemptCount: attemptCount ?? 0 }
    })
  )

  return { success: true, data: quizzes } as const
}

// ── Admin: get single quiz with items ───────────────────────────────────────

export async function getAdminQuiz(quizId: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  const { data: quiz, error } = await admin
    .from("custom_quizzes")
    .select("id, title, description, code, is_active, time_limit_minutes, show_calculator, created_at")
    .eq("id", quizId)
    .single()

  if (error || !quiz) return { success: false, error: "NOT_FOUND" } as const

  const { data: items } = await admin
    .from("custom_quiz_items")
    .select("id, order_index, source, bank_question_id, q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label")
    .eq("quiz_id", quizId)
    .order("order_index")

  const { count: attemptCount } = await admin
    .from("custom_quiz_attempts")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quizId)
    .not("completed_at", "is", null)

  return { success: true, data: { quiz, items: items ?? [], attemptCount: attemptCount ?? 0 } } as const
}

// ── Admin: add bank question ────────────────────────────────────────────────

export async function addBankQuestionToQuiz(quizId: string, bankQuestionId: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()

  // Fetch full question with options and subject
  const { data: q, error } = await admin
    .from("questions")
    .select("id, text, explanation, subject:subjects(name), options(id, label, text, is_correct)")
    .eq("id", bankQuestionId)
    .single()

  if (error || !q) return { success: false, error: "NOT_FOUND" } as const

  const opts = (q.options ?? []) as { id: string; label: string; text: string; is_correct: boolean }[]
  const getOpt = (label: string) => opts.find((o) => o.label === label)?.text ?? ""
  const correctOpt = opts.find((o) => o.is_correct)
  if (!correctOpt) return { success: false, error: "INVALID_QUESTION" } as const

  // Get next order index
  const { count } = await admin.from("custom_quiz_items").select("*", { count: "exact", head: true }).eq("quiz_id", quizId)

  const { error: insertError } = await admin.from("custom_quiz_items").insert({
    quiz_id: quizId,
    order_index: (count ?? 0),
    source: "bank",
    bank_question_id: bankQuestionId,
    q_text: q.text,
    opt_a: getOpt("A"),
    opt_b: getOpt("B"),
    opt_c: getOpt("C"),
    opt_d: getOpt("D"),
    correct: correctOpt.label,
    explanation: q.explanation ?? null,
    subject_label: (q.subject as { name: string } | null)?.name ?? null,
  })

  if (insertError) return { success: false, error: "INTERNAL" } as const
  revalidatePath(`/admin/quizzes/${quizId}`)
  return { success: true } as const
}

// ── Admin: add custom question ──────────────────────────────────────────────

export async function addCustomQuestionToQuiz(
  quizId: string,
  data: { text: string; optA: string; optB: string; optC: string; optD: string; correct: string; explanation?: string; subjectLabel?: string }
) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  const { count } = await admin.from("custom_quiz_items").select("*", { count: "exact", head: true }).eq("quiz_id", quizId)

  const { error } = await admin.from("custom_quiz_items").insert({
    quiz_id: quizId,
    order_index: (count ?? 0),
    source: "custom",
    q_text: data.text,
    opt_a: data.optA,
    opt_b: data.optB,
    opt_c: data.optC,
    opt_d: data.optD,
    correct: data.correct,
    explanation: data.explanation ?? null,
    subject_label: data.subjectLabel ?? null,
  })

  if (error) return { success: false, error: "INTERNAL" } as const
  revalidatePath(`/admin/quizzes/${quizId}`)
  return { success: true } as const
}

// ── Admin: remove item ──────────────────────────────────────────────────────

export async function removeQuizItem(itemId: string, quizId: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  await admin.from("custom_quiz_items").delete().eq("id", itemId)
  revalidatePath(`/admin/quizzes/${quizId}`)
  return { success: true } as const
}

// ── Admin: move item up/down ────────────────────────────────────────────────

export async function moveQuizItem(itemId: string, quizId: string, direction: "up" | "down") {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  const { data: items } = await admin
    .from("custom_quiz_items")
    .select("id, order_index")
    .eq("quiz_id", quizId)
    .order("order_index")

  if (!items) return { success: false, error: "NOT_FOUND" } as const

  const idx = items.findIndex((i: { id: string }) => i.id === itemId)
  if (idx === -1) return { success: false, error: "NOT_FOUND" } as const

  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= items.length) return { success: true } as const

  const current = items[idx]
  const swap = items[swapIdx]

  await Promise.all([
    admin.from("custom_quiz_items").update({ order_index: swap.order_index }).eq("id", current.id),
    admin.from("custom_quiz_items").update({ order_index: current.order_index }).eq("id", swap.id),
  ])

  revalidatePath(`/admin/quizzes/${quizId}`)
  return { success: true } as const
}

// ── Admin: toggle active ────────────────────────────────────────────────────

export async function toggleQuizActive(quizId: string, isActive: boolean) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  await admin.from("custom_quizzes").update({ is_active: isActive }).eq("id", quizId)
  revalidatePath(`/admin/quizzes/${quizId}`)
  revalidatePath("/admin/quizzes")
  return { success: true } as const
}

// ── Admin: update quiz title/description ───────────────────────────────────

export async function updateQuizMeta(quizId: string, title: string, description?: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  await admin.from("custom_quizzes").update({ title, description: description || null }).eq("id", quizId)
  revalidatePath(`/admin/quizzes/${quizId}`)
  return { success: true } as const
}

// ── Admin: delete quiz ──────────────────────────────────────────────────────

export async function deleteQuiz(quizId: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  await admin.from("custom_quizzes").delete().eq("id", quizId)
  revalidatePath("/admin/quizzes")
  return { success: true } as const
}

// ── Admin: search bank questions ────────────────────────────────────────────

export async function searchBankQuestions(schoolId?: string, subjectId?: string, query?: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()

  let q = admin
    .from("questions")
    .select("id, text, subject:subjects(id, name), school:schools(id, abbreviation)")
    .eq("is_bank_question", true)
    .order("created_at", { ascending: false })
    .limit(60)

  if (schoolId) q = q.eq("school_id", schoolId)
  if (subjectId) q = q.eq("subject_id", subjectId)
  if (query?.trim()) q = q.ilike("text", `%${query.trim()}%`)

  const { data, error } = await q
  if (error) return { success: false, error: "INTERNAL" } as const

  return { success: true, data: data ?? [] } as const
}

// ── Public: get quiz for display ────────────────────────────────────────────

export async function getPublicQuiz(code: string) {
  const admin: AdminClient = createAdminClient()

  const { data: quiz, error } = await admin
    .from("custom_quizzes")
    .select("id, title, description, code, is_active, time_limit_minutes, show_calculator")
    .eq("code", code)
    .single()

  if (error || !quiz) return { success: false, error: "NOT_FOUND" } as const
  if (!quiz.is_active) return { success: false, error: "INACTIVE" } as const

  const { data: items } = await admin
    .from("custom_quiz_items")
    .select("id, order_index, q_text, opt_a, opt_b, opt_c, opt_d, subject_label")
    .eq("quiz_id", quiz.id)
    .order("order_index")

  return {
    success: true,
    data: {
      id: quiz.id as string,
      title: quiz.title as string,
      description: quiz.description as string | null,
      code: quiz.code as string,
      timeLimitMinutes: (quiz.time_limit_minutes as number | null) ?? null,
      showCalculator: (quiz.show_calculator as boolean) ?? false,
      items: (items ?? []) as { id: string; order_index: number; q_text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; subject_label: string | null }[],
    },
  } as const
}

// ── Public: start attempt ───────────────────────────────────────────────────

export async function startQuizAttempt(code: string, displayName: string) {
  const admin: AdminClient = createAdminClient()

  // Try to get user but don't require it
  let userId: string | null = null
  try {
    const user = await getAppUser()
    if (user) userId = user.id
  } catch {
    // not authenticated — fine
  }

  const { data: quiz } = await admin
    .from("custom_quizzes")
    .select("id")
    .eq("code", code)
    .eq("is_active", true)
    .single()

  if (!quiz) return { success: false, error: "NOT_FOUND" } as const

  const { count: total } = await admin
    .from("custom_quiz_items")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quiz.id)

  const { data: attempt, error } = await admin
    .from("custom_quiz_attempts")
    .insert({
      quiz_id: quiz.id,
      user_id: userId,
      display_name: displayName.trim().slice(0, 60),
      total: total ?? 0,
    })
    .select("id")
    .single()

  if (error || !attempt) return { success: false, error: "INTERNAL" } as const
  return { success: true, data: { attemptId: attempt.id as string } } as const
}

// ── Public: answer one item ─────────────────────────────────────────────────

export async function answerQuizItem(attemptId: string, itemId: string, selected: string) {
  const admin: AdminClient = createAdminClient()

  const [{ data: attempt }, { data: item }] = await Promise.all([
    admin.from("custom_quiz_attempts").select("id, quiz_id, answers, completed_at").eq("id", attemptId).single(),
    admin.from("custom_quiz_items").select("correct, explanation").eq("id", itemId).single(),
  ])

  if (!attempt || !item) return { success: false, error: "NOT_FOUND" } as const
  if (attempt.completed_at) return { success: false, error: "ALREADY_COMPLETED" } as const

  const isCorrect = selected === item.correct

  const updatedAnswers = { ...(attempt.answers ?? {}), [itemId]: selected }
  await admin.from("custom_quiz_attempts").update({ answers: updatedAnswers }).eq("id", attemptId)

  return {
    success: true,
    data: { isCorrect, correct: item.correct as string, explanation: item.explanation as string | null },
  } as const
}

// ── Public: complete attempt ────────────────────────────────────────────────

export async function completeQuizAttempt(attemptId: string) {
  const admin: AdminClient = createAdminClient()

  const { data: attempt } = await admin
    .from("custom_quiz_attempts")
    .select("id, quiz_id, answers, total, completed_at")
    .eq("id", attemptId)
    .single()

  if (!attempt) return { success: false, error: "NOT_FOUND" } as const
  if (attempt.completed_at) return { success: true, data: { score: attempt.score as number, total: attempt.total as number } } as const

  // Count correct answers
  const answers = (attempt.answers ?? {}) as Record<string, string>
  const itemIds = Object.keys(answers)

  let score = 0
  if (itemIds.length > 0) {
    const { data: items } = await admin
      .from("custom_quiz_items")
      .select("id, correct")
      .in("id", itemIds)
    score = (items ?? []).filter((item: { id: string; correct: string }) => answers[item.id] === item.correct).length
  }

  await admin
    .from("custom_quiz_attempts")
    .update({ score, completed_at: new Date().toISOString() })
    .eq("id", attemptId)

  return { success: true, data: { score, total: attempt.total as number } } as const
}

// ── Public: get attempt results (with corrections) ──────────────────────────

export async function getQuizAttemptResults(attemptId: string) {
  const admin: AdminClient = createAdminClient()

  const { data: attempt, error } = await admin
    .from("custom_quiz_attempts")
    .select("id, quiz_id, display_name, score, total, answers, completed_at")
    .eq("id", attemptId)
    .single()

  if (error || !attempt) return { success: false, error: "NOT_FOUND" } as const

  const { data: quiz } = await admin
    .from("custom_quizzes")
    .select("title, code")
    .eq("id", attempt.quiz_id)
    .single()

  const { data: items } = await admin
    .from("custom_quiz_items")
    .select("id, order_index, q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label")
    .eq("quiz_id", attempt.quiz_id)
    .order("order_index")

  const answers = (attempt.answers ?? {}) as Record<string, string>

  const reviewItems = (items ?? []).map((item: { id: string; order_index: number; q_text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; correct: string; explanation: string | null; subject_label: string | null }) => ({
    ...item,
    selected: answers[item.id] ?? null,
    isCorrect: answers[item.id] === item.correct,
  }))

  return {
    success: true,
    data: {
      attemptId: attempt.id as string,
      displayName: attempt.display_name as string,
      score: attempt.score as number,
      total: attempt.total as number,
      completedAt: attempt.completed_at as string,
      quizTitle: quiz?.title as string,
      quizCode: quiz?.code as string,
      items: reviewItems,
    },
  } as const
}

// ── Admin: update quiz settings (time limit, calculator) ───────────────────

export async function updateQuizSettings(
  quizId: string,
  timeLimitMinutes: number | null,
  showCalculator: boolean
) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  await admin
    .from("custom_quizzes")
    .update({ time_limit_minutes: timeLimitMinutes ?? null, show_calculator: showCalculator })
    .eq("id", quizId)
  revalidatePath(`/admin/quizzes/${quizId}`)
  return { success: true } as const
}

// ── Admin: bulk add custom questions via CSV ────────────────────────────────

export async function bulkAddCustomQuestionsToQuiz(
  quizId: string,
  rows: Array<{
    text: string; optA: string; optB: string; optC: string; optD: string
    correct: string; explanation?: string; subjectLabel?: string
  }>
) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" } as const

  const admin: AdminClient = createAdminClient()
  const { count: startIdx } = await admin
    .from("custom_quiz_items")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quizId)

  const inserts = rows.map((row, i) => ({
    quiz_id: quizId,
    order_index: (startIdx ?? 0) + i,
    source: "custom",
    q_text: row.text,
    opt_a: row.optA,
    opt_b: row.optB,
    opt_c: row.optC,
    opt_d: row.optD,
    correct: row.correct.toUpperCase(),
    explanation: row.explanation ?? null,
    subject_label: row.subjectLabel ?? null,
  }))

  const { error } = await admin.from("custom_quiz_items").insert(inserts)
  if (error) return { success: false, error: "INTERNAL" } as const
  revalidatePath(`/admin/quizzes/${quizId}`)
  return { success: true, data: { count: rows.length } } as const
}

// ── Public: leaderboard ─────────────────────────────────────────────────────

export async function getQuizLeaderboard(code: string) {
  const admin: AdminClient = createAdminClient()

  const { data: quiz } = await admin
    .from("custom_quizzes")
    .select("id, title")
    .eq("code", code)
    .single()

  if (!quiz) return { success: false, error: "NOT_FOUND" } as const

  const { data: entries } = await admin
    .from("custom_quiz_attempts")
    .select("id, display_name, score, total, completed_at")
    .eq("quiz_id", quiz.id)
    .not("completed_at", "is", null)
    .order("score", { ascending: false })
    .order("completed_at", { ascending: true })
    .limit(50)

  return {
    success: true,
    data: { title: quiz.title as string, entries: entries ?? [] },
  } as const
}
