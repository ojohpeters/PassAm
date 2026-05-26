import { getUserQuestions, getGroqApiKey } from "@/actions/user-questions.actions"
import type { UserQuestion } from "@/actions/user-questions.actions"
import { MyQuestionsClient } from "./MyQuestionsClient"

export default async function MyQuestionsPage() {
  const [questionsResult, apiKey] = await Promise.all([
    getUserQuestions(),
    getGroqApiKey(),
  ])

  const questions: UserQuestion[] = questionsResult.success ? questionsResult.data : []

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-background p-5 space-y-1">
        <h1 className="text-xl font-black tracking-tight">My Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Build your personal bank, upload via CSV, or let PrepAI generate questions for you.
        </p>
      </div>

      <MyQuestionsClient initialQuestions={questions} initialApiKey={apiKey} />
    </div>
  )
}
