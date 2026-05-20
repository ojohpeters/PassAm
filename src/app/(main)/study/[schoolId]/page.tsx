import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudyPicker } from "./StudyPicker"

export default async function StudyPickerPage({
  params,
}: {
  params: { schoolId: string }
}) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const isGeneral = params.schoolId.toLowerCase() === "general"

  let schoolId: string
  let schoolName: string
  let schoolAbbr: string

  if (isGeneral) {
    const { data: gs } = await admin
      .from("schools")
      .select("id, name, abbreviation")
      .eq("abbreviation", "GENERAL")
      .single()
    if (!gs) redirect("/study")
    schoolId = gs.id
    schoolName = gs.name
    schoolAbbr = gs.abbreviation
  } else {
    const { data: school } = await admin
      .from("schools")
      .select("id, name, abbreviation")
      .eq("abbreviation", params.schoolId.toUpperCase())
      .single()
    if (!school) redirect("/study")
    schoolId = school.id
    schoolName = school.name
    schoolAbbr = school.abbreviation
  }

  // All subjects — students can pick any, even those with 0 questions for this school
  const { data: allSubjects } = await admin
    .from("subjects")
    .select("id, name")
    .order("name")

  const { data: qRows } = await admin
    .from("questions")
    .select("subject_id")
    .eq("school_id", schoolId)

  const subjectCounts: Record<string, number> = {}
  for (const row of qRows ?? []) {
    if (row.subject_id) subjectCounts[row.subject_id] = (subjectCounts[row.subject_id] ?? 0) + 1
  }

  const availableSubjects = (allSubjects ?? []) as { id: string; name: string }[]

  return (
    <StudyPicker
      schoolId={schoolId}
      schoolName={schoolName}
      schoolAbbr={schoolAbbr}
      subjects={availableSubjects}
      subjectCounts={subjectCounts}
    />
  )
}
