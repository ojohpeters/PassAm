"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { todayWAT, getDrillTimeLimitMs, seededShuffle } from "@/lib/utils"
import type { ActionResult } from "@/types"

const DRILL_COUNT = 30

export type DrillQuestion = {
  id: string
  text: string
  options: { id: string; label: string; text: string }[]
  subject: { name: string }
  timeLimitMs: number
  passage: { id: string; text: string; title: string | null } | null
}

export type DrillSessionData = {
  sessionId: string
  schoolKey: string
  questions: DrillQuestion[]
  answeredIds: string[]
  score: number
  totalAnswered: number
  timeUsedMs: number
  completedAt: string | null
}

// ── seed helpers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

async function getOrCreateSeed(
  admin: AdminClient,
  schoolKey: string,
  date: string,
  type: "drill" | "quiz",
  count: number,
  subjectIds: string[]
): Promise<string[]> {
  const { data: existing } = await admin
    .from("daily_question_seeds")
    .select("question_ids")
    .eq("school_key", schoolKey)
    .eq("seed_date", date)
    .eq("seed_type", type)
    .maybeSingle()

  if (existing) return (existing as { question_ids: string[] }).question_ids

  // Build question pool for this school
  let pool: { id: string }[] = []

  if (schoolKey !== "GENERAL") {
    const { data: school } = await admin
      .from("schools")
      .select("id")
      .eq("abbreviation", schoolKey)
      .maybeSingle()

    if (school) {
      const { data } = await admin
        .from("questions")
        .select("id")
        .eq("school_id", (school as { id: string }).id)
        .eq("is_bank_question", true)
        .limit(1000)
      pool = data ?? []
    }
  }

  // Fallback to subject-filtered pool if school lookup returned nothing
  if (pool.length === 0) {
    let q = admin.from("questions").select("id").eq("is_bank_question", true).limit(1000)
    if (subjectIds.length > 0) q = q.in("subject_id", subjectIds)
    const { data } = await q
    pool = data ?? []
  }

  if (pool.length === 0) return []

  // Exclude questions used in the last 7 days to avoid repeats
  const { data: recentSeeds } = await admin
    .from("daily_question_seeds")
    .select("question_ids")
    .eq("school_key", schoolKey)
    .eq("seed_type", type)
    .neq("seed_date", date)
    .order("seed_date", { ascending: false })
    .limit(7) as { data: { question_ids: string[] }[] | null }

  const recentIds = new Set((recentSeeds ?? []).flatMap((s) => s.question_ids))
  const freshPool = pool.filter((q) => !recentIds.has(q.id))
  const sourcePool = freshPool.length >= count ? freshPool : pool

  const shuffled = seededShuffle(sourcePool, schoolKey, date)
  const selected = shuffled.slice(0, count).map((q) => q.id)

  await admin.from("daily_question_seeds").upsert(
    { school_key: schoolKey, seed_date: date, seed_type: type, question_ids: selected },
    { onConflict: "school_key,seed_date,seed_type" }
  )

  return selected
}

// ── exported actions ──────────────────────────────────────────────────────────

export async function getDailyDrill(subjectIds?: string[]): Promise<ActionResult<DrillSessionData>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient()
  const today = todayWAT()

  const { data: profile } = await (admin as AdminClient)
    .from("profiles")
    .select("target_school")
    .eq("id", user.id)
    .maybeSingle()

  const schoolKey = ((profile as { target_school: string | null } | null)?.target_school ?? "").trim().toUpperCase() || "GENERAL"

  // get/create session — for custom subject drills, append the subject set to the key
  const sessionDate = today
  const sessionSchoolKey = subjectIds?.length
    ? `CUSTOM_${[...subjectIds].sort().join("_").slice(0, 60)}`
    : schoolKey

  const { data: existing } = await (admin as AdminClient)
    .from("drill_sessions")
    .select("id, score, total_answered, time_used_ms, completed_at")
    .eq("user_id", user.id)
    .eq("session_date", sessionDate)
    .eq("school_key", sessionSchoolKey)
    .maybeSingle() as { data: { id: string; score: number; total_answered: number; time_used_ms: number; completed_at: string | null } | null }

  let sessionId: string
  let score = 0
  let totalAnswered = 0
  let timeUsedMs = 0
  let completedAt: string | null = null

  if (existing) {
    sessionId = existing.id
    score = existing.score
    totalAnswered = existing.total_answered
    timeUsedMs = existing.time_used_ms
    completedAt = existing.completed_at
  } else {
    const { data: ns, error } = await (admin as AdminClient)
      .from("drill_sessions")
      .insert({ user_id: user.id, school_key: sessionSchoolKey, session_date: sessionDate })
      .select("id")
      .single() as { data: { id: string } | null; error: unknown }
    if (error || !ns) return { success: false, error: "INTERNAL" }
    sessionId = (ns as { id: string }).id
  }

  let questionIds: string[]
  if (subjectIds && subjectIds.length > 0) {
    // Custom subject drill — query randomly from selected subjects, no daily seed
    const { data: qs } = await (admin as AdminClient)
      .from("questions")
      .select("id")
      .in("subject_id", subjectIds)
      .eq("is_bank_question", true)
      .limit(500)
    const pool = (qs ?? []) as { id: string }[]
    if (pool.length === 0) return { success: false, error: "NO_QUESTIONS" }
    questionIds = [...pool].sort(() => Math.random() - 0.5).slice(0, DRILL_COUNT).map((q) => q.id)
  } else {
    questionIds = await getOrCreateSeed(admin, schoolKey, today, "drill", DRILL_COUNT, user.studentSubjectIds)
    if (questionIds.length === 0) return { success: false, error: "NO_QUESTIONS" }
  }

  // fetch questions — options WITHOUT is_correct (hidden for leaderboard fairness)
  // Try with passage join; fall back if the passages table/column doesn't exist yet
  let { data: rawQs, error: rawErr } = await (admin as AdminClient)
    .from("questions")
    .select("id, text, subject:subjects(name), options(id, label, text), passage:passages(id, text, title)")
    .in("id", questionIds)

  if (rawErr || !rawQs) {
    const { data: fallback } = await (admin as AdminClient)
      .from("questions")
      .select("id, text, subject:subjects(name), options(id, label, text)")
      .in("id", questionIds)
    rawQs = (fallback ?? []).map((q: any) => ({ ...q, passage: null }))
  }

  const { data: answers } = await (admin as AdminClient)
    .from("drill_answers")
    .select("question_id")
    .eq("session_id", sessionId) as { data: { question_id: string }[] | null }

  const answeredIds = (answers ?? []).map((a) => a.question_id)

  const qMap = new Map(((rawQs as { id: string }[]) ?? []).map((q: any) => [q.id, q]))
  const questions: DrillQuestion[] = questionIds
    .map((id) => qMap.get(id))
    .filter(Boolean)
    .map((q: any) => ({
      id: q.id,
      text: q.text,
      options: (q.options ?? []).sort((a: any, b: any) => a.label.localeCompare(b.label)),
      subject: q.subject ?? { name: "" },
      timeLimitMs: getDrillTimeLimitMs(q.subject?.name ?? ""),
      passage: q.passage ?? null,
    }))

  return {
    success: true,
    data: { sessionId, schoolKey, questions, answeredIds, score, totalAnswered, timeUsedMs, completedAt },
  }
}

