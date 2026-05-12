"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { todayWAT } from "@/lib/utils"
import { updateStreak } from "./notification.actions"
import type { ActionResult } from "@/types"

const DAILY_QUIZ_COUNT = 10

export async function getDailyQuiz() {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" } as const

  const admin = createAdminClient()
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

  let poolQuery = admin
    .from("questions")
    .select(`id, subject_id, options(id, label, text), subject:subjects(name)`)
    .limit(200)

  if (user.studentSubjectIds.length > 0) {
    poolQuery = poolQuery.in("subject_id", user.studentSubjectIds)
  }

  const { data: pool } = await poolQuery

  if (!pool || pool.length < DAILY_QUIZ_COUNT) {
    return { success: false, error: "INTERNAL" } as const
  }

  const selected = pool.sort(() => Math.random() - 0.5).slice(0, DAILY_QUIZ_COUNT)

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
