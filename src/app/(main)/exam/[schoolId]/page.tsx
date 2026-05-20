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

  // Count questions per subject directly (no join — avoids null subject silently zeroing counts)
  const { data: qRows } = await admin
    .from("questions")
    .select("subject_id, year")
    .eq("school_id", school.id)
    .limit(10000)

  const subjectCounts: Record<string, number> = {}
  const yearSet = new Set<number>()
  const usedSubjectIds = new Set<string>()
  for (const row of qRows ?? []) {
    if (row.subject_id) {
      subjectCounts[row.subject_id] = (subjectCounts[row.subject_id] ?? 0) + 1
      usedSubjectIds.add(row.subject_id)
    }
    if (row.year != null) yearSet.add(row.year)
  }

  // Fetch subject names for only the IDs that appear in questions for this school
  const subjectIdList = Array.from(usedSubjectIds)
  const { data: subjectRows } = subjectIdList.length > 0
    ? await admin.from("subjects").select("id, name").in("id", subjectIdList)
    : { data: [] }

  const availableSubjects = (subjectRows ?? [])
    .map((s) => ({ id: s.id, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const availableYears = Array.from(yearSet).sort((a, b) => b - a)

  // Admin exam config — used only to build a recommendation note for students
  const { data: cfg } = await admin
    .from("school_exam_config")
    .select("total_questions, duration_mins, required_subject_ids")
    .eq("school_id", school.id)
    .single()

  let adminNote: string | null = null
  if (cfg) {
    const reqIds: string[] = (cfg?.required_subject_ids as string[]) ?? []
    const parts: string[] = []
    if (reqIds.length > 0) {
      const names = availableSubjects.filter((s) => reqIds.includes(s.id)).map((s) => s.name)
      if (names.length > 0) parts.push(names.join(", "))
    }
    if (cfg.total_questions) parts.push(`${cfg.total_questions} questions`)
    if (cfg.duration_mins) parts.push(`${cfg.duration_mins} min`)
    if (parts.length > 0) adminNote = parts.join(" · ")
  }

  return (
    <SubjectPicker
      school={school}
      schoolSlug={params.schoolId}
      subjects={availableSubjects}
      subjectCounts={subjectCounts}
      availableYears={availableYears}
      adminNote={adminNote}
    />
  )
}
