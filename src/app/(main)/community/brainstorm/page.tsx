import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  getLiveSession,
  getCurrentQuestion,
  getSessionLeaderboard,
  getUserAnswerForPushedQuestion,
} from "@/actions/brainstorm.actions"
import { BrainstormClient } from "./BrainstormClient"
import { Radio } from "lucide-react"

export const metadata = { title: "Brainstorm" }

export default async function BrainstormPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const liveSession = await getLiveSession()

  let currentQuestion = null
  let leaderboard: Awaited<ReturnType<typeof getSessionLeaderboard>> = []
  let myAnswer = null

  if (liveSession) {
    ;[currentQuestion, leaderboard] = await Promise.all([
      getCurrentQuestion(liveSession.id),
      getSessionLeaderboard(liveSession.id),
    ])
    if (currentQuestion) {
      myAnswer = await getUserAnswerForPushedQuestion(currentQuestion.id)
    }
  }

  return (
    <div className="min-h-full pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 px-5 py-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Live Brainstorm</h1>
            <p className="text-sm text-white/75">Real-time Q&A · Answer first, score big</p>
          </div>
        </div>
      </div>

      <BrainstormClient
        userId={user.id}
        initialSession={liveSession}
        initialQuestion={currentQuestion}
        initialLeaderboard={leaderboard}
        initialMyAnswer={myAnswer}
      />
    </div>
  )
}
