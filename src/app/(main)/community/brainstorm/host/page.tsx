import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  isBrainstormHost,
  getOrCreateTodayHostSession,
  getCurrentQuestion,
  getBrainstormSubjects,
  getSessionLeaderboard,
  getQuestionAnswers,
} from "@/actions/brainstorm.actions"
import { HostPanel } from "./HostPanel"

export const metadata = { title: "Brainstorm Host Panel" }

export default async function BrainstormHostPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const isHost = await isBrainstormHost()
  if (!isHost) redirect("/community/brainstorm")

  const sessionRes = await getOrCreateTodayHostSession()
  if (!sessionRes.success) redirect("/community/brainstorm")

  const session = sessionRes.data
  const [currentQuestion, subjects, leaderboard] = await Promise.all([
    getCurrentQuestion(session.id),
    getBrainstormSubjects(),
    getSessionLeaderboard(session.id),
  ])

  const initialAnswers = currentQuestion
    ? await getQuestionAnswers(currentQuestion.id)
    : []

  return (
    <HostPanel
      session={session}
      initialQuestion={currentQuestion}
      subjects={subjects}
      initialLeaderboard={leaderboard}
      initialAnswers={initialAnswers}
      userId={user.id}
    />
  )
}
