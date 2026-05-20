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

  // Get all subjects, then count questions per subject using HEAD requests (same
  // technique the admin page uses for per-school counts — bypasses PostgREST max_rows)
  const { data: allSubjects } = await admin.from("subjects").select("id, name").order("name")

  const subjectCounts: Record<string, number> = {}
  await Promise.all(
    (allSubjects ?? []).map(async (s) => {
      const { count } = await admin
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("school_id", school.id)
        .eq("subject_id", s.id)
      if (count && count > 0) subjectCounts[s.id] = count
    })
  )

  const availableSubjects = (allSubjects ?? [])
    .filter((s) => (subjectCounts[s.id] ?? 0) > 0)
    .map((s) => ({ id: s.id, name: s.name }))

  // Years — separate lightweight query for year filter dropdown
  const { data: yearRows } = await admin
    .from("questions")
    .select("year")
    .eq("school_id", school.id)
    .not("year", "is", null)
    .limit(10000)

  const yearSet = new Set<number>()
  for (const row of yearRows ?? []) {
    if (row.year != null) yearSet.add(row.year)
  }
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
