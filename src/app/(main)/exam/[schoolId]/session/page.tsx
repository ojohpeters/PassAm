import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ExamShell } from "@/components/exam/ExamShell"
import type { QuestionWithOptions } from "@/types"

export default async function ExamSessionPage({
  params,
  searchParams,
}: {
  params: { schoolId: string }
  searchParams: { attempt?: string }
}) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const attemptId = searchParams.attempt
  if (!attemptId) redirect(`/exam/${params.schoolId}`)

  const admin = createAdminClient()

  const { data: attempt } = await admin
    .from("exam_attempts")
    .select(`
      id,
      attempt_answers(
        question_id,
        question:questions(
          id, text, image_url, explanation, year, school_id, subject_id,
          options(id, label, text),
          subject:subjects(name)
        )
      )
    `)
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .is("completed_at", null)
    .single()

  if (!attempt) redirect(`/exam/${params.schoolId}`)

  const questions = (attempt.attempt_answers as unknown as any[])
    .map((a) => a.question)
    .filter(Boolean) as unknown as QuestionWithOptions[]

  return (
    <ExamShell attemptId={attempt.id} questions={questions} timeLimitSecs={3600} />
  )
}
