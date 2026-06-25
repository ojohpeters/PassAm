"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { joinChallenge } from "@/actions/challenge.actions"
import type { ChallengeData } from "@/actions/challenge.actions"
import { toast } from "sonner"
import { Swords, Clock, BookOpen, CheckCircle2, Loader2, Share2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60)
  return `${m} min`
}

function fmtScore(score: number | null, total: number) {
  if (score === null) return "—"
  return `${score}/${total} (${Math.round((score / total) * 100)}%)`
}

type Props = {
  code: string
  challenge: ChallengeData
  currentUserId: string | null
}

export function ChallengeAccept({ code, challenge, currentUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const creator = challenge.participants.find((p) => p.is_creator)
  const challenger = challenge.participants.find((p) => !p.is_creator)
  const isExpired = new Date(challenge.expires_at) < new Date()
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  // Check localStorage for existing participantId
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`challenge_${code}_pid`)
      if (stored) setMyParticipantId(stored)
    } catch {}
  }, [code])

  // If logged-in user already has a participant slot
  const mySlot = currentUserId
    ? challenge.participants.find((p) => p.id === myParticipantId)
    : challenge.participants.find((p) => p.id === myParticipantId)

  async function handleJoin() {
    if (!currentUserId && !guestName.trim()) {
      toast.error("Enter your name to join")
      return
    }
    setLoading(true)
    const result = await joinChallenge(code, currentUserId ? undefined : guestName.trim())
    if (!result.success) {
      const msg =
        result.error === "CHALLENGE_FULL" ? "This challenge already has an opponent."
        : result.error === "EXPIRED" ? "This challenge has expired."
        : "Could not join — please try again."
      toast.error(msg)
      setLoading(false)
      return
    }
    const pid = result.data.participantId
    try { localStorage.setItem(`challenge_${code}_pid`, pid) } catch {}
    router.push(`/challenge/${code}/play?p=${pid}`)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "PrepIQ 1v1 Challenge", text: `I'm challenging you on ${challenge.subject_name}! Can you beat me?`, url: shareUrl })
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    }
  }

  const isMyTurn = myParticipantId && !mySlot?.completed_at
  const iDone = myParticipantId && mySlot?.completed_at
  const canJoin = !myParticipantId && !challenger && !isExpired
  const challengerIsSomeoneElse = challenger && challenger.id !== myParticipantId

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-8 text-white">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            <Swords className="h-3.5 w-3.5" />
            1v1 Challenge
          </div>
          <h1 className="text-2xl font-black tracking-tight">{challenge.subject_name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <BookOpen className="mr-1 inline h-3 w-3" />{challenge.num_questions} questions
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <Clock className="mr-1 inline h-3 w-3" />{fmtTime(challenge.time_limit_secs)}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase">
              Code: {code}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-6">

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-background px-4 py-3 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4" />
          {copied ? "Link copied!" : "Share challenge link"}
        </button>

        {/* Players */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Players</p>

          {/* Creator */}
          <div className={cn(
            "flex items-center gap-3 rounded-xl p-3",
            creator?.completed_at ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/50"
          )}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <User className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{creator?.display_name ?? "—"} <span className="text-xs font-normal text-amber-600">(creator)</span></p>
              <p className="text-xs text-muted-foreground">
                {creator?.completed_at
                  ? `Score: ${fmtScore(creator.score, challenge.num_questions)}`
                  : creator?.started_at ? "In progress…" : "Not started yet"}
              </p>
            </div>
            {creator?.completed_at && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />}
          </div>

          {/* Challenger */}
          <div className={cn(
            "flex items-center gap-3 rounded-xl p-3",
            challenger?.completed_at ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/30"
          )}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Swords className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              {challenger ? (
                <>
                  <p className="text-sm font-bold truncate">{challenger.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {challenger.completed_at
                      ? `Score: ${fmtScore(challenger.score, challenge.num_questions)}`
                      : challenger.started_at ? "In progress…" : "Accepted, not started"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Waiting for opponent…</p>
              )}
            </div>
            {challenger?.completed_at && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />}
          </div>
        </div>

        {/* Expired notice */}
        {isExpired && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            This challenge has expired.
          </div>
        )}

        {/* CTA */}
        {isMyTurn && (
          <Link
            href={`/challenge/${code}/play?p=${myParticipantId}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Swords className="h-5 w-5" />
            Continue Playing
          </Link>
        )}

        {iDone && (
          <Link
            href={`/challenge/${code}/results`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-base font-black text-white shadow-lg shadow-green-600/30 transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-5 w-5" />
            View Results
          </Link>
        )}

        {canJoin && (
          <div className="space-y-3">
            {!currentUserId && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Your name (guest)</p>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Emeka"
                  maxLength={30}
                  className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-xs text-muted-foreground">
                  <Link href="/login" className="text-primary underline underline-offset-2">Log in</Link> to save your score to your profile.
                </p>
              </div>
            )}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Swords className="h-5 w-5" />}
              Accept Challenge
            </button>
          </div>
        )}

        {challengerIsSomeoneElse && !myParticipantId && (
          <div className="rounded-2xl border bg-muted/50 px-4 py-4 text-center text-sm text-muted-foreground">
            This challenge already has an opponent. Share your own challenge link to compete!
          </div>
        )}

        {/* Results link once both done */}
        {challenge.status === "completed" && (
          <Link
            href={`/challenge/${code}/results`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/10"
          >
            See final results →
          </Link>
        )}

      </div>
    </div>
  )
}
