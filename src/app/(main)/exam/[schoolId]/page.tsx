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

  // Only show subjects that actually have questions for this school
  const { data: rows } = await admin
    .from("questions")
    .select("subject_id, subject:subjects(id, name)")
    .eq("school_id", school.id)

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

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const { count: usedThisMonth } = await admin
    .from("exam_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString())

  const isPro = user.subscriptionStatus !== "FREE"
  const quotaLeft = isPro ? null : Math.max(0, 3 - (usedThisMonth ?? 0))
  const canStart = isPro || (quotaLeft ?? 0) > 0

  return (
    <SubjectPicker
      school={school}
      schoolSlug={params.schoolId}
      subjects={availableSubjects}
      subjectCounts={subjectCounts}
      quotaLeft={quotaLeft}
      canStart={canStart}
    />
  )
}
