import { getUserQuestions } from "@/actions/user-questions.actions"
import type { UserQuestion } from "@/actions/user-questions.actions"
import { MyQuestionsClient } from "./MyQuestionsClient"

export default async function MyQuestionsPage() {
  const questionsResult = await getUserQuestions()
  const questions: UserQuestion[] = questionsResult.success ? questionsResult.data : []

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="rounded-2xl border bg-background p-5 space-y-1">
        <h1 className="text-xl font-black tracking-tight">My Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Build your personal bank, upload via CSV, or let PrepAI generate questions for you.
        </p>
      </div>
      <MyQuestionsClient initialQuestions={questions} />
    </div>
  )
}
