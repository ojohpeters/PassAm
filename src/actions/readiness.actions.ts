"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getAppUser } from "@/lib/auth"

export type SubjectReadiness = {
  subjectId: string
  subjectName: string
  accuracy: number      // 0-100
  correct: number
  total: number
  isOnTrack: boolean
  status: "strong" | "close" | "weak" | "untested"
}

export type ReadinessData = {
  schoolId: string
  schoolName: string
  schoolAbbreviation: string
  overallScore: number
  threshold: number
  isOnTrack: boolean
  subjects: SubjectReadiness[]
  totalAnswered: number
  hasData: boolean
}

const PASS_THRESHOLD = 70

function statusFor(accuracy: number, total: number): SubjectReadiness["status"] {
  if (total < 5) return "untested"
  if (accuracy >= PASS_THRESHOLD) return "strong"
  if (accuracy >= PASS_THRESHOLD - 10) return "close"
  return "weak"
}

export async function getReadinessData(): Promise<ReadinessData | null> {
  const user = await getAppUser()
  if (!user) return null

  const admin = createAdminClient()
  const supabase = await createClient()

  // Get user's school
  const { data: profile } = await admin
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single()

  const schoolId = (profile as any)?.school_id
  if (!schoolId) return null

  const { data: school } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .eq("id", schoolId)
    .single()

  if (!school) return null

  // Get all completed exam attempts for this school
  const { data: attempts } = await admin
    .from("exam_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .not("completed_at", "is", null)

  if (!attempts?.length) {
    return {
      schoolId,
      schoolName: school.name,
      schoolAbbreviation: school.abbreviation,
      overallScore: 0,
      threshold: PASS_THRESHOLD,
      isOnTrack: false,
      subjects: [],
      totalAnswered: 0,
      hasData: false,
    }
  }

  const attemptIds = attempts.map((a) => a.id)

  // Get all answers for those attempts
  const { data: answers } = await admin
    .from("attempt_answers")
    .select("subject_id, is_correct, subject:subjects(name)")
    .in("attempt_id", attemptIds)

  if (!answers?.length) {
    return {
      schoolId,
      schoolName: school.name,
      schoolAbbreviation: school.abbreviation,
      overallScore: 0,
      threshold: PASS_THRESHOLD,
      isOnTrack: false,
      subjects: [],
      totalAnswered: 0,
      hasData: false,
    }
  }

  // Aggregate by subject
  const subjectMap = new Map<string, { name: string; correct: number; total: number }>()
  for (const a of answers) {
    if (!a.subject_id) continue
    const name = (a as any).subject?.name ?? "Unknown"
    const entry = subjectMap.get(a.subject_id) ?? { name, correct: 0, total: 0 }
    entry.total++
    if (a.is_correct) entry.correct++
    subjectMap.set(a.subject_id, entry)
  }

  const subjects: SubjectReadiness[] = [...subjectMap.entries()]
    .map(([subjectId, s]) => {
      const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
      return {
        subjectId,
        subjectName: s.name,
        accuracy,
        correct: s.correct,
        total: s.total,
        isOnTrack: accuracy >= PASS_THRESHOLD,
        status: statusFor(accuracy, s.total),
      }
    })
    .sort((a, b) => a.accuracy - b.accuracy) // weakest first

  // Overall score = weighted average (weighted by question count)
  const totalAnswered = answers.length
  const totalCorrect  = answers.filter((a) => a.is_correct).length
  const overallScore  = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  return {
    schoolId,
    schoolName: school.name,
    schoolAbbreviation: school.abbreviation,
    overallScore,
    threshold: PASS_THRESHOLD,
    isOnTrack: overallScore >= PASS_THRESHOLD,
    subjects,
    totalAnswered,
    hasData: true,
  }
}
