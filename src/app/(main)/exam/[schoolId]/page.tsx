import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StartExamButton } from "./StartExamButton"

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

  const { count: questionCount } = await admin
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("school_id", school.id)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: usedThisMonth } = await admin
    .from("exam_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString())

  const quotaLeft = Math.max(0, 3 - (usedThisMonth ?? 0))
  const canStart = quotaLeft > 0

  return (
    <div className="mx-auto max-w-md space-y-6 p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">{school.name}</h1>
        <p className="text-muted-foreground">Post-UTME Practice Exam</p>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-xl border p-4 text-sm">
        <div>
          <p className="text-lg font-bold">40</p>
          <p className="text-muted-foreground">Questions</p>
        </div>
        <div>
          <p className="text-lg font-bold">60</p>
          <p className="text-muted-foreground">Minutes</p>
        </div>
        <div>
          <p className="text-lg font-bold">{questionCount ?? 0}</p>
          <p className="text-muted-foreground">In bank</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {canStart
          ? `${quotaLeft} of 3 exams remaining this month`
          : "You've used all 3 exams this month. Come back next month!"}
      </p>

      <StartExamButton schoolId={school.id} schoolSlug={params.schoolId} disabled={!canStart} />
    </div>
  )
}
