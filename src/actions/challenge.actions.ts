"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import type { ActionResult, QuestionWithOptions } from "@/types"

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export type ChallengeParticipant = {
  id: string
  display_name: string
  is_creator: boolean
  score: number | null
  time_taken_secs: number | null
  completed_at: string | null
  started_at: string | null
}

export type ChallengeData = {
  id: string
  code: string
  creator_id: string
  subject_name: string
  school_name: string | null
  school_source: "specific" | "random" | "all"
  num_questions: number
  time_limit_secs: number
  status: "waiting" | "active" | "completed"
  expires_at: string
  participants: ChallengeParticipant[]
}

export async function createChallenge(
  subjectId: string,
  numQuestions: number,
  timeLimitSecs: number,
  schoolSource: "specific" | "random" | "all" = "all",
  schoolId?: string
): Promise<ActionResult<{ code: string; participantId: string }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: subject } = await admin
    .from("subjects")
    .select("name")
    .eq("id", subjectId)
    .single()

  if (!subject) return { success: false, error: "INVALID_SUBJECT" }

  // Resolve which school's questions to use
  let resolvedSchoolId: string | null = null
  let resolvedSchoolName: string | null = null

  if (schoolSource === "specific" && schoolId) {
    const { data: school } = await admin
      .from("schools")
      .select("id, name")
      .eq("id", schoolId)
      .maybeSingle()
    if (!school) return { success: false, error: "INVALID_SUBJECT" }
    resolvedSchoolId = school.id
    resolvedSchoolName = school.name
  } else if (schoolSource === "random") {
    // Pick a random school that has questions for this subject
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: schoolRows } = await (admin as any)
      .from("questions")
      .select("school_id, school:schools(id, name)")
      .eq("subject_id", subjectId)
      .eq("is_bank_question", true)
      .not("school_id", "is", null)
      .limit(500)

    const schoolMap = new Map<string, string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (schoolRows ?? []) as any[]) {
      if (row.school_id && row.school?.name) schoolMap.set(row.school_id, row.school.name)
    }
    const schoolIds = Array.from(schoolMap.keys())
    if (!schoolIds.length) return { success: false, error: "INSUFFICIENT_QUESTIONS" }
    resolvedSchoolId = schoolIds[Math.floor(Math.random() * schoolIds.length)]
    resolvedSchoolName = schoolMap.get(resolvedSchoolId) ?? null
  }

  // Pick random questions for this subject (filtered by school if specified)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from("questions")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("is_bank_question", true)
    .limit(500)
  if (resolvedSchoolId) query = query.eq("school_id", resolvedSchoolId)

  const { data: pool } = await query
  if (!pool?.length) return { success: false, error: "INSUFFICIENT_QUESTIONS" }

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, Math.min(numQuestions, pool.length))
  const questionIds = picked.map((q: { id: string }) => q.id)

  // Generate a unique code
  let code = generateCode()
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data: existing } = await admin.from("challenges").select("id").eq("code", code).maybeSingle()
    if (!existing) break
    code = generateCode()
  }

  // Get creator display name
  const { data: profile } = await admin.from("profiles").select("name").eq("id", user.id).maybeSingle()
  const displayName = (profile as { name?: string } | null)?.name || user.email?.split("@")[0] || "Challenger"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: challenge, error: challengeErr } = await (admin as any)
    .from("challenges")
    .insert({
      code,
      creator_id: user.id,
      subject_id: subjectId,
      subject_name: subject.name,
      num_questions: questionIds.length,
      time_limit_secs: timeLimitSecs,
      question_ids: questionIds,
      school_name: resolvedSchoolName,
      school_source: schoolSource,
    })
    .select("id, code")
    .single()

  if (challengeErr || !challenge) return { success: false, error: "INTERNAL" }

  const { data: participant } = await admin
    .from("challenge_participants")
    .insert({
      challenge_id: challenge.id,
      user_id: user.id,
      display_name: displayName,
      is_creator: true,
    })
    .select("id")
    .single()

  return { success: true, data: { code: challenge.code, participantId: participant?.id ?? "" } }
}

