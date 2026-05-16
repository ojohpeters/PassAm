"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { todayWAT, seededShuffle } from "@/lib/utils"
import { updateStreak } from "./notification.actions"
import type { ActionResult } from "@/types"

const DAILY_QUIZ_COUNT = 10

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

async function getOrCreateQuizSeed(
  admin: AdminClient,
  schoolKey: string,
  date: string,
  subjectIds: string[]
): Promise<string[]> {
  const { data: existing } = await admin
    .from("daily_question_seeds")
    .select("question_ids")
    .eq("school_key", schoolKey)
    .eq("seed_date", date)
    .eq("seed_type", "quiz")
    .maybeSingle() as { data: { question_ids: string[] } | null }

  if (existing) return existing.question_ids

  let pool: { id: string }[] = []

  if (schoolKey !== "GENERAL") {
    const { data: school } = await admin
      .from("schools")
      .select("id")
      .eq("abbreviation", schoolKey)
      .maybeSingle() as { data: { id: string } | null }

    if (school) {
      const { data } = await admin.from("questions").select("id").eq("school_id", school.id).limit(500)
      pool = data ?? []
    }
  }

  if (pool.length === 0) {
    let q = admin.from("questions").select("id").limit(500)
    if (subjectIds.length > 0) q = q.in("subject_id", subjectIds)
    const { data } = await q
    pool = data ?? []
  }

  if (pool.length < DAILY_QUIZ_COUNT) return []

  // Exclude questions used in the last 7 days to avoid repeats
  const { data: recentSeeds } = await admin
    .from("daily_question_seeds")
    .select("question_ids")
    .eq("school_key", schoolKey)
    .eq("seed_type", "quiz")
    .neq("seed_date", date)
    .order("seed_date", { ascending: false })
    .limit(7) as { data: { question_ids: string[] }[] | null }

  const recentIds = new Set((recentSeeds ?? []).flatMap((s) => s.question_ids))
  const freshPool = pool.filter((q) => !recentIds.has(q.id))
  const sourcePool = freshPool.length >= DAILY_QUIZ_COUNT ? freshPool : pool

  const shuffled = seededShuffle(sourcePool, schoolKey, date)
  const selected = shuffled.slice(0, DAILY_QUIZ_COUNT).map((q) => q.id)

  await admin.from("daily_question_seeds").upsert(
    { school_key: schoolKey, seed_date: date, seed_type: "quiz", question_ids: selected },
    { onConflict: "school_key,seed_date,seed_type" }
  )

  return selected
}

export async function getDailyQuiz() {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" } as const

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: AdminClient = createAdminClient()
  const today = todayWAT()

  const { data: existing } = await admin
    .from("daily_quizzes")
    .select(`
      id, score, completed_at,
      daily_quiz_questions(
        id, question_id, selected_option_id, is_correct,
        question:questions(
          id, text, explanation,
          options(id, label, text),
          subject:subjects(name)
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("date", today)
    .single()

  if (existing) return { success: true, data: shapeQuiz(existing) } as const

  // Determine school key from target_school abbreviation
  const { data: profile } = await admin
    .from("profiles")
    .select("target_school")
    .eq("id", user.id)
    .maybeSingle()

  const schoolKey = (profile?.target_school as string | null)?.trim().toUpperCase() || "GENERAL"

  // Get fixed question IDs for this school today
  const questionIds = await getOrCreateQuizSeed(admin, schoolKey, today, user.studentSubjectIds)

  if (questionIds.length < DAILY_QUIZ_COUNT) {
    return { success: false, error: "INTERNAL" } as const
  }

  // Fetch the actual question data
  const { data: pool } = await admin
    .from("questions")
    .select("id, subject_id, options(id, label, text), subject:subjects(name), explanation")
    .in("id", questionIds)

  if (!pool || pool.length < DAILY_QUIZ_COUNT) {
    return { success: false, error: "INTERNAL" } as const
  }

  // Keep seed order
  const orderedPool = questionIds.map((id) => (pool as any[]).find((q) => q.id === id)).filter(Boolean)
  const selected = orderedPool.slice(0, DAILY_QUIZ_COUNT)

  const { data: quiz, error } = await admin
    .from("daily_quizzes")
    .insert({ user_id: user.id, date: today, score: 0 })
    .select("id")
    .single()

  if (error || !quiz) return { success: false, error: "INTERNAL" } as const

  await admin.from("daily_quiz_questions").insert(
    selected.map((q) => ({ daily_quiz_id: quiz.id, question_id: q.id }))
  )

  const { data: full } = await admin
    .from("daily_quizzes")
    .select(`
      id, score, completed_at,
      daily_quiz_questions(
        id, question_id, selected_option_id, is_correct,
        question:questions(
          id, text, explanation,
          options(id, label, text),
          subject:subjects(name)
        )
      )
    `)
    .eq("id", quiz.id)
    .single()

  return { success: true, data: shapeQuiz(full!) } as const
}

function shapeQuiz(raw: any) {
  return {
    id: raw.id,
    score: raw.score,
    completed_at: raw.completed_at,
    questions: (raw.daily_quiz_questions as any[]).map((dqq) => ({
      id: dqq.id,
      questionId: dqq.question_id,
      isCorrect: dqq.is_correct,
      question: {
        id: dqq.question?.id ?? dqq.question_id,
        text: dqq.question?.text ?? "",
        explanation: dqq.question?.explanation ?? null,
        subject: dqq.question?.subject ?? { name: "" },
        options: dqq.question?.options ?? [],
      },
    })),
  }
}

export async function answerDailyQuizItem(
  quizId: string,
  questionId: string,
  selectedOptionId: string
): Promise<ActionResult<{ isCorrect: boolean; correctOptionId: string }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient()

  const { data: quiz } = await admin
    .from("daily_quizzes")
    .select("user_id, completed_at")
    .eq("id", quizId)
    .single()

  if (!quiz) return { success: false, error: "NOT_FOUND" }
  if (quiz.user_id !== user.id) return { success: false, error: "FORBIDDEN" }
  if (quiz.completed_at !== null) return { success: false, error: "VALIDATION_ERROR" }

  const { data: correctOption } = await admin
    .from("options")
    .select("id")
    .eq("question_id", questionId)
    .eq("is_correct", true)
    .single()

  if (!correctOption) return { success: false, error: "INTERNAL" }

  const isCorrect = correctOption.id === selectedOptionId

  await admin
    .from("daily_quiz_questions")
    .update({ selected_option_id: selectedOptionId, is_correct: isCorrect })
    .eq("daily_quiz_id", quizId)
    .eq("question_id", questionId)

  return { success: true, data: { isCorrect, correctOptionId: correctOption.id } }
}

export async function submitDailyQuiz(quizId: string): Promise<ActionResult<{ score: number }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient()

  const { data: quiz } = await admin
    .from("daily_quizzes")
    .select("user_id, completed_at")
    .eq("id", quizId)
    .single()

  if (!quiz) return { success: false, error: "NOT_FOUND" }
  if (quiz.user_id !== user.id) return { success: false, error: "FORBIDDEN" }
  if (quiz.completed_at !== null) return { success: false, error: "VALIDATION_ERROR" }

  const { data: questions } = await admin
    .from("daily_quiz_questions")
    .select("is_correct")
    .eq("daily_quiz_id", quizId)

  const score = (questions ?? []).filter((q) => q.is_correct === true).length

  await admin
    .from("daily_quizzes")
    .update({ score, completed_at: new Date().toISOString() })
    .eq("id", quizId)

  updateStreak(user.id).catch(console.error)

  return { success: true, data: { score } }
}
