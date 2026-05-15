"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { submitExamSchema } from "@/lib/validations/exam"
import { updateStreak } from "./notification.actions"
import type { ActionResult, QuestionWithOptions, ExamResult, StudyQuestion } from "@/types"

const EXAM_QUESTION_COUNT = 40
const EXAM_TIME_LIMIT_SECS = 3600
const SECS_PER_QUESTION = 90 // 1.5 min per question
const FREE_TIER_MONTHLY_LIMIT = 3

// Returns IDs of questions this student has already seen for a given subject.
// Scoped to a specific school so cross-school pools don't bleed into each other.
async function getSeenQuestionIds(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  subjectId: string,
  schoolId?: string
): Promise<Set<string>> {
  let q = admin.from("exam_attempts").select("id").eq("user_id", userId)
  if (schoolId) q = q.eq("school_id", schoolId)
  const { data: attempts } = await q
  if (!attempts?.length) return new Set()

  const { data: answers } = await admin
    .from("attempt_answers")
    .select("question_id")
    .in("attempt_id", attempts.map((a) => a.id))
    .eq("subject_id", subjectId)

  return new Set((answers ?? []).map((a) => a.question_id))
}

// Shuffles a pool, putting unseen questions first and seen ones last.
// This guarantees variety across repeated exam attempts.
function shuffleWithPriority<T extends { id: string }>(
  pool: T[],
  seenIds: Set<string>
): T[] {
  const unseen = pool.filter((q) => !seenIds.has(q.id)).sort(() => Math.random() - 0.5)
  const seen   = pool.filter((q) =>  seenIds.has(q.id)).sort(() => Math.random() - 0.5)
  return [...unseen, ...seen]
}

export async function startExam(
  schoolId: string,
  subjectIds: string[],
  totalQuestions = 10,
  perSubjectCounts?: Record<string, number>,
  studentDurationMins?: number,
  year?: number
): Promise<ActionResult<{ attemptId: string; questions: QuestionWithOptions[]; timeLimitSecs: number }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  if (!subjectIds.length) return { success: false, error: "NO_SUBJECTS" }

  const clampedTotal = Math.max(1, totalQuestions)

  const admin = createAdminClient()

  const { data: school } = await admin
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .single()
  if (!school) return { success: false, error: "NOT_FOUND" }

  const { data: cfg } = await admin
    .from("school_exam_config")
    .select("total_questions, subject_question_counts, duration_mins")
    .eq("school_id", schoolId)
    .single()

  const totalTarget = clampedTotal
  const timeLimitSecs = studentDurationMins
    ? Math.min(3600, studentDurationMins * 60)
    : cfg?.duration_mins
    ? cfg.duration_mins * 60
    : clampedTotal * SECS_PER_QUESTION

  const selected: QuestionWithOptions[] = []

  for (let i = 0; i < subjectIds.length; i++) {
    const subjectId = subjectIds[i]
    const idealPerSubject = perSubjectCounts?.[subjectId] ?? Math.floor(totalTarget / subjectIds.length)

    const baseQuery = admin
      .from("questions")
      .select(`
        id, text, image_url, explanation, year, school_id, subject_id,
        options(id, label, text),
        subject:subjects(name)
      `)
      .eq("school_id", schoolId)
      .eq("subject_id", subjectId)

    const { data: pool } = await (year ? baseQuery.eq("year", year) : baseQuery)

    if (!pool || pool.length === 0) {
      return { success: false, error: "INSUFFICIENT_QUESTIONS" }
    }

    const seenIds = await getSeenQuestionIds(admin, user.id, subjectId, schoolId)
    const take = Math.min(idealPerSubject, pool.length)
    const picked = shuffleWithPriority(pool, seenIds)
      .slice(0, take) as unknown as QuestionWithOptions[]
    selected.push(...picked)
  }

  const { data: attempt, error: attemptErr } = await admin
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      school_id: schoolId,
      total_questions: selected.length,
      score: 0,
    })
    .select("id")
    .single()

  if (attemptErr || !attempt) return { success: false, error: "INTERNAL" }

  await admin.from("attempt_answers").insert(
    selected.map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      subject_id: q.subject_id,
      is_correct: false,
    }))
  )

  return {
    success: true,
    data: { attemptId: attempt.id, questions: selected, timeLimitSecs },
  }
}

