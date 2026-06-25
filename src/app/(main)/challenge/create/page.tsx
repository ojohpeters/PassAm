import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NewChallengeClient } from "./NewChallengeClient"

export default async function CreateChallengePage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // Get subjects with available bank questions
  const { data: rows } = await admin
    .from("questions")
    .select("subject_id, subject:subjects(id, name)")
    .eq("is_bank_question", true)

  const subjectMap = new Map<string, { id: string; name: string; count: number }>()
  for (const row of rows ?? []) {
    const s = row.subject as { id: string; name: string } | null
    if (s?.id) {
      const existing = subjectMap.get(s.id)
      if (existing) existing.count++
      else subjectMap.set(s.id, { id: s.id, name: s.name, count: 1 })
    }
  }

  const subjects = Array.from(subjectMap.values())
    .filter((s) => s.count >= 10)
    .sort((a, b) => a.name.localeCompare(b.name))

  return <NewChallengeClient subjects={subjects} />
}
