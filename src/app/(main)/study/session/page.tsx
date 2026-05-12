import { getStudyQuestions } from "@/actions/exam.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudyShell } from "@/components/study/StudyShell"

export default async function StudySessionPage({
  searchParams,
}: {
  searchParams: { school?: string; config?: string; duration?: string }
}) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const { school: schoolId, config, duration } = searchParams

  if (!schoolId || !config) redirect("/study")

  let configs: { subjectId: string; count: number }[]
  try {
    const decoded = atob(decodeURIComponent(config))
    const parsed: { id: string; count: number }[] = JSON.parse(decoded)
    configs = parsed.map((p) => ({ subjectId: p.id, count: p.count }))
  } catch {
    redirect("/study")
  }

  const result = await getStudyQuestions(configs, schoolId)

  if (!result.success || !result.data.length) redirect("/study")

  const durationMins = duration ? parseInt(duration, 10) : 0

  return (
    <StudyShell
      questions={result.data}
      durationMins={durationMins > 0 ? durationMins : null}
    />
  )
}
