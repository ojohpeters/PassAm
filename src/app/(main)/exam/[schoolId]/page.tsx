import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SubjectPicker } from "./SubjectPicker"

export default async function ExamStartPage({
  params,
}: {
  params: { schoolId: string }
}) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: school } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .eq("abbreviation", params.schoolId.toUpperCase())
    .single()

  if (!school) redirect("/dashboard")

  // Subjects + years that actually have questions for this school
  const { data: rows } = await admin
    .from("questions")
    .select("subject_id, year, subject:subjects(id, name)")
    .eq("school_id", school.id)

  const subjectMap = new Map<string, { id: string; name: string }>()
  const subjectCounts: Record<string, number> = {}
  const yearSet = new Set<number>()
  for (const row of rows ?? []) {
    const s = row.subject as any
    if (s?.id) {
      if (!subjectMap.has(s.id)) subjectMap.set(s.id, s)
      subjectCounts[s.id] = (subjectCounts[s.id] ?? 0) + 1
    }
    if (row.year != null) yearSet.add(row.year)
  }
  const availableSubjects = Array.from(subjectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
  const availableYears = Array.from(yearSet).sort((a, b) => b - a)

  // Admin exam config for this school
  const { data: cfg } = await admin
    .from("school_exam_config")
    .select("total_questions, subject_question_counts, duration_mins, required_subject_ids")
    .eq("school_id", school.id)
    .single()

  const requiredSubjectIds: string[] = (cfg?.required_subject_ids as string[]) ?? []
  const durationMins: number = cfg?.duration_mins ?? null as any
  const configuredSubjectCounts: Record<string, number> =
    (cfg?.subject_question_counts as Record<string, number>) ?? {}

  return (
    <SubjectPicker
      school={school}
      schoolSlug={params.schoolId}
      subjects={availableSubjects}
      subjectCounts={subjectCounts}
      availableYears={availableYears}
      requiredSubjectIds={requiredSubjectIds}
      adminDurationMins={durationMins}
      adminSubjectCounts={configuredSubjectCounts}
    />
  )
}
