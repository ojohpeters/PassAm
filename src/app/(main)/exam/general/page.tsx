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

  // Pre-fetch user question counts for the include toggles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: personalRows } = await (admin as any)
    .from("user_questions").select("subject_label").eq("user_id", user.id).not("subject_label", "is", null)
  const personalCountsBySubject: Record<string, number> = {}
  for (const row of personalRows ?? []) {
    const k = (row.subject_label as string).toLowerCase()
    personalCountsBySubject[k] = (personalCountsBySubject[k] ?? 0) + 1
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: communityRows } = await (admin as any)
    .from("user_questions").select("subject_label").eq("is_public", true).eq("moderation_status", "approved").not("subject_label", "is", null)
  const communityCountsBySubject: Record<string, number> = {}
  for (const row of communityRows ?? []) {
    const k = (row.subject_label as string).toLowerCase()
    communityCountsBySubject[k] = (communityCountsBySubject[k] ?? 0) + 1
  }

  return (
    <GeneralSubjectPicker
      subjects={availableSubjects}
      subjectCounts={subjectCounts}
      personalCountsBySubject={personalCountsBySubject}
      communityCountsBySubject={communityCountsBySubject}
    />
  )
}
