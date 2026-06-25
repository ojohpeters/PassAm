import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NewChallengeClient } from "./NewChallengeClient"

export default async function CreateChallengePage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // Get subjects + schools that have bank questions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
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

  // Build subject×school count matrix for dynamic count display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjectSchoolCounts: Record<string, Record<string, number>> = {}
  for (const row of rows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subjectId = (row.subject as any)?.id as string | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schoolId  = (row.school  as any)?.id as string | undefined
    if (!subjectId || !schoolId) continue
    if (!subjectSchoolCounts[subjectId]) subjectSchoolCounts[subjectId] = {}
    subjectSchoolCounts[subjectId][schoolId] = (subjectSchoolCounts[subjectId][schoolId] ?? 0) + 1
  }

  const subjects = Array.from(subjectMap.values())
    .filter((s) => s.count >= 10)
    .sort((a, b) => a.name.localeCompare(b.name))

  const schools = Array.from(schoolMap.values())
    .filter((s) => s.count >= 10)
    .sort((a, b) => a.name.localeCompare(b.name))

  return <NewChallengeClient subjects={subjects} schools={schools} subjectSchoolCounts={subjectSchoolCounts} />
}
