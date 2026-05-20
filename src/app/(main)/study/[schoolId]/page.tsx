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

  // Subjects derived from actual questions for this school (only show subjects with questions)
  const { data: rows } = await admin
    .from("questions")
    .select("subject_id, subject:subjects(id, name)")
    .eq("school_id", schoolId)

  const subjectMap = new Map<string, { id: string; name: string }>()
  const subjectCounts: Record<string, number> = {}
  for (const row of rows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = row.subject as any
    if (s?.id) {
      if (!subjectMap.has(s.id)) subjectMap.set(s.id, s)
      subjectCounts[s.id] = (subjectCounts[s.id] ?? 0) + 1
    }
  }
  const availableSubjects = Array.from(subjectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  if (!availableSubjects.length) redirect("/study")

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
