import { getAttemptResult } from "@/actions/exam.actions"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { InlineText } from "@/lib/parseInline"

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

      <div className="space-y-4">
        <h2 className="font-semibold">Question Review</h2>
        {answers.map((a, i) => {
          const correctOpt = a.question.options.find((o: { isCorrect: boolean }) => o.isCorrect)
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-lg border p-4",
                a.isCorrect ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"
              )}
            >
              <p className="text-sm font-medium">
                Q{i + 1}. <InlineText text={a.question.text} />
              </p>
              <div className="mt-2 space-y-1 text-sm">
                {a.question.options.map((opt: { id: string; label: string; text: string; isCorrect: boolean }) => {
                  const isUserAnswer = a.selectedOptionId === opt.id
                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        "flex items-center gap-2",
                        opt.isCorrect && "font-semibold text-green-700",
                        isUserAnswer && !opt.isCorrect && "text-red-600 line-through"
                      )}
                    >
                      <span className="font-mono">{opt.label}.</span>
                      <span><InlineText text={opt.text} /></span>
                      {opt.isCorrect && (
                        <span className="ml-auto text-xs font-normal text-green-600">✓ Correct</span>
                      )}
                      {isUserAnswer && !opt.isCorrect && (
                        <span className="ml-auto text-xs font-normal text-red-500">Your answer</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {!a.selectedOptionId && (
                <p className="mt-2 text-xs text-muted-foreground">Skipped</p>
              )}
              {a.question.explanation && (
                <p className="mt-3 rounded-md bg-white/60 p-2 text-xs text-muted-foreground">
                  💡 <InlineText text={a.question.explanation} />
                </p>
              )}
            </div>
          )
        })}
      </div>

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
