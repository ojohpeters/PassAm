import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ExamShell } from "@/components/exam/ExamShell"
import type { QuestionWithOptions } from "@/types"
import { USER_OPTION_IDS, PERSONAL_SUBJECT_ID } from "@/lib/user-exam-options"

export default async function ExamSessionPage({
  params,
  searchParams,
}: {
  params: { schoolId: string }
  searchParams: { attempt?: string; time?: string }
}) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const attemptId = searchParams.attempt
  if (!attemptId) redirect(`/exam/${params.schoolId}`)

  const timeLimitSecs = searchParams.time ? parseInt(searchParams.time, 10) : 3600

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

  const bankQuestions = (attempt.attempt_answers as unknown as any[])
    .map((a) => a.question)
    .filter(Boolean) as unknown as QuestionWithOptions[]

  // Load personal/community questions for this attempt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userAttemptAnswers } = await (admin as any)
    .from("attempt_user_answers")
    .select("user_question_id, subject_name")
    .eq("attempt_id", attempt.id)

  const userQuestions: QuestionWithOptions[] = []
  if (userAttemptAnswers?.length) {
    const uqIds = (userAttemptAnswers as { user_question_id: string; subject_name: string | null }[]).map((a) => a.user_question_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: uqData } = await (admin as any)
      .from("user_questions")
      .select("id, q_text, opt_a, opt_b, opt_c, opt_d, explanation, subject_label")
      .in("id", uqIds)

    const subjectNames = [...new Set((userAttemptAnswers as { subject_name: string | null }[]).map((a) => a.subject_name).filter(Boolean) as string[])]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subjectData } = subjectNames.length
      ? await (admin as any).from("subjects").select("id, name").in("name", subjectNames)
      : { data: [] }
    const subjectIdByName = new Map<string, string>((subjectData ?? []).map((s: { id: string; name: string }) => [s.name, s.id]))

    for (const a of (userAttemptAnswers as { user_question_id: string; subject_name: string | null }[])) {
      const uq = (uqData ?? []).find((q: any) => q.id === a.user_question_id)
      if (!uq) continue
      const subjectId = subjectIdByName.get(a.subject_name ?? "") ?? PERSONAL_SUBJECT_ID
      userQuestions.push({
        id: uq.id,
        text: uq.q_text,
        image_url: null,
        explanation: uq.explanation,
        year: null,
        school_id: PERSONAL_SUBJECT_ID,
        subject_id: subjectId,
        options: [
          { id: USER_OPTION_IDS.A, label: "A" as const, text: uq.opt_a },
          { id: USER_OPTION_IDS.B, label: "B" as const, text: uq.opt_b },
          { id: USER_OPTION_IDS.C, label: "C" as const, text: uq.opt_c },
          { id: USER_OPTION_IDS.D, label: "D" as const, text: uq.opt_d },
        ],
        subject: { name: a.subject_name ?? uq.subject_label ?? "My Questions" },
        passage: null,
      })
    }
  }

  const questions = [...bankQuestions, ...userQuestions]

  return (
    <ExamShell attemptId={attempt.id} questions={questions} timeLimitSecs={timeLimitSecs} />
  )
}
