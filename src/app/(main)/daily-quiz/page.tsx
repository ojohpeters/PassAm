import { getDailyQuiz } from "@/actions/quiz.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DailyQuizShell } from "@/components/quiz/DailyQuizShell"
import Link from "next/link"

export default async function DailyQuizPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const result = await getDailyQuiz()
  if (!result.success) redirect("/dashboard")

  const quiz = result.data

  if (quiz.completed_at) {
    return (
      <div className="mx-auto max-w-md space-y-3 p-6 text-center">
        <p className="text-5xl">✅</p>
        <h1 className="text-xl font-bold">Today&apos;s quiz complete!</h1>
        <p className="text-muted-foreground">
          You scored <strong>{quiz.score}</strong> out of{" "}
          <strong>{quiz.questions.length}</strong>
        </p>
        <p className="text-sm text-muted-foreground">New quiz available tomorrow at midnight WAT.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return <DailyQuizShell quiz={quiz as any} />
}
