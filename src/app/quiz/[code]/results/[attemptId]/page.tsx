import { getQuizAttemptResults } from "@/actions/custom-quiz.actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { RichText } from "@/lib/question-format"

interface Props { params: { code: string; attemptId: string } }

const OPTION_LABELS = ["A", "B", "C", "D"] as const
const OPTION_KEYS = ["opt_a", "opt_b", "opt_c", "opt_d"] as const

export default async function QuizResultsPage({ params }: Props) {
  const result = await getQuizAttemptResults(params.attemptId)
  if (!result.success) notFound()

  const { displayName, score, total, quizTitle, quizCode, items } = result.data
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-background p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Results for {displayName}</p>
        <h1 className="text-xl font-black leading-tight">{quizTitle}</h1>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <p className="text-2xl font-black text-primary">{pct}%</p>
          </div>
          <div>
            <p className="text-2xl font-black">{score} / {total}</p>
            <p className="text-sm text-muted-foreground">correct answers</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/quiz/${quizCode}/leaderboard`}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </Link>
          <Link
            href={`/quiz/${quizCode}`}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-muted"
          >
            Retake Quiz
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Review</p>
        {(items as { id: string; order_index: number; q_text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; correct: string; explanation: string | null; subject_label: string | null; selected: string | null; isCorrect: boolean }[]).map((item, idx) => (
          <div key={item.id} className={cn(
            "rounded-2xl border p-4 space-y-3",
            item.isCorrect ? "border-emerald-200 dark:border-emerald-800/40" : "border-rose-200 dark:border-rose-800/40"
          )}>
            <div className="flex items-start gap-2">
              {item.isCorrect
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                : <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              }
              <div className="flex-1">
                {item.subject_label && (
                  <span className="mb-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{item.subject_label}</span>
                )}
                <p className="text-sm font-semibold leading-snug">
                  {idx + 1}. <RichText text={item.q_text} />
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {OPTION_LABELS.map((letter, i) => {
                const text = (item as Record<string, unknown>)[OPTION_KEYS[i]] as string
                const isCorrect = item.correct === letter
                const isSelected = item.selected === letter
                const isWrong = isSelected && !isCorrect

                return (
                  <div key={letter} className={cn(
                    "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm",
                    isCorrect && "bg-emerald-50 dark:bg-emerald-950/30",
                    isWrong && "bg-rose-50 dark:bg-rose-950/30",
                  )}>
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                      isCorrect ? "bg-emerald-500 text-white" :
                      isWrong ? "bg-rose-500 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {letter}
                    </span>
                    <RichText
                      text={text}
                      kind="option"
                      className={cn(
                        "flex-1 leading-snug",
                        isCorrect ? "font-semibold text-emerald-800 dark:text-emerald-300" :
                        isWrong ? "text-rose-700 dark:text-rose-400" :
                        "text-muted-foreground"
                      )}
                    />
                    {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                    {isWrong && <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />}
                  </div>
                )
              })}
            </div>

            {item.explanation && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                <RichText text={item.explanation} kind="explanation" />
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
