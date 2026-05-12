import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GeneralSubjectPicker } from "./GeneralSubjectPicker"

export default async function GeneralExamPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // All subjects that have at least one question across any school
  const { data: rows } = await admin
    .from("questions")
    .select("subject_id, subject:subjects(id, name)")

  const subjectMap = new Map<string, { id: string; name: string }>()
  const subjectCounts: Record<string, number> = {}
  for (const row of rows ?? []) {
    const s = row.subject as any
    if (s?.id) {
      if (!subjectMap.has(s.id)) subjectMap.set(s.id, s)
      subjectCounts[s.id] = (subjectCounts[s.id] ?? 0) + 1
    }
  }
  const availableSubjects = Array.from(subjectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return (
    <GeneralSubjectPicker
      subjects={availableSubjects}
      subjectCounts={subjectCounts}
    />
  )
}
