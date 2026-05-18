import { getAttemptResult } from "@/actions/exam.actions"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AnswerReviewList } from "@/components/results/AnswerReviewList"

export default async function ResultsPage({
  params,
}: {
  params: { attemptId: string }
}) {
  const result = await getAttemptResult(params.attemptId)
  if (!result.success) redirect("/dashboard")

  const { score, totalQuestions, school, answers } = result.data
  const pct = Math.round((score / totalQuestions) * 100)
  const passed = pct >= 50

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="rounded-xl border p-6 text-center">
        <p className="text-sm text-muted-foreground">{school.name} Post-UTME</p>
        <div className={cn("my-4 text-6xl font-black", passed ? "text-green-600" : "text-red-500")}>
          {pct}%
        </div>
        <p className="text-muted-foreground">
          {score} correct out of {totalQuestions}
        </p>
        <p className={cn("mt-2 text-sm font-medium", passed ? "text-green-600" : "text-red-500")}>
          {passed ? "Well done! You passed." : "Keep practising — you'll get there."}
        </p>
      </div>

      <AnswerReviewList answers={answers} />

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Dashboard
        </Link>
        <Link
          href={`/exam/${school.abbreviation.toLowerCase()}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}