export async function getChallenge(code: string): Promise<ActionResult<ChallengeData>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: challenge } = await (admin as any)
    .from("challenges")
    .select("id, code, creator_id, subject_name, school_name, school_source, num_questions, time_limit_secs, status, expires_at")
    .eq("code", code.toUpperCase())
    .maybeSingle()

  if (!challenge) return { success: false, error: "NOT_FOUND" }

  const { data: participants } = await admin
    .from("challenge_participants")
    .select("id, display_name, is_creator, score, time_taken_secs, completed_at, started_at")
    .eq("challenge_id", challenge.id)
    .order("is_creator", { ascending: false })

  return {
    success: true,
    data: { ...challenge, participants: (participants ?? []) as ChallengeParticipant[] },
  }
}

export async function joinChallenge(
  code: string,
  guestName?: string
): Promise<ActionResult<{ participantId: string; isNew: boolean }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const user = await getAppUser()

  const { data: challenge } = await admin
    .from("challenges")
    .select("id, expires_at")
    .eq("code", code.toUpperCase())
    .maybeSingle()

  if (!challenge) return { success: false, error: "NOT_FOUND" }
  if (new Date(challenge.expires_at) < new Date()) return { success: false, error: "EXPIRED" }

  const { data: existing } = await admin
    .from("challenge_participants")
    .select("id, user_id, is_creator")
    .eq("challenge_id", challenge.id)

  // Logged-in user already in the challenge?
  if (user) {
    const mySlot = (existing ?? []).find((p: { user_id: string | null }) => p.user_id === user.id)
    if (mySlot) return { success: true, data: { participantId: mySlot.id, isNew: false } }
  }

  // Only 1 challenger slot (1 creator + 1 challenger)
  const challengers = (existing ?? []).filter((p: { is_creator: boolean }) => !p.is_creator)
  if (challengers.length >= 1) return { success: false, error: "CHALLENGE_FULL" }

  let displayName = guestName?.trim() || "Guest"
  if (user) {
    const { data: profile } = await admin.from("profiles").select("name").eq("id", user.id).maybeSingle()
    displayName = (profile as { name?: string } | null)?.name || user.email?.split("@")[0] || "Challenger"
  }

  const { data: participant, error } = await admin
    .from("challenge_participants")
    .insert({
      challenge_id: challenge.id,
      user_id: user?.id ?? null,
      guest_name: user ? null : (guestName?.trim() || "Guest"),
      display_name: displayName,
      is_creator: false,
    })
    .select("id")
    .single()

  if (error || !participant) return { success: false, error: "INTERNAL" }

  return { success: true, data: { participantId: participant.id, isNew: true } }
}

