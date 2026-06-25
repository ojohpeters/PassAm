import { getChallengePlay, getChallenge } from "@/actions/challenge.actions"
import { notFound, redirect } from "next/navigation"
import { ChallengeShell } from "./ChallengeShell"

export default async function ChallengePlayPage({
  params,
  searchParams,
}: {
  params: { code: string }
  searchParams: { p?: string }
}) {
  const participantId = searchParams.p
  if (!participantId) redirect(`/challenge/${params.code}`)

  const [playResult, challengeResult] = await Promise.all([
    getChallengePlay(params.code, participantId),
    getChallenge(params.code),
  ])

  if (!playResult.success) {
    if (playResult.error === "ALREADY_SUBMITTED") {
      redirect(`/challenge/${params.code}/results?p=${participantId}`)
    }
    notFound()
  }

  const opponent = challengeResult.success
    ? challengeResult.data.participants.find((p) => p.id !== participantId)
    : undefined

  return (
    <ChallengeShell
      code={params.code.toUpperCase()}
      participantId={participantId}
      questions={playResult.data.questions}
      timeLimitSecs={playResult.data.timeLimitSecs}
      subjectName={playResult.data.subjectName}
      opponentName={opponent?.display_name}
    />
  )
}
