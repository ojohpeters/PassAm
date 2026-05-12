import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ExamConfigForm } from "./ExamConfigForm"
import { NewSchoolForm } from "./NewSchoolForm"
import { Settings2 } from "lucide-react"

export const metadata = { title: "Exam Config — Admin" }

export default async function AdminSchoolsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/login")

  const admin = createAdminClient()

  const [{ data: schools }, { data: subjects }, { data: configs }] = await Promise.all([
    admin.from("schools").select("id, name, abbreviation").order("name"),
    admin.from("subjects").select("id, name").order("name"),
    admin.from("school_exam_config").select("school_id, total_questions, subject_question_counts, duration_mins, required_subject_ids"),
  ])

  // Count questions per school per subject
  const { data: qCounts } = await admin
    .from("questions")
    .select("school_id, subject_id")

  const countMap: Record<string, Record<string, number>> = {}
  for (const q of qCounts ?? []) {
    if (!countMap[q.school_id]) countMap[q.school_id] = {}
    countMap[q.school_id][q.subject_id] = (countMap[q.school_id][q.subject_id] ?? 0) + 1
  }

  const configMap = new Map((configs ?? []).map((c) => [c.school_id, c]))

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-12 md:p-6">

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black">Exam Config</h1>
          <p className="text-xs text-muted-foreground">Set question counts per school and subject</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-amber-50/50 border-amber-200/60 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-300">
        <strong>Note:</strong> If no config is set for a school, the exam defaults to 40 total questions split evenly across selected subjects. Per-subject overrides take precedence over even splits.
      </div>

      <NewSchoolForm />

      <div className="space-y-3">
        {(schools ?? []).map((school) => {
          const cfg = configMap.get(school.id)
          const schoolSubjectCounts = countMap[school.id] ?? {}

          const subjectsWithCounts = (subjects ?? [])
            .map((s) => ({
              id: s.id,
              name: s.name,
              questionCount: schoolSubjectCounts[s.id] ?? 0,
            }))
            .filter((s) => s.questionCount > 0)

          return (
            <ExamConfigForm
              key={school.id}
              schoolId={school.id}
              schoolName={school.name}
              abbreviation={school.abbreviation}
              totalQuestions={cfg?.total_questions ?? 40}
              durationMins={cfg?.duration_mins ?? 60}
              requiredSubjectIds={(cfg?.required_subject_ids as string[]) ?? []}
              subjects={subjectsWithCounts}
              configuredSubjectCounts={(cfg?.subject_question_counts as Record<string, number>) ?? {}}
            />
          )
        })}
      </div>
    </div>
  )
}