export async function startGeneralExam(
  subjectIds: string[],
  totalQuestions = 10
): Promise<ActionResult<{ attemptId: string; questions: QuestionWithOptions[]; timeLimitSecs: number }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  if (!subjectIds.length) return { success: false, error: "NO_SUBJECTS" }

  const admin = createAdminClient()

  const { data: generalSchool } = await admin
    .from("schools")
    .select("id")
    .eq("abbreviation", "GENERAL")
    .single()

  if (!generalSchool) return { success: false, error: "GENERAL_NOT_SETUP" }

  const clampedTotal = Math.max(1, totalQuestions)
  const perSubject = Math.floor(clampedTotal / subjectIds.length)
  const selected: QuestionWithOptions[] = []

  for (const subjectId of subjectIds) {
    const { data: pool } = await admin
      .from("questions")
      .select(`
        id, text, image_url, explanation, year, school_id, subject_id,
        options(id, label, text),
        subject:subjects(name)
      `)
      .eq("subject_id", subjectId)

    if (!pool || pool.length === 0) {
      return { success: false, error: "INSUFFICIENT_QUESTIONS" }
    }

    const seenIds = await getSeenQuestionIds(admin, user.id, subjectId)
    const take = Math.min(perSubject, pool.length)
    const picked = shuffleWithPriority(pool, seenIds)
      .slice(0, take) as unknown as QuestionWithOptions[]
    selected.push(...picked)
  }

  const { data: attempt, error: attemptErr } = await admin
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      school_id: generalSchool.id,
      total_questions: selected.length,
      score: 0,
    })
    .select("id")
    .single()

  if (attemptErr || !attempt) return { success: false, error: "INTERNAL" }

  await admin.from("attempt_answers").insert(
    selected.map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      subject_id: q.subject_id,
      is_correct: false,
    }))
  )

  return {
    success: true,
    data: { attemptId: attempt.id, questions: selected, timeLimitSecs: selected.length * SECS_PER_QUESTION },
  }
}

export async function submitExam(
  input: unknown
): Promise<ActionResult<ExamResult>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const parsed = submitExamSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "VALIDATION_ERROR" }

  const { attemptId, answers, timeTakenSecs } = parsed.data

  const admin = createAdminClient()

  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("user_id, total_questions, completed_at")
    .eq("id", attemptId)
    .single()

  if (!attempt) return { success: false, error: "NOT_FOUND" }
  if (attempt.user_id !== user.id) return { success: false, error: "FORBIDDEN" }
  if (attempt.completed_at !== null) return { success: false, error: "VALIDATION_ERROR" }

  const { data: existingAnswers } = await admin
    .from("attempt_answers")
    .select("question_id, subject_id")
    .eq("attempt_id", attemptId)

  if (!existingAnswers) return { success: false, error: "INTERNAL" }

  const questionIds = existingAnswers.map((a) => a.question_id)

  const { data: correctOptions } = await admin
    .from("options")
    .select("id, question_id")
    .in("question_id", questionIds)
    .eq("is_correct", true)

  const correctMap = new Map((correctOptions ?? []).map((o) => [o.question_id, o.id]))
  const subjectMap = new Map(existingAnswers.map((a) => [a.question_id, a.subject_id]))
  const submittedMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]))

  let score = 0
  const upsertRows = questionIds.map((questionId) => {
    const selectedOptionId = submittedMap.get(questionId) ?? null
    const isCorrect = selectedOptionId !== null && selectedOptionId === correctMap.get(questionId)
    if (isCorrect) score++
    return {
      attempt_id: attemptId,
      question_id: questionId,
      subject_id: subjectMap.get(questionId)!,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
    }
  })

  const { error: upsertErr } = await admin
    .from("attempt_answers")
    .upsert(upsertRows, { onConflict: "attempt_id,question_id" })

  if (upsertErr) return { success: false, error: "INTERNAL" }

  const { error: updateErr } = await admin
    .from("exam_attempts")
    .update({ score, time_taken_secs: timeTakenSecs, completed_at: new Date().toISOString() })
    .eq("id", attemptId)

  if (updateErr) return { success: false, error: "INTERNAL" }

  updateStreak(user.id).catch(console.error)

  return {
    success: true,
    data: {
      attemptId,
      score,
      totalQuestions: attempt.total_questions,
      percentage: Math.round((score / attempt.total_questions) * 100),
    },
  }
}

