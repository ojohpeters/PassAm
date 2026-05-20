import { getAdminQuiz } from "@/actions/custom-quiz.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { QuizManagerClient } from "./QuizManagerClient"

interface Props { params: { id: string } }

export default async function AdminQuizPage({ params }: Props) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const result = await getAdminQuiz(params.id)
  if (!result.success) redirect("/admin/quizzes")

  const { quiz, items, attemptCount } = result.data

  const admin = createAdminClient()
  const [{ data: schools }, { data: subjects }] = await Promise.all([
    admin.from("schools").select("id, name, abbreviation").neq("abbreviation", "GENERAL").order("name"),
    admin.from("subjects").select("id, name").order("name"),
  ])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Link href="/admin/quizzes" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          ← Quizzes
        </Link>
      </div>
      <QuizManagerClient
        quiz={quiz}
        initialItems={items}
        attemptCount={attemptCount}
        schools={schools ?? []}
        subjects={subjects ?? []}
      />
    </div>
  )
}
