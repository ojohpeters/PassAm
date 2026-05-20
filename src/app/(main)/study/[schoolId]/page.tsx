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

  // Get all subjects, then count questions per subject using HEAD requests
  const { data: allSubjects } = await admin.from("subjects").select("id, name").order("name")

  const subjectCounts: Record<string, number> = {}
  await Promise.all(
    (allSubjects ?? []).map(async (s) => {
      const { count } = await admin
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("subject_id", s.id)
      if (count && count > 0) subjectCounts[s.id] = count
    })
  )

  const availableSubjects = (allSubjects ?? [])
    .filter((s) => (subjectCounts[s.id] ?? 0) > 0)
    .map((s) => ({ id: s.id, name: s.name }))

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