export async function submitDrillAnswer(
  sessionId: string,
  questionId: string,
  selectedOptionId: string | null,
  timeTakenMs: number
): Promise<ActionResult<{ isCorrect: boolean; correctOptionId: string }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient() as AdminClient

  const { data: session } = await admin
    .from("drill_sessions")
    .select("user_id, completed_at, score, total_answered, time_used_ms")
    .eq("id", sessionId)
    .single() as { data: { user_id: string; completed_at: string | null; score: number; total_answered: number; time_used_ms: number } | null }

  if (!session) return { success: false, error: "NOT_FOUND" }
  if (session.user_id !== user.id) return { success: false, error: "FORBIDDEN" }
  if (session.completed_at) return { success: false, error: "VALIDATION_ERROR" }

  const { data: correctOpt } = await (createAdminClient() as AdminClient)
    .from("options")
    .select("id")
    .eq("question_id", questionId)
    .eq("is_correct", true)
    .single() as { data: { id: string } | null }

  if (!correctOpt) return { success: false, error: "INTERNAL" }

  const isCorrect = selectedOptionId !== null && correctOpt.id === selectedOptionId

  await admin.from("drill_answers").upsert(
    {
      session_id: sessionId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
    },
    { onConflict: "session_id,question_id" }
  )

  await admin.from("drill_sessions").update({
    score: session.score + (isCorrect ? 1 : 0),
    total_answered: session.total_answered + 1,
    time_used_ms: session.time_used_ms + timeTakenMs,
  }).eq("id", sessionId)

  return { success: true, data: { isCorrect, correctOptionId: correctOpt.id } }
}

export async function completeDrillSession(sessionId: string): Promise<ActionResult<void>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient() as AdminClient

  const { data: session } = await admin
    .from("drill_sessions")
    .select("user_id")
    .eq("id", sessionId)
    .single() as { data: { user_id: string } | null }

  if (!session) return { success: false, error: "NOT_FOUND" }
  if (session.user_id !== user.id) return { success: false, error: "FORBIDDEN" }

  await admin.from("drill_sessions").update({ completed_at: new Date().toISOString() }).eq("id", sessionId)

  return { success: true, data: undefined }
}

export type DrillLeaderboardEntry = {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  schoolKey: string
  score: number
  totalAnswered: number
  timeUsedMs: number
  isCurrentUser: boolean
}

export async function getDrillLeaderboard(
  schoolKey?: string
): Promise<ActionResult<DrillLeaderboardEntry[]>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient() as AdminClient
  const today = todayWAT()

  let q = admin
    .from("drill_sessions")
    .select("user_id, school_key, score, total_answered, time_used_ms, profiles(name, avatar_url)")
    .eq("session_date", today)
    .not("completed_at", "is", null)
    .order("score", { ascending: false })
    .order("time_used_ms", { ascending: true })
    .limit(50)

  if (schoolKey) q = q.eq("school_key", schoolKey)

  const { data, error } = await q
  if (error) return { success: false, error: "INTERNAL" }

  return {
    success: true,
    data: ((data ?? []) as any[]).map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: r.profiles?.name ?? "Unknown",
      avatarUrl: r.profiles?.avatar_url ?? null,
      schoolKey: r.school_key,
      score: r.score,
      totalAnswered: r.total_answered,
      timeUsedMs: r.time_used_ms,
      isCurrentUser: r.user_id === user.id,
    })),
  }
}
