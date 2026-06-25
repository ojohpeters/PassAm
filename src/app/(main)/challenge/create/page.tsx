import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NewChallengeClient } from "./NewChallengeClient"

export default async function CreateChallengePage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // Get subjects + schools that have bank questions
  const { data: rows } = await admin
    .from("questions")
    .select("subject_id, school_id, subject:subjects(id, name), school:schools(id, name, abbreviation)")
    .eq("is_bank_question", true)

  const subjectMap = new Map<string, { id: string; name: string; count: number }>()
  const schoolMap = new Map<string, { id: string; name: string; abbreviation: string; count: number }>()

  for (const row of rows ?? []) {
    const s = row.subject as { id: string; name: string } | null
    const sc = row.school as { id: string; name: string; abbreviation: string } | null
    if (s?.id) {
      const existing = subjectMap.get(s.id)
      if (existing) existing.count++
      else subjectMap.set(s.id, { id: s.id, name: s.name, count: 1 })
    }
    if (sc?.id) {
      const existing = schoolMap.get(sc.id)
      if (existing) existing.count++
      else schoolMap.set(sc.id, { id: sc.id, name: sc.name, abbreviation: sc.abbreviation, count: 1 })
    }
  }

  const subjects = Array.from(subjectMap.values())
    .filter((s) => s.count >= 10)
    .sort((a, b) => a.name.localeCompare(b.name))

  const schools = Array.from(schoolMap.values())
    .filter((s) => s.count >= 10)
    .sort((a, b) => a.name.localeCompare(b.name))

  return <NewChallengeClient subjects={subjects} schools={schools} />
}