export async function getAttemptResult(attemptId: string) {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" } as const

  const admin = createAdminClient()

  const { data: attempt } = await admin
    .from("exam_attempts")
    .select(`
      id, score, total_questions, completed_at, user_id,
      school:schools(name, abbreviation),
      attempt_answers(
        id, is_correct, selected_option_id,
        question:questions(
          id, text, explanation, image_url,
          options(id, label, text, is_correct),
          subject:subjects(name)
        )
      )
    `)
    .eq("id", attemptId)
    .single()

  if (!attempt) return { success: false, error: "NOT_FOUND" } as const
  if (attempt.user_id !== user.id && user.role !== "ADMIN") {
    return { success: false, error: "FORBIDDEN" } as const
  }
  if (!attempt.completed_at) return { success: false, error: "VALIDATION_ERROR" } as const

  // Transform to camelCase shape expected by results page
  const shaped = {
    id: attempt.id,
    score: attempt.score,
    totalQuestions: attempt.total_questions,
    completedAt: attempt.completed_at,
    school: attempt.school as unknown as { name: string; abbreviation: string },
    answers: (attempt.attempt_answers as unknown as any[]).map((a) => ({
      id: a.id,
      isCorrect: a.is_correct,
      selectedOptionId: a.selected_option_id,
      question: {
        text: a.question?.text ?? "",
        explanation: a.question?.explanation ?? null,
        options: (a.question?.options ?? []).map((o: any) => ({
          id: o.id,
          label: o.label,
          text: o.text,
          isCorrect: o.is_correct,
        })),
        subject: a.question?.subject ?? { name: "" },
      },
    })),
  }

  return { success: true, data: shaped } as const
}

export async function getAttemptHistory(page = 1, limit = 10) {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" } as const

  const admin = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data: attempts, count } = await admin
    .from("exam_attempts")
    .select(`
      id, score, total_questions, created_at,
      school:schools(name, abbreviation)
    `, { count: "exact" })
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  const total = count ?? 0
  const shaped = (attempts ?? []).map((a) => ({
    id: a.id,
    score: a.score,
    totalQuestions: a.total_questions,
    createdAt: a.created_at,
    school: a.school as unknown as { name: string; abbreviation: string },
  }))

  return {
    success: true,
    data: { attempts: shaped, total, pages: Math.ceil(total / limit) },
  } as const
}

// ── Study Mode ────────────────────────────────────────────────────────────────
// Fetches questions for a study session. No exam_attempt is created; results
// are never persisted. Options include is_correct so instant feedback can work.
export async function getStudyQuestions(
  configs: { subjectId: string; count: number }[],
  schoolId: string,
  year?: number
): Promise<ActionResult<StudyQuestion[]>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  if (!configs.length) return { success: false, error: "NO_SUBJECTS" }

  const admin = createAdminClient()

  const selected: StudyQuestion[] = []

  for (const { subjectId, count } of configs) {
    const take = Math.max(1, count)

    let q = admin
      .from("questions")
      .select(`
        id, text, image_url, explanation, year, subject_id,
        options(id, label, text, is_correct),
        subject:subjects(name)
      `)
      .eq("school_id", schoolId)
      .eq("subject_id", subjectId)

    if (year) q = q.eq("year", year) as typeof q

    const { data: pool } = await q

    if (!pool || pool.length === 0) continue

    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    selected.push(...(shuffled.slice(0, take) as unknown as StudyQuestion[]))
  }

  if (!selected.length) return { success: false, error: "INSUFFICIENT_QUESTIONS" }

  return { success: true, data: selected }
}