export async function getChallengePlay(
  code: string,
  participantId: string
): Promise<ActionResult<{ questions: QuestionWithOptions[]; timeLimitSecs: number; subjectName: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: challenge } = await admin
    .from("challenges")
    .select("id, question_ids, time_limit_secs, subject_name, expires_at")
    .eq("code", code.toUpperCase())
    .maybeSingle()

  if (!challenge) return { success: false, error: "NOT_FOUND" }
  if (new Date(challenge.expires_at) < new Date()) return { success: false, error: "EXPIRED" }

  const { data: participant } = await admin
    .from("challenge_participants")
    .select("id, completed_at")
    .eq("id", participantId)
    .eq("challenge_id", challenge.id)
    .maybeSingle()

  if (!participant) return { success: false, error: "UNAUTHORIZED" }
  if (participant.completed_at) return { success: false, error: "ALREADY_SUBMITTED" }

  // Mark started
  await admin
    .from("challenge_participants")
    .update({ started_at: new Date().toISOString() })
    .eq("id", participantId)
    .is("started_at", null)

  const questionIds = challenge.question_ids as string[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questionsRaw } = await (admin as any)
    .from("questions")
    .select("id, text, image_url, explanation, year, school_id, subject_id, options(id, label, text), subject:subjects(name)")
    .in("id", questionIds)

  if (!questionsRaw?.length) return { success: false, error: "INTERNAL" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qMap = new Map((questionsRaw as any[]).map((q: any) => [q.id, q]))
  const questions: QuestionWithOptions[] = questionIds
    .filter((id) => qMap.has(id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((id) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = qMap.get(id) as any
      return {
        id: q.id,
        text: q.text,
        image_url: q.image_url ?? null,
        explanation: q.explanation ?? null,
        year: q.year ?? null,
        school_id: q.school_id,
        subject_id: q.subject_id,
        subject: { name: q.subject?.name ?? challenge.subject_name },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (q.options as any[]).sort((a: any, b: any) => a.label.localeCompare(b.label)),
        passage: null,
      }
    })

  return {
    success: true,
    data: { questions, timeLimitSecs: challenge.time_limit_secs, subjectName: challenge.subject_name },
  }
}

export async function submitChallengeAttempt(
  code: string,
  participantId: string,
  answers: Record<string, string | null>,
  timeTakenSecs: number
): Promise<ActionResult<{ code: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: challenge } = await admin
    .from("challenges")
    .select("id, question_ids")
    .eq("code", code.toUpperCase())
    .maybeSingle()

  if (!challenge) return { success: false, error: "NOT_FOUND" }

  const { data: participant } = await admin
    .from("challenge_participants")
    .select("id, completed_at")
    .eq("id", participantId)
    .eq("challenge_id", challenge.id)
    .maybeSingle()

  if (!participant) return { success: false, error: "UNAUTHORIZED" }
  if (participant.completed_at) return { success: true, data: { code } } // idempotent

  const questionIds = challenge.question_ids as string[]

  const { data: correctOptions } = await admin
    .from("options")
    .select("id, question_id")
    .in("question_id", questionIds)
    .eq("is_correct", true)

  const correctMap = new Map((correctOptions ?? []).map((o: { question_id: string; id: string }) => [o.question_id, o.id]))

  let score = 0
  for (const questionId of questionIds) {
    const selected = answers[questionId]
    if (selected && selected === correctMap.get(questionId)) score++
  }

  await admin
    .from("challenge_participants")
    .update({ score, time_taken_secs: timeTakenSecs, answers, completed_at: new Date().toISOString() })
    .eq("id", participantId)

  const { data: participants } = await admin
    .from("challenge_participants")
    .select("completed_at")
    .eq("challenge_id", challenge.id)

  const allDone = (participants ?? []).every((p: { completed_at: string | null }) => p.completed_at !== null)
  await admin
    .from("challenges")
    .update({ status: allDone ? "completed" : "active" })
    .eq("id", challenge.id)

  return { success: true, data: { code } }
}

export type ChallengeResultQuestion = {
  id: string
  text: string
  correct_option_id: string
  correct_label: string
  options: { id: string; label: string; text: string }[]
}

export type ChallengeResultData = {
  challenge: { subject_name: string; num_questions: number; time_limit_secs: number; status: string }
  participants: ChallengeParticipant[]
  questions: ChallengeResultQuestion[]
}

export async function getChallengeResults(code: string): Promise<ActionResult<ChallengeResultData>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: challenge } = await admin
    .from("challenges")
    .select("id, subject_name, num_questions, time_limit_secs, status, question_ids")
    .eq("code", code.toUpperCase())
    .maybeSingle()

  if (!challenge) return { success: false, error: "NOT_FOUND" }

  const { data: participants } = await admin
    .from("challenge_participants")
    .select("id, display_name, is_creator, score, time_taken_secs, completed_at, started_at")
    .eq("challenge_id", challenge.id)
    .order("is_creator", { ascending: false })

  // Fetch questions with correct answers for breakdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questionsRaw } = await (admin as any)
    .from("questions")
    .select("id, text, options(id, label, text, is_correct)")
    .in("id", challenge.question_ids as string[])

  const questionIds = challenge.question_ids as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qMap = new Map((questionsRaw ?? []).map((q: any) => [q.id, q]))

  const questions: ChallengeResultQuestion[] = questionIds
    .filter((id) => qMap.has(id))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((id) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = qMap.get(id) as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const correctOpt = (q.options as any[]).find((o: any) => o.is_correct)
      return {
        id: q.id,
        text: q.text,
        correct_option_id: correctOpt?.id ?? "",
        correct_label: correctOpt?.label ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (q.options as any[]).sort((a: any, b: any) => a.label.localeCompare(b.label)),
      }
    })

  return {
    success: true,
    data: {
      challenge: {
        subject_name: challenge.subject_name,
        num_questions: challenge.num_questions,
        time_limit_secs: challenge.time_limit_secs,
        status: challenge.status,
      },
      participants: (participants ?? []) as ChallengeParticipant[],
      questions,
    },
  }
}
