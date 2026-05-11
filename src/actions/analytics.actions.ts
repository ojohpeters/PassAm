"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { todayWAT } from "@/lib/utils"
import type { ActionResult, SubjectAccuracy, WeakSubjectInsight, DashboardStats } from "@/types"

const WEAK_THRESHOLD = 50

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const user = await getAppUser()
  if (!user) return null

  const admin = createAdminClient()
  const today = todayWAT()

  const [
    { count: totalAttempts },
    { data: scores },
    { data: streak },
    { data: todayQuiz },
  ] = await Promise.all([
    admin
      .from("exam_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
    admin
      .from("exam_attempts")
      .select("score")
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
    admin.from("streaks").select("current_streak, longest_streak").eq("user_id", user.id).single(),
    admin
      .from("daily_quizzes")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("date", today)
      .single(),
  ])

  const avgScore =
    scores && scores.length > 0
      ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
      : 0

  return {
    totalAttempts: totalAttempts ?? 0,
    averageScore: avgScore,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    dailyQuizReady: !todayQuiz || !todayQuiz.completed_at,
  }
}

export async function getScoreHistory(limit = 20) {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" } as const

  const admin = createAdminClient()
  const take = user.subscriptionStatus === "PRO" ? limit : 5

  const { data: attempts } = await admin
    .from("exam_attempts")
    .select("score, total_questions, created_at, school:schools(name)")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(take)

  return {
    success: true,
    data: (attempts ?? []).map((a) => ({
      date: a.created_at,
      score: a.score,
      percentage: Math.round((a.score / a.total_questions) * 100),
      schoolName: (a.school as any)?.name ?? "",
    })),
  } as const
}

export async function getSubjectAccuracy(): Promise<ActionResult<SubjectAccuracy[]>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }
  if (user.subscriptionStatus === "FREE") return { success: false, error: "PRO_REQUIRED" }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("get_subject_accuracy", { p_user_id: user.id })
  if (error) return { success: false, error: "INTERNAL" }

  const result: SubjectAccuracy[] = (data ?? []).map((r: any) => ({
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    correct: Number(r.correct),
    total: Number(r.total),
    accuracy: Number(r.accuracy),
    isWeak: Number(r.total) > 0 && Number(r.accuracy) < WEAK_THRESHOLD,
  }))

  return { success: true, data: result }
}

export async function calculateWeakSubjects(): Promise<ActionResult<WeakSubjectInsight[]>> {
  const result = await getSubjectAccuracy()
  if (!result.success) return result

  const weak = result.data
    .filter((s) => s.isWeak)
    .map((s) => ({
      ...s,
      insight: `You score ${s.accuracy}% in ${s.subjectName} — prioritise past questions for this subject.`,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)

  return { success: true, data: weak }
}
