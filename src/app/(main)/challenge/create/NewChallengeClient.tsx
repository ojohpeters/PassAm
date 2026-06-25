"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createChallenge } from "@/actions/challenge.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Swords, Clock, BookOpen, Loader2, Copy, Check } from "lucide-react"

type Subject = { id: string; name: string; count: number }

const TIME_OPTIONS = [
  { label: "5 min", secs: 300 },
  { label: "10 min", secs: 600 },
  { label: "15 min", secs: 900 },
  { label: "20 min", secs: 1200 },
  { label: "30 min", secs: 1800 },
]
const Q_OPTIONS = [10, 20, 30, 40]

export function NewChallengeClient({ subjects }: { subjects: Subject[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.id ?? "")
  const [numQuestions, setNumQuestions] = useState(20)
  const [timeLimitSecs, setTimeLimitSecs] = useState(1200)
  const [created, setCreated] = useState<{ code: string; participantId: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "")
  const shareUrl = created ? `${appUrl}/challenge/${created.code}` : ""

  async function handleCreate() {
    if (!selectedSubject) { toast.error("Select a subject"); return }
    setLoading(true)
    const result = await createChallenge(selectedSubject, numQuestions, timeLimitSecs)
    setLoading(false)
    if (!result.success) {
      const msg = result.error === "INSUFFICIENT_QUESTIONS"
        ? "Not enough questions for this subject yet."
        : "Failed to create challenge — try again."
      toast.error(msg)
      return
    }
    try { localStorage.setItem(`challenge_${result.data.code}_pid`, result.data.participantId) } catch {}
    setCreated(result.data)
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "PrepIQ 1v1 Challenge",
        text: `I'm challenging you! Can you beat my score on ${subjects.find(s => s.id === selectedSubject)?.name}?`,
        url: shareUrl,
      })
    } else {
      handleCopy()
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white text-center space-y-2">
          <Swords className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="text-2xl font-black">Challenge created!</h2>
          <p className="text-sm text-white/80">Share the link below to challenge a friend.</p>
        </div>

        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Challenge link</p>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2.5">
            <span className="flex-1 truncate text-sm font-mono text-foreground">{shareUrl}</span>
            <button onClick={handleCopy} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Code: <span className="font-black text-foreground tracking-widest">{created.code}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-2xl border bg-background py-3 text-sm font-bold hover:bg-muted"
          >
            Share challenge
          </button>
          <button
            onClick={() => router.push(`/challenge/${created.code}/play?p=${created.participantId}`)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90"
          >
            <Swords className="h-5 w-5" />
            Start playing now
          </button>
          <button
            onClick={() => setCreated(null)}
            className="text-center text-xs text-muted-foreground underline underline-offset-2"
          >
            Create another challenge
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-8 text-white">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            <Swords className="h-3.5 w-3.5" />
            1v1 Challenge
          </div>
          <h1 className="text-2xl font-black tracking-tight">Challenge a Friend</h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Pick a subject and set the rules. Share a link — your opponent can play at any time, even without an account.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-6">

        {/* Subject */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                  selectedSubject === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <p className={cn("text-sm font-bold", selectedSubject === s.id ? "text-primary" : "text-foreground")}>
                  {s.name}
                </p>
                <p className="text-xs text-muted-foreground">{s.count} questions</p>
              </button>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Questions</p>
          <div className="grid grid-cols-4 gap-2">
            {Q_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                className={cn(
                  "rounded-xl border-2 py-2.5 text-sm font-black transition-all",
                  numQuestions === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/30"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time Limit</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.secs}
                onClick={() => setTimeLimitSecs(t.secs)}
                className={cn(
                  "rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all",
                  timeLimitSecs === t.secs ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/30"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !selectedSubject}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-black transition-all",
            !loading && selectedSubject
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Swords className="h-5 w-5" />}
          {loading ? "Creating…" : "Create Challenge"}
        </button>
      </div>
    </div>
  )
}
