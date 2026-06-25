import { getChallenge } from "@/actions/challenge.actions"
import { getAppUser } from "@/lib/auth"
import { notFound } from "next/navigation"
import { ChallengeAccept } from "./ChallengeAccept"

export default async function ChallengePage({ params }: { params: { code: string } }) {
  const [result, user] = await Promise.all([
    getChallenge(params.code.toUpperCase()),
    getAppUser().catch(() => null),
  ])

  if (!result.success) notFound()

  return (
    <ChallengeAccept
      code={result.data.code}
      challenge={result.data}
      currentUserId={user?.id ?? null}
    />
  )
}
