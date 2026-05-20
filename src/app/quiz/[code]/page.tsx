import { getPublicQuiz } from "@/actions/custom-quiz.actions"
import { getAppUser } from "@/lib/auth"
import { notFound } from "next/navigation"
import { QuizClient } from "./QuizClient"
import Link from "next/link"
import { Trophy } from "lucide-react"

interface Props { params: { code: string } }

export default async function QuizLandingPage({ params }: Props) {
  const result = await getPublicQuiz(params.code)

  if (!result.success) notFound()

  const { id, title, description, code, items } = result.data

  // Pre-fill name for authenticated users
  let prefillName = ""
  try {
    const user = await getAppUser()
    if (user) prefillName = user.name || user.email.split("@")[0] || ""
  } catch {
    // not authed
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-background p-6 space-y-3">
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{items.length} question{items.length !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>Self-paced, no timer</span>
          <span>·</span>
          <Link href={`/quiz/${code}/leaderboard`} className="flex items-center gap-1 text-primary font-semibold hover:underline">
            <Trophy className="h-3.5 w-3.5" /> Leaderboard
          </Link>
        </div>
      </div>

      <QuizClient
        quizId={id}
        code={code}
        items={items}
        prefillName={prefillName}
      />
    </div>
  )
}
